// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CovenantAttester} from "../src/CovenantAttester.sol";
import {IAttestationRegistry, Attestation} from "../src/interfaces/IAttestationRegistry.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";
import {CountryRestriction} from "../src/modules/CountryRestriction.sol";
import {RWAToken} from "../src/RWAToken.sol";

/// @notice Unit tests for the bundled EAS-compatible attester.
contract CovenantAttesterTest is Test {
    CovenantAttester attester;

    address issuer = makeAddr("issuer");
    address kycProvider = makeAddr("kycProvider");
    address alice = makeAddr("alice");
    address outsider = makeAddr("outsider");

    bytes32 constant SCHEMA = keccak256("covenant.kyc.v1");

    function setUp() public {
        attester = new CovenantAttester(issuer);
    }

    // NOTE: encode inline (no external call) so a single vm.prank is not consumed by
    // argument evaluation before the attest() call it is meant to apply to.
    function _kyc(bytes2 country, bool accredited) internal pure returns (bytes memory) {
        return abi.encode(uint8(2), country, accredited, uint8(1), uint64(0));
    }

    function test_ownerIsDefaultAttester() public view {
        assertTrue(attester.isAttester(issuer));
    }

    function test_attest_createsValidAttestation() public {
        vm.prank(issuer);
        bytes32 uid = attester.attest(SCHEMA, alice, 0, true, bytes32(0), _kyc("US", true));

        assertTrue(attester.isAttestationValid(uid));
        Attestation memory att = attester.getAttestation(uid);
        assertEq(att.recipient, alice);
        assertEq(att.attester, issuer);
        assertEq(att.schema, SCHEMA);
        assertEq(att.revocationTime, 0);
    }

    function test_attest_unauthorizedReverts() public {
        vm.prank(outsider);
        vm.expectRevert(abi.encodeWithSelector(CovenantAttester.NotAuthorizedAttester.selector, outsider));
        attester.attest(SCHEMA, alice, 0, true, bytes32(0), _kyc("US", true));
    }

    function test_attest_zeroRecipientReverts() public {
        vm.prank(issuer);
        vm.expectRevert(CovenantAttester.ZeroRecipient.selector);
        attester.attest(SCHEMA, address(0), 0, true, bytes32(0), _kyc("US", true));
    }

    function test_authorizeAttester_canIssue() public {
        vm.prank(issuer);
        attester.authorizeAttester(kycProvider);
        assertTrue(attester.isAttester(kycProvider));

        vm.prank(kycProvider);
        bytes32 uid = attester.attest(SCHEMA, alice, 0, true, bytes32(0), _kyc("US", true));
        assertEq(attester.getAttestation(uid).attester, kycProvider);
    }

    function test_authorizeAttester_onlyOwner() public {
        vm.prank(outsider);
        vm.expectRevert();
        attester.authorizeAttester(kycProvider);
    }

    function test_revoke_invalidatesAttestation() public {
        vm.startPrank(issuer);
        bytes32 uid = attester.attest(SCHEMA, alice, 0, true, bytes32(0), _kyc("US", true));
        assertTrue(attester.isAttestationValid(uid));
        attester.revoke(uid);
        vm.stopPrank();

        assertFalse(attester.isAttestationValid(uid));
        assertGt(attester.getAttestation(uid).revocationTime, 0);
    }

    function test_revoke_onlyOriginalAttester() public {
        vm.prank(issuer);
        bytes32 uid = attester.attest(SCHEMA, alice, 0, true, bytes32(0), _kyc("US", true));

        vm.prank(issuer);
        attester.authorizeAttester(kycProvider);
        vm.prank(kycProvider);
        vm.expectRevert(abi.encodeWithSelector(CovenantAttester.NotOriginalAttester.selector, uid));
        attester.revoke(uid);
    }

    function test_revoke_nonRevocableReverts() public {
        vm.startPrank(issuer);
        bytes32 uid = attester.attest(SCHEMA, alice, 0, false, bytes32(0), _kyc("US", true));
        vm.expectRevert(abi.encodeWithSelector(CovenantAttester.NotRevocable.selector, uid));
        attester.revoke(uid);
        vm.stopPrank();
    }

    function test_revoke_twiceReverts() public {
        vm.startPrank(issuer);
        bytes32 uid = attester.attest(SCHEMA, alice, 0, true, bytes32(0), _kyc("US", true));
        attester.revoke(uid);
        vm.expectRevert(abi.encodeWithSelector(CovenantAttester.AlreadyRevoked.selector, uid));
        attester.revoke(uid);
        vm.stopPrank();
    }

    function test_expiredAttestation_isInvalid() public {
        vm.prank(issuer);
        bytes32 uid =
            attester.attest(SCHEMA, alice, uint64(block.timestamp + 1 hours), true, bytes32(0), _kyc("US", true));
        assertTrue(attester.isAttestationValid(uid));

        vm.warp(block.timestamp + 2 hours);
        assertFalse(attester.isAttestationValid(uid));
    }

    function test_unknownUid_isInvalid() public view {
        assertFalse(attester.isAttestationValid(keccak256("nope")));
    }
}

/// @notice Full compliance stack running against the REAL CovenantAttester (not a mock).
///         This is the exact wiring deployed to Robinhood Chain: a tokenized-stock token
///         whose transfers are gated by on-chain KYC attestations.
contract CovenantAttesterIntegrationTest is Test {
    CovenantAttester attester;
    ComplianceEngine engine;
    CountryRestriction country;
    RWAToken token;

    address issuer = makeAddr("issuer");
    address alice = makeAddr("alice"); // US, attested
    address bob = makeAddr("bob"); // US, attested
    address carol = makeAddr("carol"); // initially unattested
    address mallory = makeAddr("mallory"); // sanctioned jurisdiction

    bytes32 constant SCHEMA = keccak256("covenant.kyc.v1");

    function setUp() public {
        vm.startPrank(issuer);
        attester = new CovenantAttester(issuer);
        engine = new ComplianceEngine(address(attester), issuer);

        country = new CountryRestriction(issuer, false); // recipient-only check
        country.blockCountry(bytes2("KP")); // North Korea
        engine.addModule(country);

        token = new RWAToken("Tokenized TSLA", "tTSLA", address(engine), issuer);

        // Attest alice + bob (US), map their UIDs
        bytes32 aliceUID = attester.attest(SCHEMA, alice, 0, true, bytes32(0), attester.encodeKycData(2, "US", true, 1, 0));
        bytes32 bobUID = attester.attest(SCHEMA, bob, 0, true, bytes32(0), attester.encodeKycData(2, "US", true, 1, 0));
        engine.setAttestationUID(alice, aliceUID);
        engine.setAttestationUID(bob, bobUID);

        token.mint(alice, 100 ether);
        vm.stopPrank();
    }

    function test_compliantTransfer_succeeds() public {
        vm.prank(alice);
        token.transfer(bob, 10 ether);
        assertEq(token.balanceOf(bob), 10 ether);
    }

    function test_transferToUnattested_reverts_thenSucceedsAfterAttestation() public {
        // carol has no attestation yet -> blocked
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(carol, 10 ether);

        // issuer attests carol (US) and maps the UID
        vm.startPrank(issuer);
        bytes32 carolUID = attester.attest(SCHEMA, carol, 0, true, bytes32(0), attester.encodeKycData(2, "US", true, 1, 0));
        engine.setAttestationUID(carol, carolUID);
        vm.stopPrank();

        // now the same transfer succeeds
        vm.prank(alice);
        token.transfer(carol, 10 ether);
        assertEq(token.balanceOf(carol), 10 ether);
    }

    function test_transferToSanctionedCountry_reverts() public {
        vm.startPrank(issuer);
        bytes32 malloryUID =
            attester.attest(SCHEMA, mallory, 0, true, bytes32(0), attester.encodeKycData(2, "KP", true, 1, 0));
        engine.setAttestationUID(mallory, malloryUID);
        vm.stopPrank();

        // mallory IS attested but in a blocked jurisdiction -> still reverts
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(mallory, 10 ether);
    }

    function test_revokedAttestation_blocksFurtherTransfers() public {
        // Give bob a fresh transfer first to confirm baseline works
        vm.prank(alice);
        token.transfer(bob, 10 ether);

        // Revoke bob's attestation; subsequent inbound transfers must fail
        bytes32 bobUID = engine.attestationUIDs(bob);
        vm.prank(issuer);
        attester.revoke(bobUID);

        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 10 ether);
    }
}

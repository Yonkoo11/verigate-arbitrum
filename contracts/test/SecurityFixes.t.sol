// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CovenantAttester} from "../src/CovenantAttester.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {CountryRestriction} from "../src/modules/CountryRestriction.sol";
import {AccreditedInvestor} from "../src/modules/AccreditedInvestor.sol";
import {MaxHolders} from "../src/modules/MaxHolders.sol";
import {IAttestationRegistry} from "../src/interfaces/IAttestationRegistry.sol";
import {MockAttestationRegistry} from "./mocks/MockAttestationRegistry.sol";

/// @notice Regression tests for the audit findings (security-fixes pass).
contract SecurityFixesTest is Test {
    bytes32 constant SCHEMA = keccak256("covenant.kyc.v1");
    address issuer = makeAddr("issuer");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function _reg() internal returns (MockAttestationRegistry) {
        return new MockAttestationRegistry();
    }

    // Finding 2 — an attestation issued about a DIFFERENT wallet must not gate this one.
    function test_F2_recipientMismatchRejected() public {
        MockAttestationRegistry reg = _reg();
        CountryRestriction c = new CountryRestriction(issuer, false);
        vm.prank(issuer);
        c.blockCountry(bytes2("KP"));
        bytes memory data = reg.encodeComplianceData(2, bytes2("US"), true, 1, 0);
        bytes32 uidAlice = reg.createAttestation(SCHEMA, alice, issuer, 0, true, data); // recipient = alice

        // Checking BOB against Alice's UID must fail (recipient mismatch), not pass.
        (bool ok,) = c.checkCompliance(alice, bob, 1, IAttestationRegistry(address(reg)), bytes32(0), uidAlice);
        assertFalse(ok, "foreign attestation must not satisfy compliance");

        // Sanity: the same UID DOES satisfy Alice herself.
        (bool ok2,) = c.checkCompliance(bob, alice, 1, IAttestationRegistry(address(reg)), bytes32(0), uidAlice);
        assertTrue(ok2, "matching recipient should pass");
    }

    // Finding 3 — malformed/short attestation data must reject gracefully, not revert the transfer.
    function test_F3_malformedDataDoesNotRevert() public {
        MockAttestationRegistry reg = _reg();
        AccreditedInvestor a = new AccreditedInvestor(false, true);
        bytes32 uid = reg.createAttestation(SCHEMA, bob, issuer, 0, true, hex"00"); // 1 byte, malformed
        (bool ok,) = a.checkCompliance(alice, bob, 1, IAttestationRegistry(address(reg)), bytes32(0), uid);
        assertFalse(ok, "malformed data must be rejected, not revert");
    }

    // Finding 4 — the schema-embedded KYC expiry must be enforced, not only registry expirationTime.
    function test_F4_schemaExpiryEnforced() public {
        MockAttestationRegistry reg = _reg();
        AccreditedInvestor a = new AccreditedInvestor(false, true);
        vm.warp(1000);
        // expirationTime = 0 (never) but schema expiry = 500 (already past)
        bytes memory data = reg.encodeComplianceData(2, bytes2("US"), true, 1, 500);
        bytes32 uid = reg.createAttestation(SCHEMA, bob, issuer, 0, true, data);
        (bool ok,) = a.checkCompliance(alice, bob, 1, IAttestationRegistry(address(reg)), bytes32(0), uid);
        assertFalse(ok, "stale schema-expiry KYC must be rejected");
    }

    // Finding 5 — the registry owner can revoke a (compromised) attester's attestation.
    function test_F5_ownerCanRevoke() public {
        CovenantAttester att = new CovenantAttester(issuer);
        address provider = makeAddr("provider");
        vm.prank(issuer);
        att.authorizeAttester(provider);
        vm.prank(provider);
        bytes32 uid = att.attest(
            SCHEMA, alice, 0, true, bytes32(0), abi.encode(uint8(2), bytes2("US"), true, uint8(1), uint64(0))
        );
        assertTrue(att.isAttestationValid(uid));
        vm.prank(issuer); // owner, not the original attester
        att.revoke(uid);
        assertFalse(att.isAttestationValid(uid), "owner must be able to revoke");
    }

    // Finding 1 — setMaxHoldersModule is single-set (prevents holder-count desync on swap).
    function test_F1_setMaxHoldersModuleSingleSet() public {
        vm.startPrank(issuer);
        MockAttestationRegistry reg = _reg();
        ComplianceEngine engine = new ComplianceEngine(address(reg), issuer);
        RWAToken token = new RWAToken("T", "T", address(engine), issuer);
        MaxHolders mh = new MaxHolders(2);
        mh.initialize(address(token));
        token.setMaxHoldersModule(address(mh));
        MaxHolders mh2 = new MaxHolders(3);
        vm.expectRevert(bytes("MaxHolders module already set"));
        token.setMaxHoldersModule(address(mh2));
        vm.stopPrank();
    }

    // Finding 1 — a zero-value transfer must not register a phantom (zero-balance) holder.
    function test_F1_zeroValueNoPhantomHolder() public {
        vm.startPrank(issuer);
        MockAttestationRegistry reg = _reg();
        ComplianceEngine engine = new ComplianceEngine(address(reg), issuer);
        MaxHolders mh = new MaxHolders(2);
        RWAToken token = new RWAToken("T", "T", address(engine), issuer);
        mh.initialize(address(token));
        engine.addModule(mh);
        token.setMaxHoldersModule(address(mh));
        token.mint(alice, 100 ether); // alice becomes the only holder
        vm.stopPrank();
        assertEq(mh.holderCount(), 1);

        // Alice sends 0 to a brand-new address — must NOT inflate the holder count.
        address fresh = makeAddr("fresh");
        vm.prank(alice);
        token.transfer(fresh, 0);
        assertEq(mh.holderCount(), 1, "zero-value transfer must not add a phantom holder");
        assertFalse(mh.isHolder(fresh), "fresh address must not be counted");

        // The cap still admits one genuine new holder.
        vm.prank(alice);
        token.transfer(bob, 10 ether);
        assertEq(mh.holderCount(), 2);
        assertTrue(mh.isHolder(bob));
    }
}

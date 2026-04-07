// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";
import {IComplianceModule} from "../src/interfaces/IComplianceModule.sol";
import {CountryRestriction} from "../src/modules/CountryRestriction.sol";
import {MaxHolders} from "../src/modules/MaxHolders.sol";
import {MockBAS} from "./mocks/MockBAS.sol";

contract RWATokenTest is Test {
    RWAToken token;
    ComplianceEngine engine;
    MockBAS bas;
    CountryRestriction countryModule;

    address issuer = address(0xA);
    address alice = address(0xB);
    address bob = address(0xC);
    address charlie = address(0xD);

    bytes32 schema = keccak256("RWACompliance");

    function setUp() public {
        bas = new MockBAS();
        vm.startPrank(issuer);
        engine = new ComplianceEngine(address(bas), issuer);
        token = new RWAToken("Test RWA Token", "tRWA", address(engine), issuer);

        // Set up CountryRestriction module
        countryModule = new CountryRestriction(issuer, false);
        countryModule.blockCountry(bytes2("KP")); // Block North Korea
        countryModule.blockCountry(bytes2("IR")); // Block Iran
        engine.addModule(IComplianceModule(address(countryModule)));
        vm.stopPrank();

        // Create attestations for alice (US, accredited) and bob (UK, not accredited)
        bytes memory aliceData = bas.encodeComplianceData(2, bytes2("US"), true, 1, 0);
        bytes32 aliceUID = bas.createAttestation(schema, alice, address(this), 0, true, aliceData);

        bytes memory bobData = bas.encodeComplianceData(1, bytes2("GB"), false, 0, 0);
        bytes32 bobUID = bas.createAttestation(schema, bob, address(this), 0, true, bobData);

        vm.startPrank(issuer);
        engine.setAttestationUID(alice, aliceUID);
        engine.setAttestationUID(bob, bobUID);

        // Mint tokens to alice
        token.mint(alice, 1000 ether);
        vm.stopPrank();
    }

    // --- Basic ERC-20 ---

    function test_name() public view {
        assertEq(token.name(), "Test RWA Token");
    }

    function test_symbol() public view {
        assertEq(token.symbol(), "tRWA");
    }

    function test_mint() public view {
        assertEq(token.balanceOf(alice), 1000 ether);
    }

    function test_mint_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        token.mint(alice, 100 ether);
    }

    // --- Compliant Transfers ---

    function test_transfer_compliant() public {
        vm.prank(alice);
        token.transfer(bob, 100 ether);
        assertEq(token.balanceOf(bob), 100 ether);
        assertEq(token.balanceOf(alice), 900 ether);
    }

    function test_transfer_blockedCountry() public {
        // Create attestation for charlie (North Korea)
        bytes memory charlieData = bas.encodeComplianceData(1, bytes2("KP"), false, 0, 0);
        bytes32 charlieUID = bas.createAttestation(schema, charlie, address(this), 0, true, charlieData);

        vm.prank(issuer);
        engine.setAttestationUID(charlie, charlieUID);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.TransferNotCompliant.selector, "CountryRestriction: recipient country is restricted"));
        token.transfer(charlie, 100 ether);
    }

    function test_transfer_noAttestation() public {
        // Charlie has no attestation
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.TransferNotCompliant.selector, "CountryRestriction: recipient has no attestation"));
        token.transfer(charlie, 100 ether);
    }

    function test_transfer_revokedAttestation() public {
        // Revoke bob's attestation
        bytes32 bobUID = engine.attestationUIDs(bob);
        bas.revokeAttestation(bobUID);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.TransferNotCompliant.selector, "CountryRestriction: recipient attestation invalid or revoked"));
        token.transfer(bob, 100 ether);
    }

    function test_transfer_expiredAttestation() public {
        // Create an attestation that expires in 1 hour
        bytes memory data = bas.encodeComplianceData(1, bytes2("GB"), false, 0, 0);
        bytes32 uid = bas.createAttestation(schema, charlie, address(this), uint64(block.timestamp + 1 hours), true, data);

        vm.prank(issuer);
        engine.setAttestationUID(charlie, uid);

        // Transfer works now
        vm.prank(alice);
        token.transfer(charlie, 50 ether);
        assertEq(token.balanceOf(charlie), 50 ether);

        // Warp past expiration
        vm.warp(block.timestamp + 2 hours);

        // Now mint some to charlie so they can try to transfer
        vm.prank(issuer);
        token.mint(alice, 50 ether);

        // Transfer fails after expiry
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.TransferNotCompliant.selector, "CountryRestriction: recipient attestation expired"));
        token.transfer(charlie, 10 ether);
    }

    // --- Freeze ---

    function test_freezeAddress() public {
        vm.prank(issuer);
        token.freezeAddress(alice);
        assertTrue(token.frozen(alice));

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.AddressIsFrozen.selector, alice));
        token.transfer(bob, 100 ether);
    }

    function test_unfreezeAddress() public {
        vm.startPrank(issuer);
        token.freezeAddress(alice);
        token.unfreezeAddress(alice);
        vm.stopPrank();

        assertFalse(token.frozen(alice));

        vm.prank(alice);
        token.transfer(bob, 100 ether);
        assertEq(token.balanceOf(bob), 100 ether);
    }

    function test_frozenRecipientBlocked() public {
        vm.prank(issuer);
        token.freezeAddress(bob);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.AddressIsFrozen.selector, bob));
        token.transfer(bob, 100 ether);
    }

    // --- Force Transfer ---

    function test_forceTransfer() public {
        vm.prank(issuer);
        token.forceTransfer(alice, bob, 100 ether, "Regulatory recovery");
        assertEq(token.balanceOf(bob), 100 ether);
    }

    function test_forceTransfer_bypassesFreeze() public {
        vm.startPrank(issuer);
        token.freezeAddress(alice);
        token.forceTransfer(alice, bob, 100 ether, "Regulatory recovery from frozen account");
        vm.stopPrank();
        assertEq(token.balanceOf(bob), 100 ether);
        assertEq(token.balanceOf(alice), 900 ether);
    }

    function test_forceTransfer_bypassesCompliance() public {
        // Charlie has no attestation — normal transfer would fail
        vm.prank(issuer);
        token.forceTransfer(alice, charlie, 100 ether, "Court-ordered transfer");
        assertEq(token.balanceOf(charlie), 100 ether);
    }

    function test_forceTransfer_bypassesPause() public {
        vm.startPrank(issuer);
        token.pause();
        token.forceTransfer(alice, bob, 100 ether, "Emergency recovery during pause");
        vm.stopPrank();
        assertEq(token.balanceOf(bob), 100 ether);
    }

    function test_forceTransfer_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        token.forceTransfer(alice, bob, 100 ether, "Unauthorized");
    }

    // --- Pause ---

    function test_pause() public {
        vm.prank(issuer);
        token.pause();

        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 100 ether);
    }

    function test_unpause() public {
        vm.startPrank(issuer);
        token.pause();
        token.unpause();
        vm.stopPrank();

        vm.prank(alice);
        token.transfer(bob, 100 ether);
        assertEq(token.balanceOf(bob), 100 ether);
    }

    // --- Burn ---

    function test_burn() public {
        vm.prank(issuer);
        token.burn(alice, 500 ether);
        assertEq(token.balanceOf(alice), 500 ether);
    }
}

/// @dev Tests for MaxHolders integration with RWAToken (bug fix verification)
contract RWATokenMaxHoldersTest is Test {
    RWAToken token;
    ComplianceEngine engine;
    MockBAS bas;
    MaxHolders maxHolders;

    address issuer = address(0xA);
    address alice = address(0xB);
    address bob = address(0xC);
    address charlie = address(0xD);
    bytes32 schema = keccak256("RWACompliance");

    function setUp() public {
        bas = new MockBAS();
        vm.startPrank(issuer);
        engine = new ComplianceEngine(address(bas), issuer);
        token = new RWAToken("Max Test", "MAX", address(engine), issuer);

        // Setup MaxHolders with cap of 2
        maxHolders = new MaxHolders(2);
        maxHolders.initialize(address(token));
        token.setMaxHoldersModule(address(maxHolders));
        engine.addModule(IComplianceModule(address(maxHolders)));

        // Create attestations
        bytes memory aliceData = bas.encodeComplianceData(2, bytes2("US"), true, 1, 0);
        bytes32 aliceUID = bas.createAttestation(schema, alice, address(this), 0, true, aliceData);
        bytes memory bobData = bas.encodeComplianceData(1, bytes2("GB"), false, 0, 0);
        bytes32 bobUID = bas.createAttestation(schema, bob, address(this), 0, true, bobData);
        bytes memory charlieData = bas.encodeComplianceData(1, bytes2("DE"), false, 0, 0);
        bytes32 charlieUID = bas.createAttestation(schema, charlie, address(this), 0, true, charlieData);

        engine.setAttestationUID(alice, aliceUID);
        engine.setAttestationUID(bob, bobUID);
        engine.setAttestationUID(charlie, charlieUID);

        // Mint to alice and bob (2 holders = at max)
        token.mint(alice, 500 ether);
        token.mint(bob, 500 ether);
        vm.stopPrank();
    }

    function test_forceTransfer_updatesHolderCount() public {
        // Alice and Bob are holders (2/2). Charlie can't receive.
        assertEq(maxHolders.holderCount(), 2);

        // Force transfer all of alice's tokens to charlie
        vm.prank(issuer);
        token.forceTransfer(alice, charlie, 500 ether, "Recovery");

        // Alice should no longer be holder, charlie should be
        assertFalse(maxHolders.isHolder(alice));
        assertTrue(maxHolders.isHolder(charlie));
        assertEq(maxHolders.holderCount(), 2); // Still 2: bob + charlie
    }

    function test_forceTransfer_reducesHolderCount() public {
        // Force transfer all of alice's tokens to bob (existing holder)
        vm.prank(issuer);
        token.forceTransfer(alice, bob, 500 ether, "Consolidation");

        // Alice removed, bob already tracked
        assertFalse(maxHolders.isHolder(alice));
        assertTrue(maxHolders.isHolder(bob));
        assertEq(maxHolders.holderCount(), 1);

        // Now charlie can receive (1/2)
        vm.prank(bob);
        token.transfer(charlie, 100 ether);
        assertEq(maxHolders.holderCount(), 2);
    }
}

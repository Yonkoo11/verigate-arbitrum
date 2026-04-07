// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";
import {IComplianceModule} from "../src/interfaces/IComplianceModule.sol";
import {IBAS} from "../src/interfaces/IBAS.sol";
import {MockBAS} from "./mocks/MockBAS.sol";
import {CountryRestriction} from "../src/modules/CountryRestriction.sol";

contract ComplianceEngineTest is Test {
    ComplianceEngine engine;
    MockBAS bas;
    address issuer = address(0xA);
    address alice = address(0xB);
    address bob = address(0xC);

    function setUp() public {
        bas = new MockBAS();
        vm.prank(issuer);
        engine = new ComplianceEngine(address(bas), issuer);
    }

    function test_constructor_setsBAS() public view {
        assertEq(address(engine.bas()), address(bas));
    }

    function test_constructor_setsOwner() public view {
        assertEq(engine.owner(), issuer);
    }

    function test_constructor_revertsZeroBAS() public {
        vm.expectRevert(ComplianceEngine.ZeroAddress.selector);
        new ComplianceEngine(address(0), issuer);
    }

    function test_addModule() public {
        CountryRestriction module = new CountryRestriction(issuer, false);
        vm.prank(issuer);
        engine.addModule(IComplianceModule(address(module)));
        assertEq(engine.moduleCount(), 1);
    }

    function test_addModule_revertsNonOwner() public {
        CountryRestriction module = new CountryRestriction(issuer, false);
        vm.prank(alice);
        vm.expectRevert();
        engine.addModule(IComplianceModule(address(module)));
    }

    function test_addModule_revertsDuplicate() public {
        CountryRestriction module = new CountryRestriction(issuer, false);
        vm.startPrank(issuer);
        engine.addModule(IComplianceModule(address(module)));
        vm.expectRevert(abi.encodeWithSelector(ComplianceEngine.ModuleAlreadyRegistered.selector, address(module)));
        engine.addModule(IComplianceModule(address(module)));
        vm.stopPrank();
    }

    function test_removeModule() public {
        CountryRestriction module = new CountryRestriction(issuer, false);
        vm.startPrank(issuer);
        engine.addModule(IComplianceModule(address(module)));
        engine.removeModule(IComplianceModule(address(module)));
        vm.stopPrank();
        assertEq(engine.moduleCount(), 0);
    }

    function test_removeModule_revertsNotFound() public {
        vm.prank(issuer);
        vm.expectRevert(abi.encodeWithSelector(ComplianceEngine.ModuleNotFound.selector, address(0x123)));
        engine.removeModule(IComplianceModule(address(0x123)));
    }

    function test_setAttestationUID() public {
        bytes32 uid = bytes32(uint256(1));
        vm.prank(issuer);
        engine.setAttestationUID(alice, uid);
        assertEq(engine.attestationUIDs(alice), uid);
        assertTrue(engine.hasAttestation(alice));
    }

    function test_batchSetAttestationUIDs() public {
        address[] memory wallets = new address[](2);
        wallets[0] = alice;
        wallets[1] = bob;
        bytes32[] memory uids = new bytes32[](2);
        uids[0] = bytes32(uint256(1));
        uids[1] = bytes32(uint256(2));

        vm.prank(issuer);
        engine.batchSetAttestationUIDs(wallets, uids);

        assertEq(engine.attestationUIDs(alice), uids[0]);
        assertEq(engine.attestationUIDs(bob), uids[1]);
    }

    function test_removeAttestationUID() public {
        bytes32 uid = bytes32(uint256(1));
        vm.startPrank(issuer);
        engine.setAttestationUID(alice, uid);
        engine.removeAttestationUID(alice);
        vm.stopPrank();
        assertFalse(engine.hasAttestation(alice));
    }

    function test_canTransfer_noModules_passes() public view {
        (bool compliant, string memory reason) = engine.canTransfer(alice, bob, 100);
        assertTrue(compliant);
        assertEq(bytes(reason).length, 0);
    }

    function test_canTransfer_mintBypassesCompliance() public view {
        (bool compliant,) = engine.canTransfer(address(0), bob, 100);
        assertTrue(compliant);
    }

    function test_canTransfer_burnBypassesCompliance() public view {
        (bool compliant,) = engine.canTransfer(alice, address(0), 100);
        assertTrue(compliant);
    }

    function test_getModules() public {
        CountryRestriction m1 = new CountryRestriction(issuer, false);
        CountryRestriction m2 = new CountryRestriction(issuer, false);
        vm.startPrank(issuer);
        engine.addModule(IComplianceModule(address(m1)));
        engine.addModule(IComplianceModule(address(m2)));
        vm.stopPrank();

        IComplianceModule[] memory mods = engine.getModules();
        assertEq(mods.length, 2);
    }
}

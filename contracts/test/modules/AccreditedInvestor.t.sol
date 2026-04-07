// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AccreditedInvestor} from "../../src/modules/AccreditedInvestor.sol";
import {MockBAS} from "../mocks/MockBAS.sol";
import {IBAS} from "../../src/interfaces/IBAS.sol";

contract AccreditedInvestorTest is Test {
    AccreditedInvestor module;
    MockBAS bas;
    address alice = address(0xB);
    address bob = address(0xC);
    bytes32 schema = keccak256("RWACompliance");

    function setUp() public {
        bas = new MockBAS();
        module = new AccreditedInvestor(false, true); // Check recipient only
    }

    function test_accredited_passes() public {
        bytes memory data = bas.encodeComplianceData(2, bytes2("US"), true, 1, 0);
        bytes32 uid = bas.createAttestation(schema, bob, address(this), 0, true, data);

        (bool compliant,) = module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), uid);
        assertTrue(compliant);
    }

    function test_notAccredited_blocks() public {
        bytes memory data = bas.encodeComplianceData(1, bytes2("US"), false, 0, 0);
        bytes32 uid = bas.createAttestation(schema, bob, address(this), 0, true, data);

        (bool compliant, string memory reason) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), uid);
        assertFalse(compliant);
        assertEq(reason, "AccreditedInvestor: recipient is not accredited");
    }

    function test_noAttestation_blocks() public {
        (bool compliant, string memory reason) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), bytes32(0));
        assertFalse(compliant);
        assertEq(reason, "AccreditedInvestor: recipient has no attestation");
    }

    function test_checkBothParties() public {
        AccreditedInvestor bothModule = new AccreditedInvestor(true, true);

        bytes memory aliceData = bas.encodeComplianceData(2, bytes2("US"), true, 1, 0);
        bytes32 aliceUID = bas.createAttestation(schema, alice, address(this), 0, true, aliceData);

        bytes memory bobData = bas.encodeComplianceData(2, bytes2("GB"), true, 1, 0);
        bytes32 bobUID = bas.createAttestation(schema, bob, address(this), 0, true, bobData);

        (bool compliant,) = bothModule.checkCompliance(alice, bob, 100, IBAS(address(bas)), aliceUID, bobUID);
        assertTrue(compliant);
    }

    function test_senderNotAccredited_blocks() public {
        AccreditedInvestor bothModule = new AccreditedInvestor(true, true);

        bytes memory aliceData = bas.encodeComplianceData(1, bytes2("US"), false, 0, 0);
        bytes32 aliceUID = bas.createAttestation(schema, alice, address(this), 0, true, aliceData);

        bytes memory bobData = bas.encodeComplianceData(2, bytes2("GB"), true, 1, 0);
        bytes32 bobUID = bas.createAttestation(schema, bob, address(this), 0, true, bobData);

        (bool compliant, string memory reason) =
            bothModule.checkCompliance(alice, bob, 100, IBAS(address(bas)), aliceUID, bobUID);
        assertFalse(compliant);
        assertEq(reason, "AccreditedInvestor: sender is not accredited");
    }

    function test_expiredAttestation_blocks() public {
        bytes memory data = bas.encodeComplianceData(2, bytes2("US"), true, 1, 0);
        bytes32 uid = bas.createAttestation(schema, bob, address(this), uint64(block.timestamp + 1), true, data);

        vm.warp(block.timestamp + 100);

        (bool compliant, string memory reason) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), uid);
        assertFalse(compliant);
        assertEq(reason, "AccreditedInvestor: recipient attestation expired");
    }

    function test_constructorRequiresAtLeastOneCheck() public {
        vm.expectRevert("Must check at least one party");
        new AccreditedInvestor(false, false);
    }

    function test_moduleInfo() public view {
        (string memory name,) = module.moduleInfo();
        assertEq(name, "AccreditedInvestor");
    }
}

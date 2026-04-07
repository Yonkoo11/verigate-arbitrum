// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CountryRestriction} from "../../src/modules/CountryRestriction.sol";
import {MockBAS} from "../mocks/MockBAS.sol";
import {IBAS} from "../../src/interfaces/IBAS.sol";

contract CountryRestrictionTest is Test {
    CountryRestriction module;
    MockBAS bas;
    address issuer = address(0xA);
    address alice = address(0xB);
    address bob = address(0xC);
    bytes32 schema = keccak256("RWACompliance");

    function setUp() public {
        bas = new MockBAS();
        vm.prank(issuer);
        module = new CountryRestriction(issuer, false);
    }

    function test_blockCountry() public {
        vm.prank(issuer);
        module.blockCountry(bytes2("KP"));
        assertTrue(module.blockedCountries(bytes2("KP")));
        assertEq(module.blockedCountryCount(), 1);
    }

    function test_blockCountries() public {
        bytes2[] memory countries = new bytes2[](3);
        countries[0] = bytes2("KP");
        countries[1] = bytes2("IR");
        countries[2] = bytes2("SY");

        vm.prank(issuer);
        module.blockCountries(countries);
        assertEq(module.blockedCountryCount(), 3);
    }

    function test_unblockCountry() public {
        vm.startPrank(issuer);
        module.blockCountry(bytes2("KP"));
        module.unblockCountry(bytes2("KP"));
        vm.stopPrank();
        assertFalse(module.blockedCountries(bytes2("KP")));
        assertEq(module.blockedCountryCount(), 0);
    }

    function test_noBlockedCountries_passes() public view {
        (bool compliant,) = module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), bytes32(0));
        assertTrue(compliant);
    }

    function test_blockedCountry_blocks() public {
        vm.prank(issuer);
        module.blockCountry(bytes2("KP"));

        bytes memory data = bas.encodeComplianceData(1, bytes2("KP"), false, 0, 0);
        bytes32 uid = bas.createAttestation(schema, bob, address(this), 0, true, data);

        (bool compliant, string memory reason) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), uid);
        assertFalse(compliant);
        assertEq(reason, "CountryRestriction: recipient country is restricted");
    }

    function test_allowedCountry_passes() public {
        vm.prank(issuer);
        module.blockCountry(bytes2("KP"));

        bytes memory data = bas.encodeComplianceData(1, bytes2("US"), true, 1, 0);
        bytes32 uid = bas.createAttestation(schema, bob, address(this), 0, true, data);

        (bool compliant,) = module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), uid);
        assertTrue(compliant);
    }

    function test_noAttestation_blocks() public {
        vm.prank(issuer);
        module.blockCountry(bytes2("KP"));

        (bool compliant, string memory reason) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), bytes32(0));
        assertFalse(compliant);
        assertEq(reason, "CountryRestriction: recipient has no attestation");
    }

    function test_revokedAttestation_blocks() public {
        vm.prank(issuer);
        module.blockCountry(bytes2("KP"));

        bytes memory data = bas.encodeComplianceData(1, bytes2("US"), true, 1, 0);
        bytes32 uid = bas.createAttestation(schema, bob, address(this), 0, true, data);
        bas.revokeAttestation(uid);

        (bool compliant, string memory reason) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), uid);
        assertFalse(compliant);
        assertEq(reason, "CountryRestriction: recipient attestation invalid or revoked");
    }

    function test_expiredAttestation_blocks() public {
        vm.prank(issuer);
        module.blockCountry(bytes2("KP"));

        bytes memory data = bas.encodeComplianceData(1, bytes2("US"), true, 1, 0);
        bytes32 uid = bas.createAttestation(schema, bob, address(this), uint64(block.timestamp + 1), true, data);

        vm.warp(block.timestamp + 100);

        (bool compliant, string memory reason) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), uid);
        assertFalse(compliant);
        assertEq(reason, "CountryRestriction: recipient attestation expired");
    }

    function test_getBlockedCountries() public {
        vm.startPrank(issuer);
        module.blockCountry(bytes2("KP"));
        module.blockCountry(bytes2("IR"));
        vm.stopPrank();

        bytes2[] memory list = module.getBlockedCountries();
        assertEq(list.length, 2);
    }

    function test_moduleInfo() public view {
        (string memory name, string memory description) = module.moduleInfo();
        assertEq(name, "CountryRestriction");
        assertTrue(bytes(description).length > 0);
    }

    // --- Sender Check Tests ---

    function test_senderCheck_blockedSender() public {
        CountryRestriction senderModule = new CountryRestriction(issuer, true);
        vm.prank(issuer);
        senderModule.blockCountry(bytes2("KP"));

        // Sender is from KP
        bytes memory senderData = bas.encodeComplianceData(1, bytes2("KP"), false, 0, 0);
        bytes32 senderUID = bas.createAttestation(schema, alice, address(this), 0, true, senderData);

        // Recipient is from US (fine)
        bytes memory recipientData = bas.encodeComplianceData(1, bytes2("US"), false, 0, 0);
        bytes32 recipientUID = bas.createAttestation(schema, bob, address(this), 0, true, recipientData);

        (bool compliant, string memory reason) =
            senderModule.checkCompliance(alice, bob, 100, IBAS(address(bas)), senderUID, recipientUID);
        assertFalse(compliant);
        assertEq(reason, "CountryRestriction: sender country is restricted");
    }

    function test_senderCheck_noSenderAttestation() public {
        CountryRestriction senderModule = new CountryRestriction(issuer, true);
        vm.prank(issuer);
        senderModule.blockCountry(bytes2("KP"));

        bytes memory recipientData = bas.encodeComplianceData(1, bytes2("US"), false, 0, 0);
        bytes32 recipientUID = bas.createAttestation(schema, bob, address(this), 0, true, recipientData);

        (bool compliant, string memory reason) =
            senderModule.checkCompliance(alice, bob, 100, IBAS(address(bas)), bytes32(0), recipientUID);
        assertFalse(compliant);
        assertEq(reason, "CountryRestriction: sender has no attestation");
    }

    function test_recipientOnlyMode_ignoresSender() public {
        // Default module (checkSenderCountry = false)
        vm.prank(issuer);
        module.blockCountry(bytes2("KP"));

        // Sender is from KP but we're not checking sender
        bytes memory senderData = bas.encodeComplianceData(1, bytes2("KP"), false, 0, 0);
        bytes32 senderUID = bas.createAttestation(schema, alice, address(this), 0, true, senderData);

        bytes memory recipientData = bas.encodeComplianceData(1, bytes2("US"), false, 0, 0);
        bytes32 recipientUID = bas.createAttestation(schema, bob, address(this), 0, true, recipientData);

        (bool compliant,) =
            module.checkCompliance(alice, bob, 100, IBAS(address(bas)), senderUID, recipientUID);
        assertTrue(compliant); // Passes because sender check is off
    }
}

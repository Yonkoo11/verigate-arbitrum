// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RWATokenFactory} from "../src/RWATokenFactory.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";
import {MockBAS} from "./mocks/MockBAS.sol";

contract RWATokenFactoryTest is Test {
    RWATokenFactory factory;
    MockBAS bas;
    address issuer = address(0xA);

    function setUp() public {
        bas = new MockBAS();
        factory = new RWATokenFactory(address(bas));
    }

    function test_deployMinimal() public {
        vm.prank(issuer);
        (address token, address engine) = factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Test Token",
                symbol: "TEST",
                useCountryRestriction: false,
                countryCheckSender: false,
                blockedCountries: new bytes2[](0),
                useAccreditedInvestor: false,
                accreditedCheckSender: false,
                accreditedCheckRecipient: false,
                useMaxHolders: false,
                maxHolderCount: 0
            })
        );

        assertTrue(token != address(0));
        assertTrue(engine != address(0));
        assertEq(RWAToken(token).name(), "Test Token");
        assertEq(RWAToken(token).symbol(), "TEST");
        assertEq(RWAToken(token).owner(), issuer);
        assertEq(ComplianceEngine(engine).owner(), issuer);
        assertEq(ComplianceEngine(engine).moduleCount(), 0);
    }

    function test_deployWithCountryRestriction() public {
        bytes2[] memory blocked = new bytes2[](2);
        blocked[0] = bytes2("KP");
        blocked[1] = bytes2("IR");

        vm.prank(issuer);
        (address token, address engine) = factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Restricted Token",
                symbol: "REST",
                useCountryRestriction: true,
                countryCheckSender: false,
                blockedCountries: blocked,
                useAccreditedInvestor: false,
                accreditedCheckSender: false,
                accreditedCheckRecipient: false,
                useMaxHolders: false,
                maxHolderCount: 0
            })
        );

        assertEq(ComplianceEngine(engine).moduleCount(), 1);
        assertEq(RWAToken(token).owner(), issuer);
    }

    function test_deployWithAllModules() public {
        bytes2[] memory blocked = new bytes2[](1);
        blocked[0] = bytes2("KP");

        vm.prank(issuer);
        (address token, address engine) = factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Full Token",
                symbol: "FULL",
                useCountryRestriction: true,
                countryCheckSender: false,
                blockedCountries: blocked,
                useAccreditedInvestor: true,
                accreditedCheckSender: false,
                accreditedCheckRecipient: true,
                useMaxHolders: true,
                maxHolderCount: 100
            })
        );

        assertEq(ComplianceEngine(engine).moduleCount(), 3);
        assertTrue(token != address(0));
    }

    function test_deploymentTracking() public {
        vm.prank(issuer);
        factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Token A",
                symbol: "A",
                useCountryRestriction: false,
                countryCheckSender: false,
                blockedCountries: new bytes2[](0),
                useAccreditedInvestor: false,
                accreditedCheckSender: false,
                accreditedCheckRecipient: false,
                useMaxHolders: false,
                maxHolderCount: 0
            })
        );

        assertEq(factory.deploymentCount(), 1);
        RWATokenFactory.DeployedToken memory d = factory.getDeployment(0);
        assertEq(d.issuer, issuer);
        assertTrue(d.token != address(0));
    }

    function test_multipleDeployments() public {
        vm.startPrank(issuer);
        factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Token A",
                symbol: "A",
                useCountryRestriction: false,
                countryCheckSender: false,
                blockedCountries: new bytes2[](0),
                useAccreditedInvestor: false,
                accreditedCheckSender: false,
                accreditedCheckRecipient: false,
                useMaxHolders: false,
                maxHolderCount: 0
            })
        );
        factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Token B",
                symbol: "B",
                useCountryRestriction: true,
                countryCheckSender: false,
                blockedCountries: new bytes2[](0),
                useAccreditedInvestor: true,
                accreditedCheckSender: false,
                accreditedCheckRecipient: true,
                useMaxHolders: false,
                maxHolderCount: 0
            })
        );
        vm.stopPrank();

        assertEq(factory.deploymentCount(), 2);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RWATokenFactory} from "../src/RWATokenFactory.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";

/// @notice Deploy script for BSC Testnet
/// Usage: forge script script/Deploy.s.sol --rpc-url $BSC_TESTNET_RPC_URL --broadcast --verify
contract Deploy is Script {
    // BAS addresses
    address constant BAS_TESTNET = 0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD;
    address constant BAS_MAINNET = 0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Detect chain
        address basAddress;
        if (block.chainid == 97) {
            basAddress = BAS_TESTNET;
            console.log("Deploying to BSC Testnet");
        } else if (block.chainid == 56) {
            basAddress = BAS_MAINNET;
            console.log("Deploying to BSC Mainnet");
        } else {
            revert("Unsupported chain");
        }

        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Factory
        RWATokenFactory factory = new RWATokenFactory(basAddress);
        console.log("RWATokenFactory:", address(factory));

        // 2. Deploy a demo token with all modules
        bytes2[] memory blockedCountries = new bytes2[](3);
        blockedCountries[0] = bytes2("KP"); // North Korea
        blockedCountries[1] = bytes2("IR"); // Iran
        blockedCountries[2] = bytes2("SY"); // Syria

        (address token, address engine) = factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Verigate Demo Token",
                symbol: "VGATE",
                useCountryRestriction: true,
                countryCheckSender: true,
                blockedCountries: blockedCountries,
                useAccreditedInvestor: true,
                accreditedCheckSender: false,
                accreditedCheckRecipient: true,
                useMaxHolders: true,
                maxHolderCount: 500
            })
        );

        console.log("RWAToken:", token);
        console.log("ComplianceEngine:", engine);

        // 3. Mint some tokens to deployer for demo
        RWAToken(token).mint(deployer, 1_000_000 ether);
        console.log("Minted 1M tokens to deployer");

        vm.stopBroadcast();

        console.log("--- Deployment Complete ---");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {RWATokenFactory} from "../src/RWATokenFactory.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";
import {CovenantAttester} from "../src/CovenantAttester.sol";

/// @notice Deploys the Covenant compliance stack and a demo tokenized-stock token.
///
/// Attestation source resolution (in priority order):
///   1. env ATTESTATION_REGISTRY (e.g. canonical EAS on Arbitrum One
///      0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458) — used as-is.
///   2. otherwise deploy the bundled CovenantAttester — used on chains without a
///      canonical registry yet, e.g. Robinhood Chain testnet (chainId 46630).
///
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url $ROBINHOOD_TESTNET_RPC_URL --broadcast
///   ATTESTATION_REGISTRY=0xbD75... forge script script/Deploy.s.sol --rpc-url $ARBITRUM_SEPOLIA_RPC_URL --broadcast
contract Deploy is Script {
    // Canonical EAS deployment (same CREATE2 address across Arbitrum networks).
    address constant EAS_ARBITRUM = 0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458;

    bytes32 constant KYC_SCHEMA = keccak256("covenant.kyc.v1");

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address registryOverride = vm.envOr("ATTESTATION_REGISTRY", address(0));

        console.log("Chain id:", block.chainid);
        console.log("Deployer:", deployer);

        vm.startBroadcast(pk);

        // 1. Resolve the attestation registry
        address registry;
        bool weControlRegistry;
        if (registryOverride != address(0)) {
            registry = registryOverride;
            weControlRegistry = false;
            console.log("Attestation registry (external):", registry);
        } else {
            registry = address(new CovenantAttester(deployer));
            weControlRegistry = true;
            console.log("Attestation registry (CovenantAttester, deployed):", registry);
        }

        // 2. Factory
        RWATokenFactory factory = new RWATokenFactory(registry);

        // 3. Demo tokenized-stock token with country + accredited + max-holder modules
        bytes2[] memory blocked = new bytes2[](3);
        blocked[0] = bytes2("KP"); // North Korea
        blocked[1] = bytes2("IR"); // Iran
        blocked[2] = bytes2("SY"); // Syria

        (address token, address engine) = factory.deploy(
            RWATokenFactory.DeployParams({
                name: "Tokenized TSLA",
                symbol: "tTSLA",
                useCountryRestriction: true,
                countryCheckSender: false,
                blockedCountries: blocked,
                useAccreditedInvestor: true,
                accreditedCheckSender: false,
                accreditedCheckRecipient: true,
                useMaxHolders: true,
                maxHolderCount: 500
            })
        );

        // 4. If we control the registry, seed a reproducible starting state:
        //    attest the deployer (US, accredited) and mint demo supply.
        if (weControlRegistry) {
            CovenantAttester attester = CovenantAttester(registry);
            bytes32 deployerUID = attester.attest(
                KYC_SCHEMA, deployer, 0, true, bytes32(0), abi.encode(uint8(2), bytes2("US"), true, uint8(1), uint64(0))
            );
            ComplianceEngine(engine).setAttestationUID(deployer, deployerUID);
            RWAToken(token).mint(deployer, 1_000_000 ether);
            console.log("Seeded: deployer attested (US/accredited) + minted 1,000,000 tTSLA");
        }

        vm.stopBroadcast();

        console.log("=== Covenant deployment ===");
        console.log("registry :", registry);
        console.log("factory  :", address(factory));
        console.log("token    :", token);
        console.log("engine   :", engine);
    }
}

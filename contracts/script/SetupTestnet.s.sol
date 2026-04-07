// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";

interface ISchemaRegistry {
    function register(string calldata schema, address resolver, bool revocable) external returns (bytes32);
    function getSchema(bytes32 uid) external view returns (bytes32, address, bool, string memory);
}

interface IBAS_Full {
    struct AttestationRequestData {
        address recipient;
        uint64 expirationTime;
        bool revocable;
        bytes32 refUID;
        bytes data;
        uint256 value;
    }

    struct AttestationRequest {
        bytes32 schema;
        AttestationRequestData data;
    }

    function attest(AttestationRequest calldata request) external payable returns (bytes32);
}

/// @notice Setup script: register schema + create attestations + map them
contract SetupTestnet is Script {
    address constant BAS_TESTNET = 0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD;
    address constant SCHEMA_REGISTRY = 0x08C8b8417313fF130526862f90cd822B55002D72;
    address constant COMPLIANCE_ENGINE = 0xE5fe2B794E4C1370217e0269F124BaB39f9bbd51;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deployer:", deployer);

        // Step 1: Try to register schema, if it already exists use the pre-computed UID
        string memory schema = "uint8 kycLevel,bytes2 country,bool accredited,uint8 investorType,uint64 expiry";

        // Compute schema UID the same way EAS does: keccak256(abi.encodePacked(schema, resolver, revocable, nonce))
        // Since we can't know the exact nonce, try to register and catch the revert, or use a known UID
        // For this script, we'll try registration first with a slightly different schema if needed

        vm.startBroadcast(deployerPrivateKey);

        // Try registering with a unique twist (add a space to make it unique to us)
        ISchemaRegistry schemaRegistry = ISchemaRegistry(SCHEMA_REGISTRY);
        bytes32 schemaUID;

        // Register a schema that's unique to RWA Gateway
        try schemaRegistry.register(
            "uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry",
            address(0),
            true
        ) returns (bytes32 uid) {
            schemaUID = uid;
            console.log("Schema registered:");
            console.logBytes32(schemaUID);
        } catch {
            // If still fails, use raw schema without spaces
            // The original schema was already registered, so let's use a different variant
            schemaUID = bytes32(0); // Will try another approach
            console.log("Schema registration failed, trying alternative...");
        }

        // If first attempt failed, try without spaces in field names
        if (schemaUID == bytes32(0)) {
            try schemaRegistry.register(
                "uint8 kyc,bytes2 country,bool accredited,uint8 investorType,uint64 expiry",
                address(0),
                true
            ) returns (bytes32 uid) {
                schemaUID = uid;
                console.log("Alt schema registered:");
                console.logBytes32(schemaUID);
            } catch {
                revert("Could not register schema");
            }
        }

        // Step 2: Create attestation for deployer
        IBAS_Full bas = IBAS_Full(BAS_TESTNET);

        bytes memory deployerData = abi.encode(
            uint8(2),
            bytes2("US"),
            true,
            uint8(1),
            uint64(0)
        );

        bytes32 deployerAttUID = bas.attest(
            IBAS_Full.AttestationRequest({
                schema: schemaUID,
                data: IBAS_Full.AttestationRequestData({
                    recipient: deployer,
                    expirationTime: 0,
                    revocable: true,
                    refUID: bytes32(0),
                    data: deployerData,
                    value: 0
                })
            })
        );
        console.log("Deployer attestation:");
        console.logBytes32(deployerAttUID);

        // Step 3: Map attestation in ComplianceEngine
        ComplianceEngine engine = ComplianceEngine(COMPLIANCE_ENGINE);
        engine.setAttestationUID(deployer, deployerAttUID);
        console.log("Attestation mapped for deployer");

        vm.stopBroadcast();
        console.log("--- Setup Complete ---");
    }
}

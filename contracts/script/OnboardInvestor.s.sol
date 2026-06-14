// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CovenantAttester} from "../src/CovenantAttester.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";

/// @notice Issuer primitive: onboard one investor by issuing a KYC attestation and mapping it
///         in the compliance engine. This is the exact action an issuer / KYC provider performs
///         to make an investor eligible to receive a tokenized security.
///
/// Write-only by design (attest + setAttestationUID) so it broadcasts cleanly — it never reads
/// back state it wrote in the same run. The before/after transfer behaviour is exercised live in
/// the frontend and is recorded as cast tx hashes in ai/deployments.md.
///
/// Env: DEPLOYER_PRIVATE_KEY, REGISTRY, ENGINE, INVESTOR, [COUNTRY="US"], [ACCREDITED=true]
/// Usage:
///   REGISTRY=0x.. ENGINE=0x.. INVESTOR=0x.. COUNTRY=US ACCREDITED=true \
///   forge script script/OnboardInvestor.s.sol --rpc-url $RPC --broadcast --slow
contract OnboardInvestor is Script {
    bytes32 constant KYC_SCHEMA = keccak256("covenant.kyc.v1");

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        CovenantAttester attester = CovenantAttester(vm.envAddress("REGISTRY"));
        ComplianceEngine engine = ComplianceEngine(vm.envAddress("ENGINE"));
        address investor = vm.envAddress("INVESTOR");

        // Country code as ISO 3166-1 alpha-2, e.g. "US" -> bytes2. Defaults to US / accredited.
        string memory countryStr = vm.envOr("COUNTRY", string("US"));
        bytes2 country = bytes2(bytes(countryStr));
        bool accredited = vm.envOr("ACCREDITED", true);

        bytes memory data = abi.encode(uint8(2), country, accredited, uint8(1), uint64(0));

        vm.startBroadcast(pk);
        bytes32 uid = attester.attest(KYC_SCHEMA, investor, 0, true, bytes32(0), data);
        engine.setAttestationUID(investor, uid);
        vm.stopBroadcast();

        console.log("Onboarded investor:", investor);
        console.log("  country:", countryStr);
        console.log("  accredited:", accredited);
        console.log("  attestation uid:");
        console.logBytes32(uid);
    }
}

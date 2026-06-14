// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VerigateAttester} from "../src/VerigateAttester.sol";
import {ComplianceEngine} from "../src/ComplianceEngine.sol";
import {RWAToken} from "../src/RWAToken.sol";

/// @notice Reproducible on-chain proof of the core compliance flow against an
///         already-deployed Verigate stack:
///           1. show a transfer to an unattested investor is BLOCKED (view check)
///           2. attest the investor (US / accredited) — real tx
///           3. map the attestation UID in the engine — real tx
///           4. show the transfer is now ALLOWED (view check) and execute it — real tx
///
/// Env: DEPLOYER_PRIVATE_KEY, REGISTRY, ENGINE, TOKEN, INVESTOR
/// Usage:
///   REGISTRY=0x.. ENGINE=0x.. TOKEN=0x.. INVESTOR=0x.. \
///   forge script script/SeedDemo.s.sol --rpc-url $RPC --broadcast --slow
contract SeedDemo is Script {
    bytes32 constant KYC_SCHEMA = keccak256("verigate.kyc.v1");

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        VerigateAttester attester = VerigateAttester(vm.envAddress("REGISTRY"));
        ComplianceEngine engine = ComplianceEngine(vm.envAddress("ENGINE"));
        RWAToken token = RWAToken(vm.envAddress("TOKEN"));
        address investor = vm.envAddress("INVESTOR");

        // Pre-flight read (no broadcast): the transfer is blocked while the investor is unattested.
        // NOTE: keep all state-changing calls inside a single broadcast block below and avoid
        // interleaving view calls between them — forge's broadcast simulation evaluates view
        // calls against a different state snapshot than the queued broadcast txs, which makes a
        // mid-block canTransfer() read look inconsistent even though on-chain execution is correct.
        (bool okBefore, string memory reasonBefore) = engine.canTransfer(deployer, investor, 100 ether);
        console.log("1) Before attestation -> compliant:", okBefore);
        console.log("   revert reason:", reasonBefore);
        require(!okBefore, "expected investor to start non-compliant");

        vm.startBroadcast(pk);
        bytes32 uid = attester.attest(
            KYC_SCHEMA, investor, 0, true, bytes32(0), abi.encode(uint8(2), bytes2("US"), true, uint8(1), uint64(0))
        );
        engine.setAttestationUID(investor, uid);
        token.transfer(investor, 100 ether);
        vm.stopBroadcast();

        console.log("2) Attested investor + transferred 100 tTSLA:", investor);
        console.log("   investor balance:", token.balanceOf(investor));
        console.log("   attestation uid:");
        console.logBytes32(uid);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBAS, Attestation} from "../../src/interfaces/IBAS.sol";

/// @title MockBAS - Mock BNB Attestation Service for testing
/// @dev Allows creating fake attestations for unit testing without a real BAS deployment
contract MockBAS is IBAS {
    mapping(bytes32 uid => Attestation) private _attestations;
    uint256 private _nonce;

    /// @notice Create a mock attestation and return its UID
    function createAttestation(
        bytes32 schema,
        address recipient,
        address attester,
        uint64 expirationTime,
        bool revocable,
        bytes memory data
    ) external returns (bytes32 uid) {
        uid = keccak256(abi.encodePacked(block.timestamp, recipient, _nonce++));
        _attestations[uid] = Attestation({
            uid: uid,
            schema: schema,
            refUID: bytes32(0),
            time: uint64(block.timestamp),
            expirationTime: expirationTime,
            revocationTime: 0,
            recipient: recipient,
            attester: attester,
            revocable: revocable,
            data: data
        });
    }

    /// @notice Revoke an attestation
    function revokeAttestation(bytes32 uid) external {
        _attestations[uid].revocationTime = uint64(block.timestamp);
    }

    /// @notice Get an attestation by UID
    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        return _attestations[uid];
    }

    /// @notice Check if attestation exists and is not revoked
    function isAttestationValid(bytes32 uid) external view override returns (bool) {
        Attestation memory att = _attestations[uid];
        return att.uid != bytes32(0) && att.revocationTime == 0;
    }

    /// @notice Helper: encode RWACompliance schema data
    function encodeComplianceData(
        uint8 kycLevel,
        bytes2 country,
        bool accredited,
        uint8 investorType,
        uint64 expiry
    ) external pure returns (bytes memory) {
        return abi.encode(kycLevel, country, accredited, investorType, expiry);
    }
}

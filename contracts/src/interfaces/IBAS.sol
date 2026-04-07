// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Attestation data structure matching BAS (forked from EAS)
struct Attestation {
    bytes32 uid;
    bytes32 schema;
    bytes32 refUID;
    uint64 time;
    uint64 expirationTime;
    uint64 revocationTime;
    address recipient;
    address attester;
    bool revocable;
    bytes data;
}

/// @title IBAS - Interface for BNB Attestation Service
/// @notice Minimal interface for reading on-chain attestations from BAS
/// @dev BAS contracts are forked from EAS (Ethereum Attestation Service)
///      BSC Testnet: 0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD
///      BSC Mainnet: 0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC
interface IBAS {
    /// @notice Get a specific attestation by its UID
    /// @param uid The unique identifier of the attestation
    /// @return The attestation data
    function getAttestation(bytes32 uid) external view returns (Attestation memory);

    /// @notice Check if an attestation exists and has not been revoked
    /// @param uid The unique identifier of the attestation
    /// @return Whether the attestation is valid
    function isAttestationValid(bytes32 uid) external view returns (bool);
}

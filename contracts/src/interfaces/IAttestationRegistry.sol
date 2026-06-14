// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice On-chain attestation record.
/// @dev Field order is byte-for-byte identical to the canonical Ethereum Attestation
///      Service (EAS) `Attestation` struct (see eas-contracts `Common.sol`). This exact
///      ordering is what makes Verigate able to read a real EAS deployment (Arbitrum One
///      `0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`) and our own `VerigateAttester`
///      through one interface. BAS (BNB Attestation Service) is itself an EAS fork, so the
///      same struct serves BSC as well.
struct Attestation {
    bytes32 uid; // unique attestation identifier
    bytes32 schema; // schema identifier
    uint64 time; // creation timestamp
    uint64 expirationTime; // 0 = no expiry
    uint64 revocationTime; // 0 = not revoked
    bytes32 refUID; // related attestation (0 = none)
    address recipient; // who the attestation is about
    address attester; // who issued it
    bool revocable; // whether it can be revoked
    bytes data; // ABI-encoded schema payload
}

/// @title IAttestationRegistry
/// @notice Chain-neutral read interface for an EAS-compatible attestation registry.
/// @dev Verigate reads investor KYC/eligibility attestations through this interface.
///      Implementations: canonical EAS (Arbitrum, Ethereum), BAS (BSC), or the bundled
///      `VerigateAttester` for chains where no canonical registry is deployed yet
///      (e.g. Robinhood Chain testnet, chainId 46630). Both function selectors match EAS.
interface IAttestationRegistry {
    /// @notice Read a single attestation by its UID.
    /// @param uid The unique identifier of the attestation
    /// @return The attestation record (zeroed if it does not exist)
    function getAttestation(bytes32 uid) external view returns (Attestation memory);

    /// @notice Whether an attestation exists and has not been revoked.
    /// @param uid The unique identifier of the attestation
    /// @return True if the attestation is present and unrevoked
    function isAttestationValid(bytes32 uid) external view returns (bool);
}

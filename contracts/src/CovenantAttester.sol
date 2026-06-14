// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAttestationRegistry, Attestation} from "./interfaces/IAttestationRegistry.sol";

/// @title CovenantAttester
/// @notice Minimal, EAS-compatible attestation registry for chains where the canonical
///         Ethereum Attestation Service is not (yet) deployed — e.g. Robinhood Chain
///         testnet (chainId 46630). Implements the same read interface
///         (`getAttestation` / `isAttestationValid`) and the same `Attestation` struct
///         layout as EAS, so the Covenant compliance stack reads it through one interface
///         and can swap to canonical EAS on Arbitrum One with zero code change.
/// @dev Unlike permissionless EAS, attestation issuance here is gated to an
///      owner-curated set of attesters (real-world KYC providers). This models a
///      compliance registry: only vetted providers may certify an investor's
///      jurisdiction / accreditation, while reads stay public and composable.
contract CovenantAttester is IAttestationRegistry, Ownable {
    // --- Storage ---

    mapping(bytes32 uid => Attestation) private _attestations;
    mapping(address attester => bool authorized) public isAttester;
    uint256 private _nonce;

    // --- Events (mirror EAS semantics) ---

    event Attested(
        bytes32 indexed uid, address indexed recipient, address indexed attester, bytes32 schema
    );
    event Revoked(bytes32 indexed uid, address indexed attester);
    event AttesterAuthorized(address indexed attester);
    event AttesterRevoked(address indexed attester);

    // --- Errors ---

    error NotAuthorizedAttester(address caller);
    error AttestationNotFound(bytes32 uid);
    error AlreadyRevoked(bytes32 uid);
    error NotRevocable(bytes32 uid);
    error NotOriginalAttester(bytes32 uid);
    error ZeroRecipient();

    // --- Constructor ---

    /// @param _owner Registry admin (the issuer / compliance operator) who curates attesters.
    constructor(address _owner) Ownable(_owner) {
        // The owner is authorized to attest by default so a single-operator demo works
        // out of the box; production operators add dedicated KYC-provider keys.
        isAttester[_owner] = true;
        emit AttesterAuthorized(_owner);
    }

    // --- Attester management ---

    /// @notice Authorize an address (a KYC provider) to issue attestations.
    function authorizeAttester(address attester) external onlyOwner {
        isAttester[attester] = true;
        emit AttesterAuthorized(attester);
    }

    /// @notice Revoke an attester's right to issue new attestations.
    /// @dev Does not invalidate attestations they already issued — use `revoke` for that.
    function revokeAttester(address attester) external onlyOwner {
        isAttester[attester] = false;
        emit AttesterRevoked(attester);
    }

    // --- Attestation lifecycle ---

    /// @notice Issue an attestation about `recipient`.
    /// @param schema       Schema identifier (free-form; Covenant uses the KYC schema below)
    /// @param recipient    The wallet the attestation certifies
    /// @param expirationTime Unix expiry (0 = never expires)
    /// @param revocable    Whether this attestation can later be revoked
    /// @param refUID       Optional reference to a prior attestation (0 = none)
    /// @param data         ABI-encoded schema payload (see `encodeKycData`)
    /// @return uid         The new attestation's unique identifier
    function attest(
        bytes32 schema,
        address recipient,
        uint64 expirationTime,
        bool revocable,
        bytes32 refUID,
        bytes calldata data
    ) external returns (bytes32 uid) {
        if (!isAttester[msg.sender]) revert NotAuthorizedAttester(msg.sender);
        if (recipient == address(0)) revert ZeroRecipient();

        uid = keccak256(abi.encodePacked(schema, recipient, msg.sender, block.timestamp, _nonce++));

        _attestations[uid] = Attestation({
            uid: uid,
            schema: schema,
            time: uint64(block.timestamp),
            expirationTime: expirationTime,
            revocationTime: 0,
            refUID: refUID,
            recipient: recipient,
            attester: msg.sender,
            revocable: revocable,
            data: data
        });

        emit Attested(uid, recipient, msg.sender, schema);
    }

    /// @notice Revoke an attestation. The original attester OR the registry owner may revoke
    ///         (the owner backstop lets a compromised/rogue attester's attestations be
    ///         invalidated), provided the attestation was issued as revocable.
    function revoke(bytes32 uid) external {
        Attestation storage att = _attestations[uid];
        if (att.uid == bytes32(0)) revert AttestationNotFound(uid);
        if (att.attester != msg.sender && msg.sender != owner()) revert NotOriginalAttester(uid);
        if (!att.revocable) revert NotRevocable(uid);
        if (att.revocationTime != 0) revert AlreadyRevoked(uid);

        att.revocationTime = uint64(block.timestamp);
        emit Revoked(uid, msg.sender);
    }

    // --- IAttestationRegistry (reads) ---

    /// @inheritdoc IAttestationRegistry
    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        return _attestations[uid];
    }

    /// @inheritdoc IAttestationRegistry
    /// @dev Valid = exists, not revoked, and not past expiry.
    function isAttestationValid(bytes32 uid) external view override returns (bool) {
        Attestation memory att = _attestations[uid];
        if (att.uid == bytes32(0)) return false;
        if (att.revocationTime != 0) return false;
        if (att.expirationTime != 0 && att.expirationTime < block.timestamp) return false;
        return true;
    }

    // --- Schema helper ---

    /// @notice Encode the Covenant KYC schema payload that the compliance modules decode.
    /// @dev Schema: (uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry).
    ///      Country is ISO 3166-1 alpha-2 (e.g. "US"). Kept in sync with the modules' `abi.decode`.
    function encodeKycData(
        uint8 kycLevel,
        bytes2 country,
        bool accredited,
        uint8 investorType,
        uint64 expiry
    ) external pure returns (bytes memory) {
        return abi.encode(kycLevel, country, accredited, investorType, expiry);
    }
}

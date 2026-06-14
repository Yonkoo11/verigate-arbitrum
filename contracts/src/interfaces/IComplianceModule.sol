// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAttestationRegistry} from "./IAttestationRegistry.sol";

/// @title IComplianceModule - Interface for compliance rule modules
/// @notice Each module implements one compliance check (e.g., country restriction, accredited investor)
/// @dev Modules are stateless readers of attestations. The ComplianceEngine iterates
///      all registered modules on every transfer.
interface IComplianceModule {
    /// @notice Check if a transfer complies with this module's rules
    /// @param from Sender address
    /// @param to Recipient address
    /// @param amount Transfer amount
    /// @param registry attestation registry to read attestations from
    /// @param fromAttestationUID attestation UID for the sender (bytes32(0) if none)
    /// @param toAttestationUID attestation UID for the recipient (bytes32(0) if none)
    /// @return compliant Whether the transfer passes this module's check
    /// @return reason Human-readable reason if non-compliant (empty if compliant)
    function checkCompliance(
        address from,
        address to,
        uint256 amount,
        IAttestationRegistry registry,
        bytes32 fromAttestationUID,
        bytes32 toAttestationUID
    ) external view returns (bool compliant, string memory reason);

    /// @notice Get module metadata
    /// @return name Module name
    /// @return description Module description
    function moduleInfo() external view returns (string memory name, string memory description);
}

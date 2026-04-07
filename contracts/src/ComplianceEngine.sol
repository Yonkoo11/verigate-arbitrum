// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBAS, Attestation} from "./interfaces/IBAS.sol";
import {IComplianceModule} from "./interfaces/IComplianceModule.sol";

/// @title ComplianceEngine - Modular compliance rule engine for RWA tokens
/// @notice Manages a set of compliance modules and checks all of them on every transfer.
///         Each module reads BAS attestations to verify investor eligibility.
/// @dev The engine is owned by the token issuer who can add/remove modules and manage attestation mappings.
contract ComplianceEngine is Ownable {
    // --- Storage ---

    IBAS public immutable bas;
    IComplianceModule[] public modules;
    mapping(address wallet => bytes32 attestationUID) public attestationUIDs;

    // --- Events ---

    event ModuleAdded(address indexed module, string name);
    event ModuleRemoved(address indexed module, uint256 index);
    event AttestationSet(address indexed wallet, bytes32 uid);
    event AttestationRemoved(address indexed wallet);
    event TransferChecked(address indexed from, address indexed to, uint256 amount, bool compliant);

    // --- Errors ---

    error ModuleAlreadyRegistered(address module);
    error ModuleNotFound(address module);
    error ZeroAddress();

    // --- Constructor ---

    /// @param _bas Address of the BAS contract on this chain
    /// @param _owner Token issuer who controls compliance configuration
    constructor(address _bas, address _owner) Ownable(_owner) {
        if (_bas == address(0)) revert ZeroAddress();
        bas = IBAS(_bas);
    }

    // --- Module Management ---

    /// @notice Add a compliance module
    /// @param module The module contract to add
    function addModule(IComplianceModule module) external onlyOwner {
        if (address(module) == address(0)) revert ZeroAddress();

        for (uint256 i; i < modules.length; i++) {
            if (address(modules[i]) == address(module)) {
                revert ModuleAlreadyRegistered(address(module));
            }
        }

        modules.push(module);
        (string memory name,) = module.moduleInfo();
        emit ModuleAdded(address(module), name);
    }

    /// @notice Remove a compliance module by address
    /// @param module The module contract to remove
    function removeModule(IComplianceModule module) external onlyOwner {
        uint256 len = modules.length;
        for (uint256 i; i < len; i++) {
            if (address(modules[i]) == address(module)) {
                modules[i] = modules[len - 1];
                modules.pop();
                emit ModuleRemoved(address(module), i);
                return;
            }
        }
        revert ModuleNotFound(address(module));
    }

    // --- Attestation Management ---

    /// @notice Map a wallet to its BAS attestation UID
    /// @param wallet The wallet address
    /// @param uid The BAS attestation UID
    function setAttestationUID(address wallet, bytes32 uid) external onlyOwner {
        if (wallet == address(0)) revert ZeroAddress();
        attestationUIDs[wallet] = uid;
        emit AttestationSet(wallet, uid);
    }

    /// @notice Batch set attestation UIDs for multiple wallets
    /// @param wallets Array of wallet addresses
    /// @param uids Array of BAS attestation UIDs
    function batchSetAttestationUIDs(address[] calldata wallets, bytes32[] calldata uids) external onlyOwner {
        require(wallets.length == uids.length, "Length mismatch");
        for (uint256 i; i < wallets.length; i++) {
            if (wallets[i] == address(0)) revert ZeroAddress();
            attestationUIDs[wallets[i]] = uids[i];
            emit AttestationSet(wallets[i], uids[i]);
        }
    }

    /// @notice Remove a wallet's attestation mapping
    /// @param wallet The wallet address
    function removeAttestationUID(address wallet) external onlyOwner {
        delete attestationUIDs[wallet];
        emit AttestationRemoved(wallet);
    }

    // --- Compliance Check ---

    /// @notice Check if a transfer complies with all registered modules
    /// @param from Sender address
    /// @param to Recipient address
    /// @param amount Transfer amount
    /// @return compliant Whether all modules approve the transfer
    /// @return reason First non-compliance reason (empty if compliant)
    function canTransfer(address from, address to, uint256 amount)
        external
        view
        returns (bool compliant, string memory reason)
    {
        // Minting (from == address(0)) and burning (to == address(0)) bypass compliance
        if (from == address(0) || to == address(0)) {
            return (true, "");
        }

        bytes32 fromUID = attestationUIDs[from];
        bytes32 toUID = attestationUIDs[to];

        uint256 len = modules.length;
        for (uint256 i; i < len; i++) {
            (bool moduleCompliant, string memory moduleReason) =
                modules[i].checkCompliance(from, to, amount, bas, fromUID, toUID);

            if (!moduleCompliant) {
                return (false, moduleReason);
            }
        }

        return (true, "");
    }

    // --- View Functions ---

    /// @notice Get the number of registered modules
    function moduleCount() external view returns (uint256) {
        return modules.length;
    }

    /// @notice Get all registered modules
    function getModules() external view returns (IComplianceModule[] memory) {
        return modules;
    }

    /// @notice Check if a wallet has an attestation mapped
    function hasAttestation(address wallet) external view returns (bool) {
        return attestationUIDs[wallet] != bytes32(0);
    }
}

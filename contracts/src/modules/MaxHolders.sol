// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IComplianceModule} from "../interfaces/IComplianceModule.sol";
import {IBAS} from "../interfaces/IBAS.sol";

/// @title MaxHolders - Cap the total number of token holders
/// @notice Many securities regulations limit the number of holders before requiring
///         public registration (e.g., SEC Rule 12g-1: 2000 holders / 500 non-accredited).
/// @dev This module needs to be notified of transfers to update its holder count.
///      The RWAToken must call `onTransfer` after each successful transfer.
///      This is a stateful module — it tracks holder addresses.
contract MaxHolders is IComplianceModule {
    // --- Storage ---

    uint256 public immutable maxHolderCount;
    address public token; // The RWAToken that calls onTransfer
    address public immutable deployer; // Only deployer can initialize
    uint256 public holderCount;
    mapping(address => bool) public isHolder;

    // --- Errors ---

    error OnlyToken();
    error OnlyDeployer();
    error AlreadyInitialized();

    // --- Constructor ---

    /// @param _maxHolderCount Maximum number of distinct token holders
    constructor(uint256 _maxHolderCount) {
        require(_maxHolderCount > 0, "Max holders must be > 0");
        maxHolderCount = _maxHolderCount;
        deployer = msg.sender;
    }

    /// @notice Set the token address (can only be called once, only by deployer)
    /// @dev Called by the factory or deployer after token deployment
    function initialize(address _token) external {
        if (msg.sender != deployer) revert OnlyDeployer();
        if (token != address(0)) revert AlreadyInitialized();
        require(_token != address(0), "Zero address");
        token = _token;
    }

    // --- IComplianceModule ---

    /// @notice Check if adding a new holder would exceed the cap
    /// @dev Only blocks if `to` is not already a holder AND count is at max
    function checkCompliance(
        address, /* from */
        address to,
        uint256, /* amount */
        IBAS, /* bas */
        bytes32, /* fromAttestationUID */
        bytes32 /* toAttestationUID */
    ) external view override returns (bool compliant, string memory reason) {
        // If recipient is already a holder, transfer is fine
        if (isHolder[to]) {
            return (true, "");
        }

        // New holder would exceed cap
        if (holderCount >= maxHolderCount) {
            return (false, "MaxHolders: maximum holder count reached");
        }

        return (true, "");
    }

    function moduleInfo() external pure override returns (string memory name, string memory description) {
        return ("MaxHolders", "Caps the total number of distinct token holders");
    }

    // --- Holder Tracking ---

    /// @notice Called by the RWAToken after each successful transfer to update holder tracking
    /// @param from Sender (address(0) for mint)
    /// @param to Recipient (address(0) for burn)
    /// @param fromBalance Sender's balance AFTER transfer
    /// @param toBalanceBefore Recipient's balance BEFORE transfer
    function onTransfer(address from, address to, uint256 fromBalance, uint256 toBalanceBefore) external {
        if (msg.sender != token) revert OnlyToken();

        // New holder (recipient had zero balance before)
        if (to != address(0) && toBalanceBefore == 0) {
            isHolder[to] = true;
            holderCount++;
        }

        // Removed holder (sender now has zero balance)
        if (from != address(0) && fromBalance == 0) {
            isHolder[from] = false;
            holderCount--;
        }
    }
}

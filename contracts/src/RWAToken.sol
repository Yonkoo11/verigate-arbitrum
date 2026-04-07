// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ComplianceEngine} from "./ComplianceEngine.sol";
import {MaxHolders} from "./modules/MaxHolders.sol";

/// @title RWAToken - ERC-20 token with compliance-gated transfers
/// @notice Every transfer (except mint/burn) is checked against the ComplianceEngine.
///         The issuer (owner) can pause, freeze individual addresses, and force transfers
///         for regulatory recovery scenarios.
contract RWAToken is ERC20, Ownable, Pausable {
    // --- Storage ---

    ComplianceEngine public immutable complianceEngine;
    MaxHolders public maxHoldersModule; // Optional: set if MaxHolders module is used
    mapping(address => bool) public frozen;
    bool private _forcedTransfer;

    // --- Events ---

    event AddressFrozen(address indexed wallet, bool isFrozen);
    event ForcedTransfer(address indexed from, address indexed to, uint256 amount, string reason);
    event ComplianceFailure(address indexed from, address indexed to, uint256 amount, string reason);

    // --- Errors ---

    error AddressIsFrozen(address wallet);
    error TransferNotCompliant(string reason);
    error ZeroAddress();

    // --- Constructor ---

    /// @param name_ Token name (e.g., "Tokenized US Treasury Bill")
    /// @param symbol_ Token symbol (e.g., "tTBILL")
    /// @param _complianceEngine Address of the ComplianceEngine managing this token's rules
    /// @param _issuer Address of the token issuer (owner)
    constructor(string memory name_, string memory symbol_, address _complianceEngine, address _issuer)
        ERC20(name_, symbol_)
        Ownable(_issuer)
    {
        if (_complianceEngine == address(0)) revert ZeroAddress();
        complianceEngine = ComplianceEngine(_complianceEngine);
    }

    // --- Issuer Functions ---

    /// @notice Mint tokens to a specific address (issuer only)
    /// @dev Minting bypasses compliance (recipient should already be verified)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens from a specific address (issuer only)
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /// @notice Freeze an address (blocks all transfers to/from)
    function freezeAddress(address wallet) external onlyOwner {
        if (wallet == address(0)) revert ZeroAddress();
        frozen[wallet] = true;
        emit AddressFrozen(wallet, true);
    }

    /// @notice Unfreeze an address
    function unfreezeAddress(address wallet) external onlyOwner {
        frozen[wallet] = false;
        emit AddressFrozen(wallet, false);
    }

    /// @notice Force transfer tokens between addresses (regulatory recovery)
    /// @dev Bypasses compliance checks, freeze status, and pause. Requires a reason for audit trail.
    function forceTransfer(address from, address to, uint256 amount, string calldata reason) external onlyOwner {
        _forcedTransfer = true;
        _transfer(from, to, amount);
        _forcedTransfer = false;
        emit ForcedTransfer(from, to, amount, reason);
    }

    /// @notice Pause all transfers
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause transfers
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Set the MaxHolders module for holder tracking callbacks
    function setMaxHoldersModule(address _module) external onlyOwner {
        maxHoldersModule = MaxHolders(_module);
    }

    // --- Internal Overrides ---

    /// @dev Hook called on every transfer. Enforces: pause, freeze, and compliance checks.
    ///      Minting (from == 0) and burning (to == 0) bypass compliance but not pause/freeze.
    function _update(address from, address to, uint256 amount) internal override {
        // Force transfers bypass compliance/freeze/pause but still track holders
        if (_forcedTransfer) {
            uint256 toBalBefore = (to != address(0)) ? balanceOf(to) : 0;
            super._update(from, to, amount);
            if (address(maxHoldersModule) != address(0)) {
                uint256 fromBal = (from != address(0)) ? balanceOf(from) : 0;
                maxHoldersModule.onTransfer(from, to, fromBal, toBalBefore);
            }
            return;
        }

        // Pause check applies to everything
        _requireNotPaused();

        // Freeze check (skip for mint/burn)
        if (from != address(0) && frozen[from]) revert AddressIsFrozen(from);
        if (to != address(0) && frozen[to]) revert AddressIsFrozen(to);

        // Compliance check (skip for mint/burn — engine handles this internally)
        if (from != address(0) && to != address(0)) {
            (bool compliant, string memory reason) = complianceEngine.canTransfer(from, to, amount);
            if (!compliant) {
                emit ComplianceFailure(from, to, amount, reason);
                revert TransferNotCompliant(reason);
            }
        }

        // Capture recipient's balance before transfer for MaxHolders tracking
        uint256 toBalanceBefore = (to != address(0)) ? balanceOf(to) : 0;

        super._update(from, to, amount);

        // Notify MaxHolders module for holder count tracking
        if (address(maxHoldersModule) != address(0)) {
            uint256 fromBalance = (from != address(0)) ? balanceOf(from) : 0;
            maxHoldersModule.onTransfer(from, to, fromBalance, toBalanceBefore);
        }
    }
}

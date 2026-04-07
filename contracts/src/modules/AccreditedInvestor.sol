// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IComplianceModule} from "../interfaces/IComplianceModule.sol";
import {IBAS, Attestation} from "../interfaces/IBAS.sol";

/// @title AccreditedInvestor - Only allow transfers to accredited investors
/// @notice Reads the recipient's BAS attestation to verify accredited investor status.
/// @dev Can be configured to check sender, recipient, or both.
contract AccreditedInvestor is IComplianceModule {
    bool public immutable checkSender;
    bool public immutable checkRecipient;

    /// @param _checkSender Whether to verify sender is accredited
    /// @param _checkRecipient Whether to verify recipient is accredited
    constructor(bool _checkSender, bool _checkRecipient) {
        require(_checkSender || _checkRecipient, "Must check at least one party");
        checkSender = _checkSender;
        checkRecipient = _checkRecipient;
    }

    function checkCompliance(
        address, /* from */
        address, /* to */
        uint256, /* amount */
        IBAS bas,
        bytes32 fromAttestationUID,
        bytes32 toAttestationUID
    ) external view override returns (bool compliant, string memory reason) {
        if (checkSender) {
            (bool ok, string memory err) = _checkAccredited(bas, fromAttestationUID, "sender");
            if (!ok) return (false, err);
        }

        if (checkRecipient) {
            (bool ok, string memory err) = _checkAccredited(bas, toAttestationUID, "recipient");
            if (!ok) return (false, err);
        }

        return (true, "");
    }

    function _checkAccredited(IBAS bas, bytes32 uid, string memory party)
        internal
        view
        returns (bool, string memory)
    {
        if (uid == bytes32(0)) {
            return (false, string.concat("AccreditedInvestor: ", party, " has no attestation"));
        }

        if (!bas.isAttestationValid(uid)) {
            return (false, string.concat("AccreditedInvestor: ", party, " attestation invalid or revoked"));
        }

        Attestation memory att = bas.getAttestation(uid);

        if (att.expirationTime != 0 && att.expirationTime < block.timestamp) {
            return (false, string.concat("AccreditedInvestor: ", party, " attestation expired"));
        }

        // Schema: (uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry)
        (,, bool accredited,,) = abi.decode(att.data, (uint8, bytes2, bool, uint8, uint64));

        if (!accredited) {
            return (false, string.concat("AccreditedInvestor: ", party, " is not accredited"));
        }

        return (true, "");
    }

    function moduleInfo() external pure override returns (string memory name, string memory description) {
        return ("AccreditedInvestor", "Only allows transfers between accredited investors");
    }
}

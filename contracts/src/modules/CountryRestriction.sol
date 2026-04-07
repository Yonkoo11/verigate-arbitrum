// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IComplianceModule} from "../interfaces/IComplianceModule.sol";
import {IBAS, Attestation} from "../interfaces/IBAS.sol";

/// @title CountryRestriction - Block transfers to/from sanctioned jurisdictions
/// @notice Reads the recipient's BAS attestation to extract their country code,
///         then checks it against a configurable blocklist.
/// @dev Country is expected in the attestation data as: abi.encode(uint8 kycLevel, bytes2 country, ...)
///      The schema field order must match: (uint8, bytes2, bool, uint8, uint64)
contract CountryRestriction is IComplianceModule, Ownable {
    // --- Storage ---

    mapping(bytes2 countryCode => bool blocked) public blockedCountries;
    bytes2[] public blockedCountryList;
    bool public immutable checkSenderCountry;

    // --- Events ---

    event CountryBlocked(bytes2 indexed country);
    event CountryUnblocked(bytes2 indexed country);

    // --- Constructor ---

    /// @param _owner Issuer who configures blocked countries
    /// @param _checkSender If true, also check sender's country against blocklist
    constructor(address _owner, bool _checkSender) Ownable(_owner) {
        checkSenderCountry = _checkSender;
    }

    // --- Configuration ---

    /// @notice Block a country code (ISO 3166-1 alpha-2)
    function blockCountry(bytes2 country) external onlyOwner {
        if (!blockedCountries[country]) {
            blockedCountries[country] = true;
            blockedCountryList.push(country);
            emit CountryBlocked(country);
        }
    }

    /// @notice Block multiple countries at once
    function blockCountries(bytes2[] calldata countries) external onlyOwner {
        for (uint256 i; i < countries.length; i++) {
            if (!blockedCountries[countries[i]]) {
                blockedCountries[countries[i]] = true;
                blockedCountryList.push(countries[i]);
                emit CountryBlocked(countries[i]);
            }
        }
    }

    /// @notice Unblock a country code
    function unblockCountry(bytes2 country) external onlyOwner {
        if (blockedCountries[country]) {
            blockedCountries[country] = false;
            // Remove from list
            for (uint256 i; i < blockedCountryList.length; i++) {
                if (blockedCountryList[i] == country) {
                    blockedCountryList[i] = blockedCountryList[blockedCountryList.length - 1];
                    blockedCountryList.pop();
                    break;
                }
            }
            emit CountryUnblocked(country);
        }
    }

    // --- IComplianceModule ---

    function checkCompliance(
        address, /* from */
        address, /* to */
        uint256, /* amount */
        IBAS bas,
        bytes32 fromAttestationUID,
        bytes32 toAttestationUID
    ) external view override returns (bool compliant, string memory reason) {
        // If no blocked countries configured, pass
        if (blockedCountryList.length == 0) {
            return (true, "");
        }

        // Check sender if configured
        if (checkSenderCountry) {
            (bool ok, string memory err) = _checkCountry(bas, fromAttestationUID, "sender");
            if (!ok) return (false, err);
        }

        // Always check recipient
        return _checkCountry(bas, toAttestationUID, "recipient");
    }

    function _checkCountry(IBAS bas, bytes32 uid, string memory party)
        internal
        view
        returns (bool, string memory)
    {
        if (uid == bytes32(0)) {
            return (false, string.concat("CountryRestriction: ", party, " has no attestation"));
        }

        if (!bas.isAttestationValid(uid)) {
            return (false, string.concat("CountryRestriction: ", party, " attestation invalid or revoked"));
        }

        Attestation memory att = bas.getAttestation(uid);

        if (att.expirationTime != 0 && att.expirationTime < block.timestamp) {
            return (false, string.concat("CountryRestriction: ", party, " attestation expired"));
        }

        // Schema: (uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry)
        (, bytes2 country,,,) = abi.decode(att.data, (uint8, bytes2, bool, uint8, uint64));

        if (blockedCountries[country]) {
            return (false, string.concat("CountryRestriction: ", party, " country is restricted"));
        }

        return (true, "");
    }

    function moduleInfo() external pure override returns (string memory name, string memory description) {
        return ("CountryRestriction", "Blocks transfers to recipients in sanctioned jurisdictions");
    }

    // --- View ---

    function getBlockedCountries() external view returns (bytes2[] memory) {
        return blockedCountryList;
    }

    function blockedCountryCount() external view returns (uint256) {
        return blockedCountryList.length;
    }
}

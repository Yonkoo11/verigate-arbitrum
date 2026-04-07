// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RWAToken} from "./RWAToken.sol";
import {ComplianceEngine} from "./ComplianceEngine.sol";
import {IComplianceModule} from "./interfaces/IComplianceModule.sol";
import {CountryRestriction} from "./modules/CountryRestriction.sol";
import {AccreditedInvestor} from "./modules/AccreditedInvestor.sol";
import {MaxHolders} from "./modules/MaxHolders.sol";

/// @title RWATokenFactory - Deploy compliant RWA tokens in one transaction
/// @notice Creates an RWAToken with its ComplianceEngine and selected modules
contract RWATokenFactory {
    // --- Storage ---

    address public immutable bas;

    struct DeployedToken {
        address token;
        address complianceEngine;
        address[] modules;
        address issuer;
        uint256 deployedAt;
    }

    DeployedToken[] public deployments;
    mapping(address token => uint256 index) internal _tokenIndex;
    mapping(address token => bool exists) public tokenExists;

    // --- Events ---

    event TokenDeployed(
        address indexed token,
        address indexed complianceEngine,
        address indexed issuer,
        string name,
        string symbol,
        address[] modules
    );

    // --- Constructor ---

    /// @param _bas BAS contract address for this chain
    constructor(address _bas) {
        require(_bas != address(0), "Zero BAS address");
        bas = _bas;
    }

    // --- Deployment ---

    struct DeployParams {
        string name;
        string symbol;
        bool useCountryRestriction;
        bool countryCheckSender;
        bytes2[] blockedCountries;
        bool useAccreditedInvestor;
        bool accreditedCheckSender;
        bool accreditedCheckRecipient;
        bool useMaxHolders;
        uint256 maxHolderCount;
    }

    /// @notice Deploy a new compliant RWA token with selected modules
    /// @param params Deployment parameters
    /// @return token The deployed RWAToken address
    /// @return engine The deployed ComplianceEngine address
    function deploy(DeployParams calldata params) external returns (address token, address engine) {
        // Deploy ComplianceEngine (factory as owner for setup, then transfer)
        ComplianceEngine complianceEngine = new ComplianceEngine(bas, address(this));

        // Deploy RWAToken (factory as owner for setup, then transfer to issuer)
        RWAToken rwaToken = new RWAToken(params.name, params.symbol, address(complianceEngine), address(this));

        address[] memory moduleAddresses = new address[](3); // max 3 modules
        uint256 moduleCount;

        // Deploy and register CountryRestriction
        if (params.useCountryRestriction) {
            // Deploy with factory as owner so we can configure, then transfer to issuer
            CountryRestriction module = new CountryRestriction(address(this), params.countryCheckSender);
            if (params.blockedCountries.length > 0) {
                module.blockCountries(params.blockedCountries);
            }
            module.transferOwnership(msg.sender);
            complianceEngine.addModule(IComplianceModule(address(module)));
            moduleAddresses[moduleCount++] = address(module);
        }

        // Deploy and register AccreditedInvestor
        if (params.useAccreditedInvestor) {
            bool checkSender = params.accreditedCheckSender;
            bool checkRecipient = params.accreditedCheckRecipient;
            if (!checkSender && !checkRecipient) checkRecipient = true; // Default: check recipient
            AccreditedInvestor module = new AccreditedInvestor(checkSender, checkRecipient);
            complianceEngine.addModule(IComplianceModule(address(module)));
            moduleAddresses[moduleCount++] = address(module);
        }

        // Deploy and register MaxHolders
        if (params.useMaxHolders) {
            require(params.maxHolderCount > 0, "Max holder count must be > 0");
            MaxHolders module = new MaxHolders(params.maxHolderCount);
            module.initialize(address(rwaToken));
            rwaToken.setMaxHoldersModule(address(module));
            complianceEngine.addModule(IComplianceModule(address(module)));
            moduleAddresses[moduleCount++] = address(module);
        }

        // Transfer ownership to the issuer
        rwaToken.transferOwnership(msg.sender);
        complianceEngine.transferOwnership(msg.sender);

        // Trim module array to actual count
        address[] memory finalModules = new address[](moduleCount);
        for (uint256 i; i < moduleCount; i++) {
            finalModules[i] = moduleAddresses[i];
        }

        // Record deployment
        deployments.push(
            DeployedToken({
                token: address(rwaToken),
                complianceEngine: address(complianceEngine),
                modules: finalModules,
                issuer: msg.sender,
                deployedAt: block.timestamp
            })
        );
        _tokenIndex[address(rwaToken)] = deployments.length - 1;
        tokenExists[address(rwaToken)] = true;

        emit TokenDeployed(address(rwaToken), address(complianceEngine), msg.sender, params.name, params.symbol, finalModules);

        return (address(rwaToken), address(complianceEngine));
    }

    // --- View ---

    function deploymentCount() external view returns (uint256) {
        return deployments.length;
    }

    function getDeployment(uint256 index) external view returns (DeployedToken memory) {
        return deployments[index];
    }

    function getDeploymentByToken(address token) external view returns (DeployedToken memory) {
        require(tokenExists[token], "Token not deployed by this factory");
        return deployments[_tokenIndex[token]];
    }
}

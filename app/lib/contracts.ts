import { type Address } from "viem";
import RWATokenABI from "./RWAToken.json";
import ComplianceEngineABI from "./ComplianceEngine.json";
import CountryRestrictionABI from "./CountryRestriction.json";
import AccreditedInvestorABI from "./AccreditedInvestor.json";
import MaxHoldersABI from "./MaxHolders.json";
import RWATokenFactoryABI from "./RWATokenFactory.json";

export const rwaTokenAbi = RWATokenABI.abi;
export const complianceEngineAbi = ComplianceEngineABI.abi;
export const countryRestrictionAbi = CountryRestrictionABI.abi;
export const accreditedInvestorAbi = AccreditedInvestorABI.abi;
export const maxHoldersAbi = MaxHoldersABI.abi;
export const rwaTokenFactoryAbi = RWATokenFactoryABI.abi;

// Contract addresses from environment
export const addresses = {
  rwaToken: (process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS ?? "") as Address,
  complianceEngine: (process.env.NEXT_PUBLIC_COMPLIANCE_ENGINE_ADDRESS ??
    "") as Address,
  countryRestriction: (process.env.NEXT_PUBLIC_COUNTRY_RESTRICTION_ADDRESS ??
    "") as Address,
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as Address,
};

// BSC Testnet chain config
export const BSC_TESTNET_CHAIN_ID = 97;
export const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
export const BSC_TESTNET_EXPLORER = "https://testnet.bscscan.com";

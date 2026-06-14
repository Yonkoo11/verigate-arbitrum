import { type Address } from "viem";
import RWATokenABI from "./RWAToken.json";
import ComplianceEngineABI from "./ComplianceEngine.json";
import CountryRestrictionABI from "./CountryRestriction.json";
import AccreditedInvestorABI from "./AccreditedInvestor.json";
import MaxHoldersABI from "./MaxHolders.json";
import RWATokenFactoryABI from "./RWATokenFactory.json";
import CovenantAttesterABI from "./CovenantAttester.json";

export const rwaTokenAbi = RWATokenABI.abi;
export const complianceEngineAbi = ComplianceEngineABI.abi;
export const countryRestrictionAbi = CountryRestrictionABI.abi;
export const accreditedInvestorAbi = AccreditedInvestorABI.abi;
export const maxHoldersAbi = MaxHoldersABI.abi;
export const rwaTokenFactoryAbi = RWATokenFactoryABI.abi;
export const covenantAttesterAbi = CovenantAttesterABI.abi;

// Contract addresses from environment
export const addresses = {
  rwaToken: (process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS ?? "") as Address,
  complianceEngine: (process.env.NEXT_PUBLIC_COMPLIANCE_ENGINE_ADDRESS ??
    "") as Address,
  countryRestriction: (process.env.NEXT_PUBLIC_COUNTRY_RESTRICTION_ADDRESS ??
    "") as Address,
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as Address,
  registry: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "") as Address,
};

// Covenant KYC schema id = keccak256("covenant.kyc.v1")
export const KYC_SCHEMA =
  "0xfb4a89a14c77aac2b47fb0af09a36501ec9a789f4afb78002f34ee6f23bea75b" as const;

// Robinhood Chain testnet (PRIMARY)
export const ROBINHOOD_CHAIN_ID = 46630;
export const ROBINHOOD_RPC = "https://rpc.testnet.chain.robinhood.com";
export const ROBINHOOD_EXPLORER = "https://explorer.testnet.chain.robinhood.com";

// Default chain (the demo points at Robinhood Chain)
export const CHAIN_ID = ROBINHOOD_CHAIN_ID;
export const CHAIN_RPC = ROBINHOOD_RPC;
export const CHAIN_EXPLORER = ROBINHOOD_EXPLORER;

// Arbitrum Sepolia (SECONDARY)
export const ARB_SEPOLIA_CHAIN_ID = 421614;
export const ARB_SEPOLIA_RPC = "https://sepolia-rollup.arbitrum.io/rpc";
export const ARB_SEPOLIA_EXPLORER = "https://sepolia.arbiscan.io";

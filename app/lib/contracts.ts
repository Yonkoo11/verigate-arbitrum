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

// Contract addresses. Defaults are the LIVE Robinhood Chain (46630) Covenant deployment,
// so the hosted demo works even when build-time env vars are unset/empty (|| falls back on
// empty string too). These are public addresses — no secrets.
export const addresses = {
  rwaToken: (process.env.NEXT_PUBLIC_RWA_TOKEN_ADDRESS ||
    "0x477f2a84503d6b8eefae021a5d94d0a8cdb9c74a") as Address,
  complianceEngine: (process.env.NEXT_PUBLIC_COMPLIANCE_ENGINE_ADDRESS ||
    "0x52e21af43035ce398dddd1aa6e75cea3a1f0c776") as Address,
  countryRestriction: (process.env.NEXT_PUBLIC_COUNTRY_RESTRICTION_ADDRESS ||
    "0xfD17A992a812c308AaAE97e5C506541AC82e21eb") as Address,
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
    "0x41404B1e68614698af7837b82264A46BAf470923") as Address,
  registry: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ||
    "0x70E72995Eabaf8b920063C8257690084A2387405") as Address,
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

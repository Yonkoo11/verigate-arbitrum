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
    "0x8341dee3cfaab93cf2557176e4ebfd6844933798") as Address,
  complianceEngine: (process.env.NEXT_PUBLIC_COMPLIANCE_ENGINE_ADDRESS ||
    "0x4b3ea101e35860a3b995a67d9d1e412da5271cf5") as Address,
  countryRestriction: (process.env.NEXT_PUBLIC_COUNTRY_RESTRICTION_ADDRESS ||
    "0xE077550E3bD210EA9165bDAADdF6ecD7eF52567F") as Address,
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ||
    "0x52FB7D121e576D8B0b06dD6fcA6C3D7454e7bf5C") as Address,
  registry: (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ||
    "0x68126baf9f282f91b9080c71aDa7e469d2e5E4D6") as Address,
};

// Covenant KYC schema id = keccak256("covenant.kyc.v1")
export const KYC_SCHEMA =
  "0xfb4a89a14c77aac2b47fb0af09a36501ec9a789f4afb78002f34ee6f23bea75b" as const;

// Robinhood Chain testnet (PRIMARY)
export const ROBINHOOD_CHAIN_ID = 46630;
export const ROBINHOOD_RPC = "https://rpc.testnet.chain.robinhood.com";
export const ROBINHOOD_EXPLORER = "https://explorer.testnet.chain.robinhood.com";
// Block just before the live Covenant deployment on Robinhood Chain — the activity/
// registry event scans start here so they cover the full on-chain history.
export const COVENANT_DEPLOY_BLOCK = 75680000n;

// Default chain (the demo points at Robinhood Chain)
export const CHAIN_ID = ROBINHOOD_CHAIN_ID;
export const CHAIN_RPC = ROBINHOOD_RPC;
export const CHAIN_EXPLORER = ROBINHOOD_EXPLORER;

// Arbitrum Sepolia (SECONDARY)
export const ARB_SEPOLIA_CHAIN_ID = 421614;
export const ARB_SEPOLIA_RPC = "https://sepolia-rollup.arbitrum.io/rpc";
export const ARB_SEPOLIA_EXPLORER = "https://sepolia.arbiscan.io";

# Verigate

Lightweight, BNB-native compliance middleware for tokenized real-world assets using BAS (BNB Attestation Service).

## Phase 1 Gate (MUST PASS BEFORE ANY OTHER WORK)
- **Core Action:** Transfer blocked without BAS attestation, succeeds with it
- **Success Test:** On BSC testnet: `transfer()` → reverts → add BAS attestation → `transfer()` → succeeds
- **NOT Phase 1:** Frontend, pitch deck, tokenomics, multiple modules, governance

## Build Order
1. Core action works (contracts + BAS integration on testnet)
2. Data flows (real BAS attestations, not mocks)
3. Product complete (contracts + demo + pitch deck)
4. Polish LAST

## Tech Stack
- Solidity + Foundry (contracts)
- BAS (BNB Attestation Service) — forked from EAS, same Solidity interface
- BSC Testnet (chain ID 97)
- Next.js + wagmi + viem (frontend demo)

## Key Contracts
- `IBAS.sol` — Interface to BAS (getAttestation, isAttestationValid)
- `ComplianceEngine.sol` — Modular rule engine, iterates compliance modules
- `CountryRestriction.sol` — Blocks transfers to sanctioned countries via BAS attestation
- `RWAToken.sol` — ERC-20 with compliance hook (calls ComplianceEngine before transfer)

## BAS Contract Addresses
- BSC Testnet BAS: `0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD`
- BSC Testnet Schema Registry: `0x08C8b8417313fF130526862f90cd822B55002D72`

## Hackathon
- **Event:** RWA Demo Day (DoraHacks)
- **Deadline:** March 31, 2026 16:59 UTC
- **Pitch:** April 8, 2026
- **Prizes:** $10K cash + $100K ICC incubation
- **Requirement:** Deploy on BNB Chain for cash prizes

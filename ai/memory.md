# Verigate — AI Memory

## Phase 1 Gate (MUST PASS BEFORE ANY OTHER WORK)
Core Action: Transfer of an RWA token gets blocked because recipient lacks a BAS KYC attestation, then succeeds after attestation is added
Success Test: On BSC testnet, call transfer() → reverts → add BAS attestation → call transfer() → succeeds
Min Tech: 3 Solidity contracts (ComplianceToken, ComplianceEngine, CountryModule) + BAS integration, Foundry, BSC testnet
NOT Phase 1: Frontend, pitch deck, tokenomics, multiple compliance modules, governance, token factory

Status: [ ] NOT STARTED

## Hackathon Context
- **Event:** RWA Demo Day (DoraHacks)
- **Deadline:** March 31, 2026 16:59 UTC (submission)
- **Pitch Day:** April 8, 2026 (online Demo Day final)
- **Winners:** April 21, 2026 (HK Web3 Festival)
- **Track:** RWA — single track, pitching competition
- **Prizes:** $10K cash ($5K/$3K/$1Kx2) + $100K ICC incubation + BNB Chain RWA incentive program access
- **Cash prizes require:** Successful deployment on BNB Chain
- **Submission URL:** https://dorahacks.io/hackathon/rwademoday
- **Registration:** https://forms.gle/t87uDXQFspa8tyq36

## Chosen Idea
RWA Compliance Gateway — lightweight, BNB-native compliance middleware for tokenized real-world assets using BAS (BNB Attestation Service)

## Positioning
"Chainlink ACE is the enterprise compliance suite. We're the lightweight, BNB-native toolkit for the next 100 RWA projects entering BNB Chain's incentive program."

## Key Architecture Decisions
1. **BAS for identity** (not custom identity registry, not Chainlink CCID) — BNB Chain native, 40M+ attestations, Sumsub integrated, EAS-forked Solidity interface
2. **ERC-3643 compatible** token interface with transfer restrictions
3. **Modular compliance engine** — issuers register modules, each module checks BAS attestations
4. **BAS Solidity interface:** `getAttestation(bytes32 uid)` returns `Attestation` struct with `data` field (ABI-encoded schema fields). ~5-10K gas per read. Confirmed works from contracts.

## BAS Technical Details
- BSC Mainnet: `0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC`
- BSC Testnet: `0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD`
- Schema Registry Mainnet: `0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa`
- Schema Registry Testnet: `0x08C8b8417313fF130526862f90cd822B55002D72`
- Forked from EAS — same interface: `getAttestation(bytes32)`, `isAttestationValid(bytes32)`
- Attestation struct: uid, schema, time, expirationTime, revocationTime, recipient, attester, revocable, data

## Competitive Landscape
- **Chainlink ACE:** Enterprise-grade, cross-chain, CCID identity, 20+ partners, ERC-3643 Association collab. NOT BNB-native. Requires LINK. Validates our market.
- **Tokeny/ERC-3643:** $28B tokenized on Ethereum, uses ONCHAINID. No BNB Chain deployment.
- **Current BNB Chain RWA projects:** Simple address whitelisting (OpenEden, Matrixdock). Works for primary issuance, breaks for DeFi composability.

## Fatal Flaws (acknowledged)
1. Compliance expertise gap — we enforce, providers configure
2. DeFi-composable RWA market on BSC is emerging, not proven
3. Simple whitelisting works for current products — our value is for secondary trading/DeFi

## Business Model
- Open source contracts (drives adoption)
- Managed compliance deployments ($2-5K/mo per token)
- Enterprise custom modules ($10-50K setup)
- Future: governance token for module curation (ICC helps with timing)

## Judging Panel
HashKey Capital, Fenbushi Capital, Waterdrip Capital, CGV, Web3 Labs, RWA Connect, Nano Labs, BNB Chain

## Required Deliverables
1. Pitch deck (overview, tokenomics, team, roadmap) — mandatory
2. Demo/prototype — highly preferred
3. Project registration on DoraHacks + Google Form

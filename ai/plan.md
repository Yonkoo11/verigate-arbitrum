# Verigate → Robinhood Chain — Winning Plan

**Event:** Arbitrum Open House London Buildathon
**Prizes targeted:** Overall ($40K/$20K/$10K) — the reserved Robinhood Chain slot. Optional: Best Agentic ($15K) via WhaleIndex separately.
**Thesis:** Robinhood Chain exists to host tokenized US equities (TSLA, AMZN). Those are securities — they legally cannot transfer to unverified / sanctioned / non-accredited wallets. Robinhood ships the *assets*; the *composable compliance layer* for the $1M third-party builder fund is missing. **Verigate is that layer.** At least 1 of 3 overall prizes is reserved for Robinhood Chain, and most entrants will build trading toys, not securities-grade infra.

## Pitch
"Compliance layer for tokenized stocks." A tokenized TSLA share reverts when sent to a non-KYC'd or sanctioned wallet, and succeeds once the issuer attests it — on-chain, verifiable, ERC-3643-aligned, reusable by any builder on the chain.

## Deep Integration (load-bearing, the win condition)
- **Robinhood Chain (5/5):** deployed ON it (chainID 46630); gates ITS asset type (a tokenized stock token modeled on TSLA); solves the exact gap its $1M builder fund leaves open. Remove the chain → no demo.
- **Arbitrum / EAS (5/5):** Orbit chain + native **Ethereum Attestation Service** as the identity source on Arbitrum One/Sepolia (`0xbD75f629…c458`). Optional Stylus (Rust) module for gas-cheap compliance compute as the innovation flex.
- One codebase covers BOTH reserved chains (Robinhood Chain + Arbitrum).

## Architecture port (BAS → chain-agnostic attestation)
BAS is a fork of EAS with the identical Solidity interface, so this is a *generalization*, not a rewrite:
1. `IBAS.sol` → `IAttestationRegistry.sol` — keep the EAS-identical `Attestation` struct + `getAttestation`/`isAttestationValid`.
2. NEW `VerigateAttester.sol` — minimal EAS-compatible attester (attest / revoke / getAttestation / isAttestationValid) so the demo is self-contained on Robinhood Chain (canonical EAS likely not deployed there yet) while staying EAS-interface-compatible.
3. Deploy script chain-detects the attestation source:
   - 42161 / 421614 (Arbitrum One / Sepolia) → canonical EAS `0xbD75f629…c458`
   - 46630 (Robinhood Chain testnet) → deploy `VerigateAttester`
4. KYC schema in attestation `data`: `(bytes2 countryCode, bool accredited, uint8 investorType, uint64 kycExpiry)` — modules already decode `data`.

## Build order (core → data → product → polish)

### Phase 0 — Baseline & setup (prove green before touching anything)
- `forge build` + run all 75 tests → confirm green baseline (evidence, not assumption).
- Run `~/System/scripts/hackathon-security-bootstrap.sh` (keys/.gitignore). Verify no `.env` tracked.
- Add Robinhood Chain (46630) + Arbitrum Sepolia network config (RPC, explorer, faucet) to `foundry.toml` + memory. Pull exact RPC/explorer from hackathon resources / docs.chain.robinhood.com (faucet known: faucet.testnet.chain.robinhood.com).
- **Gate:** 75/75 green locally.

### Phase 1 — Chain-agnostic attestation core (the port)
- Generalize interface; ship `VerigateAttester.sol`; update `ComplianceEngine` + 3 modules + Factory + Token to the generic type (mechanical; logic unchanged).
- Keep 75 tests green; add `VerigateAttester` unit tests + a fork/integration test against canonical EAS interface.
- **Gate:** `forge test` green on ported suite (≥ 75, target +~10 new).

### Phase 2 — Deploy to BOTH reserved chains (real, not mocks)
- Deploy script: chain-detect attester; deploy Factory + a demo **tokenized-TSLA** token + all 3 modules.
- Deploy to **Robinhood Chain testnet (46630)** — PRIMARY — and **Arbitrum Sepolia** — second reserved lane.
- Verify contracts on both explorers.
- Run the live success-test on-chain and capture tx hashes:
  - transfer to non-KYC wallet → **reverts** (reason surfaced)
  - issuer attests wallet → transfer **succeeds**
  - sanctioned-country wallet WITH KYC → **reverts**
- **Gate:** on-chain tx hashes proving block → attest → pass on Robinhood Chain.

### Phase 3 — Product complete (judge-facing surface)
- Minimal Next.js demo (existing `app/`) wired to Robinhood Chain: connect wallet → see tokenized TSLA → attempt transfer (revert w/ reason) → issuer attests → retry (success). Real contracts, real testnet, no mocks.
- README rewritten: H1 = "Compliance layer for tokenized stocks"; Robinhood Chain framing; reproduce steps; deployed addresses + explorer links.
- Decide the "smart contract quality" flex: ERC-3643 interface conformance note (safe) and/or one Stylus(Rust) compliance module (stretch).
- **Gate:** live demo URL runs the full flow without login.

### Phase 4 — Polish + communication pack (LAST)
- `/design` pass on the demo UI.
- 2-min Loom (problem → solution → demo → team); thumbnail = demo screenshot.
- Refresh existing pitch deck → Robinhood Chain framing.
- Distribution: post in Arbitrum/Robinhood Chain builder Discord with the live tx + tag (named channel, started before deadline).
- Link tests, slop scrub, sponsor-depth verification.

## Files touched
- `contracts/src/interfaces/IBAS.sol` → `IAttestationRegistry.sol` (rename + generalize)
- NEW `contracts/src/VerigateAttester.sol`
- `contracts/src/ComplianceEngine.sol`, `modules/*.sol`, `RWATokenFactory.sol`, `RWAToken.sol` (interface type + wiring)
- `contracts/script/Deploy.s.sol` (chain detect: EAS vs VerigateAttester; Robinhood/Arb)
- `contracts/test/*` (rename + new attester/fork tests)
- `foundry.toml`, `app/*` (frontend), `README.md`, `ai/memory.md`, `CLAUDE.md`

## Risks (honest)
- **EAS not on Robinhood Chain** → mitigated by shipping `VerigateAttester` (self-contained).
- **Robinhood docs unreachable from here (ECONNREFUSED)** → confirm exact RPC/explorer from hackathon resources or paste via `!`; faucet is known.
- **Real Robinhood stock tokens may be custodial/non-transferable** → frame for the THIRD-PARTY builder ecosystem ($1M fund) building DeFi on those assets, where composable secondary-market compliance is the real gap.
- **Compliance-expertise gap** → we're infra (enforce); issuers / KYC providers configure.

## First execution chunk on approval
Phase 0 → Phase 2 (port + deploy to Robinhood Chain testnet with on-chain proof). That is the load-bearing win; product/polish follow.

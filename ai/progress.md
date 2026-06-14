# Verigate — Progress / Handover

## What this is now
Verigate = **compliance layer for tokenized stocks**, targeting the Arbitrum Open House London
Buildathon (reserved Robinhood Chain prize lane). Ported from the BSC/BAS original to a
chain-neutral, EAS-compatible attestation model. Plan: `ai/plan.md`. Deployments: `ai/deployments.md`.

## Done (verified)
- **Phase 0:** baseline 75/75 tests green; security playbook installed; Robinhood Chain +
  Arbitrum network configs added to `foundry.toml`.
- **Phase 1:** attestation layer ported `IBAS` → `IAttestationRegistry` (chain-neutral, EAS struct
  field order corrected to match canonical EAS). New `VerigateAttester.sol` (EAS-compatible,
  permissioned attester for chains without canonical EAS). **91/91 tests green** (75 + 16 new,
  incl. a full-stack integration test against the real attester).
- **Phase 2 (partial):** deployed live to **Arbitrum Sepolia** + proved the core flow on-chain
  (block → attest → transfer-succeeds, plus the KYC'd-but-sanctioned-jurisdiction block). All
  addresses + tx hashes in `ai/deployments.md`.

## Blocked / needs user
- **Robinhood Chain deploy** needs the deployer funded from the faucet
  (`https://faucet.testnet.chain.robinhood.com`, address `0xf9946775891a24462cD4ec885d0D4E2675C84355`,
  currently 0 ETH). RPC confirmed live: `https://rpc.testnet.chain.robinhood.com` (chainId 46630).
- **Arbiscan verification** needs `ARBISCAN_API_KEY` (free) for verified source on the explorer.

## Next
- Phase 2 finish: fund + deploy + prove on Robinhood Chain (the reserved-prize chain).
- Phase 3: frontend demo wired to the live contracts + README rewrite (H1 "compliance layer for
  tokenized stocks") + verified contracts.
- Phase 4: design polish, 2-min Loom, deck refresh, distribution.

## Key facts
- Deployer: `0xf9946775891a24462cD4ec885d0D4E2675C84355` (key in env `DEPLOYER_PRIVATE_KEY`; never read/print it).
- KYC schema: `(uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry)`,
  schema id = keccak256("verigate.kyc.v1").
- Canonical EAS (Arbitrum): `0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458` — pass via env
  `ATTESTATION_REGISTRY` to use instead of deploying VerigateAttester.
- Gotcha: in forge scripts, don't interleave `canTransfer` view reads between broadcast txs
  (simulation snapshot mismatch); `SeedDemo.s.sol` is now broadcast-clean.

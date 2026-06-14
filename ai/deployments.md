# Covenant Deployments

Brand: **Covenant** (formerly Verigate). Contract suite: `CovenantAttester` + RWAToken/ComplianceEngine/Factory/modules.
KYC schema: `covenant.kyc.v1` = `0xfb4a89a14c77aac2b47fb0af09a36501ec9a789f4afb78002f34ee6f23bea75b`.
Deployer: `0xf9946775891a24462cD4ec885d0D4E2675C84355`

## Robinhood Chain testnet (chainId 46630) — LIVE + VERIFIED + proven (RESERVED PRIZE CHAIN)

- RPC: `https://rpc.testnet.chain.robinhood.com` · Explorer: https://explorer.testnet.chain.robinhood.com

| Contract | Address |
|----------|---------|
| CovenantAttester (registry) | `0x70E72995Eabaf8b920063C8257690084A2387405` |
| RWATokenFactory | `0x41404B1e68614698af7837b82264A46BAf470923` |
| RWAToken "Tokenized TSLA" (tTSLA) | `0x477f2a84503d6b8eefae021a5d94d0a8cdb9c74a` |
| ComplianceEngine | `0x52e21af43035ce398dddd1aa6e75cea3a1f0c776` |
| CountryRestriction (module) | `0xfD17A992a812c308AaAE97e5C506541AC82e21eb` |

All 4 core contracts **source-verified** on the Robinhood Chain Blockscout explorer (`is_verified: true`).

### On-chain proof of the core flow
1. **Blocked** (unattested): `canTransfer` → `false, "recipient has no attestation"`
2. **Attest** investor (US/accredited): tx `0x3026e7393a9ccf31780f26c2e5808da8f87c64ad30dc1b547cf98618a3d55eca`
   - uid `0x11d77ae7e4d8f1f80a1910eca26dad6489a1f360c90bdb0e013c72fcc5dbaee3`
3. **Map UID**: tx `0x84f46abcd8ae8670ddeb335b916d033d2844357401590afcf1b04dca374e9df1`
4. **Transfer succeeds** (100 tTSLA): tx `0x01dcb2525eda220f168aa3b5e41a21f81aed57d4c31fe82e05a3982ad8fe6203` (status 0x1)
   - investor `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` balance = 100 tTSLA

## Arbitrum Sepolia (chainId 421614) — LIVE (secondary)

| Contract | Address |
|----------|---------|
| CovenantAttester (registry) | `0xE8682ca1cE90A6be3BD91A01Bf3e39c19543521A` |
| RWATokenFactory | `0x68a8809E118E6C778D199e0Dc7586AC88589b708` |
| RWAToken (tTSLA) | `0x24Fdb5FC17759027E75417882835382C564DED30` |
| ComplianceEngine | `0x197ABA2FadAF09309175f5fbCbbB4e495F1F82c7` |

Explorer base: https://sepolia.arbiscan.io

## Deploy notes
- forge 1.4.4 `forge script --broadcast` rejects Robinhood Chain (46630) with "Chain not supported" (unlisted-chain regression). Workaround used: `forge create` (deploy attester + factory) + `cast send factory.deploy(...)` + `cast` seed/proof. `forge create` needs `--broadcast` placed BEFORE the variadic `--constructor-args`. Arb Sepolia deploys fine via `forge script`.
- Production config can point `ATTESTATION_REGISTRY` at canonical EAS on Arbitrum One (`0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`) instead of deploying CovenantAttester — same `IAttestationRegistry` interface (identical EAS struct layout).

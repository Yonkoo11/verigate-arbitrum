# Covenant Deployments

Brand: **Covenant** (formerly Verigate). Contract suite: `CovenantAttester` + RWAToken/ComplianceEngine/Factory/modules.
KYC schema: `covenant.kyc.v1` = `0xfb4a89a14c77aac2b47fb0af09a36501ec9a789f4afb78002f34ee6f23bea75b`.
Deployer: `0xf9946775891a24462cD4ec885d0D4E2675C84355`

## Robinhood Chain testnet (chainId 46630) — LIVE + VERIFIED + proven (RESERVED PRIZE CHAIN)

- RPC: `https://rpc.testnet.chain.robinhood.com` · Explorer: https://explorer.testnet.chain.robinhood.com

| Contract | Address |
|----------|---------|
| CovenantAttester (registry) | `0x68126baf9f282f91b9080c71aDa7e469d2e5E4D6` |
| RWATokenFactory | `0x52FB7D121e576D8B0b06dD6fcA6C3D7454e7bf5C` |
| RWAToken "Tokenized TSLA" (tTSLA) | `0x8341dee3cfaab93cf2557176e4ebfd6844933798` |
| ComplianceEngine | `0x4b3ea101e35860a3b995a67d9d1e412da5271cf5` |
| CountryRestriction (module) | `0xE077550E3bD210EA9165bDAADdF6ecD7eF52567F` |

All 4 core contracts **source-verified** on the Robinhood Chain Blockscout explorer (`is_verified: true`).

### On-chain proof of the core flow
1. **Blocked** (unattested): `canTransfer` → `false, "recipient has no attestation"`
2. **Attest** investor (US/accredited): tx `0x8081abfb0fed665b25df3ed074b3da500f76292233ec1b8bbebb2e0992192280`
   - uid `0x33ca9ffcb50d8f8eeb8f40982d4cd59f22eb9080d0b11e4b77cf3f6b0961b2a2`
3. **Map UID**: tx `0xb0121ba1049ac78abe52e8e1ffc92180d05da55f9e654d61baa4e454641a6b7d`
4. **Transfer succeeds** (100 tTSLA): tx `0x0c2aca5f5ab307d59a4011120bed4d6a9486de36ea5df3cfc26f8040cde5e2bd` (status 0x1)
   - investor `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` balance = 100 tTSLA

## Arbitrum Sepolia (chainId 421614) — LIVE (secondary)

| Contract | Address |
|----------|---------|
| CovenantAttester (registry) | `0x4d5B1316367B85a2EaDCCd1c4F1a17A6AcF58118` |
| RWATokenFactory | `0xFd5ba528ff12493b14217f274c3a2ED34104a0ca` |
| RWAToken (tTSLA) | `0x2604e651c97E5852b7C9A8120150eB2119d80c9C` |
| ComplianceEngine | `0x79C2329BEe1d9FE83a55d65723c8C61f638cf602` |

Explorer base: https://sepolia.arbiscan.io

## Deploy notes
- forge 1.4.4 `forge script --broadcast` rejects Robinhood Chain (46630) with "Chain not supported" (unlisted-chain regression). Workaround used: `forge create` (deploy attester + factory) + `cast send factory.deploy(...)` + `cast` seed/proof. `forge create` needs `--broadcast` placed BEFORE the variadic `--constructor-args`. Arb Sepolia deploys fine via `forge script`.
- Production config can point `ATTESTATION_REGISTRY` at canonical EAS on Arbitrum One (`0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`) instead of deploying CovenantAttester — same `IAttestationRegistry` interface (identical EAS struct layout).

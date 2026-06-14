# Verigate Deployments

## Arbitrum Sepolia (chainId 421614) — LIVE, proven on-chain

Deployer: `0xf9946775891a24462cD4ec885d0D4E2675C84355`
Explorer base: https://sepolia.arbiscan.io

| Contract | Address |
|----------|---------|
| VerigateAttester (registry) | `0xb300221352f952F53546C191FF4F3ABd6A8cfcB2` |
| RWATokenFactory | `0xb7aA5e6490E4C9d7643dCf5A363283D9B1a90E09` |
| RWAToken "Tokenized TSLA" (tTSLA) | `0x2c71154782DEe9989Fa6B1dC859Cd962403C7540` |
| ComplianceEngine | `0x2B612Bc199457b602Ec72990568Af12a501287Ef` |
| Modules | CountryRestriction + AccreditedInvestor + MaxHolders (deployed by factory, attached to engine) |

### On-chain proof of the core compliance flow (real tx hashes)
1. **Blocked** (investor unattested): `canTransfer` → `false, "CountryRestriction: recipient has no attestation"` (view)
2. **Attest** investor (US / accredited): tx `0xbe7f0c71b2dba678749fd4f83b342abd3aea8e5ee451da0917c7f2343f0888b6`
   - attestation uid `0xa791ae07be495671e1ba9e35ffc61b1475870cb406575034b3dd65889c6c11b9`
3. **Map UID** in engine: tx `0xd8b199382f889be9730f20206380fb3246241fa0b997fa2a1b45ca303a4b4c85`
4. **Transfer succeeds** (100 tTSLA → investor): tx `0xe76d3df15eda5d44bdf5e42d79e6ccb2dc603545ed900077b449cae120cc144c` (status 0x1)
   - investor `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` balance = 100 tTSLA
5. **Sanctioned-jurisdiction block** (KYC'd but country = KP): attest tx mapped via `0xc2de5cc7bd9a2769fc72f84ed5921edc371e935684720c387cf4ff473a6151a9`;
   `canTransfer` → `false, "CountryRestriction: recipient country is restricted"` — i.e. valid KYC is NOT sufficient; jurisdiction is enforced. (This is what static allowlists can't express.)

## Robinhood Chain testnet (chainId 46630) — LIVE, proven on-chain (RESERVED PRIZE CHAIN)

- RPC (verified, returns 0xb626): `https://rpc.testnet.chain.robinhood.com`
- Explorer: https://explorer.testnet.chain.robinhood.com (Blockscout-style)
- Faucet: https://faucet.testnet.chain.robinhood.com
- Deployer: `0xf9946775891a24462cD4ec885d0D4E2675C84355`

| Contract | Address |
|----------|---------|
| VerigateAttester (registry) | `0xf35bE6FFEBF91AcC27A78696cf912595C6b08AAA` |
| RWATokenFactory | `0xd2cad31A080b0daE98d9d6427e500B50bCb92774` |
| RWAToken "Tokenized TSLA" (tTSLA) | `0x128D9Eb78c93d4f56c21aA1523AB404a952C9DAa` |
| ComplianceEngine | `0xF492900C1f41C3E0d4bc7aF50A069B24b40A2Ac3` |

All four contracts above are **source-verified** on the Robinhood Chain Blockscout explorer (`is_verified: true`).

### On-chain proof (real tx hashes)
1. **Blocked** (unattested): `canTransfer` → `false, "recipient has no attestation"`
2. **Attest** investor (US/accredited): tx `0x5d73531a8e0f1622124af9787b6098ad920a9e092fd0e113f0c9a86cc77b0873`
   - uid `0x6ddca1285bd28431af9a331a1f6ec597ce4ec88873e62b52a5e481764193fe2f`
3. **Map UID**: tx `0xfbbe3da2ddc366d3da0af121fe335106d44a1a6255f6e7c3db729d2b41997c2b`
4. **Transfer succeeds** (100 tTSLA): tx `0xc2468eb3b4f77567e599505b4d88b9c84ffd3098654295e04418f0410d42056f` (status 0x1)
   - investor `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` balance = 100 tTSLA

## Reusing the issuer onboarding script
`OnboardInvestor.s.sol` issues + maps a KYC attestation in one run (write-only, broadcasts cleanly):
```
REGISTRY=.. ENGINE=.. INVESTOR=0x.. COUNTRY=US ACCREDITED=true \
  forge script script/OnboardInvestor.s.sol --rpc-url <rpc> --broadcast --slow
```
NOTE: do the actual blocked→pass *transfer* proof with `cast` (separately mined txs). forge's
broadcast pre-simulation can't see an attestation written earlier in the same run, so a script that
attests then transfers in one run reverts in simulation even though the on-chain logic is correct.

## Notes
- Contract source verification on Arbiscan pending (needs `ARBISCAN_API_KEY` in env). Robinhood Chain uses a Blockscout explorer (`--verifier blockscout`).
- Production config can point `ATTESTATION_REGISTRY` at canonical EAS on Arbitrum One (`0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`) instead of deploying VerigateAttester — the contracts read both through `IAttestationRegistry` (identical EAS struct layout).

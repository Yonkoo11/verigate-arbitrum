# The compliance layer for tokenized stocks

**Covenant** makes a tokenized equity refuse to move to a wallet that isn't allowed to hold it — and move freely once it is. It's the missing securities-compliance layer for [Robinhood Chain](https://docs.robinhood.com/chain) and any Arbitrum chain putting real-world assets on-chain.

> Built for the Arbitrum Open House London Buildathon. Live on **Robinhood Chain testnet** and **Arbitrum Sepolia**.

---

## The problem

Robinhood Chain exists to host tokenized US equities (TSLA, AMZN) and other RWAs. But a tokenized share is a **security** — by law it cannot trade to an un-KYC'd wallet, a sanctioned jurisdiction, or (for many offerings) a non-accredited investor. The chain ships the *assets*; every third-party builder on its $1M developer fund still has to solve *compliance* themselves. Static address allow-lists break the moment a token touches secondary trading or DeFi.

Covenant is the reusable, composable answer: attestation-based, modular, [ERC-3643](https://www.erc3643.org/)-aligned transfer compliance that any issuer can deploy in one transaction.

## How it works

Every transfer of an `RWAToken` is checked by a **ComplianceEngine** that iterates pluggable modules. Each module reads the sender/recipient's **on-chain KYC attestation** to decide.

```
transfer() ─▶ ComplianceEngine.canTransfer()
                 ├─ CountryRestriction   (jurisdiction allowed?)
                 ├─ AccreditedInvestor   (accredited where required?)
                 └─ MaxHolders           (under the holder cap?)
                         ▲
                 IAttestationRegistry  ◀── CovenantAttester (bundled, EAS-compatible)
                                        └── or canonical EAS on Arbitrum One
```

Attestations are read through `IAttestationRegistry`, whose `Attestation` struct is **byte-for-byte identical to the Ethereum Attestation Service (EAS)**. On chains where EAS isn't deployed yet (like Robinhood Chain testnet) Covenant ships its own `CovenantAttester` — a permissioned, EAS-compatible registry where only vetted KYC providers may issue attestations. On Arbitrum One you point the same contracts at canonical EAS (`0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`) with zero code change.

**No valid attestation = no transfer.** Valid KYC in the *wrong jurisdiction* is still no transfer — that's the part allow-lists can't express.

## Live deployments (proven on-chain)

### Robinhood Chain testnet — chainId 46630
| Contract | Address |
|---|---|
| CovenantAttester | [`0x68126baf…5E4D6`](https://explorer.testnet.chain.robinhood.com/address/0x68126baf9f282f91b9080c71aDa7e469d2e5E4D6) |
| RWAToken (Tokenized TSLA / tTSLA) | [`0x8341dee3…933798`](https://explorer.testnet.chain.robinhood.com/address/0x8341dee3cfaab93cf2557176e4ebfd6844933798) |
| ComplianceEngine | [`0x4b3ea101…271cf5`](https://explorer.testnet.chain.robinhood.com/address/0x4b3ea101e35860a3b995a67d9d1e412da5271cf5) |
| RWATokenFactory | [`0x52FB7D12…e7bf5C`](https://explorer.testnet.chain.robinhood.com/address/0x52FB7D121e576D8B0b06dD6fcA6C3D7454e7bf5C) |

All 4 contracts are **source-verified** on the explorer. On-chain proof of the core flow: transfer **blocked** (no attestation) → **attest** ([`0x8081abfb…`](https://explorer.testnet.chain.robinhood.com/tx/0x8081abfb0fed665b25df3ed074b3da500f76292233ec1b8bbebb2e0992192280)) → **transfer succeeds** ([`0x0c2aca5f…`](https://explorer.testnet.chain.robinhood.com/tx/0x0c2aca5f5ab307d59a4011120bed4d6a9486de36ea5df3cfc26f8040cde5e2bd)).

### Arbitrum Sepolia — chainId 421614
tTSLA [`0x2604e651…d80c9C`](https://sepolia.arbiscan.io/address/0x2604e651c97E5852b7C9A8120150eB2119d80c9C) · Engine [`0x79C2329B…8cf602`](https://sepolia.arbiscan.io/address/0x79C2329BEe1d9FE83a55d65723c8C61f638cf602) · Attester [`0x4d5B1316…F58118`](https://sepolia.arbiscan.io/address/0x4d5B1316367B85a2EaDCCd1c4F1a17A6AcF58118)

Full address + tx list in [`ai/deployments.md`](ai/deployments.md).

## Demo

```bash
cd app && bun install && bun run dev   # http://localhost:3000
```
Connect an injected wallet on Robinhood Chain testnet. As an investor you'll see a transfer **denied**. As the issuer, verify the investor (one click → `attest` + map the UID). The same transfer now **passes**. Pick a sanctioned country (KP/IR/SY) when verifying to watch it stay blocked even with valid KYC.

## Contracts

```bash
cd contracts
forge test                    # 97 passing (75 core + 16 attester + 6 security-fix regression tests)
forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.chain.robinhood.com --broadcast --slow
```
The KYC schema is `(uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry)`. To use canonical EAS instead of the bundled attester, set `ATTESTATION_REGISTRY=0xbD75f629…c458` before deploying.

## Project layout

```
contracts/   Foundry — ComplianceEngine, RWAToken, 3 modules, CovenantAttester, scripts, 91 tests
app/         Next.js 14 + wagmi v2 demo wired to the live contracts
ai/          plan, deployments (addresses + tx hashes), progress
```

## License

MIT — see [LICENSE](LICENSE). Open-source so the next 100 RWA issuers on Robinhood Chain don't rebuild compliance from scratch.

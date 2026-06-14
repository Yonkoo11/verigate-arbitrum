# The compliance layer for tokenized stocks

**Verigate** makes a tokenized equity refuse to move to a wallet that isn't allowed to hold it — and move freely once it is. It's the missing securities-compliance layer for [Robinhood Chain](https://docs.robinhood.com/chain) and any Arbitrum chain putting real-world assets on-chain.

> Built for the Arbitrum Open House London Buildathon. Live on **Robinhood Chain testnet** and **Arbitrum Sepolia**.

---

## The problem

Robinhood Chain exists to host tokenized US equities (TSLA, AMZN) and other RWAs. But a tokenized share is a **security** — by law it cannot trade to an un-KYC'd wallet, a sanctioned jurisdiction, or (for many offerings) a non-accredited investor. The chain ships the *assets*; every third-party builder on its $1M developer fund still has to solve *compliance* themselves. Static address allow-lists break the moment a token touches secondary trading or DeFi.

Verigate is the reusable, composable answer: attestation-based, modular, [ERC-3643](https://www.erc3643.org/)-aligned transfer compliance that any issuer can deploy in one transaction.

## How it works

Every transfer of an `RWAToken` is checked by a **ComplianceEngine** that iterates pluggable modules. Each module reads the sender/recipient's **on-chain KYC attestation** to decide.

```
transfer() ─▶ ComplianceEngine.canTransfer()
                 ├─ CountryRestriction   (jurisdiction allowed?)
                 ├─ AccreditedInvestor   (accredited where required?)
                 └─ MaxHolders           (under the holder cap?)
                         ▲
                 IAttestationRegistry  ◀── VerigateAttester (bundled, EAS-compatible)
                                        └── or canonical EAS on Arbitrum One
```

Attestations are read through `IAttestationRegistry`, whose `Attestation` struct is **byte-for-byte identical to the Ethereum Attestation Service (EAS)**. On chains where EAS isn't deployed yet (like Robinhood Chain testnet) Verigate ships its own `VerigateAttester` — a permissioned, EAS-compatible registry where only vetted KYC providers may issue attestations. On Arbitrum One you point the same contracts at canonical EAS (`0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458`) with zero code change.

**No valid attestation = no transfer.** Valid KYC in the *wrong jurisdiction* is still no transfer — that's the part allow-lists can't express.

## Live deployments (proven on-chain)

### Robinhood Chain testnet — chainId 46630
| Contract | Address |
|---|---|
| VerigateAttester | [`0xf35bE6FF…08AAA`](https://explorer.testnet.chain.robinhood.com/address/0xf35bE6FFEBF91AcC27A78696cf912595C6b08AAA) |
| RWAToken (Tokenized TSLA / tTSLA) | [`0x128D9Eb7…C9DAa`](https://explorer.testnet.chain.robinhood.com/address/0x128D9Eb78c93d4f56c21aA1523AB404a952C9DAa) |
| ComplianceEngine | [`0xF492900C…A2Ac3`](https://explorer.testnet.chain.robinhood.com/address/0xF492900C1f41C3E0d4bc7aF50A069B24b40A2Ac3) |
| RWATokenFactory | [`0xd2cad31A…92774`](https://explorer.testnet.chain.robinhood.com/address/0xd2cad31A080b0daE98d9d6427e500B50bCb92774) |

On-chain proof of the core flow: transfer **blocked** (no attestation) → **attest** ([`0x5d73531a…`](https://explorer.testnet.chain.robinhood.com/tx/0x5d73531a8e0f1622124af9787b6098ad920a9e092fd0e113f0c9a86cc77b0873)) → **transfer succeeds** ([`0xc2468eb3…`](https://explorer.testnet.chain.robinhood.com/tx/0xc2468eb3b4f77567e599505b4d88b9c84ffd3098654295e04418f0410d42056f)).

### Arbitrum Sepolia — chainId 421614
tTSLA [`0x2c711547…C7540`](https://sepolia.arbiscan.io/address/0x2c71154782DEe9989Fa6B1dC859Cd962403C7540) · Engine [`0x2B612Bc1…1287Ef`](https://sepolia.arbiscan.io/address/0x2B612Bc199457b602Ec72990568Af12a501287Ef) · Attester [`0xb3002213…cfcB2`](https://sepolia.arbiscan.io/address/0xb300221352f952F53546C191FF4F3ABd6A8cfcB2)

Full address + tx list in [`ai/deployments.md`](ai/deployments.md).

## Demo

```bash
cd app && bun install && bun run dev   # http://localhost:3000
```
Connect an injected wallet on Robinhood Chain testnet. As an investor you'll see a transfer **denied**. As the issuer, verify the investor (one click → `attest` + map the UID). The same transfer now **passes**. Pick a sanctioned country (KP/IR/SY) when verifying to watch it stay blocked even with valid KYC.

## Contracts

```bash
cd contracts
forge test                    # 91 passing (75 core + 16 attester incl. a full-stack integration test)
forge script script/Deploy.s.sol --rpc-url https://rpc.testnet.chain.robinhood.com --broadcast --slow
```
The KYC schema is `(uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry)`. To use canonical EAS instead of the bundled attester, set `ATTESTATION_REGISTRY=0xbD75f629…c458` before deploying.

## Project layout

```
contracts/   Foundry — ComplianceEngine, RWAToken, 3 modules, VerigateAttester, scripts, 91 tests
app/         Next.js 14 + wagmi v2 demo wired to the live contracts
ai/          plan, deployments (addresses + tx hashes), progress
```

## License

MIT — see [LICENSE](LICENSE). Open-source so the next 100 RWA issuers on Robinhood Chain don't rebuild compliance from scratch.

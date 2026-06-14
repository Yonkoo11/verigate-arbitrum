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
| CovenantAttester | [`0x70E72995…87405`](https://explorer.testnet.chain.robinhood.com/address/0x70E72995Eabaf8b920063C8257690084A2387405) |
| RWAToken (Tokenized TSLA / tTSLA) | [`0x477f2a84…b9c74a`](https://explorer.testnet.chain.robinhood.com/address/0x477f2a84503d6b8eefae021a5d94d0a8cdb9c74a) |
| ComplianceEngine | [`0x52e21af4…f0c776`](https://explorer.testnet.chain.robinhood.com/address/0x52e21af43035ce398dddd1aa6e75cea3a1f0c776) |
| RWATokenFactory | [`0x41404B1e…470923`](https://explorer.testnet.chain.robinhood.com/address/0x41404B1e68614698af7837b82264A46BAf470923) |

All 4 contracts are **source-verified** on the explorer. On-chain proof of the core flow: transfer **blocked** (no attestation) → **attest** ([`0x3026e739…`](https://explorer.testnet.chain.robinhood.com/tx/0x3026e7393a9ccf31780f26c2e5808da8f87c64ad30dc1b547cf98618a3d55eca)) → **transfer succeeds** ([`0x01dcb252…`](https://explorer.testnet.chain.robinhood.com/tx/0x01dcb2525eda220f168aa3b5e41a21f81aed57d4c31fe82e05a3982ad8fe6203)).

### Arbitrum Sepolia — chainId 421614
tTSLA [`0x24Fdb5FC…4DED30`](https://sepolia.arbiscan.io/address/0x24Fdb5FC17759027E75417882835382C564DED30) · Engine [`0x197ABA2F…1F82c7`](https://sepolia.arbiscan.io/address/0x197ABA2FadAF09309175f5fbCbbB4e495F1F82c7) · Attester [`0xE8682ca1…43521A`](https://sepolia.arbiscan.io/address/0xE8682ca1cE90A6be3BD91A01Bf3e39c19543521A)

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
contracts/   Foundry — ComplianceEngine, RWAToken, 3 modules, CovenantAttester, scripts, 91 tests
app/         Next.js 14 + wagmi v2 demo wired to the live contracts
ai/          plan, deployments (addresses + tx hashes), progress
```

## License

MIT — see [LICENSE](LICENSE). Open-source so the next 100 RWA issuers on Robinhood Chain don't rebuild compliance from scratch.

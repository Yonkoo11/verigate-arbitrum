# Verigate

Lightweight, BNB-native compliance middleware for tokenized real-world assets. Uses [BAS (BNB Attestation Service)](https://www.bnbattest.io/) for identity verification and modular compliance rules.

## How It Works

Every transfer of an RWA token is checked against a **ComplianceEngine** that iterates registered modules. Each module reads the sender/recipient's **BAS attestation** to verify compliance (country restrictions, accredited investor status, holder caps).

```
Transfer → ComplianceEngine → [CountryRestriction] → [AccreditedInvestor] → [MaxHolders] → Allowed/Blocked
                                      ↓                       ↓                    ↓
                                  BAS Attestation         BAS Attestation     Holder Count
```

**No attestation = no transfer.** The issuer maps wallet addresses to BAS attestation UIDs. KYC providers (Sumsub, Blockpass — already BAS partners) issue the attestations.

## Deployed Contracts (BSC Testnet)

| Contract | Address |
|----------|---------|
| RWATokenFactory | [`0x60aa76...52B5`](https://testnet.bscscan.com/address/0x60aa769416EfBbc0A6BC9cb454758dE6f76D52B5) |
| RWAToken (VGATE) | [`0xE7f32b...A711`](https://testnet.bscscan.com/address/0xE7f32bcBCDBBEf25900d5f9545C20CFC2d61A711) |
| ComplianceEngine | [`0x5Bf71E...Dba7`](https://testnet.bscscan.com/address/0x5Bf71EEdA3CA10ae52de3eA4aeA4b14b9d0FDba7) |
| CountryRestriction | [`0x742D04...41f8`](https://testnet.bscscan.com/address/0x742D04D05f303Cb95E805Fb6B8A6C5035e6c41f8) |
| AccreditedInvestor | [`0x77C3c5...D26`](https://testnet.bscscan.com/address/0x77C3c50106c84585d6242Cb44876aDE3a445ED26) |
| MaxHolders | [`0xE5c838...1424`](https://testnet.bscscan.com/address/0xE5c8383bBDbf1767D285e12eAAB32038Fe6A1424) |

**Live Demo:** [yonkoo11.github.io/verigate](https://yonkoo11.github.io/verigate/)

BAS Schema UID: `0xa72370606965bcdb25a1930828933a52fdcb9c2c59742c2806b5af35d4e87989`

## Architecture

```
contracts/
├── src/
│   ├── interfaces/
│   │   ├── IBAS.sol              # BAS interface (EAS-compatible)
│   │   └── IComplianceModule.sol # Module interface
│   ├── modules/
│   │   ├── CountryRestriction.sol  # Block sanctioned jurisdictions
│   │   ├── AccreditedInvestor.sol  # Require accredited status
│   │   └── MaxHolders.sol          # Cap holder count (SEC 12g-1)
│   ├── ComplianceEngine.sol  # Modular rule engine + BAS attestation mapping
│   ├── RWAToken.sol          # ERC-20 with compliance hooks
│   └── RWATokenFactory.sol   # One-tx deployment with all modules
├── test/                     # 75 tests
└── script/                   # Foundry deploy scripts

app/                          # Next.js frontend (wagmi + viem)
```

## Smart Contract Design

**RWAToken** — Standard ERC-20 with a compliance hook in `_update()`. Every transfer (except mint/burn) calls `ComplianceEngine.canTransfer()`. The issuer can pause, freeze addresses, and force-transfer for regulatory recovery.

**ComplianceEngine** — Iterates registered `IComplianceModule` contracts. Maps wallet addresses to BAS attestation UIDs. Modules read attestation data to enforce rules.

**Modules** — Each implements `checkCompliance()`:
- **CountryRestriction** — Decodes country code from BAS attestation, checks against blocklist. Optionally checks sender too.
- **AccreditedInvestor** — Verifies accredited status from BAS attestation. Configurable to check sender, recipient, or both.
- **MaxHolders** — Tracks distinct holder count, blocks transfers that would exceed the cap.

**RWATokenFactory** — Deploys token + engine + selected modules in one transaction. Configures modules and transfers ownership to the issuer.

## Running Locally

### Contracts

```bash
cd contracts
forge install
forge test    # 75 tests
```

### Frontend

```bash
cd app
bun install
cp .env.example.local .env.local   # Already populated with BSC testnet addresses
bun run dev
```

Open http://localhost:3000, connect MetaMask to BSC Testnet.

## BAS Integration

The compliance schema: `uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry`

Attestations are created by KYC providers on BAS, then mapped to wallet addresses by the token issuer via `ComplianceEngine.setAttestationUID()`.

BAS contracts (BSC Testnet):
- BAS: `0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD`
- Schema Registry: `0x08C8b8417313fF130526862f90cd822B55002D72`

## Tech Stack

- Solidity 0.8.24 + Foundry
- OpenZeppelin Contracts
- BNB Attestation Service (BAS)
- Next.js 14 + wagmi v2 + viem
- Tailwind CSS

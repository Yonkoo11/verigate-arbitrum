# Verigate — DoraHacks Submission

## BUIDL Page Content

### Title
Verigate — Compliance Middleware for Tokenized RWA on BNB Chain

### One-Liner
Verify before you transfer. BNB-native compliance layer using BAS attestations for tokenized real-world assets.

### Description (paste into DoraHacks)

Verigate is a lightweight, open-source compliance middleware for tokenized real-world assets on BNB Chain. It uses the BNB Attestation Service (BAS) for on-chain identity verification, enabling modular transfer restrictions that work for both primary issuance and DeFi composability.

**The Problem**
BNB Chain has $3B in tokenized RWA but no native compliance standard. Existing projects use simple address whitelisting, which breaks for secondary trading, DeFi collateral, and cross-protocol composability. Meanwhile, Tokeny's ERC-3643 lives on Ethereum and Chainlink ACE is enterprise-grade and chain-agnostic — neither is BNB-native.

**The Solution**
Verigate provides modular compliance modules that check BAS attestations on every token transfer:

- **CountryRestriction** — blocks transfers to/from sanctioned jurisdictions
- **AccreditedInvestor** — verifies accredited investor status
- **MaxHolders** — caps holder count (SEC Rule 12g-1 compliance)

One schema, one attestation, access to every compliant RWA token on BSC. KYC once, hold anything.

**Architecture**
- ERC-3643-compatible token with compliance hooks in every transfer
- ComplianceEngine iterates registered modules, each reads BAS attestations
- RWATokenFactory deploys compliant tokens with selected modules in one transaction
- 75 passing Foundry tests, Slither analysis clean, 4 bugs found and fixed via manual audit

**BNB Chain Native**
- Built on BAS (BNB Attestation Service) — not Chainlink CCID, not ONCHAINID
- Schema registered on BAS testnet, attestations created and verified on-chain
- Phase 1 Gate passed: transfer blocked without attestation → attestation added → transfer succeeds

### Links

- **Live Demo:** https://yonkoo11.github.io/verigate/
- **GitHub:** https://github.com/Yonkoo11/verigate
- **Factory (verified on BSCScan):** https://testnet.bscscan.com/address/0x60aa769416EfBbc0A6BC9cb454758dE6f76D52B5
- **Token (VGATE):** https://testnet.bscscan.com/address/0xE7f32bcBCDBBEf25900d5f9545C20CFC2d61A711
- **ComplianceEngine:** https://testnet.bscscan.com/address/0x5Bf71EEdA3CA10ae52de3eA4aeA4b14b9d0FDba7

### Tags
RWA, BNB Chain, BAS, Compliance, ERC-3643, Tokenization, DeFi

### Tech Stack
Solidity 0.8.24, Foundry, OpenZeppelin, BNB Attestation Service, Next.js, wagmi, viem

---

## Google Form Fields (https://forms.gle/t87uDXQFspa8tyq36)

Fill in with:
- **Project Name:** Verigate
- **Description:** Compliance middleware for tokenized RWA on BNB Chain using BAS attestations
- **Website/Demo:** https://yonkoo11.github.io/verigate/
- **GitHub:** https://github.com/Yonkoo11/verigate
- **Stage:** Early stage (no TGE, no funding)
- **Track:** RWA
- **Deployed on BNB Chain:** Yes (BSC Testnet)

---

## Submission Checklist

- [ ] DoraHacks BUIDL page created
- [ ] Google Form submitted
- [ ] Pitch deck attached (PDF)
- [ ] GitHub repo is public
- [ ] Live demo URL works
- [ ] Contracts verified on BSCScan
- [ ] README has setup instructions

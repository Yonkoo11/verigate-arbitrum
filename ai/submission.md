# Covenant — Submission

**Tagline:** The compliance layer for tokenized stocks.

**One-liner:** Covenant makes a tokenized equity refuse to move to a wallet that isn't allowed to hold it — and settle instantly once it is. It's the missing securities-compliance layer for Robinhood Chain and any Arbitrum RWA chain.

## Links
- **Live demo (no login):** https://yonkoo11.github.io/verigate-arbitrum/
- **Repo:** https://github.com/Yonkoo11/verigate-arbitrum
- **Live on Robinhood Chain testnet (46630)** — 4 source-verified contracts:
  - CovenantAttester `0x68126baf9f282f91b9080c71aDa7e469d2e5E4D6`
  - RWAToken (tTSLA) `0x8341dee3cfaab93cf2557176e4ebfd6844933798`
  - ComplianceEngine `0x4b3ea101e35860a3b995a67d9d1e412da5271cf5`
  - RWATokenFactory `0x52FB7D121e576D8B0b06dD6fcA6C3D7454e7bf5C`
  - Explorer: https://explorer.testnet.chain.robinhood.com
- **Also live on Arbitrum Sepolia (421614).** Full address + tx list: `ai/deployments.md`.
- **On-chain proof:** transfer blocked → attest (`0x8081abfb…`) → transfer settles (`0x0c2aca5f…`, status 0x1).

## The problem
Robinhood Chain exists to host tokenized US equities (TSLA, AMZN). But a tokenized share is a **security** — by law it cannot transfer to an un-KYC'd wallet, a sanctioned jurisdiction, or a non-accredited investor. The chain ships the *assets*; every builder on its $1M developer fund still has to solve *compliance* themselves, and static address allow-lists break the moment a token touches secondary trading or DeFi.

## The solution
Covenant enforces KYC / jurisdiction / accreditation rules **at the token itself** via a modular `ComplianceEngine`. Each transfer is gated against on-chain KYC attestations read through `IAttestationRegistry` — whose `Attestation` struct is byte-for-byte identical to the Ethereum Attestation Service, so the same contracts read canonical EAS on Arbitrum One or the bundled `CovenantAttester` on chains where EAS isn't deployed yet (like Robinhood Chain). Valid KYC in the *wrong jurisdiction* is still no transfer — the part allow-lists can't express. ERC-3643-aligned; one-transaction deploy via the factory.

## Why it wins on each judging criterion
- **Smart contract quality / minimal vulnerabilities:** 97 passing Foundry tests; a 12-agent security audit was run and **all five findings fixed with regression tests** (`ai/security-review.md`) before redeploying; all contracts source-verified on the explorer.
- **Product-market fit:** the exact gap Robinhood Chain's builder ecosystem leaves open — every tokenized-securities issuer needs this and can't ship without it.
- **Innovation & creativity:** a *live compliance-gate verdict* (the UI reads `canTransfer` as you type), an on-chain KYC *credential card* decoded from the attestation, and an EAS-compatible attester that works on brand-new chains.
- **Real problem solving:** securities transfer-restriction is a legal hard requirement, not a nice-to-have.

## Reserved-prize alignment
Built squarely for the **Robinhood Chain** reserved overall-prize lane (tokenized securities = mandatory compliance), and deployed on **Arbitrum** as well. EAS-compatible so it drops onto Arbitrum One mainnet with zero code change.

## Tech
Solidity (Foundry) · Robinhood Chain (Arbitrum Orbit) + Arbitrum Sepolia · EAS-compatible attestations · Next.js 14 + wagmi v2 frontend · all reads live from the deployed contracts.

## Media (all hosted, no login)
- **Demo video (60s, live on-chain walkthrough):** https://yonkoo11.github.io/verigate-arbitrum/covenant-demo.mp4
- **Pitch deck (web):** https://yonkoo11.github.io/verigate-arbitrum/deck/
- **Pitch deck (PDF, for attachment):** `deck/covenant-deck.pdf`

---
### Submission checklist
- [x] Public repo + OSI LICENSE (MIT) + README with reproduce steps
- [x] Live demo URL accessible without login
- [x] Deployed + source-verified on an Arbitrum chain (Robinhood Chain + Arb Sepolia)
- [x] On-chain proof of the core flow (tx hashes)
- [x] Security review performed + all findings fixed (97 tests)
- [x] Demo video built + hosted (live blocked→verify→settle on the real contracts)
- [x] Pitch deck (Covenant branding, web + PDF)
- [ ] **Submitted on the HackQuest buildathon page** (needs your login)
- [ ] *Optional:* upload the video to YouTube unlisted (some judges prefer an inline player; the Pages mp4 above works as-is)

---
### HackQuest form — paste-ready fields
- **Project name:** Covenant
- **Tagline:** The compliance layer for tokenized stocks.
- **Short description:** Covenant makes a tokenized equity refuse to move to a wallet that isn't allowed to hold it, and settle instantly once it is. The missing securities-compliance layer for Robinhood Chain and any Arbitrum RWA chain.
- **Tracks to apply for:** Robinhood Chain (reserved overall lane) + Arbitrum. (Not Best Agentic — Covenant has no agent; do not claim that lane.)
- **GitHub:** https://github.com/Yonkoo11/verigate-arbitrum
- **Live demo:** https://yonkoo11.github.io/verigate-arbitrum/
- **Video:** https://yonkoo11.github.io/verigate-arbitrum/covenant-demo.mp4
- **Chain / deployment:** Robinhood Chain testnet (46630, Arbitrum Orbit) + Arbitrum Sepolia (421614); 4 source-verified contracts (addresses above).
- **Tech stack:** Solidity (Foundry), EAS-compatible attestations, Next.js 14 + wagmi v2.

### Only you can do (I can't)
1. Log in to HackQuest and submit the form with the fields above.
2. Confirm the exact submission deadline on your dashboard (the public page showed a near-zero countdown).
3. (Optional) Upload the video to YouTube unlisted and swap that URL into the Video field.

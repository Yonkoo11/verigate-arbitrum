# Arbitrum Mentorship Program -- Application Answers

Copy each answer into the corresponding Tally form field.
Form: https://tally.so/r/aQdj2W

---

# PAGE 1

## Contact Full Name
Fagbenro Mustapha

## Email
alexmustapha11@gmail.com

## Contact Telegram Account
THaFa_11

## Company/Project Name
Verigate

## What are you building? (max 50 chars)
Compliance middleware for tokenized securities

## How would you classify the project primarily?
> Select: RWAs

## Website URL
https://yonkoo11.github.io/verigate-arbitrum/

## Github
https://github.com/Yonkoo11/verigate-arbitrum

## X/Twitter URL
https://x.com/soligxbt

## Project stage
> Select: Very early (<6 months live on testnet/mainnet)

## Current status & state in 6 months

We have a working compliance engine on testnet. 7 Solidity contracts, 75 tests, all passing. The engine is modular: token issuers register compliance rules (country restrictions, accredited investor verification, holder caps) and every transfer checks the recipient's on-chain attestation before it goes through. No attestation, no transfer.

We built this on BNB Chain for a hackathon but we're moving to Arbitrum. The attestation layer we use (BAS) was forked from EAS, so migration is straightforward. Same interface, same struct layout, different contract address.

6 months from now: deployed on Arbitrum One mainnet, integrated with at least 2 RWA issuers, and working with the Robinhood Chain team on compliance modules for tokenized equities. The goal is to become the default compliance layer for tokenized securities on Arbitrum.

## Expected mainnet launch time
> Select: Expected within 6 months

## Arbitrum alignment
> Select: Committed to launching on Arbitrum

---

# PAGE 2

## Number of founders/contributors
> Select: 1

## Region
> Select: Africa

## Founding team

I've been writing Solidity professionally for the past year, mostly security work. Auditing contracts, writing fuzz tests, breaking things. Shipped 5 projects in the last 2 months across different hackathons, each one deployed to a live testnet with real tests, not just a demo.

The most relevant one is Verigate itself. 7 contracts, 75 tests, on-chain attestation integration, currently in the finals for RWA Demo Day (pitching April 8 to HashKey Capital, Fenbushi Capital, and Waterdrip Capital). Before that I built an exploit detection pipeline and a private batch auction DEX using FHE on Initia.

I test everything I ship. Fuzz tests, integration tests, actual testnet deployments. If it hasn't been verified on-chain, it's not done.

GitHub: https://github.com/Yonkoo11
X: https://x.com/soligxbt

## Top 3 Successes to Date

1. Built Verigate's compliance engine from scratch: 7 contracts, 75 tests, attestation-verified transfer restrictions working on testnet. Got selected for RWA Demo Day finals out of the applicant pool. Pitching to HashKey, Fenbushi, and Waterdrip on April 8.

2. Built an exploit detection pipeline that monitors on-chain events and correlates hacks with sector exposure in real time. Successfully flagged the OHM and REI exploits during testing before they hit crypto twitter.

3. Shipped a private batch auction DEX on Initia L1 with FHE-encrypted orders. 270+ batches settled on a live rollup. Full infrastructure: sequencer, settler, frontend, the whole stack.

## Commitment
> Select: Full-time

## Additional comments

Couple things that might not be obvious from the form.

The BNB Chain to Arbitrum migration is basically a config swap. BAS (BNB Attestation Service) was literally forked from EAS. Same getAttestation() interface, same Attestation struct, same validation logic. I built on BNB because the RWA Demo Day hackathon required it, not because I'm married to the chain. Arbitrum is where the tokenized securities ecosystem is actually forming, especially with Robinhood Chain coming online.

What I'm looking for from the mentorship is pretty specific: I need to talk to the people building tokenized equities on Arbitrum. The compliance engine works. Transfer restrictions work. Attestation verification works. What I don't know yet is exactly what compliance modules RWA issuers on Arbitrum actually need. Country restrictions and accredited investor checks are table stakes. But do they need lock-up periods? Dividend compliance? Transfer agent reporting? Those conversations would shape the next 6 months of the product more than any amount of coding.

---

# PAGE 3

## Terms & Conditions
> Check the agreement box

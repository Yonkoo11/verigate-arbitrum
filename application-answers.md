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
N/A

## Github
https://github.com/Yonkoo11/verigate-arbitrum

## X/Twitter URL
https://x.com/soligxbt

## Project stage
> Select: Very early (<6 months live on testnet/mainnet)

## Current status & state in 6 months

7 contracts deployed on BSC testnet with 75 tests passing. Modular compliance engine where issuers plug in rules (country restrictions, accredited investor checks, holder caps). Each rule reads from on-chain attestations to verify recipients before transfers go through. Migrating to Arbitrum now since BAS is a direct fork of EAS, same interface. In 6 months: live on Arbitrum One mainnet with 2+ RWA issuers using the compliance engine. Targeting integration with Robinhood Chain's tokenized equities.

## Expected mainnet launch time
> Select: Expected within 6 months

## Arbitrum alignment
> Select: Committed to launching on Arbitrum

---

# PAGE 2

## Number of founders/contributors
> Select: 1

## Geographic region
[FILL IN YOURSELF]

## Founding team details (relevant social media links and previous experience)

Solo builder. Security auditing background (Solidity, Foundry, Slither). Shipped 5 projects in 2 months across hackathons. Most relevant: Verigate for RWA Demo Day, 7 contracts, 75 tests, BAS attestation integration, selected for final pitch April 8 to HashKey, Fenbushi, and Waterdrip Capital. Also built exploit detection tooling and a private batch auction DEX with FHE-encrypted orders on Initia. I write tests before I write features and I deploy to testnets before I call anything done.

GitHub: https://github.com/Yonkoo11
X: https://x.com/soligxbt

## Top 3 successes

1. Verigate compliance engine: 7 contracts, 75 tests, BAS-verified transfer restrictions on BSC testnet. Selected for RWA Demo Day finals, pitching April 8 to HashKey Capital, Fenbushi Capital, Waterdrip Capital.

2. Exploit-to-alert detection pipeline that flags on-chain hacks and correlates with sector exposure. Caught OHM and REI exploits correctly in testing.

3. Private batch auction DEX with FHE-encrypted orders on Initia L1. 270+ batches settled, full rollup infrastructure running.

## Commitment level
> Select: Full-time (40+ hours per week)

## Additional comments

Two things worth knowing.

The migration from BSC to Arbitrum is almost trivial. BAS is a fork of EAS. Same Solidity interface, same attestation struct, same function signatures. The only real changes are contract addresses and chain config. I picked BNB Chain originally because a hackathon required it. Arbitrum is the right long-term home because of Robinhood Chain and the broader tokenized securities ecosystem forming here.

What I actually need from the mentorship: introductions to RWA issuers building on Arbitrum (especially the Robinhood Chain team), and guidance on the legal side of compliance middleware. The code works. The open question is whether issuers want a modular open-source compliance layer or if they'll each roll their own whitelists. Talking to the people actually building tokenized equities on Arbitrum would answer that fast.

---

# PAGE 3

## Terms & Conditions
> Check the agreement box

# Arbitrum Mentorship Program — Application Answers

Copy each answer into the corresponding Tally form field.
Form: https://tally.so/r/aQdj2W

---

## Company/project name

Verigate

## Brief description (max 50 characters)

Compliance middleware for tokenized securities

## Project classification

RWAs

## Current development stage

> Pick: "3-6 months of development"

## Current state and 6-month projections

We have 7 Solidity contracts (Foundry, 75 tests passing) handling transfer restrictions for tokenized assets. The compliance engine is modular: issuers plug in rules like country restrictions, accredited investor checks, and holder caps. Each rule reads from an on-chain attestation service to verify the recipient before allowing a transfer.

Right now the contracts run on BSC testnet using BNB Attestation Service. We're migrating to Arbitrum because EAS (Ethereum Attestation Service) already lives there and the interface is identical. BAS was literally forked from EAS, so it's a config change, not a rewrite.

In 6 months: contracts deployed on Arbitrum One mainnet with at least 2 live RWA issuers using the compliance engine. Integration with Robinhood Chain's tokenized equities is the target. We want to be the compliance layer that makes their securities transfers legal.

## Mainnet launch timeline

> Pick: "Within the next 3-6 months"

## Arbitrum alignment status

> Pick: "Committed to building on Arbitrum"

## Number of founders/contributors

> Pick: "1"

## Founding team details (relevant social media links and previous experience)

Solo builder. Background in security auditing (Solidity, Foundry, Slither). Built and submitted projects across 5 hackathons in the past 2 months. Most relevant: Verigate for RWA Demo Day (7 contracts, 75 tests, BAS attestation integration, selected for final pitch on April 8). Also shipped exploit detection tools and DeFi protocol monitoring.

I build fast and I test everything. The contracts have fuzz testing and I actually run the success test on a live testnet before calling anything done.

## Top 3 successes

1. Verigate compliance engine: 7 contracts, 75 tests, BAS-verified transfer restrictions working on BSC testnet. Selected for RWA Demo Day finals (pitching April 8 to HashKey, Fenbushi, Waterdrip Capital).

2. Built exploit-to-alert detection that flags on-chain hacks and correlates them with sector exposure. Catches real events (OHM, REI exploits flagged correctly in testing).

3. Shipped a private batch auction DEX with FHE-encrypted orders on Initia L1. 270+ batches settled, full rollup infrastructure running. Different chain, same principle: if you can build infra that works, the chain doesn't matter.

## Commitment level

> Pick: "Full-time (40+ hours per week)"

## Additional comments

Two things worth knowing:

First, the migration from BSC to Arbitrum is almost trivial. BAS is a fork of EAS. Same Solidity interface, same attestation struct, same function signatures. The only changes are contract addresses and chain config. I picked BNB Chain originally because a hackathon required it. Arbitrum is the right long-term home because of Robinhood Chain and the broader tokenized securities ecosystem forming here.

Second, what I actually need from the mentorship: introductions to RWA issuers building on Arbitrum (especially the Robinhood Chain team), and guidance on the legal side of compliance middleware. The code works. The open question is whether issuers want a modular open-source compliance layer or if they'll each roll their own whitelists. Talking to the people building tokenized equities on Arbitrum would answer that fast.

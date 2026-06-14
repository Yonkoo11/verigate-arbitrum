# Covenant — Security Review

A 12-agent parallel security audit (Opus) was run over the full contract suite, findings were gate-validated, and **all five were fixed with regression tests before redeploying the verified contracts.**

## Findings & fixes

| # | Finding | Severity | Fix | Test |
|---|---------|----------|-----|------|
| 1 | `MaxHolders` holder-count corruption — zero-value transfers register phantom (0-balance) holders; decrement could underflow; module swap desyncs the count | High (permissionless DoS) | Guard increment on `!isHolder[to]` and decrement on `isHolder[from]`; `RWAToken._update` skips the holder callback when `amount == 0`; `setMaxHoldersModule` is single-set | `test_F1_zeroValueNoPhantomHolder`, `test_F1_setMaxHoldersModuleSingleSet` |
| 2 | Attestation never bound to the wallet it gates — modules read `att.data` but never check `att.recipient`, so one attestation can whitewash any wallet | High | Each module requires `att.recipient == wallet` before trusting the payload | `test_F2_recipientMismatchRejected` |
| 3 | Unguarded `abi.decode` — a malformed/foreign-schema attestation reverts the transfer, freezing the wallet | Medium | Guard `att.data.length >= 160` and return non-compliant instead of reverting | `test_F3_malformedDataDoesNotRevert` |
| 4 | Schema-embedded `expiry` field ignored — only registry `expirationTime` was honored, so stale KYC could pass forever | Medium | Decode and enforce the schema `expiry` field | `test_F4_schemaExpiryEnforced` |
| 5 | Owner could not revoke a compromised attester's attestations — only the original attester could | Medium | `revoke` now allows the original attester **or** the registry owner | `test_F5_ownerCanRevoke` |

Leads recorded (not fixed — by-design or latent): `forceTransfer` intentionally bypasses the cap (regulatory recovery); empty-blocklist `CountryRestriction` is a no-op by design; `refUID` unvalidated (no consumer yet); `removeModule` swap-pop emits a stale index (off-chain indexers should re-fetch `getModules()`).

## Assurance
- **97/97 tests pass** (75 core + 16 attester + 6 new security-fix regression tests).
- No fund-theft path; owner functions have correct access control.
- Fixed contracts redeployed and **source-verified** on Robinhood Chain (see `ai/deployments.md`).

> AI-assisted review — does not prove the absence of vulnerabilities. Independent review + bug bounty recommended before mainnet.

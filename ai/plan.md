# Verigate — Build Plan

## Build Order (enforced)
1. Core action works end-to-end (contracts deploy, transfer blocked/allowed based on BAS attestation)
2. Data flows correctly (real BAS attestation on BSC testnet, not mocks)
3. Product complete (all submission-required features: contracts + demo frontend + pitch deck)
4. Visual polish LAST

---

## Phase 1: Smart Contracts (Core Action)

### Step 1.1: Foundry Project Setup
- Init Foundry project in `contracts/`
- Add OpenZeppelin as dependency
- Configure for BSC testnet (chain ID 97)
- Create BAS interface (IBAS.sol) matching EAS-forked contract

### Step 1.2: BAS Interface + Schema
```
IBAS.sol — Interface to query BAS attestations
- getAttestation(bytes32 uid) → Attestation struct
- isAttestationValid(bytes32 uid) → bool

RWAComplianceSchema:
- kycLevel: uint8 (0=none, 1=basic, 2=enhanced)
- country: bytes2 (ISO 3166-1 alpha-2)
- accredited: bool
- investorType: uint8 (0=retail, 1=professional, 2=institutional)
- expiry: uint64
```

### Step 1.3: Compliance Engine
```
ComplianceEngine.sol
- Manages list of compliance modules per token
- canTransfer(from, to, amount) → bool (iterates modules)
- addModule(IComplianceModule module)
- removeModule(IComplianceModule module)
- Owner: token issuer
```

### Step 1.4: Compliance Modules (start with 1, add 2 more after Phase 1 gate passes)
```
Module 1: CountryRestriction.sol
- Issuer sets blocked country codes
- On transfer: read recipient's BAS attestation → decode country → check against blocklist
- If no attestation or expired → block

Module 2: AccreditedInvestor.sol (Phase 2)
- Check BAS attestation accredited field = true

Module 3: MaxHolders.sol (Phase 2)
- Count current holders, block if cap reached
```

### Step 1.5: Compliant RWA Token
```
RWAToken.sol (ERC-20 + compliance hook)
- Standard ERC-20 (mint, burn, transfer, approve)
- Before transfer: call ComplianceEngine.canTransfer()
- Issuer functions: pause, freeze address, force transfer (recovery)
- NOT full ERC-3643 (too complex for Phase 1) — compatible interface, simpler internals
```

### Step 1.6: Tests
```
test/RWAToken.t.sol
- Test: transfer blocked when recipient has no attestation
- Test: transfer succeeds when recipient has valid attestation
- Test: transfer blocked when recipient's country is blocked
- Test: transfer blocked when attestation expired
- Test: issuer can freeze/unfreeze address
- Test: issuer can force transfer (recovery)
```

### Step 1.7: Deploy to BSC Testnet
- Deploy BAS schema (register our RWACompliance schema)
- Deploy ComplianceEngine
- Deploy CountryRestriction module
- Deploy RWAToken pointing to ComplianceEngine
- Create test attestation using BAS SDK
- Execute the core flow: transfer blocked → add attestation → transfer succeeds

### Phase 1 Gate Check
- [ ] Contracts compile
- [ ] All tests pass
- [ ] Deployed on BSC testnet
- [ ] Core flow works: transfer() reverts → BAS attestation added → transfer() succeeds

---

## Phase 2: Additional Modules + Frontend Demo

### Step 2.1: AccreditedInvestor module
### Step 2.2: MaxHolders module
### Step 2.3: Token Factory (deploy new compliant tokens in one tx)

### Step 2.4: Frontend Demo
Simple Next.js app that shows:
1. Connect wallet
2. See RWA token balance
3. Try to transfer → fails (show "Compliance check failed: no KYC attestation")
4. Show BAS attestation status
5. After attestation exists → transfer succeeds
6. Issuer panel: add/remove compliance modules, set country restrictions

Tech: Next.js, wagmi, viem, BNB Chain testnet

---

## Phase 3: Pitch Deck + Submission

### Pitch Deck (7 slides)
1. **Problem:** $3B RWA on BNB Chain, no compliance standard. Simple whitelisting breaks for DeFi composability.
2. **Solution:** Lightweight compliance middleware using BAS. 3 lines to add compliance to any RWA token.
3. **How it works:** Architecture diagram (Token → Compliance Engine → BAS)
4. **Market:** BNB Chain RWA growing $1B/quarter. $100M incentive program bringing new issuers. HK SFC 2026 legislation creates compliance demand.
5. **Business model:** OSS contracts free. Managed deployments $2-5K/mo. Enterprise custom $10-50K.
6. **Tokenomics:** No token at launch. Future governance token for module curation. ICC helps with timing.
7. **Team + Roadmap:** Q2 2026 testnet + first 3 issuers. Q3 mainnet. Q4 cross-chain (opBNB).

### Submission Checklist
- [ ] DoraHacks BUIDL page created with description, demo, repo link
- [ ] Google Form submitted (https://forms.gle/t87uDXQFspa8tyq36)
- [ ] Pitch deck PDF attached
- [ ] Demo video or live demo URL
- [ ] Contracts verified on BSC testnet explorer
- [ ] README with setup instructions

---

## Phase 4: Polish (ONLY after Phase 3 complete)
- Frontend visual cleanup
- Demo video recording
- Additional compliance modules
- Documentation

---

## NOT Building
- Full ERC-3643 (12+ contracts) — too complex, interface-compatible subset instead
- Cross-chain anything — BNB Chain only for now
- Governance — premature
- Token — premature
- ONCHAINID — using BAS instead
- Mobile — web only

## Key Risk
BAS testnet may not have the same attestation creation flow as mainnet. If we can't create test attestations via BAS SDK on testnet, we may need to mock the BAS interface for demo purposes. This is acceptable for a pitch competition but should be disclosed.

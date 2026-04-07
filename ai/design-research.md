# Design Research Brief: Verigate

## Product Category
RWA compliance middleware — sits between tokenization platforms and regulators. The UI needs to convey: trust, authority, precision, institutional quality. NOT: DeFi degen, hacker, gaming.

## Comparables Studied

### 1. Securitize (securitize.io)
- Market leader, $1B+ tokenized
- Design: enterprise-grade, clean minimalism, institutional photography
- Couldn't extract detailed design (JS-heavy rendering)

### 2. Centrifuge (centrifuge.io)
- Layout: modular full-width sections, container-based
- Colors: sophisticated neutral base, warm gradient accent (#ffc012 → #ffad60), muted blues for focus
- Typography: Inter Tight (primary) + Pathway Extreme (emphasis), weights 300-700
- Cards: minimal borders, subtle shadows, hover scale transforms
- Buttons: warm gradient backgrounds, rounded 0.62rem, dark text
- Motion: cubic-bezier(0.25, 0.8, 0.25, 1), 300ms transitions, testimonial carousels
- Trust signals: partner logos (Janus Henderson, MakerDAO), live TVL metrics, C-level quotes
- Signature: warm amber/gold gradient = money/value (not blue!)

### 3. Chainalysis (chainalysis.com)
- Layout: mega-menu navigation, organized by product category
- Colors: deep charcoal/navy backgrounds, white layouts, strategic accent CTAs
- Trust signals: "1,500 customers", institutional logos (IRS, BNY Mellon), concrete data ("34B frozen")
- Cards: subtle shadows, generous whitespace
- Signature: authority through restraint — deliberately boring in the best way
- Key insight: compliance products MUST look serious, not exciting

### 4. Linear (linear.app)
- THE benchmark for dark mode craft
- Colors: near-black background, 4-level text hierarchy (primary/secondary/tertiary/quaternary), desaturated accents
- Typography: 9-level type scale with individual letter-spacing and line-height per level
- Motion: 2800-3200ms step-based animations (meditative, not snappy), purposeful state transitions
- Panels: layered via color shifts, NOT borders. Elements defined by spatial relationships.
- Buttons: semantic color inheritance, no visible borders, background contrast defines them
- Signature: monochrome sophistication — expensive-feeling restraint
- Key insight: "premium dark mode = desaturated colors + generous whitespace + obsessive typography"

### 5. Ondo Finance (ondo.finance)
- The RWA standard judges will compare us against
- Colors: white/off-white primary, soft pastels (#E0ECFF, #FFECE2, #EBF0E7) for card differentiation
- Typography: sans-serif system fonts, medium weight, conservative hierarchy
- Financial data: TVL prominent, APY with methodology footnotes, chain breakdowns
- Cards: flat with light background variation, NO drop shadows
- Buttons: dark background/light text, generous padding
- Motion: minimal — video hero, carousels, no parallax or flashy transitions
- Signature: deliberately looks like a wealth management firm, not a crypto project
- Trust: footnoted data methodologies, comprehensive legal disclaimers
- Key insight: RWA = traditional finance aesthetic, not crypto aesthetic

## Common Patterns (table stakes):

1. **Monochrome/neutral base** with ONE warm accent for value/money (gold/amber, not blue)
2. **Typography hierarchy** with at least 4 distinct levels, sans-serif, medium weights
3. **Generous whitespace** — compliance = serious = breathing room
4. **Live metrics** displayed prominently (TVL, attestation count, compliance checks)
5. **Subtle depth** — background shifts, not harsh borders or heavy shadows
6. **Restrained motion** — slow, purposeful transitions, nothing flashy
7. **Institutional trust signals** — partner logos, concrete data, regulatory language

## Differentiation Opportunities:

1. **None of them do dark mode well for RWA** — Ondo/Centrifuge are light-only. Linear's dark craft applied to RWA would be unique.
2. **Compliance status visualization** — none of them show real-time compliance checks visually. We can make the "blocked/allowed" flow feel tangible.
3. **BAS attestation as a visual element** — verified identity as a first-class UI concept, not hidden in settings.
4. **The "gate" metaphor** — Verigate = verify + gate. The UI can embody this: clear before/after states, a visual threshold that data crosses.

## Design Constraints:

- Dark-only (per style config + product identity)
- Must show: token balance, compliance status, transfer form, issuer admin
- Must communicate: this is institutional-grade infrastructure, not a hackathon project
- Data density: moderate — dashboard with 4-5 panels, not a dense trading terminal

## Anti-patterns (from comparables — must avoid):

1. **Blue-purple gradients** — screams "AI generated crypto project" (our current sin)
2. **Identical card grids** — every panel looks the same (our current sin)
3. **Neon accent colors** — Chainalysis and Ondo deliberately avoid these
4. **Busy animations** — compliance = calm, not exciting
5. **Generic SaaS badges/pills** — colored status dots that could be from any app
6. **Dense data tables** — this isn't a trading terminal

## Stolen Elements (adopt and adapt):

1. **From Centrifuge:** Warm amber/gold as the value/money accent color (not blue)
2. **From Linear:** 4-level text hierarchy with desaturated colors, panel definition via background shifts not borders
3. **From Chainalysis:** Trust through restraint — let the data speak, minimal decoration
4. **From Ondo:** Footnoted precision for financial data, soft pastel differentiation for card types
5. **From Linear:** Monospace for addresses/hashes, proportional for prose — never mix

## Product Metaphor (per design lessons Rule 1)

**The metaphor is: a security checkpoint.**

Not a bouncer at a club (aggressive). Not a bank vault (cold). A modern airport security gate — calm, efficient, visible scanning process, clear pass/fail, you know exactly where you stand.

- **Shape language:** Clean horizontal lines (the gate barrier), clear zones (before/after the check)
- **Color meaning:**
  - Warm white/cream on dark = trust, transparency, institutional calm
  - Emerald green = verified, cleared, compliant
  - Warm amber = value flowing, money, tokens
  - Soft red = blocked, restricted, needs attention (never alarming, just informative)
  - Cool gray progression = structure, hierarchy, depth
- **Motion:** Smooth, horizontal transitions (passing through the gate), status changes are decisive not animated
- **Density:** Moderate — enough whitespace to feel institutional, enough data to feel useful

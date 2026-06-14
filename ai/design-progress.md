# Design Progress: Verigate

started: 2026-06-14 (Arbitrum Open House revamp; supersedes 2026-03-31 BSC design)
style_config: ~/.claude/style.config.md (cites Verigate as a reference)
color_mode: dark-only — compliance/securities product where warm-charcoal + serif IS the identity
flags: (entered via /design after /ui-revamp; Phases 1-4 already satisfied)

phase_0: completed
phase_1: completed (state implicit — contracts + reads define the data model)
state_design_output: lib/contracts.ts + on-chain reads

phase_1.5: skipped — direction already validated against style config (institutional fintech: Securitize/Stripe/Linear tier); regenerating would discard working integration
phase_2: completed (frontend-design revamp — role-separated, verdict-centric)
phase_3: completed (single locked direction; institutional-fintech)

phase_4: completed (ui-revamp full 4-phase, run twice)
audit_result: pass (0 genuine hard-rule violations)
issues_fixed: button press states, sharp-radius unification, type-scale snaps, disabled state, primary-card hierarchy, hero refinement

phase_5: completed
qa_result: APPROVED
qa_notes: |
  Hard gates: min-font-size PASS (all sub-12px labels bumped to 12), AI-slop PASS (none),
  micro-interactions PASS (hover+active+focus+cubic-bezier), liveness PASS for an institutional
  product (amber wash raised to 0.09 >= floor; primary-card glow 0.30, gate-dot glow 0.35; live
  debounced verdict is the ambient element). Noise textures / breathing animations intentionally
  omitted per style config ("clean over busy, craft over flash", no decorative elements) and the
  securities-compliance tone. Most-used body size is 13px (dense financial data) — above the
  <=12 hard-fail floor; accepted as a density choice, not broken.

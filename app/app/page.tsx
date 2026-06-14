import Link from "next/link";
import { CHAIN_EXPLORER, addresses } from "@/lib/contracts";

/* CV Covenant wordmark */
function Wordmark() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span className="cv-mark">CV</span>
      <span className="cv-name">Covenant</span>
    </span>
  );
}

function GateSection() {
  return (
    <>
      <div className="gate-caption">The same transfer, two recipients</div>
      <div className="gate-hero">
        {/* LEFT: Denied zone */}
        <div className="gate-hero-denied">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 24 }}>
            Without verification
          </span>
          <div style={{ width: 44, height: 44, border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 6l8 8M14 6l-8 8" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, color: "var(--text-3)", lineHeight: 1.2, marginBottom: 14 }}>
            Transfer reverted
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 380, lineHeight: 1.6 }}>
            The recipient holds no KYC attestation, so the token refuses to move.
          </p>
          <div style={{ marginTop: 32, padding: "14px 16px", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            {[["Status", "REVERTED", true], ["Module", "CountryRestriction", false], ["Reason", "Recipient has no attestation", false]].map(([label, value, isRed], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 24, padding: "7px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label as string}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: isRed ? "var(--red)" : "var(--text-3)" }}>{value as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GATE LINE */}
        <div className="gate-line">
          <div className="gate-line-bar" />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--amber)", boxShadow: "0 0 20px rgba(154,107,30,0.30)", zIndex: 1 }} />
          <span className="gate-label">Covenant</span>
        </div>

        {/* RIGHT: Approved zone */}
        <div className="gate-hero-approved">
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--amber-glow), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--amber)", opacity: 0.7, marginBottom: 24, display: "block" }}>
              With verification
            </span>
            <div style={{ width: 44, height: 44, border: "1px solid var(--green-border)", background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10l4 4 6-7" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.2, marginBottom: 14 }}>
              Transfer settles
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-2)", maxWidth: 340, lineHeight: 1.6 }}>
              Every module passes: jurisdiction, accreditation, holder cap. The share moves on-chain.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const PROOF = [
  { label: "RWA token (tTSLA)", addr: addresses.rwaToken },
  { label: "Compliance engine", addr: addresses.complianceEngine },
  { label: "Country restriction", addr: addresses.countryRestriction },
  { label: "Attestation registry", addr: addresses.registry },
];

export default function Landing() {
  return (
    <div>
      {/* NAV */}
      <nav className="lp-nav">
        <Wordmark />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
          <Link href="/integrate" className="btn btn-ghost btn-sm">Docs</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Launch app</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-intro">
        <div className="hero-eyebrow">Securities compliance · Robinhood Chain testnet</div>
        <h1 className="hero-title">Compliance, enforced at the token.</h1>
        <p className="hero-sub">
          Covenant is the on-chain compliance layer for tokenized stocks. A tokenized share
          rejects any transfer to an unverified, sanctioned, or non-accredited wallet, and
          settles instantly for verified ones.
        </p>
        <div className="hero-cta">
          <Link href="/dashboard" className="btn btn-primary">Launch app</Link>
          <a className="btn btn-ghost" href={`${CHAIN_EXPLORER}/address/${addresses.rwaToken}`} target="_blank" rel="noopener noreferrer">
            View the live contract
          </a>
        </div>
        <div className="hero-meta">
          <span><strong style={{ color: "var(--text-2)", fontWeight: 500 }}>Tokenized TSLA</strong> live on-chain</span>
          <span className="hero-dot" />
          <span>4 verified contracts</span>
          <span className="hero-dot" />
          <span>ERC-3643-aligned</span>
        </div>
      </section>

      {/* GATE DEMONSTRATION */}
      <GateSection />

      {/* THE PROBLEM */}
      <section className="lp-band" style={{ padding: "var(--sp-16) 0" }}>
        <div className="lp-section">
          <div className="section-eyebrow">The problem</div>
          <h2 className="section-title">A tokenized stock is a bearer asset. Securities law is not.</h2>
          <p className="section-lead">
            Move a tokenized equity to the wrong wallet — an unverified holder, a sanctioned
            jurisdiction, a non-accredited buyer — and the issuer is the one in breach. Bolt-on
            allowlists drift out of sync and live off-chain, where they can&apos;t actually stop a
            transfer. Compliance has to be enforced where settlement happens: in the token itself.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-band" style={{ padding: "var(--sp-16) 0" }}>
        <div className="lp-section">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Every transfer runs the gate before it settles.</h2>
          <div className="lp-flow" style={{ margin: "var(--sp-8) 0 var(--sp-10)" }}>
            <span className="lp-flow-node">transfer()</span>
            <span className="lp-flow-arrow">→</span>
            <span className="lp-flow-node">ComplianceEngine.canTransfer</span>
            <span className="lp-flow-arrow">→</span>
            <span className="lp-flow-node">modules</span>
            <span className="lp-flow-arrow">→</span>
            <span className="lp-flow-node">KYC attestation</span>
          </div>
          <div className="lp-grid-3">
            <div className="lp-step">
              <div className="lp-step-num">01</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text-1)", marginBottom: 8 }}>Token calls the engine</div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
                The RWA token hooks every transfer into <span className="mono">ComplianceEngine.canTransfer(from, to, amount)</span> before any balance changes.
              </p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">02</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text-1)", marginBottom: 8 }}>Modules vote</div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
                Country restriction, accredited-investor, and holder-cap modules each check the parties. Any failure reverts with a reason.
              </p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">03</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text-1)", marginBottom: 8 }}>Attestations decide</div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6 }}>
                Verification comes from on-chain KYC attestations in an EAS-compatible registry — the same primitive ERC-3643 issuers already trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="lp-band" style={{ padding: "var(--sp-16) 0" }}>
        <div className="lp-section">
          <div className="section-eyebrow">Live &amp; proven on Robinhood Chain</div>
          <h2 className="section-title">Four contracts, deployed and verifiable.</h2>
          <p className="section-lead" style={{ marginBottom: "var(--sp-8)" }}>
            This isn&apos;t a mock. The token, engine, country module, and attestation registry are
            live on Robinhood Chain testnet. Open any of them on the explorer.
          </p>
          <div className="proof-grid">
            {PROOF.map((p) => (
              <a key={p.addr} href={`${CHAIN_EXPLORER}/address/${p.addr}`} target="_blank" rel="noopener noreferrer" className="proof-row" style={{ textDecoration: "none" }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{p.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--amber)" }}>{p.addr.slice(0, 6)}…{p.addr.slice(-4)} ↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text-3)" }}>
          Covenant — Compliance layer for tokenized stocks · Robinhood Chain
        </span>
        <div style={{ display: "flex", gap: "var(--sp-6)" }}>
          <a href="https://github.com/Yonkoo11/verigate-arbitrum" target="_blank" rel="noopener noreferrer" className="mono-link">GitHub</a>
          <a href={CHAIN_EXPLORER} target="_blank" rel="noopener noreferrer" className="mono-link">Explorer</a>
          <Link href="/integrate" className="mono-link">Docs</Link>
        </div>
      </footer>
    </div>
  );
}

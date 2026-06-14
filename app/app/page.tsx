"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useChainId, useSwitchChain, useReadContract } from "wagmi";
import { robinhoodChain } from "@/app/providers";
import { CHAIN_EXPLORER, addresses, rwaTokenAbi } from "@/lib/contracts";
import { InvestorView } from "@/components/InvestorView";
import { IssuerConsole } from "@/components/IssuerConsole";

function GateHero() {
  const { connect, connectors } = useConnect();
  const onConnect = () => connectors[0] && connect({ connector: connectors[0], chainId: robinhoodChain.id });
  return (
    <div>
      {/* INTRO — value proposition leads */}
      <section className="hero-intro">
        <div className="hero-eyebrow">Securities compliance · Robinhood Chain testnet</div>
        <h1 className="hero-title">Compliance, enforced at the token.</h1>
        <p className="hero-sub">
          Verigate is the on-chain compliance layer for tokenized stocks. A tokenized share
          rejects any transfer to an unverified, sanctioned, or non-accredited wallet, and
          settles instantly for verified ones.
        </p>
        <div className="hero-cta">
          <button onClick={onConnect} className="btn btn-primary">Connect Wallet</button>
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

      {/* DEMONSTRATION — the signature gate, as live proof */}
      <div className="gate-caption">The same transfer, two recipients</div>
      <div className="gate-hero">
        {/* LEFT: Denied zone */}
        <div className="gate-hero-denied">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 24 }}>
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
          <div style={{ marginTop: 32, padding: "14px 16px", background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)" }}>
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
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--amber)", boxShadow: "0 0 20px rgba(201,165,92,0.35)", zIndex: 1 }} />
          <span className="gate-label">Verigate</span>
        </div>

        {/* RIGHT: Approved zone */}
        <div className="gate-hero-approved">
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--amber-glow), transparent)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--amber)", opacity: 0.7, marginBottom: 24, display: "block" }}>
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

      {/* Hero footer */}
      <footer style={{
        display: "flex", justifyContent: "center", gap: "var(--sp-6)", alignItems: "center",
        padding: "var(--sp-6)", flexWrap: "wrap",
      }}>
        <a href="https://github.com/Yonkoo11/verigate-arbitrum" target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
          GitHub
        </a>
        <a href={CHAIN_EXPLORER} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
          Explorer
        </a>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>
          Built on Robinhood Chain
        </span>
      </footer>
    </div>
  );
}

function WrongChainBanner() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  if (chainId === robinhoodChain.id) return null;
  return (
    <div style={{
      background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)",
      padding: "var(--sp-4)", marginBottom: "var(--sp-6)", display: "flex",
      alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 14, color: "#f59e0b" }}>
        You are connected to the wrong network. Switch to Robinhood Chain to use Verigate.
      </span>
      <button
        onClick={() => switchChain({ chainId: robinhoodChain.id })}
        className="btn btn-primary btn-sm"
        style={{ color: "var(--black)", background: "#f59e0b", flexShrink: 0 }}
      >
        Switch Network
      </button>
    </div>
  );
}

type Role = "investor" | "issuer";

function RoleControl({ role, setRole, isOwner }: { role: Role; setRole: (r: Role) => void; isOwner: boolean }) {
  const tab = (value: Role, label: string, enabled: boolean): React.ReactNode => {
    const active = role === value;
    return (
      <button
        role="tab"
        aria-selected={active}
        aria-disabled={!enabled}
        tabIndex={enabled ? 0 : -1}
        onClick={() => enabled && setRole(value)}
        className={active ? "btn btn-primary" : "btn btn-ghost"}
        style={{
          flex: 1,
          border: "none",
          borderBottom: active ? "1px solid var(--amber)" : "1px solid transparent",
          cursor: enabled ? "pointer" : "not-allowed",
          opacity: enabled ? 1 : 0.5,
        }}
      >
        {label}
      </button>
    );
  };
  return (
    <div role="tablist" aria-label="View role" style={{
      display: "flex", border: "1px solid var(--border)", background: "var(--surface-1)", marginBottom: "var(--sp-4)",
    }}>
      {tab("investor", "Investor", true)}
      {tab("issuer", "Issuer Console", isOwner)}
    </div>
  );
}

function Dashboard() {
  const { address } = useAccount();
  const [role, setRole] = useState<Role>("investor");

  const { data: owner } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "owner",
    query: { enabled: !!addresses.rwaToken },
  });
  const isOwner = !!address && !!owner && (address as string).toLowerCase() === (owner as string).toLowerCase();

  // If a non-owner is somehow on the issuer tab (e.g. wallet switch), fall back.
  useEffect(() => {
    if (role === "issuer" && !isOwner) setRole("investor");
  }, [role, isOwner]);

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "var(--sp-10) var(--sp-6) var(--sp-16)" }}>
      <WrongChainBanner />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 500, color: "var(--text-1)", marginBottom: "var(--sp-2)", letterSpacing: "-0.01em" }}>
        Compliance dashboard
      </h1>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", marginBottom: "var(--sp-8)" }}>
        Verify before you transfer — the compliance layer for tokenized equity.
      </p>

      <RoleControl role={role} setRole={setRole} isOwner={isOwner} />

      {role === "issuer" && isOwner ? (
        <IssuerConsole />
      ) : (
        <>
          <InvestorView />
          {!isOwner && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)", marginTop: "var(--sp-6)", textAlign: "center" }}>
              Connect the issuer wallet to manage compliance.
            </p>
          )}
        </>
      )}

      {/* Footer */}
      <footer style={{ marginTop: "var(--sp-16)", paddingTop: "var(--sp-6)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--sp-4)" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text-3)" }}>
          Verigate — Compliance layer for tokenized stocks · Robinhood Chain
        </span>
        <div style={{ display: "flex", gap: "var(--sp-5)" }}>
          <a href="https://github.com/Yonkoo11/verigate-arbitrum" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
            GitHub
          </a>
          <a href={CHAIN_EXPLORER} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
            Explorer
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  // Match the server render (disconnected) on the first client paint, then reveal the
  // connection-dependent view. Prevents a hydration mismatch when wagmi auto-reconnects.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <GateHero />;
  return isConnected ? <Dashboard /> : <GateHero />;
}

"use client";

import { useAccount, useConnect, useChainId, useSwitchChain } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { TokenDashboard } from "@/components/TokenDashboard";
import { ComplianceStatus } from "@/components/ComplianceStatus";
import { TransferForm } from "@/components/TransferForm";
import { IssuerPanel } from "@/components/IssuerPanel";

function GateHero() {
  const { connect, connectors } = useConnect();
  return (
    <div className="gate-hero">
      {/* LEFT: Denied zone */}
      <div className="gate-hero-denied">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 28 }}>
          Without verification
        </span>
        <div style={{ width: 44, height: 44, border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 6l8 8M14 6l-8 8" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 500, color: "var(--text-3)", lineHeight: 1.2, marginBottom: 14 }}>
          Transfer Denied
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-3)", maxWidth: 380, lineHeight: 1.6 }}>
          No valid attestation found. Compliance check failed at CountryRestriction module.
        </p>
        <div style={{ marginTop: 36, padding: "14px 16px", background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)" }}>
          {[["Status", "REVERTED", true], ["Module", "CountryRestriction", false], ["Reason", "Recipient has no attestation", false]].map(([label, value, isRed], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
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
        <span className="gate-label">
          Verigate
        </span>
      </div>

      {/* Central tagline — the one thing a judge reads */}
      <div style={{
        position: "absolute", top: "var(--sp-8)", left: 0, right: 0, zIndex: 20,
        textAlign: "center",
      }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 500, color: "var(--text-2)", letterSpacing: "0.01em" }}>
          Compliance middleware for tokenized real-world assets
        </span>
      </div>

      {/* Hero footer — visible without wallet */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
        display: "flex", justifyContent: "center", gap: "var(--sp-6)", padding: "var(--sp-4)",
        borderTop: "1px solid var(--border)",
      }}>
        <a href="https://github.com/Yonkoo11/verigate" target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
          GitHub
        </a>
        <a href="https://testnet.bscscan.com/address/0x60aa769416EfBbc0A6BC9cb454758dE6f76D52B5" target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
          BSCScan
        </a>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>
          Built on BNB Chain
        </span>
      </div>

      {/* RIGHT: Approved zone */}
      <div className="gate-hero-approved">
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, var(--amber-glow), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--amber)", opacity: 0.7, marginBottom: 28, display: "block" }}>
            With verification
          </span>
          <div style={{ width: 44, height: 44, border: "1px solid var(--green-border)", background: "var(--green-dim)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 10l4 4 6-7" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.2, marginBottom: 14 }}>
            Transfer Approved
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 340, lineHeight: 1.6 }}>
            All compliance modules passed. BAS attestation verified for both parties.
          </p>
          <button
            onClick={() => connectors[0] && connect({ connector: connectors[0], chainId: bscTestnet.id })}
            style={{ marginTop: 40, fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 500, color: "var(--black)", background: "var(--amber)", border: "none", padding: "14px 32px", cursor: "pointer", minHeight: 48, transition: "opacity var(--duration) var(--ease)" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

function WrongChainBanner() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  if (chainId === bscTestnet.id) return null;
  return (
    <div style={{
      background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)",
      padding: "var(--sp-4)", marginBottom: "var(--sp-6)", display: "flex",
      alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 14, color: "#f59e0b" }}>
        You are connected to the wrong network. Switch to BSC Testnet to use Verigate.
      </span>
      <button
        onClick={() => switchChain({ chainId: bscTestnet.id })}
        style={{
          fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500,
          color: "var(--black)", background: "#f59e0b", border: "none",
          padding: "8px 16px", cursor: "pointer", minHeight: 36, flexShrink: 0,
        }}
      >
        Switch Network
      </button>
    </div>
  );
}

function Dashboard() {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "var(--sp-8) var(--sp-6) var(--sp-16)" }}>
      <WrongChainBanner />
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 500, color: "var(--text-1)", marginBottom: "var(--sp-8)", letterSpacing: "-0.01em" }}>
        Compliance Dashboard
      </h1>
      <div className="dash-grid">
        <TokenDashboard />
        <ComplianceStatus />
      </div>
      <div style={{ marginTop: "var(--sp-6)" }}>
        <TransferForm />
      </div>
      <div style={{ margin: "var(--sp-12) 0", height: 1, background: "var(--amber-border)", position: "relative" }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", background: "var(--black)", padding: "0 12px", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--amber)", opacity: 0.5 }}>
          Issuer Controls
        </div>
      </div>
      <IssuerPanel />

      {/* Footer */}
      <footer style={{ marginTop: "var(--sp-16)", paddingTop: "var(--sp-6)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--sp-4)" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "var(--text-3)" }}>
          Verigate — Compliance for tokenized RWA on BNB Chain
        </span>
        <div style={{ display: "flex", gap: "var(--sp-5)" }}>
          <a href="https://github.com/Yonkoo11/verigate" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
            GitHub
          </a>
          <a href="https://testnet.bscscan.com/address/0x60aa769416EfBbc0A6BC9cb454758dE6f76D52B5" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}>
            BSCScan
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  return isConnected ? <Dashboard /> : <GateHero />;
}

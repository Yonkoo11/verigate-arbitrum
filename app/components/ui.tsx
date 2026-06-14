"use client";

import { type ReactNode } from "react";
import { CHAIN_EXPLORER } from "@/lib/contracts";

export function Card({ primary = false, children, style }: { primary?: boolean; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <section style={{
      background: "var(--surface-1)",
      border: `1px solid ${primary ? "var(--amber-border)" : "var(--border)"}`,
      padding: "var(--sp-8)",
      boxShadow: primary
        ? "0 0 0 1px var(--amber-border), 0 16px 40px -16px rgba(154,107,30,0.20)"
        : "0 1px 2px rgba(31,27,22,0.04), 0 6px 16px -8px rgba(31,27,22,0.10)",
      ...style,
    }}>
      {children}
    </section>
  );
}

export function Heading({ title, blurb }: { title: string; blurb?: string }) {
  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)" }}>{title}</h3>
      {blurb && <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginTop: "var(--sp-2)", maxWidth: 600 }}>{blurb}</p>}
    </div>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header>
      <h1 className="page-title">{title}</h1>
      {sub && <p className="page-sub">{sub}</p>}
    </header>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "var(--sp-12) var(--sp-6)", border: "1px dashed var(--border-strong)", background: "var(--surface-1)" }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text-2)", marginBottom: "var(--sp-2)" }}>{title}</div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-3)", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>{message}</div>
    </div>
  );
}

export function LoadingState({ message = "Loading from chain…" }: { message?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", padding: "var(--sp-8)", border: "1px solid var(--border)", background: "var(--surface-1)" }}>
      <span style={{ width: 14, height: 14, border: "2px solid var(--amber-border)", borderTopColor: "var(--amber)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)" }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ padding: "var(--sp-6)", border: "1px solid var(--red-border)", background: "var(--red-dim)" }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--red)", marginBottom: 4 }}>Could not load data</div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{message}</div>
    </div>
  );
}

export function MetricCard({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub !== undefined && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

export function ExplorerLink({ path, children }: { path: string; children: ReactNode }) {
  return (
    <a href={`${CHAIN_EXPLORER}${path}`} target="_blank" rel="noopener noreferrer"
      style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--amber)", textDecoration: "none", wordBreak: "break-all" }}>
      {children}
    </a>
  );
}

export function short(a?: string): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

"use client";

import { useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import { addresses, rwaTokenAbi, CHAIN_EXPLORER } from "@/lib/contracts";
import { useActivity, type ActivityKind } from "@/lib/useActivity";
import { PageHeader, Card, EmptyState, LoadingState, ErrorState, short } from "@/components/ui";

const META: Record<ActivityKind, { label: string; color: string; border: string; bg: string; icon: React.ReactNode }> = {
  settled: {
    label: "Transfer settled", color: "var(--green)", border: "var(--green-border)", bg: "var(--green-dim)",
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 10l4 4 6-7" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  blocked: {
    label: "Transfer blocked", color: "var(--red)", border: "var(--red-border)", bg: "var(--red-dim)",
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" /></svg>,
  },
  verified: {
    label: "Investor verified", color: "var(--amber)", border: "var(--amber-border)", bg: "var(--amber-dim)",
    icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6" stroke="var(--amber)" strokeWidth="1.5" /><path d="M7.5 10l1.7 1.7L13 8" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
};

const FILTERS: { key: ActivityKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "settled", label: "Settled" },
  { key: "blocked", label: "Blocked" },
  { key: "verified", label: "Verified" },
];

export default function ActivityPage() {
  const { data: decimals } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals" });
  const { data: symbol } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "symbol" });
  const dec = typeof decimals === "number" ? decimals : 18;
  const sym = (symbol as string) ?? "tTSLA";

  const { data, loading, error, rangeUsed, reload, fmtAmount } = useActivity(dec);
  const [filter, setFilter] = useState<ActivityKind | "all">("all");

  const filtered = useMemo(() => (data ?? []).filter((e) => filter === "all" || e.kind === filter), [data, filter]);

  return (
    <div>
      <PageHeader
        title="Activity"
        sub="A live, on-chain audit log read straight from the contracts — settled transfers, blocked transfers with their reason, and investor verifications. Nothing here is off-chain."
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-4)", flexWrap: "wrap", marginBottom: "var(--sp-6)" }}>
        <div style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`filter-chip${filter === f.key ? " active" : ""}`}>{f.label}</button>
          ))}
        </div>
        <button onClick={reload} disabled={loading} className="btn btn-ghost btn-sm">{loading ? "Refreshing…" : "Refresh"}</button>
      </div>

      {rangeUsed !== null && !loading && !error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", marginBottom: "var(--sp-4)" }}>
          Showing events from the last {rangeUsed.toString()} blocks. Testnet RPCs cap log ranges, so older history is not shown.
        </p>
      )}

      <Card style={{ padding: "var(--sp-6) var(--sp-8)" }}>
        {loading ? (
          <LoadingState message="Reading on-chain events…" />
        ) : error ? (
          <ErrorState message={`${error}. The testnet RPC may be rate-limiting log queries — hit Refresh to retry.`} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No events in range" message="No matching events were found in the recent block window. Run a transfer or verify an investor to populate the log." />
        ) : (
          <div>
            {filtered.map((e) => {
              const m = META[e.kind];
              return (
                <div key={`${e.txHash}-${e.logIndex}`} className="tl-item">
                  <span className="tl-icon" style={{ borderColor: m.border, background: m.bg }}>{m.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: m.color }}>{m.label}</span>
                      {e.amount !== undefined && (
                        <span className="mono" style={{ color: "var(--text-2)" }}>{fmtAmount(e.amount)} {sym}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
                      {e.kind === "verified"
                        ? <>verified <span style={{ color: "var(--text-2)" }}>{short(e.to)}</span> · by {short(e.from)}</>
                        : <><span style={{ color: "var(--text-2)" }}>{short(e.from)}</span> → <span style={{ color: "var(--text-2)" }}>{short(e.to)}</span></>}
                    </div>
                    {e.kind === "blocked" && e.reason && (
                      <span style={{ display: "inline-block", marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)", background: "var(--red-dim)", border: "1px solid var(--red-border)", padding: "2px 8px" }}>
                        {e.reason}
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>block {e.blockNumber.toString()}</div>
                    <a href={`${CHAIN_EXPLORER}/tx/${e.txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--amber)", textDecoration: "none" }}>
                      {e.txHash.slice(0, 8)}… ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

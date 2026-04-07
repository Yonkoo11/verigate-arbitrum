"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { addresses, rwaTokenAbi, BSC_TESTNET_EXPLORER } from "@/lib/contracts";

export function TokenDashboard() {
  const { address } = useAccount();

  const { data: tokenName } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "name",
  });
  const { data: tokenSymbol } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "symbol",
  });
  const { data: decimals } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals",
  });
  const { data: balance, isLoading: balLoading } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: totalSupply } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "totalSupply",
  });
  const { data: engine } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "complianceEngine",
  });
  const { data: paused } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "paused",
  });

  const dec = typeof decimals === "number" ? decimals : 18;
  const fmtBal = balance !== undefined ? Number(formatUnits(balance as bigint, dec)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const fmtSupply = totalSupply !== undefined ? Number(formatUnits(totalSupply as bigint, dec)).toLocaleString("en-US", { minimumFractionDigits: 0 }) : "—";

  if (!addresses.rwaToken) {
    return <Panel><p style={{ fontSize: 14, color: "var(--text-3)" }}>No token configured.</p></Panel>;
  }

  return (
    <Panel>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-5)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)" }}>
          Token
        </h2>
        {paused === true && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--red)", background: "var(--red-dim)", border: "1px solid var(--red-border)", padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Paused
          </span>
        )}
      </div>

      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", marginBottom: "var(--sp-1)" }}>
        {(tokenName as string) ?? "Loading..."}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-3)", marginLeft: 8 }}>
          {(tokenSymbol as string) ?? ""}
        </span>
      </div>

      {/* Balance — the hero number */}
      <div style={{ margin: "var(--sp-5) 0" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "var(--sp-1)" }}>
          Your Balance
        </div>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 34,
          fontWeight: 500,
          color: "var(--amber)",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          opacity: balLoading ? 0.3 : 1,
          transition: "opacity var(--duration) var(--ease)",
        }}>
          {fmtBal}
        </div>
      </div>

      {/* Meta grid */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "var(--sp-4)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
        <MetaItem label="Total Supply" value={fmtSupply} />
        <MetaItem
          label="Compliance Engine"
          value={engine ? `${(engine as string).slice(0, 8)}...${(engine as string).slice(-6)}` : "—"}
          href={engine ? `${BSC_TESTNET_EXPLORER}/address/${engine}` : undefined}
        />
      </div>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface-1)",
      border: "1px solid var(--border)",
      padding: "var(--sp-6)",
    }}>
      {children}
    </div>
  );
}

function MetaItem({ label, value, href }: { label: string; value: string; href?: string }) {
  const val = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--amber)", textDecoration: "none" }}>
      {value}
    </a>
  ) : <span>{value}</span>;

  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "var(--sp-1)" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
        {val}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits, type Hex } from "viem";
import { addresses, rwaTokenAbi, complianceEngineAbi } from "@/lib/contracts";
import { ZERO_BYTES32 } from "@/lib/credential";
import { useRole } from "@/lib/useRole";
import { useModules } from "@/lib/useModules";
import { PageHeader, MetricCard } from "@/components/ui";

function RoleBadge({ isOwner, connected }: { isOwner: boolean; connected: boolean }) {
  const label = !connected ? "Disconnected" : isOwner ? "Issuer" : "Investor";
  const color = isOwner ? "var(--amber)" : "var(--text-2)";
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color,
      background: isOwner ? "var(--amber-dim)" : "var(--surface-2)",
      border: `1px solid ${isOwner ? "var(--amber-border)" : "var(--border)"}`,
      padding: "3px 10px", letterSpacing: "0.06em", textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}

export default function Overview() {
  const { address } = useAccount();
  const { isOwner, isConnected } = useRole();
  const { data: modulesData } = useModules(addresses.complianceEngine);

  const { data: name } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "name" });
  const { data: symbol } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "symbol" });
  const { data: decimals } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals" });
  const { data: totalSupply } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "totalSupply" });
  const { data: balance } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: uid } = useReadContract({
    address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "attestationUIDs",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });

  const dec = typeof decimals === "number" ? decimals : 18;
  const sym = (symbol as string) ?? "tTSLA";
  const fmt = (v?: bigint) => v !== undefined
    ? Number(formatUnits(v, dec)).toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "—";
  const verified = typeof uid === "string" && uid !== ZERO_BYTES32;
  const mh = modulesData?.maxHolders;

  const quickLinks = isOwner
    ? [
        { href: "/dashboard/tokens", label: "Tokens", desc: "Every token from the factory" },
        { href: "/dashboard/registry", label: "Registry", desc: "Verify & revoke investors" },
        { href: "/dashboard/activity", label: "Activity", desc: "Live on-chain audit log" },
        { href: "/dashboard/deploy", label: "Deploy", desc: "Issue a new compliant token" },
      ]
    : [
        { href: "/dashboard/credential", label: "My Credential", desc: "Your decoded KYC attestation" },
        { href: "/dashboard/transfer", label: "Transfer", desc: "Run the live compliance gate" },
      ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
        <h1 className="page-title" style={{ margin: 0 }}>Overview</h1>
        <RoleBadge isOwner={isOwner} connected={isConnected} />
      </div>
      <p className="page-sub">
        {isOwner
          ? "Issuer view — manage tokens, the verified registry, and compliance rules."
          : "The compliance layer for tokenized equity. Verify before you transfer."}
      </p>

      <div className="metric-grid" style={{ marginBottom: "var(--sp-10)" }}>
        <MetricCard label="Token" value={(name as string) ?? "Tokenized TSLA"} sub={sym} />
        <MetricCard label="Total supply" value={fmt(totalSupply as bigint | undefined)} sub={sym} />
        <MetricCard
          label="Holders / cap"
          value={mh ? `${mh.holderCount.toString()} / ${mh.maxHolderCount.toString()}` : "—"}
          sub={mh ? "MaxHolders module" : "no holder cap"}
        />
        <MetricCard label={`Your balance`} value={isConnected ? fmt(balance as bigint | undefined) : "—"} sub={sym} />
        <MetricCard
          label="Your status"
          value={!isConnected ? "—" : verified ? "Verified" : "Unverified"}
          sub={!isConnected ? "connect wallet" : verified ? "KYC attestation linked" : "no attestation"}
        />
      </div>

      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: "var(--sp-4)" }}>
        Quick links
      </div>
      <div className="metric-grid">
        {quickLinks.map((q) => (
          <Link key={q.href} href={q.href} className="metric-card" style={{ textDecoration: "none", display: "block" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--text-1)", marginBottom: 6 }}>{q.label} →</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)" }}>{q.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

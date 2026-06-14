"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { formatUnits, isAddress, type Address } from "viem";
import { addresses, rwaTokenAbi, CHAIN_EXPLORER } from "@/lib/contracts";
import { useDeployments } from "@/lib/useDeployments";
import { useModules } from "@/lib/useModules";
import { TokenAdminControls } from "@/components/TokenAdminControls";
import { PageHeader, Card, Heading, MetricCard, EmptyState, LoadingState, ErrorState, ExplorerLink, short } from "@/components/ui";

/* ---------------- token list ---------------- */
function TokenList() {
  const router = useRouter();
  const { data, loading, error } = useDeployments();

  if (loading) return <LoadingState message="Reading deployments from the factory…" />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.length === 0) {
    return <EmptyState title="No tokens deployed yet" message="When the factory deploys a compliant token it will appear here. Issue one from the Deploy page." />;
  }

  return (
    <Card style={{ padding: 0, overflowX: "auto" }}>
      <table className="dtable">
        <thead>
          <tr>
            <th>Token</th><th>Symbol</th><th>Supply</th><th>Issuer</th><th>Address</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.token} className="clickable" onClick={() => router.push(`/dashboard/tokens?address=${d.token}`)}>
              <td style={{ fontFamily: "var(--font-serif)", fontSize: 16 }}>{d.name ?? "—"}</td>
              <td className="mono">{d.symbol ?? "—"}</td>
              <td className="mono">{d.supply ?? "—"}</td>
              <td className="mono">{short(d.issuer)}</td>
              <td className="mono" style={{ color: "var(--amber)" }}>{short(d.token)} →</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ---------------- token detail ---------------- */
function TokenDetail({ token }: { token: Address }) {
  const { data: name } = useReadContract({ address: token, abi: rwaTokenAbi, functionName: "name" });
  const { data: symbol } = useReadContract({ address: token, abi: rwaTokenAbi, functionName: "symbol" });
  const { data: decimals } = useReadContract({ address: token, abi: rwaTokenAbi, functionName: "decimals" });
  const { data: totalSupply } = useReadContract({ address: token, abi: rwaTokenAbi, functionName: "totalSupply" });
  const { data: engine } = useReadContract({ address: token, abi: rwaTokenAbi, functionName: "complianceEngine" });
  const { data: owner } = useReadContract({ address: token, abi: rwaTokenAbi, functionName: "owner" });

  const { data: modulesData, loading: modLoading } = useModules(engine as Address | undefined);

  const dec = typeof decimals === "number" ? decimals : 18;
  const sym = (symbol as string) ?? "—";
  const supply = totalSupply !== undefined
    ? Number(formatUnits(totalSupply as bigint, dec)).toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "—";
  const mh = modulesData?.maxHolders;

  return (
    <div>
      <Link href="/dashboard/tokens" className="mono-link" style={{ display: "inline-block", marginBottom: "var(--sp-4)" }}>← All tokens</Link>
      <PageHeader title={(name as string) ?? "Token"} sub={`${sym} · deployed via the Covenant factory on Robinhood Chain`} />

      <div className="metric-grid" style={{ marginBottom: "var(--sp-8)" }}>
        <MetricCard label="Total supply" value={supply} sub={sym} />
        <MetricCard label="Holders / cap" value={mh ? `${mh.holderCount.toString()} / ${mh.maxHolderCount.toString()}` : "—"} sub={mh ? "MaxHolders" : "no cap"} />
        <MetricCard label="Contract" value={<ExplorerLink path={`/address/${token}`}>{short(token)} ↗</ExplorerLink>} sub="on explorer" />
      </div>

      <Card style={{ marginBottom: "var(--sp-8)" }}>
        <Heading title="Compliance modules" blurb="Every module attached to this token's compliance engine. Each runs on every transfer." />
        {modLoading ? (
          <LoadingState message="Reading modules…" />
        ) : !modulesData || modulesData.modules.length === 0 ? (
          <EmptyState title="No modules" message="This token's engine has no compliance modules attached." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
            {modulesData.modules.map((m) => (
              <div key={m.address} style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-4)", padding: "var(--sp-4)", background: "var(--surface-2)", border: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>{m.name}</div>
                  {m.description && <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)", marginTop: 2, maxWidth: 520 }}>{m.description}</div>}
                </div>
                <ExplorerLink path={`/address/${m.address}`}>{short(m.address)} ↗</ExplorerLink>
              </div>
            ))}
          </div>
        )}
      </Card>

      <TokenAdminControls token={token} />
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)", marginTop: "var(--sp-3)" }}>
        Owner: <span className="mono">{short(owner as string)}</span>. Control calls revert unless sent from the owner wallet.
      </p>
    </div>
  );
}

function TokensInner() {
  const params = useSearchParams();
  const addr = params.get("address");
  if (addr && isAddress(addr)) return <TokenDetail token={addr as Address} />;
  return (
    <div>
      <PageHeader title="Tokens" sub="Every compliant token issued through the Covenant factory. Click a row to inspect its modules and issuer controls." />
      <TokenList />
    </div>
  );
}

export default function TokensPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <TokensInner />
    </Suspense>
  );
}

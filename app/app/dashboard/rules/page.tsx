"use client";

import { useReadContract } from "wagmi";
import { type Address } from "viem";
import { addresses, accreditedInvestorAbi } from "@/lib/contracts";
import { useModules } from "@/lib/useModules";
import { JurisdictionPolicy } from "@/components/IssuerConsole";
import { PageHeader, Card, Heading, MetricCard, ExplorerLink, short } from "@/components/ui";

function findModule(modules: { address: Address; name: string }[] | undefined, key: string) {
  return modules?.find((m) => m.name.toLowerCase().replace(/[^a-z]/g, "").includes(key));
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-4)", padding: "var(--sp-3) 0", borderTop: "1px solid var(--border)" }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-1)" }}>{value}</span>
    </div>
  );
}

function AccreditedConfig({ module }: { module?: Address }) {
  const { data: checkSender } = useReadContract({ address: module, abi: accreditedInvestorAbi, functionName: "checkSender", query: { enabled: !!module } });
  const { data: checkRecipient } = useReadContract({ address: module, abi: accreditedInvestorAbi, functionName: "checkRecipient", query: { enabled: !!module } });

  return (
    <Card style={{ marginTop: "var(--sp-8)" }}>
      <Heading title="Accredited investor" blurb="Whether sender and/or recipient must carry an accredited-investor attestation. These flags are set at deploy time and are immutable." />
      {!module ? (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-3)" }}>This engine has no AccreditedInvestor module.</p>
      ) : (
        <div>
          <InfoRow label="Check sender" value={checkSender === undefined ? "—" : checkSender ? "Required" : "Not required"} />
          <InfoRow label="Check recipient" value={checkRecipient === undefined ? "—" : checkRecipient ? "Required" : "Not required"} />
          <InfoRow label="Module" value={<ExplorerLink path={`/address/${module}`}>{short(module)} ↗</ExplorerLink>} />
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)", marginTop: "var(--sp-4)", lineHeight: 1.55 }}>
            Read-only. Accreditation rules are fixed when the token is deployed and cannot be changed afterward.
          </p>
        </div>
      )}
    </Card>
  );
}

export default function RulesPage() {
  const { data: modulesData } = useModules(addresses.complianceEngine);
  const accredited = findModule(modulesData?.modules, "accredited");
  const mh = modulesData?.maxHolders;

  return (
    <div>
      <PageHeader title="Compliance Rules" sub="The live module configuration enforced on every transfer of the primary tTSLA token." />

      <JurisdictionPolicy />

      <AccreditedConfig module={accredited?.address} />

      <Card style={{ marginTop: "var(--sp-8)" }}>
        <Heading title="Holder cap" blurb="The MaxHolders module limits how many distinct wallets can hold the token. A transfer to a new holder reverts once the cap is reached." />
        {!mh ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-3)" }}>This engine has no MaxHolders module, so there is no holder cap.</p>
        ) : (
          <div className="metric-grid">
            <MetricCard label="Current holders" value={mh.holderCount.toString()} />
            <MetricCard label="Maximum holders" value={mh.maxHolderCount.toString()} />
            <MetricCard label="Module" value={<ExplorerLink path={`/address/${mh.address}`}>{short(mh.address)} ↗</ExplorerLink>} />
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { TheGate, CredentialCard } from "@/components/InvestorView";
import { PageHeader } from "@/components/ui";

export default function TransferPage() {
  return (
    <div>
      <PageHeader
        title="Transfer"
        sub="Every transfer is checked against the live compliance engine before it can settle. Enter a recipient and amount to see the verdict."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
        <TheGate />
        <CredentialCard />
      </div>
    </div>
  );
}

"use client";

import { IdentityStrip, CredentialCard } from "@/components/InvestorView";
import { PageHeader } from "@/components/ui";

export default function CredentialPage() {
  return (
    <div>
      <PageHeader
        title="My Credential"
        sub="Your on-chain KYC attestation, decoded. Jurisdiction, investor type, and the attestation UID — all read live from the registry."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
        <IdentityStrip />
        <CredentialCard />
      </div>
    </div>
  );
}

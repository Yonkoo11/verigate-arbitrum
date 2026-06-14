"use client";

import { useWriteContract } from "wagmi";
import { type Hex } from "viem";
import { addresses, covenantAttesterAbi } from "@/lib/contracts";
import { formatExpiry } from "@/lib/credential";
import { useRole } from "@/lib/useRole";
import { useAttestations } from "@/lib/useAttestations";
import { VerifyInvestor } from "@/components/IssuerConsole";
import { CredentialCard } from "@/components/InvestorView";
import { useToast } from "@/components/Toast";
import { PageHeader, Card, Heading, EmptyState, LoadingState, ErrorState, ExplorerLink, short } from "@/components/ui";

function StatusPill({ revoked }: { revoked: boolean }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500,
      color: revoked ? "var(--red)" : "var(--green)",
      background: revoked ? "var(--red-dim)" : "var(--green-dim)",
      border: `1px solid ${revoked ? "var(--red-border)" : "var(--green-border)"}`,
      padding: "2px 8px", letterSpacing: "0.04em",
    }}>
      {revoked ? "Revoked" : "Active"}
    </span>
  );
}

function VerifiedList() {
  const { toast } = useToast();
  const { data, loading, error, reload } = useAttestations();
  const { writeContract, isPending } = useWriteContract();

  function revoke(uid: Hex) {
    writeContract(
      { address: addresses.registry, abi: covenantAttesterAbi, functionName: "revoke", args: [uid] },
      { onSuccess: () => { toast("Revocation submitted", "success"); setTimeout(reload, 3000); }, onError: (e) => toast(e.message.split("\n")[0], "error") },
    );
  }

  return (
    <Card style={{ marginTop: "var(--sp-8)" }}>
      <Heading title="Verified investors" blurb="Every KYC attestation issued by this registry, decoded from on-chain Attested events. Revoke to invalidate a credential." />
      {loading ? (
        <LoadingState message="Reading Attested events from the registry…" />
      ) : error ? (
        <ErrorState message={`${error}. The testnet RPC may be rate-limiting log queries. Try again shortly.`} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No attestations in range" message="No Attested events were found in the recent block window. Verify an investor above to create the first one." />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="dtable">
            <thead>
              <tr>
                <th>Recipient</th><th>Jurisdiction</th><th>Accredited</th><th>Issued by</th><th>Expiry</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.uid}>
                  <td className="mono">{short(r.recipient)}</td>
                  <td>{r.cred ? `${r.cred.countryName} (${r.cred.countryCode})` : "—"}</td>
                  <td>{r.cred ? (r.cred.accredited ? "Yes" : "No") : "—"}</td>
                  <td className="mono">{short(r.attester)}</td>
                  <td className="mono">{formatExpiry(r.expirationTime)}</td>
                  <td><StatusPill revoked={r.revoked} /></td>
                  <td>
                    {!r.revoked && (
                      <button onClick={() => revoke(r.uid)} disabled={isPending} className="btn btn-danger btn-sm">Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function RegistryPage() {
  const { isOwner } = useRole();

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Registry" sub="Your KYC credential in the Covenant attestation registry." />
        <CredentialCard />
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)", marginTop: "var(--sp-6)" }}>
          Connect the issuer wallet to verify investors and manage the registry.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Registry" sub="Issue and manage on-chain KYC attestations. Verified wallets can hold and transfer compliant tokens." />
      <VerifyInvestor />
      <VerifiedList />
    </div>
  );
}

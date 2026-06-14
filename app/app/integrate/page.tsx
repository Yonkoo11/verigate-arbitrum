import Link from "next/link";
import { addresses, CHAIN_EXPLORER, KYC_SCHEMA, ROBINHOOD_CHAIN_ID, ROBINHOOD_RPC } from "@/lib/contracts";

const ADDR_ROWS: { label: string; addr: string }[] = [
  { label: "RWAToken (tTSLA)", addr: addresses.rwaToken },
  { label: "ComplianceEngine", addr: addresses.complianceEngine },
  { label: "CountryRestriction", addr: addresses.countryRestriction },
  { label: "RWATokenFactory", addr: addresses.factory },
  { label: "CovenantAttester (registry)", addr: addresses.registry },
];

function Code({ children }: { children: string }) {
  return (
    <pre style={{
      fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6, color: "var(--text-1)",
      background: "var(--surface-1)", border: "1px solid var(--border)", padding: "var(--sp-5)",
      overflowX: "auto", margin: "var(--sp-4) 0",
    }}>
      <code>{children}</code>
    </pre>
  );
}

function H2({ children }: { children: string }) {
  return <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 500, color: "var(--text-1)", margin: "var(--sp-12) 0 var(--sp-4)", letterSpacing: "-0.01em" }}>{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.7, color: "var(--text-2)", margin: "0 0 var(--sp-4)" }}>{children}</p>;
}

export default function DocsPage() {
  return (
    <div>
      <nav className="lp-nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span className="cv-mark">CV</span>
          <span className="cv-name">Covenant</span>
        </Link>
        <Link href="/dashboard" className="btn btn-primary btn-sm">Launch app</Link>
      </nav>

      <article style={{ maxWidth: 760, margin: "0 auto", padding: "var(--sp-12) var(--sp-6) var(--sp-16)" }}>
        <div className="hero-eyebrow" style={{ marginBottom: "var(--sp-3)" }}>Integration docs</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 40, fontWeight: 500, color: "var(--text-1)", letterSpacing: "-0.02em", margin: "0 0 var(--sp-4)" }}>
          Integrating Covenant
        </h1>
        <P>
          Covenant enforces securities compliance inside the token. Any RWA token built on it routes
          every transfer through a <span className="mono">ComplianceEngine</span> that consults pluggable
          modules backed by on-chain KYC attestations. This page covers the read path, the KYC schema,
          and EAS compatibility.
        </P>

        <H2>Reading canTransfer</H2>
        <P>
          Before settling, the token calls <span className="mono">canTransfer(from, to, amount)</span> on
          its engine. It returns <span className="mono">(bool compliant, string reason)</span>. A clean
          way to preflight a transfer in your UI without sending a transaction.
        </P>
        <Code>{`// viem
const [compliant, reason] = await publicClient.readContract({
  address: "${addresses.complianceEngine}",
  abi: complianceEngineAbi,
  functionName: "canTransfer",
  args: [from, to, parseUnits(amount, decimals)],
});

if (!compliant) showBlocked(reason); // e.g. "Recipient has no attestation"`}</Code>

        <H2>The KYC schema</H2>
        <P>
          Each verified wallet has an attestation whose <span className="mono">data</span> blob is
          ABI-encoded. The schema id is <span className="mono">keccak256(&quot;covenant.kyc.v1&quot;)</span>:
        </P>
        <Code>{`schema id = ${KYC_SCHEMA}

abi.encode(
  uint8  kycLevel,      // verification tier
  bytes2 country,       // ISO-3166 alpha-2, e.g. "US"
  bool   accredited,    // accredited-investor flag
  uint8  investorType,  // 0 retail · 1 individual · 2 institutional · 3 qualified purchaser
  uint64 expiry         // unix seconds, 0 = no expiry
)`}</Code>
        <P>
          To resolve a wallet&apos;s credential: read its UID from
          <span className="mono"> ComplianceEngine.attestationUIDs(wallet)</span>, fetch the attestation
          with <span className="mono">CovenantAttester.getAttestation(uid)</span>, then decode the
          <span className="mono"> data</span> field with the layout above.
        </P>

        <H2>EAS / IAttestationRegistry compatibility</H2>
        <P>
          The registry implements an EAS-compatible surface. <span className="mono">attest(schema,
          recipient, expirationTime, revocable, refUID, data)</span> returns a
          <span className="mono"> bytes32</span> UID and emits <span className="mono">Attested(uid,
          recipient, attester, schema)</span>. <span className="mono">revoke(uid)</span> emits
          <span className="mono"> Revoked</span>. This means existing ERC-3643 / EAS tooling can issue
          and read Covenant credentials without bespoke integration. Covenant just adds the on-transfer
          enforcement layer on top.
        </P>

        <H2>Deployed addresses</H2>
        <P>Robinhood Chain testnet · chain id <span className="mono">{ROBINHOOD_CHAIN_ID}</span> · RPC <span className="mono">{ROBINHOOD_RPC}</span></P>
        <div style={{ border: "1px solid var(--border)", marginTop: "var(--sp-4)" }}>
          {ADDR_ROWS.map((r, i) => (
            <div key={r.addr} style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-4)", padding: "var(--sp-4) var(--sp-5)", borderTop: i > 0 ? "1px solid var(--border)" : "none", background: "var(--surface-1)", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-1)" }}>{r.label}</span>
              <a href={`${CHAIN_EXPLORER}/address/${r.addr}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--amber)", textDecoration: "none" }}>{r.addr} ↗</a>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "var(--sp-12)", paddingTop: "var(--sp-6)", borderTop: "1px solid var(--border)", display: "flex", gap: "var(--sp-6)" }}>
          <Link href="/dashboard" className="mono-link">→ Launch the app</Link>
          <a href="https://github.com/Yonkoo11/verigate-arbitrum" target="_blank" rel="noopener noreferrer" className="mono-link">GitHub</a>
        </div>
      </article>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { stringToHex, decodeEventLog, type Address, type Hex } from "viem";
import { addresses, rwaTokenFactoryAbi, CHAIN_EXPLORER } from "@/lib/contracts";
import { COUNTRY_OPTIONS, COUNTRY_LABELS } from "@/components/IssuerConsole";
import { useRole } from "@/lib/useRole";
import { useToast } from "@/components/Toast";
import { PageHeader, Card, Heading, ExplorerLink, short } from "@/components/ui";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: "var(--sp-5)" }}>
      <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: "var(--sp-2)" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-1)",
  background: "var(--surface-2)", border: "1px solid var(--border)", padding: "14px 16px", outline: "none", minHeight: 52,
};

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
      <span style={{ width: 40, height: 24, flexShrink: 0, position: "relative", background: on ? "var(--amber)" : "var(--surface-3)", transition: "background var(--duration) var(--ease)" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 18, height: 18, borderRadius: "50%", background: on ? "#FFFFFF" : "var(--text-3)", transition: "left var(--duration) var(--ease)" }} />
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-1)" }}>{label}</span>
    </button>
  );
}

const BLOCKABLE = ["KP", "IR", "SY", "US", "GB", "DE", "SG"];

export default function DeployPage() {
  const { isOwner } = useRole();
  const { toast } = useToast();

  const [name, setName] = useState("Tokenized AAPL");
  const [symbol, setSymbol] = useState("tAAPL");
  const [useCountry, setUseCountry] = useState(true);
  const [countrySender, setCountrySender] = useState(false);
  const [blocked, setBlocked] = useState<string[]>(["KP", "IR", "SY"]);
  const [useAccredited, setUseAccredited] = useState(true);
  const [accSender, setAccSender] = useState(false);
  const [accRecipient, setAccRecipient] = useState(true);
  const [useMax, setUseMax] = useState(true);
  const [maxCount, setMaxCount] = useState("500");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash: txHash });
  const [newToken, setNewToken] = useState<Address | null>(null);

  useEffect(() => {
    if (!receipt || newToken) return;
    for (const log of receipt.logs) {
      try {
        const ev = decodeEventLog({ abi: rwaTokenFactoryAbi, data: log.data, topics: log.topics });
        if (ev.eventName === "TokenDeployed") {
          setNewToken((ev.args as unknown as { token: Address }).token);
          toast("Token deployed", "success");
          break;
        }
      } catch { /* not our event */ }
    }
  }, [receipt, newToken, toast]);

  function toggleBlocked(c: string) {
    setBlocked((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function deploy() {
    if (!name || !symbol) return;
    const blockedHex = blocked.map((c) => stringToHex(c, { size: 2 }) as Hex);
    const params = {
      name, symbol,
      useCountryRestriction: useCountry,
      countryCheckSender: countrySender,
      blockedCountries: blockedHex,
      useAccreditedInvestor: useAccredited,
      accreditedCheckSender: accSender,
      accreditedCheckRecipient: accRecipient,
      useMaxHolders: useMax,
      maxHolderCount: BigInt(maxCount || "0"),
    };
    setNewToken(null);
    writeContract(
      { address: addresses.factory, abi: rwaTokenFactoryAbi, functionName: "deploy", args: [params] },
      { onSuccess: () => toast("Deployment submitted, confirming…", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") },
    );
  }

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Deploy" sub="Issue a new compliant token." />
        <Card><p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)" }}>Connect the issuer wallet to deploy a new token.</p></Card>
      </div>
    );
  }

  const busy = isPending || confirming;

  return (
    <div>
      <PageHeader title="Deploy" sub="Issue a new compliant RWA token through the Covenant factory. Pick which compliance modules to attach. They're wired into the token at creation." />

      <Card primary>
        <Heading title="New compliant token" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "var(--sp-4)" }} className="issuer-row">
          <Field label="Token name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tokenized AAPL" style={inputStyle} /></Field>
          <Field label="Symbol"><input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="tAAPL" style={inputStyle} /></Field>
        </div>

        {/* Country restriction */}
        <div style={{ paddingTop: "var(--sp-5)", borderTop: "1px solid var(--border)", marginTop: "var(--sp-2)" }}>
          <Toggle on={useCountry} onClick={() => setUseCountry((v) => !v)} label="Country restriction module" />
          {useCountry && (
            <div style={{ marginTop: "var(--sp-4)", paddingLeft: "var(--sp-3)" }}>
              <div style={{ marginBottom: "var(--sp-4)" }}><Toggle on={countrySender} onClick={() => setCountrySender((v) => !v)} label="Also check sender jurisdiction" /></div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-2)", marginBottom: "var(--sp-3)" }}>Blocked jurisdictions</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
                {BLOCKABLE.map((c) => {
                  const on = blocked.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => toggleBlocked(c)} className={`filter-chip${on ? " active" : ""}`} style={on ? { color: "var(--red)", background: "var(--red-dim)", borderColor: "var(--red-border)" } : undefined}>
                      {c} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>· {COUNTRY_LABELS[c]?.replace(" (blocked)", "") ?? c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Accredited */}
        <div style={{ paddingTop: "var(--sp-5)", borderTop: "1px solid var(--border)", marginTop: "var(--sp-5)" }}>
          <Toggle on={useAccredited} onClick={() => setUseAccredited((v) => !v)} label="Accredited-investor module" />
          {useAccredited && (
            <div style={{ marginTop: "var(--sp-4)", paddingLeft: "var(--sp-3)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
              <Toggle on={accSender} onClick={() => setAccSender((v) => !v)} label="Sender must be accredited" />
              <Toggle on={accRecipient} onClick={() => setAccRecipient((v) => !v)} label="Recipient must be accredited" />
            </div>
          )}
        </div>

        {/* Max holders */}
        <div style={{ paddingTop: "var(--sp-5)", borderTop: "1px solid var(--border)", marginTop: "var(--sp-5)", marginBottom: "var(--sp-6)" }}>
          <Toggle on={useMax} onClick={() => setUseMax((v) => !v)} label="Holder cap module" />
          {useMax && (
            <div style={{ marginTop: "var(--sp-4)", paddingLeft: "var(--sp-3)", maxWidth: 200 }}>
              <Field label="Maximum holders"><input value={maxCount} onChange={(e) => setMaxCount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="500" style={inputStyle} /></Field>
            </div>
          )}
        </div>

        <button onClick={deploy} disabled={!name || !symbol || busy} className="btn btn-primary" style={{ width: "100%", minHeight: 52 }}>
          {isPending ? "Submitting…" : confirming ? "Confirming…" : "Deploy token"}
        </button>

        {txHash && (
          <div style={{ marginTop: "var(--sp-4)", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>
            tx <a href={`${CHAIN_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--amber)", textDecoration: "none" }}>{short(txHash)} ↗</a>
          </div>
        )}

        {newToken && (
          <div style={{ marginTop: "var(--sp-6)", paddingTop: "var(--sp-6)", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 10px rgba(52,211,153,0.45)" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--green)" }}>Token deployed</span>
            </div>
            <div style={{ display: "flex", gap: "var(--sp-6)", flexWrap: "wrap", alignItems: "center" }}>
              <ExplorerLink path={`/address/${newToken}`}>{newToken} ↗</ExplorerLink>
              <Link href={`/dashboard/tokens?address=${newToken}`} className="btn btn-ghost btn-sm">Open token</Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

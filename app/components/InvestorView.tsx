"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits, parseUnits, isAddress, type Address, type Hex } from "viem";
import { addresses, rwaTokenAbi, complianceEngineAbi, covenantAttesterAbi, CHAIN_EXPLORER } from "@/lib/contracts";
import { decodeCredential, formatExpiry, shortAddr, ZERO_BYTES32, type DecodedCredential } from "@/lib/credential";
import { useToast } from "./Toast";

/* ---------------------------------------------------------------- *
 *  Identity strip — token name/symbol + hero balance + paused badge
 * ---------------------------------------------------------------- */
export function IdentityStrip() {
  const { address } = useAccount();
  const { data: tokenName } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "name" });
  const { data: tokenSymbol } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "symbol" });
  const { data: decimals } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals" });
  const { data: paused } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "paused" });
  const { data: balance, isLoading: balLoading } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });

  const dec = typeof decimals === "number" ? decimals : 18;
  const fmtBal = balance !== undefined
    ? Number(formatUnits(balance as bigint, dec)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";

  return (
    <section
      style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        flexWrap: "wrap", gap: "var(--sp-6)",
        background: "var(--surface-1)", border: "1px solid var(--border)",
        padding: "var(--sp-8)",
        boxShadow: "0 1px 2px rgba(31,27,22,0.04), 0 6px 16px -8px rgba(31,27,22,0.10)",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-3)" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)", lineHeight: 1.1 }}>
            {(tokenName as string) ?? "Tokenized TSLA"}
          </h2>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-3)" }}>
            {(tokenSymbol as string) ?? "tTSLA"}
          </span>
          {paused === true && (
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)",
              background: "var(--red-dim)", border: "1px solid var(--red-border)",
              padding: "2px 8px", letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Paused
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-3)" }}>
          Robinhood Chain · Tokenized equity
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: "var(--sp-1)" }}>
          Your balance
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 40, fontWeight: 500, color: "var(--amber)",
          fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", lineHeight: 1,
          opacity: balLoading ? 0.3 : 1, transition: "opacity var(--duration) var(--ease)",
        }}>
          {fmtBal}
          <span style={{ fontSize: 16, color: "var(--text-3)", marginLeft: 8, letterSpacing: 0 }}>
            {(tokenSymbol as string) ?? "tTSLA"}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- *
 *  Credential card — decode the on-chain attestation into KYC fields
 * ---------------------------------------------------------------- */
function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      width: 9, height: 9, borderRadius: "50%", flexShrink: 0,
      background: ok ? "var(--green)" : "var(--text-4)",
      boxShadow: ok ? "0 0 10px rgba(52,211,153,0.45)" : "none",
    }} />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: "var(--sp-1)" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-1)" }}>
        {children}
      </div>
    </div>
  );
}

export function CredentialCard() {
  const { address } = useAccount();

  const { data: uid } = useReadContract({
    address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "attestationUIDs",
    args: address ? [address] : undefined, query: { enabled: !!address && !!addresses.complianceEngine },
  });

  const hasUid = typeof uid === "string" && uid !== ZERO_BYTES32;

  const { data: att } = useReadContract({
    address: addresses.registry, abi: covenantAttesterAbi, functionName: "getAttestation",
    args: hasUid ? [uid as Hex] : undefined,
    query: { enabled: hasUid && !!addresses.registry },
  });

  const attestation = att as
    | { expirationTime: bigint; attester: Address; data: Hex }
    | undefined;
  const cred: DecodedCredential | null = attestation ? decodeCredential(attestation.data) : null;
  const verified = hasUid && !!cred;

  return (
    <section style={{ background: "var(--surface-1)", border: "1px solid var(--border)", padding: "var(--sp-8)", boxShadow: "0 1px 2px rgba(31,27,22,0.04), 0 6px 16px -8px rgba(31,27,22,0.10)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-6)" }}>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)" }}>
          Your credential
        </h3>
        <span style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: verified ? "var(--green)" : "var(--text-3)" }}>
          <StatusDot ok={verified} />
          {verified ? "Verified" : "Unverified"}
        </span>
      </div>

      {!verified ? (
        <div style={{ padding: "var(--sp-6) 0", borderTop: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, maxWidth: 460 }}>
            This wallet has no Covenant attestation. The issuer must verify it in an allowed
            jurisdiction before it can receive or send tTSLA.
          </p>
        </div>
      ) : (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-6)",
            borderTop: "1px solid var(--border)", paddingTop: "var(--sp-6)",
          }}>
            <Field label="Jurisdiction">
              {cred!.countryName}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-3)", marginLeft: 8 }}>
                {cred!.countryCode}
              </span>
            </Field>
            <Field label="Investor type">
              {cred!.investorTypeLabel}
              {cred!.accredited && (
                <span style={{
                  marginLeft: 8, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 500,
                  color: "var(--amber)", background: "var(--amber-dim)", border: "1px solid var(--amber-border)",
                  padding: "1px 8px", verticalAlign: "middle",
                }}>
                  Accredited
                </span>
              )}
            </Field>
            <Field label="Issued by">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)" }}>
                {shortAddr(attestation!.attester)}
              </span>
            </Field>
            <Field label="Expiry">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)" }}>
                {formatExpiry(attestation!.expirationTime)}
              </span>
            </Field>
          </div>

          <div style={{ marginTop: "var(--sp-6)", paddingTop: "var(--sp-4)", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: "var(--sp-1)" }}>
              Attestation UID
            </div>
            <a href={`${CHAIN_EXPLORER}/tx/${uid as string}`} target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--amber)", textDecoration: "none", wordBreak: "break-all", lineHeight: 1.5 }}>
              {uid as string}
            </a>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- *
 *  The Gate — live debounced canTransfer verdict + transfer write
 * ---------------------------------------------------------------- */
type Verdict = { ok: boolean; reason: string };

function inputStyle(invalid: boolean): React.CSSProperties {
  return {
    width: "100%", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-1)",
    background: "var(--surface-2)", border: `1px solid ${invalid ? "var(--red-border)" : "var(--border)"}`,
    padding: "14px 16px", outline: "none", minHeight: 52,
    fontVariantNumeric: "tabular-nums",
  };
}

function fieldLabel(text: string): React.ReactNode {
  return (
    <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: "var(--sp-2)" }}>
      {text}
    </span>
  );
}

export function TheGate() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [checking, setChecking] = useState(false);

  const { data: decimals } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals" });
  const { data: symbol } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "symbol" });
  const dec = typeof decimals === "number" ? decimals : 18;

  const recipientValid = isAddress(recipient);
  const amountValid = parseFloat(amount) > 0;
  const inputsReady = !!address && recipientValid && amountValid;

  const { refetch: checkCompliance } = useReadContract({
    address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "canTransfer",
    args: inputsReady ? [address, recipient as Address, parseUnits(amount, dec)] : undefined,
    query: { enabled: false },
  });

  // Debounced live verdict: re-run canTransfer ~400ms after inputs settle.
  useEffect(() => {
    if (!inputsReady) {
      setVerdict(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const r = await checkCompliance();
        if (r.data) {
          const [ok, reason] = r.data as [boolean, string];
          setVerdict({ ok, reason });
        } else {
          setVerdict(null);
        }
      } catch {
        setVerdict({ ok: false, reason: "Compliance check failed" });
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
    // checkCompliance is a stable refetch fn; inputs drive the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient, amount, inputsReady]);

  const { writeContract, data: txHash, isPending, error: txError } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash: txHash });

  function handleTransfer() {
    if (!inputsReady) return;
    writeContract(
      { address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "transfer", args: [recipient as Address, parseUnits(amount, dec)] },
      { onSuccess: () => toast("Transfer submitted", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") },
    );
  }

  const allowed = verdict?.ok === true;
  const blocked = verdict?.ok === false;

  // Verdict surface colour: idle (neutral) → checking → allowed (amber/green) / blocked (red).
  const verdictBg = allowed ? "var(--green-dim)" : blocked ? "var(--red-dim)" : "var(--surface-2)";
  const verdictBorder = allowed ? "var(--green-border)" : blocked ? "var(--red-border)" : "var(--border)";
  const sym = (symbol as string) ?? "tTSLA";

  return (
    <section style={{
      background: "var(--surface-1)", border: "1px solid var(--amber-border)",
      padding: "var(--sp-8)", position: "relative",
      boxShadow: "0 0 0 1px var(--amber-border), 0 16px 40px -16px rgba(154,107,30,0.20)",
    }}>
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--amber)", opacity: 0.8, marginBottom: "var(--sp-3)" }}>
          Live compliance check
        </div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)", marginBottom: "var(--sp-2)" }}>
          The compliance gate
        </h3>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, maxWidth: 520 }}>
          Every transfer is checked against the live compliance engine before it can settle.
          Enter a recipient and amount to see the verdict.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "var(--sp-4)", marginBottom: "var(--sp-6)" }} className="gate-inputs">
        <label style={{ display: "block" }}>
          {fieldLabel("Recipient")}
          <input
            type="text" value={recipient}
            onChange={(e) => setRecipient(e.target.value.trim())}
            placeholder="0x…" aria-label="Recipient address"
            aria-invalid={recipient.length > 0 && !recipientValid}
            style={inputStyle(recipient.length > 0 && !recipientValid)}
          />
          {recipient.length > 0 && !recipientValid && (
            <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--red)", marginTop: "var(--sp-2)" }}>
              Enter a valid wallet address
            </span>
          )}
        </label>
        <label style={{ display: "block" }}>
          {fieldLabel(`Amount (${sym})`)}
          <input
            type="text" inputMode="decimal" value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00" aria-label="Transfer amount"
            style={inputStyle(false)}
          />
        </label>
      </div>

      {/* Verdict card — reads closed → open as it flips to allowed */}
      <div
        aria-live="polite"
        style={{
          background: verdictBg, border: `1px solid ${verdictBorder}`,
          padding: "var(--sp-6)", marginBottom: "var(--sp-6)",
          transition: "background var(--duration) var(--ease), border-color var(--duration) var(--ease)",
        }}
      >
        {!inputsReady ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <GateIcon state="idle" />
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 500, color: "var(--text-2)" }}>
                Awaiting transfer details
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)" }}>
                The gate stays closed until a recipient and amount are entered.
              </div>
            </div>
          </div>
        ) : checking ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <GateIcon state="idle" />
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 500, color: "var(--text-2)" }}>
              Checking compliance…
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-4)" }}>
            <GateIcon state={allowed ? "open" : "closed"} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: allowed ? "var(--green)" : "var(--red)", lineHeight: 1.2 }}>
                {allowed ? "Transfer allowed" : "Transfer blocked"}
              </div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", marginTop: "var(--sp-2)", lineHeight: 1.55 }}>
                {allowed
                  ? "All compliance modules passed. Both parties are verified for settlement."
                  : "The compliance engine refused this transfer."}
              </div>
              {blocked && verdict?.reason && (
                <div style={{ marginTop: "var(--sp-3)", display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)",
                    background: "var(--red-dim)", border: "1px solid var(--red-border)", padding: "2px 8px",
                  }}>
                    {verdict.reason}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tx status */}
      {txHash && (
        <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: "var(--sp-6)", fontSize: 13 }}>
          <span style={{ color: "var(--text-2)" }}>{confirming ? "Confirming…" : confirmed ? "Confirmed" : "Submitted"}</span>
          <a href={`${CHAIN_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--amber)", marginLeft: 12, textDecoration: "none" }}>
            {txHash.slice(0, 10)}…{txHash.slice(-6)}
          </a>
        </div>
      )}
      {txError && (
        <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--red-dim)", border: "1px solid var(--red-border)", marginBottom: "var(--sp-6)", fontSize: 13, color: "var(--red)" }}>
          {txError.message.split("\n")[0]}
        </div>
      )}

      <button
        onClick={handleTransfer}
        disabled={!allowed || isPending || confirming}
        className="btn btn-primary"
        style={{ width: "100%", minHeight: 52 }}
      >
        {isPending ? "Sending…" : confirming ? "Confirming…" : allowed ? "Send transfer" : "Transfer locked"}
      </button>
    </section>
  );
}

function GateIcon({ state }: { state: "idle" | "open" | "closed" }) {
  const color = state === "open" ? "var(--green)" : state === "closed" ? "var(--red)" : "var(--text-3)";
  const border = state === "open" ? "var(--green-border)" : state === "closed" ? "var(--red-border)" : "var(--border)";
  const bg = state === "open" ? "var(--green-dim)" : state === "closed" ? "var(--red-dim)" : "transparent";
  return (
    <span style={{
      width: 44, height: 44, flexShrink: 0, border: `1px solid ${border}`, background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background var(--duration) var(--ease), border-color var(--duration) var(--ease)",
    }}>
      {state === "open" ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 10l4 4 6-7" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : state === "closed" ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6 6l8 8M14 6l-8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="6" stroke={color} strokeWidth="1.5" /></svg>
      )}
    </span>
  );
}

export function InvestorView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
      <IdentityStrip />
      <CredentialCard />
      <TheGate />
    </div>
  );
}

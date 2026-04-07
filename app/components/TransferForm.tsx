"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, isAddress, type Address } from "viem";
import { addresses, rwaTokenAbi, complianceEngineAbi, BSC_TESTNET_EXPLORER } from "@/lib/contracts";
import { useToast } from "./Toast";

export function TransferForm() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [preCheck, setPreCheck] = useState<{ ok: boolean; reason: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const { data: decimals } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals",
  });
  const dec = typeof decimals === "number" ? decimals : 18;

  const { refetch: checkCompliance } = useReadContract({
    address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "canTransfer",
    args: address && isAddress(recipient) && amount ? [address, recipient as Address, parseUnits(amount, dec)] : undefined,
    query: { enabled: false },
  });

  const { writeContract, data: txHash, isPending, error: txError } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash: txHash });

  async function handleCheck() {
    if (!address || !isAddress(recipient) || !amount) return;
    setChecking(true);
    setPreCheck(null);
    try {
      const r = await checkCompliance();
      if (r.data) {
        const [ok, reason] = r.data as [boolean, string];
        setPreCheck({ ok, reason });
      }
    } catch {
      setPreCheck({ ok: false, reason: "Pre-check call failed" });
    }
    setChecking(false);
  }

  function handleTransfer() {
    if (!address || !isAddress(recipient) || !amount) return;
    writeContract(
      { address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "transfer", args: [recipient as Address, parseUnits(amount, dec)] },
      { onSuccess: () => toast("Transfer submitted", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") }
    );
  }

  const valid = isAddress(recipient) && parseFloat(amount) > 0;

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--amber-border)", padding: "var(--sp-6)" }}>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)", marginBottom: "var(--sp-5)" }}>
        Transfer
      </h2>

      <div style={{ marginBottom: "var(--sp-4)" }}>
        <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "var(--sp-2)" }}>
          Recipient
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => { setRecipient(e.target.value); setPreCheck(null); }}
          placeholder="0x..."
          style={{
            width: "100%", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-1)",
            background: "var(--surface-2)", border: "1px solid var(--border)", padding: "12px 16px",
            outline: "none", minHeight: 48,
          }}
        />
        {recipient && !isAddress(recipient) && (
          <div style={{ fontSize: 13, color: "var(--red)", marginTop: "var(--sp-2)" }}>Invalid address</div>
        )}
      </div>

      <div style={{ marginBottom: "var(--sp-4)" }}>
        <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "var(--sp-2)" }}>
          Amount
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, "")); setPreCheck(null); }}
          placeholder="0.00"
          style={{
            width: "100%", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-1)",
            background: "var(--surface-2)", border: "1px solid var(--border)", padding: "12px 16px",
            outline: "none", fontVariantNumeric: "tabular-nums", minHeight: 48,
          }}
        />
      </div>

      {/* Pre-check result */}
      {preCheck && (
        <div style={{
          padding: "var(--sp-4)", marginBottom: "var(--sp-4)",
          background: preCheck.ok ? "var(--green-dim)" : "var(--red-dim)",
          border: `1px solid ${preCheck.ok ? "var(--green-border)" : "var(--red-border)"}`,
          display: "flex", alignItems: "flex-start", gap: "var(--sp-3)",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            {preCheck.ok
              ? <path d="M5 9l3 3 5-5" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              : <path d="M6 6l6 6M12 6l-6 6" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" />
            }
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: preCheck.ok ? "var(--green)" : "var(--red)", lineHeight: 1.5 }}>
            {preCheck.ok ? "Transfer is compliant" : `Blocked: ${preCheck.reason}`}
          </span>
        </div>
      )}

      {/* Tx status */}
      {txHash && (
        <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--surface-2)", border: "1px solid var(--border)", marginBottom: "var(--sp-4)", fontSize: 13 }}>
          <span style={{ color: "var(--text-2)" }}>{confirming ? "Confirming..." : confirmed ? "Confirmed" : "Submitted"}</span>
          <a href={`${BSC_TESTNET_EXPLORER}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--amber)", marginLeft: 12, textDecoration: "none" }}>
            {txHash.slice(0, 10)}...{txHash.slice(-6)}
          </a>
        </div>
      )}

      {txError && (
        <div style={{ padding: "var(--sp-3) var(--sp-4)", background: "var(--red-dim)", border: "1px solid var(--red-border)", marginBottom: "var(--sp-4)", fontSize: 13, color: "var(--red)" }}>
          {txError.message.split("\n")[0]}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: "flex", gap: "var(--sp-3)" }}>
        <button
          onClick={handleCheck}
          disabled={!valid || checking}
          style={{
            flex: 1, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500,
            color: "var(--text-2)", background: "transparent", border: "1px solid var(--border)",
            padding: "12px 20px", cursor: valid && !checking ? "pointer" : "not-allowed",
            opacity: !valid || checking ? 0.4 : 1, minHeight: 48,
            transition: "border-color var(--duration) var(--ease)",
          }}
        >
          {checking ? "Checking..." : "Pre-Check"}
        </button>
        <button
          onClick={handleTransfer}
          disabled={!valid || isPending || confirming}
          style={{
            flex: 1, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500,
            color: "var(--black)", background: "var(--amber)", border: "none",
            padding: "12px 20px", cursor: valid && !isPending ? "pointer" : "not-allowed",
            opacity: !valid || isPending || confirming ? 0.4 : 1, minHeight: 48,
            transition: "opacity var(--duration) var(--ease)",
          }}
        >
          {isPending ? "Sending..." : confirming ? "Confirming..." : "Transfer"}
        </button>
      </div>
    </div>
  );
}

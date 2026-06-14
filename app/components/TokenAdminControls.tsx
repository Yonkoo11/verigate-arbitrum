"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { isAddress, type Address } from "viem";
import { rwaTokenAbi } from "@/lib/contracts";
import { useToast } from "./Toast";
import { Card, Heading } from "./ui";

/**
 * Issuer controls for ANY deployed RWA token (pause/unpause + freeze/unfreeze).
 * Reuses the same write flows as IssuerConsole's SupplyControls, parameterized by token.
 */
export function TokenAdminControls({ token }: { token: Address }) {
  const { toast } = useToast();
  const { data: paused } = useReadContract({ address: token, abi: rwaTokenAbi, functionName: "paused" });

  const { writeContract: wPause, isPending: pauseP } = useWriteContract();
  const [freezeAddr, setFreezeAddr] = useState("");
  const { writeContract: wFreeze, isPending: freezeP } = useWriteContract();
  const { writeContract: wUnfreeze, isPending: unfreezeP } = useWriteContract();

  function doPause() {
    wPause(
      { address: token, abi: rwaTokenAbi, functionName: paused ? "unpause" : "pause" },
      { onSuccess: () => toast(paused ? "Unpaused" : "Paused", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") },
    );
  }
  function doFreeze() {
    if (!isAddress(freezeAddr)) return;
    wFreeze(
      { address: token, abi: rwaTokenAbi, functionName: "freezeAddress", args: [freezeAddr as Address] },
      { onSuccess: () => toast("Frozen", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") },
    );
  }
  function doUnfreeze() {
    if (!isAddress(freezeAddr)) return;
    wUnfreeze(
      { address: token, abi: rwaTokenAbi, functionName: "unfreezeAddress", args: [freezeAddr as Address] },
      { onSuccess: () => toast("Unfrozen", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") },
    );
  }

  return (
    <Card>
      <Heading title="Issuer controls" blurb="Pause trading for this token or freeze a single wallet. Only the token owner can call these." />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-4)", flexWrap: "wrap", paddingBottom: "var(--sp-6)", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 2 }}>Trading status</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)" }}>
            {paused ? "Transfers are paused for all holders." : "Transfers are live for all holders."}
          </div>
        </div>
        <button onClick={doPause} disabled={pauseP} className={`btn ${paused ? "btn-primary" : "btn-ghost"}`} style={{ minHeight: 44 }}>
          {pauseP ? "…" : paused ? "Resume trading" : "Pause trading"}
        </button>
      </div>

      <div style={{ marginTop: "var(--sp-6)" }}>
        <label style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: "var(--sp-2)" }}>
          Freeze address
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "var(--sp-3)", alignItems: "end" }} className="issuer-row">
          <input
            value={freezeAddr} onChange={(e) => setFreezeAddr(e.target.value.trim())} placeholder="0x…" aria-label="Address to freeze"
            style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text-1)", background: "var(--surface-2)", border: "1px solid var(--border)", padding: "14px 16px", outline: "none", minHeight: 52 }}
          />
          <button onClick={doFreeze} disabled={!isAddress(freezeAddr) || freezeP} className="btn btn-danger" style={{ minHeight: 52 }}>{freezeP ? "…" : "Freeze"}</button>
          <button onClick={doUnfreeze} disabled={!isAddress(freezeAddr) || unfreezeP} className="btn btn-ghost" style={{ minHeight: 52 }}>{unfreezeP ? "…" : "Unfreeze"}</button>
        </div>
      </div>
    </Card>
  );
}

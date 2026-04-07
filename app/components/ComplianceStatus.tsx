"use client";

import { useAccount, useReadContract } from "wagmi";
import { addresses, complianceEngineAbi, rwaTokenAbi, BSC_TESTNET_EXPLORER } from "@/lib/contracts";

const MODULE_ABI = [{ type: "function", name: "moduleInfo", inputs: [], outputs: [{ type: "string", name: "name" }, { type: "string", name: "description" }], stateMutability: "view" }] as const;

function ModuleRow({ address: addr }: { address: string }) {
  const { data } = useReadContract({
    address: addr as `0x${string}`,
    abi: MODULE_ABI,
    functionName: "moduleInfo",
  });
  const name = data ? (data as [string, string])[0] : "Loading...";
  const desc = data ? (data as [string, string])[1] : "";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "var(--sp-3)",
      padding: "var(--sp-3) var(--sp-4)",
      background: "var(--surface-2)",
      marginBottom: "var(--sp-2)",
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
          {name}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{desc}</div>
        )}
      </div>
      <a
        href={`${BSC_TESTNET_EXPLORER}/address/${addr}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textDecoration: "none" }}
      >
        {addr.slice(0, 6)}...{addr.slice(-4)}
      </a>
    </div>
  );
}

function StatusRow({ label, ok, text, loading }: { label: string; ok: boolean; text: string; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "var(--sp-3) 0" }}>
        <span style={{ fontSize: 14, color: "var(--text-2)" }}>{label}</span>
        <div style={{ width: 80, height: 16, background: "var(--surface-3)", opacity: 0.5 }} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--sp-3) 0" }}>
      <span style={{ fontSize: 14, color: "var(--text-2)" }}>{label}</span>
      <span style={{
        display: "flex", alignItems: "center", gap: "var(--sp-2)",
        fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500,
        color: ok ? "var(--green)" : "var(--red)",
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          {ok
            ? <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            : <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          }
        </svg>
        {text}
      </span>
    </div>
  );
}

export function ComplianceStatus() {
  const { address } = useAccount();

  const { data: hasAttestation, isLoading: attLoad } = useReadContract({
    address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "hasAttestation",
    args: address ? [address] : undefined, query: { enabled: !!address && !!addresses.complianceEngine },
  });
  const { data: attestationUID } = useReadContract({
    address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "attestationUIDs",
    args: address ? [address] : undefined, query: { enabled: !!address && !!addresses.complianceEngine },
  });
  const { data: isFrozen, isLoading: frozenLoad } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "frozen",
    args: address ? [address] : undefined, query: { enabled: !!address && !!addresses.rwaToken },
  });
  const { data: modules } = useReadContract({
    address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "getModules",
    query: { enabled: !!addresses.complianceEngine },
  });

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", padding: "var(--sp-6)" }}>
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)", marginBottom: "var(--sp-5)" }}>
        Compliance
      </h2>

      <div style={{ borderBottom: "1px solid var(--border)", marginBottom: "var(--sp-4)" }}>
        <StatusRow label="BAS Attestation" ok={!!hasAttestation} text={hasAttestation ? "Verified" : "Not Found"} loading={attLoad} />
        <StatusRow label="Freeze Status" ok={!isFrozen} text={isFrozen ? "Frozen" : "Active"} loading={frozenLoad} />
      </div>

      {/* Attestation UID */}
      {typeof attestationUID === "string" && attestationUID !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
        <div style={{ marginBottom: "var(--sp-4)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "var(--sp-1)" }}>
            Attestation UID
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-2)", wordBreak: "break-all", lineHeight: 1.5 }}>
            {attestationUID}
          </div>
        </div>
      ) : null}

      {/* Active Modules */}
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "var(--sp-3)" }}>
        Active Modules
      </div>
      {Array.isArray(modules) && modules.length > 0 ? (
        <div>
          {(modules as string[]).map((mod, i) => (
            <ModuleRow key={i} address={mod} />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>No modules registered</p>
      )}
    </div>
  );
}

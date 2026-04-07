"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, isAddress, type Address, toHex } from "viem";
import { addresses, rwaTokenAbi, complianceEngineAbi, countryRestrictionAbi, BSC_TESTNET_EXPLORER } from "@/lib/contracts";
import { useToast } from "./Toast";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "var(--sp-2)" }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, mono = true, style: extra }: { value: string; onChange: (v: string) => void; placeholder: string; mono?: boolean; style?: React.CSSProperties }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontSize: 16,
        color: "var(--text-1)", background: "var(--surface-2)", border: "1px solid var(--border)",
        padding: "10px 14px", outline: "none", minHeight: 44, ...extra,
      }}
    />
  );
}

function Btn({ onClick, disabled, children, variant = "primary" }: { onClick: () => void; disabled: boolean; children: React.ReactNode; variant?: "primary" | "outline" | "danger" }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--amber)", color: "var(--black)", border: "none" },
    outline: { background: "transparent", color: "var(--text-2)", border: "1px solid var(--border)" },
    danger: { background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red-border)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, padding: "8px 16px",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        minHeight: 40, flexShrink: 0, whiteSpace: "nowrap", transition: "opacity var(--duration) var(--ease)",
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

function TxLink({ hash }: { hash: string | undefined }) {
  if (!hash) return null;
  return (
    <a href={`${BSC_TESTNET_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
      style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)", textDecoration: "none" }}>
      {hash.slice(0, 10)}...{hash.slice(-6)}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: "var(--sp-5)", paddingBottom: "var(--sp-5)", borderBottom: "1px solid var(--border)" }}>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: "var(--sp-4)" }}>{title}</h3>
      {children}
    </div>
  );
}

export function IssuerPanel() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { data: owner } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "owner", query: { enabled: !!addresses.rwaToken } });

  const isOwner = !!address && !!owner && (address as string).toLowerCase() === (owner as string).toLowerCase();

  const [mintTo, setMintTo] = useState("");
  const [mintAmt, setMintAmt] = useState("");
  const { writeContract: wMint, data: mintHash, isPending: mintP } = useWriteContract();

  const [attWallet, setAttWallet] = useState("");
  const [attUID, setAttUID] = useState("");
  const { writeContract: wAtt, data: attHash, isPending: attP } = useWriteContract();

  const [freezeAddr, setFreezeAddr] = useState("");
  const { writeContract: wFreeze, data: freezeHash, isPending: freezeP } = useWriteContract();
  const { writeContract: wUnfreeze, data: unfreezeHash, isPending: unfreezeP } = useWriteContract();

  const [country, setCountry] = useState("");
  const { writeContract: wBlock, data: blockHash, isPending: blockP } = useWriteContract();
  const { writeContract: wUnblock, data: unblockHash, isPending: unblockP } = useWriteContract();

  const { data: blocked } = useReadContract({ address: addresses.countryRestriction, abi: countryRestrictionAbi, functionName: "getBlockedCountries", query: { enabled: !!addresses.countryRestriction } });
  const { data: decimals } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals" });
  const dec = typeof decimals === "number" ? decimals : 18;

  if (!isOwner) return null;

  function doMint() {
    if (!isAddress(mintTo) || !mintAmt) return;
    wMint({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "mint", args: [mintTo as Address, parseUnits(mintAmt, dec)] },
      { onSuccess: () => toast("Minted", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }

  function doAtt() {
    if (!isAddress(attWallet) || !attUID) return;
    const uid = attUID.startsWith("0x") ? (attUID as `0x${string}`) : (`0x${attUID}` as `0x${string}`);
    wAtt({ address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "setAttestationUID", args: [attWallet as Address, uid] },
      { onSuccess: () => toast("Attestation set", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }

  function doFreeze() {
    if (!isAddress(freezeAddr)) return;
    wFreeze({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "freezeAddress", args: [freezeAddr as Address] },
      { onSuccess: () => toast("Frozen", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }

  function doUnfreeze() {
    if (!isAddress(freezeAddr)) return;
    wUnfreeze({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "unfreezeAddress", args: [freezeAddr as Address] },
      { onSuccess: () => toast("Unfrozen", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }

  function doBlock() {
    if (country.length !== 2) return;
    const b = toHex(new TextEncoder().encode(country.toUpperCase())) as `0x${string}`;
    wBlock({ address: addresses.countryRestriction, abi: countryRestrictionAbi, functionName: "blockCountry", args: [b] },
      { onSuccess: () => toast(`${country.toUpperCase()} blocked`, "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }

  function doUnblock() {
    if (country.length !== 2) return;
    const b = toHex(new TextEncoder().encode(country.toUpperCase())) as `0x${string}`;
    wUnblock({ address: addresses.countryRestriction, abi: countryRestrictionAbi, functionName: "unblockCountry", args: [b] },
      { onSuccess: () => toast(`${country.toUpperCase()} unblocked`, "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }

  function decodeCountry(hex: string): string {
    try {
      const b = hex.startsWith("0x") ? hex.slice(2) : hex;
      return String.fromCharCode(parseInt(b.slice(0, 2), 16)) + String.fromCharCode(parseInt(b.slice(2, 4), 16));
    } catch { return hex; }
  }

  return (
    <div style={{ background: "var(--surface-1)", border: "1px solid var(--amber-border)", padding: "var(--sp-6)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-2)" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)" }}>Issuer Admin</h2>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--amber)", background: "var(--amber-dim)", border: "1px solid var(--amber-border)", padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Owner
        </span>
      </div>

      <Section title="Mint Tokens">
        <div className="admin-row">
          <div style={{ flex: 1 }}><Label>Recipient</Label><Input value={mintTo} onChange={setMintTo} placeholder="0x..." /></div>
          <div style={{ width: 140 }}><Label>Amount</Label><Input value={mintAmt} onChange={(v) => setMintAmt(v.replace(/[^0-9.]/g, ""))} placeholder="1000" /></div>
          <Btn onClick={doMint} disabled={!isAddress(mintTo) || !mintAmt || mintP}>{mintP ? "..." : "Mint"}</Btn>
        </div>
        <div style={{ marginTop: "var(--sp-2)" }}><TxLink hash={mintHash} /></div>
      </Section>

      <Section title="Set Attestation UID">
        <div className="admin-row">
          <div style={{ flex: 1 }}><Label>Wallet</Label><Input value={attWallet} onChange={setAttWallet} placeholder="0x..." /></div>
          <div style={{ flex: 1 }}><Label>UID (bytes32)</Label><Input value={attUID} onChange={setAttUID} placeholder="0x..." /></div>
          <Btn onClick={doAtt} disabled={!isAddress(attWallet) || !attUID || attP}>{attP ? "..." : "Set"}</Btn>
        </div>
        <div style={{ marginTop: "var(--sp-2)" }}><TxLink hash={attHash} /></div>
      </Section>

      <Section title="Freeze / Unfreeze">
        <div className="admin-row">
          <div style={{ flex: 1 }}><Label>Address</Label><Input value={freezeAddr} onChange={setFreezeAddr} placeholder="0x..." /></div>
          <Btn onClick={doFreeze} disabled={!isAddress(freezeAddr) || freezeP}>{freezeP ? "..." : "Freeze"}</Btn>
          <Btn onClick={doUnfreeze} disabled={!isAddress(freezeAddr) || unfreezeP} variant="danger">{unfreezeP ? "..." : "Unfreeze"}</Btn>
        </div>
        <div style={{ marginTop: "var(--sp-2)" }}><TxLink hash={freezeHash || unfreezeHash} /></div>
      </Section>

      {addresses.countryRestriction && (
        <Section title="Country Restrictions">
          {Array.isArray(blocked) && blocked.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)", marginBottom: "var(--sp-4)" }}>
              {(blocked as string[]).map((c: string, i: number) => (
                <span key={i} style={{
                  fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color: "var(--red)",
                  background: "var(--red-dim)", border: "1px solid var(--red-border)", padding: "3px 10px",
                  letterSpacing: "0.04em",
                }}>
                  {decodeCountry(c)}
                </span>
              ))}
            </div>
          )}
          <div className="admin-row">
            <div style={{ width: 100 }}>
              <Label>Code</Label>
              <Input value={country} onChange={(v) => setCountry(v.toUpperCase().slice(0, 2))} placeholder="US" style={{ textTransform: "uppercase" }} />
            </div>
            <Btn onClick={doBlock} disabled={country.length !== 2 || blockP} variant="danger">{blockP ? "..." : "Block"}</Btn>
            <Btn onClick={doUnblock} disabled={country.length !== 2 || unblockP} variant="outline">{unblockP ? "..." : "Unblock"}</Btn>
          </div>
          <div style={{ marginTop: "var(--sp-2)" }}><TxLink hash={blockHash || unblockHash} /></div>
        </Section>
      )}
    </div>
  );
}

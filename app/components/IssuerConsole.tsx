"use client";

import { useEffect, useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, isAddress, type Address, toHex, encodeAbiParameters, decodeEventLog, stringToHex } from "viem";
import { addresses, rwaTokenAbi, complianceEngineAbi, countryRestrictionAbi, covenantAttesterAbi, KYC_SCHEMA, CHAIN_EXPLORER } from "@/lib/contracts";
import { ZERO_BYTES32 } from "@/lib/credential";
import { useToast } from "./Toast";

// Default-allowed jurisdictions plus a few that the module blocks (for demo).
export const COUNTRY_OPTIONS = ["US", "GB", "DE", "SG", "KP", "IR", "SY"];
export const COUNTRY_LABELS: Record<string, string> = {
  US: "United States", GB: "United Kingdom", DE: "Germany", SG: "Singapore",
  KP: "North Korea (blocked)", IR: "Iran (blocked)", SY: "Syria (blocked)",
};

/* ---- shared primitives ---- */
function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 500, color: "var(--text-2)", marginBottom: "var(--sp-2)" }}>
      {children}
    </label>
  );
}

function Input({ id, value, onChange, placeholder, ariaLabel, style: extra }: { id?: string; value: string; onChange: (v: string) => void; placeholder: string; ariaLabel?: string; style?: React.CSSProperties }) {
  return (
    <input
      id={id} type="text" value={value} aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", fontFamily: "var(--font-mono)", fontSize: 16,
        color: "var(--text-1)", background: "var(--surface-2)", border: "1px solid var(--border)",
        padding: "14px 16px", outline: "none", minHeight: 52, ...extra,
      }}
    />
  );
}

function Select({ id, value, onChange, options, ariaLabel }: { id?: string; value: string; onChange: (v: string) => void; options: string[]; ariaLabel?: string }) {
  return (
    <select
      id={id} value={value} aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", fontFamily: "var(--font-sans)", fontSize: 16,
        color: "var(--text-1)", background: "var(--surface-2)", border: "1px solid var(--border)",
        padding: "14px 16px", outline: "none", minHeight: 52, appearance: "none" as const,
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path d='M2 4l4 4 4-4' stroke='%231F1B16' stroke-opacity='0.5' stroke-width='1.3' fill='none' stroke-linecap='round'/></svg>\")",
        backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{COUNTRY_LABELS[o] ?? o}</option>
      ))}
    </select>
  );
}

function Btn({ onClick, disabled, children, variant = "primary", full = false }: { onClick: () => void; disabled: boolean; children: React.ReactNode; variant?: "primary" | "outline" | "danger"; full?: boolean }) {
  const variantClass = variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-ghost";
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`btn ${variantClass}`}
      style={{
        minHeight: 52, flexShrink: 0, whiteSpace: "nowrap", width: full ? "100%" : undefined,
      }}
    >
      {children}
    </button>
  );
}

function TxLink({ hash, label }: { hash: string | undefined; label?: string }) {
  if (!hash) return null;
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-3)" }}>
      {label ? `${label} ` : ""}
      <a href={`${CHAIN_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
        style={{ color: "var(--amber)", textDecoration: "none" }}>
        {hash.slice(0, 10)}…{hash.slice(-6)}
      </a>
    </span>
  );
}

function Card({ primary = false, children }: { primary?: boolean; children: React.ReactNode }) {
  return (
    <section style={{
      background: "var(--surface-1)",
      border: `1px solid ${primary ? "var(--amber-border)" : "var(--border)"}`,
      padding: "var(--sp-8)",
      boxShadow: primary
        ? "0 0 0 1px var(--amber-border), 0 16px 40px -16px rgba(154,107,30,0.20)"
        : "0 1px 2px rgba(31,27,22,0.04), 0 6px 16px -8px rgba(31,27,22,0.10)",
    }}>
      {children}
    </section>
  );
}

function Heading({ title, blurb }: { title: string; blurb?: string }) {
  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 500, color: "var(--text-1)" }}>{title}</h3>
      {blurb && <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginTop: "var(--sp-2)", maxWidth: 560 }}>{blurb}</p>}
    </div>
  );
}

export function decodeCountry(hex: string): string {
  try {
    const b = hex.startsWith("0x") ? hex.slice(2) : hex;
    return String.fromCharCode(parseInt(b.slice(0, 2), 16)) + String.fromCharCode(parseInt(b.slice(2, 4), 16));
  } catch { return hex; }
}

/* ---------------------------------------------------------------- *
 *  Verify Investor — primary surface (attest → event → setUID)
 * ---------------------------------------------------------------- */
export function VerifyInvestor() {
  const { toast } = useToast();
  const [vWallet, setVWallet] = useState("");
  const [vCountry, setVCountry] = useState("US");
  const [accredited, setAccredited] = useState(true);

  const { writeContract: wAttest, data: attestHash, isPending: attestP, reset: resetAttest } = useWriteContract();
  const { data: attestReceipt, isLoading: attestConfirming } = useWaitForTransactionReceipt({ hash: attestHash });
  const { writeContract: wMap, data: mapHash, isPending: mapP } = useWriteContract();
  const [pendingWallet, setPendingWallet] = useState<Address | null>(null);
  const [linkedUid, setLinkedUid] = useState(false);
  const [done, setDone] = useState<{ wallet: Address; country: string; accredited: boolean } | null>(null);

  // Once the attest tx confirms, decode the Attested event for the UID, then map it in the engine.
  useEffect(() => {
    if (!attestReceipt || !pendingWallet || linkedUid) return;
    let uid: `0x${string}` | undefined;
    for (const log of attestReceipt.logs) {
      try {
        const ev = decodeEventLog({ abi: covenantAttesterAbi, data: log.data, topics: log.topics });
        if (ev.eventName === "Attested") {
          uid = (ev.args as unknown as { uid: `0x${string}` }).uid;
          break;
        }
      } catch {
        // not an Attested log from our attester ABI; skip
      }
    }
    if (!uid) {
      const attesterLog = attestReceipt.logs.find(
        (l) => l.address.toLowerCase() === (addresses.registry as string).toLowerCase() && l.topics[1],
      );
      uid = attesterLog?.topics[1] as `0x${string}` | undefined;
    }
    if (!uid) {
      toast("Could not read attestation UID from receipt", "error");
      return;
    }
    setLinkedUid(true);
    wMap(
      { address: addresses.complianceEngine, abi: complianceEngineAbi, functionName: "setAttestationUID", args: [pendingWallet, uid] },
      {
        onSuccess: () => {
          toast("Investor verified, attestation linked", "success");
          setDone({ wallet: pendingWallet, country: vCountry, accredited });
        },
        onError: (e) => { setLinkedUid(false); toast(e.message.split("\n")[0], "error"); },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attestReceipt, pendingWallet, linkedUid]);

  function doVerify() {
    if (!isAddress(vWallet) || !addresses.registry) return;
    setLinkedUid(false);
    setDone(null);
    setPendingWallet(vWallet as Address);
    resetAttest();
    // KYC data = abi.encode(uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry)
    const countryHex = stringToHex(vCountry, { size: 2 });
    const data = encodeAbiParameters(
      [{ type: "uint8" }, { type: "bytes2" }, { type: "bool" }, { type: "uint8" }, { type: "uint64" }],
      [2, countryHex, accredited, 1, BigInt(0)],
    );
    wAttest(
      { address: addresses.registry, abi: covenantAttesterAbi, functionName: "attest", args: [KYC_SCHEMA, vWallet as Address, BigInt(0), true, ZERO_BYTES32, data] },
      { onSuccess: () => toast("Attestation submitted, confirming…", "success"), onError: (e) => { setPendingWallet(null); toast(e.message.split("\n")[0], "error"); } },
    );
  }

  const verifyBusy = attestP || attestConfirming || mapP;
  const verifyLabel = attestP ? "Attesting…" : attestConfirming ? "Confirming…" : mapP ? "Linking…" : "Verify investor";

  return (
    <Card primary>
      <Heading
        title="Verify investor"
        blurb="Issue a Covenant KYC attestation on-chain and link it to the wallet in the compliance engine. Blocked jurisdictions (KP, IR, SY) still fail the country module at transfer time."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "var(--sp-4)", alignItems: "end", marginBottom: "var(--sp-5)" }} className="issuer-row">
        <div>
          <Label htmlFor="v-wallet">Investor wallet</Label>
          <Input id="v-wallet" value={vWallet} onChange={setVWallet} placeholder="0x…" ariaLabel="Investor wallet" />
        </div>
        <div>
          <Label htmlFor="v-country">Jurisdiction</Label>
          <Select id="v-country" value={vCountry} onChange={setVCountry} options={COUNTRY_OPTIONS} ariaLabel="Jurisdiction" />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-4)", flexWrap: "wrap", marginBottom: "var(--sp-6)" }}>
        <button
          type="button"
          role="switch"
          aria-checked={accredited}
          onClick={() => setAccredited((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
        >
          <span style={{
            width: 40, height: 24, flexShrink: 0, position: "relative",
            background: accredited ? "var(--amber)" : "var(--surface-3)",
            transition: "background var(--duration) var(--ease)",
          }}>
            <span style={{
              position: "absolute", top: 3, left: accredited ? 19 : 3, width: 18, height: 18, borderRadius: "50%",
              background: accredited ? "#FFFFFF" : "var(--text-3)",
              transition: "left var(--duration) var(--ease)",
            }} />
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-1)" }}>Accredited investor</span>
        </button>
        <Btn onClick={doVerify} disabled={!isAddress(vWallet) || !addresses.registry || verifyBusy}>{verifyLabel}</Btn>
      </div>

      <div style={{ display: "flex", gap: "var(--sp-5)", flexWrap: "wrap" }}>
        <TxLink hash={attestHash} label="attest:" />
        <TxLink hash={mapHash} label="link:" />
      </div>

      {done && (
        <div style={{ marginTop: "var(--sp-6)", paddingTop: "var(--sp-6)", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 10px rgba(52,211,153,0.45)" }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--green)" }}>Credential issued</span>
          </div>
          <div style={{ display: "flex", gap: "var(--sp-8)", flexWrap: "wrap", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-2)" }}>
            <span>Wallet <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>{done.wallet.slice(0, 6)}…{done.wallet.slice(-4)}</span></span>
            <span>Jurisdiction <span style={{ color: "var(--text-1)" }}>{COUNTRY_LABELS[done.country] ?? done.country}</span></span>
            <span>Accredited <span style={{ color: "var(--text-1)" }}>{done.accredited ? "Yes" : "No"}</span></span>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- *
 *  Supply & controls — secondary
 * ---------------------------------------------------------------- */
export function SupplyControls() {
  const { toast } = useToast();
  const { data: decimals } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "decimals" });
  const { data: paused } = useReadContract({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "paused" });
  const dec = typeof decimals === "number" ? decimals : 18;

  const [mintTo, setMintTo] = useState("");
  const [mintAmt, setMintAmt] = useState("");
  const { writeContract: wMint, data: mintHash, isPending: mintP } = useWriteContract();

  const { writeContract: wPause, isPending: pauseP } = useWriteContract();

  const [freezeAddr, setFreezeAddr] = useState("");
  const { writeContract: wFreeze, data: freezeHash, isPending: freezeP } = useWriteContract();
  const { writeContract: wUnfreeze, data: unfreezeHash, isPending: unfreezeP } = useWriteContract();

  function doMint() {
    if (!isAddress(mintTo) || !mintAmt) return;
    wMint({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "mint", args: [mintTo as Address, parseUnits(mintAmt, dec)] },
      { onSuccess: () => toast("Minted", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }
  function doPause() {
    wPause({ address: addresses.rwaToken, abi: rwaTokenAbi, functionName: paused ? "unpause" : "pause" },
      { onSuccess: () => toast(paused ? "Unpaused" : "Paused", "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
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

  return (
    <Card>
      <Heading title="Supply & controls" blurb="Issue new tTSLA and manage the token's trading state." />

      {/* Mint */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px auto", gap: "var(--sp-4)", alignItems: "end" }} className="issuer-row">
        <div>
          <Label htmlFor="mint-to">Mint to</Label>
          <Input id="mint-to" value={mintTo} onChange={setMintTo} placeholder="0x…" ariaLabel="Mint recipient" />
        </div>
        <div>
          <Label htmlFor="mint-amt">Amount</Label>
          <Input id="mint-amt" value={mintAmt} onChange={(v) => setMintAmt(v.replace(/[^0-9.]/g, ""))} placeholder="1000" ariaLabel="Mint amount" />
        </div>
        <Btn onClick={doMint} disabled={!isAddress(mintTo) || !mintAmt || mintP}>{mintP ? "Minting…" : "Mint"}</Btn>
      </div>
      <div style={{ marginTop: "var(--sp-2)" }}><TxLink hash={mintHash} /></div>

      {/* Pause */}
      <div style={{ marginTop: "var(--sp-6)", paddingTop: "var(--sp-6)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-4)", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 2 }}>
            Trading status
          </div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)" }}>
            {paused ? "Transfers are paused for all holders." : "Transfers are live for all holders."}
          </div>
        </div>
        <Btn onClick={doPause} disabled={pauseP} variant={paused ? "primary" : "outline"}>
          {pauseP ? "…" : paused ? "Resume trading" : "Pause trading"}
        </Btn>
      </div>

      {/* Freeze — de-emphasised, red-tinted */}
      <div style={{ marginTop: "var(--sp-6)", paddingTop: "var(--sp-6)", borderTop: "1px solid var(--border)" }}>
        <Label htmlFor="freeze-addr">Freeze address</Label>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text-3)", marginTop: -4, marginBottom: "var(--sp-3)", lineHeight: 1.5 }}>
          Freezing halts a single wallet's transfers. Use only for compliance enforcement.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "var(--sp-3)", alignItems: "end" }} className="issuer-row">
          <Input id="freeze-addr" value={freezeAddr} onChange={setFreezeAddr} placeholder="0x…" ariaLabel="Address to freeze" />
          <Btn onClick={doFreeze} disabled={!isAddress(freezeAddr) || freezeP} variant="danger">{freezeP ? "…" : "Freeze"}</Btn>
          <Btn onClick={doUnfreeze} disabled={!isAddress(freezeAddr) || unfreezeP} variant="outline">{unfreezeP ? "…" : "Unfreeze"}</Btn>
        </div>
        <div style={{ marginTop: "var(--sp-2)" }}><TxLink hash={freezeHash || unfreezeHash} /></div>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- *
 *  Jurisdiction policy — secondary
 * ---------------------------------------------------------------- */
export function JurisdictionPolicy() {
  const { toast } = useToast();
  const { data: blocked } = useReadContract({ address: addresses.countryRestriction, abi: countryRestrictionAbi, functionName: "getBlockedCountries", query: { enabled: !!addresses.countryRestriction } });
  const { writeContract: wBlock, data: blockHash, isPending: blockP } = useWriteContract();
  const { writeContract: wUnblock, isPending: unblockP } = useWriteContract();
  const [country, setCountry] = useState("KP");

  function doBlock() {
    if (country.length !== 2) return;
    const b = toHex(new TextEncoder().encode(country.toUpperCase())) as `0x${string}`;
    wBlock({ address: addresses.countryRestriction, abi: countryRestrictionAbi, functionName: "blockCountry", args: [b] },
      { onSuccess: () => toast(`${country.toUpperCase()} blocked`, "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }
  function doUnblock(code: string) {
    if (code.length !== 2) return;
    const b = toHex(new TextEncoder().encode(code.toUpperCase())) as `0x${string}`;
    wUnblock({ address: addresses.countryRestriction, abi: countryRestrictionAbi, functionName: "unblockCountry", args: [b] },
      { onSuccess: () => toast(`${code.toUpperCase()} unblocked`, "success"), onError: (e) => toast(e.message.split("\n")[0], "error") });
  }

  if (!addresses.countryRestriction) return null;

  const list = Array.isArray(blocked) ? (blocked as string[]).map(decodeCountry) : [];

  return (
    <Card>
      <Heading title="Jurisdiction policy" blurb="Countries blocked here fail the CountryRestriction module for every transfer, regardless of attestation." />

      {list.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)", marginBottom: "var(--sp-6)" }}>
          {list.map((c, i) => (
            <button
              key={i}
              onClick={() => doUnblock(c)}
              disabled={unblockP}
              aria-label={`Unblock ${c}`}
              className="btn btn-danger btn-sm"
              style={{
                gap: 6, fontFamily: "var(--font-mono)", color: "var(--red)",
                background: "var(--red-dim)", borderColor: "var(--red-border)",
                minHeight: 30, padding: "5px 8px 5px 12px",
              }}
            >
              {c}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text-3)", marginBottom: "var(--sp-6)" }}>
          No jurisdictions are currently blocked.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "240px auto", gap: "var(--sp-3)", alignItems: "end" }} className="issuer-row">
        <div>
          <Label htmlFor="block-country">Block a jurisdiction</Label>
          <Select id="block-country" value={country} onChange={setCountry} options={COUNTRY_OPTIONS} ariaLabel="Country to block" />
        </div>
        <Btn onClick={doBlock} disabled={country.length !== 2 || blockP} variant="danger">{blockP ? "…" : "Block"}</Btn>
      </div>
      <div style={{ marginTop: "var(--sp-2)" }}><TxLink hash={blockHash} /></div>
    </Card>
  );
}

export function IssuerConsole() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
      <VerifyInvestor />
      <SupplyControls />
      <JurisdictionPolicy />
    </div>
  );
}

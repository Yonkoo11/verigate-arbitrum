import { decodeAbiParameters, hexToString, type Hex } from "viem";

// ISO-3166 alpha-2 → display name. Covered demo set plus the module-blocked set.
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  SG: "Singapore",
  KP: "North Korea",
  IR: "Iran",
  SY: "Syria",
};

const INVESTOR_TYPES: Record<number, string> = {
  0: "Retail",
  1: "Individual",
  2: "Institutional",
  3: "Qualified Purchaser",
};

export interface DecodedCredential {
  kycLevel: number;
  countryCode: string;
  countryName: string;
  accredited: boolean;
  investorType: number;
  investorTypeLabel: string;
  expiry: bigint;
}

/** Read a 2-letter country code out of bytes2, tolerating trailing NUL padding. */
export function countryFromBytes2(code: Hex): string {
  try {
    const raw = hexToString(code).replace(/\0+$/g, "").trim();
    return raw || code;
  } catch {
    return code;
  }
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}

export function investorTypeLabel(t: number): string {
  return INVESTOR_TYPES[t] ?? `Type ${t}`;
}

/**
 * Decode the on-chain KYC attestation `data` blob.
 * Layout: abi.encode(uint8 kycLevel, bytes2 country, bool accredited, uint8 investorType, uint64 expiry)
 */
export function decodeCredential(data: Hex): DecodedCredential | null {
  try {
    const [kycLevel, country, accredited, investorType, expiry] =
      decodeAbiParameters(
        [{ type: "uint8" }, { type: "bytes2" }, { type: "bool" }, { type: "uint8" }, { type: "uint64" }],
        data,
      );
    const countryCode = countryFromBytes2(country as Hex);
    const it = Number(investorType);
    return {
      kycLevel: Number(kycLevel),
      countryCode,
      countryName: countryName(countryCode),
      accredited: accredited as boolean,
      investorType: it,
      investorTypeLabel: investorTypeLabel(it),
      expiry: expiry as bigint,
    };
  } catch {
    return null;
  }
}

export function formatExpiry(expiry: bigint): string {
  if (expiry === BigInt(0)) return "No expiry";
  const d = new Date(Number(expiry) * 1000);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export function shortAddr(a?: string): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

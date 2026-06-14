"use client";

import { useCallback, useEffect, useState } from "react";
import { parseAbiItem, type Address, type Hex } from "viem";
import { publicClient } from "@/lib/publicClient";
import { addresses, covenantAttesterAbi, COVENANT_DEPLOY_BLOCK } from "@/lib/contracts";
import { decodeCredential, type DecodedCredential } from "@/lib/credential";

const ATTESTED_EVENT = parseAbiItem(
  "event Attested(bytes32 indexed uid, address indexed recipient, address indexed attester, bytes32 schema)",
);
const REVOKED_EVENT = parseAbiItem("event Revoked(bytes32 indexed uid, address indexed attester)");

// Testnet RPCs cap getLogs ranges; query only a recent window, widening fallback on error.
const MAX_SPAN = 800000n;

export interface VerifiedInvestor {
  uid: Hex;
  recipient: Address;
  attester: Address;
  blockNumber: bigint;
  expirationTime: bigint;
  revoked: boolean;
  cred: DecodedCredential | null;
}

export function useAttestations() {
  const [data, setData] = useState<VerifiedInvestor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const latest = await publicClient.getBlockNumber();

      // Scan from the deployment block (full history), capped for RPC safety.
      const floor = latest > COVENANT_DEPLOY_BLOCK + MAX_SPAN ? latest - MAX_SPAN : COVENANT_DEPLOY_BLOCK;
      const fetchWindow = (from: bigint) =>
        Promise.all([
          publicClient.getLogs({ address: addresses.registry, event: ATTESTED_EVENT, fromBlock: from, toBlock: latest }),
          publicClient.getLogs({ address: addresses.registry, event: REVOKED_EVENT, fromBlock: from, toBlock: latest }).catch(() => [] as never[]),
        ]);

      let fetched: Awaited<ReturnType<typeof fetchWindow>> | null = null;
      let lastErr: unknown;
      for (const from of [floor, latest > 100000n ? latest - 100000n : 0n]) {
        try { fetched = await fetchWindow(from); break; }
        catch (e) { lastErr = e; }
      }
      if (!fetched) throw lastErr ?? new Error("getLogs failed");
      const [attestedLogs, revokedLogs] = fetched;

      const revokedSet = new Set(revokedLogs.map((l) => l.args.uid?.toLowerCase()).filter(Boolean) as string[]);

      const rows: VerifiedInvestor[] = await Promise.all(
        attestedLogs.map(async (log) => {
          const args = log.args as { uid: Hex; recipient: Address; attester: Address };
          let cred: DecodedCredential | null = null;
          let expirationTime = 0n;
          let revoked = revokedSet.has(args.uid.toLowerCase());
          try {
            const att = (await publicClient.readContract({
              address: addresses.registry, abi: covenantAttesterAbi, functionName: "getAttestation", args: [args.uid],
            })) as { expirationTime: bigint; revocationTime: bigint; data: Hex };
            cred = decodeCredential(att.data);
            expirationTime = att.expirationTime;
            if (att.revocationTime && att.revocationTime > 0n) revoked = true;
          } catch { /* attestation read may fail; keep log-level data */ }
          return { uid: args.uid, recipient: args.recipient, attester: args.attester, blockNumber: log.blockNumber ?? 0n, expirationTime, revoked, cred };
        }),
      );

      // Newest first, dedup by uid (latest wins).
      const byUid = new Map<string, VerifiedInvestor>();
      for (const r of rows.sort((a, b) => Number(a.blockNumber - b.blockNumber))) byUid.set(r.uid.toLowerCase(), r);
      setData(Array.from(byUid.values()).sort((a, b) => Number(b.blockNumber - a.blockNumber)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read attestations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

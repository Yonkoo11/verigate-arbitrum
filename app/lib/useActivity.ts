"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUnits, parseAbiItem, type Address, type Hex } from "viem";
import { publicClient } from "@/lib/publicClient";
import { addresses, COVENANT_DEPLOY_BLOCK } from "@/lib/contracts";

const TRANSFER_EVENT = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
const FAILURE_EVENT = parseAbiItem("event ComplianceFailure(address indexed from, address indexed to, uint256 amount, string reason)");
const ATTESTED_EVENT = parseAbiItem("event Attested(bytes32 indexed uid, address indexed recipient, address indexed attester, bytes32 schema)");

// Cap the scan span for RPC safety; on a fast chain, fall back to a recent window
// if the full-history range ever gets rejected.
const MAX_SPAN = 800000n;

export type ActivityKind = "settled" | "blocked" | "verified";

export interface ActivityEvent {
  kind: ActivityKind;
  from?: Address;
  to?: Address;
  amount?: bigint;
  reason?: string;
  uid?: Hex;
  blockNumber: bigint;
  logIndex: number;
  txHash: Hex;
}

export function useActivity(decimals = 18) {
  const [data, setData] = useState<ActivityEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeUsed, setRangeUsed] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const latest = await publicClient.getBlockNumber();

      // Start at the deployment block so the full on-chain history is covered, but cap the
      // span so a fast-growing chain never exceeds the RPC's getLogs range limit.
      const floor = latest > COVENANT_DEPLOY_BLOCK + MAX_SPAN ? latest - MAX_SPAN : COVENANT_DEPLOY_BLOCK;

      let result: { transfers: any[]; failures: any[]; attested: any[] } | null = null;
      let lastErr: unknown;
      for (const from of [floor, latest > 100000n ? latest - 100000n : 0n]) {
        try {
          const [transfers, failures, attested] = await Promise.all([
            publicClient.getLogs({ address: addresses.rwaToken, event: TRANSFER_EVENT, fromBlock: from, toBlock: latest }),
            publicClient.getLogs({ address: addresses.rwaToken, event: FAILURE_EVENT, fromBlock: from, toBlock: latest }).catch(() => []),
            publicClient.getLogs({ address: addresses.registry, event: ATTESTED_EVENT, fromBlock: from, toBlock: latest }).catch(() => []),
          ]);
          result = { transfers, failures, attested };
          setRangeUsed(latest - from);
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!result) throw lastErr ?? new Error("getLogs failed");

      const events: ActivityEvent[] = [];

      for (const l of result.transfers) {
        const a = l.args as { from: Address; to: Address; value: bigint };
        events.push({ kind: "settled", from: a.from, to: a.to, amount: a.value, blockNumber: l.blockNumber ?? 0n, logIndex: l.logIndex ?? 0, txHash: l.transactionHash as Hex });
      }
      for (const l of result.failures) {
        const a = l.args as { from: Address; to: Address; amount: bigint; reason: string };
        events.push({ kind: "blocked", from: a.from, to: a.to, amount: a.amount, reason: a.reason, blockNumber: l.blockNumber ?? 0n, logIndex: l.logIndex ?? 0, txHash: l.transactionHash as Hex });
      }
      for (const l of result.attested) {
        const a = l.args as { uid: Hex; recipient: Address; attester: Address };
        events.push({ kind: "verified", from: a.attester, to: a.recipient, uid: a.uid, blockNumber: l.blockNumber ?? 0n, logIndex: l.logIndex ?? 0, txHash: l.transactionHash as Hex });
      }

      events.sort((x, y) => {
        if (y.blockNumber !== x.blockNumber) return Number(y.blockNumber - x.blockNumber);
        return y.logIndex - x.logIndex;
      });

      setData(events);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read activity");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmtAmount = (v?: bigint) => v === undefined ? undefined : Number(formatUnits(v, decimals)).toLocaleString("en-US", { maximumFractionDigits: 2 });

  return { data, loading, error, rangeUsed, reload: load, fmtAmount };
}

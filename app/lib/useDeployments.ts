"use client";

import { useEffect, useState } from "react";
import { formatUnits, type Address } from "viem";
import { publicClient } from "@/lib/publicClient";
import { addresses, rwaTokenFactoryAbi, rwaTokenAbi } from "@/lib/contracts";

export interface Deployment {
  token: Address;
  complianceEngine: Address;
  modules: Address[];
  issuer: Address;
  deployedAt: bigint;
  name?: string;
  symbol?: string;
  supply?: string;
}

export function useDeployments() {
  const [data, setData] = useState<Deployment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const count = (await publicClient.readContract({
          address: addresses.factory, abi: rwaTokenFactoryAbi, functionName: "deploymentCount",
        })) as bigint;

        const n = Number(count);
        const rows: Deployment[] = await Promise.all(
          Array.from({ length: n }, (_, i) => i).map(async (i) => {
            const d = (await publicClient.readContract({
              address: addresses.factory, abi: rwaTokenFactoryAbi, functionName: "getDeployment", args: [BigInt(i)],
            })) as { token: Address; complianceEngine: Address; modules: Address[]; issuer: Address; deployedAt: bigint };

            let name: string | undefined, symbol: string | undefined, supply: string | undefined;
            try {
              const [nm, sym, dec, ts] = await Promise.all([
                publicClient.readContract({ address: d.token, abi: rwaTokenAbi, functionName: "name" }) as Promise<string>,
                publicClient.readContract({ address: d.token, abi: rwaTokenAbi, functionName: "symbol" }) as Promise<string>,
                publicClient.readContract({ address: d.token, abi: rwaTokenAbi, functionName: "decimals" }) as Promise<number>,
                publicClient.readContract({ address: d.token, abi: rwaTokenAbi, functionName: "totalSupply" }) as Promise<bigint>,
              ]);
              name = nm; symbol = sym;
              supply = Number(formatUnits(ts, dec)).toLocaleString("en-US", { maximumFractionDigits: 2 });
            } catch { /* token reads may fail; leave undefined */ }

            return { ...d, name, symbol, supply };
          }),
        );

        if (!cancelled) setData(rows);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to read deployments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

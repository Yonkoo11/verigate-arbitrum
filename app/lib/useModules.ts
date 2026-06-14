"use client";

import { useEffect, useState } from "react";
import { type Address } from "viem";
import { publicClient } from "@/lib/publicClient";
import { complianceEngineAbi, maxHoldersAbi } from "@/lib/contracts";

export interface ModuleEntry {
  address: Address;
  name: string;
  description: string;
}

export interface ModulesData {
  modules: ModuleEntry[];
  maxHolders?: { address: Address; holderCount: bigint; maxHolderCount: bigint };
}

function isMaxHolders(name: string) {
  return name.toLowerCase().replace(/[^a-z]/g, "").includes("maxholder");
}

/**
 * Reads a compliance engine's modules and each module's moduleInfo().
 * If a MaxHolders module is present, also reads holderCount + maxHolderCount.
 */
export function useModules(engine?: Address) {
  const [data, setData] = useState<ModulesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!engine) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const addrs = (await publicClient.readContract({
          address: engine, abi: complianceEngineAbi, functionName: "getModules",
        })) as Address[];

        const modules: ModuleEntry[] = await Promise.all(
          addrs.map(async (address) => {
            try {
              const info = (await publicClient.readContract({
                address, abi: maxHoldersAbi, functionName: "moduleInfo",
              })) as [string, string];
              return { address, name: info[0], description: info[1] };
            } catch {
              return { address, name: "Unknown module", description: "" };
            }
          }),
        );

        let maxHolders: ModulesData["maxHolders"];
        const mh = modules.find((m) => isMaxHolders(m.name));
        if (mh) {
          try {
            const [holderCount, maxHolderCount] = await Promise.all([
              publicClient.readContract({ address: mh.address, abi: maxHoldersAbi, functionName: "holderCount" }) as Promise<bigint>,
              publicClient.readContract({ address: mh.address, abi: maxHoldersAbi, functionName: "maxHolderCount" }) as Promise<bigint>,
            ]);
            maxHolders = { address: mh.address, holderCount, maxHolderCount };
          } catch { /* leave undefined */ }
        }

        if (!cancelled) setData({ modules, maxHolders });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to read modules");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [engine]);

  return { data, loading, error };
}

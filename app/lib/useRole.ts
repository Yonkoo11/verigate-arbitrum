"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { addresses, rwaTokenAbi } from "@/lib/contracts";

/**
 * Role detection: the connected wallet is the issuer iff it owns the RWA token.
 * `mounted` guards against hydration mismatch (wagmi reconnects on the client).
 */
export function useRole() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: owner } = useReadContract({
    address: addresses.rwaToken, abi: rwaTokenAbi, functionName: "owner",
    query: { enabled: !!addresses.rwaToken },
  });

  const isOwner =
    mounted && !!address && !!owner &&
    (address as string).toLowerCase() === (owner as string).toLowerCase();

  return { mounted, address, isConnected: mounted && isConnected, isOwner, owner: owner as string | undefined };
}

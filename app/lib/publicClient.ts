import { createPublicClient, http } from "viem";
import { robinhoodChain } from "@/app/providers";
import { ROBINHOOD_RPC } from "@/lib/contracts";

// Read-only client for log queries / multicall that don't need a connected wallet.
export const publicClient = createPublicClient({
  chain: robinhoodChain,
  transport: http(ROBINHOOD_RPC),
});

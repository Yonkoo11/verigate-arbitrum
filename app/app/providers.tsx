"use client";

import { type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { defineChain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import {
  ROBINHOOD_CHAIN_ID,
  ROBINHOOD_RPC,
  ROBINHOOD_EXPLORER,
} from "@/lib/contracts";

const queryClient = new QueryClient();

// Robinhood Chain testnet — PRIMARY chain for the Verigate demo
export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [ROBINHOOD_RPC] },
  },
  blockExplorers: {
    default: { name: "Robinhood Explorer", url: ROBINHOOD_EXPLORER },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [robinhoodChain, arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(ROBINHOOD_RPC),
    [arbitrumSepolia.id]: http("https://sepolia-rollup.arbitrum.io/rpc"),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

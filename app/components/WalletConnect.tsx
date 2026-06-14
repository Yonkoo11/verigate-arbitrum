"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { robinhoodChain } from "@/app/providers";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Wallet/connection state isn't known during SSR, so the first client render must
  // match the server's. Gate connection-dependent UI behind `mounted` to avoid a
  // React hydration mismatch (wagmi reconnects from storage on the client).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const wrongChain = isConnected && chainId !== robinhoodChain.id;

  // Auto-switch to Robinhood Chain when connected on wrong chain
  useEffect(() => {
    if (wrongChain && switchChain) {
      switchChain({ chainId: robinhoodChain.id });
    }
  }, [wrongChain, switchChain]);

  // Stable placeholder for SSR + first client render (matches server output).
  if (!mounted) {
    return (
      <button disabled className="btn btn-primary">
        Connect Wallet
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
        {wrongChain && (
          <button
            onClick={() => switchChain({ chainId: robinhoodChain.id })}
            className="btn btn-primary btn-sm"
            style={{ color: "var(--black)", background: "#f59e0b" }}
          >
            Switch to Robinhood Chain
          </button>
        )}
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-2)",
          fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-2)",
          background: "var(--surface-2)", border: "1px solid var(--border)",
          padding: "8px 14px", minHeight: 40,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: wrongChain ? "#f59e0b" : "var(--green)",
          }} />
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={() => disconnect()}
          className="btn btn-ghost btn-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (connectors.length === 0) {
    return (
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-3)", padding: "8px 14px", border: "1px solid var(--border)" }}>
        No wallet detected
      </span>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0], chainId: robinhoodChain.id })}
      disabled={isPending}
      className="btn btn-primary"
    >
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}

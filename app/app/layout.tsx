import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { WalletConnect } from "@/components/WalletConnect";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Verigate",
  description: "Verify before you transfer. Compliance middleware for tokenized RWA on BNB Chain.",
  icons: { icon: "/favicon.svg" },
  other: { "theme-color": "#0b0d11" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToastProvider>
            <header
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                height: 56,
                background: "rgba(11, 13, 17, 0.88)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 var(--sp-6)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                {/* Logo mark — serif VG */}
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--amber)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  VG
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 17,
                    fontWeight: 500,
                    color: "var(--text-1)",
                    letterSpacing: "0.01em",
                  }}
                >
                  Verigate
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--amber)",
                    background: "var(--amber-dim)",
                    border: "1px solid var(--amber-border)",
                    padding: "2px 8px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Testnet
                </span>
              </div>
              <WalletConnect />
            </header>
            <main style={{ paddingTop: 56 }}>{children}</main>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Covenant — Compliance layer for tokenized stocks",
  description: "Verify before you transfer. The compliance layer for tokenized stocks, demoing Tokenized TSLA (tTSLA) on Robinhood Chain.",
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
            <main>{children}</main>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

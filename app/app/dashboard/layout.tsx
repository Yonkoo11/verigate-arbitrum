"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChainId, useSwitchChain } from "wagmi";
import { robinhoodChain } from "@/app/providers";
import { WalletConnect } from "@/components/WalletConnect";
import { useRole } from "@/lib/useRole";

type NavItem = { href: string; label: string };

const INVESTOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/credential", label: "My Credential" },
  { href: "/dashboard/transfer", label: "Transfer" },
];

const ISSUER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tokens", label: "Tokens" },
  { href: "/dashboard/registry", label: "Registry" },
  { href: "/dashboard/rules", label: "Compliance Rules" },
  { href: "/dashboard/activity", label: "Activity" },
  { href: "/dashboard/deploy", label: "Deploy" },
];

function Wordmark() {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <span className="cv-mark">CV</span>
      <span className="cv-name">Covenant</span>
    </Link>
  );
}

function WrongNetworkBanner() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  if (chainId === robinhoodChain.id) return null;
  return (
    <div style={{
      background: "var(--amber-dim)", border: "1px solid var(--amber-border)",
      padding: "var(--sp-3) var(--sp-5)", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "var(--sp-4)", flexWrap: "wrap",
      marginBottom: "var(--sp-6)",
    }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--amber)" }}>
        Wrong network — switch to Robinhood Chain to use Covenant.
      </span>
      <button onClick={() => switchChain({ chainId: robinhoodChain.id })} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
        Switch network
      </button>
    </div>
  );
}

function NavLinks({ items, pathname, className }: { items: NavItem[]; pathname: string; className?: string }) {
  return (
    <>
      {items.map((it) => {
        const active = it.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav-link${active ? " active" : ""} ${className ?? ""}`}>
            {it.label}
          </Link>
        );
      })}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOwner } = useRole();
  const nav = isOwner ? ISSUER_NAV : INVESTOR_NAV;

  return (
    <div className="shell">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-head">
          <Wordmark />
          <div style={{ marginTop: "var(--sp-3)" }}>
            <span className="cv-pill">Testnet</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-group-label">{isOwner ? "Issuer" : "Investor"}</div>
          <NavLinks items={nav} pathname={pathname} />
        </nav>
        <div className="sidebar-foot">
          <WalletConnect />
        </div>
      </aside>

      {/* Mobile top bar + scrollable nav */}
      <div className="mobile-bar">
        <Wordmark />
        <WalletConnect />
      </div>
      <div className="mobile-nav">
        <NavLinks items={nav} pathname={pathname} />
      </div>

      <div className="content">
        <WrongNetworkBanner />
        {children}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MetaMaskButtonGuard } from "src/components/MetaMaskButtonGuard";
import { StatusBubbleBridge } from "src/components/StatusBubbleBridge";
import { UserErrorLogger } from "src/components/UserErrorLogger";
import { WalletDock } from "src/components/WalletDock";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";

  if (isSignInPage) {
    return (
      <main className="sign-in-main">
        <UserErrorLogger />
        <StatusBubbleBridge />
        {children}
      </main>
    );
  }

  return (
    <div className="page-shell">
      <UserErrorLogger />
      <MetaMaskButtonGuard />
      <StatusBubbleBridge />
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark">T24</div>
          <div>
            <p className="brand-title">Tokamak 24-7 Ethereum Playground</p>
            <p className="brand-subtitle">
              A social network for AI, specialized in quality testing of DApps.
            </p>
          </div>
        </div>
        <div className="site-header-right">
          <nav className="site-nav">
            <Link href="/">Home</Link>
            <Link href="/manage">Management</Link>
            <Link href="/sns">Communities</Link>
            <Link href="/requests">Requests</Link>
            <Link href="/reports">Reports</Link>
          </nav>
          <WalletDock />
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div>PoC only. No real funds or mainnet writes.</div>
        <div>Tokamak 24-7 Ethereum Playground</div>
      </footer>
    </div>
  );
}

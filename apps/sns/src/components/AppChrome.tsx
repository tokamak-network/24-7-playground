"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MetaMaskButtonGuard } from "src/components/MetaMaskButtonGuard";
import { WalletDock } from "src/components/WalletDock";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";

  if (isSignInPage) {
    return <main className="sign-in-main">{children}</main>;
  }

  return (
    <div className="page-shell">
      <MetaMaskButtonGuard />
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark">T24</div>
          <div>
            <p className="brand-title">Tokamak 24-7 Ethereum Playground</p>
            <p className="brand-subtitle">
              Bot-native QA for Ethereum services
            </p>
          </div>
        </div>
        <div className="site-header-right">
          <nav className="site-nav">
            <Link href="/">Home</Link>
            <Link href="/manage">Management</Link>
            <Link href="/sns">Agent SNS</Link>
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

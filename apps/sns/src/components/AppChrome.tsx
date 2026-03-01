"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "src/components/BrandLogo";
import { SpiralVaultBackground } from "src/components/SpiralVaultBackground";
import { StatusBubbleBridge } from "src/components/StatusBubbleBridge";
import { UserErrorLogger } from "src/components/UserErrorLogger";
import { WalletDock } from "src/components/WalletDock";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";
  const navItems = [
    { href: "/docs", label: "About" },
    { href: "/sns", label: "Communities" },
    { href: "/requests", label: "Requests" },
    { href: "/reports", label: "Reports" },
  ];

  const isNavActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const alphaBadge = (
    <div className="alpha-test-badge" role="note" aria-label="Alpha test notice">
      Alpha Test Version
    </div>
  );

  if (isSignInPage) {
    return (
      <>
        <SpiralVaultBackground />
        <div className="app-ui-layer">
          <main className="sign-in-main">
            <UserErrorLogger />
            <StatusBubbleBridge />
            {children}
          </main>
        </div>
        {alphaBadge}
      </>
    );
  }

  return (
    <>
      <SpiralVaultBackground />
      <div className="app-ui-layer">
        <div className="page-shell page-shell-split">
          <UserErrorLogger />
          <StatusBubbleBridge />
          <div className="screen-layout">
            <section className="screen-main">
              <main className="screen-content">{children}</main>
              <footer className="site-footer">
                <div>PoC only. No real funds or mainnet writes.</div>
                <div>
                  Agentic Ethereum: 24-7 Playground · A social network for AI, specialized in
                  quality testing of DApps
                </div>
              </footer>
            </section>

            <aside className="site-rail" aria-label="Primary menu">
              <div className="site-rail-head">
                <Link href="/" className="site-rail-brand">
                  <BrandLogo className="site-rail-mark" />
                  <div className="brand">
                    <div>
                      <p className="site-rail-title">Agentic Ethereum: 24-7 Playground</p>
                      <p className="site-rail-subtitle">
                        A social network for AI, specialized in quality testing of DApps
                      </p>
                    </div>
                  </div>
                </Link>
                <div className="site-rail-wallet">
                  <WalletDock />
                </div>
              </div>

              <nav className="site-menu-float site-menu-rail" aria-label="Primary">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`site-nav-link${isNavActive(item.href) ? " is-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        </div>
      </div>
      {alphaBadge}
    </>
  );
}

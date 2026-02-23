"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBubbleBridge } from "src/components/StatusBubbleBridge";
import { UserErrorLogger } from "src/components/UserErrorLogger";
import { WalletDock } from "src/components/WalletDock";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";
  const isDocsPage = pathname === "/docs" || pathname.startsWith("/docs/");
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/manage", label: "Management" },
    { href: "/sns", label: "Communities" },
    { href: "/requests", label: "Requests" },
    { href: "/reports", label: "Reports" },
    { href: "/docs", label: "Docs" },
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
        <main className="sign-in-main">
          <UserErrorLogger />
          <StatusBubbleBridge />
          {children}
        </main>
        {alphaBadge}
      </>
    );
  }

  if (isDocsPage) {
    return (
      <main className="docs-route-main">
        <UserErrorLogger />
        <StatusBubbleBridge />
        {children}
      </main>
    );
  }

  return (
    <>
      <div className="page-shell">
        <UserErrorLogger />
        <StatusBubbleBridge />
        <header className="site-header">
          <div className="site-header-top">
            <div className="brand">
              <div className="brand-mark">T24</div>
              <div>
                <p className="brand-title">Tokamak 24-7 Ethereum Playground</p>
                <p className="brand-subtitle">
                  A social network for AI, specialized in quality testing of DApps
                </p>
              </div>
            </div>
            <div className="site-header-wallet">
              <WalletDock />
            </div>
          </div>
        </header>
        <div className="site-menu-float-wrap">
          <nav className="site-menu-float">
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
        </div>
        <main>{children}</main>
        <footer className="site-footer">
          <div>PoC only. No real funds or mainnet writes.</div>
          <div>Tokamak 24-7 Ethereum Playground</div>
        </footer>
      </div>
      {alphaBadge}
    </>
  );
}

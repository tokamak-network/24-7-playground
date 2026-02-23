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
  const workflowNavItems = [
    { href: "/sns", label: "Communities" },
    { href: "/requests", label: "Requests" },
    { href: "/reports", label: "Reports" },
  ];
  const utilityNavItems = [
    { href: "/", label: "Home" },
    { href: "/manage", label: "Management" },
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
          <div className="brand-rail" aria-label="Tokamak brand rail">
            <div className="brand-mark">T24</div>
            <p className="brand-rail-text">TOKAMAK</p>
          </div>
          <div className="site-header-main">
            <div className="brand-copy">
              <p className="brand-title">Tokamak 24-7 Ethereum Playground</p>
              <p className="brand-subtitle">
                A social network for AI, specialized in quality testing of DApps.
              </p>
            </div>
            <div className="site-header-right">
              <nav className="site-nav site-nav-workflow">
                {workflowNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`site-nav-link site-nav-link-workflow${
                      isNavActive(item.href) ? " is-active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="site-header-utility-row">
                <nav className="site-nav site-nav-utility">
                  {utilityNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`site-nav-link site-nav-link-utility${
                        isNavActive(item.href) ? " is-active" : ""
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <WalletDock />
              </div>
            </div>
          </div>
        </header>
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "src/components/BrandLogo";
import { QuickStartTutorial } from "src/components/QuickStartTutorial";
import { SpiralVaultBackground } from "src/components/SpiralVaultBackground";
import { StatusBubbleBridge } from "src/components/StatusBubbleBridge";
import { UserErrorLogger } from "src/components/UserErrorLogger";
import { WalletDock } from "src/components/WalletDock";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/sign-in";
  const navItems = [
    { href: "/about", label: "About" },
    { href: "/#quick-start-title", label: "Quick Start" },
    { href: "/communities", label: "Communities" },
    { href: "/requests", label: "Requests" },
    { href: "/reports", label: "Reports" },
  ];

  const isNavActive = (href: string) => {
    const normalizedHref = String(href || "").split("#")[0] || "/";
    if (normalizedHref === "/") return pathname === "/";
    return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
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
            <QuickStartTutorial />
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
          <QuickStartTutorial />
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

              <div className="site-rail-foot" aria-label="Social links">
                <a
                  className="site-social-link"
                  href="https://t.me/AgenticEthereum"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Telegram"
                >
                  <img
                    className="site-social-icon"
                    src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg"
                    alt=""
                  />
                </a>
                <a
                  className="site-social-link"
                  href="https://github.com/tokamak-network/24-7-playground"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="GitHub"
                >
                  <img className="site-social-icon" src="/icons/github-mark.svg" alt="" />
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
      {alphaBadge}
    </>
  );
}

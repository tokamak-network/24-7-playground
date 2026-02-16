import type { Metadata } from "next";
import Link from "next/link";
import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { MetaMaskButtonGuard } from "src/components/MetaMaskButtonGuard";
import { WalletDock } from "src/components/WalletDock";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Sora({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Tokamak 24-7 Ethereum Playground",
  description: "Agent-native QA playground for Ethereum smart contracts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
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
      </body>
    </html>
  );
}

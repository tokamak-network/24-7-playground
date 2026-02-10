import type { Metadata } from "next";
import Link from "next/link";
import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
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
  title: "Agentic Beta Testing",
  description: "Bots that explore usage and attack methods for smart contracts.",
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
          <WalletDock />
          <header className="site-header">
            <div className="brand">
              <div className="brand-mark">AB</div>
              <div>
                <p className="brand-title">Agentic Beta Testing</p>
                <p className="brand-subtitle">
                  Bot-native QA for Ethereum services
                </p>
              </div>
            </div>
            <nav className="site-nav">
              <Link href="/">Home</Link>
              <Link href="/sns">Agent SNS</Link>
              <Link href="/reports">Reports</Link>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div>PoC only. No real funds or mainnet writes.</div>
            <div>Agentic Beta Testing Project</div>
          </footer>
        </div>
      </body>
    </html>
  );
}

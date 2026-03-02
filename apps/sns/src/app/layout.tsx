import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { AppChrome } from "src/components/AppChrome";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Sora({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Agentic Ethereum: 24-7 Playground",
  description: "Agent-native QA playground for Ethereum smart contracts.",
  metadataBase: new URL("https://agentic-ethereum.com"),
  icons: {
    icon: [
      { url: "/favicon.ico?v=20260301c", sizes: "any" },
      { url: "/icon.svg?v=20260301c", type: "image/svg+xml" },
      { url: "/icon-192.png?v=20260301c", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png?v=20260301c", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico?v=20260301c"],
    apple: [{ url: "/apple-touch-icon.png?v=20260301c", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <AppChrome>{children}</AppChrome>
        <Analytics />
      </body>
    </html>
  );
}

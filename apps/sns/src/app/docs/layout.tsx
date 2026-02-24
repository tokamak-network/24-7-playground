import Link from "next/link";
import type { ReactNode } from "react";
import { LAST_UPDATED_ISO, LAST_UPDATED_LABEL } from "./content";

type DocsLayoutProps = {
  children: ReactNode;
};

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="grid docs-page">
      <section className="hero">
        <h1>Docs</h1>
        <p>
          Last updated:{" "}
          <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
        </p>
      </section>

      <section className="card docs-layout-card">
        <aside className="docs-toc" aria-label="Table of contents">
          <nav className="docs-toc-nav">
            <Link href="/docs/what-is-agentic-ethereum#what-is-agentic-ethereum">
              What is Agentic Ethereum: 24-7 Playground?
            </Link>
            <Link href="/docs/how-to-use#how-to-use">How to use</Link>
            <Link className="docs-toc-sub" href="/docs/how-to-use#for-dapp-developer">
              For DApp developer
            </Link>
            <Link className="docs-toc-sub" href="/docs/how-to-use#for-agent-provider">
              For Agent provider
            </Link>
            <Link href="/docs/how-it-works#how-it-works">How it works</Link>
            <Link href="/docs/security-notes#security-notes">Security Notes</Link>
            <Link href="/docs/troubleshooting#troubleshooting">Troubleshooting</Link>
          </nav>
        </aside>

        <article className="docs-content">{children}</article>
      </section>
    </div>
  );
}

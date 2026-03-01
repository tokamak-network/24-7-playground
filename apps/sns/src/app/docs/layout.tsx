import type { ReactNode } from "react";

type DocsLayoutProps = {
  children: ReactNode;
};

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="grid docs-page">
      <section className="card">
        <article className="docs-content">{children}</article>
      </section>
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { LAST_UPDATED_ISO, LAST_UPDATED_LABEL } from "./content";
import {
  fallbackSectionTitle,
  loadPublishedMarkdown,
  parsePublishedHeadings,
} from "./publishedDocs";
import { slugifyHeading } from "../../components/markdown/headingSlug";

type DocsLayoutProps = {
  children: ReactNode;
};

const DOC_SECTION_SLUGS = [
  "what-is-agentic-ethereum",
  "how-to-use",
  "how-it-works",
  "security-notes",
  "troubleshooting",
] as const;

async function loadDocsTocItems() {
  const items = await Promise.all(
    DOC_SECTION_SLUGS.map(async (sectionSlug) => {
      try {
        const markdown = await loadPublishedMarkdown(sectionSlug);
        const parsed = parsePublishedHeadings(markdown);
        const titleFromMarkdown = parsed.h1 ?? parsed.h2[0]?.text ?? null;
        const title = titleFromMarkdown ?? fallbackSectionTitle(sectionSlug);
        const titleId = slugifyHeading(title);
        const h2Items =
          parsed.h1 == null && parsed.h2.length > 0 ? parsed.h2.slice(1) : parsed.h2;
        return { sectionSlug, title, titleId, h2Items };
      } catch {
        const title = fallbackSectionTitle(sectionSlug);
        return { sectionSlug, title, titleId: slugifyHeading(title), h2Items: [] };
      }
    })
  );

  return items;
}

export default async function DocsLayout({ children }: DocsLayoutProps) {
  const tocItems = await loadDocsTocItems();

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
            {tocItems.map((item) => (
              <div key={item.sectionSlug}>
                <Link href={`/docs/${item.sectionSlug}#${item.titleId}`}>{item.title}</Link>
                {item.h2Items.map((heading) => (
                  <Link
                    key={`${item.sectionSlug}-${heading.id}`}
                    className="docs-toc-sub"
                    href={`/docs/${item.sectionSlug}#${heading.id}`}
                  >
                    {heading.text}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <article className="docs-content">{children}</article>
      </section>
    </div>
  );
}

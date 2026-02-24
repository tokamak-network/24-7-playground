import { MarkdownRenderer } from "../../components/markdown/MarkdownRenderer";
import { loadPublishedMarkdown } from "./publishedDocs";

type PublishedMarkdownSectionProps = {
  sectionSlug: string;
  sectionId: string;
};

function toPublishedAssetHref(sectionSlug: string, rawPath: string) {
  const href = rawPath.trim();
  if (!href) return "#";
  if (/^https?:\/\//i.test(href) || href.startsWith("/")) {
    return href;
  }

  const cleaned = href.split("#")[0].split("?")[0].trim();
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0 || parts.some((part) => part === "." || part === "..")) {
    return "#";
  }

  const encodedSection = encodeURIComponent(sectionSlug);
  const encodedPath = parts.map((part) => encodeURIComponent(part)).join("/");
  return `/api/docs-published/${encodedSection}/${encodedPath}`;
}

export async function PublishedMarkdownSection({
  sectionSlug,
  sectionId,
}: PublishedMarkdownSectionProps) {
  try {
    const markdown = await loadPublishedMarkdown(sectionSlug);
    return (
      <section id={sectionId} className="docs-section">
        <MarkdownRenderer
          markdown={markdown}
          className="docs-markdown"
          resolveHref={(rawPath: string) => toPublishedAssetHref(sectionSlug, rawPath)}
        />
      </section>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown docs loading error";
    return (
      <section id={sectionId} className="docs-section">
        <h2>Unable to load docs</h2>
        <p className="md-callout">{message}</p>
      </section>
    );
  }
}

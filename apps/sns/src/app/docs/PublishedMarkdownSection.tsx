import { readFile } from "node:fs/promises";
import path from "node:path";
import { MarkdownRenderer } from "../../components/markdown/MarkdownRenderer";

type PublishedMarkdownSectionProps = {
  sectionSlug: string;
  sectionId: string;
};

const PUBLISHED_DOCS_PATH_CANDIDATES = [
  path.resolve(process.cwd(), "docs/published"),
  path.resolve(process.cwd(), "../../docs/published"),
];

async function loadPublishedMarkdown(sectionSlug: string): Promise<string> {
  const attempts: string[] = [];
  for (const baseDir of PUBLISHED_DOCS_PATH_CANDIDATES) {
    const filePath = path.join(baseDir, sectionSlug, "page.md");
    attempts.push(filePath);
    try {
      return await readFile(filePath, "utf8");
    } catch {
      continue;
    }
  }
  throw new Error(`Docs markdown file not found: ${attempts.join(", ")}`);
}

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

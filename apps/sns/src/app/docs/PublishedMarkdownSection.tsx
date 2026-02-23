import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";

type PublishedMarkdownSectionProps = {
  sectionSlug: string;
  sectionId: string;
};

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "image"; alt: string; src: string }
  | { type: "code"; code: string };

const PUBLISHED_DOCS_PATH_CANDIDATES = [
  path.resolve(process.cwd(), "docs/published"),
  path.resolve(process.cwd(), "../../docs/published"),
];

const UNORDERED_LIST_ITEM_RE = /^\s*-\s+(.+)$/;
const ORDERED_LIST_ITEM_RE = /^\s*\d+\.\s+(.+)$/;
const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;

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

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, "\n").trim();
}

function slugifyHeading(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`'"!@#$%^&*()_+=[\]{};:\\|,.<>/?~]/g, "")
    .replace(/\s+/g, "-");
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

function renderInline(
  text: string,
  sectionSlug: string,
  keyPrefix: string
): ReactNode[] {
  const result: ReactNode[] = [];
  const linkOrCodeRe = /(`[^`]+`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let cursor = 0;
  let tokenIndex = 0;
  let match: RegExpExecArray | null = linkOrCodeRe.exec(text);
  while (match) {
    if (match.index > cursor) {
      result.push(text.slice(cursor, match.index));
    }

    if (match[1]) {
      const codeText = match[1].slice(1, -1);
      result.push(
        <code className="docs-inline-code" key={`${keyPrefix}-code-${tokenIndex}`}>
          {codeText}
        </code>
      );
    } else {
      const linkLabel = match[3] || "";
      const linkHref = toPublishedAssetHref(sectionSlug, match[4] || "#");
      const external = /^https?:\/\//.test(linkHref);
      result.push(
        <a
          href={linkHref}
          key={`${keyPrefix}-link-${tokenIndex}`}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer noopener" : undefined}
        >
          {linkLabel}
        </a>
      );
    }

    cursor = match.index + match[0].length;
    tokenIndex += 1;
    match = linkOrCodeRe.exec(text);
  }

  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }
  return result;
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = normalizeMarkdown(markdown).split("\n");
  let index = 0;

  while (index < lines.length) {
    const currentLine = lines[index];
    const trimmedLine = currentLine.trim();

    if (!trimmedLine) {
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length && lines[index].trim().startsWith("```")) {
        index += 1;
      }
      blocks.push({ type: "code", code: codeLines.join("\n") });
      continue;
    }

    const headingMatch = trimmedLine.match(HEADING_RE);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    const imageMatch = trimmedLine.match(IMAGE_RE);
    if (imageMatch) {
      blocks.push({
        type: "image",
        alt: imageMatch[1].trim(),
        src: imageMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (trimmedLine.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join(" ").trim(),
      });
      continue;
    }

    const unorderedMatch = trimmedLine.match(UNORDERED_LIST_ITEM_RE);
    if (unorderedMatch) {
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        const itemMatch = candidate.match(UNORDERED_LIST_ITEM_RE);
        if (!itemMatch) break;
        items.push(itemMatch[1].trim());
        index += 1;
      }
      blocks.push({ type: "unordered-list", items });
      continue;
    }

    const orderedMatch = trimmedLine.match(ORDERED_LIST_ITEM_RE);
    if (orderedMatch) {
      const items: string[] = [];
      while (index < lines.length) {
        const candidate = lines[index].trim();
        const itemMatch = candidate.match(ORDERED_LIST_ITEM_RE);
        if (!itemMatch) break;
        items.push(itemMatch[1].trim());
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const candidate = lines[index];
      const candidateTrimmed = candidate.trim();
      if (!candidateTrimmed) break;
      if (
        candidateTrimmed.startsWith("```") ||
        HEADING_RE.test(candidateTrimmed) ||
        IMAGE_RE.test(candidateTrimmed) ||
        candidateTrimmed.startsWith(">") ||
        UNORDERED_LIST_ITEM_RE.test(candidateTrimmed) ||
        ORDERED_LIST_ITEM_RE.test(candidateTrimmed)
      ) {
        break;
      }
      paragraphLines.push(candidateTrimmed);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function renderBlock(block: MarkdownBlock, sectionSlug: string, blockIndex: number) {
  if (block.type === "heading") {
    const headingId = slugifyHeading(block.text);
    if (block.level <= 2) {
      return (
        <h2 id={headingId} key={`h2-${blockIndex}`}>
          {renderInline(block.text, sectionSlug, `h2-${blockIndex}`)}
        </h2>
      );
    }
    return (
      <h3 id={headingId} key={`h3-${blockIndex}`}>
        {renderInline(block.text, sectionSlug, `h3-${blockIndex}`)}
      </h3>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="docs-markdown-paragraph" key={`p-${blockIndex}`}>
        {renderInline(block.text, sectionSlug, `p-${blockIndex}`)}
      </p>
    );
  }

  if (block.type === "blockquote") {
    return (
      <p className="docs-callout" key={`quote-${blockIndex}`}>
        {renderInline(block.text, sectionSlug, `quote-${blockIndex}`)}
      </p>
    );
  }

  if (block.type === "unordered-list" || block.type === "ordered-list") {
    const ListTag = block.type === "ordered-list" ? "ol" : "ul";
    return (
      <ListTag className="docs-list" key={`list-${blockIndex}`}>
        {block.items.map((item, itemIndex) => (
          <li key={`item-${blockIndex}-${itemIndex}`}>
            {renderInline(item, sectionSlug, `item-${blockIndex}-${itemIndex}`)}
          </li>
        ))}
      </ListTag>
    );
  }

  if (block.type === "image") {
    const imageSrc = toPublishedAssetHref(sectionSlug, block.src);
    return (
      <figure className="docs-figure" key={`img-${blockIndex}`}>
        <img src={imageSrc} alt={block.alt} />
      </figure>
    );
  }

  return (
    <pre className="docs-ascii" key={`code-${blockIndex}`}>
      <code>{block.code}</code>
    </pre>
  );
}

export async function PublishedMarkdownSection({
  sectionSlug,
  sectionId,
}: PublishedMarkdownSectionProps) {
  try {
    const markdown = await loadPublishedMarkdown(sectionSlug);
    const blocks = parseMarkdown(markdown);
    return (
      <section id={sectionId} className="docs-section docs-markdown">
        {blocks.map((block, index) => renderBlock(block, sectionSlug, index))}
      </section>
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown docs loading error";
    return (
      <section id={sectionId} className="docs-section">
        <h2>Unable to load docs</h2>
        <p className="docs-callout">{message}</p>
      </section>
    );
  }
}

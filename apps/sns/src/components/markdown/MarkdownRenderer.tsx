import type { ReactNode } from "react";
import { slugifyHeading } from "./headingSlug";

type MarkdownRendererProps = {
  markdown: string;
  className?: string;
  resolveHref?: (rawHref: string) => string;
};

type MarkdownListItem = {
  text: string;
  children: MarkdownBlock[];
};

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; blocks: MarkdownBlock[] }
  | { type: "list"; ordered: boolean; start: number; items: MarkdownListItem[] }
  | { type: "image"; alt: string; src: string }
  | { type: "code"; code: string; language: string };

type ParsedList = {
  block: Extract<MarkdownBlock, { type: "list" }>;
  nextIndex: number;
  indent: number;
};

const HEADING_RE = /^(#{1,6})\s+(.+)$/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const ORDERED_LIST_ITEM_RE = /^(\s*)(\d+)\.\s+(.+)$/;
const UNORDERED_LIST_ITEM_RE = /^(\s*)[-*+]\s+(.+)$/;

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, "\n").trim();
}

function joinClassName(...tokens: Array<string | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function parseImageAltMeta(rawAlt: string) {
  const match = rawAlt.match(/\|w=(\d{2,4})$/i);
  if (!match) {
    return { alt: rawAlt.trim(), maxWidthPx: null as number | null };
  }

  const maxWidthPx = Number(match[1]);
  const alt = rawAlt.replace(/\|w=\d{2,4}$/i, "").trim();
  if (!Number.isFinite(maxWidthPx) || maxWidthPx < 64 || maxWidthPx > 1600) {
    return { alt, maxWidthPx: null as number | null };
  }

  return { alt, maxWidthPx };
}

function indentSize(line: string) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function parseListMarker(line: string) {
  const orderedMatch = line.match(ORDERED_LIST_ITEM_RE);
  if (orderedMatch) {
    return {
      ordered: true,
      indent: orderedMatch[1].length,
      contentIndent: orderedMatch[1].length + orderedMatch[2].length + 2,
      number: Number(orderedMatch[2]),
      text: orderedMatch[3].trim(),
    };
  }

  const unorderedMatch = line.match(UNORDERED_LIST_ITEM_RE);
  if (unorderedMatch) {
    return {
      ordered: false,
      indent: unorderedMatch[1].length,
      contentIndent: unorderedMatch[1].length + 2,
      number: 1,
      text: unorderedMatch[2].trim(),
    };
  }

  return null;
}

function dedentLines(lines: string[]) {
  const indents = lines
    .filter((line) => line.trim().length > 0)
    .map((line) => indentSize(line));
  const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => {
    if (!line.trim()) return "";
    return line.slice(minIndent);
  });
}

function parseList(lines: string[], startIndex: number): ParsedList | null {
  const firstMarker = parseListMarker(lines[startIndex] || "");
  if (!firstMarker) return null;

  const ordered = firstMarker.ordered;
  const baseIndent = firstMarker.indent;
  const items: MarkdownListItem[] = [];
  let cursor = startIndex;

  while (cursor < lines.length) {
    const marker = parseListMarker(lines[cursor] || "");
    if (!marker || marker.indent !== baseIndent || marker.ordered !== ordered) {
      break;
    }

    const continuationLines: string[] = [];
    let children: MarkdownBlock[] = [];
    cursor += 1;

    while (cursor < lines.length) {
      const rawLine = lines[cursor] || "";
      const trimmedLine = rawLine.trim();
      if (!trimmedLine) {
        continuationLines.push("");
        cursor += 1;
        continue;
      }

      const siblingMarker = parseListMarker(rawLine);
      if (
        siblingMarker &&
        siblingMarker.indent === baseIndent &&
        siblingMarker.ordered === ordered
      ) {
        break;
      }

      if (siblingMarker && siblingMarker.indent <= baseIndent) {
        break;
      }

      if (indentSize(rawLine) > baseIndent) {
        const lineIndent = indentSize(rawLine);
        continuationLines.push(rawLine.slice(Math.min(marker.contentIndent, lineIndent)));
        cursor += 1;
        continue;
      }

      break;
    }

    if (continuationLines.some((line) => line.trim().length > 0)) {
      children = parseMarkdown(dedentLines(continuationLines).join("\n"));
    }

    items.push({
      text: marker.text,
      children,
    });
  }

  return {
    block: {
      type: "list",
      ordered,
      start: ordered ? firstMarker.number : 1,
      items,
    },
    nextIndex: cursor,
    indent: baseIndent,
  };
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = normalizeMarkdown(markdown).split("\n");
  let cursor = 0;

  while (cursor < lines.length) {
    const line = lines[cursor];
    const trimmed = line.trim();

    if (!trimmed) {
      cursor += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      cursor += 1;
      while (cursor < lines.length && !lines[cursor].trim().startsWith("```")) {
        codeLines.push(lines[cursor]);
        cursor += 1;
      }
      if (cursor < lines.length && lines[cursor].trim().startsWith("```")) {
        cursor += 1;
      }
      blocks.push({ type: "code", code: codeLines.join("\n"), language });
      continue;
    }

    const headingMatch = trimmed.match(HEADING_RE);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      cursor += 1;
      continue;
    }

    const imageMatch = trimmed.match(IMAGE_RE);
    if (imageMatch) {
      blocks.push({
        type: "image",
        alt: imageMatch[1].trim(),
        src: imageMatch[2].trim(),
      });
      cursor += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (cursor < lines.length && lines[cursor].trim().startsWith(">")) {
        quoteLines.push(lines[cursor].trim().replace(/^>\s?/, ""));
        cursor += 1;
      }
      const quoteBlocks = parseMarkdown(quoteLines.join("\n"));
      blocks.push({ type: "blockquote", blocks: quoteBlocks });
      continue;
    }

    const list = parseList(lines, cursor);
    if (list) {
      blocks.push(list.block);
      cursor = list.nextIndex;
      continue;
    }

    const paragraphLines: string[] = [];
    while (cursor < lines.length) {
      const paragraphLine = lines[cursor];
      const paragraphTrimmed = paragraphLine.trim();
      if (!paragraphTrimmed) break;
      if (
        paragraphTrimmed.startsWith("```") ||
        HEADING_RE.test(paragraphTrimmed) ||
        IMAGE_RE.test(paragraphTrimmed) ||
        paragraphTrimmed.startsWith(">") ||
        !!parseListMarker(paragraphLine)
      ) {
        break;
      }
      paragraphLines.push(paragraphTrimmed);
      cursor += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ").trim() });
  }

  return blocks;
}

function renderInline(
  text: string,
  keyPrefix: string,
  resolveHref: (rawHref: string) => string
): ReactNode[] {
  const result: ReactNode[] = [];
  const tokenRe = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let cursor = 0;
  let tokenIndex = 0;
  let match: RegExpExecArray | null = tokenRe.exec(text);

  while (match) {
    if (match.index > cursor) {
      result.push(text.slice(cursor, match.index));
    }

    if (match[1]) {
      result.push(<code key={`${keyPrefix}-code-${tokenIndex}`}>{match[1].slice(1, -1)}</code>);
    } else if (match[2]) {
      result.push(<strong key={`${keyPrefix}-strong-${tokenIndex}`}>{match[2].slice(2, -2)}</strong>);
    } else {
      const label = match[4] || "";
      const href = resolveHref(match[5] || "#");
      const external = /^https?:\/\//i.test(href);
      result.push(
        <a
          href={href}
          key={`${keyPrefix}-link-${tokenIndex}`}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer noopener" : undefined}
        >
          {label}
        </a>
      );
    }

    cursor = match.index + match[0].length;
    tokenIndex += 1;
    match = tokenRe.exec(text);
  }

  if (cursor < text.length) {
    result.push(text.slice(cursor));
  }

  return result;
}

function renderList(
  block: Extract<MarkdownBlock, { type: "list" }>,
  keyPrefix: string,
  resolveHref: (rawHref: string) => string
) {
  const ListTag = block.ordered ? "ol" : "ul";
  return (
    <ListTag start={block.ordered ? block.start : undefined} key={keyPrefix}>
      {block.items.map((item, itemIndex) => (
        <li key={`${keyPrefix}-item-${itemIndex}`}>
          <span>{renderInline(item.text, `${keyPrefix}-text-${itemIndex}`, resolveHref)}</span>
          {item.children.length > 0
            ? item.children.map((child, childIndex) =>
                renderBlock(child, `${keyPrefix}-child-${itemIndex}-${childIndex}`, resolveHref)
              )
            : null}
        </li>
      ))}
    </ListTag>
  );
}

function renderBlock(
  block: MarkdownBlock,
  keyPrefix: string,
  resolveHref: (rawHref: string) => string
) {
  if (block.type === "heading") {
    const id = slugifyHeading(block.text);
    if (block.level === 1) {
      return (
        <h1 id={id} key={keyPrefix}>
          {renderInline(block.text, `${keyPrefix}-heading`, resolveHref)}
        </h1>
      );
    }
    if (block.level === 2) {
      return (
        <h2 id={id} key={keyPrefix}>
          {renderInline(block.text, `${keyPrefix}-heading`, resolveHref)}
        </h2>
      );
    }
    if (block.level === 3) {
      return (
        <h3 id={id} key={keyPrefix}>
          {renderInline(block.text, `${keyPrefix}-heading`, resolveHref)}
        </h3>
      );
    }
    return (
      <h4 id={id} key={keyPrefix}>
        {renderInline(block.text, `${keyPrefix}-heading`, resolveHref)}
      </h4>
    );
  }

  if (block.type === "paragraph") {
    return <p key={keyPrefix}>{renderInline(block.text, `${keyPrefix}-paragraph`, resolveHref)}</p>;
  }

  if (block.type === "blockquote") {
    return (
      <blockquote key={keyPrefix}>
        {block.blocks.map((child, childIndex) =>
          renderBlock(child, `${keyPrefix}-quote-${childIndex}`, resolveHref)
        )}
      </blockquote>
    );
  }

  if (block.type === "list") {
    return renderList(block, keyPrefix, resolveHref);
  }

  if (block.type === "image") {
    const { alt, maxWidthPx } = parseImageAltMeta(block.alt);
    const figureStyle = maxWidthPx
      ? ({
          maxWidth: `${maxWidthPx}px`,
          marginLeft: "auto",
          marginRight: "auto",
        } as const)
      : undefined;

    return (
      <figure className="rich-text-figure" key={keyPrefix} style={figureStyle}>
        <img src={resolveHref(block.src)} alt={alt} />
      </figure>
    );
  }

  return (
    <pre key={keyPrefix}>
      <code data-lang={block.language || undefined}>{block.code}</code>
    </pre>
  );
}

export function MarkdownRenderer({
  markdown,
  className,
  resolveHref,
}: MarkdownRendererProps) {
  const blocks = parseMarkdown(markdown);
  const hrefResolver = resolveHref ?? ((rawHref: string) => rawHref);
  const mergedClassName = joinClassName("rich-text", className);

  return (
    <div className={mergedClassName}>
      {blocks.map((block, index) => renderBlock(block, `md-${index}`, hrefResolver))}
    </div>
  );
}

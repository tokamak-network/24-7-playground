import type { ReactNode } from "react";

export type MentionLink = {
  type: "thread" | "comment";
  href: string;
};

const MENTION_ID_PATTERN =
  /\b(c[a-z0-9]{24}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})\b/g;

type Props = {
  content: string;
  className?: string;
  mentionLinks?: Record<string, MentionLink>;
};

function renderTextWithMentions(
  text: string,
  keyPrefix: string,
  mentionLinks?: Record<string, MentionLink>
): ReactNode[] {
  if (!mentionLinks || Object.keys(mentionLinks).length === 0) {
    return [text];
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;
  let match: RegExpExecArray | null;
  MENTION_ID_PATTERN.lastIndex = 0;

  while ((match = MENTION_ID_PATTERN.exec(text)) !== null) {
    const rawId = match[1];
    const mentionLink = mentionLinks[rawId];
    if (!mentionLink) {
      continue;
    }

    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    nodes.push(
      <a key={`${keyPrefix}-mention-${tokenIndex}`} href={mentionLink.href}>
        {rawId}
      </a>
    );
    tokenIndex += 1;
    cursor = match.index + rawId.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes.length ? nodes : [text];
}

function renderInline(
  text: string,
  keyPrefix: string,
  mentionLinks?: Record<string, MentionLink>
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(
        ...renderTextWithMentions(
          text.slice(cursor, match.index),
          `${keyPrefix}-text-${tokenIndex}`,
          mentionLinks
        )
      );
    }

    const token = match[0];
    const currentKey = `${keyPrefix}-${tokenIndex}`;
    tokenIndex += 1;

    if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={currentKey}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={currentKey}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={currentKey}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer noopener"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(token);
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(
      ...renderTextWithMentions(
        text.slice(cursor),
        `${keyPrefix}-tail`,
        mentionLinks
      )
    );
  }

  return nodes;
}

function parseTableCells(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) {
    return null;
  }

  const looksLikeTableRow =
    trimmed.startsWith("|") ||
    trimmed.endsWith("|") ||
    trimmed.includes(" | ") ||
    trimmed.includes("| ");
  if (!looksLikeTableRow) {
    return null;
  }

  const normalized = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  const cells = normalized.split("|").map((cell) => cell.trim());
  if (cells.length < 2) {
    return null;
  }

  return cells;
}

function isTableSeparatorLine(line: string) {
  const cells = parseTableCells(line);
  if (!cells) {
    return false;
  }
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function FormattedContent({ content, className, mentionLinks }: Props) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listStart = 1;
  let codeLines: string[] = [];
  let inCodeBlock = false;
  let codeLang = "";

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const text = paragraphLines.join(" ").trim();
    if (!text) {
      paragraphLines = [];
      return;
    }
    const key = `p-${blocks.length}`;
    blocks.push(<p key={key}>{renderInline(text, key, mentionLinks)}</p>);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    const key = `${listType}-${blocks.length}`;
    const items = listItems.map((item, index) => (
      <li key={`${key}-${index}`}>{renderInline(item, `${key}-${index}`, mentionLinks)}</li>
    ));
    if (listType === "ul") {
      blocks.push(<ul key={key}>{items}</ul>);
    } else {
      blocks.push(
        <ol key={key} start={listStart > 1 ? listStart : undefined}>
          {items}
        </ol>
      );
    }
    listItems = [];
    listType = null;
    listStart = 1;
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock) return;
    const key = `code-${blocks.length}`;
    blocks.push(
      <pre key={key}>
        <code data-lang={codeLang || undefined}>{codeLines.join("\n")}</code>
      </pre>
    );
    codeLines = [];
    inCodeBlock = false;
    codeLang = "";
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const tableHeaderCells = parseTableCells(trimmed);
    const tableSeparatorLine = lines[lineIndex + 1] || "";
    if (tableHeaderCells && isTableSeparatorLine(tableSeparatorLine)) {
      flushParagraph();
      flushList();

      const tableBodyRows: string[][] = [];
      lineIndex += 2;

      while (lineIndex < lines.length) {
        const tableRow = parseTableCells(lines[lineIndex] || "");
        if (!tableRow || isTableSeparatorLine(lines[lineIndex] || "")) {
          lineIndex -= 1;
          break;
        }
        tableBodyRows.push(tableRow);
        lineIndex += 1;
      }

      const columnCount = Math.max(
        tableHeaderCells.length,
        ...tableBodyRows.map((row) => row.length)
      );
      const normalizedHeaders = Array.from({ length: columnCount }, (_, index) =>
        tableHeaderCells[index] || ""
      );
      const normalizedRows = tableBodyRows.map((row) =>
        Array.from({ length: columnCount }, (_, index) => row[index] || "")
      );
      const key = `table-${blocks.length}`;

      blocks.push(
        <div key={key} className="rich-text-table-wrap">
          <table className="rich-text-table">
            <thead>
              <tr>
                {normalizedHeaders.map((cell, cellIndex) => (
                  <th key={`${key}-h-${cellIndex}`}>
                    {renderInline(cell, `${key}-h-${cellIndex}`, mentionLinks)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {normalizedRows.map((row, rowIndex) => (
                <tr key={`${key}-r-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${key}-r-${rowIndex}-c-${cellIndex}`}>
                      {renderInline(
                        cell,
                        `${key}-r-${rowIndex}-c-${cellIndex}`,
                        mentionLinks
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const key = `h-${blocks.length}`;
      if (level <= 2) {
        blocks.push(<h3 key={key}>{renderInline(text, key, mentionLinks)}</h3>);
      } else {
        blocks.push(<h4 key={key}>{renderInline(text, key, mentionLinks)}</h4>);
      }
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      const key = `q-${blocks.length}`;
      blocks.push(
        <blockquote key={key}>
          {renderInline(quoteMatch[1].trim(), key, mentionLinks)}
        </blockquote>
      );
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(ulMatch[1].trim());
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listType && listType !== "ol") {
        flushList();
      }
      if (listType !== "ol") {
        const parsedStart = Number.parseInt(olMatch[1], 10);
        listStart = Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : 1;
      }
      listType = "ol";
      listItems.push(olMatch[2].trim());
      continue;
    }

    if (listType) {
      flushList();
    }
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();
  if (inCodeBlock) {
    flushCodeBlock();
  }

  const mergedClassName = ["rich-text", className].filter(Boolean).join(" ");
  return <div className={mergedClassName}>{blocks.length ? blocks : <p>{content}</p>}</div>;
}

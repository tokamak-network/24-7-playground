import type { ReactNode } from "react";

type Props = {
  content: string;
  className?: string;
};

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
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
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

export function FormattedContent({ content, className }: Props) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
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
    blocks.push(<p key={key}>{renderInline(text, key)}</p>);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) return;
    const key = `${listType}-${blocks.length}`;
    const items = listItems.map((item, index) => (
      <li key={`${key}-${index}`}>{renderInline(item, `${key}-${index}`)}</li>
    ));
    if (listType === "ul") {
      blocks.push(<ul key={key}>{items}</ul>);
    } else {
      blocks.push(<ol key={key}>{items}</ol>);
    }
    listItems = [];
    listType = null;
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

  for (const line of lines) {
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

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const key = `h-${blocks.length}`;
      if (level <= 2) {
        blocks.push(<h3 key={key}>{renderInline(text, key)}</h3>);
      } else {
        blocks.push(<h4 key={key}>{renderInline(text, key)}</h4>);
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
          {renderInline(quoteMatch[1].trim(), key)}
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

    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(olMatch[1].trim());
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

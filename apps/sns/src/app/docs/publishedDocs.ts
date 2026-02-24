import { readFile } from "node:fs/promises";
import path from "node:path";
import { slugifyHeading } from "../../components/markdown/headingSlug";

const PUBLISHED_DOCS_PATH_CANDIDATES = [
  path.resolve(process.cwd(), "docs/published"),
  path.resolve(process.cwd(), "../../docs/published"),
];

export async function loadPublishedMarkdown(sectionSlug: string): Promise<string> {
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

export function parsePublishedHeadings(markdown: string) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const h2: Array<{ text: string; id: string }> = [];
  let h1: string | null = null;
  let inFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    const level = match[1].length;
    const text = match[2].trim();
    if (!text) continue;

    if (level === 1 && !h1) {
      h1 = text;
      continue;
    }

    if (level === 2) {
      h2.push({ text, id: slugifyHeading(text) });
    }
  }

  return { h1, h2 };
}

export function fallbackSectionTitle(sectionSlug: string) {
  return sectionSlug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
}


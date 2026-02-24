import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { slugifyHeading } from "../../components/markdown/headingSlug";

const PUBLISHED_DOCS_PATH_CANDIDATES = [
  path.resolve(process.cwd(), "docs/published"),
  path.resolve(process.cwd(), "../../docs/published"),
];

const resolvePublishedDocsRoot = cache(async () => {
  const attempts: string[] = [];
  for (const baseDir of PUBLISHED_DOCS_PATH_CANDIDATES) {
    attempts.push(baseDir);
    try {
      const info = await stat(baseDir);
      if (info.isDirectory()) return baseDir;
    } catch {
      continue;
    }
  }
  throw new Error(`Published docs root not found: ${attempts.join(", ")}`);
});

async function walkPublishedFiles(rootDir: string): Promise<string[]> {
  const result: string[] = [];
  const entries = await readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkPublishedFiles(fullPath)));
      continue;
    }
    if (entry.isFile()) {
      result.push(fullPath);
    }
  }
  return result;
}

export async function loadPublishedMarkdown(sectionSlug: string): Promise<string> {
  const rootDir = await resolvePublishedDocsRoot();
  const filePath = path.join(rootDir, sectionSlug, "page.md");
  try {
    return await readFile(filePath, "utf8");
  } catch {
    throw new Error(`Docs markdown file not found: ${filePath}`);
  }
}

export const loadPublishedDocsLastUpdated = cache(async () => {
  const rootDir = await resolvePublishedDocsRoot();
  const allFiles = await walkPublishedFiles(rootDir);
  if (allFiles.length === 0) {
    throw new Error(`No files found under published docs root: ${rootDir}`);
  }

  let latestMtimeMs = 0;
  for (const filePath of allFiles) {
    try {
      const info = await stat(filePath);
      if (info.mtimeMs > latestMtimeMs) {
        latestMtimeMs = info.mtimeMs;
      }
    } catch {
      continue;
    }
  }

  if (!latestMtimeMs) {
    throw new Error(`Failed to resolve latest update time under: ${rootDir}`);
  }

  const latestDate = new Date(latestMtimeMs);
  return {
    iso: latestDate.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(latestDate),
  };
});

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

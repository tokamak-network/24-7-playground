#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const ROOT_DIR = path.resolve(process.cwd());
const APP_DIR = path.join(ROOT_DIR, "src", "app");
const SRC_DIR = path.join(ROOT_DIR, "src");
const OUTPUT_DIR = path.join(ROOT_DIR, "texts", "routes");
const INDEX_PATH = path.join(ROOT_DIR, "texts", "ROUTES.md");

const ENTRY_FILE_PATTERN = /(page|layout|error|not-found)\.tsx$/;
const SUPPORTED_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const INDEX_FILES = ["index.tsx", "index.ts", "index.jsx", "index.js"];
const UI_SOURCE_FILE_PATTERN = /\.(tsx|jsx)$/;

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function routeFromEntry(entryAbsolutePath) {
  const rel = toPosix(path.relative(APP_DIR, entryAbsolutePath));
  if (rel === "page.tsx") return "/";
  if (rel === "layout.tsx") return "(shared-layout)";
  if (rel === "error.tsx") return "(global-error)";
  if (rel === "not-found.tsx") return "(not-found)";
  if (rel.endsWith("/page.tsx")) {
    return `/${rel.slice(0, -"/page.tsx".length)}`;
  }
  if (rel.endsWith("/layout.tsx")) {
    return `/${rel.slice(0, -"/layout.tsx".length)} (layout)`;
  }
  if (rel.endsWith("/error.tsx")) {
    return `/${rel.slice(0, -"/error.tsx".length)} (error)`;
  }
  return `(${rel})`;
}

function fileNameFromRoute(route) {
  if (route === "/") return "route__root.md";
  if (route === "(shared-layout)") return "route__shared-layout.md";
  if (route === "(global-error)") return "route__global-error.md";
  if (route === "(not-found)") return "route__not-found.md";
  const normalized = route
    .replace(/^\//, "")
    .replace(/\//g, "__")
    .replace(/\s+/g, "-")
    .replace(/[^\w\[\]-]/g, "_");
  return `route__${normalized}.md`;
}

async function findEntryFiles(dir) {
  const output = [];
  const queue = [dir];
  while (queue.length) {
    const current = queue.shift();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "api") continue;
        queue.push(absolute);
        continue;
      }
      if (ENTRY_FILE_PATTERN.test(entry.name)) {
        output.push(absolute);
      }
    }
  }
  return output.sort((a, b) => a.localeCompare(b));
}

function extractImportSpecifiers(sourceText) {
  const specifiers = [];
  const fromImportRegex = /\b(?:import|export)\s[\s\S]*?\bfrom\s+["']([^"']+)["']/g;
  const dynamicImportRegex = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const regex of [fromImportRegex, dynamicImportRegex]) {
    let match = regex.exec(sourceText);
    while (match) {
      specifiers.push(match[1]);
      match = regex.exec(sourceText);
    }
  }

  return specifiers;
}

async function fileExists(candidatePath) {
  try {
    await fs.access(candidatePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveImportPath(baseFile, specifier) {
  let basePath;
  if (specifier.startsWith("src/")) {
    basePath = path.join(ROOT_DIR, specifier);
  } else if (specifier.startsWith(".")) {
    basePath = path.resolve(path.dirname(baseFile), specifier);
  } else {
    return null;
  }

  for (const extension of SUPPORTED_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;
    if (await fileExists(candidate)) return candidate;
  }

  if (await fileExists(basePath)) {
    const stat = await fs.stat(basePath);
    if (stat.isFile()) return basePath;
  }

  for (const indexFile of INDEX_FILES) {
    const candidate = path.join(basePath, indexFile);
    if (await fileExists(candidate)) return candidate;
  }

  return null;
}

async function collectRouteFiles(entryFile) {
  const queue = [entryFile];
  const visited = new Set();
  const collected = [];

  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    collected.push(current);

    let sourceText = "";
    try {
      sourceText = await fs.readFile(current, "utf8");
    } catch {
      continue;
    }
    const specifiers = extractImportSpecifiers(sourceText);

    for (const specifier of specifiers) {
      const resolved = await resolveImportPath(current, specifier);
      if (!resolved) continue;
      if (!resolved.startsWith(SRC_DIR)) continue;
      if (
        !ENTRY_FILE_PATTERN.test(path.basename(resolved)) &&
        !UI_SOURCE_FILE_PATTERN.test(resolved)
      ) {
        continue;
      }
      queue.push(resolved);
    }
  }

  return collected.sort((a, b) => a.localeCompare(b));
}

function normalizeJsxText(raw) {
  return raw.replace(/\s+/g, " ").trim();
}

function shouldKeepLiteral(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  if (value.toLowerCase() === "use client") return false;
  if (!/[A-Za-z0-9]/.test(value)) return false;
  if (/^[\[\]\{\}\(\)\|`*#<>]+$/.test(value)) return false;
  if (/^(src\/|\.{1,2}\/)/.test(value)) return false;
  if (/^\/(api|sns|manage|requests|reports|sign-in)/.test(value)) return false;
  if (/^[a-z]{2}-[A-Z]{2}$/.test(value)) return false;
  if (/^[a-z0-9_-]+$/.test(value) && /[-_]/.test(value)) return false;
  if (/^[a-z0-9_-]+(?:\s+[a-z0-9_-]+)+$/.test(value)) return false;
  if (/^(?:[A-Za-z0-9_-]+\.)+[A-Za-z0-9_-]+$/.test(value)) return false;
  if (/^[a-z0-9_-]+(?:\.[a-z0-9_-]+)+$/i.test(value)) return false;
  if (/^[a-z0-9_-]+\s+[a-z0-9_-]+$/i.test(value) && value.includes("-")) return false;
  if (/^(accountsChanged|chainChanged|eth_requestAccounts)$/i.test(value)) return false;
  if (/^(Content-Type|noreferrer noopener|Enter)$/i.test(value)) return false;
  if (/^[A-Z0-9_]+$/.test(value)) return false;
  if (/^[a-z0-9._/-]+$/.test(value) && value.length <= 24) return false;
  return true;
}

function escapedInlineCode(text) {
  return String(text || "").replace(/`/g, "\\`");
}

function extractTextEntries(sourceFilePath, sourceText) {
  const sourceFile = ts.createSourceFile(
    sourceFilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const entries = [];
  const seen = new Set();

  function pushEntry(node, kind, text) {
    const normalized = kind === "jsx-text" ? normalizeJsxText(text) : String(text || "").trim();
    if (!normalized) return;
    if (kind !== "jsx-text" && !shouldKeepLiteral(normalized)) return;

    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const key = `${line + 1}|${kind}|${normalized}`;
    if (seen.has(key)) return;
    seen.add(key);

    entries.push({
      line: line + 1,
      kind,
      text: normalized,
    });
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      pushEntry(node, "jsx-text", node.getText(sourceFile));
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const parent = node.parent;
      if (
        ts.isImportDeclaration(parent) ||
        ts.isExportDeclaration(parent) ||
        ts.isExternalModuleReference(parent)
      ) {
        // skip module specifiers
      } else {
        pushEntry(node, "string-literal", node.text);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return entries.sort((a, b) => (a.line === b.line ? a.kind.localeCompare(b.kind) : a.line - b.line));
}

async function buildRouteDocument(entryFile) {
  const route = routeFromEntry(entryFile);
  const routeFiles = await collectRouteFiles(entryFile);
  const generatedAt = new Date().toISOString();

  let entryIndex = 1;
  const lines = [];
  lines.push(`# SNS Route Text Inventory`);
  lines.push("");
  lines.push(`- Route: \`${route}\``);
  lines.push(`- Entry file: \`${toPosix(path.relative(ROOT_DIR, entryFile))}\``);
  lines.push(`- Generated at: \`${generatedAt}\``);
  lines.push(`- Included source files: \`${routeFiles.length}\``);
  lines.push("");
  lines.push("## Edit Guide");
  lines.push("1. Edit only the `text` values below.");
  lines.push("2. Keep each `TXT` id unchanged.");
  lines.push("3. If you remove an entry, mention the `TXT` id when requesting UI updates.");
  lines.push("");

  for (const filePath of routeFiles) {
    const sourceText = await fs.readFile(filePath, "utf8");
    const entries = extractTextEntries(filePath, sourceText);
    if (!entries.length) continue;

    lines.push(`## File: \`${toPosix(path.relative(ROOT_DIR, filePath))}\``);
    lines.push("");
    for (const entry of entries) {
      const id = `TXT${String(entryIndex).padStart(4, "0")}`;
      entryIndex += 1;
      lines.push(`- id: \`${id}\``);
      lines.push(`  - line: \`${entry.line}\``);
      lines.push(`  - kind: \`${entry.kind}\``);
      lines.push(`  - text: \`${escapedInlineCode(entry.text)}\``);
    }
    lines.push("");
  }

  return {
    route,
    fileName: fileNameFromRoute(route),
    body: `${lines.join("\n").trim()}\n`,
  };
}

async function main() {
  const entryFiles = await findEntryFiles(APP_DIR);
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const docs = [];
  for (const entryFile of entryFiles) {
    const doc = await buildRouteDocument(entryFile);
    const outputPath = path.join(OUTPUT_DIR, doc.fileName);
    await fs.writeFile(outputPath, doc.body, "utf8");
    docs.push({
      route: doc.route,
      path: toPosix(path.relative(ROOT_DIR, outputPath)),
    });
  }

  const indexLines = [];
  indexLines.push("# SNS Route Text Inventory Index");
  indexLines.push("");
  indexLines.push(
    "This index lists per-route markdown files generated from SNS page/layout/error entries."
  );
  indexLines.push("");
  indexLines.push("## Routes");
  indexLines.push("");
  for (const item of docs.sort((a, b) => a.route.localeCompare(b.route))) {
    indexLines.push(`- \`${item.route}\` -> \`${item.path}\``);
  }
  indexLines.push("");
  indexLines.push("## Regenerate");
  indexLines.push("");
  indexLines.push("Run:");
  indexLines.push("");
  indexLines.push("```bash");
  indexLines.push("npm -w apps/sns run texts:export");
  indexLines.push("```");
  indexLines.push("");

  await fs.mkdir(path.dirname(INDEX_PATH), { recursive: true });
  await fs.writeFile(INDEX_PATH, `${indexLines.join("\n").trim()}\n`, "utf8");

  console.log(
    `Generated ${docs.length} markdown files under ${toPosix(path.relative(ROOT_DIR, OUTPUT_DIR))}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

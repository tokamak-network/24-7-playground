#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const RUNNER_ROOT = path.resolve(__dirname, "..");
const PROMPTS_DIR = path.join(RUNNER_ROOT, "prompts");
const OUTPUT_PATH = path.join(RUNNER_ROOT, "src", "promptAssets.generated.js");

function toPosixPath(value) {
  return String(value || "").split(path.sep).join("/");
}

function collectPromptFiles(dir, prefix = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name.startsWith(".")) continue;
    const absolutePath = path.join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectPromptFiles(absolutePath, toPosixPath(relativePath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".md")) continue;
    results.push(toPosixPath(relativePath));
  }
  return results;
}

function buildPromptAssetMap() {
  const files = collectPromptFiles(PROMPTS_DIR);
  const assets = {};
  for (const relativePath of files) {
    const absolutePath = path.join(PROMPTS_DIR, relativePath);
    const content = fs.readFileSync(absolutePath, "utf8").replace(/\r\n/g, "\n").trim();
    assets[relativePath] = content;
  }
  return assets;
}

function renderModuleSource(promptAssets) {
  return [
    "/* eslint-disable */",
    "// AUTO-GENERATED FILE. DO NOT EDIT.",
    "// Source: apps/runner/prompts/*.md",
    "",
    "\"use strict\";",
    "",
    `const PROMPT_ASSETS = Object.freeze(${JSON.stringify(promptAssets, null, 2)});`,
    "",
    "module.exports = {",
    "  PROMPT_ASSETS,",
    "};",
    "",
  ].join("\n");
}

function main() {
  const promptAssets = buildPromptAssetMap();
  const moduleSource = renderModuleSource(promptAssets);
  fs.writeFileSync(OUTPUT_PATH, moduleSource, "utf8");
  console.log(
    `[runner] generated embedded prompt assets: ${OUTPUT_PATH} (${Object.keys(promptAssets).length} files)`
  );
}

main();

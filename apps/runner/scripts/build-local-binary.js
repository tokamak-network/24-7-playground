#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const RUNNER_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(RUNNER_ROOT, "dist");

function resolveLocalTarget() {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return {
      target: "node18-macos-arm64",
      outputName: "tokamak-runner-macos-arm64",
      label: "macOS arm64",
    };
  }
  if (process.platform === "linux" && process.arch === "x64") {
    return {
      target: "node18-linux-x64",
      outputName: "tokamak-runner-linux-x64",
      label: "Linux x64",
    };
  }
  if (process.platform === "win32" && process.arch === "x64") {
    return {
      target: "node18-win-x64",
      outputName: "tokamak-runner-win-x64.exe",
      label: "Windows x64",
    };
  }
  throw new Error(
    `Unsupported platform/arch for local binary build: ${process.platform}/${process.arch}`
  );
}

function runOrThrow(command, args) {
  const result = spawnSync(command, args, {
    cwd: RUNNER_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function main() {
  const local = resolveLocalTarget();
  fs.mkdirSync(DIST_DIR, { recursive: true });
  const outputPath = path.join("dist", local.outputName);
  console.log(
    `[runner-build] building local binary for ${local.label} (${local.target}) -> ${outputPath}`
  );
  runOrThrow("npx", [
    "pkg@5.8.1",
    ".",
    "--targets",
    local.target,
    "--output",
    outputPath,
  ]);
  console.log(`[runner-build] build complete: ${path.join(RUNNER_ROOT, outputPath)}`);
}

try {
  main();
} catch (error) {
  const message = error && error.message ? String(error.message) : "Unknown build error";
  console.error(`[runner-build] fatal: ${message}`);
  process.exit(1);
}

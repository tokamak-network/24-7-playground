#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const RUNNER_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(RUNNER_ROOT, "dist");

function resolveBinaryName() {
  if (process.platform === "linux" && process.arch === "x64") {
    return "tokamak-runner-linux-x64";
  }
  if (process.platform === "darwin" && process.arch === "arm64") {
    return "tokamak-runner-macos-arm64";
  }
  if (process.platform === "win32" && process.arch === "x64") {
    return "tokamak-runner-win-x64.exe";
  }
  throw new Error(
    `Unsupported platform/arch for runner binary: ${process.platform}/${process.arch}`
  );
}

function main() {
  const binaryName = resolveBinaryName();
  const binaryPath = path.join(DIST_DIR, binaryName);
  if (!fs.existsSync(binaryPath)) {
    throw new Error(
      `Runner binary not found at ${binaryPath}. Build it first with: npm run build:binary`
    );
  }

  const args = process.argv.slice(2);
  const child = spawn(binaryPath, args, { stdio: "inherit" });
  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

try {
  main();
} catch (error) {
  const message =
    error && error.message ? String(error.message) : "Unknown start failure";
  console.error(`[runner-binary] fatal: ${message}`);
  process.exit(1);
}

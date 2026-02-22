#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const RUNNER_ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(RUNNER_ROOT, "dist");

function normalizePort(raw) {
  const parsed = Number(String(raw || "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return String(Math.floor(parsed));
}

function normalizeForwardArgs(argv) {
  const input = Array.isArray(argv) ? argv : [];
  const output = [];

  for (let i = 0; i < input.length; i += 1) {
    const token = String(input[i] || "").trim();
    if (!token) continue;

    if (token === "-s") {
      output.push("--secret");
      const next = String(input[i + 1] || "").trim();
      if (next) {
        output.push(next);
        i += 1;
      }
      continue;
    }

    if (token.startsWith("-s=")) {
      const value = String(token.slice("-s=".length) || "").trim();
      if (value) {
        output.push("--secret", value);
      }
      continue;
    }

    if (token === "-p") {
      const next = normalizePort(input[i + 1]);
      if (next) {
        output.push("--port", next);
        i += 1;
      }
      continue;
    }

    if (token.startsWith("-p=")) {
      const value = normalizePort(token.slice("-p=".length));
      if (value) {
        output.push("--port", value);
      }
      continue;
    }

    const positionalPort = normalizePort(token);
    if (positionalPort) {
      output.push("--port", positionalPort);
      continue;
    }

    output.push(token);
  }

  return output;
}

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
      `Runner binary not found at ${binaryPath}. Build it first with: npm run build`
    );
  }

  const args = normalizeForwardArgs(process.argv.slice(2));
  const child = spawn(binaryPath, ["serve", ...args], { stdio: "inherit" });
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

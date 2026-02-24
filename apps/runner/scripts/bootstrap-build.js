#!/usr/bin/env node

"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const RUNNER_ROOT = path.resolve(__dirname, "..");

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
  const wantsAllTargets = process.argv.slice(2).includes("--all");
  const buildScript = wantsAllTargets ? "build" : "build:local";

  console.log("[runner-bootstrap] installing runner dependencies...");
  runOrThrow("npm", ["install", "--no-audit", "--no-fund"]);

  console.log(`[runner-bootstrap] running npm script: ${buildScript}`);
  runOrThrow("npm", ["run", buildScript]);
}

try {
  main();
} catch (error) {
  const message =
    error && error.message ? String(error.message) : "Unknown bootstrap error";
  console.error(`[runner-bootstrap] fatal: ${message}`);
  process.exit(1);
}

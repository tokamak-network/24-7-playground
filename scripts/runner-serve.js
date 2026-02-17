#!/usr/bin/env node

const { spawn } = require("node:child_process");

const DEFAULT_PORT = 4318;

function normalizePort(raw) {
  const parsed = Number(String(raw || "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return String(Math.floor(parsed));
}

function resolvePort(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token) continue;

    if (token === "-p" || token === "--port") {
      const next = normalizePort(argv[i + 1]);
      if (next) return next;
      continue;
    }

    if (token.startsWith("--port=")) {
      const value = normalizePort(token.slice("--port=".length));
      if (value) return value;
      continue;
    }

    if (token.startsWith("-p=")) {
      const value = normalizePort(token.slice("-p=".length));
      if (value) return value;
      continue;
    }

    const positional = normalizePort(token);
    if (positional) return positional;
  }

  return String(DEFAULT_PORT);
}

function main() {
  const port = resolvePort(process.argv.slice(2));
  const child = spawn(
    "npm",
    [
      "-w",
      "apps/runner",
      "run",
      "serve",
      "--",
      "--host",
      "127.0.0.1",
      "--port",
      port,
    ],
    { stdio: "inherit" }
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main();

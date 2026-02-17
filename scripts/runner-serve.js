#!/usr/bin/env node

const { spawn } = require("node:child_process");

const DEFAULT_PORT = 4318;

function normalizePort(raw) {
  const parsed = Number(String(raw || "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return String(Math.floor(parsed));
}

function resolveOptions(argv) {
  let port = null;
  let secret = null;
  let allowOrigin = null;

  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token) continue;

    if (token === "-p" || token === "--port") {
      const next = normalizePort(argv[i + 1]);
      if (next) port = next;
      i += 1;
      continue;
    }

    if (token.startsWith("--port=")) {
      const value = normalizePort(token.slice("--port=".length));
      if (value) port = value;
      continue;
    }

    if (token.startsWith("-p=")) {
      const value = normalizePort(token.slice("-p=".length));
      if (value) port = value;
      continue;
    }

    if (token === "-s" || token === "--secret") {
      const next = String(argv[i + 1] || "").trim();
      if (next) secret = next;
      i += 1;
      continue;
    }

    if (token.startsWith("--secret=")) {
      const value = String(token.slice("--secret=".length) || "").trim();
      if (value) secret = value;
      continue;
    }

    if (token === "--allow-origin") {
      const next = String(argv[i + 1] || "").trim();
      if (next) allowOrigin = next;
      i += 1;
      continue;
    }

    if (token.startsWith("--allow-origin=")) {
      const value = String(token.slice("--allow-origin=".length) || "").trim();
      if (value) allowOrigin = value;
      continue;
    }

    const positional = normalizePort(token);
    if (positional) port = positional;
  }

  return {
    port: port || String(DEFAULT_PORT),
    secret,
    allowOrigin,
  };
}

function main() {
  const options = resolveOptions(process.argv.slice(2));
  const command = [
    "-w",
    "apps/runner",
    "run",
    "serve",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    options.port,
  ];
  if (options.secret) {
    command.push("--secret", options.secret);
  }
  if (options.allowOrigin) {
    command.push("--allow-origin", options.allowOrigin);
  }

  const child = spawn(
    "npm",
    command,
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

#!/usr/bin/env node

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");
const { RunnerEngine } = require("./engine");
const { toErrorMessage, logJson, logSummary, fullLogPath } = require("./utils");
const { communicationLogPath } = require("./communicationLog");

function parseArgs(argv) {
  const [, , command = "serve", ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
      continue;
    }
    options[key] = next;
    i += 1;
  }
  return { command, options };
}

function trace(label, payload) {
  logJson(console, `[runner][launcher] ${label}`, payload);
}

function jsonResponse(response, statusCode, payload, meta) {
  trace("response", {
    statusCode,
    payload,
    meta: meta || null,
  });
  const body = JSON.stringify(payload);
  const origin = String(meta?.allowedOrigin || "");
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "content-type,authorization,x-runner-secret",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(body);
}

function normalizeOrigin(value, fallback) {
  const raw = String(value || "").trim();
  const normalized = raw ? raw.replace(/\/+$/, "") : "";
  if (normalized) return normalized;
  return String(fallback || "").trim().replace(/\/+$/, "");
}

function secureCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizePath(urlString) {
  try {
    const parsed = new URL(urlString, "http://localhost");
    return parsed.pathname;
  } catch {
    return "/";
  }
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  const parsed = raw.trim() ? JSON.parse(raw) : {};
  trace("request-body", {
    method: request.method,
    url: request.url,
    raw,
    parsed,
  });
  return parsed;
}

async function startServer(options) {
  const host = String(options.host || "127.0.0.1");
  const port = Number(options.port || 4318);
  const allowedOrigin = normalizeOrigin(
    options["allow-origin"] || process.env.RUNNER_ALLOWED_ORIGIN,
    "http://localhost:3000"
  );
  const launcherSecret = String(
    options.secret || process.env.RUNNER_LAUNCHER_SECRET || ""
  ).trim();
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid --port value");
  }
  if (!launcherSecret) {
    throw new Error("RUNNER_LAUNCHER_SECRET (or --secret) is required");
  }

  const engine = new RunnerEngine(console);
  const server = http.createServer(async (request, response) => {
    const requestOrigin = normalizeOrigin(request.headers.origin, "");
    const originAllowed = !requestOrigin || requestOrigin === allowedOrigin;

    if (request.method === "OPTIONS") {
      if (!originAllowed) {
        response.writeHead(403, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": allowedOrigin,
        });
        response.end(JSON.stringify({ error: "Origin not allowed" }));
        return;
      }
      response.writeHead(204, {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": "content-type,authorization,x-runner-secret",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      });
      response.end();
      return;
    }

    const route = normalizePath(request.url || "/");
    trace("request", {
      method: request.method,
      url: request.url,
      route,
      headers: request.headers,
      allowedOrigin,
    });
    try {
      if (!originAllowed) {
        jsonResponse(
          response,
          403,
          { error: "Origin not allowed" },
          { route, method: request.method, allowedOrigin }
        );
        return;
      }

      const isProtectedRunnerRoute = route.startsWith("/runner/");
      if (isProtectedRunnerRoute) {
        const incomingSecret = String(request.headers["x-runner-secret"] || "");
        if (!secureCompare(incomingSecret, launcherSecret)) {
          jsonResponse(
            response,
            401,
            { error: "Unauthorized" },
            { route, method: request.method, allowedOrigin }
          );
          return;
        }
      }

      if (request.method === "GET" && route === "/health") {
        jsonResponse(
          response,
          200,
          { ok: true, service: "runner-launcher" },
          { route, method: request.method, allowedOrigin }
        );
        return;
      }

      if (request.method === "GET" && route === "/runner/status") {
        jsonResponse(
          response,
          200,
          { ok: true, status: engine.getStatus() },
          { route, method: request.method, allowedOrigin }
        );
        return;
      }

      if (request.method === "POST" && route === "/runner/start") {
        const body = await readJsonBody(request);
        await engine.start(body.config || body);
        logSummary(
          console,
          `launcher start request accepted (route=${route}, method=${request.method})`
        );
        jsonResponse(
          response,
          200,
          {
            ok: true,
            message: "Runner started",
            status: engine.getStatus(),
          },
          { route, method: request.method, body, allowedOrigin }
        );
        return;
      }

      if (request.method === "POST" && route === "/runner/stop") {
        engine.stop();
        logSummary(
          console,
          `launcher stop request accepted (route=${route}, method=${request.method})`
        );
        jsonResponse(
          response,
          200,
          {
            ok: true,
            message: "Runner stopped",
            status: engine.getStatus(),
          },
          { route, method: request.method, allowedOrigin }
        );
        return;
      }

      if (request.method === "POST" && route === "/runner/config") {
        const body = await readJsonBody(request);
        const nextStatus = engine.updateConfig(body.config || body);
        logSummary(
          console,
          `launcher config updated (route=${route}, method=${request.method})`
        );
        jsonResponse(
          response,
          200,
          {
            ok: true,
            message: "Runner config updated",
            status: nextStatus,
          },
          { route, method: request.method, body, allowedOrigin }
        );
        return;
      }

      if (request.method === "POST" && route === "/runner/run-once") {
        const body = await readJsonBody(request);
        const result = body && (body.config || body.snsBaseUrl)
          ? await engine.runOnceWithConfig(body.config || body)
          : await engine.runOnce();
        logSummary(
          console,
          `launcher run-once completed (route=${route}, method=${request.method}, ok=${Boolean(result && result.ok)})`
        );
        jsonResponse(
          response,
          200,
          { ok: true, result, status: engine.getStatus() },
          { route, method: request.method, body, allowedOrigin }
        );
        return;
      }

      jsonResponse(
        response,
        404,
        { error: "Not found" },
        { route, method: request.method, allowedOrigin }
      );
    } catch (error) {
      trace("error", {
        route,
        method: request.method,
        error: {
          message: toErrorMessage(error, "Request failed"),
          stack: error && error.stack ? String(error.stack) : null,
        },
      });
      jsonResponse(
        response,
        400,
        {
          error: toErrorMessage(error, "Request failed"),
        },
        { route, method: request.method, allowedOrigin }
      );
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  console.log(`[runner-launcher] listening on http://${host}:${port}`);
  console.log(`[runner-launcher] allowed origin: ${allowedOrigin}`);
  console.log(`[runner-launcher] full trace log: ${fullLogPath()}`);
  console.log(
    `[runner-launcher] communication log: ${communicationLogPath()}`
  );
}

async function runOnceWithConfig(options) {
  const configPath = String(options.config || "").trim();
  if (!configPath) {
    throw new Error("run-once requires --config <path>");
  }
  const absolutePath = path.resolve(process.cwd(), configPath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const config = JSON.parse(raw);
  const engine = new RunnerEngine(console);
  const result = await engine.runOnceWithConfig(config);
  console.log(JSON.stringify(result, null, 2));
}

function printHelp() {
  console.log(
    [
      "Local Runner Launcher CLI",
      "",
      "Commands:",
      "  serve [--host 127.0.0.1] [--port 4318] [--secret <value>] [--allow-origin http://localhost:3000]",
      "  run-once --config ./runner.config.example.json",
      "",
      "Launcher API routes (serve):",
      "  GET  /health",
      "  GET  /runner/status",
      "  POST /runner/start      { config: RunnerConfig }",
      "  POST /runner/stop",
      "  POST /runner/config     { config: Partial<RunnerConfig> }",
      "  POST /runner/run-once   { config?: RunnerConfig }",
    ].join("\n")
  );
}

async function main() {
  const { command, options } = parseArgs(process.argv);
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }
  if (command === "run-once") {
    await runOnceWithConfig(options);
    return;
  }
  await startServer(options);
}

main().catch((error) => {
  console.error("[runner-launcher] fatal:", toErrorMessage(error, "Unknown error"));
  process.exit(1);
});

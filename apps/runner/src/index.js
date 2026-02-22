#!/usr/bin/env node

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");
const { RunnerEngine } = require("./engine");
const {
  toErrorMessage,
  logJson,
  logSummary,
  fullLogPath,
  resolveRunnerInstanceLogDir,
} = require("./utils");
const { communicationLogPath } = require("./communicationLog");

const HARDCODED_ALLOWED_ORIGIN = "https://agentic-ethereum.com";

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
    "Access-Control-Allow-Private-Network": "true",
  });
  response.end(body);
}

function normalizeOrigin(value, fallback) {
  const raw = String(value || "").trim();
  const normalized = raw ? raw.replace(/\/+$/, "") : "";
  if (normalized) return normalized;
  return String(fallback || "").trim().replace(/\/+$/, "");
}

function parseAllowedOrigin(rawValue) {
  const normalized = normalizeOrigin(rawValue, "");
  if (!normalized) {
    throw new Error("--sns must be a valid http(s) origin");
  }
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error("--sns must be a valid http(s) origin");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("--sns must be a valid http(s) origin");
  }
  return parsed.origin;
}

function resolveAllowedOrigin(options) {
  const configuredOrigin = options.sns;
  if (String(configuredOrigin || "").trim()) {
    return parseAllowedOrigin(configuredOrigin);
  }
  return parseAllowedOrigin(HARDCODED_ALLOWED_ORIGIN);
}

function secureCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseRequestMeta(urlString) {
  try {
    const parsed = new URL(urlString, "http://localhost");
    return {
      route: parsed.pathname,
      searchParams: parsed.searchParams,
    };
  } catch {
    return {
      route: "/",
      searchParams: new URLSearchParams(),
    };
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

function normalizeAgentId(value) {
  return String(value || "").trim();
}

class MultiAgentRunnerManager {
  constructor(logger = console) {
    this.logger = logger;
    this.engines = new Map();
  }

  #defaultStatus() {
    return {
      running: false,
      startedAt: null,
      lastRunAt: null,
      lastSuccessAt: null,
      lastError: null,
      cycleCount: 0,
      lastActionCount: 0,
      lastLlmOutput: null,
      config: null,
    };
  }

  #activeStatuses() {
    const entries = [];
    for (const [agentId, engine] of this.engines.entries()) {
      const status = engine.getStatus();
      if (!status || !status.running) {
        this.engines.delete(agentId);
        continue;
      }
      entries.push({ agentId, status });
    }
    return entries;
  }

  getStatus(options = {}) {
    const selectedAgentId = normalizeAgentId(options.agentId);
    const active = this.#activeStatuses();
    const runningAny = active.length > 0;
    const runningAgentIds = active.map((entry) => entry.agentId);
    const selected =
      selectedAgentId
        ? active.find((entry) => entry.agentId === selectedAgentId) || null
        : null;
    const selectedStatus = selected ? selected.status : null;
    const primaryStatus =
      selectedAgentId
        ? selectedStatus || this.#defaultStatus()
        : active.length === 1
          ? active[0].status
          : this.#defaultStatus();
    const running = selectedAgentId
      ? Boolean(selectedStatus && selectedStatus.running)
      : runningAny;
    return {
      ...primaryStatus,
      running,
      runningAny,
      selectedAgentId: selectedAgentId || null,
      selectedAgentRunning: Boolean(selectedStatus && selectedStatus.running),
      selectedAgentStatus: selectedStatus,
      agentCount: active.length,
      runningAgentIds,
      agents: active.map((entry) => ({
        agentId: entry.agentId,
        ...entry.status,
      })),
      config:
        selectedAgentId
          ? selectedStatus
            ? selectedStatus.config || null
            : null
          : active.length === 1
            ? active[0].status.config || null
            : null,
    };
  }

  async start(configInput) {
    const agentId = normalizeAgentId(configInput && configInput.agentId);
    if (!agentId) {
      throw new Error("agentId is required");
    }
    const existing = this.engines.get(agentId);
    if (existing && existing.getStatus().running) {
      throw new Error(`Runner is already running for agent ${agentId}`);
    }
    const engine = existing || new RunnerEngine(this.logger);
    await engine.start(configInput);
    this.engines.set(agentId, engine);
    return this.getStatus({ agentId });
  }

  stop(options = {}) {
    const agentId = normalizeAgentId(options.agentId);
    if (agentId) {
      const engine = this.engines.get(agentId);
      if (engine) {
        engine.stop();
        this.engines.delete(agentId);
      }
      return this.getStatus({ agentId });
    }

    for (const [entryAgentId, engine] of this.engines.entries()) {
      engine.stop();
      this.engines.delete(entryAgentId);
    }
    return this.getStatus();
  }

  updateConfig(configPatch) {
    const requestedAgentId = normalizeAgentId(configPatch && configPatch.agentId);
    const active = this.#activeStatuses();
    const agentId =
      requestedAgentId || (active.length === 1 ? active[0].agentId : "");
    if (!agentId) {
      throw new Error("agentId is required for /runner/config when multiple agents are running");
    }
    const engine = this.engines.get(agentId);
    if (!engine || !engine.getStatus().running) {
      throw new Error(`Runner is not running for agent ${agentId}`);
    }
    engine.updateConfig(configPatch);
    return this.getStatus({ agentId });
  }

  async runOnceWithConfig(configInput) {
    const engine = new RunnerEngine(this.logger);
    return engine.runOnceWithConfig(configInput);
  }

  async runOnce(options = {}) {
    const agentId = normalizeAgentId(options.agentId);
    if (agentId) {
      const engine = this.engines.get(agentId);
      if (!engine || !engine.getStatus().running) {
        throw new Error(`Runner is not running for agent ${agentId}`);
      }
      return engine.runOnce();
    }

    const active = this.#activeStatuses();
    if (!active.length) {
      return {
        ok: true,
        skipped: true,
        reason: "No running agents",
        results: [],
      };
    }

    const results = await Promise.all(
      active.map(async (entry) => {
        try {
          const engine = this.engines.get(entry.agentId);
          if (!engine) {
            return {
              agentId: entry.agentId,
              ok: false,
              error: "Runner engine not available",
            };
          }
          const result = await engine.runOnce();
          return {
            agentId: entry.agentId,
            ok: Boolean(result && result.ok),
            result,
          };
        } catch (error) {
          return {
            agentId: entry.agentId,
            ok: false,
            error: toErrorMessage(error, "run-once failed"),
          };
        }
      })
    );
    return {
      ok: results.every((item) => item.ok),
      results,
    };
  }
}

async function startServer(options) {
  const host = String(options.host || "127.0.0.1");
  const port = Number(options.port || 4318);
  const allowedOrigin = resolveAllowedOrigin(options);
  const launcherSecret = String(
    options.secret || process.env.RUNNER_LAUNCHER_SECRET || ""
  ).trim();
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid --port value");
  }
  if (!launcherSecret) {
    throw new Error("RUNNER_LAUNCHER_SECRET (or --secret) is required");
  }
  process.env.RUNNER_PORT = String(port);

  const manager = new MultiAgentRunnerManager(console);
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
        "Access-Control-Allow-Private-Network": "true",
      });
      response.end();
      return;
    }

    const { route, searchParams } = parseRequestMeta(request.url || "/");
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
        const requestedAgentId = normalizeAgentId(searchParams.get("agentId"));
        jsonResponse(
          response,
          200,
          { ok: true, status: manager.getStatus({ agentId: requestedAgentId }) },
          { route, method: request.method, allowedOrigin }
        );
        return;
      }

      if (request.method === "POST" && route === "/runner/start") {
        const body = await readJsonBody(request);
        const config = body.config || body;
        const status = await manager.start(config);
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
            status,
          },
          { route, method: request.method, body, allowedOrigin }
        );
        return;
      }

      if (request.method === "POST" && route === "/runner/stop") {
        const body = await readJsonBody(request);
        const requestedAgentId =
          normalizeAgentId(
            (body && body.agentId) || (body && body.config && body.config.agentId)
          ) ||
          normalizeAgentId(searchParams.get("agentId"));
        const status = manager.stop(
          requestedAgentId ? { agentId: requestedAgentId } : {}
        );
        logSummary(
          console,
          `launcher stop request accepted (route=${route}, method=${request.method})`
        );
        jsonResponse(
          response,
          200,
          {
            ok: true,
            message: requestedAgentId ? "Runner stopped" : "All runners stopped",
            status,
          },
          { route, method: request.method, allowedOrigin }
        );
        return;
      }

      if (request.method === "POST" && route === "/runner/config") {
        const body = await readJsonBody(request);
        const nextStatus = manager.updateConfig(body.config || body);
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
        const requestedAgentId =
          normalizeAgentId((body && body.agentId) || searchParams.get("agentId"));
        const result = body && (body.config || body.snsBaseUrl)
          ? await manager.runOnceWithConfig(body.config || body)
          : await manager.runOnce(
              requestedAgentId ? { agentId: requestedAgentId } : {}
            );
        logSummary(
          console,
          `launcher run-once completed (route=${route}, method=${request.method}, ok=${Boolean(result && result.ok)})`
        );
        jsonResponse(
          response,
          200,
          {
            ok: true,
            result,
            status: manager.getStatus({ agentId: requestedAgentId }),
          },
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
  console.log(
    `[runner-launcher] instance log dir: ${resolveRunnerInstanceLogDir()}`
  );
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
      "  serve [--host 127.0.0.1] [--port 4318] [--secret <value>] [--sns <origin>]",
      "  run-once --config ./runner.config.example.json",
      "",
      "Launcher API routes (serve):",
      "  GET  /health",
      "  GET  /runner/status?agentId=<id>",
      "  POST /runner/start      { config: RunnerConfig }",
      "  POST /runner/stop       { agentId?: string }",
      "  POST /runner/config     { config: Partial<RunnerConfig> & { agentId } }",
      "  POST /runner/run-once   { config?: RunnerConfig, agentId?: string }",
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

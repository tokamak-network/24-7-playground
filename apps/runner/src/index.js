#!/usr/bin/env node

const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const net = require("node:net");
const readline = require("node:readline/promises");
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
const DEFAULT_LAUNCHER_PORT = 4318;
const LAUNCHER_STATE_DIR = path.join(os.homedir(), ".tokamak-runner");
const LAUNCHER_STATE_FILE = path.join(LAUNCHER_STATE_DIR, "launcher.json");

function parseArgs(argv) {
  const [, , command = "serve", ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) continue;
    const equalsIndex = token.indexOf("=");
    if (equalsIndex > 2) {
      const key = token.slice(2, equalsIndex);
      const value = token.slice(equalsIndex + 1);
      options[key] = value;
      continue;
    }
    const key = token.slice(2);
    const values = [];
    let cursor = i + 1;
    while (cursor < rest.length && !rest[cursor].startsWith("--")) {
      values.push(rest[cursor]);
      cursor += 1;
    }
    if (!values.length) {
      options[key] = "";
      continue;
    }
    options[key] = values.join(" ");
    i = cursor - 1;
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

function describeSecretForLog(secretValue) {
  const normalized = String(secretValue || "");
  if (!normalized) return "[empty]";
  const length = Buffer.byteLength(normalized, "utf8");
  const fingerprint = crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, 12);
  return `[redacted length=${length} sha256=${fingerprint}]`;
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

function parsePositivePort(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) return null;
  return Math.floor(parsed);
}

function canPromptInteractively() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function isPortAvailable(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

async function findAvailablePort(host, startPort, maxAttempts = 40) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = startPort + offset;
    if (candidate > 65535) break;
    const available = await isPortAvailable(host, candidate);
    if (available) return candidate;
  }
  return null;
}

async function readLauncherState() {
  try {
    const raw = await fs.promises.readFile(LAUNCHER_STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return {
      launcherSecret:
        typeof parsed.launcherSecret === "string"
          ? parsed.launcherSecret.trim()
          : "",
      port: parsePositivePort(parsed.port),
    };
  } catch {
    return {};
  }
}

async function writeLauncherState(nextState) {
  const payload = {
    launcherSecret: String(nextState.launcherSecret || "").trim(),
    port: parsePositivePort(nextState.port),
  };
  await fs.promises.mkdir(LAUNCHER_STATE_DIR, { recursive: true });
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.promises.writeFile(LAUNCHER_STATE_FILE, body, { mode: 0o600 });
}

async function promptInteractiveLauncherState(params) {
  const { host, initialPort, initialSecret } = params;
  if (!canPromptInteractively()) {
    return {
      port: initialPort,
      launcherSecret: initialSecret,
      prompted: false,
    };
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let prompted = false;

  try {
    let port = parsePositivePort(initialPort);
    if (!port) {
      prompted = true;
      const suggestedPort = (await findAvailablePort(host, DEFAULT_LAUNCHER_PORT)) || DEFAULT_LAUNCHER_PORT;
      while (true) {
        const input = await rl.question(
          `Runner launcher port [${suggestedPort}]: `
        );
        const nextPort = parsePositivePort(input.trim() || String(suggestedPort));
        if (!nextPort) {
          console.log("[runner-launcher] Enter a valid port number (1-65535).");
          continue;
        }
        const available = await isPortAvailable(host, nextPort);
        if (!available) {
          console.log(
            `[runner-launcher] Port ${nextPort} is already in use. Enter another port.`
          );
          continue;
        }
        port = nextPort;
        break;
      }
    }

    let launcherSecret = String(initialSecret || "").trim();
    if (!launcherSecret) {
      prompted = true;
      while (true) {
        const input = await rl.question(
          "Runner launcher secret (x-runner-secret): "
        );
        launcherSecret = String(input || "").trim();
        if (launcherSecret) break;
        console.log("[runner-launcher] Secret is required.");
      }
    }

    return { port, launcherSecret, prompted };
  } finally {
    rl.close();
  }
}

async function resolveLauncherRuntimeConfig(options) {
  const hasOwn = (key) =>
    Object.prototype.hasOwnProperty.call(options || {}, key);
  const host = String(options.host || "127.0.0.1");
  const rawSnsValue = String(hasOwn("sns") ? options.sns : "").trim();
  if (hasOwn("sns") && !rawSnsValue) {
    throw new Error("--sns must be a valid http(s) origin");
  }
  const allowedOrigin = resolveAllowedOrigin(options);

  const rawCliPort = String(hasOwn("port") ? options.port : "").trim();
  const rawCliSecret = String(hasOwn("secret") ? options.secret : "").trim();
  if (hasOwn("port") && !rawCliPort) {
    throw new Error("--port requires a positive integer value");
  }
  if (hasOwn("secret") && !rawCliSecret) {
    throw new Error("--secret requires a non-empty value");
  }

  const saved = await readLauncherState();
  const envPort = String(process.env.RUNNER_PORT || "").trim();
  const envSecret = String(process.env.RUNNER_LAUNCHER_SECRET || "").trim();

  let port = parsePositivePort(rawCliPort) ??
    parsePositivePort(envPort) ??
    parsePositivePort(saved.port);
  let launcherSecret = String(rawCliSecret || envSecret || saved.launcherSecret || "").trim();

  if (!port || !launcherSecret) {
    if (!canPromptInteractively()) {
      if (!port) {
        port = DEFAULT_LAUNCHER_PORT;
      }
      if (!launcherSecret) {
        throw new Error(
          "RUNNER_LAUNCHER_SECRET is required. Set --secret or env RUNNER_LAUNCHER_SECRET."
        );
      }
    } else {
      const prompted = await promptInteractiveLauncherState({
        host,
        initialPort: port,
        initialSecret: launcherSecret,
      });
      port = prompted.port;
      launcherSecret = prompted.launcherSecret;
      if (prompted.prompted) {
        await writeLauncherState({ port, launcherSecret });
      }
    }
  }

  const portAvailable = await isPortAvailable(host, port);
  if (!portAvailable) {
    if (!rawCliPort && canPromptInteractively()) {
      console.log(
        `[runner-launcher] Port ${port} is already in use. Choose another port.`
      );
      const prompted = await promptInteractiveLauncherState({
        host,
        initialPort: null,
        initialSecret: launcherSecret,
      });
      port = prompted.port;
      launcherSecret = prompted.launcherSecret;
      if (prompted.prompted) {
        await writeLauncherState({ port, launcherSecret });
      }
    } else {
      throw new Error(`Port ${port} is already in use`);
    }
  }

  if (!port) {
    throw new Error("Invalid --port value");
  }
  if (!launcherSecret) {
    throw new Error("RUNNER_LAUNCHER_SECRET (or --secret) is required");
  }

  return {
    host,
    port,
    allowedOrigin,
    launcherSecret,
  };
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
      elapsedRunningMs: 0,
      llmUsageCumulative: {
        llmCallCount: 0,
        callsWithUsage: 0,
        callsWithoutUsage: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
      agentHandle: "",
      activeCommunityName: "",
      activeCommunitySlug: "",
      cumulativeThreadCreateCount: 0,
      cumulativeWrittenCommunityCount: 0,
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
}

async function startServer(options) {
  const {
    host,
    port,
    allowedOrigin,
    launcherSecret,
  } = await resolveLauncherRuntimeConfig(options);
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
          trace("runner-auth-mismatch", {
            method: request.method,
            route,
            reason:
              "input secret fingerprint vs launcher secret fingerprint mismatch",
            inputFingerprint: describeSecretForLog(incomingSecret),
            launcherFingerprint: describeSecretForLog(launcherSecret),
          });
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
    `[runner-launcher] launcher secret: ${describeSecretForLog(launcherSecret)}`
  );
  console.log(
    `[runner-launcher] instance log dir: ${resolveRunnerInstanceLogDir()}`
  );
  console.log(`[runner-launcher] full trace log: ${fullLogPath()}`);
  console.log(
    `[runner-launcher] communication log: ${communicationLogPath()}`
  );
}

function printHelp() {
  console.log(
    [
      "Local Runner Launcher CLI",
      "",
      "Commands:",
      "  serve [--host 127.0.0.1] [--port 4318] [--secret <value>] [--sns <origin>]",
      "    - Missing --port/--secret prompts interactively on TTY and stores values in ~/.tokamak-runner/launcher.json",
      "    - Non-interactive mode requires --secret or env RUNNER_LAUNCHER_SECRET",
      "",
      "Launcher API routes (serve):",
      "  GET  /health",
      "  GET  /runner/status?agentId=<id>",
      "  POST /runner/start      { config: RunnerConfig }",
      "  POST /runner/stop       { agentId?: string }",
    ].join("\n")
  );
}

async function main() {
  const { command, options } = parseArgs(process.argv);
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }
  if (command !== "serve") {
    throw new Error(`Unsupported command: ${command}`);
  }
  await startServer(options);
}

main().catch((error) => {
  console.error("[runner-launcher] fatal:", toErrorMessage(error, "Unknown error"));
  process.exit(1);
});

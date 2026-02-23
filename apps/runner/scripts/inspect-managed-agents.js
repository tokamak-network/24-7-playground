#!/usr/bin/env node

"use strict";

const http = require("node:http");

function normalizePort(raw, fallback) {
  const parsed = Number(String(raw || "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseArgs(argv) {
  const input = Array.isArray(argv) ? argv : [];
  const options = {
    host: "127.0.0.1",
    port: 4318,
    secret: "",
    agentId: "",
    json: false,
    help: false,
  };

  for (let i = 0; i < input.length; i += 1) {
    const token = String(input[i] || "").trim();
    if (!token) continue;

    if (token === "--help" || token === "-h") {
      options.help = true;
      continue;
    }
    if (token === "--json") {
      options.json = true;
      continue;
    }
    if (token === "--host") {
      options.host = String(input[i + 1] || "").trim() || options.host;
      i += 1;
      continue;
    }
    if (token.startsWith("--host=")) {
      options.host = String(token.slice("--host=".length) || "").trim() || options.host;
      continue;
    }
    if (token === "--port" || token === "-p") {
      options.port = normalizePort(input[i + 1], options.port);
      i += 1;
      continue;
    }
    if (token.startsWith("--port=")) {
      options.port = normalizePort(token.slice("--port=".length), options.port);
      continue;
    }
    if (token.startsWith("-p=")) {
      options.port = normalizePort(token.slice("-p=".length), options.port);
      continue;
    }
    if (token === "--secret" || token === "-s") {
      options.secret = String(input[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (token.startsWith("--secret=")) {
      options.secret = String(token.slice("--secret=".length) || "").trim();
      continue;
    }
    if (token.startsWith("-s=")) {
      options.secret = String(token.slice("-s=".length) || "").trim();
      continue;
    }
    if (token === "--agentId") {
      options.agentId = String(input[i + 1] || "").trim();
      i += 1;
      continue;
    }
    if (token.startsWith("--agentId=")) {
      options.agentId = String(token.slice("--agentId=".length) || "").trim();
      continue;
    }
  }

  if (!options.secret) {
    options.secret = String(process.env.RUNNER_LAUNCHER_SECRET || "").trim();
  }

  return options;
}

function printHelp() {
  console.log(
    [
      "Inspect managed agents from a running launcher (includes cumulative LLM token usage).",
      "",
      "Usage:",
      "  npm run runner:inspect -- --secret <value> [--port 4318] [--host 127.0.0.1]",
      "  npm run runner:inspect -- --secret <value> --agentId <id> --json",
      "",
      "Options:",
      "  --host <value>      Launcher host (default: 127.0.0.1)",
      "  --port, -p <value>  Launcher port (default: 4318)",
      "  --secret, -s <v>    x-runner-secret header value",
      "  --agentId <id>      Query one agent status (`/runner/status?agentId=...`)",
      "  --json              Output full JSON payload",
      "  --help, -h          Show help",
      "",
      "Tip: you can also use RUNNER_LAUNCHER_SECRET env var instead of --secret.",
    ].join("\n")
  );
}

function requestStatus(options) {
  const search = options.agentId
    ? `?agentId=${encodeURIComponent(options.agentId)}`
    : "";
  const requestPath = `/runner/status${search}`;
  const requestOptions = {
    host: options.host,
    port: options.port,
    path: requestPath,
    method: "GET",
    headers: {
      "x-runner-secret": options.secret,
    },
  };
  return new Promise((resolve, reject) => {
    const request = http.request(requestOptions, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch {
          parsed = null;
        }

        if (response.statusCode !== 200) {
          const errorMessage =
            (parsed && (parsed.error || parsed.message)) ||
            `HTTP ${response.statusCode}`;
          reject(
            new Error(
              `Status query failed (${requestOptions.host}:${requestOptions.port}${requestPath}): ${errorMessage}`
            )
          );
          return;
        }

        if (!parsed || typeof parsed !== "object") {
          reject(new Error("Status query returned invalid JSON payload"));
          return;
        }

        resolve({
          endpoint: `${requestOptions.host}:${requestOptions.port}${requestPath}`,
          payload: parsed,
        });
      });
    });

    request.on("error", (error) => {
      reject(
        new Error(
          `Unable to reach launcher at ${requestOptions.host}:${requestOptions.port}: ${String(
            error && error.message ? error.message : error
          )}`
        )
      );
    });

    request.setTimeout(10000, () => {
      request.destroy(new Error("Request timeout (10s)"));
    });

    request.end();
  });
}

function normalizeLlmUsageCumulative(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const safeInt = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.floor(parsed);
  };
  return {
    llmCallCount: safeInt(source.llmCallCount),
    callsWithUsage: safeInt(source.callsWithUsage),
    callsWithoutUsage: safeInt(source.callsWithoutUsage),
    inputTokens: safeInt(source.inputTokens),
    outputTokens: safeInt(source.outputTokens),
    totalTokens: safeInt(source.totalTokens),
  };
}

function formatInspectResult(result) {
  const payload = result && result.payload ? result.payload : {};
  const status = payload && payload.status && typeof payload.status === "object"
    ? payload.status
    : {};
  const agents = Array.isArray(status.agents) ? status.agents : [];
  const rows = agents.map((agent) => ({
    agentId: String((agent && agent.agentId) || "").trim() || "(unknown)",
    running: Boolean(agent && agent.running),
    llmUsageCumulative: normalizeLlmUsageCumulative(
      agent && agent.llmUsageCumulative
    ),
    config: (agent && agent.config) || null,
  }));
  return {
    endpoint: result.endpoint,
    runningAny: Boolean(status.runningAny),
    agentCount: Number.isFinite(status.agentCount) ? status.agentCount : rows.length,
    agents: rows,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.secret) {
    throw new Error("--secret (or RUNNER_LAUNCHER_SECRET) is required");
  }

  const result = await requestStatus(options);
  const summary = formatInspectResult(result);
  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`[runner-inspect] endpoint: ${summary.endpoint}`);
  console.log(
    `[runner-inspect] runningAny=${summary.runningAny} agentCount=${summary.agentCount}`
  );

  if (!summary.agents.length) {
    console.log("[runner-inspect] no running agents");
    return;
  }

  for (const agent of summary.agents) {
    console.log(`- agentId: ${agent.agentId}`);
    console.log(`  running: ${agent.running}`);
    console.log(
      `  llmUsageCumulative: calls=${agent.llmUsageCumulative.llmCallCount}, withUsage=${agent.llmUsageCumulative.callsWithUsage}, withoutUsage=${agent.llmUsageCumulative.callsWithoutUsage}, input=${agent.llmUsageCumulative.inputTokens}, output=${agent.llmUsageCumulative.outputTokens}, total=${agent.llmUsageCumulative.totalTokens}`
    );
    console.log("  config:");
    console.log(
      JSON.stringify(agent.config, null, 2)
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n")
    );
  }
}

main().catch((error) => {
  const message = error && error.message ? String(error.message) : "Unknown error";
  console.error(`[runner-inspect] fatal: ${message}`);
  process.exit(1);
});

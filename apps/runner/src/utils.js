const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function hmacSha256Hex(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function stripCodeFences(text) {
  if (!text) return "";
  return String(text)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractJsonPayload(text) {
  const raw = stripCodeFences(String(text || "").trim());
  if (!raw) {
    throw new Error("Empty LLM output");
  }

  const candidateStarts = ["{", "["]
    .map((token) => raw.indexOf(token))
    .filter((idx) => idx >= 0)
    .sort((a, b) => a - b);

  if (!candidateStarts.length) {
    throw new Error("No JSON object/array found in LLM output");
  }

  for (const start of candidateStarts) {
    for (let end = raw.length; end > start; end -= 1) {
      const snippet = raw.slice(start, end).trim();
      if (!snippet) continue;
      try {
        JSON.parse(snippet);
        return snippet;
      } catch {
        // keep scanning
      }
    }
  }

  throw new Error("Failed to extract valid JSON from LLM output");
}

function toErrorMessage(error, fallback) {
  const message = String(error && error.message ? error.message : "").trim();
  return message || fallback;
}

function toJsonSafe(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonSafe(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const result = {};
  for (const key of Object.keys(value)) {
    result[key] = toJsonSafe(value[key]);
  }
  return result;
}

function formatLogData(value) {
  try {
    return JSON.stringify(toJsonSafe(value), null, 2);
  } catch (error) {
    return `<<unserializable: ${toErrorMessage(error, "unknown")}>>`;
  }
}

function fullLogPath() {
  const raw = String(process.env.RUNNER_FULL_LOG_PATH || "").trim();
  if (raw) {
    return path.resolve(raw);
  }
  return path.resolve(__dirname, "..", "logs", "runner-full.log.txt");
}

function appendFullLogLine(line) {
  const targetPath = fullLogPath();
  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.appendFileSync(targetPath, `${line}\n`, "utf8");
  } catch (error) {
    const sink = console.error.bind(console);
    sink(
      `[runner][log] failed to append full log: ${toErrorMessage(
        error,
        "unknown"
      )}`
    );
  }
}

function logJson(logger, label, payload) {
  const timestamp = new Date().toISOString();
  const rendered = `${timestamp} ${label}\n${formatLogData(payload)}`;
  appendFullLogLine(rendered);
}

function logSummary(logger, text) {
  const sink =
    logger && typeof logger.log === "function" ? logger.log.bind(logger) : console.log;
  sink(`[runner] ${String(text || "").trim()}`);
}

module.exports = {
  stableStringify,
  sha256Hex,
  hmacSha256Hex,
  extractJsonPayload,
  toErrorMessage,
  toJsonSafe,
  formatLogData,
  logJson,
  logSummary,
  fullLogPath,
};

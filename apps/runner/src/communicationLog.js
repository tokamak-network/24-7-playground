const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { toErrorMessage } = require("./utils");

function communicationLogPath() {
  const raw = String(process.env.RUNNER_COMMUNICATION_LOG_PATH || "").trim();
  if (raw) {
    return path.resolve(raw);
  }
  return path.resolve(__dirname, "..", "logs", "runner-communication.log.txt");
}

function normalizeActionTypes(actionTypes) {
  if (!Array.isArray(actionTypes)) return [];
  return Array.from(
    new Set(
      actionTypes
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeDirection(direction) {
  const value = String(direction || "").trim();
  if (value === "runner_to_agent" || value === "manager_to_agent") {
    return "runner_to_agent";
  }
  return "agent_to_runner";
}

function normalizeEntry(entry) {
  return {
    id: String(entry && entry.id ? entry.id : crypto.randomUUID()),
    createdAt: String(entry && entry.createdAt ? entry.createdAt : new Date().toISOString()),
    direction: normalizeDirection(entry && entry.direction),
    actionTypes: normalizeActionTypes(entry && entry.actionTypes),
    content: String(entry && entry.content ? entry.content : ""),
  };
}

function formatDirection(direction) {
  return direction === "runner_to_agent" ? "Runner -> Agent" : "Agent -> Runner";
}

function formatEntry(entry) {
  const normalized = normalizeEntry(entry);
  const lines = [];
  lines.push("============================================================");
  lines.push(new Date(normalized.createdAt).toLocaleString());
  lines.push(formatDirection(normalized.direction));
  if (normalized.actionTypes.length > 0) {
    lines.push(`Action: ${normalized.actionTypes.join(", ")}`);
  }
  lines.push(normalized.content || "");
  lines.push("============================================================");
  return {
    normalized,
    text: lines.join("\n"),
  };
}

function appendEntryToFile(text) {
  const targetPath = communicationLogPath();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.appendFileSync(targetPath, `${text}\n`, "utf8");
}

function writeCommunicationLog(logger, entry) {
  const { normalized, text } = formatEntry(entry);
  try {
    appendEntryToFile(text);
  } catch (error) {
    const sink =
      logger && typeof logger.error === "function"
        ? logger.error.bind(logger)
        : console.error;
    sink(
      `[runner][comm-log] failed to append communication log: ${toErrorMessage(
        error,
        "unknown"
      )}`
    );
  }
  const sink =
    logger && typeof logger.log === "function" ? logger.log.bind(logger) : console.log;
  sink(text);
  return normalized;
}

module.exports = {
  writeCommunicationLog,
  communicationLogPath,
};

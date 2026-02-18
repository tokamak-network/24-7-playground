import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const MAX_SOURCE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 1200;
const MAX_STACK_LENGTH = 16000;
const MAX_PATH_LENGTH = 320;
const MAX_URL_LENGTH = 800;
const MAX_USER_AGENT_LENGTH = 400;
const MAX_WALLET_LENGTH = 64;
const MAX_IP_LENGTH = 80;
const MAX_CONTEXT_CHARS = 6000;

export type UserErrorLogPayload = {
  source: string;
  message: string;
  stack?: string | null;
  pathname?: string | null;
  url?: string | null;
  userAgent?: string | null;
  walletAddress?: string | null;
  ipAddress?: string | null;
  context?: unknown;
};

type PersistedUserErrorLog = {
  id: string;
  createdAt: string;
  source: string;
  message: string;
  stack: string | null;
  pathname: string | null;
  url: string | null;
  userAgent: string | null;
  walletAddress: string | null;
  ipAddress: string | null;
  context: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function clipSingleLine(value: unknown, max: number) {
  return asString(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function clipMultiLine(value: unknown, max: number) {
  return asString(value).trim().slice(0, max);
}

function normalizeWalletAddress(value: unknown) {
  const normalized = clipSingleLine(value, MAX_WALLET_LENGTH).toLowerCase();
  if (!normalized) return "";
  return /^0x[a-f0-9]{40}$/.test(normalized) ? normalized : normalized;
}

function normalizeContext(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }
  try {
    const serialized = JSON.stringify(value);
    if (!serialized) {
      return null;
    }
    if (serialized.length <= MAX_CONTEXT_CHARS) {
      return JSON.parse(serialized) as unknown;
    }
    return {
      truncated: true,
      preview: serialized.slice(0, MAX_CONTEXT_CHARS),
    };
  } catch {
    return {
      unstringifiable: true,
      preview: String(value).slice(0, MAX_CONTEXT_CHARS),
    };
  }
}

function resolveLogDirectory() {
  const customDir = process.env.SNS_USER_ERROR_LOG_DIR?.trim();
  if (customDir) {
    return path.resolve(customDir);
  }
  return path.join(process.cwd(), "logs");
}

function resolveLogPath(now: Date) {
  const date = now.toISOString().slice(0, 10);
  return path.join(resolveLogDirectory(), `sns-user-errors-${date}.log.ndjson`);
}

export function normalizeUserErrorLogPayload(
  input: unknown
): UserErrorLogPayload | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }
  const payload = input as Record<string, unknown>;

  const source = clipSingleLine(payload.source, MAX_SOURCE_LENGTH);
  const message = clipSingleLine(payload.message, MAX_MESSAGE_LENGTH);
  if (!source || !message) {
    return null;
  }

  const normalized: UserErrorLogPayload = {
    source,
    message,
    stack: clipMultiLine(payload.stack, MAX_STACK_LENGTH) || null,
    pathname: clipSingleLine(payload.pathname, MAX_PATH_LENGTH) || null,
    url: clipSingleLine(payload.url, MAX_URL_LENGTH) || null,
    userAgent: clipSingleLine(payload.userAgent, MAX_USER_AGENT_LENGTH) || null,
    walletAddress: normalizeWalletAddress(payload.walletAddress) || null,
    context: normalizeContext(payload.context),
  };

  return normalized;
}

export function extractClientIpFromRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first.slice(0, MAX_IP_LENGTH);
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim().slice(0, MAX_IP_LENGTH);
  }
  return "";
}

export async function appendUserErrorLog(payload: UserErrorLogPayload) {
  const now = new Date();
  const logEntry: PersistedUserErrorLog = {
    id: crypto.randomUUID(),
    createdAt: now.toISOString(),
    source: payload.source,
    message: payload.message,
    stack: payload.stack || null,
    pathname: payload.pathname || null,
    url: payload.url || null,
    userAgent: payload.userAgent || null,
    walletAddress: payload.walletAddress || null,
    ipAddress: payload.ipAddress || null,
    context: payload.context ?? null,
  };

  const logPath = resolveLogPath(now);
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(logEntry)}\n`, "utf8");

  return logEntry;
}

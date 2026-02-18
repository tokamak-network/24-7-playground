"use client";

import { loadOwnerSession } from "src/lib/ownerSessionClient";

const USER_ERROR_ENDPOINT = "/api/logs/user-errors";
const DEDUPE_WINDOW_MS = 30 * 1000;
const DEDUPE_CACHE_MAX_SIZE = 200;

const recentErrorCache = new Map<string, number>();

type ReportUserErrorInput = {
  source: string;
  message: string;
  stack?: string | null;
  context?: unknown;
};

function cleanupCache(nowMs: number) {
  for (const [key, timestamp] of recentErrorCache) {
    if (nowMs - timestamp > DEDUPE_WINDOW_MS) {
      recentErrorCache.delete(key);
    }
  }

  if (recentErrorCache.size <= DEDUPE_CACHE_MAX_SIZE) {
    return;
  }

  const entries = Array.from(recentErrorCache.entries()).sort(
    (a, b) => a[1] - b[1]
  );
  for (const [key] of entries.slice(0, recentErrorCache.size - DEDUPE_CACHE_MAX_SIZE)) {
    recentErrorCache.delete(key);
  }
}

function shouldSkipAsDuplicate(key: string) {
  const nowMs = Date.now();
  cleanupCache(nowMs);
  const previous = recentErrorCache.get(key);
  if (previous && nowMs - previous <= DEDUPE_WINDOW_MS) {
    return true;
  }
  recentErrorCache.set(key, nowMs);
  return false;
}

function toMessage(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value instanceof Error) return value.message.trim();
  return String(value ?? "").trim();
}

export function reportUserError(input: ReportUserErrorInput) {
  if (typeof window === "undefined") return;

  const source = toMessage(input.source);
  const message = toMessage(input.message);
  if (!source || !message) return;

  const pathname = window.location.pathname || "";
  const dedupeKey = `${source}|${message}|${pathname}`;
  if (shouldSkipAsDuplicate(dedupeKey)) {
    return;
  }

  const session = loadOwnerSession();
  const payload = {
    source,
    message,
    stack: toMessage(input.stack || ""),
    pathname,
    url: window.location.href || "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    walletAddress: session.walletAddress || "",
    context: input.context ?? null,
  };

  const body = JSON.stringify(payload);

  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(USER_ERROR_ENDPOINT, blob);
      if (sent) {
        return;
      }
    }
  } catch {
    // fallback to fetch
  }

  void fetch(USER_ERROR_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // keep silent: error logging must never break UX
  });
}

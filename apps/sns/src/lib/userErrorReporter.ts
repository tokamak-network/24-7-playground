"use client";

import { loadOwnerSession } from "src/lib/ownerSessionClient";

const USER_ERROR_ENDPOINT = "/api/logs/user-errors";
const DEDUPE_WINDOW_MS = 30 * 1000;
const DEDUPE_CACHE_MAX_SIZE = 200;
const LAST_ACTION_TTL_MS = 45 * 1000;
const LAST_USER_ACTION_KEY = "__SNS_LAST_USER_ACTION__";

const recentErrorCache = new Map<string, number>();
let latestUserAction: UserActionBreadcrumb | null = null;

type ReportUserErrorInput = {
  source: string;
  message: string;
  stack?: string | null;
  context?: unknown;
};

export type UserActionBreadcrumb = {
  at: string;
  eventType: string;
  pathname: string;
  url: string;
  target: {
    tag: string;
    id: string;
    name: string;
    role: string;
    text: string;
  };
};

type WindowWithUserAction = Window & {
  [LAST_USER_ACTION_KEY]?: UserActionBreadcrumb;
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

function readWindowAction() {
  if (typeof window === "undefined") return null;
  const win = window as WindowWithUserAction;
  return win[LAST_USER_ACTION_KEY] || null;
}

function writeWindowAction(value: UserActionBreadcrumb) {
  if (typeof window === "undefined") return;
  const win = window as WindowWithUserAction;
  win[LAST_USER_ACTION_KEY] = value;
}

function isActionFresh(value: UserActionBreadcrumb | null) {
  if (!value) return false;
  const atMs = new Date(String(value.at || "")).getTime();
  if (!Number.isFinite(atMs)) return false;
  return Date.now() - atMs <= LAST_ACTION_TTL_MS;
}

function readLatestUserAction() {
  const fromWindow = readWindowAction();
  if (isActionFresh(fromWindow)) {
    latestUserAction = fromWindow;
    return fromWindow;
  }
  if (isActionFresh(latestUserAction)) {
    return latestUserAction;
  }
  return null;
}

function mergeErrorContextWithAction(context: unknown, action: UserActionBreadcrumb | null) {
  if (!action) {
    return context ?? null;
  }
  if (context && typeof context === "object" && !Array.isArray(context)) {
    return {
      ...(context as Record<string, unknown>),
      lastUserAction: action,
    };
  }
  return {
    reportedContext: context ?? null,
    lastUserAction: action,
  };
}

export function recordUserActionBreadcrumb(input: Omit<UserActionBreadcrumb, "at">) {
  if (typeof window === "undefined") return;
  const payload: UserActionBreadcrumb = {
    at: new Date().toISOString(),
    eventType: toMessage(input.eventType).slice(0, 60),
    pathname: toMessage(input.pathname).slice(0, 320),
    url: toMessage(input.url).slice(0, 800),
    target: {
      tag: toMessage(input.target?.tag).toLowerCase().slice(0, 30),
      id: toMessage(input.target?.id).slice(0, 120),
      name: toMessage(input.target?.name).slice(0, 120),
      role: toMessage(input.target?.role).slice(0, 80),
      text: toMessage(input.target?.text).slice(0, 240),
    },
  };
  latestUserAction = payload;
  writeWindowAction(payload);
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
    context: mergeErrorContextWithAction(
      input.context,
      readLatestUserAction()
    ),
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

"use client";

import { useEffect } from "react";
import { reportUserError } from "src/lib/userErrorReporter";

function normalizeRejectionMessage(reason: unknown) {
  if (reason instanceof Error) {
    return {
      message: reason.message || "Unhandled promise rejection",
      stack: reason.stack || null,
      context: null as unknown,
    };
  }

  if (typeof reason === "string") {
    return {
      message: reason || "Unhandled promise rejection",
      stack: null,
      context: null as unknown,
    };
  }

  if (reason && typeof reason === "object") {
    const candidate = reason as Record<string, unknown>;
    const message =
      typeof candidate.message === "string" && candidate.message.trim()
        ? candidate.message.trim()
        : "Unhandled promise rejection";
    return {
      message,
      stack:
        typeof candidate.stack === "string" ? candidate.stack.slice(0, 16000) : null,
      context: reason,
    };
  }

  return {
    message: "Unhandled promise rejection",
    stack: null,
    context: { reasonType: typeof reason },
  };
}

export function UserErrorLogger() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const maybeError = event.error instanceof Error ? event.error : null;
      reportUserError({
        source: "window.error",
        message:
          maybeError?.message || event.message || "Unknown runtime error",
        stack: maybeError?.stack || null,
        context: {
          filename: event.filename || "",
          lineno: Number(event.lineno || 0),
          colno: Number(event.colno || 0),
        },
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const normalized = normalizeRejectionMessage(event.reason);
      reportUserError({
        source: "window.unhandledrejection",
        message: normalized.message,
        stack: normalized.stack,
        context: normalized.context,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

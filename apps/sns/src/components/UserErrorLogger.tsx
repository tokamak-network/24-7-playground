"use client";

import { useEffect } from "react";
import {
  recordUserActionBreadcrumb,
  reportUserError,
} from "src/lib/userErrorReporter";

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

function clipText(value: unknown, max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function resolveActionElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const matched = target.closest(
    "button,a,select,input,textarea,[role='button'],[data-action-id]"
  );
  if (matched instanceof HTMLElement) {
    return matched;
  }
  if (target instanceof HTMLElement) {
    return target;
  }
  return null;
}

function resolveActionText(element: HTMLElement) {
  const aria = clipText(element.getAttribute("aria-label"));
  if (aria) return aria;
  const dataAction = clipText(element.getAttribute("data-action-id"));
  if (dataAction) return dataAction;
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    const placeholder = clipText(element.getAttribute("placeholder"));
    if (placeholder) return placeholder;
  }
  return clipText(element.textContent);
}

export function UserErrorLogger() {
  useEffect(() => {
    const trackAction = (eventType: string, target: EventTarget | null) => {
      const element = resolveActionElement(target);
      if (!element) return;
      recordUserActionBreadcrumb({
        eventType,
        pathname: window.location.pathname || "",
        url: window.location.href || "",
        target: {
          tag: element.tagName.toLowerCase(),
          id: clipText(element.id, 120),
          name: clipText(element.getAttribute("name"), 120),
          role: clipText(element.getAttribute("role"), 80),
          text: resolveActionText(element),
        },
      });
    };

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

    const onClick = (event: MouseEvent) => {
      trackAction("click", event.target);
    };

    const onChange = (event: Event) => {
      trackAction("change", event.target);
    };

    const onSubmit = (event: Event) => {
      const candidate =
        event instanceof SubmitEvent
          ? event.submitter || event.target
          : event.target;
      trackAction("submit", candidate);
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("change", onChange, true);
    window.addEventListener("submit", onSubmit, true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("change", onChange, true);
      window.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}

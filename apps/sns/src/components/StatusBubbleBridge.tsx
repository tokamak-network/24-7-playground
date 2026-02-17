"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BubbleKind = "success" | "error" | "info";
type BubblePlacement = "above";

type BubbleMessage = {
  kind: BubbleKind;
  text: string;
  left: number;
  top: number;
  placement: BubblePlacement;
};

const STATUS_SELECTOR = ".status";
const CLICK_CONTEXT_WINDOW_MS = 20000;

type AnchorSnapshot = {
  element: HTMLElement | null;
  rect: {
    left: number;
    width: number;
    top: number;
    bottom: number;
  } | null;
};

function inferBubbleKind(text: string): BubbleKind {
  const value = text.toLowerCase();
  if (
    value.includes("error") ||
    value.includes("failed") ||
    value.includes("fail") ||
    value.includes("required") ||
    value.includes("not found") ||
    value.includes("invalid") ||
    value.includes("expired") ||
    value.includes("cancel")
  ) {
    return "error";
  }
  if (
    value.includes("loading") ||
    value.includes("checking") ||
    value.includes("saving") ||
    value.includes("registering") ||
    value.includes("updating") ||
    value.includes("deleting") ||
    value.includes("decrypting")
  ) {
    return "info";
  }
  return "success";
}

function normalizeStatusText(node: Element) {
  return (node.textContent || "").replace(/\s+/g, " ").trim();
}

export function StatusBubbleBridge() {
  const [bubbleMessage, setBubbleMessage] = useState<BubbleMessage | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seenStatusRef = useRef<WeakMap<Element, string>>(new WeakMap());
  const rafRef = useRef<number | null>(null);
  const lastActionRef = useRef<{ anchor: AnchorSnapshot | null; at: number }>({
    anchor: null,
    at: 0,
  });

  const pushBubble = useCallback(
    (kind: BubbleKind, text: string, anchor?: AnchorSnapshot | null) => {
      if (!text) return;
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }

      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : 1200;
      const defaultLeft = Math.max(120, viewportWidth - 220);
      const defaultTop = 96;

      let left = defaultLeft;
      let top = defaultTop;
      const placement: BubblePlacement = "above";

      if (anchor && typeof window !== "undefined") {
        const rect =
          anchor.element && anchor.element.isConnected
            ? anchor.element.getBoundingClientRect()
            : anchor.rect;
        if (rect) {
          const nextLeft = rect.left + rect.width / 2;
          left = Math.min(Math.max(nextLeft, 80), viewportWidth - 80);
          top = rect.top;
        }
      }

      setBubbleMessage({ kind, text, left, top, placement });
      bubbleTimerRef.current = setTimeout(() => {
        setBubbleMessage(null);
      }, 3200);
    },
    []
  );

  const processStatusNodes = useCallback(() => {
    if (typeof document === "undefined") return;
    const nodes = Array.from(document.querySelectorAll(STATUS_SELECTOR));
    for (const node of nodes) {
      const nextText = normalizeStatusText(node);
      const prevText = seenStatusRef.current.get(node);
      if (prevText === nextText) continue;
      seenStatusRef.current.set(node, nextText);
      if (!nextText) continue;

      const ageMs = Date.now() - lastActionRef.current.at;
      if (ageMs > CLICK_CONTEXT_WINDOW_MS || !lastActionRef.current.anchor) {
        continue;
      }
      pushBubble(
        inferBubbleKind(nextText),
        nextText,
        lastActionRef.current.anchor
      );
    }
  }, [pushBubble]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const clickable = target?.closest("button, [role='button']");
      if (!clickable) return;
      const anchorElement = clickable as HTMLElement;
      const rect = anchorElement.getBoundingClientRect();
      lastActionRef.current = {
        anchor: {
          element: anchorElement,
          rect: {
            left: rect.left,
            width: rect.width,
            top: rect.top,
            bottom: rect.bottom,
          },
        },
        at: Date.now(),
      };
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll(STATUS_SELECTOR));
    for (const node of nodes) {
      seenStatusRef.current.set(node, normalizeStatusText(node));
    }

    const scheduleProcess = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        processStatusNodes();
      });
    };

    const observer = new MutationObserver(scheduleProcess);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [processStatusNodes]);

  useEffect(() => {
    return () => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
    };
  }, []);

  if (!bubbleMessage) return null;

  return (
    <div
      className={`floating-status-bubble floating-status-bubble-${bubbleMessage.kind} floating-status-bubble-${bubbleMessage.placement}`}
      style={{
        left: `${bubbleMessage.left}px`,
        top: `${bubbleMessage.top}px`,
      }}
      role="status"
      aria-live="polite"
    >
      {bubbleMessage.text}
    </div>
  );
}

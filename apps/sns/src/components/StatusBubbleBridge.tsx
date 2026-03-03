"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { reportUserError } from "src/lib/userErrorReporter";

type BubbleKind = "success" | "error" | "info";
type BubblePlacement = "above" | "below";

type BubbleMessage = {
  kind: BubbleKind;
  text: string;
  left: number;
  top: number;
  placement: BubblePlacement;
};

const STATUS_SELECTOR = ".status";
const CLICK_CONTEXT_WINDOW_MS = 120000;
const BUBBLE_DISMISS_DELAY_MS = 3200;
const BUBBLE_HORIZONTAL_MARGIN = 80;
const BUBBLE_ESTIMATED_HEIGHT = 72;
const BUBBLE_VERTICAL_OFFSET = 10;
const BUBBLE_BOUNDARY_PADDING = 16;

type AnchorSnapshot = {
  element: HTMLElement | null;
  rect: {
    left: number;
    width: number;
    top: number;
    bottom: number;
  } | null;
};

function normalizeExplicitKind(raw: string | undefined): BubbleKind | null {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "error" || value === "success" || value === "info") {
    return value;
  }
  return null;
}

function inferBubbleKind(text: string, node: Element, errorOnlyMode: boolean): BubbleKind {
  const explicitKind =
    normalizeExplicitKind((node as HTMLElement).dataset.statusKind) ||
    normalizeExplicitKind(
      (node.closest("[data-status-kind]") as HTMLElement | null)?.dataset.statusKind
    );
  if (explicitKind) {
    return explicitKind;
  }

  const value = text.toLowerCase();
  const infoPatterns = [
    "loading",
    "checking",
    "saving",
    "registering",
    "updating",
    "deleting",
    "decrypting",
    "preparing",
    "fetching",
    "submitting",
    "connecting",
    "status options are open",
  ];
  if (infoPatterns.some((pattern) => value.includes(pattern))) {
    return "info";
  }

  const successPatterns = [
    "successful",
    "updated.",
    "opened.",
    "loaded.",
    "saved.",
    "deleted.",
    "unregistered.",
    "registered.",
    "agent banned.",
    "ban removed.",
    "community closed.",
    "deletion scheduled.",
    "signature generated.",
  ];
  if (successPatterns.some((pattern) => value.includes(pattern))) {
    return "success";
  }

  if (
    value.includes("error") ||
    value.includes("failed") ||
    value.includes("fail") ||
    value.includes("required") ||
    value.includes("not found") ||
    value.includes("invalid") ||
    value.includes("expired") ||
    value.includes("cancel") ||
    value.includes("metamask not detected") ||
    value.includes("connect wallet first") ||
    value.includes("select a ") ||
    value.includes("no wallet selected") ||
    value.includes("no active communities") ||
    value.includes("could not be loaded") ||
    value.includes("community is closed") ||
    value.includes("only the community owner") ||
    value.includes("already belong to different communities") ||
    value.includes("already registered") ||
    value.includes("can create at most") ||
    value.includes("requires at least") ||
    value.includes("permission is required") ||
    value.includes("did not match") ||
    value.includes("check update first") ||
    value.includes("no applicable update")
  ) {
    return "error";
  }

  if (errorOnlyMode) {
    return "error";
  }

  return "info";
}

function normalizeStatusText(node: Element) {
  return (node.textContent || "").replace(/\s+/g, " ").trim();
}

export function StatusBubbleBridge() {
  const [portalReady, setPortalReady] = useState(false);
  const [bubbleMessage, setBubbleMessage] = useState<BubbleMessage | null>(null);
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleAnchorElementRef = useRef<HTMLElement | null>(null);
  const seenStatusRef = useRef<WeakMap<Element, string>>(new WeakMap());
  const rafRef = useRef<number | null>(null);
  const lastActionRef = useRef<{ anchor: AnchorSnapshot | null; at: number }>({
    anchor: null,
    at: 0,
  });

  useEffect(() => {
    setPortalReady(true);
    return () => {
      setPortalReady(false);
    };
  }, []);

  const scheduleBubbleDismiss = useCallback(() => {
    if (bubbleTimerRef.current) {
      clearTimeout(bubbleTimerRef.current);
    }
    bubbleTimerRef.current = setTimeout(() => {
      bubbleAnchorElementRef.current = null;
      setBubbleMessage(null);
    }, BUBBLE_DISMISS_DELAY_MS);
  }, []);

  const pushBubble = useCallback(
    (kind: BubbleKind, text: string, anchor?: AnchorSnapshot | null) => {
      if (!text) return;

      const viewportWidth =
        typeof window !== "undefined" ? window.innerWidth : 1200;
      const defaultLeft = Math.max(120, viewportWidth - 220);
      const defaultTop = 96;

      let left = defaultLeft;
      let top = defaultTop;
      let placement: BubblePlacement = "above";

      bubbleAnchorElementRef.current = null;
      if (anchor && typeof window !== "undefined") {
        bubbleAnchorElementRef.current =
          anchor.element && anchor.element.isConnected ? anchor.element : null;
        const rect =
          anchor.element && anchor.element.isConnected
            ? anchor.element.getBoundingClientRect()
            : anchor.rect;
        if (rect) {
          const nextLeft = rect.left + rect.width / 2;
          const modalShell = anchor.element?.closest(
            ".community-create-modal-shell, .agent-author-modal-shell, .agent-author-modal"
          ) as HTMLElement | null;
          const boundaryRect = modalShell?.getBoundingClientRect() || null;
          const requiredSpace = BUBBLE_ESTIMATED_HEIGHT + BUBBLE_VERTICAL_OFFSET;

          if (boundaryRect) {
            const boundaryMinLeft = Math.max(
              boundaryRect.left + BUBBLE_BOUNDARY_PADDING,
              BUBBLE_HORIZONTAL_MARGIN
            );
            const boundaryMaxLeft = Math.min(
              boundaryRect.right - BUBBLE_BOUNDARY_PADDING,
              viewportWidth - BUBBLE_HORIZONTAL_MARGIN
            );
            if (boundaryMinLeft <= boundaryMaxLeft) {
              left = Math.min(Math.max(nextLeft, boundaryMinLeft), boundaryMaxLeft);
            } else {
              left = Math.min(
                Math.max((boundaryRect.left + boundaryRect.right) / 2, BUBBLE_HORIZONTAL_MARGIN),
                viewportWidth - BUBBLE_HORIZONTAL_MARGIN
              );
            }

            const spaceAbove = rect.top - boundaryRect.top;
            const spaceBelow = boundaryRect.bottom - rect.bottom;
            if (spaceAbove < requiredSpace && spaceBelow > spaceAbove) {
              placement = "below";
              top = rect.bottom;
            } else {
              placement = "above";
              top = rect.top;
            }

            if (placement === "above" && spaceAbove < requiredSpace) {
              top = boundaryRect.top + requiredSpace;
            }
            if (placement === "below" && spaceBelow < requiredSpace) {
              top = boundaryRect.bottom - requiredSpace;
            }
          } else {
            left = Math.min(
              Math.max(nextLeft, BUBBLE_HORIZONTAL_MARGIN),
              viewportWidth - BUBBLE_HORIZONTAL_MARGIN
            );
            const viewportHeight =
              typeof window !== "undefined" ? window.innerHeight : 900;
            const spaceAbove = rect.top;
            const spaceBelow = viewportHeight - rect.bottom;
            if (spaceAbove < requiredSpace && spaceBelow > spaceAbove) {
              placement = "below";
              top = rect.bottom;
            } else {
              placement = "above";
              top = rect.top;
            }
          }
        }
      }

      setBubbleMessage({ kind, text, left, top, placement });
      scheduleBubbleDismiss();
    },
    [scheduleBubbleDismiss]
  );

  const resetBubbleDismissCountdown = useCallback(() => {
    if (!bubbleMessage) return;
    scheduleBubbleDismiss();
  }, [bubbleMessage, scheduleBubbleDismiss]);

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
      const errorOnlyMode = Boolean(
        node.closest("[data-status-bubble='error-only']")
      );
      const bubbleKind = inferBubbleKind(nextText, node, errorOnlyMode);
      if (errorOnlyMode && bubbleKind !== "error") {
        continue;
      }
      if (bubbleKind === "error") {
        reportUserError({
          source: "status-bubble",
          message: nextText,
        });
      }
      pushBubble(
        bubbleKind,
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
    if (!bubbleMessage) return;

    const isWithin = (target: EventTarget | null, container: HTMLElement) => {
      return target instanceof Node && (target === container || container.contains(target));
    };

    const onMouseOver = (event: MouseEvent) => {
      const anchorElement = bubbleAnchorElementRef.current;
      if (!anchorElement) return;
      const enteredAnchor =
        isWithin(event.target, anchorElement) &&
        !isWithin(event.relatedTarget, anchorElement);
      if (!enteredAnchor) return;
      resetBubbleDismissCountdown();
    };

    document.addEventListener("mouseover", onMouseOver, true);
    return () => {
      document.removeEventListener("mouseover", onMouseOver, true);
    };
  }, [bubbleMessage, resetBubbleDismissCountdown]);

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

  if (!portalReady || !bubbleMessage) return null;

  const bubbleNode = (
    <div
      className={`floating-status-bubble floating-status-bubble-${bubbleMessage.kind} floating-status-bubble-${bubbleMessage.placement}`}
      style={{
        left: `${bubbleMessage.left}px`,
        top: `${bubbleMessage.top}px`,
      }}
      role="status"
      aria-live="polite"
      onMouseEnter={resetBubbleDismissCountdown}
    >
      {bubbleMessage.text}
    </div>
  );

  return createPortal(bubbleNode, document.body);
}

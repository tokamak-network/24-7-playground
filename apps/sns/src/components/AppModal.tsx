"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type AppModalPhase = "closed" | "opening" | "open" | "closing";

type AppModalProps = {
  open: boolean;
  phase: AppModalPhase;
  title: ReactNode;
  ariaLabel: string;
  closeAriaLabel: string;
  onClose: () => void;
  className?: string;
  shellClassName?: string;
  headClassName?: string;
  bodyClassName?: string;
  shellStyle?: CSSProperties;
  bodyStatusBubble?: string;
  dataTour?: string;
  children: ReactNode;
};

type DragState = {
  startClientX: number;
  startClientY: number;
  startLeft: number;
  startTop: number;
  baseOffsetX: number;
  baseOffsetY: number;
  width: number;
  height: number;
};

export function AppModal({
  open,
  phase,
  title,
  ariaLabel,
  closeAriaLabel,
  onClose,
  className = "",
  shellClassName = "",
  headClassName = "",
  bodyClassName = "",
  shellStyle,
  bodyStatusBubble,
  dataTour,
  children,
}: AppModalProps) {
  const [portalReady, setPortalReady] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const shellRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPortalReady(true);
    return () => {
      setPortalReady(false);
    };
  }, []);

  useEffect(() => {
    if (open) return;
    setDragOffset({ x: 0, y: 0 });
    setDragging(false);
    dragStateRef.current = null;
  }, [open]);

  useEffect(() => {
    if (!dragging) return;

    const onPointerMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const dx = event.clientX - state.startClientX;
      const dy = event.clientY - state.startClientY;
      const minVisibleWidth = Math.min(180, state.width);
      const minVisibleHeight = Math.min(56, state.height);
      const minLeft = -state.width + minVisibleWidth;
      const maxLeft = window.innerWidth - minVisibleWidth;
      const minTop = 0;
      const maxTop = window.innerHeight - minVisibleHeight;
      const nextLeft = Math.min(maxLeft, Math.max(minLeft, state.startLeft + dx));
      const nextTop = Math.min(maxTop, Math.max(minTop, state.startTop + dy));

      setDragOffset({
        x: state.baseOffsetX + (nextLeft - state.startLeft),
        y: state.baseOffsetY + (nextTop - state.startTop),
      });
    };

    const stopDragging = () => {
      dragStateRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [dragging]);

  const startDragging = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-modal-close-button]")) return;
      const shell = shellRef.current;
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      dragStateRef.current = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        baseOffsetX: dragOffset.x,
        baseOffsetY: dragOffset.y,
        width: rect.width,
        height: rect.height,
      };
      setDragging(true);
      event.preventDefault();
    },
    [dragOffset.x, dragOffset.y]
  );

  const modalClassName = `community-create-modal${phase === "open" ? " is-open" : ""}${
    className ? ` ${className}` : ""
  }`;
  const shellClassNames = `community-create-modal-shell${shellClassName ? ` ${shellClassName}` : ""}`;
  const headClassNames = `community-create-modal-head${headClassName ? ` ${headClassName}` : ""}${
    dragging ? " is-dragging" : ""
  }`;
  const bodyClassNames = `community-create-modal-body${bodyClassName ? ` ${bodyClassName}` : ""}`;
  const mergedShellStyle = useMemo(
    () =>
      ({
        ...(shellStyle || {}),
        ["--modal-drag-x" as any]: `${dragOffset.x}px`,
        ["--modal-drag-y" as any]: `${dragOffset.y}px`,
      }) as CSSProperties,
    [shellStyle, dragOffset.x, dragOffset.y]
  );

  if (!open || !portalReady) return null;

  return createPortal(
    <div
      className={modalClassName}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      data-tour={dataTour}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="community-create-modal-backdrop"
        aria-label={closeAriaLabel}
        onClick={onClose}
      />
      <section
        ref={shellRef}
        className={shellClassNames}
        style={mergedShellStyle}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={headClassNames} onPointerDown={startDragging}>
          <h3>{title}</h3>
          <button
            type="button"
            className="community-create-modal-close"
            onClick={onClose}
            aria-label={closeAriaLabel}
            data-modal-close-button
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className={bodyClassNames} data-status-bubble={bodyStatusBubble}>
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}

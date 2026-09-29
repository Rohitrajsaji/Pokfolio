"use client";

import { useId, useRef, type ReactNode } from "react";
import { useGame } from "../state/store";
import { useMenuNavigation } from "./useMenuNavigation";

/**
 * The frame every content screen shares: a coloured title bar, a close
 * button, and a scrolling body. It covers the game screen on wide displays
 * and the whole viewport on phones.
 */
export function ScreenFrame({
  title,
  accent = "#d94b4b",
  initial,
  onSelect,
  children,
}: {
  title: string;
  accent?: string;
  /** Which `[data-nav]` item the cursor starts on. */
  initial?: number;
  /** Called whenever the cursor lands on a `[data-nav]` item. */
  onSelect?: (item: HTMLElement) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = () => useGame.getState().closeOverlay();
  useMenuNavigation(ref, { onBack: close, initial, onSelect });

  return (
    <div
      ref={ref}
      className="screen-frame"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="screen-header" style={{ background: accent }}>
        <h2 id={titleId} className="screen-title">
          {title}
        </h2>
        <button type="button" className="screen-close" onClick={close} aria-label="Close">
          ✕
        </button>
      </header>
      <div className="screen-body">{children}</div>
    </div>
  );
}

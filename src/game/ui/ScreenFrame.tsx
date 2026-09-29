"use client";

import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { sound } from "../audio/sound";
import type { Action } from "../engine/input";
import { useGame } from "../state/store";
import { PixelScroll } from "./PixelScroll";
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
  onKey,
  fit = false,
  children,
}: {
  title: string;
  accent?: string;
  /** Which `[data-nav]` item the cursor starts on. */
  initial?: number;
  /** Called whenever the cursor lands on a `[data-nav]` item. */
  onSelect?: (item: HTMLElement) => void;
  /** First say on any game button; return true to handle it. */
  onKey?: (action: Action) => boolean | void;
  /** The content is laid out to fill the frame exactly (with `Paged` where it's long), so nothing scrolls. */
  fit?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = () => {
    sound.sfx("back");
    useGame.getState().closeOverlay();
  };
  useMenuNavigation(ref, { onBack: close, initial, onSelect, onKey });

  // A screen with nothing to pick still takes the keyboard's focus, on its close button.
  useEffect(() => {
    const frame = ref.current;
    if (frame && !frame.querySelector("[data-nav]:not([data-measure] *)")) {
      frame.querySelector<HTMLElement>(".screen-close")?.focus({ preventScroll: true });
    }
  }, []);

  return (
    <div
      ref={ref}
      className="screen-frame"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{ "--accent": accent } as CSSProperties}
    >
      <header className="screen-header">
        <h2 id={titleId} className="screen-title">
          {title}
        </h2>
        <button type="button" className="screen-close" onClick={close} aria-label="Close">
          <span className="icon icon-close" aria-hidden />
        </button>
      </header>
      {fit ? (
        <div className="screen-fit">{children}</div>
      ) : (
        <PixelScroll className="screen-scroll">{children}</PixelScroll>
      )}
    </div>
  );
}

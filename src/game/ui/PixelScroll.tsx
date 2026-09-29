"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

interface Thumb {
  top: number;
  height: number;
}

/** CSS pixels in one game pixel, read from the game's `--px`. */
function gamePixel(el: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(el).getPropertyValue("--px")) || 1;
}

/**
 * A scrolling area with a pixel-art scrollbar instead of the browser's own.
 * Wheel, touch and keys still scroll it; the bar shows where you are and can
 * be dragged. The thumb moves in whole game pixels.
 */
export function PixelScroll({ children, className }: { children: ReactNode; className?: string }) {
  const body = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);

  useEffect(() => {
    const el = body.current;
    const inner = content.current;
    if (!el || !inner) return;
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight + 1) return setThumb(null);
      const unit = gamePixel(el);
      const height = Math.max(
        8 * unit,
        Math.round((clientHeight * (clientHeight / scrollHeight)) / unit) * unit,
      );
      const travel = clientHeight - height;
      const top = Math.round(((scrollTop / (scrollHeight - clientHeight)) * travel) / unit) * unit;
      setThumb((last) =>
        last && last.top === top && last.height === height ? last : { top, height },
      );
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    // The content changes size when a tab or an entry changes.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(el);
    observer?.observe(inner);
    return () => {
      el.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, []);

  // The thumb captures the pointer, so moves, releases and cancels all arrive on it and
  // nothing is left listening on the window if the scrollbar goes away mid-drag.
  const grab = useRef<{ startY: number; startScroll: number; ratio: number } | null>(null);
  const press = (event: PointerEvent<HTMLDivElement>) => {
    const el = body.current;
    if (!el || !thumb) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    grab.current = {
      startY: event.clientY,
      startScroll: el.scrollTop,
      ratio: (el.scrollHeight - el.clientHeight) / (el.clientHeight - thumb.height),
    };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const el = body.current;
    const g = grab.current;
    if (el && g) el.scrollTop = g.startScroll + (event.clientY - g.startY) * g.ratio;
  };
  const release = () => {
    grab.current = null;
  };

  return (
    <div className={className ? `px-scroll ${className}` : "px-scroll"}>
      <div ref={body} className="px-scroll-body">
        <div ref={content} className="px-scroll-content">
          {children}
        </div>
      </div>
      {thumb && (
        <div className="px-scroll-track" aria-hidden>
          <div
            className="px-scroll-thumb"
            style={{ top: thumb.top, height: thumb.height }}
            onPointerDown={press}
            onPointerMove={move}
            onPointerUp={release}
            onPointerCancel={release}
          />
        </div>
      )}
    </div>
  );
}

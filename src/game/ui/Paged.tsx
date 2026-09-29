"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { sound } from "../audio/sound";
import { pageStarts, pagesOf } from "./paginate";

/** Height of the PREV / NEXT bar, in game pixels. */
const BAR = 16;

const same = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

/**
 * Shows blocks a page at a time instead of scrolling: it measures the room it has, breaks the blocks into
 * pages that each fit (never in the middle of a block), and adds PREV and NEXT when there's more than one.
 * It fills whatever height its parent gives it, so put it in something with a definite height.
 */
export function Paged({
  blocks,
  label = "Pages",
  wrap = false,
}: {
  blocks: ReactNode[];
  label?: string;
  /** Lay the blocks out in rows that wrap, instead of one under another. */
  wrap?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLDivElement>(null);
  const [starts, setStarts] = useState<number[]>([0]);
  const [page, setPage] = useState(0);

  const layout = useCallback(() => {
    const room = root.current;
    const copy = measure.current;
    if (!room || !copy) return;
    const unit = Number.parseFloat(getComputedStyle(room).getPropertyValue("--px")) || 1;
    const measured = [...copy.children].map((el) => ({
      top: (el as HTMLElement).offsetTop,
      height: (el as HTMLElement).offsetHeight,
    }));
    let next = pageStarts(measured, room.clientHeight);
    // More than one page needs room for the bar as well.
    if (next.length > 1) next = pageStarts(measured, room.clientHeight - BAR * unit);
    setStarts((last) => (same(last, next) ? last : next));
  }, []);

  useLayoutEffect(layout, [layout, blocks.length]);
  useEffect(() => {
    const room = root.current;
    const copy = measure.current;
    if (!room || !copy || typeof ResizeObserver === "undefined") return;
    // The room changes with the window, and the blocks with their pictures and fonts arriving.
    const observer = new ResizeObserver(layout);
    observer.observe(room);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [layout]);

  const pages = pagesOf(blocks.length, starts);
  const current = Math.min(page, pages.length - 1);
  const turn = (by: number) => {
    sound.sfx("text");
    setPage((current + by + pages.length) % pages.length);
  };

  return (
    <div ref={root} className="paged">
      <div className={wrap ? "paged-page paged-wrap" : "paged-page"}>
        {pages[current].map((i) => (
          <div key={i} className="paged-block">
            {blocks[i]}
          </div>
        ))}
      </div>
      {pages.length > 1 && (
        <div className="paged-bar" role="group" aria-label={label}>
          <button type="button" data-nav className="screen-button" onClick={() => turn(-1)}>
            PREV
          </button>
          <span className="paged-count" role="status">
            {current + 1}/{pages.length}
          </span>
          <button type="button" data-nav className="screen-button" onClick={() => turn(1)}>
            NEXT
          </button>
        </div>
      )}
      {/* The same blocks laid out all at once and out of sight, to measure where the pages break. */}
      <div
        ref={measure}
        className={wrap ? "paged-page paged-wrap paged-measure" : "paged-page paged-measure"}
        data-measure
        aria-hidden
        inert
      >
        {blocks.map((block, i) => (
          <div key={i} className="paged-block">
            {block}
          </div>
        ))}
      </div>
    </div>
  );
}

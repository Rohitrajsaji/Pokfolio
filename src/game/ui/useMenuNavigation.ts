import { useEffect, useRef, type RefObject } from "react";
import { sound } from "../audio/sound";
import type { Action } from "../engine/input";
import { useInputLayer } from "./useInputLayer";

export interface MenuNavigationOptions {
  onBack: () => void;
  /** Which `[data-nav]` item the cursor starts on. */
  initial?: number;
  /** Called whenever the cursor lands on an item, however it got there. */
  onSelect?: (item: HTMLElement) => void;
  /** Items per row, for grids: up and down then move a whole row. */
  columns?: number;
  /** First say on any button; return true to handle it and skip the usual navigation. */
  onKey?: (action: Action) => boolean | void;
}

/** Moves the cursor to `item`, scrolling it into view unless `scroll` is false. */
function select(
  root: HTMLElement,
  item: HTMLElement,
  onSelect?: (item: HTMLElement) => void,
  scroll = true,
): void {
  for (const other of root.querySelectorAll("[data-current]")) {
    if (other !== item) other.removeAttribute("data-current");
  }
  item.setAttribute("data-current", "");
  if (document.activeElement !== item) item.focus({ preventScroll: !scroll });
  onSelect?.(item);
}

/**
 * Game-button navigation for a menu or screen: directions move the cursor
 * between its `[data-nav]` items, A picks the current one, and B, Esc or
 * START backs out. Mouse, touch and Tab keep working as normal.
 *
 * The cursor is a `data-current` attribute, not just focus: `:focus` stops
 * showing whenever the window itself loses focus, and the cursor must not vanish.
 */
export function useMenuNavigation(
  ref: RefObject<HTMLElement | null>,
  { onBack, initial = 0, onSelect, columns = 1, onKey }: MenuNavigationOptions,
): void {
  const start = useRef(initial);
  const latestOnSelect = useRef(onSelect);
  const latestOnKey = useRef(onKey);
  useEffect(() => {
    latestOnSelect.current = onSelect;
    latestOnKey.current = onKey;
  });

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-nav]");
    // A screen opens at its top, even when the first thing to pick is further down.
    if (items.length > 0) {
      select(root, items[Math.min(start.current, items.length - 1)], latestOnSelect.current, false);
    }
    // Tab and mouse hover move the cursor too.
    const follow = (event: FocusEvent) => {
      const item = (event.target as HTMLElement).closest<HTMLElement>("[data-nav]");
      if (item && root.contains(item) && !item.hasAttribute("data-current")) {
        select(root, item, latestOnSelect.current);
      }
    };
    // Picking an item, by button, click or tap, makes the confirm blip.
    const confirm = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest("[data-nav]")) sound.sfx("confirm");
    };
    root.addEventListener("focusin", follow);
    root.addEventListener("click", confirm);
    return () => {
      root.removeEventListener("focusin", follow);
      root.removeEventListener("click", confirm);
    };
  }, [ref]);

  useInputLayer((action: Action) => {
    if (latestOnKey.current?.(action)) return;
    if (action === "b" || action === "escape" || action === "start") return onBack();
    const root = ref.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>("[data-nav]")];
    if (items.length === 0) return;
    const at = items.findIndex((item) => item.hasAttribute("data-current"));
    if (action === "a") return (items[at] ?? items[0]).click();
    const step =
      action === "left"
        ? -1
        : action === "right"
          ? 1
          : action === "up"
            ? -columns
            : action === "down"
              ? columns
              : 0;
    if (step === 0) return;
    const next = items[at === -1 ? 0 : (at + step + items.length) % items.length];
    select(root, next, latestOnSelect.current);
    sound.sfx("cursor");
  });
}

/**
 * Keyboard controls. Arrows or WASD move; Z, Enter or Space is A; X or
 * Backspace is B; M opens the menu; Esc opens the menu or backs out; Shift runs.
 */
import type { Action, InputHub } from "./input";

const KEYS: Readonly<Record<string, Action>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  KeyZ: "a",
  Enter: "a",
  Space: "a",
  KeyX: "b",
  Backspace: "b",
  KeyM: "start",
  Escape: "escape",
  ShiftLeft: "run",
  ShiftRight: "run",
};

function isTyping(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

/** Buttons and links activate themselves on Enter and Space; don't also send A. */
function activatesNatively(el: Element | null, code: string): boolean {
  if (!el || (code !== "Enter" && code !== "Space")) return false;
  return el.tagName === "BUTTON" || el.tagName === "A" || el.getAttribute("role") === "button";
}

export function bindKeyboard(target: Window, hub: InputHub): () => void {
  const onDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const action = KEYS[event.code];
    if (!action) return;
    const el = document.activeElement;
    if (isTyping(el) && event.code !== "Escape") return;
    if (activatesNatively(el, event.code)) return;
    event.preventDefault();
    hub.press(action);
  };
  const onUp = (event: KeyboardEvent) => {
    const action = KEYS[event.code];
    if (action) hub.release(action);
  };
  const onBlur = () => hub.releaseAll();

  target.addEventListener("keydown", onDown);
  target.addEventListener("keyup", onUp);
  target.addEventListener("blur", onBlur);
  return () => {
    target.removeEventListener("keydown", onDown);
    target.removeEventListener("keyup", onUp);
    target.removeEventListener("blur", onBlur);
  };
}

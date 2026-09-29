/**
 * Remembers the visitor's settings in their browser. Only settings are kept;
 * game progress is deliberately not saved. Storage can be unavailable
 * (private windows, blocked cookies), so every access is guarded.
 */
import type { Settings } from "./store";

const KEY = "rohit-portfolio:settings";

const ALLOWED = {
  textSpeed: ["slow", "normal", "fast", "instant"],
  time: ["auto", "morning", "day", "evening", "night"],
} as const;

/** Only well-formed values survive; anything else falls back to the defaults. */
export function sanitizeSettings(value: unknown): Partial<Settings> {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const out: Partial<Settings> = {};
  if ((ALLOWED.textSpeed as readonly unknown[]).includes(raw.textSpeed)) {
    out.textSpeed = raw.textSpeed as Settings["textSpeed"];
  }
  if ((ALLOWED.time as readonly unknown[]).includes(raw.time)) {
    out.time = raw.time as Settings["time"];
  }
  if (typeof raw.sound === "boolean") out.sound = raw.sound;
  return out;
}

export function loadSettings(): Partial<Settings> {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored ? sanitizeSettings(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Settings just won't be remembered next time.
  }
}

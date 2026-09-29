import { useSyncExternalStore } from "react";

/** Whether this browser lets a page go full-screen (iPhones don't; iPads and computers do). */
export function canFullscreen(): boolean {
  return typeof document !== "undefined" && Boolean(document.fullscreenEnabled);
}

/** Goes full-screen, or comes back out. Browsers can refuse; then nothing happens. */
export async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Refused, or not allowed right now.
  }
}

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

/** Whether full-screen is possible here, and whether the page is in it now. */
export function useFullscreen(): { available: boolean; on: boolean } {
  const available = useSyncExternalStore(
    () => () => {},
    canFullscreen,
    () => false,
  );
  const on = useSyncExternalStore(
    subscribe,
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  return { available, on };
}

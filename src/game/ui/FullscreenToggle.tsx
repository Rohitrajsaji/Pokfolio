"use client";

import { sound } from "../audio/sound";
import { toggleFullscreen, useFullscreen } from "../fullscreen";

/** Hides the browser's own bars. Not shown where the browser can't do that. */
export function FullscreenToggle() {
  const { available, on } = useFullscreen();
  if (!available) return null;
  return (
    <button
      type="button"
      className="fullscreen-toggle"
      aria-pressed={on}
      onClick={() => {
        sound.sfx("confirm");
        void toggleFullscreen();
      }}
    >
      FULLSCREEN
    </button>
  );
}

"use client";

import { sound } from "../audio/sound";
import { useGame } from "../state/store";

/** Sound starts off. This turns it on or off without opening the menu. */
export function SoundToggle() {
  const on = useGame((state) => state.settings.sound);
  const toggle = () => {
    useGame.getState().updateSettings({ sound: !on });
    if (!on) sound.sfx("confirm");
  };
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-label="Sound"
      aria-pressed={on}
      onClick={toggle}
    >
      <span aria-hidden>♪</span> SOUND {on ? "ON" : "OFF"}
    </button>
  );
}

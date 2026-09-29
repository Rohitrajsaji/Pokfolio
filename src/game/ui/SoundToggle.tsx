"use client";

import { sound } from "../audio/sound";
import { useGame } from "../state/store";

/**
 * Sound starts off. This turns it on or off without opening the menu. The button's name
 * is its visible text, which says what sound is doing now.
 */
export function SoundToggle() {
  const on = useGame((state) => state.settings.sound);
  const toggle = () => {
    useGame.getState().updateSettings({ sound: !on });
    if (!on) sound.sfx("confirm");
  };
  return (
    <button type="button" className="sound-toggle" data-on={on ? "" : undefined} onClick={toggle}>
      SOUND {on ? "ON" : "OFF"}
    </button>
  );
}

"use client";

import { sound } from "../../audio/sound";
import { toggleFullscreen, useFullscreen } from "../../fullscreen";
import { useGame } from "../../state/store";
import { ScreenFrame } from "../ScreenFrame";

function Choice<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onPick: (value: T) => void;
}) {
  return (
    <fieldset className="option-row">
      <legend>{label}</legend>
      <div className="option-choices">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            data-nav
            aria-pressed={value === option}
            className="option-choice"
            onClick={() => onPick(option)}
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const TEXT_SPEEDS = ["slow", "normal", "fast", "instant"] as const;
const TIMES = ["auto", "morning", "day", "evening", "night"] as const;
const SOUND = ["off", "on"] as const;

export function OptionsScreen() {
  const settings = useGame((state) => state.settings);
  const update = useGame((state) => state.updateSettings);
  const screen = useFullscreen();
  return (
    <ScreenFrame title="OPTIONS" accent="#5a6bc4">
      <Choice
        label="TEXT SPEED"
        value={settings.textSpeed}
        options={TEXT_SPEEDS}
        onPick={(textSpeed) => update({ textSpeed })}
      />
      <Choice
        label="TIME OF DAY"
        value={settings.time}
        options={TIMES}
        onPick={(time) => update({ time })}
      />
      <Choice
        label="SOUND"
        value={settings.sound ? "on" : "off"}
        options={SOUND}
        onPick={(choice) => {
          update({ sound: choice === "on" });
          if (choice === "on" && !settings.sound) sound.sfx("confirm");
        }}
      />
      {screen.available && (
        <Choice
          label="FULLSCREEN"
          value={screen.on ? "on" : "off"}
          options={SOUND}
          onPick={(choice) => {
            if ((choice === "on") !== screen.on) void toggleFullscreen();
          }}
        />
      )}
      <div className="screen-actions">
        <button
          type="button"
          data-nav
          className="screen-button"
          onClick={() => useGame.getState().pushScreen({ screen: "help" })}
        >
          HELP
        </button>
        <button
          type="button"
          data-nav
          className="screen-button"
          onClick={() => useGame.getState().pushScreen({ screen: "credits" })}
        >
          CREDITS
        </button>
      </div>
      <p className="screen-hint">
        AUTO follows your clock. SOUND brings music, sound effects and POKéMON cries; it starts off.
        Settings are remembered in this browser.
      </p>
    </ScreenFrame>
  );
}

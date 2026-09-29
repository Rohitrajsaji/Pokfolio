"use client";

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
        onPick={(sound) => update({ sound: sound === "on" })}
      />
      <p className="screen-hint">
        AUTO follows your clock. Settings are remembered in this browser; music and sound effects
        arrive in a later update.
      </p>
    </ScreenFrame>
  );
}

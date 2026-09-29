"use client";

import { sound } from "../../audio/sound";
import { useGame } from "../../state/store";
import { Paged } from "../Paged";
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
    <div className="option-row" role="group" aria-label={label}>
      <span className="option-label" aria-hidden>
        {label}
      </span>
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
    </div>
  );
}

const TEXT_SPEEDS = ["slow", "normal", "fast", "instant"] as const;
const TIMES = ["auto", "morning", "day", "evening", "night"] as const;
const SOUND = ["off", "on"] as const;

export function OptionsScreen() {
  const settings = useGame((state) => state.settings);
  const update = useGame((state) => state.updateSettings);
  // The prizes page only shows once there's a prize to see: it would give the hidden Game Corner away.
  const wonSomething = useGame((state) => state.cleared > 0);
  return (
    <ScreenFrame title="OPTIONS" accent="#5a6bc4" fit>
      <Paged
        label="Options pages"
        blocks={[
          <Choice
            key="speed"
            label="TEXT SPEED"
            value={settings.textSpeed}
            options={TEXT_SPEEDS}
            onPick={(textSpeed) => update({ textSpeed })}
          />,
          <Choice
            key="time"
            label="TIME OF DAY"
            value={settings.time}
            options={TIMES}
            onPick={(time) => update({ time })}
          />,
          <Choice
            key="sound"
            label="SOUND"
            value={settings.sound ? "on" : "off"}
            options={SOUND}
            onPick={(choice) => {
              update({ sound: choice === "on" });
              if (choice === "on" && !settings.sound) sound.sfx("confirm");
            }}
          />,
          <div key="actions" className="screen-actions">
            {wonSomething && (
              <button
                type="button"
                data-nav
                className="screen-button"
                onClick={() => useGame.getState().pushScreen({ screen: "prizes" })}
              >
                PRIZES
              </button>
            )}
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
          </div>,
          <p key="hint" className="screen-hint">
            AUTO follows your clock. SOUND brings music, sound effects and POKéMON cries; it starts
            off. Settings are remembered in this browser.
          </p>,
        ]}
      />
    </ScreenFrame>
  );
}

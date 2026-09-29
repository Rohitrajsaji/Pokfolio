"use client";

import { dialogue } from "@content";
import { useState } from "react";
import { sound } from "../audio/sound";
import { beginAdventure } from "../state/interact";
import { fill } from "../text";
import { AvatarPortrait } from "./screens/parts";
import { TownBackdrop } from "./TownBackdrop";
import { useInputLayer } from "./useInputLayer";
import { useStageExit } from "./useStageExit";
import { useTypewriter } from "./useTypewriter";

const SPEAKER = fill(dialogue.intro.speaker);
const LINES = dialogue.intro.lines.map(fill);

/** The professor's short welcome. A moves it along; START, ESC or SKIP cuts to the town. */
export function IntroScene() {
  const [line, setLine] = useState(0);
  const { leaving, leave } = useStageExit(beginAdventure);
  const text = LINES[line];
  const { visible, typed, finish } = useTypewriter(text, line);

  const advance = () => {
    if (leaving) return;
    if (!typed) return finish();
    sound.sfx("text");
    if (line === LINES.length - 1) leave();
    else setLine(line + 1);
  };
  const skip = () => {
    if (leave()) sound.sfx("back");
  };
  useInputLayer((action) => {
    if (action === "a" || action === "b") advance();
    else if (action === "start" || action === "escape") skip();
  });

  return (
    <div className="stage-screen intro-scene" data-leaving={leaving ? "" : undefined}>
      <TownBackdrop />
      <div className="stage-shade" aria-hidden />
      <button type="button" className="intro-skip" onClick={skip}>
        SKIP ▶
      </button>
      <AvatarPortrait className="intro-portrait" />
      <div className="dialog ds-box" onClick={advance} role="group" aria-label="Introduction">
        <p className="dialog-speaker ds-box">{SPEAKER}</p>
        <p className="dialog-text" aria-hidden>
          {text.slice(0, visible)}
          <span className="invisible">{text.slice(visible)}</span>
        </p>
        <p className="sr-only" aria-live="polite">
          {SPEAKER}: {text}
        </p>
        {typed && (
          <span className="dialog-next" aria-hidden>
            ▼
          </span>
        )}
      </div>
    </div>
  );
}

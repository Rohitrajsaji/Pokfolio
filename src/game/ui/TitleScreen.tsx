"use client";

import { site } from "@content";
import { useEffect, useRef } from "react";
import { sound } from "../audio/sound";
import { useGame } from "../state/store";
import { MonSprite } from "./screens/parts";
import { TownBackdrop } from "./TownBackdrop";
import { useInputLayer } from "./useInputLayer";
import { useStageExit } from "./useStageExit";

/** What a visitor sees first: the game's logo over the town, and PRESS START. */
export function TitleScreen() {
  const start = useRef<HTMLButtonElement>(null);
  const { leaving, leave } = useStageExit(() => useGame.getState().setStage("intro"));

  const begin = () => {
    if (leave()) sound.sfx("confirm");
  };
  useInputLayer((action) => {
    if (action === "a" || action === "start") begin();
  });
  // Focused from the start, so ENTER and SPACE work straight away.
  useEffect(() => start.current?.focus({ preventScroll: true }), []);

  return (
    <div className="stage-screen title-screen" data-leaving={leaving ? "" : undefined}>
      <TownBackdrop />
      <div className="stage-shade" aria-hidden />
      <div className="title-content">
        <p className="title-logo logo-text">{site.gameTitle}</p>
        <p className="title-version">{site.gameSubtitle}</p>
        <div className="title-mons" aria-hidden>
          <MonSprite mon={site.partner} decorative className="title-mon" />
          <MonSprite mon={site.wild} decorative className="title-mon" />
        </div>
        <button ref={start} type="button" className="title-start" onClick={begin}>
          PRESS START
        </button>
      </div>
    </div>
  );
}

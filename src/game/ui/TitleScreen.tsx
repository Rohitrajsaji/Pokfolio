"use client";

import { site } from "@content";
import { useRef } from "react";
import { sound } from "../audio/sound";
import { useGame } from "../state/store";
import { FullscreenToggle } from "./FullscreenToggle";
import { MonSprite } from "./screens/parts";
import { SoundToggle } from "./SoundToggle";
import { TownBackdrop } from "./TownBackdrop";
import { useMenuNavigation } from "./useMenuNavigation";
import { useStageExit } from "./useStageExit";

/**
 * What a visitor sees first: the game's logo over the town. PRESS START begins
 * the adventure; RÉSUMÉ goes straight to it, for anyone in a hurry.
 */
export function TitleScreen() {
  const menu = useRef<HTMLDivElement>(null);
  const { leaving, leave } = useStageExit(() => useGame.getState().setStage("intro"));

  // Clicking a pick already plays the confirm blip; the START button doesn't click.
  useMenuNavigation(menu, {
    onBack: () => {},
    onKey: (action) => {
      if (action !== "start") return false;
      if (leave()) sound.sfx("confirm");
      return true;
    },
  });

  return (
    <div className="stage-screen title-screen" data-leaving={leaving ? "" : undefined}>
      <TownBackdrop />
      <div className="stage-shade" aria-hidden />
      <div className="title-content">
        <p className="title-logo">{site.gameTitle}</p>
        <p className="title-version">{site.gameSubtitle}</p>
        <div className="title-mons" aria-hidden>
          <MonSprite mon={site.partner} decorative className="title-mon" />
          <MonSprite mon={site.wild} decorative className="title-mon" />
        </div>
        <div ref={menu} className="title-menu" role="menu" aria-label="Start">
          <button type="button" role="menuitem" data-nav className="title-start" onClick={leave}>
            PRESS START
          </button>
          <button
            type="button"
            role="menuitem"
            data-nav
            className="title-resume"
            onClick={() => useGame.getState().openScreen({ screen: "resume" })}
          >
            RÉSUMÉ
          </button>
        </div>
      </div>
      <footer className="title-foot">
        <div className="title-tools">
          <button
            type="button"
            className="title-help"
            onClick={() => useGame.getState().openScreen({ screen: "help" })}
          >
            HELP
          </button>
          <span className="title-tools-right">
            <FullscreenToggle />
            <SoundToggle />
          </span>
        </div>
        <p className="title-disclaimer">{site.disclaimer}</p>
      </footer>
    </div>
  );
}

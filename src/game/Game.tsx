"use client";

import { dialogue, site } from "@content";
import { useEffect, useRef } from "react";
import { directMusic } from "./audio/director";
import { sound } from "./audio/sound";
import { Engine, VIEW_HEIGHT, VIEW_WIDTH } from "./engine/engine";
import { input } from "./engine/input";
import { bindKeyboard } from "./engine/keyboard";
import { parseTimeOverride, timeOfDay } from "./engine/time";
import { loadSettings } from "./state/settings";
import { useGame } from "./state/store";
import { fill } from "./text";
import { ContentScreens } from "./ui/ContentScreens";
import { Overlays } from "./ui/Overlays";
import { SoundToggle } from "./ui/SoundToggle";
import { TouchControls } from "./ui/TouchControls";
import { buildWorld } from "./world/compile";

/** The playable town: canvas, everything drawn over it, full screens, and the touch pad. */
export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    useGame.getState().updateSettings(loadSettings());
    const stopMusic = directMusic(useGame, sound);
    const override = parseTimeOverride(new URLSearchParams(window.location.search).get("time"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const engine = new Engine(canvas, buildWorld(), input, {
      onEncounter: () => {
        const game = useGame.getState();
        if (game.caught) return false;
        game.startBattle();
        return true;
      },
      busy: () => false,
      sfx: (name) => sound.sfx(name),
      reducedMotion: () => motion.matches,
      timeOfDay: () => {
        const setting = useGame.getState().settings.time;
        return override ?? (setting === "auto" ? timeOfDay(new Date()) : setting);
      },
    });
    engineRef.current = engine;
    useGame.setState({ travel: (to, spot) => engine.warpTo(to, spot) });
    const unbindKeyboard = bindKeyboard(window, input);
    engine.start();
    useGame.getState().say({ pages: dialogue.welcome.map(fill) });
    return () => {
      engine.stop();
      stopMusic();
      // No music on the pages you leave for, like the classic résumé.
      sound.setEnabled(false);
      unbindKeyboard();
      useGame.setState({ travel: null });
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="game">
      <div className="game-screen">
        <canvas
          ref={canvasRef}
          width={VIEW_WIDTH}
          height={VIEW_HEIGHT}
          className="game-canvas"
          role="img"
          aria-label={`${site.townName}: a pixel-art town to explore. Use the arrow keys, or open the menu with M.`}
          onPointerUp={(event) => engineRef.current?.tap(event.clientX, event.clientY)}
        />
        <Overlays />
      </div>
      <div className="game-bar">
        <SoundToggle />
      </div>
      <ContentScreens />
      <TouchControls />
    </div>
  );
}

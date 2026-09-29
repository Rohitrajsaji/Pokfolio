"use client";

import { rooms, secretRooms, site, town } from "@content";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { directMusic } from "./audio/director";
import { watchDensity } from "./density";
import { bindHygiene } from "./hygiene";
import { sound } from "./audio/sound";
import { Engine, VIEW_HEIGHT, VIEW_WIDTH } from "./engine/engine";
import { input } from "./engine/input";
import { bindKeyboard } from "./engine/keyboard";
import { parseTimeOverride, timeOfDay } from "./engine/time";
import { loadSettings } from "./state/settings";
import { useGame } from "./state/store";
import { ContentScreens } from "./ui/ContentScreens";
import { IntroScene } from "./ui/IntroScene";
import { Overlays } from "./ui/Overlays";
import { PaletteFilters } from "./ui/PaletteFilters";
import { TitleScreen } from "./ui/TitleScreen";
import { TouchControls } from "./ui/TouchControls";
import { buildWorld } from "./world/compile";
import { computeView, layoutFor, sameView, type View } from "./view";

/**
 * The title's Pokémon need a view at least this tall (buttons, logo, a 60-pixel row for them and the
 * menu, credits: 154 game pixels) and this wide (menu with Pikachu on one side and Rotom on the other);
 * with less, they're left out so nothing has to overlap.
 */
const TITLE_ROW_HEIGHT = 154;
const TITLE_ROW_WIDTH = 288;

/**
 * The playable town: canvas, the title screen and intro, everything drawn over the
 * town, full screens, and the touch pad.
 */
export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const stage = useGame((state) => state.stage);
  // EXIT starts the visit again: the game (and its world) is built afresh.
  const run = useGame((state) => state.run);
  const palette = useGame((state) => state.cosmetics.palette);
  const [view, setView] = useState<View | null>(null);
  const viewRef = useRef<View | null>(null);
  const [fontReady, setFontReady] = useState(false);

  // Nothing shows until the window has been measured and the pixel font is in: what the server
  // sent has no size and a stand-in font, and showing it would make the page jump as both arrive.
  useEffect(() => {
    let alive = true;
    const show = () => {
      if (alive) setFontReady(true);
    };
    const fallback = window.setTimeout(show, 1500);
    if (document.fonts?.ready) document.fonts.ready.then(show, show);
    else show();
    return () => {
      alive = false;
      window.clearTimeout(fallback);
    };
  }, []);

  // Fit the game to its space: whole window, less the touch pad on a phone.
  useLayoutEffect(() => {
    const region = regionRef.current;
    if (!region) return;
    const fit = () => {
      const { width, height } = region.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      const next = computeView(width, height, window.devicePixelRatio || 1);
      setView((last) => (last && sameView(last, next) ? last : next));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(region);
    // Browser zoom changes the screen density without resizing the region.
    window.addEventListener("resize", fit);
    // Phone toolbars and keyboards resize the visual viewport, and moving to another
    // monitor changes the density, without always resizing the region.
    window.visualViewport?.addEventListener("resize", fit);
    const stopWatching = watchDensity(fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      stopWatching();
    };
  }, []);

  useEffect(() => {
    viewRef.current = view;
    if (!view) return;
    engineRef.current?.resize(view.width, view.height);
    // Screens that lay themselves out by how much room there is (the battle) read it from here.
    useGame.getState().setView({ width: view.width, height: view.height });
  }, [view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    useGame.getState().updateSettings(loadSettings());
    const stopMusic = directMusic(useGame, sound);
    const override = parseTimeOverride(new URLSearchParams(window.location.search).get("time"));
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const engine = new Engine(
      canvas,
      buildWorld(town, rooms, secretRooms, useGame.getState().secrets),
      input,
      {
        onEncounter: () => {
          const game = useGame.getState();
          if (game.caught) return false;
          game.startBattle();
          return true;
        },
        // Nothing moves on the title screen or in the intro.
        busy: () => useGame.getState().stage !== "play",
        sfx: (name) => sound.sfx(name),
        reducedMotion: () => motion.matches,
        timeOfDay: () => {
          const setting = useGame.getState().settings.time;
          return override ?? (setting === "auto" ? timeOfDay(new Date()) : setting);
        },
      },
    );
    engineRef.current = engine;
    if (viewRef.current) engine.resize(viewRef.current.width, viewRef.current.height);
    useGame.setState({ travel: (to, spot) => engine.warpTo(to, spot) });
    const unbindKeyboard = bindKeyboard(window, input);
    const unbindHygiene = bindHygiene(input);
    engine.start();
    return () => {
      engine.stop();
      stopMusic();
      // Music stops when the visitor leaves the page.
      sound.setEnabled(false);
      unbindKeyboard();
      unbindHygiene();
      // Leave nothing open (a dialog, a battle) for when the visitor comes back.
      useGame.getState().closeAll();
      useGame.setState({ travel: null });
      engineRef.current = null;
    };
  }, [run]);

  return (
    <div
      className="game"
      data-layout={view ? layoutFor(view) : undefined}
      data-ready={view && fontReady ? "" : undefined}
      data-palette={palette === "normal" ? undefined : palette}
      data-short={view && view.height < 160 ? "" : undefined}
      data-tight={
        view && (view.height < TITLE_ROW_HEIGHT || view.width < TITLE_ROW_WIDTH) ? "" : undefined
      }
      style={
        view
          ? ({ "--px": `${view.unit}px`, "--z": view.unit, "--vw": view.width } as CSSProperties)
          : undefined
      }
    >
      <div ref={regionRef} className="game-region">
        <div
          className="game-screen"
          style={
            view ? { width: view.width * view.unit, height: view.height * view.unit } : undefined
          }
        >
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
          {stage === "title" && <TitleScreen />}
          {stage === "intro" && <IntroScene />}
          <ContentScreens />
        </div>
      </div>
      <TouchControls />
      <PaletteFilters />
    </div>
  );
}

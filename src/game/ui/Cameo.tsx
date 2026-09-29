"use client";

import { dialogue, site } from "@content";
import type { CameoId } from "@content/types";
import { useEffect, useRef, useState } from "react";
import { missingnoBuffer, staticBuffer } from "@/art/glitch";
import { paintBuffer } from "@/art/canvas";
import { useGame } from "../state/store";
import { fill } from "../text";
import { MonSprite } from "./screens/parts";
import { useInputLayer } from "./useInputLayer";
import { useReducedMotion } from "./useReducedMotion";
import { sound } from "../audio/sound";

/** How long each cameo lasts, in milliseconds. With reduced motion they're shorter, and don't move. */
const LENGTH: Record<CameoId, number> = { rotom: 2600, missingno: 2000 };
const LENGTH_STILL = 1400;
/** A or B skips a cameo once it's had this long to be seen. */
const SKIPPABLE_AFTER = 800;

/** A square of TV static as an image, drawn once (a cameo only ever shows in the browser). */
function makeStatic(): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  paintBuffer(canvas, staticBuffer(64));
  return canvas.toDataURL();
}

function Rotom({ still }: { still: boolean }) {
  // TV static, tiled; the picture is Rotom itself, from the wild Pokémon in site.ts.
  const [noise] = useState(makeStatic);
  return (
    <>
      <div
        className="cameo-static"
        data-still={still ? "" : undefined}
        style={{ backgroundImage: `url(${noise})` }}
      />
      <span className="cameo-mon-slot" data-still={still ? "" : undefined}>
        <MonSprite mon={site.wild} decorative className="cameo-mon" />
      </span>
    </>
  );
}

function MissingNo({ still }: { still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintBuffer(ref.current, missingnoBuffer());
  }, []);
  return (
    <canvas
      ref={ref}
      width={24}
      height={48}
      className="cameo-missingno"
      data-still={still ? "" : undefined}
      aria-hidden
    />
  );
}

/**
 * A short full-screen moment: something pops out of the TV, or the screen comes apart (the engine
 * scrambles the town itself underneath). Then the lines in `after` are said, if there are any.
 */
export function Cameo({ cameo, after }: { cameo: CameoId; after?: string[] }) {
  const still = useReducedMotion();
  const [skippable, setSkippable] = useState(false);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    const game = useGame.getState();
    game.closeOverlay();
    if (after && after.length > 0) game.say({ pages: after.map(fill) });
  };

  useEffect(() => {
    if (cameo === "missingno") {
      sound.sfx("glitch");
      if (!still) sound.sfx("glitch", 0.7);
    } else {
      sound.sfx("zap");
    }
    const ready = window.setTimeout(() => setSkippable(true), SKIPPABLE_AFTER);
    const end = window.setTimeout(finish, still ? LENGTH_STILL : LENGTH[cameo]);
    return () => {
      window.clearTimeout(ready);
      window.clearTimeout(end);
    };
    // A cameo runs once for as long as it's on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useInputLayer((action) => {
    if (skippable && (action === "a" || action === "b")) finish();
  });

  return (
    <div className="cameo" data-cameo={cameo} role="img" aria-label={dialogue.cameos[cameo]}>
      {cameo === "rotom" ? <Rotom still={still} /> : <MissingNo still={still} />}
    </div>
  );
}

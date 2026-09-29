"use client";

import { dialogue, palettes, playerLooks } from "@content";
import type { PaletteSpec, PlayerLookSpec } from "@content/types";
import { useEffect, useRef } from "react";
import { paintBuffer } from "@/art/canvas";
import { CHARACTER_HEIGHT, CHARACTER_WIDTH, characterFrame } from "@/art/characters";
import { sound } from "../../audio/sound";
import { useGame } from "../../state/store";
import { fillWith } from "../../text";
import { playerLook } from "../../world/compile";
import { ScreenFrame } from "../ScreenFrame";

/** The colours each screen colour shows, as a little swatch. */
const SWATCHES: Record<PaletteSpec["id"], readonly string[]> = {
  normal: ["#4a86d8", "#e0524a", "#f2c94c", "#58a84c"],
  gameboy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  sepia: ["#2b1b0e", "#6b4a2b", "#b58a55", "#f0dcae"],
};

/** A trainer in a look, drawn from the same art as in the town. */
function LookPreview({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintBuffer(ref.current, characterFrame(playerLook(id), "down"));
  }, [id]);
  return (
    <canvas
      ref={ref}
      width={CHARACTER_WIDTH}
      height={CHARACTER_HEIGHT}
      className="prize-look"
      aria-hidden
    />
  );
}

function Prize({
  name,
  earnedAt,
  cleared,
  chosen,
  onPick,
  children,
}: {
  name: string;
  earnedAt: number;
  cleared: number;
  chosen: boolean;
  onPick: () => void;
  children: React.ReactNode;
}) {
  const locked = earnedAt > cleared;
  return (
    <button
      type="button"
      data-nav
      className="prize"
      aria-pressed={chosen}
      aria-disabled={locked}
      onClick={() => {
        if (locked) return sound.sfx("bump");
        onPick();
      }}
    >
      <span className="prize-picture" data-locked={locked ? "" : undefined}>
        {children}
      </span>
      <span className="prize-name">{name}</span>
      {locked && (
        <span className="prize-lock">
          {fillWith(dialogue.prizes.locked, { level: String(earnedAt) })}
        </span>
      )}
    </button>
  );
}

/** What's been won at VOLTORB FLIP, and a way to wear it: a look for the trainer, and a screen colour. */
export function PrizesScreen() {
  const cleared = useGame((state) => state.cleared);
  const cosmetics = useGame((state) => state.cosmetics);
  const choose = useGame((state) => state.choose);
  const pick = (choice: Parameters<typeof choose>[0]) => {
    sound.sfx("confirm");
    choose(choice);
  };
  return (
    <ScreenFrame title="PRIZES" accent="#c99a2e">
      <p className="screen-hint">{dialogue.prizes.intro}</p>
      <h3 className="section-title">Trainer look</h3>
      <div className="prize-grid">
        {playerLooks.map((look: PlayerLookSpec) => (
          <Prize
            key={look.id}
            name={look.name}
            earnedAt={look.earnedAt}
            cleared={cleared}
            chosen={cosmetics.look === look.id}
            onPick={() => pick({ look: look.id })}
          >
            <LookPreview id={look.id} />
          </Prize>
        ))}
      </div>
      <h3 className="section-title">Screen colour</h3>
      <div className="prize-grid">
        {palettes.map((palette) => (
          <Prize
            key={palette.id}
            name={palette.name}
            earnedAt={palette.earnedAt}
            cleared={cleared}
            chosen={cosmetics.palette === palette.id}
            onPick={() => pick({ palette: palette.id })}
          >
            <span className="prize-swatches">
              {SWATCHES[palette.id].map((colour) => (
                <span key={colour} style={{ background: colour }} />
              ))}
            </span>
          </Prize>
        ))}
      </div>
    </ScreenFrame>
  );
}

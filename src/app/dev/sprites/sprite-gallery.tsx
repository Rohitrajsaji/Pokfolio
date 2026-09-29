"use client";

import { site } from "@content/site";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BUILDINGS } from "@/art/buildings";
import { paintLitBuffer } from "@/art/canvas";
import {
  avatarLook,
  characterFrame,
  LOOKS,
  type CharacterLook,
  type Facing,
  type Step,
} from "@/art/characters";
import { paintCenterScene, paintLabScene, paintTownScene } from "@/art/demo";
import { gridToBuffer } from "@/art/grid";
import { paintGround } from "@/art/scene";
import { GLOW_COLORS } from "@/art/palette";
import { PixelBuffer } from "@/art/pixel-buffer";
import {
  FENCE_TILE,
  MAILBOX_TILE,
  ROCK_TILE,
  SIGN_TILE,
  paintBush,
  paintJobBoard,
  paintLamp,
  paintTree,
} from "@/art/props";
import {
  GRASS_PLAIN,
  GRASS_TUFTS,
  RED_FLOWER_FRAMES,
  TALL_GRASS_FRAMES,
  YELLOW_FLOWER_FRAMES,
} from "@/art/terrain";

/** Multiply tints approximating each time of day (the real engine refines these). */
const TIMES = {
  morning: "#ffe6cc",
  day: null,
  evening: "#ffb58a",
  night: "#6a78c4",
} as const;
type Time = keyof typeof TIMES;

const cache = new Map<string, PixelBuffer>();
function cached(key: string, make: () => PixelBuffer): PixelBuffer {
  let buf = cache.get(key);
  if (!buf) {
    buf = make();
    cache.set(key, buf);
  }
  return buf;
}

function onGrass(width: number, height: number, paint: (buf: PixelBuffer) => void): PixelBuffer {
  const buf = new PixelBuffer(width, height);
  buf.rect(0, 0, width, height, "#8ccf6b");
  paint(buf);
  return buf;
}

function useTick(ms: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return tick;
}

function PixelCanvas({
  buffer,
  scale = 3,
  tint = null,
  label,
  fluid = false,
}: {
  buffer: PixelBuffer;
  scale?: number;
  tint?: string | null;
  label: string;
  fluid?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintLitBuffer(ref.current, buffer, tint, GLOW_COLORS);
  }, [buffer, tint]);
  const width = buffer.width * scale;
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      width={buffer.width}
      height={buffer.height}
      className="pixelated block"
      style={
        fluid
          ? { width: "100%", maxWidth: width, height: "auto" }
          : { width, height: buffer.height * scale }
      }
    />
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-pixel text-xl tracking-wide text-amber-200">{title}</h2>
      {note && <p className="mt-1 max-w-3xl text-sm text-white/60">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      {children}
      <figcaption className="text-center font-pixel text-xs text-white/70">{label}</figcaption>
    </figure>
  );
}

const FACINGS: Facing[] = ["down", "left", "right", "up"];

const CAST: Array<{ name: string; look: CharacterLook }> = [
  { name: "YOU (the visitor)", look: LOOKS.player },
  { name: "PROF. ROHIT (placeholder look)", look: avatarLook(site.avatar) },
  { name: "NURSE", look: LOOKS.nurse },
  { name: "MART CLERK", look: LOOKS.clerk },
  { name: "LASS", look: LOOKS.lass },
  { name: "ELDER", look: LOOKS.elder },
];

const PATH_SAMPLE = ["......", ".====.", ".=..=.", ".====.", "......"];

export function SpriteGallery() {
  const [time, setTime] = useState<Time>("day");
  const tick = useTick(170);
  const step = (tick % 4) as Step;
  const sway = Math.floor(tick / 4) % 2;
  const lit = time === "night" || time === "evening";

  const town = cached(`town-${lit}-${sway}-${step}`, () =>
    paintTownScene({ lit, frame: sway, step }),
  );

  return (
    <main className="min-h-dvh bg-[#161826] px-5 py-10 text-white sm:px-10">
      <header className="max-w-3xl">
        <p className="font-pixel text-sm tracking-widest text-sky-300">CHECKPOINT · ART KIT</p>
        <h1 className="mt-2 font-pixel text-3xl sm:text-4xl">Pixel art preview</h1>
        <p className="mt-3 leading-relaxed text-white/70">
          Everything on this page is drawn in code — tiles, buildings, people and rooms live in{" "}
          <code className="rounded bg-white/10 px-1">src/art/</code>. Official Pokémon sprites
          (battles, Pokédex) come from PokeAPI and aren&apos;t part of this kit.
        </p>
      </header>

      <Section
        title="The town"
        note="A sample layout to judge the style; the real map is built from content later. Characters walk in place."
      >
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Time of day">
          {(Object.keys(TIMES) as Time[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              aria-pressed={time === t}
              className={`rounded border px-3 py-1.5 font-pixel text-sm capitalize transition ${
                time === t
                  ? "border-amber-200 bg-amber-200 text-[#161826]"
                  : "border-white/30 hover:border-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <PixelCanvas buffer={town} scale={2} tint={TIMES[time]} label="Sample town" fluid />
      </Section>

      <Section
        title="Characters"
        note="Four facings, walking. Your look is set in content/site.ts → avatar."
      >
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {CAST.map(({ name, look }) => (
            <Labelled key={name} label={name}>
              <div className="flex gap-3 rounded-lg bg-[#8ccf6b] p-3">
                {FACINGS.map((facing) => (
                  <PixelCanvas
                    key={facing}
                    buffer={characterFrame(look, facing, step)}
                    scale={4}
                    label={`${name} facing ${facing}`}
                  />
                ))}
              </div>
            </Labelled>
          ))}
        </div>
      </Section>

      <Section title="Buildings" note="Day and night (windows glow after dark).">
        <div className="flex flex-wrap gap-10">
          {Object.values(BUILDINGS).map((b) => (
            <Labelled key={b.id} label={b.name}>
              <div className="flex gap-3">
                {[false, true].map((night) => (
                  <PixelCanvas
                    key={String(night)}
                    buffer={cached(`building-${b.id}-${night}`, () =>
                      onGrass(b.widthTiles * 16, b.heightTiles * 16, (buf) =>
                        b.paint(buf, 0, 0, { lit: night }),
                      ),
                    )}
                    scale={2}
                    tint={night ? TIMES.night : null}
                    label={`${b.name} ${night ? "at night" : "by day"}`}
                  />
                ))}
              </div>
            </Labelled>
          ))}
        </div>
      </Section>

      <Section title="Tiles and props">
        <div className="flex flex-wrap items-end gap-8">
          <Labelled label="GRASS">
            <PixelCanvas buffer={cached("grass", () => gridToBuffer(GRASS_TUFTS))} label="Grass" />
          </Labelled>
          <Labelled label="GRASS (PLAIN)">
            <PixelCanvas
              buffer={cached("grass-plain", () => gridToBuffer(GRASS_PLAIN))}
              label="Plain grass"
            />
          </Labelled>
          <Labelled label="TALL GRASS">
            <PixelCanvas buffer={gridToBuffer(TALL_GRASS_FRAMES[sway])} label="Tall grass" />
          </Labelled>
          <Labelled label="FLOWERS">
            <div className="flex gap-2">
              <PixelCanvas buffer={gridToBuffer(RED_FLOWER_FRAMES[sway])} label="Red flowers" />
              <PixelCanvas
                buffer={gridToBuffer(YELLOW_FLOWER_FRAMES[sway])}
                label="Yellow flowers"
              />
            </div>
          </Labelled>
          <Labelled label="PATH EDGES">
            <PixelCanvas
              buffer={cached("path", () => {
                const buf = new PixelBuffer(PATH_SAMPLE[0].length * 16, PATH_SAMPLE.length * 16);
                paintGround(buf, PATH_SAMPLE);
                return buf;
              })}
              scale={2}
              label="Path edges and corners"
            />
          </Labelled>
          <Labelled label="TREE">
            <PixelCanvas
              buffer={cached("tree", () => onGrass(32, 32, (b) => paintTree(b, 0, 0)))}
              label="Tree"
            />
          </Labelled>
          <Labelled label="BUSH · ROCK">
            <div className="flex gap-2">
              <PixelCanvas
                buffer={cached("bush", () => onGrass(16, 16, (b) => paintBush(b, 0, 0)))}
                label="Bush"
              />
              <PixelCanvas
                buffer={cached("rock", () =>
                  onGrass(16, 16, (b) => b.draw(gridToBuffer(ROCK_TILE), 0, 0)),
                )}
                label="Rock"
              />
            </div>
          </Labelled>
          <Labelled label="FENCE · SIGN · MAILBOX">
            <div className="flex gap-2">
              {[FENCE_TILE, SIGN_TILE, MAILBOX_TILE].map((grid, i) => (
                <PixelCanvas
                  key={i}
                  buffer={cached(`prop-${i}`, () =>
                    onGrass(16, 16, (b) => b.draw(gridToBuffer(grid), 0, 0)),
                  )}
                  label={["Fence", "Sign", "Mailbox"][i]}
                />
              ))}
            </div>
          </Labelled>
          <Labelled label="LAMP (DAY · NIGHT)">
            <div className="flex gap-2">
              {[false, true].map((on) => (
                <PixelCanvas
                  key={String(on)}
                  buffer={cached(`lamp-${on}`, () =>
                    onGrass(16, 32, (b) => paintLamp(b, 0, 0, on)),
                  )}
                  label={`Lamp ${on ? "lit" : "unlit"}`}
                />
              ))}
            </div>
          </Labelled>
          <Labelled label="JOB BOARD">
            <PixelCanvas
              buffer={cached("board", () => onGrass(32, 32, (b) => paintJobBoard(b, 0, 0)))}
              label="Job board"
            />
          </Labelled>
        </div>
      </Section>

      <Section
        title="Rooms"
        note="Prof. Rohit's Lab has one machine per project; the Pokémon Center is where visitors get your contact card."
      >
        <div className="flex flex-wrap gap-10">
          <Labelled label="PROF. ROHIT'S LAB">
            <PixelCanvas
              buffer={cached(`lab-${step}`, () => paintLabScene({ step }))}
              scale={2}
              label="Lab interior"
            />
          </Labelled>
          <Labelled label="POKéMON CENTER">
            <PixelCanvas
              buffer={cached(`center-${step}`, () => paintCenterScene({ step }))}
              scale={2}
              label="Pokémon Center interior"
            />
          </Labelled>
        </div>
      </Section>

      <p className="mt-16 max-w-3xl text-xs leading-relaxed text-white/40">{site.disclaimer}</p>
    </main>
  );
}

import { site } from "@content/site";
import { describe, expect, it } from "vitest";
import { BUILDINGS, BUILDING_ICONS } from "./buildings";
import {
  avatarLook,
  characterFrame,
  characterPalette,
  characterRows,
  LOOKS,
  type Facing,
  type Step,
} from "./characters";
import { DEMO_TOWN_ROWS, paintCenterScene, paintLabScene, paintTownScene } from "./demo";
import { validateGrid } from "./grid";
import { OUTLINE, SNORLAX, WATER } from "./palette";
import { PixelBuffer } from "./pixel-buffer";
import {
  FENCE_TILE,
  MAILBOX_TILE,
  ROCK_TILE,
  SIGN_TILE,
  paintBush,
  paintJobBoard,
  paintLamp,
  paintSnorlax,
  paintTree,
} from "./props";
import {
  GRASS_PLAIN,
  GRASS_TUFTS,
  RED_FLOWER_FRAMES,
  TALL_GRASS_FRAMES,
  YELLOW_FLOWER_FRAMES,
  paintPath,
  paintWater,
  type WaterNeighbours,
} from "./terrain";

function opaquePixels(buf: PixelBuffer): number {
  let count = 0;
  for (let i = 3; i < buf.data.length; i += 4) if (buf.data[i] > 0) count++;
  return count;
}

describe("tiles", () => {
  const tiles = {
    GRASS_TUFTS,
    GRASS_PLAIN,
    FENCE_TILE,
    SIGN_TILE,
    MAILBOX_TILE,
    ROCK_TILE,
    "TALL_GRASS 0": TALL_GRASS_FRAMES[0],
    "TALL_GRASS 1": TALL_GRASS_FRAMES[1],
    "RED_FLOWER 0": RED_FLOWER_FRAMES[0],
    "RED_FLOWER 1": RED_FLOWER_FRAMES[1],
    "YELLOW_FLOWER 0": YELLOW_FLOWER_FRAMES[0],
    "YELLOW_FLOWER 1": YELLOW_FLOWER_FRAMES[1],
  };

  it.each(Object.entries(tiles))("%s is a valid 16×16 grid", (_, grid) => {
    expect(validateGrid(grid, { width: 16, height: 16 })).toEqual([]);
  });

  it("has valid sign icons", () => {
    expect(validateGrid(BUILDING_ICONS.pokeball, { width: 12, height: 12 })).toEqual([]);
    expect(validateGrid(BUILDING_ICONS.badge, { width: 13, height: 13 })).toEqual([]);
  });

  it("paints a path tile for every combination of neighbours", () => {
    const keys = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
    for (let mask = 0; mask < 256; mask++) {
      const nb = Object.fromEntries(keys.map((k, bit) => [k, Boolean(mask & (1 << bit))]));
      const buf = new PixelBuffer(16, 16);
      paintPath(buf, 0, 0, nb as Record<(typeof keys)[number], boolean>, mask);
      expect(opaquePixels(buf)).toBe(256);
    }
  });
});

describe("characters", () => {
  it("has 16×10 head and body grids using only character colours", () => {
    const palette = characterPalette(LOOKS.player);
    for (const { label, rows } of characterRows()) {
      expect(validateGrid({ rows, palette }, { width: 16, height: 10 }), label).toEqual([]);
    }
  });

  it("renders every look, facing and step at 16×20", () => {
    const avatar = avatarLook(site.avatar);
    const looks = [...Object.values(LOOKS), avatar, { ...avatar, glasses: true }];
    const facings: Facing[] = ["down", "up", "left", "right"];
    const steps: Step[] = [0, 1, 2, 3];
    for (const look of looks) {
      for (const facing of facings) {
        for (const step of steps) {
          const frame = characterFrame(look, facing, step);
          expect([frame.width, frame.height]).toEqual([16, 20]);
          expect(opaquePixels(frame)).toBeGreaterThan(100);
        }
      }
    }
  });

  it("mirrors the left-facing frame to face right", () => {
    const left = characterFrame(LOOKS.player, "left", 1);
    const right = characterFrame(LOOKS.player, "right", 1);
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 16; x++) expect(right.get(x, y)).toBe(left.get(15 - x, y));
    }
  });

  it("uses valid colours for the avatar", () => {
    for (const [key, value] of Object.entries(site.avatar)) {
      if (key.endsWith("Color") || key === "skinTone")
        expect(value, key).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("buildings", () => {
  it.each(Object.values(BUILDINGS))(
    "$id fills its footprint and has a door on its bottom edge",
    (b) => {
      for (const lit of [false, true]) {
        const buf = new PixelBuffer(b.widthTiles * 16, b.heightTiles * 16);
        b.paint(buf, 0, 0, { lit });
        expect(opaquePixels(buf)).toBe(buf.width * buf.height);
      }
      expect(b.door.y).toBe(b.heightTiles - 1);
      expect(b.door.x).toBeGreaterThanOrEqual(0);
      expect(b.door.x).toBeLessThan(b.widthTiles);
    },
  );
});

describe("props", () => {
  it("paints trees, bushes, lamps and the job board without leaving their box", () => {
    const buf = new PixelBuffer(32, 32);
    buf.rect(0, 0, 32, 32, "#8ccf6b");
    paintTree(buf, 0, 0);
    paintBush(buf, 0, 0);
    paintLamp(buf, 0, 0, true);
    paintJobBoard(buf, 0, 0);
    expect(opaquePixels(buf)).toBe(32 * 32);
  });

  it("paints Snorlax inside its 32×32 box, filling most of it and leaving the corners clear", () => {
    const buf = new PixelBuffer(48, 48);
    paintSnorlax(buf, 8, 8);
    const spilled: string[] = [];
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        const inside = x >= 8 && x < 40 && y >= 8 && y < 40;
        if (!inside && buf.get(x, y) !== null) spilled.push(`${x},${y}`);
      }
    }
    expect(spilled).toEqual([]);
    expect(opaquePixels(buf)).toBeGreaterThan(500);
    expect(buf.get(8, 8)).toBeNull();
    expect(buf.get(39, 8)).toBeNull();
    // Only colours from palette.ts, so restyling them there restyles it.
    const allowed = new Set<string | null>([OUTLINE, ...Object.values(SNORLAX)]);
    for (let y = 8; y < 40; y++) {
      for (let x = 8; x < 40; x++) {
        const colour = buf.get(x, y);
        if (colour) expect(allowed.has(colour), `${x},${y}: ${colour}`).toBe(true);
      }
    }
  });
});

describe("the pond", () => {
  const SIDES = ["n", "s", "e", "w"] as const;
  const nbFor = (mask: number): WaterNeighbours =>
    Object.fromEntries(
      SIDES.map((side, bit) => [side, Boolean(mask & (1 << bit))]),
    ) as unknown as WaterNeighbours;
  const tile = (nb: WaterNeighbours, frame: 0 | 1 = 0, seed = 1) => {
    const buf = new PixelBuffer(16, 16);
    paintWater(buf, 0, 0, nb, frame, seed);
    return buf;
  };
  const LAND = { n: false, s: false, e: false, w: false };
  const WATER_ALL = { n: true, s: true, e: true, w: true };
  const differ = (a: PixelBuffer, b: PixelBuffer) => a.data.some((value, i) => value !== b.data[i]);

  it("paints a tile for every combination of neighbours, in both frames, giving up at most the corners", () => {
    for (let mask = 0; mask < 16; mask++) {
      for (const frame of [0, 1] as const) {
        const painted = opaquePixels(tile(nbFor(mask), frame, mask));
        expect(painted, `mask ${mask}, frame ${frame}`).toBeGreaterThanOrEqual(256 - 4 * 5);
        expect(painted, `mask ${mask}, frame ${frame}`).toBeLessThanOrEqual(256);
      }
    }
  });

  it("is water all the way across when water lies on every side, with no shore drawn", () => {
    const buf = tile(WATER_ALL);
    expect(opaquePixels(buf)).toBe(256);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) expect(buf.get(x, y), `${x},${y}`).not.toBe(WATER.edge);
    }
  });

  it("rounds off all four corners of a tile with land on every side, five pixels each", () => {
    const buf = tile(LAND);
    expect(opaquePixels(buf)).toBe(256 - 4 * 5);
    for (const [x, y] of [
      [0, 0],
      [15, 0],
      [0, 15],
      [15, 15],
    ]) {
      expect(buf.get(x, y), `${x},${y}`).toBeNull();
    }
  });

  it("rounds off only the corner where land meets it on both sides", () => {
    const topLeft = tile({ n: false, w: false, s: true, e: true });
    expect(topLeft.get(0, 0)).toBeNull();
    expect(topLeft.get(15, 0)).not.toBeNull();
    expect(topLeft.get(0, 15)).not.toBeNull();
    expect(topLeft.get(15, 15)).not.toBeNull();
    // Land on one side only leaves the tile square.
    expect(opaquePixels(tile({ n: false, s: true, e: true, w: true }))).toBe(256);
  });

  it("outlines every side that meets land, and none that meets water", () => {
    const buf = tile({ n: false, s: true, e: true, w: true });
    for (let x = 0; x < 16; x++) {
      expect(buf.get(x, 0), `top row ${x}`).toBe(WATER.edge);
      expect(buf.get(x, 15), `bottom row ${x}`).not.toBe(WATER.edge);
    }
    for (let x = 0; x < 16; x++)
      expect(buf.get(x, 1), `foam under the outline ${x}`).toBe(WATER.foam);
  });

  it("moves its ripples between the two frames, and looks different from the tile beside it", () => {
    expect(differ(tile(WATER_ALL, 0, 3), tile(WATER_ALL, 1, 3))).toBe(true);
    expect(differ(tile(WATER_ALL, 0, 3), tile(WATER_ALL, 0, 4))).toBe(true);
    // Drawing it twice gives the same picture: nothing about it is random.
    expect(differ(tile(WATER_ALL, 1, 3), tile(WATER_ALL, 1, 3))).toBe(false);
  });

  it("only touches its own tile when painted into a bigger picture", () => {
    const buf = new PixelBuffer(48, 48);
    paintWater(buf, 16, 16, LAND, 0, 5);
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        const inside = x >= 16 && x < 32 && y >= 16 && y < 32;
        if (!inside) expect(buf.get(x, y), `${x},${y}`).toBeNull();
      }
    }
  });
});

describe("demo scenes", () => {
  it("uses a rectangular map whose trees are aligned 2×2 blocks", () => {
    const width = DEMO_TOWN_ROWS[0].length;
    DEMO_TOWN_ROWS.forEach((row) => expect(row).toHaveLength(width));
    DEMO_TOWN_ROWS.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch !== "T") return;
        const ax = x - (x % 2);
        const ay = y - (y % 2);
        const block = [
          DEMO_TOWN_ROWS[ay][ax],
          DEMO_TOWN_ROWS[ay][ax + 1],
          DEMO_TOWN_ROWS[ay + 1]?.[ax],
          DEMO_TOWN_ROWS[ay + 1]?.[ax + 1],
        ];
        expect(block, `tree at ${x},${y}`).toEqual(["T", "T", "T", "T"]);
      });
    });
  });

  it("renders the town by day and night, and both sample rooms", () => {
    const day = paintTownScene();
    const night = paintTownScene({ lit: true, frame: 1, step: 1 });
    expect([day.width, day.height]).toEqual([24 * 16, 18 * 16]);
    expect(opaquePixels(night)).toBe(night.width * night.height);
    expect(opaquePixels(paintLabScene())).toBe(12 * 16 * 9 * 16);
    expect(opaquePixels(paintCenterScene())).toBe(12 * 16 * 9 * 16);
  });
});

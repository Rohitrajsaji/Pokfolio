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
import { PixelBuffer } from "./pixel-buffer";
import {
  FENCE_TILE,
  MAILBOX_TILE,
  ROCK_TILE,
  SIGN_TILE,
  paintBush,
  paintJobBoard,
  paintLamp,
  paintTree,
} from "./props";
import {
  GRASS_PLAIN,
  GRASS_TUFTS,
  RED_FLOWER_FRAMES,
  TALL_GRASS_FRAMES,
  YELLOW_FLOWER_FRAMES,
  paintPath,
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

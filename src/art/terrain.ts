/** Ground tiles, 16×16 each. */
import { rle, type Grid } from "./grid";
import { hash2 } from "./noise";
import { FLOWER, GRASS, SAND, TALL_GRASS, WATER } from "./palette";
import type { PixelBuffer } from "./pixel-buffer";

export const TILE = 16;

const grassPalette = { g: GRASS.base, l: GRASS.light, d: GRASS.dark };

export const GRASS_TUFTS: Grid = {
  palette: grassPalette,
  rows: [
    "16g",
    "16g",
    "2gld12g",
    "3gd12g",
    "16g",
    "11gld3g",
    "12gd3g",
    "16g",
    "16g",
    "5gld9g",
    "6gd9g",
    "16g",
    "16g",
    "14gld",
    "15gd",
    "16g",
  ].map(rle),
};

export const GRASS_PLAIN: Grid = {
  palette: grassPalette,
  rows: Array.from({ length: 16 }, (_, y) =>
    y === 8 ? rle("8gld6g") : y === 9 ? rle("9gd6g") : rle("16g"),
  ),
};

/**
 * One 8×8 clump of tall grass; "." is the shadow between clumps. Tiles are
 * 2×2 clumps with the lower row offset, so the field reads as tufts, not rows.
 */
const TALL_GRASS_CELL = [
  "...l....",
  "..ltl.l.",
  ".lttlltl",
  "Dltttttd",
  "Dtttttdd",
  "Ddtttddd",
  "DDddddDD",
  "DDDDDDDD",
];

function tallGrassRows(sway: number): string[] {
  return Array.from({ length: 16 }, (_, y) => {
    const line = TALL_GRASS_CELL[y % 8].replaceAll(".", "D").repeat(2);
    const tipRow = y % 8 < 3;
    const offset = (y >= 8 ? 4 : 0) + (tipRow ? sway : 0);
    return line.slice(offset) + line.slice(0, offset);
  });
}

const tallGrassPalette = {
  l: TALL_GRASS.light,
  t: TALL_GRASS.base,
  d: TALL_GRASS.dark,
  D: TALL_GRASS.deep,
};

/** Two frames: still, and swaying (used when someone walks through). */
export const TALL_GRASS_FRAMES: Grid[] = [0, 1].map((sway) => ({
  palette: tallGrassPalette,
  rows: tallGrassRows(sway),
}));

const flowerRows = (sway: number) =>
  [
    "16g",
    "16g",
    `${4 + sway}gr${11 - sway}g`,
    `${3 + sway}gryr${10 - sway}g`,
    `${4 + sway}gR${11 - sway}g`,
    "4gd11g",
    "16g",
    "16g",
    "16g",
    `${11 - sway}gr${4 + sway}g`,
    `${10 - sway}gryr${3 + sway}g`,
    `${11 - sway}gR${4 + sway}g`,
    "11gd4g",
    "16g",
    "16g",
    "16g",
  ].map(rle);

function flowerFrames(petal: string, petalDark: string, centre: string): Grid[] {
  const palette = { g: GRASS.base, d: GRASS.deep, r: petal, R: petalDark, y: centre };
  return [0, 1].map((sway) => ({ palette, rows: flowerRows(sway) }));
}

export const RED_FLOWER_FRAMES = flowerFrames(FLOWER.red, FLOWER.redDark, FLOWER.yellow);
export const YELLOW_FLOWER_FRAMES = flowerFrames(FLOWER.yellow, FLOWER.yellowDark, FLOWER.white);

/** Which of the eight neighbouring tiles are also path. */
export interface PathNeighbours {
  n: boolean;
  s: boolean;
  e: boolean;
  w: boolean;
  ne: boolean;
  nw: boolean;
  se: boolean;
  sw: boolean;
}

/** How far grass reaches into the path along an edge, per pixel. */
const EDGE_PROFILE = [1, 2, 1, 1, 2, 2, 1, 1, 1, 2, 1, 1, 2, 1, 1, 2];

/**
 * A sandy path tile whose edges blend into grass wherever a neighbour is
 * not path. `seed` varies the speckles so repeated tiles don't look stamped.
 */
export function paintPath(
  buf: PixelBuffer,
  ox: number,
  oy: number,
  nb: PathNeighbours,
  seed = 0,
): void {
  buf.rect(ox, oy, TILE, TILE, SAND.base);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = hash2(x, y, seed);
      if (r < 0.05) buf.set(ox + x, oy + y, SAND.dark);
      else if (r > 0.96) buf.set(ox + x, oy + y, SAND.light);
    }
  }

  // Grass creeping in from each side that borders non-path.
  for (let i = 0; i < TILE; i++) {
    const depth = EDGE_PROFILE[i];
    for (let d = 0; d < depth; d++) {
      if (!nb.n) buf.set(ox + i, oy + d, GRASS.base);
      if (!nb.s) buf.set(ox + i, oy + TILE - 1 - d, GRASS.base);
      if (!nb.w) buf.set(ox + d, oy + i, GRASS.base);
      if (!nb.e) buf.set(ox + TILE - 1 - d, oy + i, GRASS.base);
    }
  }
  for (let i = 0; i < TILE; i++) {
    const depth = EDGE_PROFILE[i];
    const edge = (x: number, y: number) => {
      if (buf.get(x, y) !== GRASS.base) buf.set(x, y, SAND.edge);
    };
    if (!nb.n) edge(ox + i, oy + depth);
    if (!nb.s) edge(ox + i, oy + TILE - 1 - depth);
    if (!nb.w) edge(ox + depth, oy + i);
    if (!nb.e) edge(ox + TILE - 1 - depth, oy + i);
  }

  // Inner corners: path on both sides but grass on the diagonal.
  const corner = (cx: number, cy: number, dx: number, dy: number) => {
    buf.set(cx, cy, GRASS.base);
    buf.set(cx + dx, cy, SAND.edge);
    buf.set(cx, cy + dy, SAND.edge);
  };
  if (nb.n && nb.w && !nb.nw) corner(ox, oy, 1, 1);
  if (nb.n && nb.e && !nb.ne) corner(ox + TILE - 1, oy, -1, 1);
  if (nb.s && nb.w && !nb.sw) corner(ox, oy + TILE - 1, 1, -1);
  if (nb.s && nb.e && !nb.se) corner(ox + TILE - 1, oy + TILE - 1, -1, -1);
}

/** Which of the four neighbouring tiles are also water. */
export interface WaterNeighbours {
  n: boolean;
  s: boolean;
  e: boolean;
  w: boolean;
}

/** How round a pond's outer corners are, in pixels. */
export const POND_ROUNDING = 5;

/** The four ways to step from one pixel to the next one along or across. */
const STEPS = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
] as const;

/** A lily pad: L light, B base, D dark, N the notch cut out of it. */
const LILY_PAD = [".LBB.", "BBBNB", ".DDD."];
const LILY_COLORS: Record<string, string> = {
  L: TALL_GRASS.light,
  B: TALL_GRASS.base,
  D: TALL_GRASS.dark,
  N: WATER.dark,
};

const inTile = (x: number, y: number) => x >= 0 && x < TILE && y >= 0 && y < TILE;

/** Whether a pond tile gives up the pixel at (x, y) to make an outer corner (land on both sides) round. */
function roundedOff(x: number, y: number, nb: WaterNeighbours): boolean {
  const r = POND_ROUNDING;
  const beyond = (cx: number, cy: number) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > r * r;
  if (!nb.n && !nb.w && x < r && y < r) return beyond(r, r);
  if (!nb.n && !nb.e && x >= TILE - r && y < r) return beyond(TILE - r, r);
  if (!nb.s && !nb.w && x < r && y >= TILE - r) return beyond(r, TILE - r);
  if (!nb.s && !nb.e && x >= TILE - r && y >= TILE - r) return beyond(TILE - r, TILE - r);
  return false;
}

/** Whether the pixel at (x, y), which may lie beyond the tile, is water. */
function isWater(x: number, y: number, nb: WaterNeighbours): boolean {
  if (inTile(x, y)) return !roundedOff(x, y, nb);
  if (y >= 0 && y < TILE) return x < 0 ? nb.w : nb.e;
  if (x >= 0 && x < TILE) return y < 0 ? nb.n : nb.s;
  return false;
}

/**
 * A tile of pond: blue water with light ripples, a glint, and now and then a lily pad. Where it meets
 * land it has a dark outline with a line of foam inside it, and an outer corner is rounded off (the
 * pixels it gives up are left clear, so the ground shows through). Two frames (0 and 1) move the ripples
 * and the glint along; `seed` keeps neighbouring tiles from matching.
 */
export function paintWater(
  buf: PixelBuffer,
  ox: number,
  oy: number,
  nb: WaterNeighbours,
  frame: 0 | 1,
  seed = 0,
): void {
  const put = (x: number, y: number, color: string) => {
    if (inTile(x, y) && isWater(x, y, nb)) buf.set(ox + x, oy + y, color);
  };
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) put(x, y, WATER.base);
  // Three ripples: a light streak over a darker one, sliding a few pixels between frames.
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(hash2(seed, i, 41) * 9) + 1 + frame * 3;
    const y = 2 + i * 5 + Math.floor(hash2(seed, i, 42) * 3);
    for (let k = 0; k < 4; k++) put(x + k, y, WATER.light);
    for (let k = 1; k < 4; k++) put(x + k, y + 1, WATER.dark);
  }
  // Some tiles have a lily pad, and a few of those a flower. It stays put.
  if (hash2(seed, 9, 44) < 0.4) {
    const px = 3 + Math.floor(hash2(seed, 10, 45) * 7);
    const py = 5 + Math.floor(hash2(seed, 11, 46) * 4);
    LILY_PAD.forEach((row, dy) =>
      [...row].forEach((ch, dx) => {
        if (LILY_COLORS[ch]) put(px + dx, py + dy, LILY_COLORS[ch]);
      }),
    );
    if (hash2(seed, 12, 47) < 0.4) put(px + 1, py, WATER.lotus);
  }
  // A glint that hops somewhere else in the other frame.
  if (hash2(seed, 5 + frame, 48) < 0.6) {
    const gx = 2 + Math.floor(hash2(seed, 6 + frame, 49) * 12);
    const gy = 3 + Math.floor(hash2(seed, 7 + frame, 50) * 10);
    put(gx, gy, WATER.foam);
  }
  // The shore: an outline on every pixel of water that touches land, and foam just inside it.
  const isEdge = (x: number, y: number) => STEPS.some(([dx, dy]) => !isWater(x + dx, y + dy, nb));
  const besideEdge = (x: number, y: number) =>
    STEPS.some(
      ([dx, dy]) => inTile(x + dx, y + dy) && isWater(x + dx, y + dy, nb) && isEdge(x + dx, y + dy),
    );
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (!isWater(x, y, nb)) continue;
      if (isEdge(x, y)) buf.set(ox + x, oy + y, WATER.edge);
      else if (besideEdge(x, y)) buf.set(ox + x, oy + y, WATER.foam);
    }
  }
}

/** Outdoor props: trees, fences, signs and street furniture. */
import { paintText } from "./font";
import { rle, sym, type Grid } from "./grid";
import { hash2 } from "./noise";
import {
  FENCE,
  FLOWER,
  GLASS,
  LEAF,
  LIT,
  OUTLINE,
  SNORLAX,
  STONE,
  TRUNK,
  WHITE,
  WOOD,
} from "./palette";
import type { PixelBuffer } from "./pixel-buffer";

// ---------------------------------------------------------------- tree (32×32)

const TREE_BLOBS = [
  { x: 16, y: 10, r: 10 },
  { x: 8.5, y: 15, r: 7.5 },
  { x: 23.5, y: 15, r: 7.5 },
  { x: 16, y: 18, r: 9.5 },
];

function inCanopy(x: number, y: number): boolean {
  return TREE_BLOBS.some((b) => (x + 0.5 - b.x) ** 2 + (y + 0.5 - b.y) ** 2 <= b.r * b.r);
}

/** Leaf clusters on a staggered grid; each gets its own highlight, giving a bumpy canopy. */
const LEAF_CLUSTERS = (() => {
  const centres: Array<{ x: number; y: number }> = [];
  for (let row = 0, cy = 3; cy <= 26; row++, cy += 5) {
    for (let cx = row % 2 ? 5 : 2; cx <= 30; cx += 6) {
      if (inCanopy(cx, cy)) centres.push({ x: cx, y: cy });
    }
  }
  return centres;
})();

/** A round, bushy tree occupying 2×2 tiles. Casts a soft shadow on what is already drawn. */
export function paintTree(buf: PixelBuffer, ox: number, oy: number): void {
  buf.shadeEllipse(ox + 16, oy + 29, 12, 3, 0.72);

  buf.rect(ox + 13, oy + 23, 6, 8, TRUNK.base);
  buf.vline(ox + 17, oy + 23, 8, TRUNK.dark);
  buf.vline(ox + 12, oy + 23, 8, OUTLINE);
  buf.vline(ox + 19, oy + 23, 8, OUTLINE);
  buf.hline(ox + 12, oy + 31, 8, OUTLINE);

  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 32; x++) {
      if (!inCanopy(x, y)) continue;
      const edge =
        !inCanopy(x - 1, y) || !inCanopy(x + 1, y) || !inCanopy(x, y - 1) || !inCanopy(x, y + 1);
      if (edge) {
        buf.set(ox + x, oy + y, OUTLINE);
        continue;
      }
      let nearest = LEAF_CLUSTERS[0];
      let best = Infinity;
      for (const c of LEAF_CLUSTERS) {
        const d = (x - c.x) ** 2 + (y - c.y) ** 2;
        if (d < best) {
          best = d;
          nearest = c;
        }
      }
      const local = x - nearest.x + (y - nearest.y);
      const global = (x - 12) * 0.22 + (y - 9) * 0.32;
      const v = local + global + (hash2(x, y, 3) - 0.5) * 1.5;
      const color = v < -2.5 ? LEAF.light : v < 2.5 ? LEAF.base : v < 6 ? LEAF.dark : LEAF.deep;
      buf.set(ox + x, oy + y, color);
    }
  }
}

// ---------------------------------------------------------------- small props (16×16)

export const FENCE_TILE: Grid = {
  palette: { o: FENCE.outline, f: FENCE.base, s: FENCE.shade },
  rows: [
    "16.",
    "16.",
    "3.o7.o4.",
    "2.ofo5.ofo3.",
    "2.ofo5.ofo3.",
    "16o",
    "16f",
    "16s",
    "16o",
    "2.ofo5.ofo3.",
    "2.ofo5.ofo3.",
    "2.ofo5.ofo3.",
    "2.oso5.oso3.",
    "2.3o5.3o3.",
    "16.",
    "16.",
  ].map(rle),
};

export const SIGN_TILE: Grid = {
  palette: { o: WOOD.deep, w: WOOD.light, W: WOOD.base, d: WOOD.dark },
  rows: [
    "16.",
    "16.",
    ".14o.",
    ".o12wo.",
    ".ow10Wdo.",
    ".owW2d2W2d3Wdo.",
    ".ow10Wdo.",
    ".o12do.",
    ".14o.",
    "6.oWdo6.",
    "6.oWdo6.",
    "6.oWdo6.",
    "6.oWdo6.",
    "6.4o6.",
    "16.",
    "16.",
  ].map(rle),
};

export const MAILBOX_TILE: Grid = {
  palette: { o: OUTLINE, r: FLOWER.red, R: FLOWER.redDark, w: WHITE, W: WOOD.base },
  rows: [
    "16.",
    "16.",
    "4.7o5.",
    "3.o7ro4.",
    "3.o7ro4.",
    "3.o2r3w2ro4.",
    "3.o7Ro4.",
    "3.9o4.",
    "6.oWo7.",
    "6.oWo7.",
    "6.oWo7.",
    "6.oWo7.",
    "6.oWo7.",
    "6.3o7.",
    "16.",
    "16.",
  ].map(rle),
};

export const ROCK_TILE: Grid = {
  palette: { o: OUTLINE, l: STONE.light, b: STONE.base, d: STONE.dark, D: STONE.deep },
  rows: [
    rle("16."),
    rle("16."),
    rle("16."),
    rle("16."),
    sym("5.3o"),
    rle("4.o2l4bo4."),
    rle("3.o2l5bdo3."),
    rle("2.o2l6b2do2."),
    rle("2.ol6b3do2."),
    rle("2.o7b3do2."),
    rle("2.o5b5do2."),
    rle("3.o2b4d2Do3."),
    rle("3.o8Do3."),
    sym("4.4o"),
    rle("16."),
    rle("16."),
  ],
};

/** A small round bush, 16×16. */
export function paintBush(buf: PixelBuffer, ox: number, oy: number): void {
  buf.shadeEllipse(ox + 8, oy + 14, 7, 2, 0.75);
  const inside = (x: number, y: number) => (x + 0.5 - 8) ** 2 / 49 + (y + 0.5 - 9) ** 2 / 36 <= 1;
  for (let y = 2; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const v = x - 6 + (y - 6) * 1.2 + (hash2(x, y, 11) - 0.5) * 3;
      const color = edge ? OUTLINE : v < -3 ? LEAF.light : v < 4 ? LEAF.base : LEAF.dark;
      buf.set(ox + x, oy + y, color);
    }
  }
}

// ---------------------------------------------------------------- lamp post (16×32)

/** Street lamp; `lit` glows at night. */
export function paintLamp(buf: PixelBuffer, ox: number, oy: number, lit = false): void {
  buf.shadeEllipse(ox + 8, oy + 30.5, 5, 1.5, 0.72);
  buf.rect(ox + 7, oy + 11, 2, 18, "#4b5064");
  buf.vline(ox + 8, oy + 11, 18, "#343849");
  buf.rect(ox + 5, oy + 28, 6, 3, "#343849");
  buf.hline(ox + 5, oy + 31, 6, OUTLINE);

  const glass = lit ? LIT : GLASS;
  buf.rect(ox + 4, oy + 3, 8, 8, OUTLINE);
  buf.rect(ox + 5, oy + 4, 6, 6, glass.base);
  buf.set(ox + 6, oy + 5, glass.light);
  buf.set(ox + 6, oy + 6, glass.light);
  buf.hline(ox + 5, oy + 9, 6, glass.dark);
  buf.rect(ox + 3, oy + 1, 10, 2, "#4b5064");
  buf.hline(ox + 4, oy, 8, OUTLINE);
}

// ---------------------------------------------------------------- job board (32×32)

/** Notice board with pinned job ads; the town's "roles I'm open to" sign. */
export function paintJobBoard(buf: PixelBuffer, ox: number, oy: number): void {
  buf.shadeEllipse(ox + 16, oy + 30.5, 14, 2, 0.75);
  for (const lx of [4, 26]) {
    buf.rect(ox + lx, oy + 18, 2, 12, WOOD.base);
    buf.vline(ox + lx + 1, oy + 18, 12, WOOD.dark);
    buf.hline(ox + lx, oy + 30, 2, OUTLINE);
  }
  buf.rect(ox + 1, oy + 4, 30, 17, WOOD.deep);
  buf.rect(ox + 2, oy + 5, 28, 15, WOOD.dark);
  buf.rect(ox + 3, oy + 6, 26, 13, "#d9b27c");

  buf.rect(ox + 7, oy + 1, 18, 7, WOOD.deep);
  buf.rect(ox + 8, oy + 2, 16, 5, WOOD.light);
  paintText(buf, "JOBS", ox + 8, oy + 2, WOOD.deep);

  const notes = [
    { x: 5, y: 9, w: 6, h: 8 },
    { x: 13, y: 10, w: 6, h: 7 },
    { x: 21, y: 9, w: 6, h: 8 },
  ];
  for (const n of notes) {
    buf.rect(ox + n.x, oy + n.y, n.w, n.h, WHITE);
    for (let line = n.y + 3; line < n.y + n.h - 1; line += 2) {
      buf.hline(ox + n.x + 1, oy + line, n.w - 2, "#9aa0b0");
    }
    buf.set(ox + n.x + Math.floor(n.w / 2), oy + n.y, FLOWER.red);
  }
}

// ---------------------------------------------------------------- a sleeping giant (32×32)

/**
 * A huge Pokémon asleep on its back, seen from the front, filling two tiles by two: a round dark-teal
 * body with a cream belly, a head with a cream muzzle and shut eyes, and its hands and feet resting up.
 * Drawn here from scratch.
 */
export function paintSnorlax(buf: PixelBuffer, ox: number, oy: number): void {
  const c = SNORLAX;
  buf.shadeEllipse(ox + 16, oy + 29, 15, 3, 0.7);
  // Feet, tucked under the belly.
  for (const fx of [7, 25]) {
    buf.fillEllipse(ox + fx, oy + 27, 5, 3.5, OUTLINE);
    buf.fillEllipse(ox + fx, oy + 27, 4, 2.5, c.belly);
    for (const dx of [-2, 0, 2]) buf.set(ox + fx + dx, oy + 25, c.claw);
  }
  // Turns body-coloured pixels in a band of rows to the darker shade, so the belly of it curves away.
  const shadeRows = (from: number, to: number, x0: number, x1: number) => {
    for (let y = oy + from; y <= oy + to; y++) {
      for (let x = ox + x0; x <= ox + x1; x++) if (buf.get(x, y) === c.body) buf.set(x, y, c.shade);
    }
  };
  // The body, and the belly on it.
  buf.fillEllipse(ox + 16, oy + 19, 15, 11, OUTLINE);
  buf.fillEllipse(ox + 16, oy + 19, 14, 10, c.body);
  shadeRows(26, 28, 0, 31);
  buf.fillEllipse(ox + 16, oy + 22, 9, 6.5, c.bellyShade);
  buf.fillEllipse(ox + 16, oy + 21, 8.5, 6, c.belly);
  // Ears.
  for (const ex of [9, 23]) {
    buf.fillEllipse(ox + ex, oy + 3, 3, 2.5, OUTLINE);
    buf.fillEllipse(ox + ex, oy + 3.5, 2, 1.5, c.body);
  }
  // The head, with a cream muzzle.
  buf.fillEllipse(ox + 16, oy + 10, 9.5, 8, OUTLINE);
  buf.fillEllipse(ox + 16, oy + 10, 8.5, 7, c.body);
  shadeRows(15, 17, 6, 26);
  buf.fillEllipse(ox + 16, oy + 12, 6.5, 4.5, c.belly);
  // Shut eyes (a short line each), a small nose, a small mouth.
  buf.hline(ox + 11, oy + 9, 3, OUTLINE);
  buf.hline(ox + 19, oy + 9, 3, OUTLINE);
  buf.set(ox + 15, oy + 11, OUTLINE);
  buf.set(ox + 17, oy + 11, OUTLINE);
  buf.hline(ox + 14, oy + 14, 5, OUTLINE);
  // Two small lower fangs.
  buf.set(ox + 13, oy + 15, c.claw);
  buf.set(ox + 19, oy + 15, c.claw);
  // Arms folded on its belly.
  for (const ax of [6, 26]) {
    buf.fillEllipse(ox + ax, oy + 19, 4, 3.5, OUTLINE);
    buf.fillEllipse(ox + ax, oy + 19, 3, 2.5, c.body);
    buf.set(ox + ax + (ax < 16 ? 2 : -2), oy + 21, c.claw);
  }
}

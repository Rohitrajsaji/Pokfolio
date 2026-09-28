/** Indoor floors, walls and furniture, painted from simple shapes. */
import { mix, shade } from "./color";
import { paintGrid, rle, type Grid } from "./grid";
import { hash2 } from "./noise";
import { GLASS, LEAF, OUTLINE, POKEBALL, WHITE, WOOD } from "./palette";
import type { PixelBuffer } from "./pixel-buffer";

export const INTERIOR = {
  wood: { light: "#e6c08c", base: "#d6a76c", dark: "#b8864e", line: "#9c6c3a" },
  tile: { a: "#f4f4f6", b: "#e2e6ee", line: "#c9ced9" },
  wall: { base: "#f4e9d2", stripe: "#e9d9b6", trim: "#b58855", shadow: "#d8c49c" },
  labWall: { base: "#e8eef4", stripe: "#d8e2ec", trim: "#7d8fa3", shadow: "#c3cfdc" },
  counter: { top: "#f6f2ea", front: "#d9cdb6", shade: "#b6a88c" },
  metal: { light: "#e3e8f0", base: "#bcc5d2", dark: "#8995a8" },
  screen: { light: "#b8e4fa", base: "#5fb4e8", dark: "#3a86c0" },
  screenGreen: { light: "#c4f5d0", base: "#6fd08a", dark: "#3f9a5a" },
  books: ["#d24b4b", "#4b7ad2", "#4fb05a", "#e0b040", "#8a5ac8", "#e07a3a"],
  pot: { base: "#c96b3c", dark: "#98491f" },
  rug: { base: "#c84a4a", border: "#f0cf6e", dark: "#9a3434" },
  mat: { base: "#b75c3c", stripe: "#e8a978" },
};

// ---------------------------------------------------------------- floors and walls

export function paintWoodFloor(buf: PixelBuffer, x: number, y: number, w: number, h: number) {
  const c = INTERIOR.wood;
  buf.rect(x, y, w, h, c.base);
  for (let row = 0; row < h; row += 4) {
    buf.hline(x, y + row + 3, w, c.line);
    buf.hline(x, y + row, w, c.light);
    const offset = (row / 4) % 2 ? 11 : 3;
    for (let jx = offset; jx < w; jx += 16) buf.vline(x + jx, y + row, 3, c.line);
    for (let gx = 0; gx < w; gx++) {
      if (hash2(gx, row, 5) < 0.08) buf.set(x + gx, y + row + 1 + (gx % 2), c.dark);
    }
  }
}

export function paintTileFloor(buf: PixelBuffer, x: number, y: number, w: number, h: number) {
  const c = INTERIOR.tile;
  for (let ty = 0; ty < h; ty += 8) {
    for (let tx = 0; tx < w; tx += 8) {
      const colour = ((tx + ty) / 8) % 2 ? c.b : c.a;
      buf.rect(x + tx, y + ty, 8, 8, colour);
      buf.hline(x + tx, y + ty + 7, 8, c.line);
      buf.vline(x + tx + 7, y + ty, 8, c.line);
    }
  }
}

type WallStyle = typeof INTERIOR.wall;

/** The back wall of a room: striped wallpaper with a skirting board. */
export function paintBackWall(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  c: WallStyle = INTERIOR.wall,
) {
  buf.rect(x, y, w, h, c.base);
  for (let sx = 2; sx < w; sx += 6) buf.vline(x + sx, y + 3, h - 8, c.stripe);
  buf.hline(x, y, w, OUTLINE);
  buf.rect(x, y + 1, w, 2, c.trim);
  buf.rect(x, y + h - 5, w, 4, c.trim);
  buf.hline(x, y + h - 5, w, mix(c.trim, "#ffffff", 0.3));
  buf.hline(x, y + h - 1, w, c.shadow);
}

export function paintInteriorWindow(buf: PixelBuffer, x: number, y: number) {
  buf.rect(x, y, 16, 13, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 11, GLASS.base);
  buf.hline(x + 1, y + 11, 14, GLASS.dark);
  buf.vline(x + 8, y + 1, 11, OUTLINE);
  for (let i = 0; i < 3; i++) buf.set(x + 2 + i, y + 4 - i, GLASS.light);
  buf.rect(x - 1, y + 13, 18, 2, WOOD.base);
}

// ---------------------------------------------------------------- furniture

export function paintCounter(buf: PixelBuffer, x: number, y: number, w: number, h: number) {
  const c = INTERIOR.counter;
  buf.rect(x, y, w, h, OUTLINE);
  buf.rect(x + 1, y + 1, w - 2, 5, c.top);
  buf.rect(x + 1, y + 6, w - 2, h - 7, c.front);
  buf.hline(x + 1, y + 6, w - 2, c.shade);
  for (let px = x + 8; px < x + w - 2; px += 16) buf.vline(px, y + 8, h - 10, c.shade);
}

export function paintPC(buf: PixelBuffer, x: number, y: number) {
  const m = INTERIOR.metal;
  const s = INTERIOR.screen;
  buf.shadeEllipse(x + 8, y + 19, 7, 2, 0.8);
  buf.rect(x + 1, y + 2, 14, 12, OUTLINE);
  buf.rect(x + 2, y + 3, 12, 10, m.base);
  buf.rect(x + 3, y + 4, 10, 7, s.base);
  buf.hline(x + 4, y + 5, 6, s.light);
  buf.hline(x + 4, y + 7, 4, s.light);
  buf.hline(x + 3, y + 10, 10, s.dark);
  buf.rect(x + 6, y + 14, 4, 2, m.dark);
  buf.rect(x + 3, y + 16, 10, 3, OUTLINE);
  buf.rect(x + 4, y + 16, 8, 2, m.light);
}

export function paintBookshelf(buf: PixelBuffer, x: number, y: number) {
  buf.shadeEllipse(x + 8, y + 28, 8, 2, 0.8);
  buf.rect(x, y, 16, 28, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 26, WOOD.base);
  for (let shelf = 0; shelf < 3; shelf++) {
    const sy = y + 2 + shelf * 8;
    buf.rect(x + 2, sy, 12, 6, WOOD.deep);
    for (let bx = 0; bx < 12; bx += 2) {
      const colour = INTERIOR.books[(bx / 2 + shelf * 2) % INTERIOR.books.length];
      const top = hash2(bx, shelf, 9) < 0.35 ? 1 : 0;
      buf.rect(x + 2 + bx, sy + top, 2, 6 - top, colour);
      buf.vline(x + 3 + bx, sy + top, 6 - top, shade(colour, 0.25));
    }
    buf.hline(x + 1, sy + 6, 14, WOOD.dark);
  }
}

export function paintPlant(buf: PixelBuffer, x: number, y: number) {
  buf.shadeEllipse(x + 8, y + 19, 6, 2, 0.78);
  buf.rect(x + 4, y + 12, 8, 7, OUTLINE);
  buf.rect(x + 5, y + 12, 6, 6, INTERIOR.pot.base);
  buf.vline(x + 10, y + 12, 6, INTERIOR.pot.dark);
  buf.hline(x + 4, y + 12, 8, INTERIOR.pot.dark);
  const leaves = [
    { cx: 8, cy: 6, rx: 5, ry: 5 },
    { cx: 4.5, cy: 9, rx: 3.5, ry: 3 },
    { cx: 11.5, cy: 9, rx: 3.5, ry: 3 },
  ];
  for (const l of leaves) buf.fillEllipse(x + l.cx, y + l.cy, l.rx + 1, l.ry + 1, OUTLINE);
  for (const l of leaves) buf.fillEllipse(x + l.cx, y + l.cy, l.rx, l.ry, LEAF.base);
  buf.fillEllipse(x + 6.5, y + 4.5, 2, 2, LEAF.light);
  buf.fillEllipse(x + 10, y + 10, 2, 1.5, LEAF.dark);
}

/** A lab machine; one per project in Prof. Rohit's Lab. */
export function paintMachine(buf: PixelBuffer, x: number, y: number, accent: string) {
  const m = INTERIOR.metal;
  const s = INTERIOR.screenGreen;
  buf.shadeEllipse(x + 8, y + 28, 8, 2, 0.8);
  buf.rect(x, y, 16, 28, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 26, m.base);
  buf.vline(x + 1, y + 1, 26, m.light);
  buf.vline(x + 14, y + 1, 26, m.dark);
  buf.rect(x + 1, y + 1, 14, 3, accent);
  buf.rect(x + 3, y + 6, 10, 8, OUTLINE);
  buf.rect(x + 4, y + 7, 8, 6, s.base);
  buf.hline(x + 5, y + 8, 5, s.light);
  buf.hline(x + 5, y + 10, 3, s.light);
  buf.set(x + 4, y + 17, "#e5463d");
  buf.set(x + 7, y + 17, "#f2c94c");
  buf.set(x + 10, y + 17, "#6fd08a");
  for (let vy = y + 20; vy < y + 26; vy += 2) buf.hline(x + 3, vy, 10, m.dark);
}

export function paintTable(buf: PixelBuffer, x: number, y: number, w: number, h: number) {
  buf.shadeEllipse(x + w / 2, y + h + 1, w / 2, 2, 0.8);
  buf.rect(x, y, w, h - 3, OUTLINE);
  buf.rect(x + 1, y + 1, w - 2, h - 5, WOOD.light);
  buf.hline(x + 1, y + h - 5, w - 2, WOOD.dark);
  for (const lx of [x + 1, x + w - 3]) buf.rect(lx, y + h - 3, 2, 3, WOOD.deep);
}

/** A few sheets of notes, for desks and tables. */
export function paintPapers(buf: PixelBuffer, x: number, y: number) {
  for (const [dx, dy] of [
    [0, 1],
    [3, 0],
  ]) {
    buf.rect(x + dx, y + dy, 8, 6, OUTLINE);
    buf.rect(x + dx + 1, y + dy + 1, 6, 4, WHITE);
    buf.hline(x + dx + 2, y + dy + 2, 4, "#9aa0b0");
    buf.hline(x + dx + 2, y + dy + 4, 3, "#9aa0b0");
  }
}

export function paintRug(buf: PixelBuffer, x: number, y: number, w: number, h: number) {
  const c = INTERIOR.rug;
  buf.rect(x, y, w, h, c.dark);
  buf.rect(x + 1, y + 1, w - 2, h - 2, c.border);
  buf.rect(x + 3, y + 3, w - 6, h - 6, c.base);
  for (let px = x + 6; px < x + w - 6; px += 6) buf.set(px, y + Math.floor(h / 2), c.border);
}

/** Door mat on the bottom edge of a room: step on it to leave. */
export function paintExitMat(buf: PixelBuffer, x: number, y: number) {
  buf.rect(x + 1, y + 2, 14, 12, INTERIOR.mat.base);
  for (let sy = y + 4; sy < y + 13; sy += 3) buf.hline(x + 3, sy, 10, INTERIOR.mat.stripe);
}

const HEAL_BALL: Grid = {
  palette: { o: OUTLINE, r: POKEBALL.red, w: POKEBALL.white },
  rows: ["4o", "o2ro", "4o", "o2wo"].map(rle),
};

/** Healing machine on the Pokémon Center counter, 32×14. */
export function paintHealMachine(buf: PixelBuffer, x: number, y: number) {
  const m = INTERIOR.metal;
  buf.rect(x, y, 32, 14, OUTLINE);
  buf.rect(x + 1, y + 1, 30, 12, m.base);
  buf.hline(x + 1, y + 1, 30, m.light);
  buf.rect(x + 2, y + 3, 28, 8, m.dark);
  for (let i = 0; i < 6; i++) {
    const bx = x + 3 + (i % 3) * 9;
    const by = y + 3 + Math.floor(i / 3) * 4;
    paintGrid(buf, HEAL_BALL, bx + 1, by);
  }
}

/** Framed poster; the colours hint at what's on it. */
export function paintPoster(buf: PixelBuffer, x: number, y: number, colours: [string, string]) {
  buf.rect(x, y, 12, 10, OUTLINE);
  buf.rect(x + 1, y + 1, 10, 8, WHITE);
  buf.rect(x + 2, y + 2, 8, 3, colours[0]);
  buf.rect(x + 2, y + 6, 5, 2, colours[1]);
}

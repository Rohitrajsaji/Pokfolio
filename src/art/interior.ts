/** Indoor floors, walls and furniture, painted from simple shapes. */
import { mix, shade } from "./color";
import { paintGrid, rle, type Grid } from "./grid";
import { hash2 } from "./noise";
import { GLASS, GOLD, LEAF, OUTLINE, POKEBALL, STONE, WHITE, WOOD } from "./palette";
import { PixelBuffer } from "./pixel-buffer";
import { paintVoltorb } from "./voltorb";

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

/**
 * Framed poster; the colours hint at what's on it. A crooked one hangs a little lower on its right:
 * a step down every four columns, the way a poster looks when it's swung on a hidden switch.
 */
export function paintPoster(
  buf: PixelBuffer,
  x: number,
  y: number,
  colours: [string, string],
  crooked = false,
) {
  if (!crooked) return paintStraightPoster(buf, x, y, colours);
  const flat = new PixelBuffer(12, 10);
  paintStraightPoster(flat, 0, 0, colours);
  for (let cx = 0; cx < 12; cx++) {
    const drop = Math.floor(cx / 4);
    for (let cy = 0; cy < 10; cy++) {
      const colour = flat.get(cx, cy);
      if (colour) buf.set(x + cx, y + cy + drop, colour);
    }
  }
}

function paintStraightPoster(buf: PixelBuffer, x: number, y: number, colours: [string, string]) {
  buf.rect(x, y, 12, 10, OUTLINE);
  buf.rect(x + 1, y + 1, 10, 8, WHITE);
  buf.rect(x + 2, y + 2, 8, 3, colours[0]);
  buf.rect(x + 2, y + 6, 5, 2, colours[1]);
}

/** A framed document on the wall, 12×11: a diploma has a blue seal, a certificate a red one. */
export function paintFrame(
  buf: PixelBuffer,
  x: number,
  y: number,
  kind: "diploma" | "certificate",
) {
  buf.rect(x, y, 12, 11, WOOD.dark);
  buf.rect(x + 1, y + 1, 10, 9, "#fbf7ea");
  buf.hline(x + 3, y + 3, 6, "#9aa0b0");
  buf.hline(x + 3, y + 5, 4, "#9aa0b0");
  const seal = kind === "diploma" ? "#4b7ad2" : "#d24b4b";
  buf.rect(x + 7, y + 6, 3, 3, seal);
  buf.set(x + 7, y + 9, seal);
  buf.set(x + 9, y + 9, seal);
}

/** Television on a low stand, 16×20. */
export function paintTV(buf: PixelBuffer, x: number, y: number) {
  const s = INTERIOR.screen;
  buf.shadeEllipse(x + 8, y + 19, 8, 2, 0.8);
  buf.set(x + 5, y, OUTLINE);
  buf.set(x + 6, y + 1, OUTLINE);
  buf.set(x + 11, y, OUTLINE);
  buf.set(x + 10, y + 1, OUTLINE);
  buf.rect(x + 1, y + 2, 14, 11, OUTLINE);
  buf.rect(x + 2, y + 3, 12, 9, "#4a4f63");
  buf.rect(x + 3, y + 4, 10, 7, s.base);
  buf.rect(x + 5, y + 5, 6, 4, WHITE);
  buf.rect(x + 6, y + 6, 2, 2, "#e5463d");
  buf.hline(x + 9, y + 6, 1, "#9aa0b0");
  buf.hline(x + 3, y + 10, 10, s.dark);
  buf.rect(x + 1, y + 13, 14, 6, OUTLINE);
  buf.rect(x + 2, y + 13, 12, 5, WOOD.base);
  buf.hline(x + 2, y + 15, 12, WOOD.dark);
}

/** Single bed, 16×32 (two tiles tall). */
export function paintBed(buf: PixelBuffer, x: number, y: number) {
  buf.shadeEllipse(x + 8, y + 31, 8, 2, 0.8);
  buf.rect(x, y, 16, 31, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 5, WOOD.base);
  buf.hline(x + 1, y + 1, 14, WOOD.light);
  buf.rect(x + 2, y + 6, 12, 6, WHITE);
  buf.hline(x + 2, y + 11, 12, "#d6d8e2");
  buf.rect(x + 1, y + 12, 14, 18, "#5a86e0");
  buf.hline(x + 1, y + 14, 14, "#8cabf2");
  buf.vline(x + 14, y + 12, 18, "#3f68c4");
}

/** Shop shelf with boxes and bottles, 16×28. */
export function paintShelf(buf: PixelBuffer, x: number, y: number) {
  const m = INTERIOR.metal;
  const stock = ["#e5463d", "#5a86e0", "#6fd08a", "#f2c94c", "#a56de2"];
  buf.shadeEllipse(x + 8, y + 28, 8, 2, 0.8);
  buf.rect(x, y, 16, 28, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 26, m.light);
  for (let shelf = 0; shelf < 3; shelf++) {
    const sy = y + 2 + shelf * 8;
    for (let i = 0; i < 3; i++) {
      const colour = stock[(i + shelf * 2) % stock.length];
      const top = i % 2 ? 1 : 0;
      buf.rect(x + 2 + i * 4, sy + top, 3, 6 - top, colour);
      buf.set(x + 2 + i * 4, sy + top, "#ffffff");
    }
    buf.hline(x + 1, sy + 6, 14, m.dark);
  }
}

/** Small desk for a PC, 16×9. */
export function paintDesk(buf: PixelBuffer, x: number, y: number) {
  buf.rect(x, y, 16, 6, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 4, WOOD.light);
  buf.hline(x + 1, y + 4, 14, WOOD.dark);
  for (const lx of [x + 1, x + 13]) buf.rect(lx, y + 6, 2, 3, WOOD.deep);
}

/** Stone pedestal with a glowing orb in the given colour, 16×28. */
export function paintPedestal(buf: PixelBuffer, x: number, y: number, orb: string) {
  buf.shadeEllipse(x + 8, y + 27, 8, 2, 0.8);
  buf.rect(x + 1, y + 21, 14, 7, OUTLINE);
  buf.rect(x + 2, y + 22, 12, 5, STONE.dark);
  buf.hline(x + 2, y + 22, 12, STONE.base);
  buf.rect(x + 3, y + 10, 10, 11, OUTLINE);
  buf.rect(x + 4, y + 10, 8, 11, STONE.base);
  buf.vline(x + 4, y + 10, 11, STONE.light);
  buf.vline(x + 11, y + 10, 11, STONE.dark);
  buf.rect(x + 1, y + 8, 14, 3, OUTLINE);
  buf.rect(x + 2, y + 8, 12, 2, STONE.light);
  buf.rect(x + 6, y + 13, 4, 3, GOLD.base);
  buf.fillEllipse(x + 8, y + 5, 4.5, 4.5, OUTLINE);
  buf.fillEllipse(x + 8, y + 5, 3.5, 3.5, orb);
  buf.set(x + 6, y + 3, WHITE);
  buf.set(x + 7, y + 3, WHITE);
}

/** Gym entrance statue: a stone Poké Ball on a plinth, 16×28. */
export function paintStatue(buf: PixelBuffer, x: number, y: number) {
  buf.shadeEllipse(x + 8, y + 27, 8, 2, 0.8);
  buf.rect(x + 1, y + 14, 14, 14, OUTLINE);
  buf.rect(x + 2, y + 15, 12, 12, STONE.base);
  buf.vline(x + 2, y + 15, 12, STONE.light);
  buf.vline(x + 13, y + 15, 12, STONE.dark);
  buf.rect(x + 5, y + 19, 6, 3, GOLD.base);
  buf.fillEllipse(x + 8, y + 8, 6.5, 6.5, OUTLINE);
  buf.fillEllipse(x + 8, y + 8, 5.5, 5.5, STONE.light);
  for (let yy = y + 2; yy < y + 8; yy++) {
    for (let xx = x + 2; xx < x + 14; xx++)
      if (buf.get(xx, yy) === STONE.light) buf.set(xx, yy, STONE.base);
  }
  buf.hline(x + 2, y + 8, 12, OUTLINE);
  buf.fillEllipse(x + 8, y + 8.5, 2, 2, OUTLINE);
  buf.set(x + 8, y + 8, STONE.light);
}

// ---------------------------------------------------------------- the hidden arcade

export const ARCADE = {
  wall: { base: "#2b2547", stripe: "#362e5c", trim: "#7657c4", shadow: "#1c1832" },
  carpet: { base: "#3b2f6e", dot: "#54459a", line: "#2a2150" },
  cabinet: { body: "#2c3c92", dark: "#1a2664", light: "#4f66d8", screen: "#10142e" },
  slots: { body: "#b8323c", dark: "#7c1f28", light: "#e5646c" },
  /** Steps down into the dark: the far ones darkest. */
  stairs: ["#1a1529", "#241d3b", "#31284f", "#43376a", "#5a4b8a"],
};

/** Dark carpet with a small diamond in every square. */
export function paintCarpetFloor(buf: PixelBuffer, x: number, y: number, w: number, h: number) {
  const c = ARCADE.carpet;
  buf.rect(x, y, w, h, c.base);
  for (let ty = 0; ty < h; ty += 8) {
    for (let tx = 0; tx < w; tx += 8) {
      buf.rect(x + tx + 3, y + ty + 2, 2, 4, c.dot);
      buf.rect(x + tx + 2, y + ty + 3, 4, 2, c.dot);
      if ((tx / 8 + ty / 8) % 2 === 0) buf.set(x + tx, y + ty, c.line);
    }
  }
}

/** A staircase down into the floor, opened in the back wall where a poster used to hang, 16×32. */
export function paintStairs(buf: PixelBuffer, x: number, y: number) {
  buf.rect(x + 1, y + 7, 14, 25, OUTLINE);
  buf.rect(x + 2, y + 8, 12, 24, ARCADE.stairs[0]);
  ARCADE.stairs.forEach((colour, i) => {
    const top = y + 12 + i * 4;
    buf.rect(x + 2, top, 12, 4, colour);
    buf.hline(x + 2, top, 12, mix(colour, "#ffffff", 0.22));
  });
  // A faint glow from below, and the handrail's posts.
  buf.hline(x + 3, y + 31, 10, GOLD.dark);
  buf.vline(x + 1, y + 10, 21, WOOD.dark);
  buf.vline(x + 14, y + 10, 21, WOOD.dark);
}

/** A Voltorb Flip cabinet against the wall, 16×28. */
export function paintCabinet(buf: PixelBuffer, x: number, y: number) {
  const c = ARCADE.cabinet;
  buf.shadeEllipse(x + 8, y + 28, 8, 2, 0.8);
  buf.rect(x, y, 16, 28, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 26, c.body);
  buf.vline(x + 1, y + 1, 26, c.light);
  buf.vline(x + 14, y + 1, 26, c.dark);
  // The marquee: four glowing "letters".
  buf.rect(x + 2, y + 2, 12, 5, c.dark);
  for (let i = 0; i < 4; i++) buf.rect(x + 3 + i * 3, y + 4, 2, 1, GOLD.base);
  // The screen, showing a Voltorb.
  buf.rect(x + 2, y + 8, 12, 10, OUTLINE);
  buf.rect(x + 3, y + 9, 10, 8, c.screen);
  paintVoltorb(buf, x + 4, y + 9);
  // The controls: a stick and two buttons on a sloped deck, then the coin slot.
  buf.rect(x + 2, y + 19, 12, 4, c.light);
  buf.rect(x + 4, y + 20, 2, 2, POKEBALL.red);
  buf.rect(x + 9, y + 20, 2, 2, GOLD.base);
  buf.rect(x + 12, y + 20, 1, 2, POKEBALL.red);
  buf.rect(x + 6, y + 24, 4, 2, OUTLINE);
  buf.hline(x + 7, y + 25, 2, GOLD.light);
}

/** A slot machine against the wall, 16×28. */
export function paintSlotMachine(buf: PixelBuffer, x: number, y: number) {
  const c = ARCADE.slots;
  buf.shadeEllipse(x + 8, y + 28, 8, 2, 0.8);
  buf.rect(x, y, 16, 28, OUTLINE);
  buf.rect(x + 1, y + 1, 14, 26, c.body);
  buf.vline(x + 1, y + 1, 26, c.light);
  buf.vline(x + 14, y + 1, 26, c.dark);
  // Marquee bulbs, alternating.
  buf.rect(x + 2, y + 2, 12, 4, c.dark);
  for (let i = 0; i < 6; i++) buf.set(x + 3 + i * 2, y + 3, i % 2 ? GOLD.light : POKEBALL.white);
  // Three reels: a seven, a cherry, a bar.
  buf.rect(x + 2, y + 8, 12, 9, OUTLINE);
  buf.rect(x + 3, y + 9, 10, 7, WHITE);
  buf.vline(x + 6, y + 9, 7, "#c9ced9");
  buf.vline(x + 10, y + 9, 7, "#c9ced9");
  buf.rect(x + 4, y + 10, 2, 1, POKEBALL.red);
  buf.rect(x + 5, y + 11, 1, 3, POKEBALL.red);
  buf.rect(x + 7, y + 12, 2, 2, POKEBALL.red);
  buf.set(x + 8, y + 11, LEAF.base);
  buf.rect(x + 11, y + 11, 2, 3, OUTLINE);
  // A tray for the coins.
  buf.rect(x + 3, y + 19, 10, 3, c.dark);
  buf.rect(x + 4, y + 22, 8, 3, OUTLINE);
  buf.hline(x + 5, y + 23, 6, GOLD.base);
}

/** A round fossil on a stone stand, 16×24: a spiral shell like an Omanyte's. */
export function paintFossil(buf: PixelBuffer, x: number, y: number) {
  buf.shadeEllipse(x + 8, y + 23, 7, 2, 0.8);
  buf.rect(x + 3, y + 19, 10, 5, OUTLINE);
  buf.rect(x + 4, y + 20, 8, 3, STONE.dark);
  buf.rect(x + 6, y + 13, 4, 6, OUTLINE);
  buf.rect(x + 7, y + 13, 2, 6, STONE.base);
  buf.rect(x + 1, y + 11, 14, 3, OUTLINE);
  buf.rect(x + 2, y + 11, 12, 2, STONE.light);
  const shell = "#c9b28a";
  const line = "#6f5a3c";
  buf.fillEllipse(x + 8, y + 5, 6, 5.5, line);
  buf.fillEllipse(x + 8, y + 5, 5, 4.5, shell);
  for (let t = 0; t < 9.6; t += 0.11) {
    const r = 0.6 + t * 0.38;
    buf.set(Math.round(x + 8 + Math.cos(t) * r), Math.round(y + 5 + Math.sin(t) * r * 0.9), line);
  }
}

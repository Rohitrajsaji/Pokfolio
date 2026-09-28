/**
 * Buildings, painted from simple parts (roof, wall, windows, door, sign) so
 * sizes and colours are easy to change. Each knows its size and door tile,
 * which the engine uses for collisions and entrances.
 */
import { mix } from "./color";
import { paintText, textWidth } from "./font";
import { paintGrid, rle, type Grid } from "./grid";
import {
  DOOR,
  GLASS,
  GOLD,
  LIT,
  OUTLINE,
  POKEBALL,
  ROOFS,
  WALLS,
  type RoofColors,
  type WallColors,
} from "./palette";
import type { PixelBuffer } from "./pixel-buffer";

export type BuildingId = "house" | "lab" | "center" | "mart" | "gym";

export interface PaintOptions {
  /** Night mode: windows and glass doors glow. */
  lit?: boolean;
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  widthTiles: number;
  heightTiles: number;
  /** Door tile, relative to the building's top-left tile. */
  door: { x: number; y: number };
  paint(buf: PixelBuffer, ox: number, oy: number, options?: PaintOptions): void;
}

// ---------------------------------------------------------------- parts

function roof(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  c: RoofColors,
  style: "shingle" | "smooth",
): void {
  buf.rect(x, y, w, h, c.base);
  if (style === "shingle") {
    for (let row = y + 3, course = 0; row + 3 < y + h - 3; row += 4, course++) {
      buf.hline(x, row + 3, w, c.shade);
      for (let sx = x + (course % 2 ? 4 : 0); sx < x + w; sx += 8) buf.vline(sx, row, 3, c.shade);
    }
  } else {
    const band = Math.floor((h - 5) / 3);
    buf.rect(x, y + 2, w, band, mix(c.base, c.light, 0.45));
    buf.hline(x, y + 2 + band, w, c.shade);
    for (let sx = x + 8; sx < x + w - 1; sx += 16) {
      buf.vline(sx, y + 3 + band, h - 6 - band, c.shade);
    }
  }
  buf.hline(x, y, w, OUTLINE);
  buf.hline(x + 1, y + 1, w - 2, c.light);
  buf.hline(x, y + h - 3, w, c.shade);
  buf.hline(x, y + h - 2, w, c.dark);
  buf.hline(x, y + h - 1, w, OUTLINE);
  buf.vline(x, y, h, OUTLINE);
  buf.vline(x + w - 1, y, h, OUTLINE);
}

function wall(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  c: WallColors,
  siding = false,
): void {
  buf.rect(x, y, w, h, c.base);
  if (siding)
    for (let row = y + 5; row < y + h - 4; row += 4) buf.hline(x + 1, row, w - 2, c.shade);
  buf.hline(x, y, w, c.dark);
  buf.hline(x, y + 1, w, c.shade);
  buf.vline(x + 1, y + 2, h - 5, c.light);
  buf.hline(x, y + h - 3, w, c.shade);
  buf.hline(x, y + h - 2, w, c.dark);
  buf.hline(x, y + h - 1, w, OUTLINE);
  buf.vline(x, y, h, OUTLINE);
  buf.vline(x + w - 1, y, h, OUTLINE);
}

function windowPane(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  lit: boolean,
  sill: string,
): void {
  const glass = lit ? LIT : GLASS;
  buf.rect(x, y, w, h, GLASS.frame);
  buf.rect(x + 1, y + 1, w - 2, h - 2, glass.base);
  buf.hline(x + 1, y + h - 2, w - 2, glass.dark);
  const midX = x + Math.floor(w / 2);
  const midY = y + Math.floor(h / 2);
  buf.vline(midX, y + 1, h - 2, GLASS.frame);
  buf.hline(x + 1, midY, w - 2, GLASS.frame);
  for (const px of [x + 2, midX + 2]) {
    buf.set(px, y + 2, glass.light);
    buf.set(px + 1, y + 2, glass.light);
    buf.set(px, y + 3, glass.light);
  }
  buf.hline(x - 1, y + h, w + 2, sill);
}

function door(
  buf: PixelBuffer,
  x: number,
  y: number,
  h: number,
  kind: "wood" | "glass",
  lit: boolean,
): void {
  buf.rect(x, y, 16, h, OUTLINE);
  if (kind === "wood") {
    buf.rect(x + 2, y + 2, 12, h - 2, DOOR.base);
    buf.vline(x + 12, y + 2, h - 2, DOOR.dark);
    buf.rect(x + 4, y + 4, 7, 5, DOOR.dark);
    buf.rect(x + 5, y + 5, 5, 3, DOOR.light);
    buf.rect(x + 4, y + 11, 7, h - 13, DOOR.dark);
    buf.rect(x + 5, y + 12, 5, h - 15, DOOR.light);
    buf.set(x + 10, y + 10, GOLD.base);
    return;
  }
  const glass = lit ? LIT : GLASS;
  buf.rect(x + 1, y + 1, 14, h - 1, glass.base);
  buf.rect(x + 1, y + 1, 14, 2, GLASS.frame);
  buf.vline(x + 7, y + 3, h - 3, GLASS.frame);
  buf.vline(x + 8, y + 3, h - 3, GLASS.frame);
  for (const px of [x + 2, x + 10]) {
    for (let i = 0; i < 4; i++) buf.set(px + i, y + 8 - i, glass.light);
  }
  buf.hline(x + 1, y + h - 1, 14, glass.dark);
}

function signPanel(
  buf: PixelBuffer,
  x: number,
  y: number,
  w: number,
  h: number,
  background: string,
  ink: string,
  text: string,
): void {
  buf.rect(x, y, w, h, OUTLINE);
  buf.rect(x + 1, y + 1, w - 2, h - 2, background);
  const tx = x + Math.floor((w - textWidth(text)) / 2);
  const ty = y + Math.floor((h - 5) / 2);
  paintText(buf, text, tx, ty, ink);
}

const POKEBALL_ICON: Grid = {
  palette: { o: OUTLINE, r: POKEBALL.red, w: POKEBALL.white, W: "#d6d8e2" },
  rows: [
    "4.4o4.",
    "2.2o4r2o2.",
    ".or2w5ro.",
    ".orw6ro.",
    "o3r4o3ro",
    "5o2w5o",
    "5o2w5o",
    "o3w4o3wo",
    ".o8wo.",
    ".o8Wo.",
    "2.2o4W2o2.",
    "4.4o4.",
  ].map(rle),
};

const BADGE_ICON: Grid = {
  palette: { o: "#7a5418", y: GOLD.base, l: GOLD.light, Y: GOLD.dark },
  rows: [
    "6.o6.",
    "5.oyo5.",
    "4.oylyo4.",
    "3.oyllyyo3.",
    "2.oyllyyyyo2.",
    ".oylyyyyyYyo.",
    "oyyyyyyyyyYYo",
    ".oyyyyyyyYYo.",
    "2.oyyyyyYYo2.",
    "3.oyyyYYo3.",
    "4.oyYYo4.",
    "5.oYo5.",
    "6.o6.",
  ].map(rle),
};

/** The small icons used on signs, exposed for validation. */
export const BUILDING_ICONS = { pokeball: POKEBALL_ICON, badge: BADGE_ICON };

// ---------------------------------------------------------------- buildings

const house: BuildingDef = {
  id: "house",
  name: "ROHIT'S HOUSE",
  widthTiles: 5,
  heightTiles: 4,
  door: { x: 2, y: 3 },
  paint(buf, ox, oy, { lit = false } = {}) {
    wall(buf, ox, oy + 34, 80, 30, WALLS.cream, true);
    roof(buf, ox, oy, 80, 34, ROOFS.orange, "shingle");
    buf.rect(ox + 59, oy + 2, 10, 3, OUTLINE);
    buf.rect(ox + 60, oy + 5, 8, 9, OUTLINE);
    buf.rect(ox + 61, oy + 5, 6, 8, "#b5654a");
    buf.hline(ox + 61, oy + 8, 6, "#8f4a34");
    buf.rect(ox + 60, oy + 3, 8, 1, "#8f4a34");
    windowPane(buf, ox + 8, oy + 41, 16, 12, lit, WALLS.cream.light);
    windowPane(buf, ox + 56, oy + 41, 16, 12, lit, WALLS.cream.light);
    door(buf, ox + 32, oy + 44, 20, "wood", lit);
  },
};

const center: BuildingDef = {
  id: "center",
  name: "POKéMON CENTER",
  widthTiles: 5,
  heightTiles: 4,
  door: { x: 2, y: 3 },
  paint(buf, ox, oy, { lit = false } = {}) {
    wall(buf, ox, oy + 30, 80, 34, WALLS.white);
    buf.rect(ox + 1, oy + 32, 78, 3, ROOFS.red.base);
    buf.hline(ox + 1, oy + 35, 78, ROOFS.red.shade);
    roof(buf, ox, oy, 80, 30, ROOFS.red, "smooth");
    buf.rect(ox + 22, oy + 7, 36, 16, OUTLINE);
    buf.rect(ox + 23, oy + 8, 34, 14, POKEBALL.white);
    paintGrid(buf, POKEBALL_ICON, ox + 29, oy + 9);
    paintText(buf, "PC", ox + 44, oy + 13, POKEBALL.red);
    windowPane(buf, ox + 6, oy + 40, 20, 14, lit, WALLS.white.light);
    windowPane(buf, ox + 54, oy + 40, 20, 14, lit, WALLS.white.light);
    door(buf, ox + 32, oy + 44, 20, "glass", lit);
  },
};

const mart: BuildingDef = {
  id: "mart",
  name: "POKé MART",
  widthTiles: 4,
  heightTiles: 4,
  door: { x: 1, y: 3 },
  paint(buf, ox, oy, { lit = false } = {}) {
    wall(buf, ox, oy + 30, 64, 34, WALLS.white);
    buf.rect(ox + 1, oy + 32, 62, 3, ROOFS.blue.base);
    buf.hline(ox + 1, oy + 35, 62, ROOFS.blue.shade);
    roof(buf, ox, oy, 64, 30, ROOFS.blue, "smooth");
    signPanel(buf, ox + 14, oy + 10, 36, 11, ROOFS.blue.dark, "#ffffff", "MART");
    door(buf, ox + 16, oy + 44, 20, "glass", lit);
    windowPane(buf, ox + 38, oy + 40, 20, 14, lit, WALLS.white.light);
  },
};

const lab: BuildingDef = {
  id: "lab",
  name: "PROF. ROHIT'S LAB",
  widthTiles: 7,
  heightTiles: 5,
  door: { x: 3, y: 4 },
  paint(buf, ox, oy, { lit = false } = {}) {
    wall(buf, ox, oy + 38, 112, 42, WALLS.white);
    buf.rect(ox + 1, oy + 40, 110, 2, ROOFS.slate.shade);
    roof(buf, ox, oy, 112, 38, ROOFS.slate, "smooth");

    // Satellite dish and antenna: this is where the agents live.
    buf.rect(ox + 92, oy + 14, 3, 8, "#5d6578");
    buf.fillEllipse(ox + 93.5, oy + 10, 8, 6, OUTLINE);
    buf.fillEllipse(ox + 93.5, oy + 10, 7, 5, "#e8edf4");
    buf.fillEllipse(ox + 94.5, oy + 11, 4, 3, "#c7cfdb");
    buf.set(ox + 93, oy + 9, "#e5463d");
    buf.vline(ox + 18, oy + 3, 12, "#5d6578");
    buf.rect(ox + 17, oy + 2, 3, 2, "#e5463d");
    buf.hline(ox + 15, oy + 8, 7, "#5d6578");

    for (const wx of [6, 24, 72, 90])
      windowPane(buf, ox + wx, oy + 47, 16, 12, lit, WALLS.white.light);
    signPanel(buf, ox + 44, oy + 45, 24, 11, ROOFS.slate.dark, "#ffffff", "LAB");
    door(buf, ox + 48, oy + 60, 20, "glass", lit);
  },
};

const gym: BuildingDef = {
  id: "gym",
  name: "CAREER GYM",
  widthTiles: 7,
  heightTiles: 5,
  door: { x: 3, y: 4 },
  paint(buf, ox, oy, { lit = false } = {}) {
    wall(buf, ox, oy + 36, 112, 44, WALLS.stone);
    roof(buf, ox, oy, 112, 36, ROOFS.green, "shingle");
    buf.rect(ox + 47, oy + 10, 18, 17, ROOFS.green.dark);
    paintGrid(buf, BADGE_ICON, ox + 50, oy + 12);

    for (const px of [38, 70]) {
      buf.rect(ox + px, oy + 38, 4, 39, WALLS.stone.light);
      buf.vline(ox + px + 3, oy + 38, 39, WALLS.stone.shade);
      buf.vline(ox + px - 1, oy + 38, 39, WALLS.stone.dark);
      buf.vline(ox + px + 4, oy + 38, 39, WALLS.stone.dark);
    }
    signPanel(buf, ox + 44, oy + 42, 24, 11, ROOFS.green.dark, GOLD.base, "GYM");
    for (const wx of [8, 22, 76, 90])
      windowPane(buf, ox + wx, oy + 48, 13, 14, lit, WALLS.stone.light);
    door(buf, ox + 48, oy + 58, 22, "glass", lit);
  },
};

export const BUILDINGS: Readonly<Record<BuildingId, BuildingDef>> = {
  house,
  lab,
  center,
  mart,
  gym,
};

/**
 * Composes outdoor scenes: ground from an ASCII map, then trees, buildings,
 * props and characters drawn back to front so nearer things overlap farther ones.
 */
import { BUILDINGS, type BuildingId } from "./buildings";
import { characterFrame, type CharacterLook, type Facing, type Step } from "./characters";
import { paintGrid, type Grid } from "./grid";
import { hash2 } from "./noise";
import type { PixelBuffer } from "./pixel-buffer";
import { paintBush, paintJobBoard, paintLamp, paintTree } from "./props";
import {
  GRASS_PLAIN,
  GRASS_TUFTS,
  RED_FLOWER_FRAMES,
  TALL_GRASS_FRAMES,
  TILE,
  YELLOW_FLOWER_FRAMES,
  paintPath,
  type PathNeighbours,
} from "./terrain";

/** Something drawn on top of the ground, positioned in tiles. */
export type Placed =
  | { kind: "building"; id: BuildingId; x: number; y: number }
  | { kind: "tile"; grid: Grid; x: number; y: number }
  | { kind: "tree" | "bush" | "lamp" | "jobBoard"; x: number; y: number }
  | {
      kind: "character";
      look: CharacterLook;
      facing: Facing;
      walking?: boolean;
      x: number;
      y: number;
    };

function isPath(rows: readonly string[], x: number, y: number): boolean {
  const ch = rows[y]?.[x];
  // Paths run off the edge of the map rather than ending in a border.
  return ch === undefined || ch === "=";
}

function neighbours(rows: readonly string[], x: number, y: number): PathNeighbours {
  const at = (dx: number, dy: number) => isPath(rows, x + dx, y + dy);
  return {
    n: at(0, -1),
    s: at(0, 1),
    e: at(1, 0),
    w: at(-1, 0),
    ne: at(1, -1),
    nw: at(-1, -1),
    se: at(1, 1),
    sw: at(-1, 1),
  };
}

/**
 * Paints the ground layer of an ASCII map: . grass, = path, " tall grass,
 * * red flowers, + yellow flowers. Anything else is drawn as grass.
 * `frame` animates the flowers.
 */
export function paintGround(buf: PixelBuffer, rows: readonly string[], frame = 0): void {
  rows.forEach((row, ty) => {
    [...row].forEach((ch, tx) => {
      const px = tx * TILE;
      const py = ty * TILE;
      if (ch === "=") paintPath(buf, px, py, neighbours(rows, tx, ty), tx * 31 + ty * 17);
      else if (ch === '"') paintGrid(buf, TALL_GRASS_FRAMES[0], px, py);
      else if (ch === "*") paintGrid(buf, RED_FLOWER_FRAMES[frame % 2], px, py);
      else if (ch === "+") paintGrid(buf, YELLOW_FLOWER_FRAMES[frame % 2], px, py);
      else paintGrid(buf, hash2(tx, ty, 1) < 0.3 ? GRASS_TUFTS : GRASS_PLAIN, px, py);
    });
  });
}

/** Trees from "T" cells; each tree is a 2×2 block starting on even coordinates. */
export function treesFromGround(rows: readonly string[]): Placed[] {
  const trees: Placed[] = [];
  for (let y = 0; y < rows.length; y += 2) {
    for (let x = 0; x < rows[y].length; x += 2) {
      if (rows[y][x] === "T") trees.push({ kind: "tree", x, y });
    }
  }
  return trees;
}

/** Pixel row where an object meets the ground; lower objects are drawn later. */
export function groundLine(obj: Placed): number {
  if (obj.kind === "building") return (obj.y + BUILDINGS[obj.id].heightTiles) * TILE;
  if (obj.kind === "tree" || obj.kind === "jobBoard") return (obj.y + 2) * TILE;
  return (obj.y + 1) * TILE + (obj.kind === "character" ? 0.5 : 0);
}

/** A character standing on tile-aligned pixel position (px, py), with a soft shadow. */
export function drawCharacter(
  buf: PixelBuffer,
  look: CharacterLook,
  facing: Facing,
  step: Step,
  px: number,
  py: number,
): void {
  buf.shadeEllipse(px + 8, py + 15, 5, 1.6, 0.7);
  buf.draw(characterFrame(look, facing, step), px, py - 4);
}

export function paintPlaced(buf: PixelBuffer, obj: Placed, lit: boolean, step: Step = 0): void {
  const px = obj.x * TILE;
  const py = obj.y * TILE;
  switch (obj.kind) {
    case "building":
      return BUILDINGS[obj.id].paint(buf, px, py, { lit });
    case "tile":
      return paintGrid(buf, obj.grid, px, py);
    case "tree":
      return paintTree(buf, px, py);
    case "bush":
      return paintBush(buf, px, py);
    case "lamp":
      return paintLamp(buf, px, py - TILE, lit);
    case "jobBoard":
      return paintJobBoard(buf, px, py);
    case "character":
      return drawCharacter(buf, obj.look, obj.facing, obj.walking ? step : 0, px, py);
  }
}

/** Paints objects back to front. */
export function paintObjects(
  buf: PixelBuffer,
  objects: readonly Placed[],
  lit: boolean,
  step: Step = 0,
): void {
  const ordered = [...objects].sort((a, b) => groundLine(a) - groundLine(b));
  for (const obj of ordered) paintPlaced(buf, obj, lit, step);
}

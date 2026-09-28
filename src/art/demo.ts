/**
 * Sample scenes for the art preview page (/dev/sprites). The real town and
 * rooms are built from content in a later phase; these show the kit
 * working together.
 */
import { projects } from "@content/projects";
import { site } from "@content/site";
import { BUILDINGS, type BuildingId } from "./buildings";
import {
  avatarLook,
  characterFrame,
  LOOKS,
  type CharacterLook,
  type Facing,
  type Step,
} from "./characters";
import { paintGrid, type Grid } from "./grid";
import * as room from "./interior";
import { hash2 } from "./noise";
import { TYPE_COLORS } from "./palette";
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
  TILE,
  YELLOW_FLOWER_FRAMES,
  paintPath,
  type PathNeighbours,
} from "./terrain";

/** Ground legend: . grass, = path, " tall grass, * red flowers, + yellow flowers, T tree (2×2). */
export const DEMO_TOWN_ROWS = [
  "TTTTTTTTTTTTTTTTTTTTTTTT",
  "TTTTTTTTTTTTTTTTTTTTTTTT",
  "TT....................TT",
  "TT....................TT",
  "TT........+...........TT",
  "TT....................TT",
  "TT....................TT",
  "TT....=..*.*....=.++..TT",
  "TT..=================.TT",
  "TT......==............TT",
  "TT......==............TT",
  "TT......==............TT",
  "TT......==............TT",
  "TT...==============...TT",
  'TT""""""==."""""""""""TT',
  'TT""""""==."""""""""""TT',
  "TTTTTTTT==TTTTTTTTTTTTTT",
  "TTTTTTTT==TTTTTTTTTTTTTT",
];

type Placed =
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

const professor = avatarLook(site.avatar);

const DEMO_TOWN_OBJECTS: Placed[] = [
  { kind: "building", id: "lab", x: 3, y: 2 },
  { kind: "building", id: "gym", x: 13, y: 2 },
  { kind: "building", id: "house", x: 3, y: 9 },
  { kind: "building", id: "center", x: 10, y: 9 },
  { kind: "building", id: "mart", x: 17, y: 9 },
  { kind: "jobBoard", x: 10, y: 5 },
  { kind: "tile", grid: SIGN_TILE, x: 12, y: 7 },
  { kind: "lamp", x: 2, y: 7 },
  { kind: "lamp", x: 21, y: 7 },
  { kind: "tile", grid: MAILBOX_TILE, x: 2, y: 12 },
  { kind: "bush", x: 2, y: 9 },
  { kind: "bush", x: 2, y: 10 },
  { kind: "bush", x: 15, y: 12 },
  { kind: "bush", x: 16, y: 12 },
  { kind: "tile", grid: ROCK_TILE, x: 21, y: 11 },
  { kind: "tile", grid: FENCE_TILE, x: 19, y: 13 },
  { kind: "tile", grid: FENCE_TILE, x: 20, y: 13 },
  { kind: "tile", grid: FENCE_TILE, x: 21, y: 13 },
  { kind: "character", look: professor, facing: "down", x: 7, y: 7 },
  { kind: "character", look: LOOKS.player, facing: "up", walking: true, x: 9, y: 10 },
  { kind: "character", look: LOOKS.lass, facing: "left", walking: true, x: 14, y: 8 },
  { kind: "character", look: LOOKS.elder, facing: "right", x: 6, y: 13 },
  { kind: "character", look: LOOKS.clerk, facing: "down", x: 17, y: 13 },
];

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

/** Paints the ground layer of an ASCII map. `frame` animates flowers. */
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

/** Pixel row where an object meets the ground; lower objects are drawn later. */
function groundLine(obj: Placed): number {
  if (obj.kind === "building") return (obj.y + BUILDINGS[obj.id].heightTiles) * TILE;
  if (obj.kind === "tree" || obj.kind === "jobBoard") return (obj.y + 2) * TILE;
  return (obj.y + 1) * TILE + (obj.kind === "character" ? 0.5 : 0);
}

function drawCharacter(
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

function paintPlaced(buf: PixelBuffer, obj: Placed, lit: boolean, step: Step): void {
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

export interface SceneOptions {
  /** Night lighting: windows, glass doors and street lamps glow. */
  lit?: boolean;
  /** Flower sway frame. */
  frame?: number;
  /** Walk cycle step for walking characters. */
  step?: Step;
}

export function paintTownScene({ lit = false, frame = 0, step = 0 }: SceneOptions = {}) {
  const rows = DEMO_TOWN_ROWS;
  const buf = new PixelBuffer(rows[0].length * TILE, rows.length * TILE);
  paintGround(buf, rows, frame);

  const trees: Placed[] = [];
  for (let y = 0; y < rows.length; y += 2) {
    for (let x = 0; x < rows[0].length; x += 2) {
      if (rows[y][x] === "T") trees.push({ kind: "tree", x, y });
    }
  }
  const drawables = [...trees, ...DEMO_TOWN_OBJECTS].sort((a, b) => groundLine(a) - groundLine(b));
  for (const obj of drawables) paintPlaced(buf, obj, lit, step);
  return buf;
}

const ROOM_WIDTH = 12 * TILE;
const ROOM_HEIGHT = 9 * TILE;

/** Prof. Rohit's Lab: one machine per project. */
export function paintLabScene({ step = 0 }: SceneOptions = {}) {
  const buf = new PixelBuffer(ROOM_WIDTH, ROOM_HEIGHT);
  room.paintTileFloor(buf, 0, 32, ROOM_WIDTH, ROOM_HEIGHT - 32);
  room.paintBackWall(buf, 0, 0, ROOM_WIDTH, 32, room.INTERIOR.labWall);
  room.paintInteriorWindow(buf, 20, 5);
  room.paintInteriorWindow(buf, ROOM_WIDTH - 36, 5);
  room.paintPoster(buf, 90, 6, ["#5fb4e8", "#e5463d"]);
  projects.slice(0, 4).forEach((project, i) => {
    const type = project.mascot.types?.[0] ?? "normal";
    room.paintMachine(buf, 48 + i * 26, 18, TYPE_COLORS[type]);
  });
  room.paintBookshelf(buf, 2, 14);
  room.paintBookshelf(buf, ROOM_WIDTH - 18, 14);
  room.paintTable(buf, 72, 78, 48, 18);
  room.paintPapers(buf, 78, 79);
  room.paintPapers(buf, 100, 80);
  room.paintPlant(buf, 2, 116);
  room.paintPlant(buf, ROOM_WIDTH - 18, 116);
  room.paintExitMat(buf, 5 * TILE, 8 * TILE);
  room.paintExitMat(buf, 6 * TILE, 8 * TILE);
  drawCharacter(buf, professor, "down", 0, 6 * TILE, 3 * TILE);
  drawCharacter(buf, LOOKS.player, "up", step, 5 * TILE, 7 * TILE);
  return buf;
}

/** The Pokémon Center: nurse, healing machine and the PC. */
export function paintCenterScene({ step = 0 }: SceneOptions = {}) {
  const buf = new PixelBuffer(ROOM_WIDTH, ROOM_HEIGHT);
  room.paintTileFloor(buf, 0, 32, ROOM_WIDTH, ROOM_HEIGHT - 32);
  room.paintBackWall(buf, 0, 0, ROOM_WIDTH, 32);
  room.paintInteriorWindow(buf, 12, 5);
  room.paintInteriorWindow(buf, ROOM_WIDTH - 28, 5);
  drawCharacter(buf, LOOKS.nurse, "down", 0, 6 * TILE - 8, 2 * TILE);
  room.paintCounter(buf, 48, 44, 96, 22);
  room.paintHealMachine(buf, 54, 38);
  room.paintPC(buf, ROOM_WIDTH - 30, 30);
  room.paintPlant(buf, 2, 34);
  room.paintPlant(buf, ROOM_WIDTH - 18, 116);
  room.paintRug(buf, 64, 80, 64, 30);
  room.paintExitMat(buf, 5 * TILE, 8 * TILE);
  room.paintExitMat(buf, 6 * TILE, 8 * TILE);
  drawCharacter(buf, LOOKS.player, "up", step, 6 * TILE - 8, 6 * TILE);
  return buf;
}

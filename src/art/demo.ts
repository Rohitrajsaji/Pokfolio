/**
 * Sample scenes for the art preview page (/dev/sprites): a fixed layout that
 * shows the kit working together, independent of the real map in content/.
 */
import { projects } from "@content/projects";
import { site } from "@content/site";
import { avatarLook, LOOKS, type Step } from "./characters";
import * as room from "./interior";
import { TYPE_COLORS } from "./palette";
import { PixelBuffer } from "./pixel-buffer";
import { FENCE_TILE, MAILBOX_TILE, ROCK_TILE, SIGN_TILE } from "./props";
import { drawCharacter, paintGround, paintObjects, treesFromGround, type Placed } from "./scene";
import { TILE } from "./terrain";

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
  paintObjects(buf, [...treesFromGround(rows), ...DEMO_TOWN_OBJECTS], lit, step);
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

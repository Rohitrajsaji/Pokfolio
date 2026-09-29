/**
 * Anyone who walks the grid: the visitor and NPCs. Movement is tile by tile,
 * interpolated over a few frames like the handheld games.
 */
import type { Direction } from "@content/types";
import type { CharacterLook, Step } from "@/art/characters";
import { STEP } from "../world/runtime";

export const TILE = 16;
/** Frames to cross one tile at 60 fps: walking, running, and an NPC's stroll. */
export const WALK_FRAMES = 16;
export const RUN_FRAMES = 8;
export const STROLL_FRAMES = 22;
const BUMP_FRAMES = 16;

export interface Walker {
  id: string;
  /** Sprite cache key, e.g. the cast member name. */
  lookKey: string;
  look: CharacterLook;
  x: number;
  y: number;
  facing: Direction;
  /** Present while stepping onto the next tile. */
  move: { dir: Direction; t: number; frames: number } | null;
  /** Which foot leads the next step, so steps alternate. */
  foot: 0 | 1;
  /** Frames left of walking in place after bumping into something. */
  bump: number;
}

export function createWalker(
  id: string,
  lookKey: string,
  look: CharacterLook,
  x: number,
  y: number,
  facing: Direction,
): Walker {
  return { id, lookKey, look, x, y, facing, move: null, foot: 0, bump: 0 };
}

/** True for the tile a walker stands on and, mid-step, the tile it is entering. */
export function occupies(w: Walker, x: number, y: number): boolean {
  if (w.x === x && w.y === y) return true;
  if (!w.move) return false;
  const { dx, dy } = STEP[w.move.dir];
  return w.x + dx === x && w.y + dy === y;
}

export function beginStep(w: Walker, dir: Direction, frames: number): void {
  w.facing = dir;
  w.move = { dir, t: 0, frames };
  w.bump = 0;
}

/** Walk in place, facing `dir`, as if blocked. */
export function bumpInto(w: Walker, dir: Direction): void {
  w.facing = dir;
  if (w.bump === 0) {
    w.bump = BUMP_FRAMES;
    w.foot = w.foot === 0 ? 1 : 0;
  }
}

/** Advances one frame. Returns true on the frame the walker lands on a new tile. */
export function advance(w: Walker): boolean {
  if (w.bump > 0) w.bump--;
  if (!w.move) return false;
  w.move.t++;
  if (w.move.t < w.move.frames) return false;
  const { dx, dy } = STEP[w.move.dir];
  w.x += dx;
  w.y += dy;
  w.move = null;
  w.foot = w.foot === 0 ? 1 : 0;
  return true;
}

/** Top-left pixel of the tile-sized box the walker occupies, mid-step included. */
export function pixelPosition(w: Walker): { px: number; py: number } {
  if (!w.move) return { px: w.x * TILE, py: w.y * TILE };
  const { dx, dy } = STEP[w.move.dir];
  const progress = w.move.t / w.move.frames;
  return {
    px: Math.round((w.x + dx * progress) * TILE),
    py: Math.round((w.y + dy * progress) * TILE),
  };
}

/** A stepping frame for the first half of each tile, standing for the second. */
export function animationStep(w: Walker): Step {
  const stepping = w.foot === 1 ? 3 : 1;
  if (w.move) return w.move.t < w.move.frames / 2 ? stepping : 0;
  if (w.bump > BUMP_FRAMES / 2) return stepping;
  return 0;
}

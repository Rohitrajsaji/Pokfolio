/**
 * A map compiled for play. Per-tile facts live in flat arrays indexed by
 * `y * width + x` (see `tileIndex`), which keeps lookups cheap every frame.
 */
import type { Direction, Effect, Interaction, NpcSpec, RoomId, SecretRoomId } from "@content/types";
import type { PixelBuffer } from "@/art/pixel-buffer";
import type { WaterNeighbours } from "@/art/terrain";

export type MapId = "town" | RoomId | SecretRoomId;

export interface Spot {
  x: number;
  y: number;
  facing: Direction;
}

export interface Warp extends Spot {
  to: MapId;
}

export interface RuntimeMap {
  id: MapId;
  name: string;
  outdoor: boolean;
  width: number;
  height: number;
  /** 1 where nobody can stand. */
  solid: Uint8Array;
  /** 1 on tall grass, where the wild ROHIT hides. */
  grass: Uint8Array;
  /** 1 on counters you can talk across. */
  counter: Uint8Array;
  /** Stepping onto these tiles moves you to another map. */
  warps: Map<number, Warp>;
  /** Signs, furniture and other things you can read, by tile. */
  reads: Map<number, Interaction>;
  /** Shown while standing in front of a door, by tile. */
  hints: Map<number, string>;
  /** Tapping any tile of a building walks you to its door, by tile. */
  doors: Map<number, number>;
  /** Walking off the map from these tiles shows `edge`. */
  edges: Set<number>;
  edge: string[];
  flowers: Array<{ x: number; y: number; color: "red" | "yellow" }>;
  /** Tiles of water, drawn afresh each frame so the ripples move. */
  water?: Array<{ x: number; y: number; nb: WaterNeighbours }>;
  /** Where each sleeper's snores start, in pixels from the map's corner. */
  snoring?: Array<{ x: number; y: number }>;
  npcs: NpcSpec[];
  start: Spot;
  /** Secret routes: walking onto these tiles in order, without a step elsewhere between, sets off the effect. */
  routes?: Array<{ id: string; tiles: number[]; effect: Effect }>;
  /** True when a hidden staircase in this room has been opened (see `RoomSpec.stairs`). */
  stairsOpen?: boolean;
  /** Draws everything that never moves. `lit` switches on windows and lamps. */
  paint(buf: PixelBuffer, lit: boolean): void;
  /**
   * What shows beyond the edge of a map smaller than the screen: one square tile, repeated
   * from the map's own corner. Outdoors that's the tree border the real games repeat; without
   * one (indoors) the space stays black.
   */
  border?: { size: number; paint(buf: PixelBuffer): void };
}

export function tileIndex(map: { width: number }, x: number, y: number): number {
  return y * map.width + x;
}

export function inBounds(map: { width: number; height: number }, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}

/** Out-of-bounds tiles count as solid. */
export function isSolid(map: RuntimeMap, x: number, y: number): boolean {
  return !inBounds(map, x, y) || map.solid[tileIndex(map, x, y)] === 1;
}

export const STEP: Readonly<Record<Direction, { dx: number; dy: number }>> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const OPPOSITE: Readonly<Record<Direction, Direction>> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

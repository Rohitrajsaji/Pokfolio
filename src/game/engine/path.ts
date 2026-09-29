/** Shortest paths on the tile grid, for tap-to-walk. */
import type { Direction } from "@content/types";
import { STEP } from "../world/runtime";

export interface PathGrid {
  width: number;
  height: number;
  passable(x: number, y: number): boolean;
}

interface Point {
  x: number;
  y: number;
}

const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

/** Steps from `from` to `to` over passable tiles (breadth-first), or null if there is no way. */
export function findPath(grid: PathGrid, from: Point, to: Point): Direction[] | null {
  if (from.x === to.x && from.y === to.y) return [];
  if (!grid.passable(to.x, to.y)) return null;
  const key = (x: number, y: number) => y * grid.width + x;
  const came = new Map<number, { prev: number; dir: Direction }>();
  const start = key(from.x, from.y);
  const goal = key(to.x, to.y);
  const queue: Point[] = [from];
  const seen = new Set([start]);
  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    for (const dir of DIRECTIONS) {
      const nx = x + STEP[dir].dx;
      const ny = y + STEP[dir].dy;
      if (nx < 0 || ny < 0 || nx >= grid.width || ny >= grid.height) continue;
      const next = key(nx, ny);
      if (seen.has(next) || !grid.passable(nx, ny)) continue;
      seen.add(next);
      came.set(next, { prev: key(x, y), dir });
      if (next === goal) {
        const path: Direction[] = [];
        for (let at = goal; at !== start; at = came.get(at)!.prev) path.unshift(came.get(at)!.dir);
        return path;
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

/**
 * The shortest walk to a tile beside `target`, and the way to face it. Use it
 * for things you can't stand on: people, signs, furniture.
 */
export function findPathNextTo(
  grid: PathGrid,
  from: Point,
  target: Point,
): { path: Direction[]; face: Direction } | null {
  let best: { path: Direction[]; face: Direction } | null = null;
  for (const face of DIRECTIONS) {
    const stand = { x: target.x - STEP[face].dx, y: target.y - STEP[face].dy };
    const here = stand.x === from.x && stand.y === from.y;
    if (!here && !grid.passable(stand.x, stand.y)) continue;
    const path = findPath(grid, from, stand);
    if (path && (!best || path.length < best.path.length)) best = { path, face };
  }
  return best;
}

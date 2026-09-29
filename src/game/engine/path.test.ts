import { describe, expect, it } from "vitest";
import { findPath, findPathNextTo, type PathGrid } from "./path";

/** "#" is blocked, anything else is open. */
function grid(rows: string[]): PathGrid {
  return {
    width: rows[0].length,
    height: rows.length,
    passable: (x, y) => rows[y]?.[x] !== undefined && rows[y][x] !== "#",
  };
}

describe("findPath", () => {
  it("walks straight when nothing is in the way", () => {
    expect(findPath(grid(["....."]), { x: 0, y: 0 }, { x: 3, y: 0 })).toEqual([
      "right",
      "right",
      "right",
    ]);
  });

  it("goes around walls by the shortest way", () => {
    const g = grid(["...", ".#.", "..."]);
    const path = findPath(g, { x: 1, y: 0 }, { x: 1, y: 2 });
    expect(path).toHaveLength(4);
  });

  it("returns an empty path when already there, and null when unreachable", () => {
    expect(findPath(grid([".."]), { x: 0, y: 0 }, { x: 0, y: 0 })).toEqual([]);
    expect(findPath(grid([".#."]), { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
    expect(findPath(grid([".#"]), { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
  });
});

describe("findPathNextTo", () => {
  it("walks up to a blocked target and faces it", () => {
    const g = grid(["....", ".#..", "...."]);
    expect(findPathNextTo(g, { x: 3, y: 1 }, { x: 1, y: 1 })).toEqual({
      path: ["left"],
      face: "left",
    });
  });

  it("just turns when already standing beside the target", () => {
    const g = grid(["..", "#."]);
    expect(findPathNextTo(g, { x: 0, y: 0 }, { x: 0, y: 1 })).toEqual({ path: [], face: "down" });
  });

  it("gives up when every side of the target is walled off", () => {
    const g = grid(["###", "#.#", "###", "..."]);
    expect(findPathNextTo(g, { x: 0, y: 3 }, { x: 1, y: 1 })).toBeNull();
  });
});

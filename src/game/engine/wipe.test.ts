import { describe, expect, it } from "vitest";
import { WIPE_BLOCK, drawWipe, wipeCovers } from "./wipe";

const covered = (progress: number, cols = 20, rows = 12) => {
  let count = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) if (wipeCovers(col, row, cols, rows, progress)) count++;
  }
  return count;
};

describe("wipeCovers", () => {
  it("starts with nothing covered and ends with everything covered", () => {
    expect(covered(0)).toBe(0);
    expect(covered(1)).toBe(20 * 12);
  });

  it("only ever covers more as it goes", () => {
    let last = 0;
    for (let step = 0; step <= 12; step++) {
      const now = covered(step / 12);
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
  });

  it("sweeps from the top left corner", () => {
    expect(wipeCovers(0, 0, 20, 12, 0.1)).toBe(true);
    expect(wipeCovers(19, 11, 20, 12, 0.1)).toBe(false);
  });
});

describe("drawWipe", () => {
  it("paints whole blocks in black, and nothing at all at 0", () => {
    const rects: number[][] = [];
    const ctx = { fillStyle: "", fillRect: (...r: number[]) => rects.push(r) };
    drawWipe(ctx, 320, 180, 0);
    expect(rects).toHaveLength(0);
    drawWipe(ctx, 320, 180, 1);
    expect(ctx.fillStyle).toBe("#000000");
    expect(rects).toHaveLength(20 * 12);
    for (const [x, y, w, h] of rects) {
      expect([x % WIPE_BLOCK, y % WIPE_BLOCK, w, h]).toEqual([0, 0, WIPE_BLOCK, WIPE_BLOCK]);
    }
  });
});

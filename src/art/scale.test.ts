import { describe, expect, it } from "vitest";
import { PixelBuffer } from "./pixel-buffer";
import { cropBuffer, scaleBuffer, shrinkBuffer } from "./scale";

/** Red, blue / green, and one transparent pixel. */
function tiles(): PixelBuffer {
  const buf = new PixelBuffer(2, 2);
  buf.set(0, 0, "#ff0000");
  buf.set(1, 0, "#0000ff");
  buf.set(0, 1, "#00ff00");
  return buf;
}

describe("scaleBuffer", () => {
  it("turns every pixel into a crisp block, transparency included", () => {
    const big = scaleBuffer(tiles(), 3);
    expect([big.width, big.height]).toEqual([6, 6]);
    const expected = [
      [0, 0, "#ff0000"],
      [2, 2, "#ff0000"],
      [3, 0, "#0000ff"],
      [5, 2, "#0000ff"],
      [0, 3, "#00ff00"],
      [2, 5, "#00ff00"],
      [3, 3, null],
      [5, 5, null],
    ] as const;
    for (const [x, y, color] of expected) expect(big.get(x, y), `${x},${y}`).toBe(color);
  });

  it("leaves the picture alone at a factor of 1", () => {
    const same = scaleBuffer(tiles(), 1);
    expect(Array.from(same.data)).toEqual(Array.from(tiles().data));
  });

  it("only takes whole numbers of at least 1", () => {
    expect(() => scaleBuffer(tiles(), 1.5)).toThrow(/whole number/);
    expect(() => scaleBuffer(tiles(), 0)).toThrow(/whole number/);
  });
});

describe("shrinkBuffer", () => {
  it("undoes scaleBuffer", () => {
    const back = shrinkBuffer(scaleBuffer(tiles(), 4), 4);
    expect(Array.from(back.data)).toEqual(Array.from(tiles().data));
  });

  it("drops a partial block at the edge, and only takes whole numbers", () => {
    expect(shrinkBuffer(scaleBuffer(tiles(), 3), 2)).toMatchObject({ width: 3, height: 3 });
    expect(() => shrinkBuffer(tiles(), 0.5)).toThrow(/whole number/);
  });
});

describe("cropBuffer", () => {
  it("copies a window of the picture", () => {
    const window = cropBuffer(scaleBuffer(tiles(), 2), 1, 1, 2, 2);
    expect(window.get(0, 0)).toBe("#ff0000");
    expect(window.get(1, 0)).toBe("#0000ff");
    expect(window.get(0, 1)).toBe("#00ff00");
    expect(window.get(1, 1)).toBeNull();
  });

  it("refuses a window that hangs over the edge", () => {
    expect(() => cropBuffer(tiles(), 1, 0, 2, 2)).toThrow(/outside/);
    expect(() => cropBuffer(tiles(), -1, 0, 1, 1)).toThrow(/outside/);
  });
});

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

describe("shrinkBuffer, keeping the commonest colour", () => {
  const paint = (rows: string[]) => {
    const buf = new PixelBuffer(rows[0].length, rows.length);
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => buf.set(x, y, ch === "a" ? "#112233" : "#aabbcc")),
    );
    return buf;
  };
  const at = (buf: PixelBuffer, x: number, y: number) => [
    ...buf.data.subarray((y * buf.width + x) * 4, (y * buf.width + x) * 4 + 3),
  ];

  it("lets a thin stroke fade out instead of turning it into noise", () => {
    // A 1-pixel line through the middle of each 4x4 block: the line's pixel is the middle one, the rest is plain.
    const line = paint(["bbbb", "bbbb", "aaaa", "bbbb"]);
    expect(at(shrinkBuffer(line, 4, "middle"), 0, 0)).toEqual([0x11, 0x22, 0x33]);
    expect(at(shrinkBuffer(line, 4, "common"), 0, 0)).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it("keeps the middle pixel when the block is split evenly", () => {
    const halves = paint(["aabb", "aabb", "aabb", "aabb"]);
    expect(at(shrinkBuffer(halves, 4, "common"), 0, 0)).toEqual(at(halves, 2, 2));
  });

  it("agrees with the middle-pixel version wherever each block is one flat colour", () => {
    const big = scaleBuffer(tiles(), 4);
    expect(shrinkBuffer(big, 4, "common")).toEqual(shrinkBuffer(big, 4, "middle"));
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

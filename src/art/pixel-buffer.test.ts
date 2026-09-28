import { describe, expect, it } from "vitest";
import { PixelBuffer } from "./pixel-buffer";

describe("PixelBuffer", () => {
  it("starts fully transparent", () => {
    const buf = new PixelBuffer(4, 3);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) expect(buf.get(x, y)).toBeNull();
  });

  it("round-trips colours and ignores out-of-bounds writes", () => {
    const buf = new PixelBuffer(2, 2);
    buf.set(1, 0, "#a1b2c3");
    buf.set(5, 5, "#ffffff");
    buf.set(-1, 0, "#ffffff");
    expect(buf.get(1, 0)).toBe("#a1b2c3");
    expect(buf.get(0, 0)).toBeNull();
  });

  it("clears a pixel when given null", () => {
    const buf = new PixelBuffer(1, 1);
    buf.set(0, 0, "#ffffff");
    buf.set(0, 0, null);
    expect(buf.get(0, 0)).toBeNull();
  });

  it("clips rectangles to its bounds", () => {
    const buf = new PixelBuffer(3, 3);
    buf.rect(1, 1, 10, 10, "#000000");
    expect(buf.get(0, 0)).toBeNull();
    expect(buf.get(2, 2)).toBe("#000000");
  });

  it("rejects malformed colours", () => {
    expect(() => new PixelBuffer(1, 1).set(0, 0, "red")).toThrow(/#rrggbb/);
  });

  it("fills ellipses by pixel centre", () => {
    const buf = new PixelBuffer(5, 5);
    buf.fillEllipse(2.5, 2.5, 2.5, 2.5, "#ffffff");
    expect(buf.get(2, 2)).toBe("#ffffff");
    expect(buf.get(2, 0)).toBe("#ffffff");
    expect(buf.get(0, 0)).toBeNull();
  });

  it("darkens only opaque pixels", () => {
    const buf = new PixelBuffer(2, 1);
    buf.set(0, 0, "#c8c8c8");
    buf.shadeEllipse(1, 0.5, 1, 0.5, 0.5);
    expect(buf.get(0, 0)).toBe("#646464");
    expect(buf.get(1, 0)).toBeNull();
  });

  it("draws another buffer, skipping transparent pixels and optionally mirroring", () => {
    const src = new PixelBuffer(2, 1);
    src.set(0, 0, "#ff0000");
    const dest = new PixelBuffer(3, 1);
    dest.rect(0, 0, 3, 1, "#0000ff");

    dest.draw(src, 0, 0);
    expect([dest.get(0, 0), dest.get(1, 0)]).toEqual(["#ff0000", "#0000ff"]);

    const mirrored = new PixelBuffer(2, 1);
    mirrored.draw(src, 0, 0, { flipX: true });
    expect([mirrored.get(0, 0), mirrored.get(1, 0)]).toEqual([null, "#ff0000"]);
  });
});

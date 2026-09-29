import { describe, expect, it } from "vitest";
import { cameraAxis, cameraFor } from "./camera";

describe("the camera", () => {
  it("always sits on a whole pixel, whatever the view's size", () => {
    for (let view = 120; view <= 480; view++) {
      for (let centre = 8; centre <= 376; centre += 3) {
        const at = cameraAxis(centre, 384, view);
        expect(Number.isInteger(at), `view ${view}, centre ${centre}`).toBe(true);
      }
    }
  });

  it("keeps the visitor in the middle of an odd view, to within a pixel", () => {
    const at = cameraAxis(200, 384, 341);
    expect(Math.abs(200 - at - 341 / 2)).toBeLessThanOrEqual(0.5);
  });

  it("never shows past the edge of a map that is bigger than the view", () => {
    expect(cameraAxis(0, 384, 320)).toBe(0);
    expect(cameraAxis(384, 384, 320)).toBe(64);
    expect(cameraAxis(384, 384, 321)).toBe(63);
  });

  it("centres a map that is smaller than the view, on whole pixels", () => {
    expect(cameraAxis(96, 192, 320)).toBe(-64);
    expect(cameraAxis(96, 192, 321)).toBe(-64);
    expect(Number.isInteger(cameraAxis(96, 191 + 1, 341))).toBe(true);
  });

  it("works out both axes at once", () => {
    expect(
      cameraFor({ x: 8, y: 8 }, { width: 384, height: 288 }, { width: 320, height: 175 }),
    ).toEqual({
      x: 0,
      y: 0,
    });
  });
});

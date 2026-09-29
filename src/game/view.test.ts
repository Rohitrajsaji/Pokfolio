import { describe, expect, it } from "vitest";
import { MIN_HEIGHT, MIN_WIDTH, computeView, layoutFor } from "./view";

describe("computeView", () => {
  it.each([
    // label, region width, region height, density, expected scale, view width, view height
    ["1080p monitor", 1920, 1080, 1, 6, 320, 180],
    ["MacBook, 2x density", 1440, 900, 2, 9, 320, 200],
    ["1440p monitor", 2560, 1440, 1, 8, 320, 180],
    ["4K monitor", 3840, 2160, 1, 12, 320, 180],
    ["phone held upright (above the pad)", 390, 584, 3, 4, 292, 438],
    ["phone held sideways (between the pads)", 512, 300, 3, 5, 307, 180],
    ["tablet", 768, 1024, 2, 5, 307, 409],
    ["small old phone (320 wide, 2x density)", 320, 364, 2, 3, 213, 242],
  ])("%s", (_label, width, height, density, scale, viewWidth, viewHeight) => {
    expect(computeView(width, height, density)).toMatchObject({
      scale,
      width: viewWidth,
      height: viewHeight,
    });
  });

  it("gives whole-number scales, so every game pixel is the same size", () => {
    for (const density of [1, 1.25, 1.5, 2, 3]) {
      for (const [w, h] of [
        [1920, 1080],
        [1366, 768],
        [800, 600],
        [390, 700],
        [2560, 1080],
        [3440, 1440],
      ]) {
        const view = computeView(w, h, density);
        expect(Number.isInteger(view.scale), `${w}x${h}@${density}`).toBe(true);
        expect(view.unit).toBeCloseTo(view.scale / density);
      }
    }
  });

  it("never shows less than the smallest layout the screens are built for", () => {
    for (const [w, h] of [
      [2560, 1080],
      [3440, 1440],
      [1200, 400],
      [500, 900],
      [1920, 1080],
    ]) {
      const view = computeView(w, h, 1);
      expect(view.width, `${w}x${h}`).toBeGreaterThanOrEqual(MIN_WIDTH);
      expect(view.height, `${w}x${h}`).toBeGreaterThanOrEqual(MIN_HEIGHT);
    }
  });

  it("copes with a window too small to reach the minimum, at the finest scale", () => {
    expect(computeView(180, 120, 1)).toMatchObject({ scale: 1, width: 180, height: 120 });
  });

  it("shows more of the world in a wider window, at the same scale", () => {
    const wide = computeView(2560, 1080, 1);
    const normal = computeView(1920, 1080, 1);
    expect(wide.width / wide.height).toBeGreaterThan(normal.width / normal.height);
  });
});

describe("readable text", () => {
  it("keeps a game pixel at 1.25 CSS pixels or more whenever the window has room", () => {
    for (const [w, h, density] of [
      [320, 364, 2],
      [360, 500, 3],
      [375, 600, 2],
      [390, 584, 3],
      [800, 600, 1],
      [1280, 720, 1],
      [2560, 1440, 2],
    ]) {
      const view = computeView(w, h, density);
      const roomy = view.width >= MIN_WIDTH * 1.5;
      if (roomy) expect(view.unit, `${w}x${h}@${density}`).toBeGreaterThanOrEqual(1.25);
    }
  });
});

describe("layoutFor", () => {
  it("uses the narrow layout for upright phones and the wide one everywhere else", () => {
    expect(layoutFor(computeView(390, 584, 3))).toBe("narrow");
    expect(layoutFor(computeView(1920, 1080, 1))).toBe("wide");
    expect(layoutFor(computeView(512, 300, 3))).toBe("wide");
  });
});

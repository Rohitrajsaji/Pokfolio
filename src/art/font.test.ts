import { describe, expect, it } from "vitest";
import { FONT_3X5, paintText, textWidth } from "./font";
import { PixelBuffer } from "./pixel-buffer";

describe("3×5 pixel font", () => {
  it("defines every glyph as 5 rows of 3 pixels", () => {
    for (const [ch, rows] of Object.entries(FONT_3X5)) {
      expect(rows, ch).toHaveLength(5);
      for (const row of rows) expect(row, ch).toMatch(/^[#.]{3}$/);
    }
  });

  it("covers the letters and digits used on signs", () => {
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .!?-'") {
      expect(FONT_3X5[ch], ch).toBeDefined();
    }
  });

  it("measures text with one pixel between glyphs", () => {
    expect(textWidth("")).toBe(0);
    expect(textWidth("A")).toBe(3);
    expect(textWidth("GYM")).toBe(11);
  });

  it("paints glyph pixels in the given colour", () => {
    const buf = new PixelBuffer(3, 5);
    paintText(buf, "I", 0, 0, "#ffffff");
    expect(buf.get(0, 0)).toBe("#ffffff");
    expect(buf.get(0, 1)).toBeNull();
    expect(buf.get(1, 2)).toBe("#ffffff");
  });

  it("rejects characters it cannot draw", () => {
    expect(() => paintText(new PixelBuffer(3, 5), "~", 0, 0, "#ffffff")).toThrow(/~/);
  });
});

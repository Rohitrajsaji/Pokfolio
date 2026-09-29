import { describe, expect, it } from "vitest";
import { SFX, type SfxName } from "./sfx";

describe("sound effects", () => {
  it.each(Object.keys(SFX) as SfxName[])("%s is short, audible and not too loud", (name) => {
    const tones = SFX[name];
    expect(tones.length).toBeGreaterThan(0);
    for (const tone of tones) {
      expect(tone.duration).toBeGreaterThan(0);
      expect(tone.delay ?? 0).toBeGreaterThanOrEqual(0);
      for (const freq of [tone.from, tone.to ?? tone.from]) {
        expect(freq).toBeGreaterThanOrEqual(40);
        expect(freq).toBeLessThanOrEqual(8000);
      }
      expect(tone.gain ?? 0.5).toBeLessThanOrEqual(1);
    }
    const length = Math.max(...tones.map((tone) => (tone.delay ?? 0) + tone.duration));
    expect(length).toBeLessThanOrEqual(2.6);
  });
});

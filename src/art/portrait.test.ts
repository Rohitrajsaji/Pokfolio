import { site } from "@content/site";
import { describe, expect, it } from "vitest";
import { avatarLook, type CharacterLook, type HairStyle } from "./characters";
import { EYES } from "./palette";
import type { PixelBuffer } from "./pixel-buffer";
import { PORTRAIT_HEIGHT, PORTRAIT_WIDTH, portraitBuffer } from "./portrait";

const base = avatarLook(site.avatar);

const same = (a: PixelBuffer, b: PixelBuffer) => a.data.every((value, i) => value === b.data[i]);

function count(buf: PixelBuffer, colour: string): number {
  let n = 0;
  for (let y = 0; y < buf.height; y++) {
    for (let x = 0; x < buf.width; x++) if (buf.get(x, y) === colour) n++;
  }
  return n;
}

describe("the portrait", () => {
  it("is 40×48 and fills its whole frame, so it needs no background behind it", () => {
    const buf = portraitBuffer(base);
    expect([buf.width, buf.height]).toEqual([PORTRAIT_WIDTH, PORTRAIT_HEIGHT]);
    for (let y = 0; y < buf.height; y++) {
      for (let x = 0; x < buf.width; x++) expect(buf.get(x, y), `${x},${y}`).not.toBeNull();
    }
  });

  it("is drawn the same way every time", () => {
    expect(same(portraitBuffer(base), portraitBuffer({ ...base }))).toBe(true);
  });

  it("has the avatar's skin, hair and coat in it", () => {
    const buf = portraitBuffer(base);
    expect(count(buf, base.skin)).toBeGreaterThan(80);
    expect(count(buf, base.hair)).toBeGreaterThan(80);
    expect(count(buf, base.top)).toBeGreaterThan(80);
  });

  it("has two eyes, dark and apart from each other", () => {
    const buf = portraitBuffer(base);
    const eyes: number[] = [];
    for (let y = 17; y < 22; y++) {
      for (let x = 10; x < 30; x++) if (buf.get(x, y) === EYES) eyes.push(x);
    }
    expect(Math.min(...eyes)).toBeLessThan(18);
    expect(Math.max(...eyes)).toBeGreaterThan(21);
  });

  it("changes with each hairstyle, with glasses and with the colours", () => {
    const styles: HairStyle[] = ["short", "cap", "buns", "long", "bald"];
    const pictures = styles.map((hairStyle) =>
      portraitBuffer({ ...base, hairStyle, hat: base.accent } satisfies CharacterLook),
    );
    for (let i = 0; i < pictures.length; i++) {
      for (let j = i + 1; j < pictures.length; j++) {
        expect(same(pictures[i], pictures[j]), `${styles[i]} and ${styles[j]}`).toBe(false);
      }
    }
    expect(same(portraitBuffer(base), portraitBuffer({ ...base, glasses: true }))).toBe(false);
    expect(same(portraitBuffer(base), portraitBuffer({ ...base, hair: "#a83232" }))).toBe(false);
    expect(same(portraitBuffer(base), portraitBuffer({ ...base, skin: "#f1c9a5" }))).toBe(false);
  });

  it("gives someone with a cap a cap, and leaves their eyes clear of the brim", () => {
    const capped = portraitBuffer({ ...base, hairStyle: "cap", hat: "#3a8f9a" });
    expect(count(capped, "#3a8f9a")).toBeGreaterThan(100);
    // Both eyes are still there.
    expect(count(capped, EYES)).toBeGreaterThanOrEqual(count(portraitBuffer(base), EYES) - 2);
  });
});

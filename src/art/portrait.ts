/**
 * A head-and-shoulders portrait, 40×48 pixels, for the intro and the trainer card. It's drawn from
 * the same look as the walking sprite, so changing the avatar in content/site.ts changes both.
 */
import type { CharacterLook } from "./characters";
import { mix, shade, tint } from "./color";
import { EYES, OUTLINE, WHITE } from "./palette";
import { PixelBuffer } from "./pixel-buffer";

export const PORTRAIT_WIDTH = 40;
export const PORTRAIT_HEIGHT = 48;

/** The wall behind the portrait: a lab blue, a little darker in the lower part. */
const BACKDROP = { top: "#d3eaf5", bottom: "#b6d7e8" };
/** The middle of the portrait, left to right. */
const MID = 20;

type Ellipse = readonly [cx: number, cy: number, rx: number, ry: number];
/** Says whether a pixel may be drawn on: how a shape is kept off part of the picture. */
type Keep = (x: number, y: number) => boolean;

const inEllipse = ([cx, cy, rx, ry]: Ellipse, x: number, y: number) =>
  ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;

/** Keeps a shape off the inside of an ellipse: the face, which the hair frames but doesn't cover. */
const outside =
  (hole: Ellipse): Keep =>
  (x, y) =>
    !inEllipse(hole, x, y);

/** Draws `color` on every pixel of the ellipse that `keep` allows. */
function fillEllipseWhere(buf: PixelBuffer, ellipse: Ellipse, color: string, keep?: Keep) {
  const [cx, cy, rx, ry] = ellipse;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (inEllipse(ellipse, x, y) && (!keep || keep(x, y))) buf.set(x, y, color);
    }
  }
}

/** An ellipse with a one-pixel outline round it. */
function outlined(buf: PixelBuffer, [cx, cy, rx, ry]: Ellipse, fill: string, keep?: Keep) {
  fillEllipseWhere(buf, [cx, cy, rx + 1, ry + 1], OUTLINE, keep);
  fillEllipseWhere(buf, [cx, cy, rx, ry], fill, keep);
}

function paintBackdrop(buf: PixelBuffer): void {
  buf.rect(0, 0, PORTRAIT_WIDTH, PORTRAIT_HEIGHT, BACKDROP.top);
  buf.rect(0, 33, PORTRAIT_WIDTH, PORTRAIT_HEIGHT - 33, BACKDROP.bottom);
  // A frame, like the photo on a trainer card.
  buf.hline(0, 0, PORTRAIT_WIDTH, OUTLINE);
  buf.hline(0, PORTRAIT_HEIGHT - 1, PORTRAIT_WIDTH, OUTLINE);
  buf.vline(0, 0, PORTRAIT_HEIGHT, OUTLINE);
  buf.vline(PORTRAIT_WIDTH - 1, 0, PORTRAIT_HEIGHT, OUTLINE);
}

/** The shoulders: a coat over a shirt, with a collar, buttons, a pen and an ID badge. */
function paintBody(buf: PixelBuffer, look: CharacterLook): void {
  const coat = look.top;
  const coatShade = shade(coat, 0.13);
  const shirt = look.accent ?? look.top;
  outlined(buf, [MID, 53, 19, 20], coat);
  // The coat curves away at the sides.
  for (let y = 33; y < PORTRAIT_HEIGHT - 1; y++) {
    for (let x = 1; x < PORTRAIT_WIDTH - 1; x++) {
      if (buf.get(x, y) !== coat) continue;
      if (x < 8 || x > 31) buf.set(x, y, coatShade);
    }
  }
  if (look.outfit === "coat") {
    // The shirt shows in a V at the neck, the coat's lapels on either side of it.
    for (let i = 0; i < 8; i++) {
      const half = 6 - i;
      if (half <= 0) break;
      buf.hline(MID - half, 34 + i, half * 2, shirt);
      buf.set(MID - half - 1, 34 + i, coatShade);
      buf.set(MID + half, 34 + i, coatShade);
    }
    buf.vline(MID, 41, 6, coatShade);
    for (const y of [43, 46]) buf.set(MID - 1, y, OUTLINE);
    // A pen in the breast pocket, and the ID badge.
    buf.vline(10, 41, 3, "#3f5c9c");
    buf.set(10, 40, "#d34a4a");
    buf.rect(26, 40, 6, 5, OUTLINE);
    buf.rect(27, 41, 4, 3, WHITE);
    buf.hline(27, 41, 4, shirt);
    buf.set(27, 43, EYES);
    buf.set(28, 43, EYES);
  } else {
    // A plain top: a round neckline.
    buf.hline(MID - 5, 34, 10, shirt);
    buf.hline(MID - 4, 35, 8, shirt);
    buf.hline(MID - 3, 36, 6, shirt);
  }
  // The collar stands up round the neck.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = MID + side * (7 + i) - (side < 0 ? 0 : 1);
      buf.vline(x, 32 - (3 - i), 4 + (3 - i), coat);
      buf.set(x, 32 - (3 - i) - 1, OUTLINE);
    }
  }
}

/** The neck, and the shadow the chin casts on the clothes. */
function paintNeck(buf: PixelBuffer, look: CharacterLook): void {
  buf.shadeEllipse(MID, 34, 9, 3, 0.92);
  buf.rect(MID - 4, 27, 8, 8, shade(look.skin, 0.07));
  buf.vline(MID - 5, 27, 8, OUTLINE);
  buf.vline(MID + 4, 27, 8, OUTLINE);
}

/** Hair behind the head, for long hair: it falls to the shoulders. */
function paintBackHair(buf: PixelBuffer, look: CharacterLook): void {
  if (look.hairStyle !== "long") return;
  outlined(buf, [MID, 21, 12, 15], look.hair);
  buf.shadeEllipse(MID, 30, 10, 5, 0.9);
}

function paintFace(buf: PixelBuffer, look: CharacterLook): void {
  const skin = look.skin;
  // Ears first, so the head overlaps them.
  for (const side of [-1, 1]) {
    outlined(buf, [MID + side * 9.5, 20, 2, 2.6], skin);
    buf.set(MID + side * 9.5 - (side < 0 ? 0 : 1), 20, shade(skin, 0.2));
  }
  outlined(buf, [MID, 19, 9.5, 11.5], skin);
  // Light from the upper left: a bright cheek on that side, a soft shadow on the other.
  for (let y = 12; y < 30; y++) {
    for (let x = MID + 5; x < MID + 10; x++) {
      if (buf.get(x, y) === skin) buf.set(x, y, shade(skin, 0.08));
    }
  }
  buf.rect(MID - 8, 20, 2, 3, tint(skin, 0.14));
}

function paintFeatures(buf: PixelBuffer, look: CharacterLook): void {
  const brow = shade(look.hair, 0.15);
  for (const left of [MID - 5, MID + 3]) {
    // Round eyes with a highlight, under a brow.
    buf.rect(left, 18, 2, 3, EYES);
    buf.set(left, 18, WHITE);
    buf.hline(left - 1, 16, 4, brow);
  }
  // A little blush.
  const blush = mix(look.skin, "#e37878", 0.4);
  buf.hline(MID - 7, 23, 2, blush);
  buf.hline(MID + 5, 23, 2, blush);
  buf.set(MID - 1, 22, shade(look.skin, 0.2));
  buf.set(MID, 22, shade(look.skin, 0.12));
  // A friendly smile.
  const mouth = mix(look.skin, "#9c3f49", 0.7);
  buf.set(MID - 3, 26, mouth);
  buf.hline(MID - 2, 27, 4, mouth);
  buf.set(MID + 1, 26, mouth);
  buf.set(MID + 2, 26, mouth);
  buf.hline(MID - 1, 28, 2, mix(look.skin, "#9c3f49", 0.35));
}

/** The hair, or the cap, over the top of the head, leaving the face clear. */
function paintHair(buf: PixelBuffer, look: CharacterLook): void {
  const hair = look.hair;
  const opening: Ellipse = [MID, 22, 8, 8.2];
  if (look.hairStyle === "bald") {
    buf.hline(MID - 4, 9, 4, tint(look.skin, 0.25));
    buf.hline(MID - 5, 10, 2, tint(look.skin, 0.14));
    return;
  }
  if (look.hairStyle === "buns") {
    for (const side of [-1, 1]) outlined(buf, [MID + side * 9.5, 6.5, 3.6, 3.6], hair);
  }
  if (look.hairStyle === "cap") {
    const hat = look.hat ?? look.top;
    // Hair peeks out below the cap at the temples; the crown ends at the brim.
    outlined(buf, [MID, 13, 11, 10], hair, outside(opening));
    outlined(buf, [MID, 11, 10.5, 8.5], hat, (_x, y) => y <= 14);
    // The brim sits above the eyebrows, casting a little shade on the forehead.
    fillEllipseWhere(buf, [MID, 13.6, 12.5, 2.1], shade(hat, 0.22));
    buf.hline(MID - 12, 12, 25, OUTLINE);
    buf.hline(MID - 11, 15, 23, OUTLINE);
    buf.rect(MID - 1, 7, 2, 2, WHITE);
    return;
  }
  outlined(buf, [MID, 13, 11, 10], hair, outside(opening));
  // A soft line where the hair meets the face, and a bright streak on the top.
  const hairline = shade(hair, 0.3);
  for (let y = 0; y < PORTRAIT_HEIGHT; y++) {
    for (let x = 0; x < PORTRAIT_WIDTH; x++) {
      if (buf.get(x, y) !== hair) continue;
      const nearFace = [
        [0, 1],
        [1, 0],
        [-1, 0],
      ].some(([dx, dy]) => inEllipse(opening, x + dx, y + dy));
      if (nearFace) buf.set(x, y, hairline);
    }
  }
  const streak = tint(hair, 0.3);
  buf.hline(MID - 6, 5, 4, streak);
  buf.hline(MID - 8, 6, 3, streak);
  buf.set(MID - 9, 8, streak);
}

/** Glasses, if the look has them: frames round each eye, joined over the nose. */
function paintGlasses(buf: PixelBuffer, look: CharacterLook): void {
  if (!look.glasses) return;
  for (const side of [-1, 1]) {
    const left = MID + (side < 0 ? -8 : 2);
    buf.hline(left, 16, 6, OUTLINE);
    buf.hline(left, 21, 6, OUTLINE);
    buf.vline(left, 16, 6, OUTLINE);
    buf.vline(left + 5, 16, 6, OUTLINE);
    buf.set(left + 1, 17, "#eaf6ff");
  }
  buf.hline(MID - 2, 18, 4, OUTLINE);
  buf.set(MID - 9, 18, OUTLINE);
  buf.set(MID + 8, 18, OUTLINE);
}

/** Draws the portrait of a look into a fresh buffer. */
export function portraitBuffer(look: CharacterLook): PixelBuffer {
  const buf = new PixelBuffer(PORTRAIT_WIDTH, PORTRAIT_HEIGHT);
  paintBackdrop(buf);
  paintBackHair(buf, look);
  paintBody(buf, look);
  paintNeck(buf, look);
  paintFace(buf, look);
  paintFeatures(buf, look);
  paintHair(buf, look);
  paintGlasses(buf, look);
  return buf;
}

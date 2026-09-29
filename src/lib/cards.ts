/**
 * Pixel-art images for the browser tab and for link previews. They're drawn
 * with the same kit as the game, from content/site.ts, so they stay in step
 * with it: change the avatar or the title, rebuild, and they follow.
 */
import { site } from "@content";
import { avatarLook, characterFrame, LOOKS } from "@/art/characters";
import { FONT_3X5, paintText, textWidth } from "@/art/font";
import { PixelBuffer } from "@/art/pixel-buffer";
import { cropBuffer, scaleBuffer } from "@/art/scale";
import { TILE } from "@/art/terrain";
import { townPicture } from "@/game/world/picture";

/** The title's colours, as in the game's logo. */
const YELLOW = "#ffcb05";
const BLUE = "#2a4f9b";
const DEEP_BLUE = "#152a55";
const RED = "#d94b4b";
const WHITE = "#ffffff";

export const CARD_SIZE = { width: 1200, height: 630 } as const;
export const FAVICON_SIZE = 32;
export const APPLE_ICON_SIZE = 180;
/** The icon is drawn on a 16×16 grid, then enlarged by a whole number. */
const ICON_GRID = 16;

/** Text the 3×5 pixel font can draw: upper case, no accents, no marks it lacks. */
export function signText(text: string): string {
  return text
    .toUpperCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/./gu, (ch) => (ch in FONT_3X5 ? ch : " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** A 16×16 portrait of the professor on yellow: the artwork for the icons. */
export function iconArt(framed = true): PixelBuffer {
  const art = new PixelBuffer(ICON_GRID, ICON_GRID);
  art.rect(0, 0, ICON_GRID, ICON_GRID, YELLOW);
  // The head and the top of the coat. The sprite is 16×20, so its legs fall off the bottom.
  art.draw(characterFrame(avatarLook(site.avatar), "down"), 0, 2);
  if (framed) {
    const last = ICON_GRID - 1;
    for (let i = 0; i < ICON_GRID; i++) {
      for (const [x, y] of [
        [i, 0],
        [i, last],
        [0, i],
        [last, i],
      ]) {
        art.set(x, y, BLUE);
      }
    }
    // Round the corners.
    for (const [x, y] of [
      [0, 0],
      [last, 0],
      [0, last],
      [last, last],
    ]) {
      art.set(x, y, null);
    }
  }
  return art;
}

/** The browser-tab icon. */
export function faviconArt(): PixelBuffer {
  return scaleBuffer(iconArt(true), FAVICON_SIZE / ICON_GRID);
}

/** The home-screen icon for iPhones and iPads, which round the corners themselves. */
export function appleIconArt(): PixelBuffer {
  const scale = Math.floor(APPLE_ICON_SIZE / ICON_GRID);
  const margin = (APPLE_ICON_SIZE - ICON_GRID * scale) / 2;
  const icon = new PixelBuffer(APPLE_ICON_SIZE, APPLE_ICON_SIZE);
  icon.rect(0, 0, APPLE_ICON_SIZE, APPLE_ICON_SIZE, YELLOW);
  icon.draw(scaleBuffer(iconArt(false), scale), margin, margin);
  return icon;
}

/** Font-pixel-sized text, `color` letters on a transparent buffer. */
function textBuffer(text: string, color: string): PixelBuffer {
  const buf = new PixelBuffer(Math.max(1, textWidth(text)), 5);
  paintText(buf, text, 0, 0, color);
  return buf;
}

/** The biggest scale, up to `preferred`, at which `text` still fits in `room` pixels. */
function fitScale(text: string, preferred: number, room: number): number {
  return Math.max(1, Math.min(preferred, Math.floor(room / Math.max(1, textWidth(text)))));
}

/** Text in the game's logo style: yellow letters, a blue outline and a deep-blue drop shadow. */
function logoText(text: string, scale: number): PixelBuffer {
  const ink = scaleBuffer(textBuffer(text, YELLOW), scale);
  const reach = Math.max(2, Math.round(scale / 3));
  const drop = reach * 2;
  const out = new PixelBuffer(ink.width + reach * 2, ink.height + reach * 2 + drop);
  const stamp = (color: string, down: number) => {
    for (let y = 0; y < ink.height; y++) {
      for (let x = 0; x < ink.width; x++) {
        if (ink.data[(y * ink.width + x) * 4 + 3] === 0) continue;
        for (let oy = -reach; oy <= reach; oy++) {
          for (let ox = -reach; ox <= reach; ox++) {
            // Skipping the square's corners keeps the outline rounded, like the CSS one.
            if (Math.abs(ox) === reach && Math.abs(oy) === reach) continue;
            out.set(x + reach + ox, y + reach + oy + down, color);
          }
        }
      }
    }
  };
  stamp(DEEP_BLUE, drop);
  stamp(BLUE, 0);
  out.draw(ink, reach, reach);
  return out;
}

/** White text on a red pill with a white rim, like the "version" banner on a game box. */
function pill(text: string, scale: number): PixelBuffer {
  const words = scaleBuffer(textBuffer(text, WHITE), scale);
  const rim = Math.max(2, Math.round(scale / 2));
  const padX = scale * 4;
  const padY = scale * 3;
  const out = new PixelBuffer(words.width + 2 * (padX + rim), words.height + 2 * (padY + rim));
  out.rect(0, 0, out.width, out.height, WHITE);
  out.rect(rim, rim, out.width - 2 * rim, out.height - 2 * rim, RED);
  out.draw(words, rim + padX, rim + padY);
  return out;
}

/** Darkens a rectangle of the picture. */
function dim(buf: PixelBuffer, x: number, y: number, w: number, h: number, factor: number): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) buf.darken(xx, yy, factor);
}

/** The 1200×630 picture shown when a link to the site is shared. */
export function socialCard(): PixelBuffer {
  const { width, height } = CARD_SIZE;
  const picture = townPicture();
  // Enough to cover the card, and a whole number so the pixels stay crisp.
  const zoom = Math.max(4, Math.ceil(width / picture.width), Math.ceil(height / picture.height));
  const town = scaleBuffer(picture, zoom);
  // A street-level slice of the town: the houses, the path and the tall grass.
  const left = Math.round((town.width - width) / 2);
  const top = Math.min(6 * TILE * zoom, town.height - height);
  const card = cropBuffer(town, left, top, width, height);
  dim(card, 0, 0, width, height, 0.62);

  // The title banner
  const band = { top: 150, height: 300, rule: 6 };
  dim(card, 0, band.top, width, band.height, 0.26);
  card.rect(0, band.top, width, band.rule, YELLOW);
  card.rect(0, band.top + band.height - band.rule, width, band.rule, YELLOW);

  const title = signText(site.gameTitle);
  const subtitle = signText(site.gameSubtitle);
  const logo = logoText(title, fitScale(title, 14, width - 160));
  const version = pill(subtitle, fitScale(subtitle, 6, width - 300));
  const gap = 36;
  const contentTop = band.top + Math.round((band.height - logo.height - gap - version.height) / 2);
  card.draw(logo, Math.round((width - logo.width) / 2), contentTop);
  card.draw(version, Math.round((width - version.width) / 2), contentTop + logo.height + gap);

  // You and the professor, facing each other on the grass below the banner.
  const scale = 7;
  const feet = height - 24;
  const stand = (frame: PixelBuffer, x: number) => {
    const sprite = scaleBuffer(frame, scale);
    card.shadeEllipse(x + sprite.width / 2, feet - 6, sprite.width * 0.42, 11, 0.55);
    card.draw(sprite, x, feet - sprite.height);
  };
  stand(characterFrame(LOOKS.player, "right"), 110);
  stand(characterFrame(avatarLook(site.avatar), "left"), width - 110 - 16 * scale);
  return card;
}

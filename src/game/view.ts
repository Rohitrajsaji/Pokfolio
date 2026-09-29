/**
 * How big the game looks in a given space. The world is drawn one "game
 * pixel" at a time, and every game pixel is shown as a whole number of the
 * screen's own pixels, so the art stays crisp at any window size, zoom or
 * screen density.
 */

export interface View {
  /** Screen (device) pixels per game pixel: always a whole number. */
  scale: number;
  /** CSS pixels per game pixel: `scale` divided by the screen's density. */
  unit: number;
  /** How many game pixels fit across and down. */
  width: number;
  height: number;
}

/** About how many game pixels across we aim for: 20 tiles on a landscape window. */
export const TARGET_WIDTH = 320;
/** Tall windows (phones held upright) are chunkier, so text stays readable. */
export const TARGET_WIDTH_TALL = 288;
/** Never smaller than this: the menus and screens are laid out for at least this much room. */
export const MIN_WIDTH = 208;
export const MIN_HEIGHT = 144;
/** The smallest a game pixel should be, in CSS pixels, so text stays readable. */
export const MIN_UNIT = 1.25;

/** The whole-number scale that best fits a region of `regionWidth`×`regionHeight` CSS pixels. */
export function computeView(regionWidth: number, regionHeight: number, density = 1): View {
  const deviceWidth = Math.max(1, Math.round(regionWidth * density));
  const deviceHeight = Math.max(1, Math.round(regionHeight * density));
  const target = deviceWidth < deviceHeight ? TARGET_WIDTH_TALL : TARGET_WIDTH;
  const roomiest = Math.max(
    1,
    Math.min(Math.floor(deviceWidth / MIN_WIDTH), Math.floor(deviceHeight / MIN_HEIGHT)),
  );
  // Never so fine that the text (10 game pixels tall) drops under about 12 screen pixels,
  // unless the window is too small to fit more than the minimum view at the bigger scale.
  const finest = Math.min(roomiest, Math.ceil(MIN_UNIT * density));
  const scale = Math.max(finest, Math.min(roomiest, Math.round(deviceWidth / target)));
  return {
    scale,
    unit: scale / density,
    width: Math.floor(deviceWidth / scale),
    height: Math.floor(deviceHeight / scale),
  };
}

export function sameView(a: View, b: View): boolean {
  return a.scale === b.scale && a.unit === b.unit && a.width === b.width && a.height === b.height;
}

/** Below this many game pixels across, screens use their narrow (single-column) layout. */
export const NARROW_BELOW = 300;

export function layoutFor(view: View): "narrow" | "wide" {
  return view.width < NARROW_BELOW ? "narrow" : "wide";
}

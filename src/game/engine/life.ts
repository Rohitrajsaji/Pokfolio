/**
 * The small touches that make the town feel lived in: dust kicked up by running, doors that stand open,
 * people who glance about, and a sleeping giant's snoring. Kept apart from the engine so the moving
 * parts can be tested without a canvas.
 */
import type { Direction } from "@content/types";

/** A rectangle to fill, in pixels, relative to where the thing it belongs to stands. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Drawn in the darker colour. */
  shade?: boolean;
}

// ---------------------------------------------------------------- dust

/** How many frames (at 60 a second) a puff of dust lasts. */
export const DUST_FRAMES = 14;

/** A puff of dust `age` frames old, relative to the feet it came from: low and wide, then two puffs drifting apart, then specks. */
export function dustPuff(age: number): Rect[] {
  if (age < 0 || age >= DUST_FRAMES) return [];
  if (age < 5) {
    return [
      { x: -3, y: -2, w: 6, h: 2 },
      { x: -3, y: 0, w: 6, h: 1, shade: true },
    ];
  }
  if (age < 10) {
    return [
      { x: -5, y: -4, w: 3, h: 2 },
      { x: -5, y: -2, w: 3, h: 1, shade: true },
      { x: 2, y: -4, w: 3, h: 2 },
      { x: 2, y: -2, w: 3, h: 1, shade: true },
    ];
  }
  return [
    { x: -6, y: -6, w: 2, h: 2 },
    { x: 4, y: -6, w: 2, h: 2 },
  ];
}

// ---------------------------------------------------------------- doors

/** How many frames a door stays open once someone has come out of it: fully, then closing. */
export const DOOR_FRAMES = 22;
const DOOR_CLOSING = 8;

/** How wide, in pixels, a door stands open with `framesLeft` frames to go: wide, then narrowing, then shut. */
export function doorGap(framesLeft: number): number {
  if (framesLeft > DOOR_CLOSING) return 10;
  return framesLeft > 0 ? 4 : 0;
}

// ---------------------------------------------------------------- snoring

/** Frames between one 'z' setting off and the next. */
const SNORE_EVERY = 60;
/** Frames one 'z' rises for before it's gone, and the last few in which it blinks out. */
const SNORE_LASTS = 96;
const SNORE_BLINKS = 84;
/** Frames after which the 'z' has grown from small to big. */
const SNORE_GROWS = 32;

export interface Snore {
  dx: number;
  dy: number;
  big: boolean;
}

/**
 * Where the `n`th 'z' of a snore is, `frame` frames into the game: it rises up and to the right, small at
 * first and then big, blinks out, and another follows. With `still` (reduced motion) one big 'z' just hangs there.
 */
export function snore(frame: number, n: 0 | 1, still: boolean): Snore | null {
  if (still) return n === 0 ? { dx: 4, dy: -8, big: true } : null;
  const age = (frame + n * SNORE_EVERY) % (SNORE_EVERY * 2);
  if (age >= SNORE_LASTS) return null;
  if (age >= SNORE_BLINKS && Math.floor(age / 3) % 2 === 0) return null;
  return { dx: Math.floor(age / 10), dy: -Math.floor(age / 7), big: age >= SNORE_GROWS };
}

/** The pixels of a 'z', small (3×3) or big (5×5), relative to its top-left corner. */
export function zGlyph(big: boolean): Rect[] {
  if (!big) {
    return [
      { x: 0, y: 0, w: 3, h: 1 },
      { x: 1, y: 1, w: 1, h: 1 },
      { x: 0, y: 2, w: 3, h: 1 },
    ];
  }
  return [
    { x: 0, y: 0, w: 5, h: 1 },
    { x: 3, y: 1, w: 1, h: 1 },
    { x: 2, y: 2, w: 1, h: 1 },
    { x: 1, y: 3, w: 1, h: 1 },
    { x: 0, y: 4, w: 5, h: 1 },
  ];
}

// ---------------------------------------------------------------- idling

const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

export interface Idle {
  /** Frames until it next looks about. */
  timer: number;
  /** Frames left of looking the other way; 0 when it isn't. */
  glance: number;
  facing: Direction;
}

/** Frames to wait before a glance: about three to nine seconds. */
export function untilNextGlance(random: () => number): number {
  return 180 + Math.floor(random() * 360);
}

/**
 * One frame of someone standing about: every so often they look somewhere else for a moment, then turn back to
 * face where they were put (`home`). Whoever they turned to face in the meantime (a visitor talking to them) is
 * left alone until the next glance.
 */
export function idle(state: Idle, home: Direction, random: () => number): Idle {
  if (state.glance > 0) {
    const glance = state.glance - 1;
    if (glance > 0) return { ...state, glance };
    return { timer: untilNextGlance(random), glance: 0, facing: home };
  }
  if (state.timer > 1) return { ...state, timer: state.timer - 1 };
  const elsewhere = DIRECTIONS.filter((direction) => direction !== home);
  return {
    timer: 0,
    glance: 50 + Math.floor(random() * 40),
    facing: elsewhere[Math.floor(random() * elsewhere.length)],
  };
}

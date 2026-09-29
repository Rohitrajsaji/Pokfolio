import { describe, expect, it } from "vitest";
import {
  DOOR_FRAMES,
  DUST_FRAMES,
  doorGap,
  dustPuff,
  idle,
  snore,
  untilNextGlance,
  zGlyph,
  type Idle,
} from "./life";

/** A "random" number generator that hands out the numbers it's given, over and over. */
const rolls = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("dust", () => {
  it("is a puff that spreads and thins, and is gone after a fraction of a second", () => {
    expect(dustPuff(0).length).toBeGreaterThan(0);
    expect(dustPuff(DUST_FRAMES - 1).length).toBeGreaterThan(0);
    expect(dustPuff(DUST_FRAMES)).toEqual([]);
    expect(dustPuff(-1)).toEqual([]);
    const area = (age: number) => dustPuff(age).reduce((sum, r) => sum + r.w * r.h, 0);
    expect(area(12)).toBeLessThan(area(0));
  });

  it("stays close to the feet it came from and rises, never dipping below them", () => {
    for (let age = 0; age < DUST_FRAMES; age++) {
      for (const rect of dustPuff(age)) {
        expect(rect.x, `age ${age}`).toBeGreaterThanOrEqual(-6);
        expect(rect.x + rect.w, `age ${age}`).toBeLessThanOrEqual(6);
        expect(rect.y, `age ${age}`).toBeGreaterThanOrEqual(-6);
        expect(rect.y + rect.h, `age ${age}`).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("a door standing open", () => {
  it("is wide at first, narrows as it closes, and is shut after its frames run out", () => {
    expect(doorGap(DOOR_FRAMES)).toBe(10);
    expect(doorGap(9)).toBe(10);
    expect(doorGap(8)).toBe(4);
    expect(doorGap(1)).toBe(4);
    expect(doorGap(0)).toBe(0);
  });

  it("never opens wider than the door it's in (a tile is 16 pixels)", () => {
    for (let frames = 0; frames <= DOOR_FRAMES; frames++) expect(doorGap(frames)).toBeLessThan(16);
  });
});

describe("snoring", () => {
  it("rises up and to the right, small and then big, with a gap before the next", () => {
    const early = snore(0, 0, false)!;
    const later = snore(50, 0, false)!;
    expect(early.big).toBe(false);
    expect(later.big).toBe(true);
    expect(later.dx).toBeGreaterThan(early.dx);
    expect(later.dy).toBeLessThan(early.dy);
    // Somewhere in every cycle the first 'z' is away, and the second is on its way.
    expect(snore(100, 0, false)).toBeNull();
    expect(snore(100, 1, false)).not.toBeNull();
  });

  it("keeps two 'z's going, half a cycle apart, so there's nearly always one to see", () => {
    let seen = 0;
    for (let frame = 0; frame < 240; frame++) {
      if (snore(frame, 0, false) || snore(frame, 1, false)) seen++;
    }
    expect(seen).toBeGreaterThan(200);
  });

  it("repeats every cycle", () => {
    for (const frame of [0, 17, 60, 95, 119]) {
      expect(snore(frame + 120, 0, false)).toEqual(snore(frame, 0, false));
    }
  });

  it("hangs one big 'z' in place when motion is reduced", () => {
    const first = snore(0, 0, true);
    expect(first).toEqual(snore(500, 0, true));
    expect(first?.big).toBe(true);
    expect(snore(0, 1, true)).toBeNull();
  });

  it("draws a 'z' with a bar at the top and the bottom, in both sizes", () => {
    for (const [big, size] of [
      [false, 3],
      [true, 5],
    ] as const) {
      const glyph = zGlyph(big);
      expect(glyph[0]).toMatchObject({ y: 0, w: size });
      expect(glyph.at(-1)).toMatchObject({ y: size - 1, w: size });
      for (const rect of glyph) expect(rect.x + rect.w).toBeLessThanOrEqual(size);
    }
  });
});

describe("standing about", () => {
  const home = "down" as const;
  const still: Idle = { timer: 5, glance: 0, facing: home };

  it("counts down without moving, then looks somewhere other than where it was put", () => {
    let state = still;
    for (let i = 0; i < 4; i++) state = idle(state, home, rolls(0.5));
    expect(state).toEqual({ timer: 1, glance: 0, facing: home });
    state = idle(state, home, rolls(0.5, 0.5));
    expect(state.glance).toBeGreaterThan(0);
    expect(state.facing).not.toBe(home);
  });

  it("looks at each of the other three directions, depending on the roll", () => {
    const seen = new Set<string>();
    for (const roll of [0, 0.4, 0.9]) {
      seen.add(idle({ timer: 1, glance: 0, facing: home }, home, rolls(0.5, roll)).facing);
    }
    expect(seen).toEqual(new Set(["up", "left", "right"]));
  });

  it("looks for a second or so, then turns back to where it was put and waits for the next glance", () => {
    let state = idle({ timer: 1, glance: 0, facing: home }, home, rolls(0, 0));
    expect(state.glance).toBe(50);
    let frames = 0;
    while (state.glance > 0) {
      state = idle(state, home, rolls(0));
      frames++;
    }
    expect(frames).toBe(50);
    expect(state.facing).toBe(home);
    expect(state.timer).toBe(untilNextGlance(rolls(0)));
  });

  it("waits three to nine seconds between glances", () => {
    expect(untilNextGlance(rolls(0))).toBe(180);
    expect(untilNextGlance(rolls(0.999))).toBeLessThanOrEqual(540);
  });

  it("leaves alone whoever it was turned to face until it next glances", () => {
    // A visitor talked to it, and it turned to face them; the counting down doesn't undo that.
    const facingVisitor: Idle = { timer: 100, glance: 0, facing: "left" };
    expect(idle(facingVisitor, home, rolls(0.5)).facing).toBe("left");
  });
});

import { describe, expect, it } from "vitest";
import { LOOKS } from "@/art/characters";
import {
  WALK_FRAMES,
  advance,
  animationStep,
  beginStep,
  bumpInto,
  createWalker,
  occupies,
  pixelPosition,
} from "./walker";

const walker = () => createWalker("player", "player", LOOKS.player, 2, 3, "down");

describe("walking", () => {
  it("crosses one tile in WALK_FRAMES frames, then stops", () => {
    const w = walker();
    beginStep(w, "right", WALK_FRAMES);
    for (let i = 1; i < WALK_FRAMES; i++) expect(advance(w)).toBe(false);
    expect(advance(w)).toBe(true);
    expect([w.x, w.y, w.move]).toEqual([3, 3, null]);
    expect(advance(w)).toBe(false);
  });

  it("slides smoothly between tiles", () => {
    const w = walker();
    beginStep(w, "up", WALK_FRAMES);
    for (let i = 0; i < WALK_FRAMES / 2; i++) advance(w);
    expect(pixelPosition(w)).toEqual({ px: 32, py: 40 });
  });

  it("occupies both the tile it leaves and the tile it enters", () => {
    const w = walker();
    beginStep(w, "left", WALK_FRAMES);
    expect(occupies(w, 2, 3)).toBe(true);
    expect(occupies(w, 1, 3)).toBe(true);
    expect(occupies(w, 3, 3)).toBe(false);
  });

  it("steps for half of each tile and alternates feet", () => {
    const w = walker();
    beginStep(w, "down", WALK_FRAMES);
    expect(animationStep(w)).toBe(1);
    for (let i = 0; i < WALK_FRAMES / 2; i++) advance(w);
    expect(animationStep(w)).toBe(0);
    for (let i = 0; i < WALK_FRAMES / 2; i++) advance(w);
    beginStep(w, "down", WALK_FRAMES);
    expect(animationStep(w)).toBe(3);
  });

  it("walks in place when bumping into something, without moving", () => {
    const w = walker();
    bumpInto(w, "up");
    expect(w.facing).toBe("up");
    expect(animationStep(w)).not.toBe(0);
    for (let i = 0; i < 20; i++) advance(w);
    expect([w.x, w.y, animationStep(w)]).toEqual([2, 3, 0]);
  });
});

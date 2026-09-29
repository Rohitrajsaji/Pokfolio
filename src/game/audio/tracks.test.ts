import { describe, expect, it } from "vitest";
import { STEPS_PER_BAR, TRACKS, compileTrack, type TrackId } from "./tracks";

const ids = Object.keys(TRACKS) as TrackId[];

describe("the soundtrack", () => {
  it.each(ids)("%s compiles, with every channel the same length", (id) => {
    const track = compileTrack(TRACKS[id]);
    expect(track.steps % STEPS_PER_BAR).toBe(0);
    expect(track.byStep).toHaveLength(track.steps);
    expect(track.byStep[0].length).toBeGreaterThan(0);
  });

  it("loops the themes and plays the jingles once", () => {
    expect(ids.filter((id) => TRACKS[id].loop).sort()).toEqual([
      "arcade",
      "battle",
      "indoor",
      "title",
      "town",
    ]);
    expect(ids.filter((id) => !TRACKS[id].loop).sort()).toEqual(["caught", "evolved", "healed"]);
  });

  it("keeps every note in a comfortable range", () => {
    for (const id of ids) {
      for (const events of compileTrack(TRACKS[id]).byStep) {
        for (const { event } of events) {
          for (const freq of event.freqs) {
            expect(freq, id).toBeGreaterThan(50);
            expect(freq, id).toBeLessThan(2100);
          }
        }
      }
    }
  });

  it("gives the battle more drive than the town, and the town more than indoors", () => {
    expect(TRACKS.battle.bpm).toBeGreaterThan(TRACKS.town.bpm);
    expect(TRACKS.town.bpm).toBeGreaterThan(TRACKS.indoor.bpm);
  });

  it("keeps the Game Corner livelier than indoors but not as hurried as a battle", () => {
    expect(TRACKS.arcade.bpm).toBeGreaterThan(TRACKS.indoor.bpm);
    expect(TRACKS.arcade.bpm).toBeLessThan(TRACKS.battle.bpm);
  });

  it("keeps the jingles short, so the music isn't kept waiting", () => {
    for (const id of ["caught", "evolved", "healed"] as const) {
      const track = compileTrack(TRACKS[id]);
      expect(track.steps * track.stepSeconds, id).toBeLessThan(5);
    }
  });

  it("catches channels that drift out of step", () => {
    const drifting = { bpm: 120, loop: true, channels: { lead: "C4:16", bass: "C3:16 | C3:16" } };
    expect(() => compileTrack(drifting)).toThrow(/bass channel is 32 steps/);
  });
});

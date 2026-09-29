import { describe, expect, it } from "vitest";
import { noteFrequency, parsePattern } from "./notes";

describe("noteFrequency", () => {
  it("tunes A4 to 440 Hz, in equal temperament around it", () => {
    expect(noteFrequency("A4")).toBe(440);
    expect(noteFrequency("A5")).toBeCloseTo(880);
    expect(noteFrequency("C4")).toBeCloseTo(261.63, 2);
  });

  it("reads sharps and flats", () => {
    expect(noteFrequency("A#3")).toBeCloseTo(noteFrequency("Bb3"));
    expect(noteFrequency("Bb3")).toBeCloseTo(233.08, 2);
    expect(noteFrequency("F#4")).toBeCloseTo(369.99, 2);
  });

  it("rejects anything else", () => {
    expect(() => noteFrequency("H4")).toThrow();
    expect(() => noteFrequency("C")).toThrow();
  });
});

describe("parsePattern", () => {
  it("places notes, rests and drums on steps", () => {
    const pattern = parsePattern("C4:2 r E4 k:4", 8);
    expect(pattern.steps).toBe(8);
    expect(pattern.events).toEqual([
      { step: 0, steps: 2, freqs: [noteFrequency("C4")] },
      { step: 3, steps: 1, freqs: [noteFrequency("E4")] },
      { step: 4, steps: 4, freqs: [], drum: "k" },
    ]);
  });

  it("plays notes joined with + as one arpeggio", () => {
    const [chord] = parsePattern("C4+E4+G4:4", 4).events;
    expect(chord.freqs).toEqual(["C4", "E4", "G4"].map(noteFrequency));
  });

  it("counts steps across bars", () => {
    const pattern = parsePattern("C4:4 | r:2 D4:2", 4);
    expect(pattern.steps).toBe(8);
    expect(pattern.events.map((event) => event.step)).toEqual([0, 6]);
  });

  it("catches bars of the wrong length and bad tokens", () => {
    expect(() => parsePattern("C4:3 | D4:4", 4)).toThrow(/Bar 1 is 3 steps/);
    expect(() => parsePattern("C4:0", 4)).toThrow(/Bad length/);
    expect(() => parsePattern("X4:4", 4)).toThrow(/Not a note/);
  });
});

/**
 * A small notation for writing chiptunes as text. A pattern is a line of
 * tokens, with bars separated by "|":
 *
 *   "C5:2 E5:2 G5:4 r:8 | A3+C4+E4:16"
 *
 * A token is a note (C5, F#4, Bb3), notes joined with "+" (played as a fast
 * arpeggio, the chiptune way to play a chord), a drum (k kick, s snare,
 * h hi-hat) or r for a rest, then ":" and its length in steps (default 1).
 */

export type Drum = "k" | "s" | "h";

export interface NoteEvent {
  /** The step the event starts on, counted from the start of the pattern. */
  step: number;
  /** How many steps it lasts. */
  steps: number;
  /** Pitches in Hz: one for a note, several for an arpeggio, none for a drum. */
  freqs: number[];
  drum?: Drum;
}

export interface Pattern {
  events: NoteEvent[];
  /** Total length in steps, rests included. */
  steps: number;
}

const NOTE = /^([A-G])(#|b)?(\d)$/;
const SEMITONES: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DRUMS = new Set<string>(["k", "s", "h"]);

/** "A4" → 440 Hz, "C4" → 261.63 Hz, in equal temperament. */
export function noteFrequency(name: string): number {
  const match = NOTE.exec(name);
  if (!match) throw new Error(`Not a note: "${name}"`);
  const [, letter, accidental, octave] = match;
  const shift = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
  const midi = (Number(octave) + 1) * 12 + SEMITONES[letter] + shift;
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Reads a pattern. Every bar must add up to exactly `stepsPerBar`, which catches typos. */
export function parsePattern(source: string, stepsPerBar: number): Pattern {
  const events: NoteEvent[] = [];
  let step = 0;
  source.split("|").forEach((bar, index) => {
    const barStart = step;
    for (const token of bar.trim().split(/\s+/).filter(Boolean)) {
      const [sound, length = "1", ...extra] = token.split(":");
      const steps = Number(length);
      if (extra.length > 0 || !Number.isInteger(steps) || steps < 1) {
        throw new Error(`Bad length in "${token}"`);
      }
      if (DRUMS.has(sound)) {
        events.push({ step, steps, freqs: [], drum: sound as Drum });
      } else if (sound !== "r") {
        events.push({ step, steps, freqs: sound.split("+").map(noteFrequency) });
      }
      step += steps;
    }
    const length = step - barStart;
    if (length !== stepsPerBar) {
      throw new Error(
        `Bar ${index + 1} is ${length} steps long, not ${stepsPerBar}: "${bar.trim()}"`,
      );
    }
  });
  return { events, steps: step };
}

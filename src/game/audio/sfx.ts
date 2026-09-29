/** Sound effects, made from short synthesised tones: no audio files needed. */

export type Wave = "pulse" | "square" | "triangle" | "sine" | "noise";

export interface Tone {
  wave: Wave;
  /** Pitch in Hz, or for noise the centre of its filter. */
  from: number;
  /** Where the pitch slides to by the end, if anywhere. */
  to?: number;
  /** Seconds. */
  duration: number;
  /** Seconds after the effect starts. */
  delay?: number;
  /** Loudness, 0–1. */
  gain?: number;
}

export type SfxName =
  | "cursor"
  | "confirm"
  | "back"
  | "menu"
  | "text"
  | "bump"
  | "door"
  | "pop"
  | "hit"
  | "zap"
  | "shimmer"
  | "throw"
  | "shake"
  | "free"
  | "flee"
  | "evolving"
  | "glitch"
  | "unlock"
  | "shiny"
  | "flip"
  | "boom"
  | "coin"
  | "clear";

/** Short pulse notes one after another, for sparkles and rising effects. */
function run(freqs: number[], each: number, gain = 0.4): Tone[] {
  return freqs.map((from, i) => ({ wave: "pulse", from, duration: each, delay: i * each, gain }));
}

export const SFX: Readonly<Record<SfxName, readonly Tone[]>> = {
  cursor: [{ wave: "pulse", from: 1320, duration: 0.035, gain: 0.3 }],
  confirm: [
    { wave: "pulse", from: 988, duration: 0.045, gain: 0.35 },
    { wave: "pulse", from: 1480, duration: 0.07, delay: 0.045, gain: 0.35 },
  ],
  back: [
    { wave: "pulse", from: 740, duration: 0.045, gain: 0.35 },
    { wave: "pulse", from: 494, duration: 0.08, delay: 0.045, gain: 0.35 },
  ],
  menu: [{ wave: "pulse", from: 880, to: 1760, duration: 0.08, gain: 0.35 }],
  text: [{ wave: "square", from: 1760, duration: 0.02, gain: 0.15 }],
  bump: [{ wave: "triangle", from: 180, to: 70, duration: 0.1, gain: 0.8 }],
  door: [
    { wave: "noise", from: 1200, to: 300, duration: 0.2, gain: 0.5 },
    { wave: "pulse", from: 523, to: 262, duration: 0.15, delay: 0.03, gain: 0.25 },
  ],
  pop: [{ wave: "pulse", from: 500, to: 1500, duration: 0.09, gain: 0.35 }],
  hit: [
    { wave: "noise", from: 2400, to: 300, duration: 0.2, gain: 0.8 },
    { wave: "square", from: 200, to: 60, duration: 0.14, gain: 0.35 },
  ],
  zap: [
    { wave: "square", from: 1600, to: 400, duration: 0.07, gain: 0.3 },
    { wave: "square", from: 1600, to: 400, duration: 0.07, delay: 0.09, gain: 0.3 },
    { wave: "square", from: 1600, to: 400, duration: 0.07, delay: 0.18, gain: 0.3 },
  ],
  shimmer: run([1047, 1319, 1568, 2093], 0.06),
  throw: [{ wave: "noise", from: 500, to: 2500, duration: 0.5, gain: 0.35 }],
  shake: [
    { wave: "noise", from: 2000, duration: 0.03, gain: 0.6 },
    { wave: "square", from: 300, duration: 0.05, delay: 0.01, gain: 0.25 },
  ],
  free: [{ wave: "pulse", from: 300, to: 1200, duration: 0.18, gain: 0.35 }],
  flee: run([784, 659, 523, 392], 0.07, 0.3),
  // A screen coming apart: static and low buzzing, one burst after another.
  glitch: [
    { wave: "noise", from: 3200, to: 200, duration: 0.12, gain: 0.45 },
    { wave: "square", from: 95, to: 60, duration: 0.1, delay: 0.05, gain: 0.2 },
    { wave: "noise", from: 1600, to: 100, duration: 0.16, delay: 0.18, gain: 0.45 },
    { wave: "square", from: 420, to: 40, duration: 0.22, delay: 0.3, gain: 0.22 },
  ],
  // A hidden thing found: the wall grinding open under a rising four-note chime.
  unlock: [
    { wave: "noise", from: 320, to: 110, duration: 0.55, gain: 0.35 },
    ...run([659, 784, 988, 1319], 0.09, 0.32).map((tone) => ({
      ...tone,
      delay: 0.25 + (tone.delay ?? 0),
    })),
  ],
  // A shiny Pokémon's sparkle: a quick rising run of bright notes.
  shiny: run([1568, 1976, 2349, 3136, 2349, 3136], 0.07, 0.3),
  // A card turning over.
  flip: [{ wave: "pulse", from: 620, to: 900, duration: 0.06, gain: 0.3 }],
  // A Voltorb going off: a burst of noise over a low thud.
  boom: [
    { wave: "noise", from: 1800, to: 80, duration: 0.5, gain: 0.7 },
    { wave: "square", from: 140, to: 40, duration: 0.4, gain: 0.35 },
  ],
  // Coins landing.
  coin: [
    { wave: "pulse", from: 1047, duration: 0.07, gain: 0.3 },
    { wave: "pulse", from: 1568, duration: 0.14, delay: 0.07, gain: 0.3 },
  ],
  // A level cleared: five rising notes.
  clear: run([523, 659, 784, 1047, 1319], 0.09, 0.32),
  // Rising arpeggios under the evolution's flashing, 2.4 seconds long.
  evolving: run(
    [523, 659, 784, 1047, 659, 784, 1047, 1319, 784, 1047, 1319, 1568, 1047, 1319, 1568, 2093],
    0.15,
    0.25,
  ),
};

/**
 * The soundtrack: original chiptunes in the notation from notes.ts. Four
 * channels, like an old handheld: two pulse waves (lead and harmony), a
 * triangle bass and a noise drum kit. Every step is a sixteenth note, so a
 * bar of 4/4 is 16 steps.
 */
import { parsePattern, type NoteEvent } from "./notes";

export type Channel = "lead" | "harmony" | "bass" | "drums";
export type TrackId =
  "title" | "town" | "indoor" | "arcade" | "battle" | "caught" | "evolved" | "healed";

export interface TrackSpec {
  bpm: number;
  /** Loops forever, or plays once (a jingle). */
  loop: boolean;
  channels: Partial<Record<Channel, string>>;
}

export const STEPS_PER_BEAT = 4;
export const STEPS_PER_BAR = 16;

const bars = (...list: string[]) => list.join(" | ");
const repeat = (bar: string, times: number) => bars(...Array<string>(times).fill(bar));
/** Off-beat chord stabs, eighth notes. */
const stabs = (chord: string) => repeat(`r:2 ${chord}:2`, 4).replaceAll(" | ", " ");
/** Bass bouncing between a root, its octave and its fifth. */
const bounce = (low: string, high: string, fifth: string) =>
  `${low}:2 ${high}:2 ${fifth}:2 ${high}:2 ${low}:2 ${high}:2 ${fifth}:2 ${high}:2`;
/** Pumping octaves, for the battle. */
const pump = (low: string, high: string) => repeat(`${low}:2 ${high}:2`, 4).replaceAll(" | ", " ");
/** A chord broken into eighth notes, low-middle-high-middle. */
const broken = (a: string, b: string, c: string) =>
  `${a}:2 ${b}:2 ${c}:2 ${b}:2 ${a}:2 ${b}:2 ${c}:2 ${b}:2`;

export const TRACKS: Readonly<Record<TrackId, TrackSpec>> = {
  // Outdoors in the town: bright, bouncy, F major.
  town: {
    bpm: 112,
    loop: true,
    channels: {
      lead: bars(
        "C5:2 F5:2 A5:3 G5:1 F5:4 C5:4",
        "D5:2 F5:2 A5:2 C6:2 A5:6 r:2",
        "Bb4:2 D5:2 F5:3 E5:1 D5:4 F5:4",
        "E5:2 G5:2 C6:3 Bb5:1 A5:2 G5:2 E5:4",
        "A5:3 G5:1 F5:2 A5:2 C6:4 A5:4",
        "E5:3 F5:1 G5:2 A5:2 E5:4 C5:4",
        "D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:4",
        "G5:2 E5:2 C5:2 E5:2 F5:6 r:2",
      ),
      harmony: bars(
        stabs("A3+C4+F4"),
        stabs("A3+D4+F4"),
        stabs("Bb3+D4+F4"),
        stabs("G3+C4+E4"),
        stabs("A3+C4+F4"),
        stabs("A3+C4+E4"),
        stabs("Bb3+D4+F4"),
        "r:2 G3+C4+E4:2 r:2 G3+C4+E4:2 r:2 A3+C4+F4:2 r:2 A3+C4+F4:2",
      ),
      bass: bars(
        bounce("F2", "F3", "C3"),
        bounce("D2", "D3", "A2"),
        bounce("Bb1", "Bb2", "F2"),
        bounce("C2", "C3", "G2"),
        bounce("F2", "F3", "C3"),
        bounce("A1", "A2", "E2"),
        bounce("Bb1", "Bb2", "F2"),
        "C2:2 C3:2 G2:2 C3:2 F2:2 F3:2 C3:2 F3:2",
      ),
      drums: repeat("k:4 h:2 h:2 s:4 h:2 h:2", 8),
    },
  },

  // Inside the buildings: calm, C major, no drums.
  indoor: {
    bpm: 90,
    loop: true,
    channels: {
      lead: bars(
        "E5:4 G5:4 C6:6 r:2",
        "B5:2 A5:2 G5:4 E5:6 r:2",
        "F5:4 A5:4 C6:4 A5:4",
        "G5:6 F5:2 E5:4 D5:4",
        "E5:4 C5:4 G5:6 r:2",
        "A5:4 G5:2 E5:2 C5:6 r:2",
        "D5:2 E5:2 F5:4 A5:4 G5:4",
        "F5:2 E5:2 D5:4 C5:6 r:2",
      ),
      harmony: bars(
        broken("C4", "E4", "G4"),
        broken("A3", "C4", "E4"),
        broken("F3", "A3", "C4"),
        broken("G3", "B3", "D4"),
        broken("C4", "E4", "G4"),
        broken("A3", "C4", "E4"),
        broken("F3", "A3", "C4"),
        "G3:2 B3:2 D4:2 B3:2 C4:2 E4:2 G4:2 E4:2",
      ),
      bass: bars(
        "C3:8 G2:8",
        "A2:8 E2:8",
        "F2:8 C3:8",
        "G2:8 D3:8",
        "C3:8 G2:8",
        "A2:8 E2:8",
        "F2:8 C3:8",
        "G2:8 C3:8",
      ),
    },
  },

  // The Game Corner: a bouncy little parlour tune with a wink of ragtime, G major.
  arcade: {
    bpm: 126,
    loop: true,
    channels: {
      lead: bars(
        "G5:2 B5:2 D6:2 B5:2 G5:3 A5:1 B5:4",
        "E5:2 G5:2 B5:2 G5:2 E5:3 F#5:1 G5:4",
        "A5:2 C6:2 E6:2 C6:2 A5:3 B5:1 C6:4",
        "D6:2 C6:2 A5:2 F#5:2 D5:4 r:2 F#5:2",
        "G5:2 B5:2 D6:2 G6:2 F#6:3 E6:1 D6:4",
        "E6:2 G6:2 E6:2 C6:2 G5:4 C6:4",
        "A5:2 C6:2 E6:4 D6:2 C6:2 A5:2 F#5:2",
        "G5:2 D5:2 G5:2 B5:2 G5:6 r:2",
      ),
      harmony: bars(
        stabs("B3+D4+G4"),
        stabs("B3+E4+G4"),
        stabs("C4+E4+A4"),
        stabs("C4+D4+F#4"),
        stabs("B3+D4+G4"),
        stabs("C4+E4+G4"),
        "r:2 C4+E4+A4:2 r:2 C4+E4+A4:2 r:2 C4+D4+F#4:2 r:2 C4+D4+F#4:2",
        "r:2 B3+D4+G4:2 r:2 B3+D4+G4:2 r:2 B3+D4+G4:2 r:4",
      ),
      bass: bars(
        bounce("G2", "G3", "D3"),
        bounce("E2", "E3", "B2"),
        bounce("A1", "A2", "E2"),
        bounce("D2", "D3", "A2"),
        bounce("G2", "G3", "D3"),
        bounce("C2", "C3", "G2"),
        "A1:2 A2:2 E2:2 A2:2 D2:2 D3:2 A2:2 D3:2",
        "G2:2 G3:2 D3:2 G3:2 G2:4 r:4",
      ),
      drums: repeat("k:2 h:2 h:2 h:2 s:2 h:2 k:2 h:2", 8),
    },
  },

  // The wild battle: driving, A minor.
  battle: {
    bpm: 152,
    loop: true,
    channels: {
      lead: bars(
        "A4:2 C5:2 E5:2 A5:4 G5:2 E5:4",
        "F5:3 E5:1 D5:2 C5:2 A4:4 C5:4",
        "B4:2 D5:2 G5:2 B5:4 A5:2 G5:4",
        "G#5:3 F5:1 E5:2 D5:2 B4:4 E5:4",
        "E5:2 E5:2 A5:2 A5:2 C6:4 B5:2 A5:2",
        "C6:2 A5:2 F5:2 A5:2 C6:4 D6:4",
        "D6:2 B5:2 G5:2 B5:2 D6:4 C6:2 B5:2",
        "B5:4 G#5:4 E5:4 r:4",
      ),
      harmony: bars(
        stabs("A3+C4+E4"),
        stabs("A3+C4+F4"),
        stabs("B3+D4+G4"),
        stabs("B3+E4+G#4"),
        stabs("A3+C4+E4"),
        stabs("A3+C4+F4"),
        stabs("B3+D4+G4"),
        stabs("B3+E4+G#4"),
      ),
      bass: bars(
        pump("A2", "A3"),
        pump("F2", "F3"),
        pump("G2", "G3"),
        pump("E2", "E3"),
        pump("A2", "A3"),
        pump("F2", "F3"),
        pump("G2", "G3"),
        pump("E2", "E3"),
      ),
      drums: bars(
        repeat("k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2", 7),
        "k:2 h:2 s:2 h:2 s:1 s:1 s:2 s:2 s:2",
      ),
    },
  },

  // The title screen: a hopeful fanfare in G major.
  title: {
    bpm: 108,
    loop: true,
    channels: {
      lead: bars(
        "G5:4 B5:4 D6:6 B5:2",
        "A5:4 F#5:4 D5:4 F#5:4",
        "E5:4 G5:4 B5:6 G5:2",
        "E5:4 G5:4 C6:8",
        "D6:4 B5:4 G5:4 B5:4",
        "A5:4 D6:4 F#6:6 D6:2",
        "C6:4 B5:2 A5:2 G5:4 E5:4",
        "A5:4 B5:2 A5:2 F#5:4 D5:2 r:2",
      ),
      harmony: bars(
        broken("G3", "B3", "D4"),
        broken("F#3", "A3", "D4"),
        broken("E3", "G3", "B3"),
        broken("E3", "G3", "C4"),
        broken("G3", "B3", "D4"),
        broken("F#3", "A3", "D4"),
        broken("E3", "G3", "C4"),
        broken("F#3", "A3", "D4"),
      ),
      bass: bars(
        bounce("G2", "G3", "D3"),
        bounce("D2", "D3", "A2"),
        bounce("E2", "E3", "B2"),
        bounce("C2", "C3", "G2"),
        bounce("G2", "G3", "D3"),
        bounce("D2", "D3", "A2"),
        bounce("C2", "C3", "G2"),
        bounce("D2", "D3", "A2"),
      ),
      drums: repeat("k:4 h:4 s:4 h:4", 8),
    },
  },

  // Jingles, played once.
  caught: {
    bpm: 132,
    loop: false,
    channels: {
      lead: "G4:2 C5:2 E5:2 G5:4 E5:2 G5:4 | C6:12 r:4",
      harmony: "E4:4 G4:4 E4:4 G4:4 | E4+G4+C5:12 r:4",
      bass: "C3:4 G2:4 C3:4 G2:4 | C3:12 r:4",
      drums: "k:4 s:4 k:4 s:4 | k:2 s:2 k:8 r:4",
    },
  },
  evolved: {
    bpm: 126,
    loop: false,
    channels: {
      lead: "C5:2 F5:2 A5:2 C6:2 A5:2 C6:2 F6:4 | E6:2 F6:10 r:4",
      harmony: "A4:4 C5:4 A4:4 C5:4 | A4+C5+F5:12 r:4",
      bass: "F2:4 C3:4 F2:4 C3:4 | F2:12 r:4",
      drums: "k:4 h:4 s:4 h:4 | k:12 r:4",
    },
  },
  // A sparkle that climbs and settles, for the nurse.
  healed: {
    bpm: 138,
    loop: false,
    channels: {
      lead: "C5:2 E5:2 G5:2 C6:2 E6:2 G6:4 E6:2 | C6:2 E6:2 G6:8 r:4",
      harmony: "E4:4 G4:4 E4:4 G4:4 | E4+G4+C5:12 r:4",
      bass: "C3:4 G2:4 C3:4 G2:4 | C3:12 r:4",
    },
  },
};

export interface CompiledTrack {
  loop: boolean;
  /** Seconds per step. */
  stepSeconds: number;
  /** Length in steps. */
  steps: number;
  /** Every event, grouped by the step it starts on. */
  byStep: Array<Array<{ channel: Channel; event: NoteEvent }>>;
}

/** Parses a track's channels and checks they stay in step with each other. */
export function compileTrack(spec: TrackSpec): CompiledTrack {
  const channels = (Object.entries(spec.channels) as Array<[Channel, string]>).map(
    ([channel, source]) => ({ channel, pattern: parsePattern(source, STEPS_PER_BAR) }),
  );
  if (channels.length === 0) throw new Error("A track needs at least one channel");
  const steps = channels[0].pattern.steps;
  for (const { channel, pattern } of channels) {
    if (pattern.steps !== steps) {
      throw new Error(`The ${channel} channel is ${pattern.steps} steps long, not ${steps}`);
    }
  }
  const byStep = Array.from({ length: steps }, () => [] as CompiledTrack["byStep"][number]);
  for (const { channel, pattern } of channels) {
    for (const event of pattern.events) byStep[event.step].push({ channel, event });
  }
  return { loop: spec.loop, stepSeconds: 60 / spec.bpm / STEPS_PER_BEAT, steps, byStep };
}

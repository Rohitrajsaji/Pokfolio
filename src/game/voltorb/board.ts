import { LEVELS, MAX_LEVEL } from "./levels";

/** The board is 5×5. */
export const SIZE = 5;
export const CARDS = SIZE * SIZE;

/** Random numbers in [0, 1). Passing one in makes a board repeatable, for tests. */
export type Rng = () => number;

/** What a row or column's tile says: what its cards add up to, and how many are Voltorbs. */
export interface Clue {
  points: number;
  voltorbs: number;
}

export interface Board {
  /** Row by row. 0 is a Voltorb; the others are worth what they say. */
  cards: readonly number[];
  rows: readonly Clue[];
  cols: readonly Clue[];
}

/** A small repeatable random number generator. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clue(values: readonly number[]): Clue {
  return {
    points: values.reduce((sum, v) => sum + v, 0),
    voltorbs: values.filter((v) => v === 0).length,
  };
}

/** The clues for each row and column of a set of cards. */
export function cluesFor(cards: readonly number[]): Pick<Board, "rows" | "cols"> {
  const at = (row: number, col: number) => cards[row * SIZE + col];
  const line = (index: number, along: "row" | "col") =>
    Array.from({ length: SIZE }, (_, i) => (along === "row" ? at(index, i) : at(i, index)));
  return {
    rows: Array.from({ length: SIZE }, (_, r) => clue(line(r, "row"))),
    cols: Array.from({ length: SIZE }, (_, c) => clue(line(c, "col"))),
  };
}

/**
 * A fresh board for a level. Every board is fair to start on: at least one row or column has no
 * Voltorbs at all, so there is always somewhere safe to begin.
 */
export function makeBoard(level: number, rng: Rng = Math.random): Board {
  const layouts = LEVELS[Math.min(Math.max(level, 1), MAX_LEVEL) - 1];
  for (let attempt = 0; ; attempt++) {
    const layout = layouts[Math.floor(rng() * layouts.length)];
    const cards = [
      ...Array<number>(layout.voltorbs).fill(0),
      ...Array<number>(layout.twos).fill(2),
      ...Array<number>(layout.threes).fill(3),
    ];
    while (cards.length < CARDS) cards.push(1);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const clues = cluesFor(cards);
    const safeStart = [...clues.rows, ...clues.cols].some((c) => c.voltorbs === 0);
    // A real random source finds a fair board in a few tries; the cap just guards a stuck one.
    if (safeStart || attempt >= 200) return { cards, ...clues };
  }
}

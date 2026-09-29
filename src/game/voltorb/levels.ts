/**
 * The boards VOLTORB FLIP deals, as in the games: each level has five layouts to pick from, and every
 * layout says how many cards are worth 2, how many are worth 3, and how many are Voltorbs.
 * The rest of the 25 cards are worth 1. Only the first three levels are played here.
 */
export interface Layout {
  twos: number;
  threes: number;
  voltorbs: number;
}

export const LEVELS: ReadonlyArray<readonly Layout[]> = [
  [
    { twos: 3, threes: 1, voltorbs: 6 },
    { twos: 0, threes: 3, voltorbs: 6 },
    { twos: 5, threes: 0, voltorbs: 6 },
    { twos: 2, threes: 2, voltorbs: 6 },
    { twos: 4, threes: 1, voltorbs: 6 },
  ],
  [
    { twos: 1, threes: 3, voltorbs: 7 },
    { twos: 6, threes: 0, voltorbs: 7 },
    { twos: 3, threes: 2, voltorbs: 7 },
    { twos: 0, threes: 4, voltorbs: 7 },
    { twos: 5, threes: 1, voltorbs: 7 },
  ],
  [
    { twos: 2, threes: 3, voltorbs: 8 },
    { twos: 7, threes: 0, voltorbs: 8 },
    { twos: 4, threes: 2, voltorbs: 8 },
    { twos: 1, threes: 4, voltorbs: 8 },
    { twos: 6, threes: 1, voltorbs: 8 },
  ],
];

export const MAX_LEVEL = LEVELS.length;

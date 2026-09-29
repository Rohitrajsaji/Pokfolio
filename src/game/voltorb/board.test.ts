import { describe, expect, it } from "vitest";
import { CARDS, SIZE, cluesFor, makeBoard, seeded } from "./board";
import { LEVELS, MAX_LEVEL } from "./levels";

const count = (cards: readonly number[], value: number) => cards.filter((c) => c === value).length;

describe("the levels", () => {
  it("are the game's: three of them, five layouts each, more Voltorbs as they go", () => {
    expect(MAX_LEVEL).toBe(3);
    expect(LEVELS.map((layouts) => layouts.length)).toEqual([5, 5, 5]);
    expect(LEVELS.map((layouts) => layouts[0].voltorbs)).toEqual([6, 7, 8]);
  });

  it("each fit on the board with room for 1s", () => {
    for (const layouts of LEVELS) {
      for (const { twos, threes, voltorbs } of layouts) {
        expect(twos + threes + voltorbs).toBeLessThan(CARDS);
        expect(twos + threes).toBeGreaterThan(0);
      }
    }
  });
});

describe("a board", () => {
  it.each([1, 2, 3])("on level %i matches one of that level's layouts", (level) => {
    for (let seed = 1; seed <= 40; seed++) {
      const { cards } = makeBoard(level, seeded(seed));
      expect(cards).toHaveLength(CARDS);
      const layout = LEVELS[level - 1].find(
        (l) =>
          l.twos === count(cards, 2) &&
          l.threes === count(cards, 3) &&
          l.voltorbs === count(cards, 0),
      );
      expect(layout, `seed ${seed}`).toBeDefined();
      expect(count(cards, 1)).toBe(CARDS - layout!.twos - layout!.threes - layout!.voltorbs);
    }
  });

  it("has clues that add up: each row and column's points and Voltorbs", () => {
    const { cards, rows, cols } = makeBoard(2, seeded(7));
    for (let r = 0; r < SIZE; r++) {
      const row = cards.slice(r * SIZE, r * SIZE + SIZE);
      expect(rows[r]).toEqual({ points: row.reduce((a, b) => a + b, 0), voltorbs: count(row, 0) });
    }
    for (let c = 0; c < SIZE; c++) {
      const col = Array.from({ length: SIZE }, (_, r) => cards[r * SIZE + c]);
      expect(cols[c]).toEqual({ points: col.reduce((a, b) => a + b, 0), voltorbs: count(col, 0) });
    }
  });

  it("counts every Voltorb once in the rows and once in the columns", () => {
    const { rows, cols, cards } = makeBoard(3, seeded(3));
    const total = count(cards, 0);
    expect(rows.reduce((n, r) => n + r.voltorbs, 0)).toBe(total);
    expect(cols.reduce((n, c) => n + c.voltorbs, 0)).toBe(total);
  });

  it("always has somewhere safe to start: a row or column without a Voltorb", () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      for (let seed = 1; seed <= 200; seed++) {
        const { rows, cols } = makeBoard(level, seeded(seed * 31 + level));
        expect(
          [...rows, ...cols].some((c) => c.voltorbs === 0),
          `level ${level} seed ${seed}`,
        ).toBe(true);
      }
    }
  });

  it("is the same for the same seed, and different for a different one", () => {
    expect(makeBoard(1, seeded(5)).cards).toEqual(makeBoard(1, seeded(5)).cards);
    expect(makeBoard(1, seeded(5)).cards).not.toEqual(makeBoard(1, seeded(6)).cards);
  });

  it("copes with a level outside the ones we have, by using the nearest", () => {
    expect(count(makeBoard(0, seeded(1)).cards, 0)).toBe(6);
    expect(count(makeBoard(9, seeded(1)).cards, 0)).toBe(8);
  });

  it("can be worked out from its cards alone", () => {
    const { cards, rows, cols } = makeBoard(1, seeded(11));
    expect(cluesFor(cards)).toEqual({ rows, cols });
  });
});

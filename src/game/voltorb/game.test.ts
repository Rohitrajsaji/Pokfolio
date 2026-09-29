import { describe, expect, it } from "vitest";
import { CARDS, cluesFor, seeded } from "./board";
import { flip, hasMark, isCleared, newGame, next, toggleMark, type Game } from "./game";

/** A game on a board we choose: the cards row by row, padded out with 1s. */
function gameOn(cards: number[], level = 1): Game {
  const all = [...cards, ...Array<number>(CARDS - cards.length).fill(1)];
  return {
    level,
    board: { cards: all, ...cluesFor(all) },
    flipped: all.map(() => false),
    marks: all.map(() => 0),
    coins: 0,
    total: 0,
    phase: "playing",
    cleared: 0,
  };
}

/** 2 and 3 in the first two spots, a Voltorb in the third, the rest 1s. */
const simple = () => gameOn([2, 3, 0]);

describe("flipping cards", () => {
  it("starts a round with no coins, and the first card sets them", () => {
    const g = flip(simple(), 0);
    expect(g.coins).toBe(2);
    expect(g.flipped[0]).toBe(true);
  });

  it("multiplies the coins by each card's value, as in the games", () => {
    let g = gameOn([2, 3, 0, 1]);
    g = flip(g, 3);
    expect(g.coins).toBe(1);
    g = flip(g, 0);
    expect(g.coins).toBe(2);
    g = flip(g, 4);
    expect(g.coins).toBe(2);
  });

  it("ignores a card that's already flipped", () => {
    const once = flip(simple(), 0);
    expect(flip(once, 0)).toBe(once);
  });

  it("wins the level once every 2 and 3 is flipped, whatever order and whatever else is left", () => {
    let g = flip(simple(), 1);
    expect(g.phase).toBe("playing");
    g = flip(g, 0);
    expect(g.phase).toBe("won");
    expect(g.coins).toBe(6);
    expect(g.total).toBe(6);
    expect(g.cleared).toBe(1);
    // The rest of the board is turned over for you to see.
    expect(g.flipped.every(Boolean)).toBe(true);
  });

  it("doesn't count 1s towards winning", () => {
    expect(isCleared(flip(simple(), 3))).toBe(false);
  });

  it("loses the round, and its coins, on a Voltorb", () => {
    const g = flip(flip(simple(), 0), 2);
    expect(g.phase).toBe("lost");
    expect(g.coins).toBe(0);
    expect(g.total).toBe(0);
    expect(g.cleared).toBe(0);
    expect(g.flipped.every(Boolean)).toBe(true);
  });

  it("does nothing once the round is over", () => {
    const lost = flip(simple(), 2);
    expect(flip(lost, 0)).toBe(lost);
    const won = flip(flip(simple(), 0), 1);
    expect(flip(won, 3)).toBe(won);
  });
});

describe("marks", () => {
  it("are toggled on and off, each on its own", () => {
    let g = toggleMark(simple(), 5, 0);
    g = toggleMark(g, 5, 2);
    expect(hasMark(g, 5, 0)).toBe(true);
    expect(hasMark(g, 5, 2)).toBe(true);
    expect(hasMark(g, 5, 1)).toBe(false);
    g = toggleMark(g, 5, 0);
    expect(hasMark(g, 5, 0)).toBe(false);
    expect(hasMark(g, 5, 2)).toBe(true);
    expect(hasMark(g, 6, 2)).toBe(false);
  });

  it("can't go on a card that's been flipped, or after the round", () => {
    const flipped = flip(simple(), 0);
    expect(toggleMark(flipped, 0, 1)).toBe(flipped);
    const lost = flip(simple(), 2);
    expect(toggleMark(lost, 5, 1)).toBe(lost);
  });
});

describe("carrying on", () => {
  it("moves up a level after a win, with a fresh board and the coins kept", () => {
    const won = flip(flip(simple(), 0), 1);
    const g = next(won, seeded(4));
    expect(g).toMatchObject({ level: 2, phase: "playing", coins: 0, total: 6, cleared: 1 });
    expect(g.flipped.every((f) => !f)).toBe(true);
    expect(g.board).not.toBe(won.board);
  });

  it("deals the same level again after losing, and drops the coins from that round", () => {
    const g = next(flip(simple(), 2), seeded(4));
    expect(g).toMatchObject({ level: 1, phase: "playing", coins: 0, total: 0 });
    expect(g.flipped.every((f) => !f)).toBe(true);
  });

  it("finishes after the last level is won", () => {
    const won = flip(flip(gameOn([2, 3, 0], 3), 0), 1);
    expect(next(won).phase).toBe("finished");
    expect(next(won)).toMatchObject({ cleared: 3, total: 6 });
  });

  it("doesn't skip ahead while the round is still going", () => {
    const g = simple();
    expect(next(g)).toBe(g);
  });

  it("keeps the best level cleared across a loss", () => {
    let g = flip(flip(simple(), 0), 1);
    g = next(g, seeded(9));
    expect(g.cleared).toBe(1);
    // Now lose on level 2: still cleared 1.
    const voltorbs = g.board.cards.map(() => 0);
    g = { ...g, board: { cards: voltorbs, ...cluesFor(voltorbs) } };
    g = flip(g, 0);
    expect(g.phase).toBe("lost");
    expect(g.cleared).toBe(1);
    expect(next(g, seeded(2)).level).toBe(2);
  });
});

describe("a new game", () => {
  it("starts on level 1, playing, with nothing flipped or marked", () => {
    const g = newGame(seeded(1));
    expect(g).toMatchObject({ level: 1, phase: "playing", coins: 0, total: 0, cleared: 0 });
    expect(g.flipped.some(Boolean)).toBe(false);
    expect(g.marks.every((m) => m === 0)).toBe(true);
  });
});

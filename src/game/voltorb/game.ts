import { makeBoard, type Board, type Rng } from "./board";
import { MAX_LEVEL } from "./levels";

/** Playing; a level cleared (all its 2s and 3s flipped); a Voltorb flipped; or all the levels beaten. */
export type Phase = "playing" | "won" | "lost" | "finished";

/** The things you can note on a card you haven't flipped: it might be a Voltorb, or a 1, 2 or 3. */
export const MARKS = [0, 1, 2, 3] as const;
export type Mark = (typeof MARKS)[number];

export interface Game {
  level: number;
  board: Board;
  flipped: readonly boolean[];
  /** Per card, one bit for each mark placed on it. */
  marks: readonly number[];
  /** What this round has earned so far: each card flipped multiplies it, as in the games. */
  coins: number;
  /** Coins banked from levels cleared. */
  total: number;
  phase: Phase;
  /** The highest level cleared so far (0 before the first). */
  cleared: number;
}

function deal(level: number, rng?: Rng) {
  const board = makeBoard(level, rng);
  return {
    board,
    flipped: board.cards.map(() => false),
    marks: board.cards.map(() => 0),
    coins: 0,
  };
}

export function newGame(rng?: Rng): Game {
  return { level: 1, ...deal(1, rng), total: 0, phase: "playing", cleared: 0 };
}

const revealAll = (game: Game): boolean[] => game.board.cards.map(() => true);

/** Whether every card worth more than 1 has been flipped: the level is won. */
export function isCleared(game: Pick<Game, "board" | "flipped">): boolean {
  return game.board.cards.every((value, i) => value < 2 || game.flipped[i]);
}

/**
 * Turns a card over. A Voltorb loses the round (its coins with it); anything else multiplies
 * the round's coins by its value, and flipping the last 2 or 3 wins the level.
 */
export function flip(game: Game, index: number): Game {
  if (game.phase !== "playing" || game.flipped[index]) return game;
  const value = game.board.cards[index];
  if (value === 0) return { ...game, flipped: revealAll(game), coins: 0, phase: "lost" };
  const flipped = game.flipped.map((was, i) => was || i === index);
  const coins = game.coins === 0 ? value : game.coins * value;
  const progress = { ...game, flipped, coins };
  if (!isCleared(progress)) return progress;
  return {
    ...progress,
    flipped: revealAll(game),
    total: game.total + coins,
    cleared: Math.max(game.cleared, game.level),
    phase: "won",
  };
}

/** Puts a mark on a card that's still face down, or takes it off if it's there already. */
export function toggleMark(game: Game, index: number, mark: Mark): Game {
  if (game.phase !== "playing" || game.flipped[index]) return game;
  const marks = game.marks.map((bits, i) => (i === index ? bits ^ (1 << mark) : bits));
  return { ...game, marks };
}

export const hasMark = (game: Pick<Game, "marks">, index: number, mark: Mark): boolean =>
  (game.marks[index] & (1 << mark)) !== 0;

/**
 * Carries on after a level is won or lost: the next level's board after a win (or the end, after the
 * last one), or a fresh board for the same level after losing to a Voltorb.
 */
export function next(game: Game, rng?: Rng): Game {
  if (game.phase === "lost") return { ...game, ...deal(game.level, rng), phase: "playing" };
  if (game.phase !== "won") return game;
  if (game.level >= MAX_LEVEL) return { ...game, phase: "finished" };
  const level = game.level + 1;
  return { ...game, ...deal(level, rng), level, phase: "playing" };
}

"use client";

import { dialogue, palettes, playerLooks } from "@content";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { paintBuffer } from "@/art/canvas";
import { voltorbBuffer } from "@/art/voltorb";
import { sound } from "../../audio/sound";
import type { Action } from "../../engine/input";
import { useGame } from "../../state/store";
import { fillWith } from "../../text";
import { CARDS, SIZE, seeded, type Rng } from "../../voltorb/board";
import { MAX_LEVEL } from "../../voltorb/levels";
import {
  flip,
  hasMark,
  MARKS,
  newGame,
  next,
  toggleMark,
  type Game,
  type Mark,
} from "../../voltorb/game";
import { ScreenFrame } from "../ScreenFrame";
import { MonSprite } from "./parts";

/** A Voltorb, drawn once into a small canvas and shown crisply at whatever size the CSS gives it. */
function VoltorbIcon({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintBuffer(ref.current, voltorbBuffer());
  }, []);
  return (
    <canvas
      ref={ref}
      width={8}
      height={8}
      className={className ? `vf-ball ${className}` : "vf-ball"}
      aria-hidden
    />
  );
}

/** The colours of the clue tiles, one for each row and column, like the games'. */
const CLUE_COLOURS = ["#4caf6a", "#f0983a", "#e0524a", "#4a86d8", "#a25ccd"];

const MARK_NAMES = ["VOLTORB", "1", "2", "3"] as const;
const MARK_TEXT = ["V", "1", "2", "3"] as const;

/** The pen is what A does on a card: flip it (null), or put a note on it. */
type Pen = Mark | null;
const PENS: readonly Pen[] = [null, ...MARKS];

/** Repeatable boards for tests: `?vf=7` deals the same cards every time. */
function makeRng(): Rng {
  const seed = new URLSearchParams(window.location.search).get("vf");
  return seed ? seeded(Number(seed) || 1) : Math.random;
}

const DIRECTIONS: readonly Action[] = ["up", "down", "left", "right"];

/** Moves the cursor around the screen's grid of `[data-r][data-c]` things: cards, then the buttons below them. */
function moveCursor(root: HTMLElement, action: Action): void {
  const items = [...root.querySelectorAll<HTMLElement>("[data-nav][data-r]")];
  const here = items.find((item) => item.hasAttribute("data-current")) ?? items[0];
  if (!here) return;
  const r = Number(here.dataset.r);
  const c = Number(here.dataset.c);
  const rows = [...new Set(items.map((item) => Number(item.dataset.r)))].sort((a, b) => a - b);
  const inRow = (row: number) =>
    items
      .filter((item) => Number(item.dataset.r) === row)
      .sort((a, b) => Number(a.dataset.c) - Number(b.dataset.c));
  let target: HTMLElement | undefined;
  if (action === "left" || action === "right") {
    const row = inRow(r);
    const at = row.indexOf(here);
    target = row[(at + (action === "left" ? -1 : 1) + row.length) % row.length];
  } else {
    const row = rows[(rows.indexOf(r) + (action === "up" ? -1 : 1) + rows.length) % rows.length];
    const candidates = inRow(row);
    target = candidates.reduce((best, item) =>
      Math.abs(Number(item.dataset.c) - c) < Math.abs(Number(best.dataset.c) - c) ? item : best,
    );
  }
  if (target && target !== here) {
    sound.sfx("cursor");
    target.focus();
  }
}

/** What a card is, in words, for screen readers. */
function describe(game: Game, index: number): string {
  const spot = `Row ${Math.floor(index / SIZE) + 1}, column ${(index % SIZE) + 1}`;
  if (game.flipped[index]) {
    const value = game.board.cards[index];
    return `${spot}: ${value === 0 ? "VOLTORB" : value}`;
  }
  const notes = MARKS.filter((mark) => hasMark(game, index, mark)).map((mark) => MARK_NAMES[mark]);
  return `${spot}: face down${notes.length ? `, noted as ${notes.join(", ")}` : ""}`;
}

/** "A", "A and B", "A, B and C". */
function listOf(names: readonly string[]): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The prizes won by clearing exactly this level. */
function prizesFor(level: number): string[] {
  return [...playerLooks, ...palettes].filter((p) => p.earnedAt === level).map((p) => p.name);
}

/**
 * VOLTORB FLIP, as in the games: a 5×5 board of hidden cards, each worth 1, 2 or 3 or a Voltorb. The tiles
 * beside each row and column say how many points it holds and how many Voltorbs hide in it. Flip every 2
 * and 3 to clear the level; flip a Voltorb and lose the round. Three levels, no saving.
 */
export function VoltorbFlipScreen() {
  const compact = useGame((state) => (state.view?.height ?? 180) < 200);
  const [rng] = useState(makeRng);
  const [game, setGame] = useState<Game>(() => newGame(rng));
  const [pen, setPen] = useState<Pen>(null);
  // Which cards the visitor turned themselves (the rest are turned for them when a round ends).
  const [picked, setPicked] = useState<readonly boolean[]>(() => Array(CARDS).fill(false));
  const [helpOpen, setHelpOpen] = useState(() => !useGame.getState().visits["voltorb:howto"]);
  const root = useRef<HTMLDivElement>(null);
  const tokens = {
    level: String(game.level),
    levels: String(MAX_LEVEL),
    coins: String(game.coins),
  };

  const phase = game.phase;
  useEffect(() => {
    if (phase === "won" || phase === "finished") {
      useGame.getState().clearLevel(game.level);
    }
    if (phase === "won") {
      sound.sfx("clear");
      sound.sfx("coin", 0.55);
    }
    if (phase === "lost") sound.sfx("boom");
    // Move the cursor to what happens next.
    root.current?.querySelector<HTMLElement>("[data-action='next']")?.focus();
  }, [phase, game.level]);

  const play = (index: number) => {
    if (pen !== null) {
      sound.sfx("cursor");
      return setGame((g) => toggleMark(g, index, pen));
    }
    if (phase !== "playing" || game.flipped[index]) return;
    sound.sfx("flip");
    setPicked((p) => p.map((was, i) => was || i === index));
    setGame((g) => flip(g, index));
  };

  const carryOn = () => {
    sound.sfx("confirm");
    setGame((g) => next(g, rng));
    setPicked(Array(CARDS).fill(false));
    setPen(null);
  };

  const closeHelp = () => {
    useGame.getState().visit("voltorb:howto");
    setHelpOpen(false);
    sound.sfx("back");
  };

  const onKey = (action: Action) => {
    if (helpOpen) {
      if (action === "a" || action === "b" || action === "start" || action === "escape")
        closeHelp();
      return true;
    }
    if (action === "b" && phase === "playing") {
      sound.sfx("cursor");
      setPen((p) => PENS[(PENS.indexOf(p) + 1) % PENS.length]);
      return true;
    }
    if (DIRECTIONS.includes(action) && root.current) {
      moveCursor(root.current, action);
      return true;
    }
    return false;
  };

  const message =
    phase === "playing"
      ? fillWith(dialogue.voltorb.ready, tokens)
      : phase === "won"
        ? fillWith(dialogue.voltorb.won, tokens)
        : phase === "lost"
          ? dialogue.voltorb.lost
          : fillWith(dialogue.voltorb.finished, tokens);
  const prizes = phase === "won" || phase === "finished" ? prizesFor(game.level) : [];

  return (
    <ScreenFrame title="VOLTORB FLIP" accent="#b03a6a" onKey={onKey}>
      {helpOpen ? (
        <div ref={root} className="vf-help">
          <ul className="bullets readable">
            {dialogue.voltorb.howTo.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="screen-actions">
            <button type="button" data-nav className="screen-button" onClick={closeHelp}>
              GOT IT
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={root}
          className="vf"
          data-phase={phase}
          data-compact={compact ? "" : undefined}
          style={{ "--k": compact ? 1 : 2 } as CSSProperties}
        >
          <div className="vf-board" role="group" aria-label="Board">
            {Array.from({ length: SIZE }, (_, row) => (
              <div key={row} className="vf-row">
                {Array.from({ length: SIZE }, (_, col) => {
                  const index = row * SIZE + col;
                  const up = game.flipped[index];
                  const value = game.board.cards[index];
                  return (
                    <button
                      key={col}
                      type="button"
                      data-nav
                      data-r={row}
                      data-c={col}
                      data-face={up ? "up" : "down"}
                      data-value={up ? value : undefined}
                      data-revealed={up && phase !== "playing" && !picked[index] ? "" : undefined}
                      data-boom={
                        phase === "lost" && up && value === 0 && picked[index] ? "" : undefined
                      }
                      data-pen={pen ?? undefined}
                      className="vf-card"
                      aria-label={describe(game, index)}
                      onClick={() => play(index)}
                    >
                      {up ? (
                        value === 0 ? (
                          <VoltorbIcon className="vf-card-ball" />
                        ) : (
                          value
                        )
                      ) : (
                        MARKS.filter((mark) => hasMark(game, index, mark)).map((mark) => (
                          <span key={mark} className={`vf-mark vf-mark-${mark}`} aria-hidden>
                            {MARK_TEXT[mark]}
                          </span>
                        ))
                      )}
                    </button>
                  );
                })}
                <div
                  className="vf-clue"
                  style={{ "--clue": CLUE_COLOURS[row] } as CSSProperties}
                  aria-label={`Row ${row + 1}: ${game.board.rows[row].points} points, ${game.board.rows[row].voltorbs} VOLTORB`}
                >
                  <span className="vf-points">{game.board.rows[row].points}</span>
                  <span className="vf-orbs">
                    <VoltorbIcon className="vf-clue-ball" />
                    {game.board.rows[row].voltorbs}
                  </span>
                </div>
              </div>
            ))}
            <div className="vf-row">
              {Array.from({ length: SIZE }, (_, col) => (
                <div
                  key={col}
                  className="vf-clue"
                  style={{ "--clue": CLUE_COLOURS[col] } as CSSProperties}
                  aria-label={`Column ${col + 1}: ${game.board.cols[col].points} points, ${game.board.cols[col].voltorbs} VOLTORB`}
                >
                  <span className="vf-points">{game.board.cols[col].points}</span>
                  <span className="vf-orbs">
                    <VoltorbIcon className="vf-clue-ball" />
                    {game.board.cols[col].voltorbs}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="vf-side">
            <p className="vf-stat">
              <span>LEVEL</span>
              <span>
                {game.level}/{MAX_LEVEL}
              </span>
            </p>
            <p className="vf-stat">
              <span>TOTAL</span>
              <span>{game.total}</span>
            </p>
            <p className="vf-stat">
              <span>ROUND</span>
              <span>{game.coins}</span>
            </p>
            <p className="vf-message" role="status" aria-live="polite">
              {message}
              {prizes.length > 0 && (
                <span className="vf-prize">
                  {" "}
                  {fillWith(dialogue.voltorb.prize, { prizes: listOf(prizes) })}
                </span>
              )}
            </p>
            {phase === "lost" && !compact && (
              <MonSprite mon={{ dex: 100, name: "VOLTORB" }} decorative className="vf-boom-mon" />
            )}
            {phase === "playing" ? (
              <div className="vf-pens" role="radiogroup" aria-label="What A does">
                {PENS.map((choice, i) => (
                  <button
                    key={String(choice)}
                    type="button"
                    role="radio"
                    data-nav
                    data-r={SIZE}
                    data-c={i}
                    aria-checked={pen === choice}
                    className="vf-chip"
                    onClick={() => setPen(choice)}
                  >
                    {choice === null ? "FLIP" : MARK_TEXT[choice]}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                data-nav
                data-r={SIZE}
                data-c={0}
                data-action="next"
                className="screen-button"
                onClick={phase === "finished" ? () => useGame.getState().closeOverlay() : carryOn}
              >
                {phase === "won"
                  ? game.level < MAX_LEVEL
                    ? "NEXT LEVEL"
                    : "FINISH"
                  : phase === "lost"
                    ? "TRY AGAIN"
                    : "DONE"}
              </button>
            )}
            <button
              type="button"
              data-nav
              data-r={SIZE + 1}
              data-c={0}
              className="screen-button"
              onClick={() => setHelpOpen(true)}
            >
              HOW TO PLAY
            </button>
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}

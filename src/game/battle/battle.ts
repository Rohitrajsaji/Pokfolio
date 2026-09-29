/**
 * The catch-to-hire battle's rules, free of React so they're easy to test.
 * Each choice returns "beats": lines of text shown one at a time, each with
 * how the battle looks while it's on screen. Nothing is random.
 */
import { battle, site, skills } from "@content";
import type { PokeType } from "@content/types";
import { fill, fillWith } from "../text";

export type Ball = "poke-ball" | "master-ball";

export const BALLS: readonly Ball[] = ["poke-ball", "master-ball"];

export const BALL_NAMES: Readonly<Record<Ball, string>> = {
  "poke-ball": "POKé BALL",
  "master-ball": "MASTER BALL",
};

export interface BattleState {
  /** The wild Pokémon's HP, from 1 (full) down to MIN_HP: it never faints. */
  hp: number;
  paralyzed: boolean;
  /** Balls thrown so far. The second one always catches. */
  throws: number;
  /** Turns the wild Pokémon has taken, which picks the skill it shows off next. */
  turns: number;
  /** The wild Pokémon's sprite id. Rotom changes form to match each skill category. */
  sprite: number;
  /** Whether your partner has been sent out. */
  partnerOut: boolean;
  /** The ball the wild Pokémon is sitting in, if any. */
  ball: Ball | null;
}

/** A one-off animation (and sound) for when a beat starts. */
export type Cue =
  | "appear"
  | "send-out"
  | "partner-attack"
  | "wild-attack"
  | "form-change"
  | "paralyze"
  | "throw"
  | "break-free"
  | "caught";

export interface Beat {
  text: string;
  /** How the battle looks while this line is on screen. */
  state: BattleState;
  cue?: Cue;
  /** For "throw": how many times the ball shakes after it lands. */
  shakes?: number;
  /** The battle is over once this line has been read. */
  end?: "caught" | "fled";
}

/** HP one damaging move takes off. */
export const DAMAGE = 0.4;
export const MIN_HP = 0.1;
/** At or below this HP, any ball catches. */
export const WEAK_HP = 0.25;

const ROTOM = 479;

/** Rotom's appliance forms (PokeAPI ids), by the type of the skill it shows off. */
const ROTOM_FORMS: Partial<Record<PokeType, number>> = {
  fire: 10008,
  water: 10009,
  ice: 10010,
  flying: 10011,
  grass: 10012,
};

/** The wild Pokémon's sprite while it shows off a skill of this type. Only Rotom changes. */
export function formFor(type: PokeType): number {
  if (site.wild.dex !== ROTOM) return site.wild.dex;
  return ROTOM_FORMS[type] ?? ROTOM;
}

export function startState(): BattleState {
  return {
    hp: 1,
    paralyzed: false,
    throws: 0,
    turns: 0,
    sprite: site.wild.dex,
    partnerOut: false,
    ball: null,
  };
}

/** "A wild ROHIT appeared!", then out comes your partner. */
export function opening(state: BattleState): Beat[] {
  return [
    { text: fill(battle.text.appeared), state, cue: "appear" },
    { text: fill(battle.text.go), state: { ...state, partnerOut: true }, cue: "send-out" },
  ];
}

/** The wild Pokémon's turn: it switches to the next skill category and shows off a skill. */
function wildTurn(state: BattleState): Beat[] {
  if (skills.length === 0) return [];
  const category = skills[state.turns % skills.length];
  const round = Math.floor(state.turns / skills.length);
  const skill = category.skills[round % category.skills.length];
  const next = { ...state, turns: state.turns + 1, sprite: formFor(category.type) };
  const beats: Beat[] = [];
  if (state.turns === 0 || skills.length > 1) {
    beats.push({
      text: fillWith(battle.text.switched, { category: category.name.toUpperCase() }),
      state: next,
      cue: next.sprite !== state.sprite ? "form-change" : undefined,
    });
  }
  beats.push(
    {
      text: fillWith(battle.text.wildMove, { skill: skill.toUpperCase() }),
      state: next,
      cue: "wild-attack",
    },
    { text: fill(battle.text.effective), state: next },
  );
  return beats;
}

/** Your partner uses one of its moves, then the wild Pokémon takes its turn. */
export function fight(state: BattleState, moveIndex: number): Beat[] {
  const move = battle.moves[moveIndex];
  const used = fillWith(battle.text.partnerMove, { move: move.name });
  const beats: Beat[] = [];
  let after = state;

  if (move.effect === "paralyze") {
    beats.push({ text: used, state, cue: "partner-attack" });
    if (state.paralyzed) {
      beats.push({ text: fill(battle.text.alreadyParalyzed), state });
    } else {
      after = { ...state, paralyzed: true };
      beats.push({ text: fill(battle.text.paralyzed), state: after, cue: "paralyze" });
    }
  } else {
    after = { ...state, hp: Math.max(MIN_HP, state.hp - DAMAGE) };
    beats.push({ text: used, state: after, cue: "partner-attack" });
    if (state.hp > WEAK_HP && after.hp <= WEAK_HP) {
      beats.push({ text: fill(battle.text.weak), state: after });
    }
  }
  return [...beats, ...wildTurn(after)];
}

/** Throws a ball. A worn-down, paralyzed or second-time target is a sure catch. */
export function throwBall(state: BattleState, ball: Ball): Beat[] {
  const sure = ball === "master-ball" || state.paralyzed || state.hp <= WEAK_HP || state.throws > 0;
  // A ball that won't hold shakes once at full health, twice once the Pokémon is hurt.
  const escapeShakes = state.hp > 0.5 ? 1 : 2;
  const shakes = sure ? 3 : escapeShakes;
  const held = { ...state, throws: state.throws + 1, ball };
  const thrown: Beat = {
    text: fillWith(battle.text.thrown, { ball: BALL_NAMES[ball] }),
    state: held,
    cue: "throw",
    shakes,
  };
  if (sure) {
    const lines = battle.text.caught.map(fill);
    return [
      thrown,
      ...lines.map((text, i): Beat => ({
        text,
        state: held,
        cue: i === 0 ? "caught" : undefined,
        end: i === lines.length - 1 ? "caught" : undefined,
      })),
    ];
  }
  const free = { ...held, ball: null };
  return [
    thrown,
    { text: fill(battle.text.brokeFree[escapeShakes]), state: free, cue: "break-free" },
    ...wildTurn(free),
  ];
}

export function checkParty(state: BattleState): Beat[] {
  return [{ text: fill(battle.text.party), state }];
}

export function run(state: BattleState): Beat[] {
  return [{ text: fill(battle.text.fled), state, end: "fled" }];
}

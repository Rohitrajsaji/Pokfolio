import { battle, site, skills } from "@content";
import { describe, expect, it } from "vitest";
import { fill, fillWith } from "../text";
import {
  DAMAGE,
  MIN_HP,
  WEAK_HP,
  checkParty,
  fight,
  formFor,
  opening,
  run,
  startState,
  throwBall,
  type BattleState,
  type Beat,
} from "./battle";

const DAMAGING = battle.moves.findIndex((move) => move.effect === "damage");
const PARALYZING = battle.moves.findIndex((move) => move.effect === "paralyze");
const last = (beats: Beat[]) => beats[beats.length - 1];
const texts = (beats: Beat[]) => beats.map((beat) => beat.text);
const ready = (): BattleState => last(opening(startState())).state;

describe("the opening", () => {
  it("announces the wild Pokémon, then sends out your partner", () => {
    const beats = opening(startState());
    expect(texts(beats)).toEqual([fill(battle.text.appeared), fill(battle.text.go)]);
    expect(beats[0]).toMatchObject({ cue: "appear", state: { partnerOut: false } });
    expect(beats[1]).toMatchObject({ cue: "send-out", state: { partnerOut: true } });
  });
});

describe("FIGHT", () => {
  it("wears the wild Pokémon down, but it never faints", () => {
    let state = ready();
    const beats = fight(state, DAMAGING);
    expect(beats[0]).toMatchObject({
      text: fillWith(battle.text.partnerMove, { move: battle.moves[DAMAGING].name }),
      cue: "partner-attack",
    });
    expect(beats[0].state.hp).toBeCloseTo(1 - DAMAGE);
    for (let i = 0; i < 10; i++) state = last(fight(state, DAMAGING)).state;
    expect(state.hp).toBe(MIN_HP);
  });

  it("says once, and only once, that the wild Pokémon is tired out", () => {
    const weak = fill(battle.text.weak);
    let state = ready();
    let said = 0;
    for (let i = 0; i < 6; i++) {
      const beats = fight(state, DAMAGING);
      said += texts(beats).filter((text) => text === weak).length;
      state = last(beats).state;
    }
    expect(said).toBe(1);
    expect(state.hp).toBeLessThanOrEqual(WEAK_HP);
  });

  it("shows off a new skill category each turn, changing form to match", () => {
    let state = ready();
    for (const category of skills) {
      const beats = fight(state, DAMAGING);
      const switched = fillWith(battle.text.switched, { category: category.name.toUpperCase() });
      const used = fillWith(battle.text.wildMove, { skill: category.skills[0].toUpperCase() });
      expect(texts(beats)).toContain(switched);
      expect(texts(beats)).toContain(used);
      state = last(beats).state;
      expect(state.sprite).toBe(formFor(category.type));
    }
    // Round two moves on to each category's next skill.
    const again = texts(fight(state, DAMAGING));
    const next = skills[0].skills[1 % skills[0].skills.length].toUpperCase();
    expect(again).toContain(fillWith(battle.text.wildMove, { skill: next }));
  });

  it("paralyzes with a status move, only once", () => {
    const first = fight(ready(), PARALYZING);
    expect(texts(first)).toContain(fill(battle.text.paralyzed));
    const state = last(first).state;
    expect(state).toMatchObject({ paralyzed: true, hp: 1 });
    expect(texts(fight(state, PARALYZING))).toContain(fill(battle.text.alreadyParalyzed));
  });
});

describe("Rotom's forms", () => {
  it("follow the skill category's type, with plain Rotom for the rest", () => {
    expect(site.wild.dex).toBe(479);
    expect(formFor("fire")).toBe(10008);
    expect(formFor("water")).toBe(10009);
    expect(formFor("ice")).toBe(10010);
    expect(formFor("flying")).toBe(10011);
    expect(formFor("grass")).toBe(10012);
    expect(formFor("ghost")).toBe(479);
  });
});

describe("BAG", () => {
  it("lets the first POKé BALL break free at full HP; the wild Pokémon then takes its turn", () => {
    const beats = throwBall(ready(), "poke-ball");
    expect(beats[0]).toMatchObject({ cue: "throw", shakes: 1, state: { ball: "poke-ball" } });
    expect(beats[1]).toMatchObject({ text: fill(battle.text.brokeFree[1]), cue: "break-free" });
    expect(beats[1].state.ball).toBeNull();
    expect(beats.some((beat) => beat.end)).toBe(false);
    expect(last(beats).state).toMatchObject({ throws: 1, turns: 1 });
  });

  it("always catches with the second ball", () => {
    const state = last(throwBall(ready(), "poke-ball")).state;
    const beats = throwBall(state, "poke-ball");
    expect(beats[0]).toMatchObject({ cue: "throw", shakes: 3 });
    expect(texts(beats).slice(1)).toEqual(battle.text.caught.map(fill));
    expect(beats[1].cue).toBe("caught");
    expect(last(beats).end).toBe("caught");
  });

  it("catches at once with a MASTER BALL, when tired out, or when paralyzed", () => {
    const tired = { ...ready(), hp: WEAK_HP };
    const paralyzed = { ...ready(), paralyzed: true };
    expect(last(throwBall(ready(), "master-ball")).end).toBe("caught");
    expect(last(throwBall(tired, "poke-ball")).end).toBe("caught");
    expect(last(throwBall(paralyzed, "poke-ball")).end).toBe("caught");
  });

  it("shakes twice before breaking free once the wild Pokémon is hurt", () => {
    const hurt = { ...ready(), hp: 0.4 };
    const beats = throwBall(hurt, "poke-ball");
    expect(beats[0].shakes).toBe(2);
    expect(beats[1].text).toBe(fill(battle.text.brokeFree[2]));
  });
});

describe("POKéMON and RUN", () => {
  it("POKéMON just says the partner is alone for now", () => {
    const beats = checkParty(ready());
    expect(texts(beats)).toEqual([fill(battle.text.party)]);
    expect(beats[0].end).toBeUndefined();
  });

  it("RUN gets away safely and ends the battle", () => {
    const beats = run(ready());
    expect(beats).toEqual([expect.objectContaining({ text: fill(battle.text.fled), end: "fled" })]);
  });
});

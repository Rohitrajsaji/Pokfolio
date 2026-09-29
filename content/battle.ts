import type { BattleSpec } from "./types";

/**
 * The catch-to-hire battle: step into the tall grass, meet the wild {wild},
 * and catch it for {name}'s contact details. Nobody faints. Each turn the
 * wild {wild} shows off the next skill category from skills.ts.
 */
export const battle: BattleSpec = {
  levels: { partner: 25, wild: 26 },
  moves: [
    { name: "THUNDERBOLT", type: "electric", effect: "damage" },
    { name: "QUICK ATTACK", type: "normal", effect: "damage" },
    { name: "IRON TAIL", type: "steel", effect: "damage" },
    { name: "THUNDER WAVE", type: "electric", effect: "paralyze" },
  ],
  text: {
    appeared: "A wild {wild} appeared!",
    go: "Go! {partner}!",
    prompt: "What will {partner} do?",
    partnerMove: "{partner} used {move}!",
    weak: "The wild {wild} is tired out. Now's your chance to throw a POKé BALL!",
    paralyzed: "The wild {wild} is paralyzed! It'll be easier to catch!",
    alreadyParalyzed: "But the wild {wild} is already paralyzed!",
    switched: "The wild {wild} switched to {category} mode!",
    wildMove: "The wild {wild} used {skill}!",
    effective: "It's super effective! {partner} looks impressed.",
    thrown: "You threw a {ball}!",
    brokeFree: [
      "Oh no! The POKéMON broke free!",
      "Aww! It appeared to be caught!",
      "Aargh! Almost had it!",
    ],
    caught: [
      "Gotcha! {wild} was caught!",
      "{name} is ready to join your team. Let's swap contact details!",
    ],
    party: "{partner} is your only POKéMON... for now!",
    fled: "Got away safely!",
  },
};

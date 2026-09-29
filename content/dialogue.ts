/**
 * Game text that isn't tied to a place. Lines may use {name}, {town},
 * {partner} and {wild}.
 */
export const dialogue = {
  welcome: [
    "Welcome to {town}!",
    "Walk with the arrow keys or WASD, or tap where you want to go.",
    "Press Z or ENTER to talk and read. M or ESC opens the menu.",
  ],
  /** The career evolution screen. {from} and {to} are the mascots' names. */
  evolution: {
    intro: "Every career starts somewhere. Here's how {name}'s evolved!",
    evolving: "What? {from} is evolving!",
    evolved: "Congratulations! Your {from} evolved into {to}!",
    done: "{to} is fully evolved... for now!",
  },
  /** The short scene after the title screen. PROF. {name} does the talking. */
  intro: {
    speaker: "PROF. {name}",
    lines: [
      "Hello there! Welcome to {town}!",
      "I'm PROF. {name}. People call me the AI ENGINEER.",
      "This town is where legacy apps evolve and AI agents are born.",
      "Wander in to see my projects, career and skills. And watch the tall grass!",
      "A wild {wild} lives there. Catching it is the best way to get in touch.",
      "Your adventure begins now!",
    ],
  },
  /** The HELP screen: the controls, then a few tips. */
  help: {
    controls: [
      ["MOVE", "Arrow keys or WASD, the D-pad, or tap where you want to go"],
      ["A", "Z, ENTER or SPACE: talk, read, choose"],
      ["B", "X or BACKSPACE: go back. Hold it to run"],
      ["START", "M or ESC: open the menu"],
      ["RUN", "Hold SHIFT, or hold B, while you walk"],
    ],
    tips: [
      "Talk to people, signs and PCs. Doors open as you walk into them.",
      "The TOWN MAP in the menu takes you anywhere at once.",
      "Everything you can find here is also in the RÉSUMÉ.",
      "Catch the wild {wild} in the tall grass to get in touch.",
    ],
  },
  /** The CREDITS screen. The fan disclaimer from site.ts is shown under these lines. */
  credits: {
    lines: [
      "A fan tribute, made as a personal portfolio by {name}.",
      "Pokémon sprites, item icons and cries come from PokeAPI.",
      "The town, the buildings, the people, the music and the sound effects are original.",
      "Built with Next.js, React and the Web Audio API.",
    ],
    link: { label: "POKEAPI", url: "https://pokeapi.co" },
  },
  /** VOLTORB FLIP, in the hidden Game Corner. {coins}, {level}, {levels} and {prize} are filled in. */
  voltorb: {
    howTo: [
      "Flip cards to win coins. Each card is worth 1, 2 or 3... or it's a VOLTORB.",
      "Every card you flip multiplies your coins by its number.",
      "Flip a VOLTORB and it explodes: you lose the coins from this round!",
      "The tiles beside each row and column show the points in it, and how many VOLTORBs are hiding there.",
      "Flip every 2 and every 3 to clear the level. The 1s are only there to trick you.",
      "Press B to pick a pen (V, 1, 2 or 3), then A puts that note on a card you've worked out. B goes back to flipping.",
    ],
    ready: "Level {level}. Flip a card to start!",
    won: "GAME CLEAR! You won {coins} coins!",
    lost: "BOOM! A VOLTORB exploded, and this round's coins are gone.",
    finished: "You cleared all {levels} levels! You're the GAME CORNER champion!",
    prize: "You won: {prizes}! See the PRIZE COUNTER, or OPTIONS.",
  },
  /** The prize counter and OPTIONS' PRIZES page. {level} is the level to clear. */
  prizes: {
    intro: "Prizes for clearing levels of VOLTORB FLIP. They last for this visit.",
    locked: "Clear level {level} to win this",
    chosen: "You picked {prize}!",
  },
  /** What a cameo shows, for screen readers. */
  cameos: {
    rotom: "The TV crackles, and a wild ROTOM hops out of it.",
    missingno:
      "The screen falls apart into scrambled tiles, and a jumble that used to be a Pokémon appears.",
  },
  /** The POKé MART clerk. {item} is the TM the visitor tried to buy. */
  shop: {
    greeting: "Welcome! These TMs teach all of {name}'s skills. Take a look!",
    refusal: [
      "{item}? Sorry, {name}'s skills aren't for sale...",
      "...but {name} IS open to new roles!",
    ],
  },
};

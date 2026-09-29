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
  /** The POKé MART clerk. {item} is the TM the visitor tried to buy. */
  shop: {
    greeting: "Welcome! These TMs teach all of {name}'s skills. Take a look!",
    refusal: [
      "{item}? Sorry, {name}'s skills aren't for sale...",
      "...but {name} IS open to new roles!",
    ],
  },
};

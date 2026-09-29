// @vitest-environment jsdom
import { battle, site } from "@content";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { input, type Action } from "../../engine/input";
import { DEFAULT_SETTINGS, useGame } from "../../state/store";
import { fill, fillWith } from "../../text";
import { BattleScreen } from "./BattleScreen";

const press = (action: Action) =>
  act(() => {
    input.press(action);
    input.release(action);
  });

/** The battle line currently on screen, as screen readers hear it. */
const line = () => document.querySelector(".battle [aria-live]")?.textContent ?? null;

/** Reads lines with A until the command menu is back. */
function readToMenu() {
  for (let i = 0; i < 20 && line() !== null; i++) press("a");
  expect(line()).toBeNull();
}

const current = () => document.querySelector(".battle [data-current]")?.textContent;

beforeAll(() => {
  // Reduced motion skips the intro and the ball's shaking, so tests needn't wait.
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
});

beforeEach(() => {
  useGame.setState({
    settings: { ...DEFAULT_SETTINGS, textSpeed: "instant" },
    overlay: { kind: "battle", id: 1 },
    caught: false,
  });
  render(<BattleScreen />);
});

afterEach(() => {
  cleanup();
  input.releaseAll();
});

describe("a shiny encounter", () => {
  it("shows the shiny sprite and says a shiny one appeared, once the secret is found", () => {
    cleanup();
    useGame.setState({ secrets: ["shiny"] });
    render(<BattleScreen />);
    expect(line()).toBe(fill(battle.text.appearedShiny));
    expect(document.querySelector(".battle-wild .battle-sprite")?.getAttribute("src")).toContain(
      "/shiny/",
    );
    expect(document.querySelector(".battle-wild .shiny-sparkle")).not.toBeNull();
    useGame.setState({ secrets: [] });
  });

  it("is an ordinary encounter otherwise", () => {
    expect(
      document.querySelector(".battle-wild .battle-sprite")?.getAttribute("src"),
    ).not.toContain("/shiny/");
    expect(document.querySelector(".shiny-sparkle")).toBeNull();
  });
});

describe("the battle", () => {
  it("opens with the wild encounter, then asks what to do", () => {
    expect(line()).toBe(fill(battle.text.appeared));
    press("a");
    expect(line()).toBe(fill(battle.text.go));
    press("a");
    expect(screen.getByText(fill(battle.text.prompt))).toBeTruthy();
    expect(current()).toBe("FIGHT");
  });

  it("moves around the command grid in two dimensions", () => {
    readToMenu();
    press("down");
    expect(current()).toBe("POKéMON");
    press("right");
    expect(current()).toBe("RUN");
    press("up");
    expect(current()).toBe("BAG");
  });

  it("gets away safely with RUN", () => {
    readToMenu();
    press("down");
    press("right");
    press("a");
    expect(line()).toBe(fill(battle.text.fled));
    press("a");
    expect(useGame.getState().overlay).toBeNull();
    expect(useGame.getState().caught).toBe(false);
  });

  it("fights, wears the wild Pokémon down, and remembers the cursor", () => {
    readToMenu();
    press("a");
    expect(screen.getByRole("menu", { name: "Moves" })).toBeTruthy();
    press("a");
    expect(line()).toBe(fillWith(battle.text.partnerMove, { move: battle.moves[0].name }));
    readToMenu();
    const wild = site.wild.nickname ?? site.wild.name;
    expect(screen.getByRole("group", { name: new RegExp(`^Wild ${wild}.* 60% HP`) })).toBeTruthy();
    expect(current()).toBe("FIGHT");
  });

  it("backs out of a submenu with B", () => {
    readToMenu();
    press("a");
    press("b");
    expect(screen.getByRole("menu", { name: "Battle commands" })).toBeTruthy();
  });

  it("catches with a MASTER BALL, then opens the contact screen", () => {
    readToMenu();
    press("right");
    press("a");
    press("down");
    expect(current()).toContain("MASTER BALL");
    press("a");
    expect(line()).toBe(fillWith(battle.text.thrown, { ball: "MASTER BALL" }));
    press("a");
    expect(line()).toBe(fill(battle.text.caught[0]));
    // Read the rest of the lines; the last one ends the battle.
    for (let i = 1; i < battle.text.caught.length; i++) press("a");
    press("a");
    expect(useGame.getState().caught).toBe(true);
    expect(useGame.getState().overlay).toMatchObject({
      kind: "screen",
      request: { screen: "contact" },
    });
  });

  it("takes clicks and taps as well as buttons", () => {
    fireEvent.click(screen.getByRole("group", { name: "Battle" }));
    fireEvent.click(screen.getByRole("group", { name: "Battle" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "POKéMON" }));
    expect(line()).toBe(fill(battle.text.party));
  });
});

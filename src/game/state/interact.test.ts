import { dialogue } from "@content";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fill } from "../text";
import { sound } from "../audio/sound";
import { beginAdventure, forVisit, runInteraction } from "./interact";
import { useGame, type Overlay } from "./store";

vi.mock("../audio/sound", () => ({
  sound: { cry: vi.fn(), sfx: vi.fn(), playJingle: vi.fn() },
}));

function openDialog() {
  const overlay = useGame.getState().overlay as Extract<Overlay, { kind: "dialog" }>;
  expect(overlay?.kind).toBe("dialog");
  return overlay.dialog;
}

/** What the dialog box does when the visitor finishes reading (and answers). */
function finish(answer: boolean | null = null) {
  const dialog = openDialog();
  useGame.getState().closeOverlay();
  dialog.onClose?.(answer);
}

beforeEach(() => {
  useGame.setState({ overlay: null, secrets: [], visits: {} });
  vi.clearAllMocks();
});

describe("runInteraction", () => {
  it("shows the lines with names filled in, then opens the screen", () => {
    runInteraction({ lines: ["Hi, {name}!"], then: { screen: "contact" } }, "NURSE");
    expect(openDialog()).toMatchObject({ pages: ["Hi, ROHIT!"], speaker: "NURSE" });
    finish();
    expect(useGame.getState().overlay).toMatchObject({
      kind: "screen",
      request: { screen: "contact" },
      back: null,
    });
  });

  it("opens the screen only when the visitor says YES", () => {
    const interaction = {
      lines: ["It's a PC."],
      confirm: { question: "Log in?", no: ["You logged off."] },
      then: { screen: "resume" as const },
    };
    runInteraction(interaction);
    expect(openDialog().ask).toBe("Log in?");
    finish(true);
    expect(useGame.getState().overlay).toMatchObject({
      kind: "screen",
      request: { screen: "resume" },
      back: null,
    });

    runInteraction(interaction);
    finish(false);
    expect(openDialog().pages).toEqual(["You logged off."]);
  });

  it("goes straight to the screen when there is nothing to say", () => {
    runInteraction({ then: { screen: "jobs" } });
    expect(useGame.getState().overlay).toMatchObject({
      kind: "screen",
      request: { screen: "jobs" },
      back: null,
    });
  });
});

describe("beginAdventure", () => {
  it("starts the game and explains the controls", () => {
    useGame.setState({ stage: "intro" });
    beginAdventure();
    expect(useGame.getState().stage).toBe("play");
    expect(openDialog().pages).toEqual(dialogue.welcome.map(fill));
  });
});

describe("coming back to the same thing", () => {
  const elder = {
    lines: ["Back in my day..."],
    visits: [
      { from: 3, lines: ["I've had my coffee!"] },
      { from: 6, lines: ["Still feeling great."] },
    ],
  };

  it("says something different from the visit it was written for onwards", () => {
    expect(forVisit(elder, 1).lines).toEqual(["Back in my day..."]);
    expect(forVisit(elder, 2).lines).toEqual(["Back in my day..."]);
    expect(forVisit(elder, 3).lines).toEqual(["I've had my coffee!"]);
    expect(forVisit(elder, 5).lines).toEqual(["I've had my coffee!"]);
    expect(forVisit(elder, 6).lines).toEqual(["Still feeling great."]);
    expect(forVisit(elder, 99).lines).toEqual(["Still feeling great."]);
  });

  it("replaces everything: a later visit doesn't keep the screen the first one opened", () => {
    const tv = {
      lines: ["A trainer card is on TV."],
      then: { screen: "card" as const },
      visits: [{ from: 4, lines: ["The TV crackles."], effect: { cameo: "rotom" as const } }],
    };
    expect(forVisit(tv, 4)).toEqual({ lines: ["The TV crackles."], effect: { cameo: "rotom" } });
  });

  it("counts each visit under its own key, starting at one", () => {
    runInteraction(elder, "ELDER", "town:elder");
    expect(openDialog().pages).toEqual(["Back in my day..."]);
    runInteraction(elder, "ELDER", "town:elder");
    runInteraction(elder, "ELDER", "town:elder");
    expect(openDialog().pages).toEqual(["I've had my coffee!"]);
    expect(useGame.getState().visits["town:elder"]).toBe(3);
    runInteraction(elder, "ELDER", "town:someone-else");
    expect(openDialog().pages).toEqual(["Back in my day..."]);
  });

  it("doesn't count visits to things that never change", () => {
    runInteraction({ lines: ["A sign."] }, undefined, "town:sign");
    expect(useGame.getState().visits).toEqual({});
  });
});

describe("effects", () => {
  it("happen once the lines are done: a secret is unlocked, and only then", () => {
    runInteraction({ lines: ["A switch!"], effect: { unlock: "arcade" } });
    expect(useGame.getState().secrets).toEqual([]);
    finish();
    expect(useGame.getState().secrets).toEqual(["arcade"]);
  });

  it("unlock a secret only once, however often they're set off", () => {
    useGame.getState().unlock("arcade");
    useGame.getState().unlock("arcade");
    expect(useGame.getState().secrets).toEqual(["arcade"]);
  });

  it("can start a cameo, and play a cry", () => {
    runInteraction({
      lines: ["Crackle!"],
      effect: { cameo: "rotom", cry: 479, after: ["It hid again."] },
    });
    finish();
    expect(sound.cry).toHaveBeenCalledWith(479);
    expect(useGame.getState().overlay).toMatchObject({
      kind: "cameo",
      cameo: "rotom",
      after: ["It hid again."],
    });
  });

  it("can play a jingle, once the visitor has said YES", () => {
    const interaction = {
      lines: ["Let me look that up."],
      confirm: { question: "Ready?", no: ["Another time."] },
      effect: { jingle: "healed" as const },
    };
    runInteraction(interaction);
    finish(false);
    expect(sound.playJingle).not.toHaveBeenCalled();
    runInteraction(interaction);
    finish(true);
    expect(sound.playJingle).toHaveBeenCalledWith("healed");
  });

  it("chime when a secret is found", () => {
    runInteraction({ effect: { unlock: "arcade" } });
    expect(sound.sfx).toHaveBeenCalledWith("unlock");
  });

  it("leave the chime out when a cameo makes its own noise", () => {
    runInteraction({ effect: { unlock: "shiny", cameo: "missingno" } });
    expect(sound.sfx).not.toHaveBeenCalledWith("unlock");
    expect(useGame.getState().secrets).toContain("shiny");
  });

  it("wait for YES when the visitor was asked", () => {
    const interaction = {
      lines: ["A switch."],
      confirm: { question: "Press it?", no: ["You left it."] },
      effect: { unlock: "arcade" as const },
    };
    runInteraction(interaction);
    finish(false);
    expect(useGame.getState().secrets).toEqual([]);
    runInteraction(interaction);
    finish(true);
    expect(useGame.getState().secrets).toEqual(["arcade"]);
  });

  it("run before the screen the interaction opens", () => {
    runInteraction({ effect: { unlock: "arcade" }, then: { screen: "card" } });
    expect(useGame.getState().secrets).toEqual(["arcade"]);
    expect(useGame.getState().overlay).toMatchObject({ kind: "screen" });
  });
});

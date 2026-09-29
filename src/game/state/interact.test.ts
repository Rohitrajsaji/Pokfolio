import { beforeEach, describe, expect, it } from "vitest";
import { runInteraction } from "./interact";
import { useGame, type Overlay } from "./store";

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

beforeEach(() => useGame.setState({ overlay: null }));

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

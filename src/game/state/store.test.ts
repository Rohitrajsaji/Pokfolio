import { beforeEach, describe, expect, it } from "vitest";
import { useGame } from "./store";

const overlay = () => useGame.getState().overlay;

beforeEach(() => useGame.setState({ overlay: null }));

describe("screens", () => {
  it("go back to the START menu when opened from it", () => {
    useGame.getState().openMenu();
    useGame.getState().openScreen({ screen: "dex" }, true);
    expect(overlay()).toMatchObject({ kind: "screen", request: { screen: "dex" } });
    useGame.getState().closeOverlay();
    expect(overlay()).toEqual({ kind: "menu" });
  });

  it("go back to walking around when opened from the world", () => {
    useGame.getState().openScreen({ screen: "jobs" });
    useGame.getState().closeOverlay();
    expect(overlay()).toBeNull();
  });

  it("never stack: a screen opened from another takes its place, and closes back to where that one came from", () => {
    const { openScreen, pushScreen, closeOverlay } = useGame.getState();
    openScreen({ screen: "party" }, true);
    pushScreen({ screen: "evolution" });
    expect(overlay()).toMatchObject({ request: { screen: "evolution" }, back: { kind: "menu" } });
    closeOverlay();
    expect(overlay()).toEqual({ kind: "menu" });
  });

  it("open only once: opening the screen that is already open does nothing", () => {
    const { openScreen, pushScreen } = useGame.getState();
    openScreen({ screen: "jobs" });
    const first = overlay();
    for (let i = 0; i < 5; i++) {
      openScreen({ screen: "jobs" });
      pushScreen({ screen: "jobs" });
    }
    expect(overlay()).toBe(first);
    // A different page of the same screen is a different screen, though.
    openScreen({ screen: "dex", project: "mnemo" });
    const dex = overlay();
    openScreen({ screen: "dex", project: "mnemo" });
    expect(overlay()).toBe(dex);
    openScreen({ screen: "dex", project: "sovereign" });
    expect(overlay()).not.toBe(dex);
  });

  it("get a fresh id when reopened after being closed, so it starts over", () => {
    const { openScreen, closeOverlay } = useGame.getState();
    openScreen({ screen: "card" });
    const first = overlay();
    closeOverlay();
    openScreen({ screen: "card" });
    const second = overlay();
    expect(first?.kind === "screen" && second?.kind === "screen").toBe(true);
    if (first?.kind === "screen" && second?.kind === "screen") {
      expect(second.id).not.toBe(first.id);
    }
  });

  it("cover the battle too, which closes back to walking around", () => {
    useGame.getState().startBattle();
    expect(overlay()).toMatchObject({ kind: "battle" });
    useGame.getState().closeOverlay();
    expect(overlay()).toBeNull();
  });

  it("all close at once with closeAll", () => {
    const { openScreen, pushScreen, closeAll } = useGame.getState();
    openScreen({ screen: "ask" });
    pushScreen({ screen: "contact" });
    closeAll();
    expect(overlay()).toBeNull();
  });
});

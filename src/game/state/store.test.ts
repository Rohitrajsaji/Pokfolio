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

  it("opened from another screen go back to it, then to where that one came from", () => {
    const { openScreen, pushScreen, closeOverlay } = useGame.getState();
    openScreen({ screen: "party" }, true);
    const party = overlay();
    pushScreen({ screen: "evolution" });
    expect(overlay()).toMatchObject({ request: { screen: "evolution" }, back: party });
    closeOverlay();
    expect(overlay()).toBe(party);
    closeOverlay();
    expect(overlay()).toEqual({ kind: "menu" });
  });

  it("get a fresh id each time, so reopening one starts it over", () => {
    const { openScreen } = useGame.getState();
    openScreen({ screen: "card" });
    const first = overlay();
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

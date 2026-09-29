// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { sound } from "./audio/sound";
import { bindHygiene } from "./hygiene";
import { useGame } from "./state/store";

afterEach(() => {
  useGame.setState({ overlay: null, stage: "play" });
  vi.restoreAllMocks();
});

describe("bindHygiene", () => {
  it("forgets held keys when a screen opens or closes", () => {
    const hub = { releaseAll: vi.fn() };
    const stop = bindHygiene(hub);
    useGame.getState().openMenu();
    expect(hub.releaseAll).toHaveBeenCalledTimes(1);
    useGame.getState().closeAll();
    expect(hub.releaseAll).toHaveBeenCalledTimes(2);
    stop();
  });

  it("forgets held keys on full-screen changes, and holds sound while printing", () => {
    const hub = { releaseAll: vi.fn() };
    const hold = vi.spyOn(sound, "hold").mockImplementation(() => {});
    const stop = bindHygiene(hub);
    document.dispatchEvent(new Event("fullscreenchange"));
    expect(hub.releaseAll).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new Event("beforeprint"));
    expect(hold).toHaveBeenLastCalledWith(true);
    window.dispatchEvent(new Event("afterprint"));
    expect(hold).toHaveBeenLastCalledWith(false);
    stop();
  });

  it("stops listening once unbound", () => {
    const hub = { releaseAll: vi.fn() };
    bindHygiene(hub)();
    useGame.getState().openMenu();
    document.dispatchEvent(new Event("fullscreenchange"));
    expect(hub.releaseAll).not.toHaveBeenCalled();
  });

  it("starting the adventure leaves no résumé behind", () => {
    useGame.setState({ stage: "title" });
    useGame.getState().openScreen({ screen: "resume" });
    useGame.getState().setStage("play");
    useGame.getState().say({ pages: ["Hi"] });
    expect(useGame.getState().overlay?.kind).toBe("dialog");
    useGame.getState().closeOverlay();
    expect(useGame.getState().overlay).toBeNull();
  });
});

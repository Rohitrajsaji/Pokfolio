import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, useGame } from "../state/store";
import { directMusic, musicFor, type MusicPlayer } from "./director";

/** A player that just writes down what it was told to do. */
function recorder() {
  const calls: string[] = [];
  const player: MusicPlayer = {
    setEnabled: (enabled) => calls.push(enabled ? "on" : "off"),
    playMusic: (id) => calls.push(id),
  };
  return { player, calls };
}

const soundOn = { ...DEFAULT_SETTINGS, sound: true };

beforeEach(() =>
  useGame.setState({ stage: "play", mapId: "town", overlay: null, settings: DEFAULT_SETTINGS }),
);

describe("musicFor", () => {
  it("plays the town theme outdoors, the indoor theme inside, and battle music in battles", () => {
    const play = { stage: "play" } as const;
    expect(musicFor({ ...play, mapId: "town", overlay: null })).toBe("town");
    expect(musicFor({ ...play, mapId: "lab", overlay: null })).toBe("indoor");
    expect(musicFor({ ...play, mapId: "town", overlay: { kind: "battle", id: 1 } })).toBe("battle");
    expect(musicFor({ ...play, mapId: "town", overlay: { kind: "menu" } })).toBe("town");
  });

  it("plays the title theme on the title screen and in the intro, wherever the map says", () => {
    expect(musicFor({ stage: "title", mapId: "town", overlay: null })).toBe("title");
    expect(musicFor({ stage: "intro", mapId: "lab", overlay: null })).toBe("title");
  });
});

describe("directMusic", () => {
  it("stays quiet until sound is turned on, then follows the visitor around", () => {
    const { player, calls } = recorder();
    const stop = directMusic(useGame, player);
    useGame.setState({ mapId: "lab" });
    expect(calls).toEqual(["off"]);

    useGame.setState({ settings: soundOn });
    useGame.setState({ mapId: "town" });
    useGame.setState({ overlay: { kind: "battle", id: 7 } });
    useGame.setState({ overlay: null });
    expect(calls).toEqual(["off", "on", "indoor", "town", "battle", "town"]);
    stop();
  });

  it("plays the title theme until the adventure begins", () => {
    const { player, calls } = recorder();
    useGame.setState({ stage: "title", settings: soundOn });
    const stop = directMusic(useGame, player);
    useGame.setState({ stage: "intro" });
    useGame.setState({ stage: "play" });
    expect(calls).toEqual(["on", "title", "town"]);
    stop();
  });

  it("doesn't restart the music for unrelated changes", () => {
    const { player, calls } = recorder();
    useGame.setState({ settings: soundOn });
    const stop = directMusic(useGame, player);
    useGame.setState({ position: { x: 3, y: 4 } });
    useGame.setState({ overlay: { kind: "menu" } });
    expect(calls).toEqual(["on", "town"]);
    stop();
  });

  it("goes quiet when sound is turned off, and picks up again when it's back on", () => {
    const { player, calls } = recorder();
    useGame.setState({ settings: soundOn });
    const stop = directMusic(useGame, player);
    useGame.setState({ settings: DEFAULT_SETTINGS });
    useGame.setState({ mapId: "gym" });
    useGame.setState({ settings: soundOn });
    expect(calls).toEqual(["on", "town", "off", "on", "indoor"]);
    stop();
  });

  it("stops listening once stopped", () => {
    const { player, calls } = recorder();
    directMusic(useGame, player)();
    useGame.setState({ settings: soundOn });
    expect(calls).toEqual(["off"]);
  });
});

// @vitest-environment jsdom
import { dialogue, site } from "@content";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { input, type Action } from "../engine/input";
import { DEFAULT_SETTINGS, useGame } from "../state/store";
import { fill } from "../text";
import { IntroScene } from "./IntroScene";
import { TitleScreen } from "./TitleScreen";
import { STAGE_FADE_MS } from "./useStageExit";

const press = (action: Action) =>
  act(() => {
    input.press(action);
    input.release(action);
  });

const stage = () => useGame.getState().stage;
const lines = dialogue.intro.lines.map(fill);
const speaker = fill(dialogue.intro.speaker);
/** The intro line on screen, as a screen reader hears it. */
const spoken = () => document.querySelector(".intro-scene [aria-live]")?.textContent;

let reducedMotion = true;

class FakeImageData {
  constructor(
    readonly data: Uint8ClampedArray,
    readonly width: number,
    readonly height: number,
  ) {}
}

beforeAll(() => {
  // jsdom has no canvas or media queries; the stages only need them to exist.
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("reduced-motion") && reducedMotion,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
  vi.stubGlobal("ImageData", FakeImageData);
  HTMLCanvasElement.prototype.getContext = (() => ({
    putImageData: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
});

beforeEach(() => {
  // Reduced motion: stages change at once instead of fading, and text appears whole.
  reducedMotion = true;
  useGame.setState({ stage: "title", overlay: null, settings: DEFAULT_SETTINGS });
});

afterEach(() => {
  cleanup();
  input.releaseAll();
  vi.useRealTimers();
});

describe("the title screen", () => {
  it("shows the game's title and version, with PRESS START ready to press", () => {
    render(<TitleScreen />);
    expect(screen.getByText(site.gameTitle)).toBeTruthy();
    expect(screen.getByText(site.gameSubtitle)).toBeTruthy();
    const start = screen.getByRole("menuitem", { name: "PRESS START" });
    expect(document.activeElement).toBe(start);
  });

  it.each(["a", "start"] as const)("starts the intro when %s is pressed", (action) => {
    render(<TitleScreen />);
    press(action);
    expect(stage()).toBe("intro");
  });

  it("has a RÉSUMÉ choice that opens the résumé and leaves the title behind it", () => {
    render(<TitleScreen />);
    press("down");
    expect(document.querySelector("[data-current]")?.textContent).toBe("RÉSUMÉ");
    press("a");
    expect(useGame.getState().overlay).toMatchObject({
      kind: "screen",
      request: { screen: "resume" },
    });
    expect(stage()).toBe("title");
  });

  it("starts the intro on a click or tap", () => {
    render(<TitleScreen />);
    fireEvent.click(screen.getByRole("menuitem", { name: "PRESS START" }));
    expect(stage()).toBe("intro");
  });

  it("ignores buttons that mean nothing here", () => {
    render(<TitleScreen />);
    press("b");
    press("left");
    expect(stage()).toBe("title");
  });

  it("fades to black first, unless the visitor asked for less motion", () => {
    reducedMotion = false;
    vi.useFakeTimers();
    const { container } = render(<TitleScreen />);
    press("a");
    expect(container.querySelector(".title-screen")?.hasAttribute("data-leaving")).toBe(true);
    expect(stage()).toBe("title");
    act(() => vi.advanceTimersByTime(STAGE_FADE_MS));
    expect(stage()).toBe("intro");
  });
});

describe("the intro", () => {
  beforeEach(() => useGame.setState({ stage: "intro" }));

  it("tells its story one line at a time, then begins the adventure", () => {
    render(<IntroScene />);
    expect(spoken()).toBe(`${speaker}: ${lines[0]}`);
    for (let i = 1; i < lines.length; i++) {
      press("a");
      expect(spoken()).toBe(`${speaker}: ${lines[i]}`);
      expect(stage()).toBe("intro");
    }
    press("a");
    expect(stage()).toBe("play");
    expect(useGame.getState().overlay).toMatchObject({
      kind: "dialog",
      dialog: { pages: dialogue.welcome.map(fill) },
    });
  });

  it.each(["start", "escape"] as const)("skips straight to the town with %s", (action) => {
    render(<IntroScene />);
    press(action);
    expect(stage()).toBe("play");
    expect(useGame.getState().overlay?.kind).toBe("dialog");
  });

  it("skips with the SKIP button", () => {
    render(<IntroScene />);
    fireEvent.click(screen.getByRole("button", { name: /SKIP/ }));
    expect(stage()).toBe("play");
  });

  it("begins the adventure only once, however many times it's skipped", () => {
    render(<IntroScene />);
    press("start");
    const first = useGame.getState().overlay;
    press("start");
    press("escape");
    fireEvent.click(screen.getByRole("button", { name: /SKIP/ }));
    expect(useGame.getState().overlay).toBe(first);
  });
});

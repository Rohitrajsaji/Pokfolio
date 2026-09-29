// @vitest-environment jsdom
import { dialogue } from "@content";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { input, type Action } from "../engine/input";
import { useGame } from "../state/store";
import { Cameo } from "./Cameo";

vi.mock("../audio/sound", () => ({ sound: { sfx: vi.fn(), cry: vi.fn() } }));
import { sound } from "../audio/sound";

let reducedMotion = false;

class FakeImageData {
  constructor(
    readonly data: Uint8ClampedArray,
    readonly width: number,
    readonly height: number,
  ) {}
}

beforeAll(() => {
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
  HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,AAAA";
});

const press = (action: Action) =>
  act(() => {
    input.press(action);
    input.release(action);
  });

const overlay = () => useGame.getState().overlay;

beforeEach(() => {
  reducedMotion = false;
  vi.useFakeTimers();
  vi.clearAllMocks();
  useGame.setState({ overlay: { kind: "cameo", id: 1, cameo: "rotom", after: ["It hid again."] } });
});

afterEach(() => {
  cleanup();
  input.releaseAll();
  vi.useRealTimers();
});

describe("a cameo", () => {
  it("is described for screen readers", () => {
    render(<Cameo cameo="rotom" />);
    expect(screen.getByRole("img", { name: dialogue.cameos.rotom })).toBeTruthy();
  });

  it("ends by itself, then says what comes after", () => {
    render(<Cameo cameo="rotom" after={["It hid again."]} />);
    expect(overlay()?.kind).toBe("cameo");
    act(() => vi.advanceTimersByTime(2600));
    expect(overlay()).toMatchObject({ kind: "dialog", dialog: { pages: ["It hid again."] } });
  });

  it("just ends when there's nothing to say after it", () => {
    render(<Cameo cameo="missingno" />);
    act(() => vi.advanceTimersByTime(2000));
    expect(overlay()).toBeNull();
  });

  it("can't be skipped in its first moments, but can be after", () => {
    render(<Cameo cameo="rotom" after={["It hid again."]} />);
    act(() => vi.advanceTimersByTime(300));
    press("a");
    expect(overlay()?.kind).toBe("cameo");
    act(() => vi.advanceTimersByTime(600));
    press("a");
    expect(overlay()?.kind).toBe("dialog");
  });

  it("only ends once, however it's ended", () => {
    render(<Cameo cameo="rotom" after={["It hid again."]} />);
    act(() => vi.advanceTimersByTime(900));
    press("b");
    act(() => vi.advanceTimersByTime(5000));
    expect(overlay()).toMatchObject({ kind: "dialog" });
  });

  it("is shorter, and still, for someone who asked for less motion", () => {
    reducedMotion = true;
    const { container } = render(<Cameo cameo="rotom" after={["It hid again."]} />);
    expect(container.querySelector("[data-still]")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1400));
    expect(overlay()?.kind).toBe("dialog");
  });

  it("makes its own sound: a zap for Rotom, a glitch for MissingNo.", () => {
    render(<Cameo cameo="rotom" />);
    expect(sound.sfx).toHaveBeenCalledWith("zap");
    cleanup();
    render(<Cameo cameo="missingno" />);
    expect(sound.sfx).toHaveBeenCalledWith("glitch");
  });
});

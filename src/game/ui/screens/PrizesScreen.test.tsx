// @vitest-environment jsdom
import { dialogue, palettes, playerLooks } from "@content";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { input } from "../../engine/input";
import { DEFAULT_COSMETICS, useGame } from "../../state/store";
import { fillWith } from "../../text";
import { ContentScreens } from "../ContentScreens";

vi.mock("../../audio/sound", () => ({ sound: { sfx: vi.fn(), cry: vi.fn() } }));
import { sound } from "../../audio/sound";

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
      matches: false,
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

function open(cleared: number, screenName: "prizes" | "options" = "prizes") {
  useGame.setState({ overlay: null, cleared, cosmetics: DEFAULT_COSMETICS });
  act(() => useGame.getState().openScreen({ screen: screenName }));
  render(<ContentScreens />);
}

const prize = (name: string) => screen.getByRole("button", { name: new RegExp(name) });

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  input.releaseAll();
});

describe("PRIZES", () => {
  it("lists every look and screen colour, with the classic ones already yours", () => {
    open(0);
    for (const look of playerLooks) expect(prize(look.name)).toBeTruthy();
    for (const palette of palettes) expect(prize(palette.name)).toBeTruthy();
    expect(prize("CLASSIC").getAttribute("aria-pressed")).toBe("true");
    expect(prize("NORMAL").getAttribute("aria-pressed")).toBe("true");
  });

  it("says which level unlocks each prize that isn't won yet, and won't let you pick it", () => {
    open(0);
    const sparky = prize("SPARKY");
    expect(sparky.getAttribute("aria-disabled")).toBe("true");
    expect(sparky.textContent).toContain(fillWith(dialogue.prizes.locked, { level: "1" }));
    fireEvent.click(sparky);
    expect(useGame.getState().cosmetics.look).toBe("classic");
    expect(sound.sfx).toHaveBeenCalledWith("bump");
  });

  it("unlocks a look at a time as levels are cleared", () => {
    open(1);
    expect(prize("SPARKY").getAttribute("aria-disabled")).toBe("false");
    expect(prize("LEAF").getAttribute("aria-disabled")).toBe("true");
    expect(prize("GAME BOY").getAttribute("aria-disabled")).toBe("true");
  });

  it("wears a look once it's won, and only one at a time", () => {
    open(2);
    fireEvent.click(prize("LEAF"));
    expect(useGame.getState().cosmetics.look).toBe("leaf");
    expect(prize("LEAF").getAttribute("aria-pressed")).toBe("true");
    expect(prize("CLASSIC").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(prize("SPARKY"));
    expect(useGame.getState().cosmetics.look).toBe("sparky");
  });

  it("gives both screen colours (and the last look) for clearing every level", () => {
    open(3);
    fireEvent.click(prize("GAME BOY"));
    expect(useGame.getState().cosmetics.palette).toBe("gameboy");
    fireEvent.click(prize("SEPIA"));
    expect(useGame.getState().cosmetics.palette).toBe("sepia");
    fireEvent.click(prize("NORMAL"));
    expect(useGame.getState().cosmetics.palette).toBe("normal");
    fireEvent.click(prize("PROFESSOR"));
    expect(useGame.getState().cosmetics.look).toBe("professor");
  });

  it("changes the look without touching the colour, and the colour without the look", () => {
    open(3);
    fireEvent.click(prize("LEAF"));
    fireEvent.click(prize("SEPIA"));
    expect(useGame.getState().cosmetics).toEqual({ look: "leaf", palette: "sepia" });
  });
});

describe("OPTIONS", () => {
  it("doesn't mention the prizes until one has been won, so it doesn't give the Game Corner away", () => {
    open(0, "options");
    expect(screen.queryByRole("button", { name: "PRIZES" })).toBeNull();
  });

  it("leads to the prizes once a level's been cleared", () => {
    open(1, "options");
    fireEvent.click(screen.getByRole("button", { name: "PRIZES" }));
    expect(useGame.getState().overlay).toMatchObject({ request: { screen: "prizes" } });
  });
});

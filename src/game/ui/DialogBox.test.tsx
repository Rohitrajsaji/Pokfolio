// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { input, type Action } from "../engine/input";
import { DEFAULT_SETTINGS, useGame, type DialogRequest, type TextSpeed } from "../state/store";
import { DialogBox } from "./DialogBox";

const press = (action: Action) =>
  act(() => {
    input.press(action);
    input.release(action);
  });

/** The part of the line that has typed out so far. */
function visibleText(): string {
  const box = document.querySelector(".dialog-text");
  const all = box?.textContent ?? "";
  const hidden = box?.querySelector(".invisible")?.textContent ?? "";
  return all.slice(0, all.length - hidden.length);
}

function open(dialog: DialogRequest, textSpeed: TextSpeed) {
  useGame.setState({
    settings: { ...DEFAULT_SETTINGS, textSpeed },
    overlay: { kind: "dialog", id: 1, dialog },
  });
  render(<DialogBox dialog={dialog} />);
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
});

beforeEach(() => useGame.setState({ overlay: null }));

afterEach(() => {
  cleanup();
  input.releaseAll();
  vi.useRealTimers();
});

describe("DialogBox", () => {
  it("types each page out; A finishes the line, then moves on, then closes", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    open({ pages: ["Hello there!", "Second page."], onClose }, "normal");
    expect(visibleText()).toBe("");
    act(() => vi.advanceTimersByTime(100));
    expect(visibleText().length).toBeGreaterThan(0);
    expect(visibleText().length).toBeLessThan("Hello there!".length);

    press("a");
    expect(visibleText()).toBe("Hello there!");
    press("a");
    expect(visibleText()).toBe("");
    act(() => vi.advanceTimersByTime(1000));
    expect(visibleText()).toBe("Second page.");

    press("a");
    expect(useGame.getState().overlay).toBeNull();
    expect(onClose).toHaveBeenCalledWith(null);
  });

  it("asks YES/NO after the pages and reports the answer", () => {
    const onClose = vi.fn();
    open({ pages: ["It's a PC."], ask: "Log in?", onClose }, "instant");
    press("a");
    expect(visibleText()).toBe("Log in?");
    press("down");
    press("a");
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("takes B at the question as NO", () => {
    const onClose = vi.fn();
    open({ pages: [], ask: "Read the classic résumé?", onClose }, "instant");
    press("b");
    expect(onClose).toHaveBeenCalledWith(false);
  });
});

// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGame } from "../state/store";
import { Overlays } from "./Overlays";

const banner = () => document.querySelector(".hint-banner");

beforeEach(() => {
  vi.useFakeTimers();
  useGame.setState({ hint: null, overlay: null });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the door hint", () => {
  it("slides back out, still reading what it said, before it's gone", () => {
    render(<Overlays />);
    expect(banner()).toBeNull();
    act(() => useGame.setState({ hint: "ENTER THE LAB" }));
    expect(banner()?.hasAttribute("data-leaving")).toBe(false);

    act(() => useGame.setState({ hint: null }));
    expect(banner()?.hasAttribute("data-leaving")).toBe(true);
    expect(banner()?.textContent).toContain("ENTER THE LAB");

    act(() => vi.advanceTimersByTime(300));
    expect(banner()).toBeNull();
  });

  it("comes back in at once if another door is reached mid-exit", () => {
    render(<Overlays />);
    act(() => useGame.setState({ hint: "ENTER THE LAB" }));
    act(() => useGame.setState({ hint: null }));
    act(() => useGame.setState({ hint: "ENTER THE MART" }));
    expect(banner()?.hasAttribute("data-leaving")).toBe(false);
    expect(banner()?.textContent).toContain("ENTER THE MART");
  });
});

// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { input, type Action } from "../engine/input";
import { useGame } from "../state/store";
import { MENU_ITEMS, StartMenu } from "./StartMenu";

const press = (action: Action) => {
  input.press(action);
  input.release(action);
};

beforeEach(() => useGame.setState({ overlay: { kind: "menu" }, menuIndex: 0 }));
afterEach(() => {
  cleanup();
  input.releaseAll();
});

describe("START menu", () => {
  it("focuses the first entry and moves with the D-pad, wrapping around", () => {
    render(<StartMenu />);
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(MENU_ITEMS.length);
    expect(document.activeElement).toBe(items[0]);
    press("down");
    expect(document.activeElement).toBe(items[1]);
    press("up");
    press("up");
    expect(document.activeElement).toBe(items.at(-1));
  });

  it("opens the chosen screen, and closing it goes back to the menu", () => {
    render(<StartMenu />);
    press("down");
    press("a");
    expect(useGame.getState().overlay).toMatchObject({
      kind: "screen",
      request: MENU_ITEMS[1].request,
      back: { kind: "menu" },
    });
    expect(useGame.getState().menuIndex).toBe(1);
    useGame.getState().closeOverlay();
    expect(useGame.getState().overlay).toEqual({ kind: "menu" });
  });

  it("remembers where the cursor was", () => {
    useGame.setState({ menuIndex: 3 });
    render(<StartMenu />);
    expect(document.activeElement).toBe(screen.getAllByRole("menuitem")[3]);
  });

  it("goes back to the title screen, and starts the visit over, on EXIT", () => {
    useGame.setState({ stage: "play", mapId: "lab", secrets: ["arcade"], cleared: 2 });
    const before = useGame.getState().run;
    render(<StartMenu />);
    const exit = screen.getByRole("menuitem", { name: "EXIT" });
    expect(exit.getAttribute("aria-describedby")).toBeTruthy();
    exit.click();
    const now = useGame.getState();
    expect(now.stage).toBe("title");
    expect(now.mapId).toBe("town");
    expect(now.secrets).toEqual([]);
    expect(now.cleared).toBe(0);
    expect(now.overlay).toBeNull();
    expect(now.run).toBe(before + 1);
  });

  it("closes with B", () => {
    render(<StartMenu />);
    press("b");
    expect(useGame.getState().overlay).toBeNull();
  });
});

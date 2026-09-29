// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, useGame } from "../state/store";
import { SoundToggle } from "./SoundToggle";

beforeEach(() => useGame.setState({ settings: DEFAULT_SETTINGS }));
afterEach(cleanup);

describe("SoundToggle", () => {
  it("starts with sound off, then turns it on and off", () => {
    render(<SoundToggle />);
    const toggle = screen.getByRole("button", { name: "SOUND OFF" });
    expect(toggle.hasAttribute("data-on")).toBe(false);

    fireEvent.click(toggle);
    expect(useGame.getState().settings.sound).toBe(true);
    expect(toggle.hasAttribute("data-on")).toBe(true);
    // Its name is what's on the button, so voice control and screen readers agree.
    expect(screen.getByRole("button", { name: "SOUND ON" })).toBe(toggle);

    fireEvent.click(toggle);
    expect(useGame.getState().settings.sound).toBe(false);
  });
});

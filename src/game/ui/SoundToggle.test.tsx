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
    const toggle = screen.getByRole("button", { name: "Sound" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.textContent).toContain("SOUND OFF");

    fireEvent.click(toggle);
    expect(useGame.getState().settings.sound).toBe(true);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.textContent).toContain("SOUND ON");

    fireEvent.click(toggle);
    expect(useGame.getState().settings.sound).toBe(false);
  });
});

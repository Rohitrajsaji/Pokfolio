// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadSettings, sanitizeSettings, saveSettings } from "./settings";
import { DEFAULT_SETTINGS } from "./store";

beforeEach(() => window.localStorage.clear());

describe("settings", () => {
  it("round-trips through the visitor's browser", () => {
    saveSettings({ ...DEFAULT_SETTINGS, textSpeed: "fast", time: "night", sound: true });
    expect(loadSettings()).toEqual({ textSpeed: "fast", time: "night", sound: true });
  });

  it("ignores anything malformed", () => {
    expect(sanitizeSettings({ textSpeed: "warp", time: 7, sound: "yes", extra: 1 })).toEqual({});
    expect(sanitizeSettings(null)).toEqual({});
    window.localStorage.setItem("rohit-portfolio:settings", "{not json");
    expect(loadSettings()).toEqual({});
  });

  it("starts from nothing when nothing was saved", () => {
    expect(loadSettings()).toEqual({});
  });
});

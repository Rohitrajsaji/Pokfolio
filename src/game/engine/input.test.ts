import { describe, expect, it, vi } from "vitest";
import { InputHub } from "./input";

describe("InputHub", () => {
  it("sends presses to the base handler when no layer is open", () => {
    const hub = new InputHub();
    const base = vi.fn();
    hub.setBase(base);
    hub.press("a");
    expect(base).toHaveBeenCalledWith("a");
  });

  it("sends presses only to the topmost layer, and back down when it closes", () => {
    const hub = new InputHub();
    const base = vi.fn();
    const menu = vi.fn();
    const dialog = vi.fn();
    hub.setBase(base);
    hub.pushLayer(menu);
    const closeDialog = hub.pushLayer(dialog);
    hub.press("a");
    hub.release("a");
    expect([dialog.mock.calls.length, menu.mock.calls.length, base.mock.calls.length]).toEqual([
      1, 0, 0,
    ]);
    closeDialog();
    hub.press("a");
    expect(menu).toHaveBeenCalledOnce();
  });

  it("ignores key repeat while a button is held", () => {
    const hub = new InputHub();
    const base = vi.fn();
    hub.setBase(base);
    hub.press("up");
    hub.press("up");
    expect(base).toHaveBeenCalledOnce();
  });

  it("steers by the most recently pressed direction still held", () => {
    const hub = new InputHub();
    hub.press("up");
    hub.press("left");
    expect(hub.direction()).toBe("left");
    hub.release("left");
    expect(hub.direction()).toBe("up");
    hub.releaseAll();
    expect(hub.direction()).toBeNull();
    expect(hub.isHeld("up")).toBe(false);
  });
});

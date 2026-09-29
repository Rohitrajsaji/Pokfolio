// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FullscreenToggle } from "./ui/FullscreenToggle";

function browser({ enabled, element }: { enabled: boolean; element: Element | null }) {
  Object.defineProperty(document, "fullscreenEnabled", { configurable: true, value: enabled });
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
}

const request = vi.fn().mockResolvedValue(undefined);
const exit = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  request.mockClear();
  exit.mockClear();
  document.documentElement.requestFullscreen = request;
  document.exitFullscreen = exit;
});

afterEach(cleanup);

describe("FullscreenToggle", () => {
  it("isn't shown where the browser can't go full-screen, like an iPhone", () => {
    browser({ enabled: false, element: null });
    render(<FullscreenToggle />);
    expect(screen.queryByRole("button", { name: "FULLSCREEN" })).toBeNull();
  });

  it("goes full-screen when pressed, and shows that it is", () => {
    browser({ enabled: true, element: null });
    render(<FullscreenToggle />);
    const button = screen.getByRole("button", { name: "FULLSCREEN" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    expect(request).toHaveBeenCalledOnce();

    browser({ enabled: true, element: document.documentElement });
    act(() => {
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });

  it("comes back out when pressed while full-screen", () => {
    browser({ enabled: true, element: document.documentElement });
    render(<FullscreenToggle />);
    fireEvent.click(screen.getByRole("button", { name: "FULLSCREEN" }));
    expect(exit).toHaveBeenCalledOnce();
    expect(request).not.toHaveBeenCalled();
  });

  it("shrugs off a browser that refuses", async () => {
    browser({ enabled: true, element: null });
    request.mockRejectedValueOnce(new Error("not allowed"));
    render(<FullscreenToggle />);
    fireEvent.click(screen.getByRole("button", { name: "FULLSCREEN" }));
    await Promise.resolve();
    expect(request).toHaveBeenCalledOnce();
  });
});

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { watchDensity } from "./density";

type Listener = () => void;

function fakeMatchMedia() {
  const queries: Array<{ media: string; listeners: Set<Listener> }> = [];
  window.matchMedia = ((media: string) => {
    const entry = { media, listeners: new Set<Listener>() };
    queries.push(entry);
    return {
      media,
      addEventListener: (_: string, l: Listener) => entry.listeners.add(l),
      removeEventListener: (_: string, l: Listener) => entry.listeners.delete(l),
    };
  }) as unknown as typeof window.matchMedia;
  return queries;
}

afterEach(() => vi.restoreAllMocks());

describe("watchDensity", () => {
  it("fires when the density changes and keeps watching at the new density", () => {
    const queries = fakeMatchMedia();
    const onChange = vi.fn();
    Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
    watchDensity(onChange);
    expect(queries[0].media).toBe("(resolution: 1dppx)");
    Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
    queries[0].listeners.forEach((l) => l());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(queries[1].media).toBe("(resolution: 2dppx)");
    expect(queries[0].listeners.size).toBe(0);
  });

  it("stops listening when cleaned up", () => {
    const queries = fakeMatchMedia();
    const stop = watchDensity(() => {});
    stop();
    expect(queries[0].listeners.size).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { walkedRoute } from "./routes";

const route = [10, 11, 12, 13];

describe("walkedRoute", () => {
  it("is true once the whole route has just been walked, in order", () => {
    expect(walkedRoute([10, 11, 12, 13], route)).toBe(true);
  });

  it("ignores where the visitor was before the route", () => {
    expect(walkedRoute([5, 6, 10, 11, 12, 13], route)).toBe(true);
  });

  it("works walking the route the other way", () => {
    expect(walkedRoute([3, 13, 12, 11, 10], route)).toBe(true);
  });

  it("is false part of the way along", () => {
    expect(walkedRoute([10, 11, 12], route)).toBe(false);
  });

  it("is false if a step went somewhere else in between", () => {
    expect(walkedRoute([10, 11, 99, 12, 13], route)).toBe(false);
  });

  it("is false once the visitor has moved on past the end", () => {
    expect(walkedRoute([10, 11, 12, 13, 14], route)).toBe(false);
  });

  it("is false with nothing walked yet, or a route with no tiles", () => {
    expect(walkedRoute([], route)).toBe(false);
    expect(walkedRoute([1, 2, 3], [])).toBe(false);
  });
});

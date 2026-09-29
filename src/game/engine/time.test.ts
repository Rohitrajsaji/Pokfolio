import { describe, expect, it } from "vitest";
import { parseTimeOverride, timeOfDay } from "./time";

const at = (hours: number, minutes = 0) => new Date(2026, 8, 28, hours, minutes);

describe("timeOfDay", () => {
  it.each([
    [at(4, 59), "night"],
    [at(5), "morning"],
    [at(9, 59), "morning"],
    [at(10), "day"],
    [at(16, 59), "day"],
    [at(17), "evening"],
    [at(19, 59), "evening"],
    [at(20), "night"],
    [at(0), "night"],
  ])("%s is %s", (date, expected) => {
    expect(timeOfDay(date)).toBe(expected);
  });
});

describe("parseTimeOverride", () => {
  it("accepts the four times of day and ignores anything else", () => {
    expect(parseTimeOverride("night")).toBe("night");
    expect(parseTimeOverride("noon")).toBeNull();
    expect(parseTimeOverride(null)).toBeNull();
  });
});

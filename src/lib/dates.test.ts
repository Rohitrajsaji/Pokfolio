import { describe, expect, it } from "vitest";
import { formatRange, formatYearMonth } from "./dates";

describe("formatYearMonth", () => {
  it("formats ISO year-month as a short month and year", () => {
    expect(formatYearMonth("2026-03")).toBe("Mar 2026");
    expect(formatYearMonth("2021-11")).toBe("Nov 2021");
  });

  it("rejects malformed values", () => {
    expect(() => formatYearMonth("2026-13")).toThrow(/2026-13/);
    expect(() => formatYearMonth("26-03" as "2026-03")).toThrow();
  });
});

describe("formatRange", () => {
  it("shows an open-ended range as Present", () => {
    expect(formatRange("2026-03", "present")).toBe("Mar 2026 – Present");
  });

  it("drops the repeated year when a range stays within one year", () => {
    expect(formatRange("2025-07", "2025-12")).toBe("Jul – Dec 2025");
  });

  it("keeps both years when a range spans years", () => {
    expect(formatRange("2021-11", "2025-04")).toBe("Nov 2021 – Apr 2025");
  });

  it("collapses a single-month range", () => {
    expect(formatRange("2025-11", "2025-11")).toBe("Nov 2025");
  });
});

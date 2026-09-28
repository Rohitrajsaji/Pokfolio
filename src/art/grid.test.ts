import { describe, expect, it } from "vitest";
import { gridToBuffer, rle, sym, validateGrid } from "./grid";

describe("row shorthand", () => {
  it("expands run-length counts", () => {
    expect(rle("3.o2co")).toBe("...occo");
    expect(rle("12h")).toBe("hhhhhhhhhhhh");
  });

  it("rejects a trailing count", () => {
    expect(() => rle("3.o4")).toThrow(/ends with a count/);
  });

  it("mirrors a left half into a symmetric row", () => {
    expect(sym("3.o4c")).toBe("...occcccccco...");
    expect(sym("3.o4c")).toHaveLength(16);
  });
});

const palette = { r: "#ff0000", b: "#0000ff" };

describe("validateGrid", () => {
  it("accepts a well-formed grid", () => {
    expect(validateGrid({ rows: ["r.", ".b"], palette })).toEqual([]);
  });

  it("reports ragged rows and unknown characters", () => {
    const errors = validateGrid({ rows: ["rr", "r", "rx"], palette });
    expect(errors).toContain("row 1 is 1 wide, expected 2");
    expect(errors).toContain('row 2 uses "x", which is not in the palette');
  });

  it("checks the expected size", () => {
    expect(validateGrid({ rows: ["rr"], palette }, { width: 3, height: 2 })).toEqual([
      "grid is 2 wide, expected 3",
      "grid is 1 tall, expected 2",
    ]);
  });
});

describe("gridToBuffer", () => {
  it("maps palette characters to colours and dots to transparency", () => {
    const buf = gridToBuffer({ rows: ["r.", ".b"], palette });
    expect([buf.get(0, 0), buf.get(1, 0), buf.get(0, 1), buf.get(1, 1)]).toEqual([
      "#ff0000",
      null,
      null,
      "#0000ff",
    ]);
  });

  it("mirrors horizontally", () => {
    const buf = gridToBuffer({ rows: ["rb"], palette }, { flipX: true });
    expect([buf.get(0, 0), buf.get(1, 0)]).toEqual(["#0000ff", "#ff0000"]);
  });
});

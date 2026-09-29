import { describe, expect, it } from "vitest";
import { fill, fillWith } from "./text";

describe("fill", () => {
  it("fills in names from content", () => {
    expect(fill("{name} lives in {town}.")).toBe("ROHIT lives in CHENNAI CITY.");
    expect(fill("A wild {wild} vs {partner}!")).toBe("A wild ROHIT vs PIKACHU!");
  });

  it("leaves unknown tokens and plain text alone", () => {
    expect(fill("{nope} stays")).toBe("{nope} stays");
    expect(fill("No tokens here.")).toBe("No tokens here.");
  });
});

describe("fillWith", () => {
  it("fills in one-off tokens as well as names", () => {
    expect(fillWith("{from} evolved into {to}, {name}!", { from: "BELDUM", to: "METANG" })).toBe(
      "BELDUM evolved into METANG, ROHIT!",
    );
    expect(fillWith("{nope} stays", {})).toBe("{nope} stays");
  });
});

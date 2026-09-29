import { describe, expect, it } from "vitest";
import { fieldFor, MAX_STAGE, PANEL_HEIGHT } from "./field";

describe("the battle field", () => {
  it("draws the partner at half size on the shortest views, where double would run into the wild Pokémon's box", () => {
    expect(fieldFor(144).partnerScale).toBe(1);
    expect(fieldFor(PANEL_HEIGHT + 117).partnerScale).toBe(1);
  });

  it("draws the partner at double size once there's room, as on a laptop or a phone", () => {
    expect(fieldFor(PANEL_HEIGHT + 118).partnerScale).toBe(2);
    expect(fieldFor(175).partnerScale).toBe(2);
    expect(fieldFor(477).partnerScale).toBe(2);
  });

  it("shows the partner's HP numbers only where there's room under the wild Pokémon's platform", () => {
    expect(fieldFor(175).partnerNumbers).toBe(false);
    expect(fieldFor(PANEL_HEIGHT + 130).partnerNumbers).toBe(true);
    expect(fieldFor(477).partnerNumbers).toBe(true);
  });

  it("never counts more than the stage's tallest height", () => {
    expect(fieldFor(PANEL_HEIGHT + MAX_STAGE + 300)).toEqual(fieldFor(PANEL_HEIGHT + MAX_STAGE));
  });
});

import { describe, expect, it } from "vitest";
import { cryUrl, itemSpriteUrl, pokemonSpriteUrl } from "./sprites";

const ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites";
const BW = `${ROOT}/pokemon/versions/generation-v/black-white`;

describe("pokemonSpriteUrl", () => {
  it("builds animated Black/White front sprites by default", () => {
    expect(pokemonSpriteUrl(479)).toBe(`${BW}/animated/479.gif`);
  });

  it("builds back sprites", () => {
    expect(pokemonSpriteUrl(25, { view: "back" })).toBe(`${BW}/animated/back/25.gif`);
  });

  it("builds static sprites when asked", () => {
    expect(pokemonSpriteUrl(25, { animated: false })).toBe(`${BW}/25.png`);
    expect(pokemonSpriteUrl(25, { view: "back", animated: false })).toBe(`${BW}/back/25.png`);
  });

  it("supports alternate-form ids such as Heat Rotom", () => {
    expect(pokemonSpriteUrl(10008)).toBe(`${BW}/animated/10008.gif`);
  });

  it("rejects ids that cannot exist", () => {
    expect(() => pokemonSpriteUrl(0)).toThrow();
    expect(() => pokemonSpriteUrl(1.5)).toThrow();
  });
});

describe("itemSpriteUrl", () => {
  it("builds item icon urls", () => {
    expect(itemSpriteUrl("poke-ball")).toBe(`${ROOT}/items/poke-ball.png`);
  });

  it("rejects names that are not kebab-case slugs", () => {
    expect(() => itemSpriteUrl("../secret")).toThrow();
  });
});

describe("cryUrl", () => {
  it("builds cry urls", () => {
    expect(cryUrl(479)).toBe(
      "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/479.ogg",
    );
  });
});

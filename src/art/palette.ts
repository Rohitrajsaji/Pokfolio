/**
 * Every colour the town is drawn with. Change a value here to restyle all
 * the art that uses it.
 */
import type { PokeType } from "@content/types";

export const OUTLINE = "#2c2c38";

export const GRASS = { light: "#acdf8c", base: "#8ccf6b", dark: "#6fb656", deep: "#58a044" };
export const TALL_GRASS = { light: "#8fd46a", base: "#58ad4a", dark: "#3e8d3b", deep: "#2b6c2f" };
export const SAND = { light: "#f7efcf", base: "#ecdcaa", dark: "#dcc590", edge: "#c6ab72" };
export const LEAF = { light: "#7dca60", base: "#58a84c", dark: "#3d8742", deep: "#27602f" };
export const TRUNK = { base: "#8d5b35", dark: "#613b22" };
export const WOOD = { light: "#e5b378", base: "#c58b52", dark: "#8f5a2e", deep: "#5e3a1c" };
export const STONE = { light: "#e4e4ea", base: "#b9bac6", dark: "#8c8e9e", deep: "#5f6174" };
export const FENCE = { base: "#f7f6ef", shade: "#cfcdc2", outline: "#8a877c" };
export const FLOWER = {
  red: "#ee5a5a",
  redDark: "#bf3c43",
  yellow: "#f9d64b",
  yellowDark: "#d8a92c",
  white: "#fbfbf3",
};

export const WATER = {
  light: "#a5d8f8",
  base: "#5aa8e0",
  dark: "#3f86c4",
  edge: "#2b5f96",
  foam: "#e6f5fd",
  lotus: "#f6a8cb",
};
/** Dust kicked up by running, and the sleeper's snores: pale enough to show on grass and on sand. */
export const DUST = { light: "#f4ecd6", shade: "#cbbf9f" };
export const SNORLAX = {
  body: "#3d6b7d",
  shade: "#2e5262",
  belly: "#f0e4c0",
  bellyShade: "#d6c79c",
  claw: "#f8f8f0",
};

export interface RoofColors {
  light: string;
  base: string;
  shade: string;
  dark: string;
}

export const ROOFS = {
  red: { light: "#f28c77", base: "#e05a4b", shade: "#bf4034", dark: "#8f2b26" },
  blue: { light: "#8cabf2", base: "#5a86e0", shade: "#3f68c4", dark: "#2c4a92" },
  orange: { light: "#f1b27a", base: "#dc8a4c", shade: "#bb6c36", dark: "#8a4c26" },
  slate: { light: "#c3d3e0", base: "#94abbd", shade: "#728ca1", dark: "#4d6478" },
  green: { light: "#8fd39a", base: "#5eae6c", shade: "#468f55", dark: "#2f6b3e" },
} satisfies Record<string, RoofColors>;

export interface WallColors {
  light: string;
  base: string;
  shade: string;
  dark: string;
}

export const WALLS = {
  cream: { light: "#fdf8ec", base: "#f1e6cc", shade: "#dccda9", dark: "#b3a17c" },
  white: { light: "#ffffff", base: "#eef0f4", shade: "#d3d6e0", dark: "#a9adbd" },
  stone: { light: "#eeeef2", base: "#d4d5dd", shade: "#b3b4c0", dark: "#86889a" },
} satisfies Record<string, WallColors>;

export const GLASS = { light: "#eaf9ff", base: "#a4d8f2", dark: "#62a8d6", frame: "#5d6578" };
export const LIT = { light: "#fffbe0", base: "#ffe07a", dark: "#e8b64a" };
/** Colours that give off light: they stay bright when the scene is tinted for night. */
export const GLOW_COLORS: readonly string[] = [LIT.light, LIT.base, LIT.dark];
export const DOOR = { light: "#c98a55", base: "#a2663a", dark: "#723f20" };
export const POKEBALL = { red: "#e5463d", white: "#f8f8f8" };
export const GOLD = { light: "#fff1a8", base: "#f2c94c", dark: "#b8862a" };

export const EYES = "#2a2a34";
export const WHITE = "#f8f8f8";

/** The classic colour for each Pokémon type (type badges, lab machine lights). */
export const TYPE_COLORS: Readonly<Record<PokeType, string>> = {
  normal: "#a8a878",
  fire: "#f08030",
  water: "#6890f0",
  electric: "#f8d030",
  grass: "#78c850",
  ice: "#98d8d8",
  fighting: "#c03028",
  poison: "#a040a0",
  ground: "#e0c068",
  flying: "#a890f0",
  psychic: "#f85888",
  bug: "#a8b820",
  rock: "#b8a038",
  ghost: "#705898",
  dragon: "#7038f8",
  dark: "#705848",
  steel: "#b8b8d0",
  fairy: "#ee99ac",
};

import type { PaletteSpec, PlayerLookSpec } from "./types";

/**
 * What VOLTORB FLIP in the hidden Game Corner wins. `earnedAt` is the level to clear for each one.
 * Nothing is saved: prizes last for the visit.
 */

export const playerLooks: PlayerLookSpec[] = [
  { id: "classic", name: "CLASSIC", earnedAt: 0 },
  {
    id: "sparky",
    name: "SPARKY",
    earnedAt: 1,
    hat: "#f2c94c",
    top: "#f2c230",
    bottom: "#4a3f2a",
    shoes: "#c8902a",
  },
  {
    id: "leaf",
    name: "LEAF",
    earnedAt: 2,
    hair: "#5a3a22",
    hat: "#3aa05a",
    top: "#58a84c",
    bottom: "#3a4a3a",
    shoes: "#f0f0f0",
  },
  {
    id: "professor",
    name: "PROFESSOR",
    earnedAt: 3,
    hairStyle: "short",
    outfit: "coat",
    glasses: true,
    hair: "#2b1d14",
    top: "#f4f6f8",
    accent: "#6f7fd0",
    bottom: "#454a5e",
    shoes: "#4a3426",
  },
];

export const palettes: PaletteSpec[] = [
  { id: "normal", name: "NORMAL", earnedAt: 0 },
  { id: "gameboy", name: "GAME BOY", earnedAt: 3 },
  { id: "sepia", name: "SEPIA", earnedAt: 3 },
];

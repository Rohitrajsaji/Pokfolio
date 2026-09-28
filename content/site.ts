import type { SiteConfig } from "./types";

export const site: SiteConfig = {
  title: "Rohit Raj Saji — AI Engineer",
  description:
    "Rohit Raj Saji is an AI Engineer in Chennai, India, building agentic engineering workflows, legacy modernization, and full-stack apps. Explore the portfolio as a Pokémon-style adventure or read the classic résumé.",
  keywords: [
    "Rohit Raj Saji",
    "AI Engineer",
    "Agentic AI",
    "AI agents",
    "Full-Stack Developer",
    "Next.js",
    "Java Spring Boot",
    "Chennai",
  ],
  gameTitle: "ROHIT RAJ SAJI",
  gameSubtitle: "AI ENGINEER VERSION",
  townName: "CHENNAI CITY",
  partner: { dex: 25, name: "PIKACHU", types: ["electric"] },
  wild: { dex: 479, name: "ROTOM", nickname: "ROHIT", types: ["electric", "ghost"] },
  sprites: {
    baseUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites",
    criesUrl: "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest",
    style: "animated",
  },
  // Placeholder look — set these to match you.
  avatar: {
    hairStyle: "short",
    hairColor: "#2b2320",
    skinTone: "#c98e62",
    glasses: false,
    shirtColor: "#3a8f9a",
    coatColor: "#f4f6f8",
    trousersColor: "#3a3f55",
  },
  disclaimer:
    "Pokémon and all related names, sprites, and sounds are trademarks and © of Nintendo, Creatures Inc., and GAME FREAK Inc. This is a non-commercial fan tribute used as a personal portfolio; sprites and cries are loaded from PokeAPI.",
};

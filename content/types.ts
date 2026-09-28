/**
 * Shapes for everything in `content/`. TypeScript checks every content file
 * against these, so a missing field or a typo in a field name fails the build
 * instead of silently breaking the site.
 */

/** A Pokémon type. Used for colour accents: type badges, TM icons, Rotom forms. */
export type PokeType =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy";

/** Year and month in ISO format, e.g. "2026-03" for March 2026. */
export type YearMonth = `${number}-${number}`;

/**
 * A Pokémon shown next to a piece of content.
 * `dex` is the National Pokédex number — look it up on https://pokeapi.co or
 * https://bulbapedia.bulbagarden.net. Animated sprites exist for 1–649.
 */
export interface PokemonRef {
  dex: number;
  /** Species name as shown in-game, e.g. "ROTOM". */
  name: string;
  /** Optional nickname shown instead of the species name, e.g. "ROHIT". */
  nickname?: string;
  types?: PokeType[];
}

export interface Profile {
  name: string;
  /** Short name used in dialog boxes, e.g. "ROHIT". */
  shortName: string;
  role: string;
  focus: string;
  location: string;
  relocation: string;
  email: string;
  links: {
    linkedin: string;
    github: string;
  };
  /** One string per paragraph. */
  summary: string[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  university: string;
  start: YearMonth;
  end: YearMonth;
}

export interface Certification {
  name: string;
  detail: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Job {
  /** Unique, kebab-case. Used for in-game lookups and URLs. */
  id: string;
  company: string;
  role: string;
  kind: "full-time" | "internship" | "training";
  start: YearMonth;
  end: YearMonth | "present";
  location?: string;
  highlights: string[];
  /** Pokémon that represents this stage of your career (an evolution line reads nicely). */
  mascot: PokemonRef;
}

export interface Project {
  /** Unique, kebab-case. Used for in-game lookups and URLs. */
  id: string;
  name: string;
  tagline: string;
  status?: string;
  summary: string;
  /** Heading for the highlights list, e.g. "Modules" or "Focus areas". */
  highlightsTitle: string;
  highlights: string[];
  /** Technologies and topics, shown as chips. */
  tags: string[];
  links?: {
    github?: string;
    demo?: string;
  };
  mascot: PokemonRef;
}

export interface SkillCategory {
  /** Unique, kebab-case. */
  id: string;
  name: string;
  /**
   * Flavour type. Colours the category's TM icon and picks the Rotom form it
   * triggers in battle: fire → Heat, water → Wash, ice → Frost, flying → Fan,
   * grass → Mow, anything else → normal Rotom.
   */
  type: PokeType;
  skills: string[];
}

export interface CareerPreferences {
  intro: string;
  roles: string[];
}

export interface SiteConfig {
  /** Browser tab and search result title. */
  title: string;
  description: string;
  keywords: string[];
  /** Title screen text, styled like a game logo. */
  gameTitle: string;
  gameSubtitle: string;
  townName: string;
  /** The Pokémon the visitor battles with (back sprite in battle). */
  partner: PokemonRef;
  /** The wild Pokémon that represents you in the catch-to-hire encounter. */
  wild: PokemonRef;
  sprites: {
    /** Root of the PokeAPI sprites repo (or a self-hosted copy of it). */
    baseUrl: string;
    /** Root of the PokeAPI cries repo (or a self-hosted copy of it). */
    criesUrl: string;
    /** Animated Black/White GIFs, or static Black/White PNGs. */
    style: "animated" | "static";
  };
  /** How you look in-game: Prof. Rohit in the Lab and on the Trainer Card. */
  avatar: AvatarLook;
  disclaimer: string;
}

/** Colours are "#rrggbb". Shadows and highlights are worked out automatically. */
export interface AvatarLook {
  hairStyle: "short" | "long" | "buns" | "bald" | "cap";
  hairColor: string;
  skinTone: string;
  glasses: boolean;
  /** Shirt under the lab coat (also the cap colour for the "cap" style). */
  shirtColor: string;
  coatColor: string;
  trousersColor: string;
}

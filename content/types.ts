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

// ---------------------------------------------------------------- the game world

export type Direction = "up" | "down" | "left" | "right";

/**
 * Something the visitor can read or talk to. Text may use {name} (your short
 * name), {town}, {partner} and {wild}; they are filled in automatically.
 */
export interface Interaction {
  lines?: string[];
  /** A YES/NO question after the lines. YES continues to `then`; NO shows `no`. */
  confirm?: { question: string; no?: string[] };
  /** A screen opened after the lines (and after YES). */
  then?: ScreenRequest;
}

/** Screens the game can open. Ids refer to entries in projects.ts and experience.ts. */
export type ScreenRequest =
  | { screen: "dex"; project?: string }
  | { screen: "party"; job?: string }
  | { screen: "evolution" }
  | { screen: "bag"; shop?: boolean }
  | { screen: "card" }
  | { screen: "contact" }
  | { screen: "jobs" }
  | { screen: "ask" }
  | { screen: "map" }
  | { screen: "options" }
  | { screen: "help" }
  | { screen: "credits" }
  | { screen: "resume" };

/** Who an NPC looks like. "professor" is you, drawn from `site.avatar`. */
export type CastMember =
  "player" | "professor" | "nurse" | "clerk" | "lass" | "elder" | "youngster" | "aide" | "guide";

export interface NpcSpec {
  /** Unique within its map, kebab-case. */
  id: string;
  /** Shown above what they say, e.g. "PROF. ROHIT". */
  name?: string;
  look: CastMember;
  x: number;
  y: number;
  facing: Direction;
  /** How many tiles the NPC may stroll from where it starts; 0 or omitted stands still. */
  wander?: number;
  talk: Interaction;
}

export type TownProp =
  | { prop: "sign" | "mailbox"; x: number; y: number; read: Interaction }
  /** 2×2 tiles; (x, y) is the top-left. */
  | { prop: "jobBoard"; x: number; y: number; read: Interaction }
  | { prop: "lamp" | "bush" | "rock" | "fence"; x: number; y: number };

export type RoomId = "house" | "lab" | "center" | "mart" | "gym";

export interface TownSpec {
  /**
   * The ground, one string per row: . grass, = path, " tall grass,
   * * red flowers, + yellow flowers, T tree (trees are 2×2 blocks).
   */
  ground: string[];
  /** Each building's door leads into the room with the same id. (x, y) is the top-left tile. */
  buildings: Array<{ building: RoomId; x: number; y: number; hint: string }>;
  props: TownProp[];
  npcs: NpcSpec[];
  start: { x: number; y: number; facing: Direction };
  /** Said when the visitor tries to walk off the edge of the map. */
  edge: string[];
}

/**
 * Furniture in a room. Wall pieces (window, poster, diploma, certificate)
 * hang on the back wall, so only their x matters.
 */
export type Furniture = { x: number; y: number; read?: Interaction } & (
  | { item: "window" | "poster" | "diploma" | "certificate" }
  | { item: "bookshelf" | "shelf" | "pc" | "tv" | "plant" | "bed" | "statue" | "healer" }
  /** One machine per project; reading it opens that project's Pokédex page. */
  | { item: "machine"; project: string }
  /** One pedestal per job; reading it opens that job's summary. */
  | { item: "pedestal"; job: string }
  | { item: "table" | "counter" | "rug"; width: number; height?: number }
);

export interface RoomSpec {
  name: string;
  /** Tiles. The top two rows are the back wall; the exit mat is centred on the bottom row. */
  width: number;
  height: number;
  floor: "wood" | "tile";
  wall: "warm" | "cool";
  furniture: Furniture[];
  npcs: NpcSpec[];
}

// ---------------------------------------------------------------- the battle

/** A move in your partner's FIGHT menu. */
export interface BattleMove {
  name: string;
  type: PokeType;
  /** "damage" wears the wild Pokémon down (it never faints); "paralyze" makes it easy to catch. */
  effect: "damage" | "paralyze";
}

/**
 * The catch-to-hire battle in the tall grass. Lines may use {name}, {town},
 * {partner} and {wild}; lines that take more tokens say which.
 */
export interface BattleSpec {
  /** Shown in the HP boxes. Just for show. */
  levels: { partner: number; wild: number };
  /** Your partner's moves: up to four, like the games. */
  moves: BattleMove[];
  text: {
    appeared: string;
    go: string;
    prompt: string;
    /** {move} */
    partnerMove: string;
    /** Said once the wild Pokémon is worn down enough to catch easily. */
    weak: string;
    paralyzed: string;
    alreadyParalyzed: string;
    /** {category}: the skill category the wild Pokémon shows off this turn. */
    switched: string;
    /** {skill} */
    wildMove: string;
    effective: string;
    /** {ball} */
    thrown: string;
    /** When the ball breaks open after 0, 1 or 2 shakes. */
    brokeFree: [string, string, string];
    /** After a successful catch. The contact screen opens after the last line. */
    caught: [string, ...string[]];
    /** Choosing POKéMON. */
    party: string;
    fled: string;
  };
}

/** The scripted professor: topic buttons plus free-text questions matched by keywords. */
export interface QaSpec {
  greeting: string[];
  topics: Array<{
    label: string;
    keywords: string[];
    answer: string[];
    then?: ScreenRequest;
  }>;
  fallback: string[];
}

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

// ---------------------------------------------------------------- prizes

/** The screen colours a visitor can unlock. "normal" is always there. */
export type PaletteId = "normal" | "gameboy" | "sepia";

export interface PaletteSpec {
  id: PaletteId;
  name: string;
  /** The level of VOLTORB FLIP that has to be cleared to win it (0: always there). */
  earnedAt: number;
}

/**
 * A different way for the visitor's own character to look. Anything left out stays as it is in the
 * classic look (red cap, blue shirt). Colours are "#rrggbb".
 */
export interface PlayerLookSpec {
  id: string;
  name: string;
  /** The level of VOLTORB FLIP that has to be cleared to win it (0: always there). */
  earnedAt: number;
  hairStyle?: "short" | "long" | "buns" | "bald" | "cap";
  outfit?: "shirt" | "coat" | "dress";
  glasses?: boolean;
  hair?: string;
  skin?: string;
  top?: string;
  accent?: string;
  bottom?: string;
  shoes?: string;
  hat?: string;
}

// ---------------------------------------------------------------- the game world

export type Direction = "up" | "down" | "left" | "right";

/** Things a visitor can discover that change the world for the rest of their visit (nothing is saved). */
export type SecretId = "arcade";

/** Short full-screen moments: a Pokémon popping out of something, a glitch. */
export type CameoId = "rotom" | "missingno";

/** What happens once an interaction's lines are done (and after YES, if it asked). */
export interface Effect {
  /** Reveals a secret, such as a hidden staircase. */
  unlock?: SecretId;
  /** A short full-screen moment. */
  cameo?: CameoId;
  /** Lines said once the cameo is over. */
  after?: string[];
  /** A Pokémon's cry, by National Pokédex number. */
  cry?: number;
  /** A short tune in place of the music, like the one the nurse plays. */
  jingle?: "healed";
}

/**
 * Something the visitor can read or talk to. Text may use {name} (your short
 * name), {town}, {partner} and {wild}; they are filled in automatically.
 */
export interface Interaction {
  lines?: string[];
  /** A YES/NO question after the lines. YES continues to `effect` and `then`; NO shows `no`. */
  confirm?: { question: string; no?: string[] };
  /** What happens after the lines (and after YES). */
  effect?: Effect;
  /** A screen opened after the lines and the effect. */
  then?: ScreenRequest;
  /**
   * What to do instead as the visitor keeps coming back. From the `from`-th visit on (1 is the
   * first) the latest one that applies replaces all of the above: nothing carries over.
   */
  visits?: Visit[];
}

export type Visit = Omit<Interaction, "visits"> & { from: number };

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
  | { screen: "resume" }
  | { screen: "voltorb" }
  | { screen: "prizes" };

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
  | { prop: "jobBoard" | "snorlax"; x: number; y: number; read: Interaction }
  | { prop: "lamp" | "bush" | "rock" | "fence"; x: number; y: number };

export type RoomId = "house" | "lab" | "center" | "mart" | "gym";

/** Rooms no building leads to: they are found through a secret. */
export type SecretRoomId = "arcade";

export interface TownSpec {
  /**
   * The ground, one string per row: . grass, = path, " tall grass,
   * * red flowers, + yellow flowers, ~ water (you can't walk on it), T tree (trees are 2×2 blocks).
   */
  ground: string[];
  /** Each building's door leads into the room with the same id. (x, y) is the top-left tile. */
  buildings: Array<{ building: RoomId; x: number; y: number; hint: string }>;
  props: TownProp[];
  npcs: NpcSpec[];
  start: { x: number; y: number; facing: Direction };
  /** Said when the visitor tries to walk off the edge of the map, if they can reach it. */
  edge?: string[];
  /**
   * Secret routes: walking onto these tiles one after another, without stepping anywhere else
   * in between, sets off the effect (once per visit).
   */
  routes?: Array<{ id: string; tiles: Array<{ x: number; y: number }>; effect: Effect }>;
}

/**
 * Furniture in a room. Wall pieces (window, poster, diploma, certificate)
 * hang on the back wall, so only their x matters.
 */
export type Furniture = { x: number; y: number; read?: Interaction } & (
  | { item: "window" | "diploma" | "certificate" }
  /** A poster on the back wall. A crooked one is hiding something. */
  | { item: "poster"; crooked?: boolean }
  | {
      item:
        | "bookshelf"
        | "shelf"
        | "pc"
        | "tv"
        | "plant"
        | "bed"
        | "statue"
        | "healer"
        /** A fossil on a display stand. */
        | "fossil"
        /** An arcade cabinet, two tiles tall. */
        | "cabinet"
        /** A slot machine, two tiles tall. */
        | "slots";
    }
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
  floor: "wood" | "tile" | "carpet";
  wall: "warm" | "cool" | "dark";
  furniture: Furniture[];
  npcs: NpcSpec[];
  /**
   * A hidden staircase up the back wall, at tile (x, 1), that appears once `secret` is unlocked
   * and leads down to `to`. Until then it is plain wall.
   */
  stairs?: { secret: SecretId; x: number; to: SecretRoomId };
  /** Where the exit mat leads, for a room reached by a staircase: back up to that room's stairs. */
  leadsTo?: RoomId;
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

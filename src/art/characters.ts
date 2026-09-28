/**
 * Walking characters, 16×20 pixels. Each is a head (by hairstyle) on a body
 * (by outfit), coloured from a look — so a new NPC is a new look, not new art.
 */
import type { AvatarLook } from "@content/types";
import { shade, tint } from "./color";
import { paintGrid, rle, sym, type Palette } from "./grid";
import { EYES, OUTLINE, WHITE } from "./palette";
import { PixelBuffer } from "./pixel-buffer";

export type Facing = "down" | "up" | "left" | "right";
export type HairStyle = "short" | "cap" | "buns" | "long" | "bald";
export type Outfit = "shirt" | "coat" | "dress";
/** 0 and 2 stand, 1 and 3 are opposite steps. */
export type Step = 0 | 1 | 2 | 3;

export interface CharacterLook {
  hairStyle: HairStyle;
  outfit: Outfit;
  glasses?: boolean;
  hair: string;
  skin: string;
  /** Shirt, coat or dress. */
  top: string;
  /** Shirt under the coat. */
  accent?: string;
  /** Apron over a dress. */
  apron?: string;
  bottom: string;
  shoes: string;
  /** Cap colour for the "cap" style; the nurse cap for "buns". */
  hat?: string;
}

export const CHARACTER_WIDTH = 16;
export const CHARACTER_HEIGHT = 20;

type View = "down" | "up" | "side";
type Frames = { stand: readonly string[]; walk: readonly string[] };

// Heads are rows 0–9. Keys: o outline, h/H/i hair, s/S skin, e eyes,
// a/A hat, r red cross.
const HEADS: Record<HairStyle, Record<View, readonly string[]>> = {
  short: {
    down: [
      sym("4.4o"),
      sym("3.o4h"),
      rle("2.o2h2i6ho2."),
      sym(".o6h"),
      sym(".o6h"),
      sym(".oh5s"),
      sym(".oh2se2s"),
      sym(".oh2se2s"),
      sym("2.oS4s"),
      sym("3.oS3s"),
    ],
    up: [
      sym("4.4o"),
      sym("3.o4h"),
      sym("2.o5h"),
      sym(".o6h"),
      sym(".o6h"),
      rle(".o4hH2hH4ho."),
      sym(".o6h"),
      sym(".ohH4h"),
      sym("2.o5h"),
      sym("3.oS3s"),
    ],
    side: [
      rle("5.8o3."),
      rle("4.o8ho2."),
      rle("3.o6h2i2ho."),
      rle("2.o11ho."),
      rle(".o12ho."),
      rle(".o4s8ho."),
      rle(".ose2s8ho."),
      rle(".ose3sS6ho."),
      rle("2.o6s4ho2."),
      rle("3.oS4sSo5."),
    ],
  },
  cap: {
    down: [
      sym("4.4o"),
      sym("3.o4a"),
      rle("2.o4a2w4ao2."),
      sym(".o6A"),
      sym(".o6h"),
      sym(".oh5s"),
      sym(".oh2se2s"),
      sym(".oh2se2s"),
      sym("2.oS4s"),
      sym("3.oS3s"),
    ],
    up: [
      sym("4.4o"),
      sym("3.o4a"),
      sym("2.o5a"),
      sym("2.o5A"),
      sym(".o6h"),
      rle(".o4hH2hH4ho."),
      sym(".o6h"),
      sym(".ohH4h"),
      sym("2.o5h"),
      sym("3.oS3s"),
    ],
    side: [
      rle("5.8o3."),
      rle("4.o8ao2."),
      rle("3.o10ao."),
      rle("o13Ao."),
      rle(".o4s8ho."),
      rle(".o4s8ho."),
      rle(".ose2s8ho."),
      rle(".ose3sS6ho."),
      rle("2.o6s4ho2."),
      rle("3.oS4sSo5."),
    ],
  },
  buns: {
    down: [
      sym("5.3o"),
      rle(".2o.o2a2r2ao.2o."),
      rle("o2ho8ho2ho"),
      sym("o7h"),
      sym("ohH5h"),
      sym(".2oh4s"),
      sym("2.ohse2s"),
      sym("2.ohse2s"),
      sym("2.oS4s"),
      sym("3.oS3s"),
    ],
    up: [
      sym("5.3o"),
      rle(".2o.o6ao.2o."),
      rle("o2ho8ho2ho"),
      sym("o7h"),
      sym("ohH5h"),
      sym(".2o5h"),
      rle("2.o4h2H4ho2."),
      sym("2.o5h"),
      sym("2.o5h"),
      sym("3.oS3s"),
    ],
    side: [
      rle("6.6o4."),
      rle("5.o6ao.2o"),
      rle("4.o7ho2ho"),
      rle("3.o10h2o"),
      rle("2.o4s7ho."),
      rle(".o4s8ho."),
      rle(".ose2s8ho."),
      rle(".ose3sS6ho."),
      rle("2.o6s4ho2."),
      rle("3.oS4sSo5."),
    ],
  },
  long: {
    down: [
      sym("4.4o"),
      sym("3.o4h"),
      rle("2.o2h2i6ho2."),
      sym(".o6h"),
      sym(".o6h"),
      sym("o2h5s"),
      sym("o2h2se2s"),
      sym("o2h2se2s"),
      sym("o2hS4s"),
      sym("o2h.oS2s"),
    ],
    up: [
      sym("4.4o"),
      sym("3.o4h"),
      sym("2.o5h"),
      sym(".o6h"),
      sym(".o6h"),
      sym("o7h"),
      sym("o3hH3h"),
      sym("o7h"),
      sym("o7h"),
      sym("o2H5h"),
    ],
    side: [
      rle("5.8o3."),
      rle("4.o8ho2."),
      rle("3.o6h2i2ho."),
      rle("2.o11ho."),
      rle(".o12ho."),
      rle(".o4s9ho"),
      rle(".ose2s9ho"),
      rle(".ose3sS7ho"),
      rle("2.o5s7ho"),
      rle("3.oS3sSo5ho"),
    ],
  },
  bald: {
    down: [
      sym("4.4o"),
      rle("3.o2s2i4so3."),
      sym("2.o5s"),
      sym(".oh5s"),
      sym(".o2h4s"),
      sym(".o2h4s"),
      sym(".oh2se2s"),
      sym(".oh2se2s"),
      sym("2.oS3sh"),
      sym("3.oS3s"),
    ],
    up: [
      sym("4.4o"),
      sym("3.o4s"),
      sym("2.o5s"),
      sym(".o6s"),
      sym(".o6h"),
      sym(".o6h"),
      sym(".ohH4h"),
      sym(".o6h"),
      sym("2.o5h"),
      sym("3.oS3s"),
    ],
    side: [
      rle("5.8o3."),
      rle("4.o2i6so2."),
      rle("3.o10so."),
      rle("2.o11so."),
      rle(".o7s5ho."),
      rle(".o4s8ho."),
      rle(".ose2s8ho."),
      rle(".ose3sS6ho."),
      rle("2.o3sh2s4ho2."),
      rle("3.oS4sSo5."),
    ],
  },
};

const BLANK = rle("16.");

const GLASSES: Record<View, readonly string[] | null> = {
  down: [
    BLANK,
    BLANK,
    BLANK,
    BLANK,
    BLANK,
    rle("4.3g2.3g4."),
    rle("4.g.4g.g4."),
    rle("4.g.g2.g.g4."),
    rle("4.3g2.3g4."),
    BLANK,
  ],
  up: null,
  side: [
    BLANK,
    BLANK,
    BLANK,
    BLANK,
    BLANK,
    rle("2.3g11."),
    rle("2.g.4g8."),
    rle("2.g.g11."),
    rle("2.3g11."),
    BLANK,
  ],
};

// Bodies are rows 10–19. Keys: o outline, s skin, c/C top, k shirt under a
// coat, n apron, p/P trousers, f shoes.
const LEGS_WALK = [rle("3.o3f2o3po3."), rle("4.3o.o3fo3."), rle("9.3o4.")];
const SIDE_LEGS_WALK = [rle("3.o3p.o2po4."), rle("2.o3fo.o2fo4."), rle("2.5o.4o4.")];

function frames(stand: string[], walkLegs: string[]): Frames {
  return { stand, walk: [...stand.slice(0, stand.length - walkLegs.length), ...walkLegs] };
}

const BODIES: Record<Outfit, Record<View, Frames>> = {
  shirt: {
    down: frames(
      [
        rle("3.o3c2s3co3."),
        sym("2.o5c"),
        sym(".oC5c"),
        sym(".oC5c"),
        sym(".osC4c"),
        sym("3.o4p"),
        rle("3.o3p2P3po3."),
        sym("3.o3po"),
        sym("3.o3fo"),
        sym("4.3o."),
      ],
      LEGS_WALK,
    ),
    up: frames(
      [
        sym("3.o4c"),
        sym("2.o5c"),
        sym(".oC5c"),
        sym(".oC5c"),
        sym(".osC4c"),
        sym("3.o4p"),
        rle("3.o3p2P3po3."),
        sym("3.o3po"),
        sym("3.o3fo"),
        sym("4.3o."),
      ],
      LEGS_WALK,
    ),
    side: frames(
      [
        rle("4.o5co5."),
        rle("3.o7co4."),
        rle("3.o2c2C3co4."),
        rle("3.o2cC4co4."),
        rle("3.o2cs4co4."),
        rle("4.o5po5."),
        rle("4.o5po5."),
        rle("4.o2pP2po5."),
        rle("3.o4fo7."),
        rle("3.6o7."),
      ],
      SIDE_LEGS_WALK,
    ),
  },
  coat: {
    down: frames(
      [
        rle("3.o3c2k3co3."),
        rle("2.o4c2k4co2."),
        rle(".oC4c2k4cCo."),
        sym(".oC5c"),
        sym(".osC4c"),
        sym("2.oC4c"),
        rle("2.oC3c2o3cCo2."),
        sym("3.o3po"),
        sym("3.o3fo"),
        sym("4.3o."),
      ],
      LEGS_WALK,
    ),
    up: frames(
      [
        sym("3.o4c"),
        sym("2.o5c"),
        sym(".oC5c"),
        sym(".oC5c"),
        sym(".osC4c"),
        sym("2.oC4c"),
        rle("2.oC3c2o3cCo2."),
        sym("3.o3po"),
        sym("3.o3fo"),
        sym("4.3o."),
      ],
      LEGS_WALK,
    ),
    side: frames(
      [
        rle("4.ok4co5."),
        rle("3.o7co4."),
        rle("3.o2c2C3co4."),
        rle("3.o2cC4co4."),
        rle("3.o2cs4co4."),
        rle("3.o7co4."),
        rle("3.oC5cCo4."),
        rle("4.o2pP2po5."),
        rle("3.o4fo7."),
        rle("3.6o7."),
      ],
      SIDE_LEGS_WALK,
    ),
  },
  dress: {
    down: frames(
      [
        rle("3.o3c2s3co3."),
        sym("2.o5c"),
        sym(".oC5c"),
        sym(".osC2c2n"),
        sym("2.oCc3n"),
        sym(".oCc4n"),
        sym(".oC2c3n"),
        sym("2.6o"),
        sym("4.oso."),
        sym("4.o2f."),
      ],
      [rle("4.o2f2.oso4."), rle("9.2fo4.")],
    ),
    up: frames(
      [
        sym("3.o4c"),
        sym("2.o5c"),
        sym(".oC5c"),
        sym(".osC4c"),
        sym("2.oC4c"),
        sym(".oC5c"),
        sym(".oC5c"),
        sym("2.6o"),
        sym("4.oso."),
        sym("4.o2f."),
      ],
      [rle("4.o2f2.oso4."), rle("9.2fo4.")],
    ),
    side: frames(
      [
        rle("4.o2cs2co5."),
        rle("3.o7co4."),
        rle("3.o2c2C3co4."),
        rle("3.on2cs3co4."),
        rle("3.on6co4."),
        rle("2.on8co3."),
        rle("2.on8co3."),
        rle("2.11o3."),
        rle("5.oso8."),
        rle("4.o2fo8."),
      ],
      [rle("4.oso.oso5."), rle("3.o2fo.o2fo4.")],
    ),
  },
};

export function characterPalette(look: CharacterLook): Palette {
  const hat = look.hat ?? WHITE;
  return {
    o: OUTLINE,
    e: EYES,
    w: WHITE,
    r: "#e04848",
    g: "#343446",
    h: look.hair,
    H: shade(look.hair, 0.3),
    i: tint(look.hair, 0.35),
    s: look.skin,
    S: shade(look.skin, 0.18),
    a: hat,
    A: shade(hat, 0.25),
    c: look.top,
    C: shade(look.top, 0.2),
    k: look.accent ?? look.top,
    n: look.apron ?? look.top,
    p: look.bottom,
    P: shade(look.bottom, 0.25),
    f: look.shoes,
  };
}

/** Every head, body and overlay grid, for validation. */
export function characterRows(): Array<{ label: string; rows: readonly string[] }> {
  const out: Array<{ label: string; rows: readonly string[] }> = [];
  for (const [style, views] of Object.entries(HEADS)) {
    for (const [view, rows] of Object.entries(views))
      out.push({ label: `head ${style} ${view}`, rows });
  }
  for (const [outfit, views] of Object.entries(BODIES)) {
    for (const [view, f] of Object.entries(views)) {
      out.push({ label: `body ${outfit} ${view} stand`, rows: f.stand });
      out.push({ label: `body ${outfit} ${view} walk`, rows: f.walk });
    }
  }
  for (const [view, rows] of Object.entries(GLASSES)) {
    if (rows) out.push({ label: `glasses ${view}`, rows });
  }
  return out;
}

/** One animation frame of a character. */
export function characterFrame(look: CharacterLook, facing: Facing, step: Step = 0): PixelBuffer {
  const view: View = facing === "down" || facing === "up" ? facing : "side";
  const walking = step % 2 === 1;
  const palette = characterPalette(look);
  const buf = new PixelBuffer(CHARACTER_WIDTH, CHARACTER_HEIGHT);

  const body = BODIES[look.outfit][view][walking ? "walk" : "stand"];
  // Front and back steps alternate feet by mirroring the walk frame.
  paintGrid(buf, { rows: body, palette }, 0, 10, { flipX: step === 3 && view !== "side" });
  paintGrid(buf, { rows: HEADS[look.hairStyle][view], palette }, 0, 0);
  const glasses = GLASSES[view];
  if (look.glasses && glasses) paintGrid(buf, { rows: glasses, palette }, 0, 0);

  if (facing !== "right") return buf;
  const mirrored = new PixelBuffer(CHARACTER_WIDTH, CHARACTER_HEIGHT);
  mirrored.draw(buf, 0, 0, { flipX: true });
  return mirrored;
}

/** The built-in cast. Prof. Rohit's look comes from content/site.ts (`avatar`). */
export const LOOKS = {
  player: {
    hairStyle: "cap",
    outfit: "shirt",
    hair: "#4a3226",
    skin: "#f1c7a0",
    top: "#3a6fd0",
    bottom: "#3a3c4e",
    shoes: "#d04848",
    hat: "#e04848",
  },
  nurse: {
    hairStyle: "buns",
    outfit: "dress",
    hair: "#f08aa8",
    skin: "#f6d2b4",
    top: "#f8b8c8",
    apron: WHITE,
    bottom: "#f6d2b4",
    shoes: "#fafafa",
    hat: WHITE,
  },
  clerk: {
    hairStyle: "short",
    outfit: "shirt",
    hair: "#3b2618",
    skin: "#8d5a3c",
    top: "#4a8ae0",
    bottom: "#2e3a5a",
    shoes: "#2a2a34",
  },
  lass: {
    hairStyle: "long",
    outfit: "dress",
    hair: "#c8602a",
    skin: "#fbd8b8",
    top: "#6fc0ec",
    bottom: "#fbd8b8",
    shoes: "#e05050",
  },
  elder: {
    hairStyle: "bald",
    outfit: "shirt",
    hair: "#cfcfd4",
    skin: "#d9a57e",
    top: "#8a6a4a",
    bottom: "#5a5a6a",
    shoes: "#3a2a2a",
  },
} satisfies Record<string, CharacterLook>;

/** Prof. Rohit, built from the avatar settings in content/site.ts. */
export function avatarLook(avatar: AvatarLook): CharacterLook {
  return {
    hairStyle: avatar.hairStyle,
    outfit: "coat",
    glasses: avatar.glasses,
    hair: avatar.hairColor,
    skin: avatar.skinTone,
    top: avatar.coatColor,
    accent: avatar.shirtColor,
    bottom: avatar.trousersColor,
    shoes: "#4a3426",
    hat: avatar.hairStyle === "cap" ? avatar.shirtColor : undefined,
  };
}

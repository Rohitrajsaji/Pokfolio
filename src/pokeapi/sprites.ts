/**
 * The only place that knows where official sprites and cries come from.
 * To swap art sources (self-hosting, a different sprite style, or original
 * art), change `site.sprites` in content/site.ts or the builders below.
 */
import { site } from "@content/site";

export type SpriteView = "front" | "back";

export interface SpriteOptions {
  view?: SpriteView;
  /** Defaults to the site-wide `sprites.style` setting. */
  animated?: boolean;
  /** The alternate-colour sprite. */
  shiny?: boolean;
}

const BLACK_WHITE = "pokemon/versions/generation-v/black-white";
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function assertId(id: number): void {
  if (!Number.isInteger(id) || id < 1) throw new Error(`Invalid Pokémon id: ${id}`);
}

/**
 * Black/White battle sprite for a National Pokédex number, or for a PokeAPI
 * alternate-form id such as 10008 (Heat Rotom).
 */
export function pokemonSpriteUrl(
  id: number,
  {
    view = "front",
    animated = site.sprites.style === "animated",
    shiny = false,
  }: SpriteOptions = {},
): string {
  assertId(id);
  const segments = [site.sprites.baseUrl, BLACK_WHITE];
  if (animated) segments.push("animated");
  if (view === "back") segments.push("back");
  if (shiny) segments.push("shiny");
  return `${segments.join("/")}/${id}.${animated ? "gif" : "png"}`;
}

/** The 40×30 menu icon Pokémon games show in a party list (generation VII). */
export function partyIconUrl(id: number): string {
  assertId(id);
  return `${site.sprites.baseUrl}/pokemon/versions/generation-vii/icons/${id}.png`;
}

/** Bag icon for an item slug as PokeAPI names it, e.g. "poke-ball" or "tm-fire". */
export function itemSpriteUrl(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`Invalid item slug: ${slug}`);
  return `${site.sprites.baseUrl}/items/${slug}.png`;
}

/** Cry audio (Ogg Vorbis) for a National Pokédex number. */
export function cryUrl(id: number): string {
  assertId(id);
  return `${site.sprites.criesUrl}/${id}.ogg`;
}

/** The bottom panel (48 pixels tall, 6 from the bottom), and the tallest the field above it is drawn (see .battle-stage in game.css). */
export const PANEL_HEIGHT = 54;
export const MAX_STAGE = 168;

/**
 * How the field above the panel is used, from how tall it is. The partner is drawn at double
 * size (as in the games) only where there's room for it below the wild Pokémon's box, and its
 * HP numbers only where there's room under the wild Pokémon's platform.
 */
export function fieldFor(viewHeight: number): { partnerScale: number; partnerNumbers: boolean } {
  const stage = Math.min(viewHeight - PANEL_HEIGHT, MAX_STAGE);
  return { partnerScale: stage >= 118 ? 2 : 1, partnerNumbers: stage >= 130 };
}

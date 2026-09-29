import { profile } from "@content";
import { encodePng } from "@/art/png";
import { socialCard } from "@/lib/cards";

export const alt = `${profile.name}, ${profile.role}: a Pokémon-style portfolio you can play`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The picture shown when a link to the site is shared: the title over a slice of the town. */
export default function OpenGraphImage() {
  return new Response(encodePng(socialCard()), { headers: { "Content-Type": contentType } });
}

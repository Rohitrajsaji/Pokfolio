import { encodePng } from "@/art/png";
import { faviconArt } from "@/lib/cards";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** The browser-tab icon: the professor's portrait, drawn from content/site.ts at build time. */
export default function Icon() {
  return new Response(encodePng(faviconArt()), { headers: { "Content-Type": contentType } });
}

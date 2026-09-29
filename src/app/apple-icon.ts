import { encodePng } from "@/art/png";
import { appleIconArt } from "@/lib/cards";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The home-screen icon for iPhones and iPads. */
export default function AppleIcon() {
  return new Response(encodePng(appleIconArt()), { headers: { "Content-Type": contentType } });
}

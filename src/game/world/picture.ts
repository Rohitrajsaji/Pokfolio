import { PixelBuffer } from "@/art/pixel-buffer";
import { TILE } from "@/art/terrain";
import { buildWorld } from "./compile";

let picture: PixelBuffer | null = null;

/**
 * The whole town in one picture, drawn once by daylight. The Town Map, the
 * title screen's backdrop and the social card all show it.
 */
export function townPicture(): PixelBuffer {
  if (!picture) {
    const map = buildWorld().town;
    picture = new PixelBuffer(map.width * TILE, map.height * TILE);
    map.paint(picture, false);
  }
  return picture;
}

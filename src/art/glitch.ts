/** Art for things that aren't quite right: a jumble that used to be a Pokémon, and screen static. */
import { hash2 } from "./noise";
import { PixelBuffer } from "./pixel-buffer";

const JUMBLE = ["#101010", "#f4f4f4", "#7a7a7a", "#2c2c2c"];

/**
 * MissingNo.: not a Pokémon, but a tall block of scrambled 8×8 tiles with a ragged edge, 24×48.
 * Drawn here from scratch; each tile is either vertical stripes, noise, or a mix of the two.
 */
export function missingnoBuffer(): PixelBuffer {
  const buf = new PixelBuffer(24, 48);
  for (let ty = 0; ty < 6; ty++) {
    for (let tx = 0; tx < 3; tx++) {
      // Bites out of the corners, so it isn't a tidy rectangle.
      if ((tx === 2 && ty < 2) || (tx === 0 && ty >= 4)) continue;
      const flavour = Math.floor(hash2(tx, ty, 11) * 3);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const noise = hash2(tx * 8 + x, ty * 8 + y, 5 + flavour);
          const stripe = hash2(tx * 8 + x, ty, 7);
          const v = flavour === 0 ? stripe : flavour === 1 ? noise : (x + y) % 2 ? stripe : noise;
          buf.set(tx * 8 + x, ty * 8 + y, JUMBLE[Math.floor(v * JUMBLE.length)]);
        }
      }
    }
  }
  return buf;
}

const STATIC = ["#161a2e", "#1f2540", "#2a3154", "#38406a", "#f4f4f4"];

/** A square of television static, mostly dark and low in contrast, with a few bright flecks. */
export function staticBuffer(size = 64): PixelBuffer {
  const buf = new PixelBuffer(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = hash2(x, y, 23);
      buf.set(x, y, v > 0.985 ? STATIC[4] : STATIC[Math.floor((v / 0.985) * 4)]);
    }
  }
  return buf;
}

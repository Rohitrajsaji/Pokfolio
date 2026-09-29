/** Nearest-neighbour resizing for pixel art: every pixel becomes a crisp block. */
import { PixelBuffer } from "./pixel-buffer";

/** Enlarges `src` by a whole number `factor`. */
export function scaleBuffer(src: PixelBuffer, factor: number): PixelBuffer {
  if (!Number.isInteger(factor) || factor < 1) {
    throw new Error(`Scale must be a whole number, got ${factor}`);
  }
  const out = new PixelBuffer(src.width * factor, src.height * factor);
  const rowBytes = out.width * 4;
  for (let y = 0; y < src.height; y++) {
    const first = y * factor * rowBytes;
    for (let x = 0; x < src.width; x++) {
      const from = (y * src.width + x) * 4;
      const pixel = src.data.subarray(from, from + 4);
      for (let dx = 0; dx < factor; dx++) out.data.set(pixel, first + (x * factor + dx) * 4);
    }
    // The rest of the block's rows are copies of its first.
    for (let dy = 1; dy < factor; dy++) {
      out.data.copyWithin(first + dy * rowBytes, first, first + rowBytes);
    }
  }
  return out;
}

/**
 * Shrinks `src` by a whole number `factor`. Each block becomes one pixel: the one at the middle of
 * the block (`"middle"`), or the colour most of the block has (`"common"`, which keeps flat areas clean
 * and lets thin details, like lettering that would only turn to noise, fade out; the middle pixel wins a tie).
 */
export function shrinkBuffer(
  src: PixelBuffer,
  factor: number,
  pick: "middle" | "common" = "middle",
): PixelBuffer {
  if (!Number.isInteger(factor) || factor < 1) {
    throw new Error(`Scale must be a whole number, got ${factor}`);
  }
  const out = new PixelBuffer(Math.floor(src.width / factor), Math.floor(src.height / factor));
  const mid = Math.floor(factor / 2);
  const view = new DataView(src.data.buffer, src.data.byteOffset, src.data.byteLength);
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      const middle = ((y * factor + mid) * src.width + x * factor + mid) * 4;
      let from = middle;
      if (pick === "common") {
        const counts = new Map<number, number>();
        for (let dy = 0; dy < factor; dy++) {
          for (let dx = 0; dx < factor; dx++) {
            const colour = view.getUint32(((y * factor + dy) * src.width + x * factor + dx) * 4);
            counts.set(colour, (counts.get(colour) ?? 0) + 1);
          }
        }
        const most = Math.max(...counts.values());
        if (counts.get(view.getUint32(middle)) !== most) {
          // The middle pixel isn't among the commonest colours: take the first one that is.
          search: for (let dy = 0; dy < factor; dy++) {
            for (let dx = 0; dx < factor; dx++) {
              const at = ((y * factor + dy) * src.width + x * factor + dx) * 4;
              if (counts.get(view.getUint32(at)) === most) {
                from = at;
                break search;
              }
            }
          }
        }
      }
      out.data.set(src.data.subarray(from, from + 4), (y * out.width + x) * 4);
    }
  }
  return out;
}

/** The `width`×`height` window of `src` whose top-left corner is (x, y). */
export function cropBuffer(
  src: PixelBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
): PixelBuffer {
  if (x < 0 || y < 0 || x + width > src.width || y + height > src.height) {
    throw new Error(
      `The ${width}×${height} crop at (${x}, ${y}) is outside the ${src.width}×${src.height} buffer`,
    );
  }
  const out = new PixelBuffer(width, height);
  for (let row = 0; row < height; row++) {
    const from = ((y + row) * src.width + x) * 4;
    out.data.set(src.data.subarray(from, from + width * 4), row * width * 4);
  }
  return out;
}

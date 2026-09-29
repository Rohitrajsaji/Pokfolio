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

/** Browser-only bridge from PixelBuffer to <canvas>. */
import type { PixelBuffer } from "./pixel-buffer";

export function bufferToCanvas(buf: PixelBuffer): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = buf.width;
  canvas.height = buf.height;
  paintBuffer(canvas, buf);
  return canvas;
}

/** Replaces the canvas contents with the buffer's pixels (canvas must match its size). */
export function paintBuffer(canvas: HTMLCanvasElement, buf: PixelBuffer): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  ctx.putImageData(new ImageData(buf.data, buf.width, buf.height), 0, 0);
}

function packed(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

/**
 * Paints the buffer, darkens it with a multiply tint (time of day), then puts
 * back any pixel in `glow` untinted, so lit windows and lamps shine at night.
 */
export function paintLitBuffer(
  canvas: HTMLCanvasElement,
  buf: PixelBuffer,
  tint: string | null,
  glow: readonly string[] = [],
): void {
  paintBuffer(canvas, buf);
  if (!tint) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";
  if (glow.length === 0) return;

  const glowing = new Set(glow.map(packed));
  const tinted = ctx.getImageData(0, 0, buf.width, buf.height);
  const src = buf.data;
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] === 0) continue;
    if (glowing.has((src[i] << 16) | (src[i + 1] << 8) | src[i + 2])) {
      tinted.data.set(src.subarray(i, i + 4), i);
    }
  }
  ctx.putImageData(tinted, 0, 0);
}

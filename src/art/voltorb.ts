/** A Voltorb, drawn small: a ball with a red top, angry eyes, a dark band and a white bottom. */
import { OUTLINE, POKEBALL, WHITE } from "./palette";
import { PixelBuffer } from "./pixel-buffer";

export const VOLTORB_SIZE = 8;

/** Paints an 8×8 Voltorb with its top-left corner at (x, y). */
export function paintVoltorb(buf: PixelBuffer, x: number, y: number): void {
  for (let py = 0; py < VOLTORB_SIZE; py++) {
    for (let px = 0; px < VOLTORB_SIZE; px++) {
      const dx = px - 3.5;
      const dy = py - 3.5;
      if (dx * dx + dy * dy > 16) continue;
      const colour = py < 3 ? POKEBALL.red : py < 5 ? "#0a0a12" : POKEBALL.white;
      buf.set(x + px, y + py, colour);
    }
  }
  buf.rect(x + 2, y + 1, 2, 1, WHITE);
  buf.rect(x + 5, y + 1, 2, 1, WHITE);
  buf.set(x + 3, y + 2, OUTLINE);
  buf.set(x + 5, y + 2, OUTLINE);
  buf.set(x + 4, y + 3, POKEBALL.white);
}

export function voltorbBuffer(): PixelBuffer {
  const buf = new PixelBuffer(VOLTORB_SIZE, VOLTORB_SIZE);
  paintVoltorb(buf, 0, 0);
  return buf;
}

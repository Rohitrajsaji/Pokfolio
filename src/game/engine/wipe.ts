/**
 * The screen wipe between places: black blocks sweep across the screen
 * diagonally from the top left, and sweep away again on the other side.
 * Whole blocks only, so the picture never goes smoothly transparent.
 */

/** Block size, in game pixels. */
export const WIPE_BLOCK = 16;

/** Whether the wipe, `progress` of the way (0 to 1) across, has blackened this block. */
export function wipeCovers(
  col: number,
  row: number,
  cols: number,
  rows: number,
  progress: number,
): boolean {
  const order = cols + rows <= 2 ? 0 : (col + row) / (cols + rows - 2);
  // The sweep is a little wider than the screen, so the last block goes black at 1.
  return progress * 1.35 > order;
}

interface Painter {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, width: number, height: number): void;
}

export function drawWipe(ctx: Painter, width: number, height: number, progress: number): void {
  if (progress <= 0) return;
  const cols = Math.ceil(width / WIPE_BLOCK);
  const rows = Math.ceil(height / WIPE_BLOCK);
  ctx.fillStyle = "#000000";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (wipeCovers(col, row, cols, rows, progress)) {
        ctx.fillRect(col * WIPE_BLOCK, row * WIPE_BLOCK, WIPE_BLOCK, WIPE_BLOCK);
      }
    }
  }
}

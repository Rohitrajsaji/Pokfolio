/**
 * Text sprites: each row is a string, each character a pixel. Characters are
 * looked up in the palette; "." is transparent. Editing art is editing text.
 */
import { PixelBuffer, type DrawOptions } from "./pixel-buffer";

export type Palette = Readonly<Record<string, string>>;

export interface Grid {
  readonly rows: readonly string[];
  readonly palette: Palette;
}

export const TRANSPARENT = ".";

export function gridWidth(grid: Grid): number {
  return grid.rows[0]?.length ?? 0;
}

/** Problems with a grid, in plain words. Empty when the grid is valid. */
export function validateGrid(grid: Grid, expected: { width?: number; height?: number } = {}) {
  const errors: string[] = [];
  const width = gridWidth(grid);
  if (grid.rows.length === 0) errors.push("grid has no rows");
  grid.rows.forEach((row, y) => {
    if (row.length !== width) errors.push(`row ${y} is ${row.length} wide, expected ${width}`);
    const unknown = new Set([...row].filter((ch) => ch !== TRANSPARENT && !(ch in grid.palette)));
    for (const ch of unknown) errors.push(`row ${y} uses "${ch}", which is not in the palette`);
  });
  if (expected.width !== undefined && width !== expected.width) {
    errors.push(`grid is ${width} wide, expected ${expected.width}`);
  }
  if (expected.height !== undefined && grid.rows.length !== expected.height) {
    errors.push(`grid is ${grid.rows.length} tall, expected ${expected.height}`);
  }
  return errors;
}

export function paintGrid(
  buf: PixelBuffer,
  grid: Grid,
  dx: number,
  dy: number,
  { flipX = false }: DrawOptions = {},
): void {
  const width = gridWidth(grid);
  grid.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === TRANSPARENT) continue;
      const color = grid.palette[ch];
      if (!color) throw new Error(`"${ch}" is not in the palette`);
      buf.set(dx + (flipX ? width - 1 - x : x), dy + y, color);
    }
  });
}

/**
 * Expands run-length shorthand into a row: "3.o2co" → "...occo" reads as
 * "3 dots, an o, 2 c's, an o". Counts are optional.
 */
export function rle(spec: string): string {
  let out = "";
  let count = "";
  for (const ch of spec) {
    if (ch >= "0" && ch <= "9") {
      count += ch;
      continue;
    }
    out += ch.repeat(count ? Number(count) : 1);
    count = "";
  }
  if (count) throw new Error(`Row shorthand "${spec}" ends with a count but no character`);
  return out;
}

/** A symmetric row from its left half: sym("3.o4c") → "...occcc" + "cccco...". */
export function sym(leftHalf: string): string {
  const left = rle(leftHalf);
  return left + [...left].reverse().join("");
}

export function gridToBuffer(grid: Grid, options?: DrawOptions): PixelBuffer {
  const buf = new PixelBuffer(gridWidth(grid), grid.rows.length);
  paintGrid(buf, grid, 0, 0, options);
  return buf;
}

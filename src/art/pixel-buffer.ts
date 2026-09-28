/**
 * An RGBA pixel canvas that works without a browser. All art is drawn into
 * one of these, which keeps it testable in Node; `canvas.ts` hands the
 * pixels to a real canvas in the browser.
 */

const HEX = /^#([0-9a-f]{6})$/i;
const rgbCache = new Map<string, readonly [number, number, number]>();

function rgb(color: string): readonly [number, number, number] {
  let value = rgbCache.get(color);
  if (!value) {
    const match = HEX.exec(color);
    if (!match) throw new Error(`Invalid colour "${color}" — use #rrggbb`);
    const n = Number.parseInt(match[1], 16);
    value = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(color, value);
  }
  return value;
}

export interface DrawOptions {
  flipX?: boolean;
}

export class PixelBuffer {
  readonly data: Uint8ClampedArray<ArrayBuffer>;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error(`Invalid buffer size ${width}×${height}`);
    }
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  /** Sets one pixel; `null` makes it transparent. Out-of-bounds writes are ignored. */
  set(x: number, y: number, color: string | null): void {
    if (!this.inBounds(x, y)) return;
    const i = (y * this.width + x) * 4;
    if (color === null) {
      this.data.fill(0, i, i + 4);
      return;
    }
    const [r, g, b] = rgb(color);
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = 255;
  }

  /** The pixel's colour as #rrggbb, or null when transparent or out of bounds. */
  get(x: number, y: number): string | null {
    if (!this.inBounds(x, y)) return null;
    const i = (y * this.width + x) * 4;
    if (this.data[i + 3] === 0) return null;
    const hex = (v: number) => v.toString(16).padStart(2, "0");
    return `#${hex(this.data[i])}${hex(this.data[i + 1])}${hex(this.data[i + 2])}`;
  }

  rect(x: number, y: number, w: number, h: number, color: string | null): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color);
  }

  hline(x: number, y: number, w: number, color: string | null): void {
    this.rect(x, y, w, 1, color);
  }

  vline(x: number, y: number, h: number, color: string | null): void {
    this.rect(x, y, 1, h, color);
  }

  /** Fills pixels whose centres fall inside the ellipse. */
  fillEllipse(cx: number, cy: number, rx: number, ry: number, color: string | null): void {
    this.forEachInEllipse(cx, cy, rx, ry, (x, y) => this.set(x, y, color));
  }

  /** Scales an opaque pixel's colour towards black; factor 0.75 keeps 75% brightness. */
  darken(x: number, y: number, factor: number): void {
    if (!this.inBounds(x, y)) return;
    const i = (y * this.width + x) * 4;
    if (this.data[i + 3] === 0) return;
    for (let c = 0; c < 3; c++) this.data[i + c] = Math.round(this.data[i + c] * factor);
  }

  /** Soft drop shadow: darkens whatever is already drawn inside the ellipse. */
  shadeEllipse(cx: number, cy: number, rx: number, ry: number, factor: number): void {
    this.forEachInEllipse(cx, cy, rx, ry, (x, y) => this.darken(x, y, factor));
  }

  private forEachInEllipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    visit: (x: number, y: number) => void,
  ): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) visit(x, y);
      }
    }
  }

  /** Copies `src` onto this buffer at (dx, dy), skipping its transparent pixels. */
  draw(src: PixelBuffer, dx: number, dy: number, { flipX = false }: DrawOptions = {}): void {
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const from = (y * src.width + x) * 4;
        if (src.data[from + 3] === 0) continue;
        const tx = dx + (flipX ? src.width - 1 - x : x);
        const ty = dy + y;
        if (!this.inBounds(tx, ty)) continue;
        const to = (ty * this.width + tx) * 4;
        this.data.set(src.data.subarray(from, from + 4), to);
      }
    }
  }
}

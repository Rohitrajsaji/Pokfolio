/** Small colour helpers so looks can be defined from a few base colours. */

function channels(color: string): [number, number, number] {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) throw new Error(`Invalid colour "${color}" — use #rrggbb`);
  const n = Number.parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  const hex = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Blends `a` towards `b`; amount 0 is `a`, 1 is `b`. */
export function mix(a: string, b: string, amount: number): string {
  const ca = channels(a);
  const cb = channels(b);
  return toHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * amount) as [number, number, number]);
}

/** Darker version of a colour, for shading. */
export function shade(color: string, amount = 0.22): string {
  return mix(color, "#1c1830", amount);
}

/** Lighter version of a colour, for highlights. */
export function tint(color: string, amount = 0.3): string {
  return mix(color, "#ffffff", amount);
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

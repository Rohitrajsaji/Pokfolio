import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The game looks like one pixel-art picture, and this keeps it that way when
 * someone edits later. It reads game.css and the game's components and fails
 * on anything that isn't pixel-art: rounded corners, blurred shadows,
 * gradients, rotation, smooth transitions, other fonts, or symbols the pixel
 * font doesn't have (those would fall back to a modern font).
 */

const css = readFileSync(join(process.cwd(), "src/app/game.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

/** Splits on `separator`, ignoring any inside parentheses. */
function splitTop(text: string, separator: RegExp | string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    const isSeparator =
      depth === 0 && (typeof separator === "string" ? ch === separator : separator.test(ch));
    if (isSeparator) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function declarations(property: string): string[] {
  return [...css.matchAll(new RegExp(`(?:^|[;{\\s])${property}\\s*:\\s*([^;}]+)`, "g"))].map(
    (match) => match[1].trim(),
  );
}

const isLength = (token: string) => /^(calc\(|-?[\d.]+(px)?$|0$)/.test(token);

describe("the pixel look", () => {
  it("has square corners: no border-radius anywhere", () => {
    expect(css).not.toMatch(/border-radius/);
  });

  it("uses flat colours: no gradients", () => {
    expect(css).not.toMatch(/(linear|radial|conic)-gradient/);
  });

  it("never blurs, rotates or skews", () => {
    expect(css).not.toMatch(
      /blur\(|drop-shadow\(|(?<![\w-])(rotate|skew)[XYZ]?\(|perspective|backdrop-filter/,
    );
  });

  it("has shadows with no blur, so their edges stay hard", () => {
    const offenders: string[] = [];
    for (const property of ["box-shadow", "text-shadow"]) {
      for (const value of declarations(property)) {
        for (const shadow of splitTop(value, ",")) {
          const lengths = splitTop(shadow, /\s/).filter(isLength);
          if (lengths.length >= 3 && lengths[2] !== "0") offenders.push(`${property}: ${shadow}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("moves in steps: every animation uses steps(), and nothing transitions smoothly", () => {
    expect(css).not.toMatch(/(^|[;{\s])transition\s*:/);
    const smooth = declarations("animation").filter(
      (value) =>
        value !== "none !important" &&
        splitTop(value, ",").some((a) => !/steps\(|step-end/.test(a)),
    );
    expect(smooth).toEqual([]);
  });

  it("uses one font: the pixel font, at sizes that land on its grid", () => {
    for (const family of declarations("font-family")) {
      expect(family).toMatch(/^var\(--font-pixelify\)/);
    }
    for (const size of declarations("font-size")) {
      expect(size, "font-size").toMatch(
        /^(inherit|calc\((5|10|20) \* var\(--px\)\)|calc\(5 \* var\(--pp\)\))$/,
      );
    }
    for (const weight of declarations("font-weight")) expect(weight).toBe("400");
    expect(css).not.toMatch(/geist|sans-serif/i);
  });

  it("is measured in game pixels, not in the window's", () => {
    // The exceptions: the first guess at the pixel size before it's measured, and the touch
    // pad, whose pixel comes from the window (the game's own pixel depends on room left by the pad).
    const withoutGuess = css
      .replace(/--px: max\(1px, calc\(100vw \/ 320\)\);/, "")
      .replace(/--pp(-w)?: (max|calc)\([^;]*;/g, "");
    expect(withoutGuess).not.toMatch(/-?[\d.]+(vw|vh|dvh|dvw|cqw|cqh|em|rem)\b/);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("the game's text", () => {
  it("sticks to symbols the pixel font can draw", () => {
    // Arrows, ticks and notes come from icons (see game.css), not from characters.
    const banned = /[▶▼▲◀✕✦↗♪✚☰]/;
    const offenders = sourceFiles(join(process.cwd(), "src/game")).filter((file) =>
      banned.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});

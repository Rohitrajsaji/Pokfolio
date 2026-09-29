import { expect, test } from "@playwright/test";
import {
  ALL_SHAPES,
  PHONES,
  TABLETS,
  boxes,
  contextFor,
  inside,
  openTitle,
  overlaps,
  type Box,
} from "./helpers";

for (const shape of ALL_SHAPES) {
  test.describe(`${shape.name} ${shape.width}x${shape.height}`, () => {
    test.use(contextFor(shape));

    test("the title screen never covers its own logo, menu or credits", async ({ page }) => {
      await openTitle(page);
      await page.waitForTimeout(400);
      const screen = (await boxes(page, ".game-screen"))[0];
      const parts: Array<[string, Box[]]> = [
        ["tool buttons", await boxes(page, ".title-tools button")],
        ["logo", await boxes(page, ".title-logo")],
        ["version", await boxes(page, ".title-version")],
        ["Pokémon", await boxes(page, ".title-mon")],
        ["menu", await boxes(page, ".title-menu button")],
        ["credits", await boxes(page, ".title-disclaimer")],
      ];
      for (const [name, list] of parts) {
        for (const box of list) expect(inside(box, screen), `${name} is on screen`).toBe(true);
      }
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          for (const a of parts[i][1]) {
            for (const b of parts[j][1]) {
              expect(overlaps(a, b), `${parts[i][0]} overlaps ${parts[j][0]}`).toBe(false);
            }
          }
        }
      }
    });
  });
}

const PAD_SHAPES = [...PHONES, ...TABLETS];

for (const shape of PAD_SHAPES) {
  test.describe(`pad at ${shape.name} ${shape.width}x${shape.height}`, () => {
    test.use(contextFor(shape));

    test("every pad button is on screen, big enough to tap, and clear of the others", async ({
      page,
    }) => {
      await openTitle(page);
      await page.waitForTimeout(400);
      const window: Box = { left: 0, top: 0, right: shape.width, bottom: shape.height };
      const names = ["Up", "Down", "Left", "Right", "Start menu", "A button", "B button"];
      const found: Array<[string, Box]> = [];
      for (const name of names) {
        const list = await boxes(page, `.touch-controls button[aria-label="${name}"]`);
        expect(list.length, `${name} button exists`).toBe(1);
        found.push([name, list[0]]);
      }
      for (const [name, box] of found) {
        expect(inside(box, window), `${name} is on screen`).toBe(true);
        const w = box.right - box.left;
        const h = box.bottom - box.top;
        // Apple asks for 44px; the D-pad's arms are allowed a little less because they sit edge to edge.
        const least =
          name === "A button" || name === "B button" ? 44 : name === "Start menu" ? 22 : 36;
        expect(Math.min(w, h), `${name} is at least ${least}px to tap`).toBeGreaterThanOrEqual(
          least,
        );
      }
      for (let i = 0; i < found.length; i++) {
        for (let j = i + 1; j < found.length; j++) {
          expect(overlaps(found[i][1], found[j][1]), `${found[i][0]} overlaps ${found[j][0]}`).toBe(
            false,
          );
        }
      }
      // The pad must not swallow the game: it keeps at least a third of the window's short side.
      const screen = (await boxes(page, ".game-screen"))[0];
      const portrait = shape.height > shape.width;
      if (portrait) expect(screen.bottom - screen.top).toBeGreaterThan(shape.height * 0.45);
      else expect(screen.right - screen.left).toBeGreaterThan(shape.width * 0.45);
    });
  });
}

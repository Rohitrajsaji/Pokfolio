import { expect, test } from "@playwright/test";
import { closeDialogs, contextFor, startGame, type Shape } from "./helpers";

/**
 * The world is drawn with nearest-neighbour sampling, so any half-pixel offset drops and
 * doubles columns of pixels: thin strokes, like the letters on the building signs, vanish.
 * These windows all give an odd-sized game view (the camera used to land on a half pixel).
 */
const ODD_VIEWS: Shape[] = [
  { name: "1366 laptop", width: 1366, height: 657, dpr: 1 },
  { name: "iPad Air", width: 820, height: 1180, dpr: 2 },
  { name: "iPhone 14 landscape", width: 844, height: 390, dpr: 3, touch: true },
  { name: "iPhone SE", width: 375, height: 667, dpr: 2, touch: true },
  { name: "MacBook 13", width: 1440, height: 789, dpr: 2 },
];

for (const shape of ODD_VIEWS) {
  test.describe(`${shape.name} ${shape.width}x${shape.height}`, () => {
    test.use(contextFor(shape));

    test("draws the town and a room on whole pixels only", async ({ page }) => {
      await page.addInitScript(() => {
        const bad: number[][] = [];
        (window as unknown as { __fractionalDraws: number[][] }).__fractionalDraws = bad;
        const original = CanvasRenderingContext2D.prototype.drawImage as (
          ...args: unknown[]
        ) => void;
        CanvasRenderingContext2D.prototype.drawImage = function (
          this: CanvasRenderingContext2D,
          ...args: unknown[]
        ) {
          if (this.canvas.classList.contains("game-canvas")) {
            // (image, dx, dy), (image, dx, dy, dw, dh) or (image, sx, sy, sw, sh, dx, dy, dw, dh)
            const at = (args.length === 9 ? [args[5], args[6]] : [args[1], args[2]]) as number[];
            if (at.some((n) => !Number.isInteger(n))) bad.push(at);
          }
          return original.apply(this, args);
        } as typeof CanvasRenderingContext2D.prototype.drawImage;
      });
      await startGame(page);
      // Walk so the camera follows the visitor, up the road and into the grass.
      for (const key of ["ArrowUp", "ArrowRight", "ArrowUp", "ArrowLeft"]) {
        await page.keyboard.down(key);
        await page.waitForTimeout(500);
        await page.keyboard.up(key);
      }
      // And indoors: open the town map and go to the lab.
      await page.keyboard.press("m");
      await page.getByRole("menuitem", { name: /TOWN MAP/ }).click();
      await page.getByRole("button", { name: /LAB/ }).first().click();
      await page.waitForTimeout(1500);
      await closeDialogs(page);
      await page.keyboard.down("ArrowUp");
      await page.waitForTimeout(600);
      await page.keyboard.up("ArrowUp");
      const bad = await page.evaluate(
        () => (window as unknown as { __fractionalDraws: number[][] }).__fractionalDraws,
      );
      expect(bad.slice(0, 5)).toEqual([]);
    });
  });
}

test.describe("a tall window", () => {
  test.use(contextFor({ name: "iPhone 14", width: 390, height: 844, dpr: 3, touch: true }));

  test("shows trees, not black, above and below the town", async ({ page }) => {
    await startGame(page);
    const samples = await page.evaluate(() => {
      const canvas = document.querySelector(".game-canvas") as HTMLCanvasElement;
      const ctx = canvas.getContext("2d")!;
      const { width, height } = canvas;
      const at = [
        [1, 1],
        [width - 2, 1],
        [width >> 1, 1],
        [1, height - 2],
        [width - 2, height - 2],
        [width >> 1, height - 2],
      ];
      return at.map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3)));
    });
    for (const rgb of samples)
      expect(rgb, "not the black of an empty screen").not.toEqual([12, 13, 20]);
  });
});

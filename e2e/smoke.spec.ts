import { expect, test, type Page } from "@playwright/test";
import { openTitle } from "./helpers";

const SHAPES = [
  { name: "small phone", width: 320, height: 568 },
  { name: "phone", width: 390, height: 844 },
  { name: "phone landscape", width: 844, height: 390 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "laptop", width: 1440, height: 900 },
  { name: "4K", width: 3840, height: 2160 },
  { name: "ultra-wide", width: 3440, height: 1440 },
];

const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

for (const shape of SHAPES) {
  test(`boots and fits at ${shape.name} (${shape.width}x${shape.height})`, async ({ page }) => {
    await page.setViewportSize({ width: shape.width, height: shape.height });
    await page.goto("/");
    await expect(page.getByRole("menuitem", { name: "PRESS START" })).toBeVisible();
    const box = await page.locator(".game-screen").boundingBox();
    expect(box && box.width > 0 && box.height > 0).toBe(true);
    expect(box!.width).toBeLessThanOrEqual(shape.width + 1);
    expect(box!.height).toBeLessThanOrEqual(shape.height + 1);
    expect(await noSideScroll(page)).toBe(true);
    const canvas = await page
      .locator(".game-canvas")
      .evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
    expect(canvas[0]).toBeGreaterThan(0);
    expect(canvas[0]).toBeLessThanOrEqual(1200);
  });
}

test("keyboard alone gets from the title to the town", async ({ page }) => {
  await openTitle(page, "");
  await page.keyboard.press("Enter");
  await expect(page.locator(".intro-scene")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".intro-scene")).toBeHidden();
  await expect(page.getByRole("group", { name: "Dialog" })).toBeVisible();
});

test("the résumé is two key presses from the title and closes back to it", async ({ page }) => {
  await openTitle(page, "");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByText("SUMMARY").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menuitem", { name: "PRESS START" })).toBeVisible();
});

test("printing shows only the plain résumé", async ({ page }) => {
  await page.goto("/");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".resume-text")).toBeVisible();
  await expect(page.locator(".game")).toBeHidden();
  expect(await page.locator("body").innerText()).not.toMatch(/costco/i);
});

test("still works when PokeAPI is unreachable", async ({ page }) => {
  await page.route(/raw\.githubusercontent\.com\/PokeAPI/, (route) => route.abort());
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openTitle(page, "");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(page.locator(".intro-scene")).toBeHidden();
  expect(errors).toEqual([]);
});

test("reduced motion still boots", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openTitle(page, "");
  await page.keyboard.press("Enter");
  await expect(page.locator(".intro-scene")).toBeVisible();
});

import { expect, test } from "@playwright/test";
import { closeDialogs, said, startGame, travelTo } from "./helpers";

test("the wild Pokémon flashes in on its platform instead of sliding in from the side", async ({
  page,
}) => {
  test.setTimeout(90_000);
  // From the moment a battle appears, write down where the wild Pokémon and its platform are, every frame.
  await page.addInitScript(() => {
    const seen: Array<{ x: number; opacity: number; platformX: number }> = [];
    (window as unknown as { __wild: typeof seen }).__wild = seen;
    let watching = false;
    const sample = () => {
      const wild = document.querySelector(".battle-wild");
      const platform = document.querySelector(".battle-platform-wild");
      if (wild && platform) {
        const box = wild.getBoundingClientRect();
        const ground = platform.getBoundingClientRect();
        seen.push({
          x: box.left + box.width / 2,
          opacity: Number(getComputedStyle(wild).opacity),
          platformX: ground.left + ground.width / 2,
        });
      }
      requestAnimationFrame(sample);
    };
    new MutationObserver(() => {
      if (!watching && document.querySelector(".battle")) {
        watching = true;
        requestAnimationFrame(sample);
      }
    }).observe(document, { childList: true, subtree: true });
  });

  await startGame(page);
  await travelTo(page, /TALL GRASS/);
  // Walk about in the tall grass until the wild Pokémon turns up (within a few steps, always).
  const battle = page.locator(".battle");
  for (let round = 0; round < 10 && !(await battle.isVisible()); round++) {
    for (const key of [
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
    ]) {
      await page.keyboard.down(key);
      await page.waitForTimeout(420);
      await page.keyboard.up(key);
      await page.waitForTimeout(100);
      if (await battle.isVisible()) break;
    }
  }
  await expect(battle).toBeVisible();
  // The intro lasts 1.3 seconds; the message that follows means it's over.
  await expect(page.getByText("A wild ROHIT appeared!").first()).toBeVisible();
  await page.waitForTimeout(500);

  const seen = await page.evaluate(
    () =>
      (window as unknown as { __wild: Array<{ x: number; opacity: number; platformX: number }> })
        .__wild,
  );
  expect(seen.length).toBeGreaterThan(30);
  // It never moves sideways: the same place on the first frame it's drawn as on the last.
  const xs = seen.map((frame) => frame.x);
  expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(1);
  // The platform is there from the start, and stays.
  const platforms = seen.map((frame) => frame.platformX);
  expect(Math.max(...platforms) - Math.min(...platforms)).toBeLessThanOrEqual(1);
  // It arrives on the platform, not beside it, and is fully there at the end.
  expect(Math.abs(xs[xs.length - 1] - platforms[platforms.length - 1])).toBeLessThanOrEqual(2);
  expect(seen[seen.length - 1].opacity).toBe(1);
  // And it does appear, rather than simply being there: hidden at first.
  expect(Math.min(...seen.map((frame) => frame.opacity))).toBe(0);
});

test("after the shore glitch, the wild ROHIT is shiny for the rest of the visit", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startGame(page);
  await travelTo(page, /TALL GRASS/);
  await page.keyboard.down("ArrowRight");
  await expect(page.locator('.cameo[data-cameo="missingno"]')).toBeVisible({ timeout: 20_000 });
  await page.keyboard.up("ArrowRight");
  await expect.poll(() => said(page), { timeout: 10_000 }).toContain("scrambled");
  await closeDialogs(page);

  // Now into the tall grass: whenever the wild ROHIT turns up, it glitters.
  await travelTo(page, /TALL GRASS/);
  const battle = page.locator(".battle");
  for (let round = 0; round < 10 && !(await battle.isVisible()); round++) {
    for (const key of [
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
    ]) {
      await page.keyboard.down(key);
      await page.waitForTimeout(420);
      await page.keyboard.up(key);
      await page.waitForTimeout(100);
      if (await battle.isVisible()) break;
    }
  }
  await expect(battle).toBeVisible();
  await expect(page.getByText("A shiny ROHIT appeared!").first()).toBeVisible();
  await expect(page.locator(".battle-wild .battle-sprite")).toHaveAttribute("src", /\/shiny\//);
});

import { expect, test, type Page } from "@playwright/test";
import { DESKTOPS, PHONES, closeDialogs, contextFor, startGame, type Shape } from "./helpers";

/** The START menu's screens, by the name each has in the menu. */
const SCREENS = ["POKéDEX", "POKéMON", "BAG", "ROHIT", "POKéGEAR", "OPTIONS", "RÉSUMÉ"];

const SHAPES: Shape[] = [DESKTOPS[1], DESKTOPS[3], PHONES[3], PHONES[0], PHONES[7]];

/** The most any scrolling part of the open screen has to scroll, in pixels. */
async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const frame = document.querySelector(".screen-frame");
    if (!frame) return -1;
    let worst = 0;
    for (const el of [frame, ...frame.querySelectorAll("*")]) {
      const { overflowY } = getComputedStyle(el);
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 1
      ) {
        worst = Math.max(worst, el.scrollHeight - el.clientHeight);
      }
    }
    return worst;
  });
}

async function openFromMenu(page: Page, name: string): Promise<void> {
  await page.keyboard.press("m");
  await page.getByRole("menuitem", { name, exact: true }).click();
  await expect(page.locator(".screen-frame")).toHaveCount(1);
  await page.waitForTimeout(400);
}

async function leave(page: Page): Promise<void> {
  for (let i = 0; i < 3 && (await page.locator(".screen-frame, .start-menu").count()) > 0; i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }
}

for (const shape of SHAPES) {
  test.describe(`${shape.name} ${shape.width}x${shape.height}`, () => {
    test.use(contextFor(shape));

    test("every screen fits its window, paging what's long instead of scrolling", async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await startGame(page);
      for (const name of SCREENS) {
        await openFromMenu(page, name);
        expect(await overflow(page), `${name} scrolls`).toBe(0);
        await leave(page);
      }
    });
  });
}

test("screens don't send you to other screens: no buttons that jump about", async ({ page }) => {
  await startGame(page);
  for (const name of ["ROHIT", "POKéGEAR", "POKéMON", "BAG"]) {
    await openFromMenu(page, name);
    await expect(
      page.getByRole("button", { name: /^(OPEN|READ|SEE|WATCH) THE / }),
      `${name} has a link to another screen`,
    ).toHaveCount(0);
    await leave(page);
  }
});

test("only one screen is ever open, however often the menu is used", async ({ page }) => {
  await startGame(page);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("m");
    await page.getByRole("menuitem", { name: "OPTIONS", exact: true }).click();
    await expect(page.locator(".screen-frame")).toHaveCount(1);
    await page.getByRole("button", { name: "HELP" }).click();
    await expect(page.locator(".screen-frame")).toHaveCount(1);
    await expect(page.getByRole("dialog", { name: "HELP" })).toBeVisible();
    // Closing goes back to the menu it started from, not to another screen underneath.
    await page.keyboard.press("Escape");
    await expect(page.locator(".screen-frame")).toHaveCount(0);
    await closeDialogs(page);
    if (
      await page
        .locator(".start-menu")
        .isVisible()
        .catch(() => false)
    ) {
      await page.keyboard.press("Escape");
    }
  }
});

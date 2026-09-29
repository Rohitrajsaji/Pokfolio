import { expect, test, type Page } from "@playwright/test";
import { closeDialogs, hold, said, startGame, tapTile, travelTo } from "./helpers";

/** Presses through everything the open dialog says, and gives it back as one piece of text. */
async function readThrough(page: Page): Promise<string> {
  const pages: string[] = [];
  for (let i = 0; i < 14; i++) {
    const text = await said(page);
    if (text === null) break;
    if (pages[pages.length - 1] !== text) pages.push(text);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
  }
  return pages.join(" ");
}

test("SNORLAX sleeps across the road out, and has more to say each time you come back", async ({
  page,
}) => {
  await startGame(page);
  // The road out runs straight down from where the visitor starts, and ends at SNORLAX.
  await hold(page, "ArrowDown", 500);
  await page.keyboard.press("Enter");
  expect(await readThrough(page)).toContain("sound asleep");

  // Facing it from the tile beside is the same SNORLAX, so this is the second visit, not the first.
  await hold(page, "ArrowLeft", 230);
  await hold(page, "ArrowDown", 60);
  await page.keyboard.press("Enter");
  expect(await readThrough(page)).toContain("still fast asleep");

  // Keep coming, and it dreams of a POKé FLUTE.
  for (let visit = 3; visit < 5; visit++) {
    await page.keyboard.press("Enter");
    await readThrough(page);
  }
  await page.keyboard.press("Enter");
  expect(await readThrough(page)).toContain("POKé FLUTE");
});

test("walking the whole shore of the pond in one go scrambles the screen, once", async ({
  page,
}) => {
  await startGame(page);
  // The tall grass town-map stop is on the path that runs along the pond's north shore.
  await travelTo(page, /TALL GRASS/);
  await page.keyboard.down("ArrowRight");
  await expect(page.locator('.cameo[data-cameo="missingno"]')).toBeVisible({ timeout: 20_000 });
  await page.keyboard.up("ArrowRight");
  await expect.poll(() => said(page), { timeout: 10_000 }).toContain("scrambled");
  await closeDialogs(page);

  // Back the way it came, and along it again: it only happens once per visit.
  await hold(page, "ArrowLeft", 2600);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(4200);
  await page.keyboard.up("ArrowRight");
  await page.waitForTimeout(800);
  await expect(page.locator(".cameo")).toHaveCount(0);
  expect(await said(page)).toBeNull();
});

test("the old man needs his coffee, then lets a secret about the pond slip", async ({ page }) => {
  await startGame(page);
  await travelTo(page, /TALL GRASS/);
  // Two tiles from him: one step, then he's in the way.
  await hold(page, "ArrowLeft", 600);

  const talk = async () => {
    await page.keyboard.press("Enter");
    return readThrough(page);
  };
  expect(await talk()).toContain("AS400");
  expect(await talk()).toContain("AS400");
  expect(await talk()).toContain("before my coffee");
  expect(await talk()).toContain("Still no coffee");
  expect(await talk()).toContain("Still no coffee");
  const sixth = await talk();
  expect(sixth).toContain("good cup of coffee");
  expect(sixth).toContain("shore of the pond");
});

test("the HELIX FOSSIL in the Lab is consulted, and then bowed to", async ({ page }) => {
  await startGame(page);
  await travelTo(page, /LAB/);
  const lab = { width: 12, height: 9 };
  const fossil = { x: 5, y: 5 };

  await tapTile(page, fossil, lab);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("HELIX FOSSIL");
  await readThrough(page);

  await tapTile(page, fossil, lab);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("You ask the HELIX FOSSIL");
  await readThrough(page);

  await tapTile(page, fossil, lab);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("You bow to the HELIX FOSSIL");
});

test("something lives in the TV at home, and comes out the third time", async ({ page }) => {
  test.setTimeout(60_000);
  await startGame(page);
  await travelTo(page, /HOUSE/);
  const house = { width: 10, height: 8 };
  const tv = { x: 1, y: 2 };
  const card = page.getByRole("dialog", { name: /TRAINER CARD/i });

  // The first two times, it just shows the trainer card.
  for (let visit = 1; visit <= 2; visit++) {
    await tapTile(page, tv, house);
    await expect.poll(() => said(page), { timeout: 8000 }).toContain("TRAINER CARD is on TV");
    await readThrough(page);
    await expect(card).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(card).toBeHidden();
  }

  // The third time, ROTOM hops out of the static, then goes back in.
  await tapTile(page, tv, house);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("static");
  await readThrough(page);
  await expect(page.locator('.cameo[data-cameo="rotom"]')).toBeVisible();
  await expect.poll(() => said(page), { timeout: 10_000 }).toContain("hopped out of the TV");
  await readThrough(page);
  await expect(card).toBeHidden();

  // And after that it's back to the trainer card.
  await tapTile(page, tv, house);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("TRAINER CARD is on TV");
  await readThrough(page);
  await expect(card).toBeVisible();
});

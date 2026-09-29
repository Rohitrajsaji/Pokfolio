import { expect, test, type Page } from "@playwright/test";
import { makeBoard, seeded, type Board } from "../src/game/voltorb/board";
import { closeDialogs, enterArcade, openVoltorbFlip, said, startGame, tapTile } from "./helpers";

/** Flips every card worth 2 or 3 on a board: that clears the level. */
async function clearLevel(page: Page, board: Board) {
  const cards = page.locator(".vf-card");
  for (let i = 0; i < board.cards.length; i++) {
    if (board.cards[i] >= 2) await cards.nth(i).click();
  }
}

/** How many pixels of the town canvas are exactly this colour. */
async function pixelsOf(page: Page, [r, g, b]: [number, number, number]): Promise<number> {
  return page.locator(".game-canvas").evaluate(
    (canvas: HTMLCanvasElement, want) => {
      const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === want[0] && data[i + 1] === want[1] && data[i + 2] === want[2]) n++;
      }
      return n;
    },
    [r, g, b],
  );
}

test("plays VOLTORB FLIP in the hidden Game Corner, wins the prizes and wears them", async ({
  page,
}) => {
  test.setTimeout(150_000);
  // `?vf=7` deals the same boards every time; here they are, in the order they're dealt.
  const rng = seeded(7);
  const [first, again, second, third] = [
    makeBoard(1, rng),
    makeBoard(1, rng),
    makeBoard(2, rng),
    makeBoard(3, rng),
  ];

  await page.goto("/?time=day&vf=7");
  await page.getByRole("menuitem", { name: "PRESS START" }).waitFor();
  await page.keyboard.press("Enter");
  await page.locator(".intro-scene").waitFor();
  await page.keyboard.press("Escape");
  await page.locator(".intro-scene").waitFor({ state: "hidden" });
  await page.waitForTimeout(1600);
  await closeDialogs(page);

  await enterArcade(page);
  await openVoltorbFlip(page);

  // The first time, it explains itself.
  await expect(page.getByText("Flip cards to win coins")).toBeVisible();
  await page.getByRole("button", { name: "GOT IT" }).click();

  // A Voltorb loses the round, and TRY AGAIN deals a fresh board.
  await page.locator(".vf-card").nth(first.cards.indexOf(0)).click();
  await expect(page.getByRole("status")).toContainText("BOOM");
  await page.getByRole("button", { name: "TRY AGAIN" }).click();

  // Then win all three levels.
  await clearLevel(page, again);
  await expect(page.getByRole("status")).toContainText("GAME CLEAR");
  await page.getByRole("button", { name: "NEXT LEVEL" }).click();
  await clearLevel(page, second);
  await page.getByRole("button", { name: "NEXT LEVEL" }).click();
  await clearLevel(page, third);
  await page.getByRole("button", { name: "FINISH" }).click();
  await expect(page.getByRole("status")).toContainText("champion");

  // The prizes: a green look, and the Game Boy's greens for the whole screen.
  await page.getByRole("button", { name: "DONE" }).click();
  await page.keyboard.press("m");
  await page.getByRole("menuitem", { name: "OPTIONS", exact: true }).click();
  await page.getByRole("button", { name: "PRIZES" }).click();
  await page.getByRole("button", { name: /LEAF/ }).click();
  await page.getByRole("button", { name: /GAME BOY/ }).click();
  await expect(page.locator(".game")).toHaveAttribute("data-palette", "gameboy");
  await expect(page.locator(".game")).toHaveCSS("filter", /palette-gameboy/);

  // Out of the game, out of the Game Corner, and into the Lab: the visitor's cap is now green.
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
  await tapTile(page, { x: 5, y: 8 }, { width: 12, height: 9 });
  await page.waitForTimeout(2500);
  await closeDialogs(page);
  expect(await pixelsOf(page, [0x3a, 0xa0, 0x5a])).toBeGreaterThan(0);
});

test("without playing, the prizes stay locked", async ({ page }) => {
  await startGame(page);
  await enterArcade(page);
  const clerk = { x: 9, y: 4 };
  await tapTile(page, clerk, { width: 12, height: 9 });
  // Wait for the walk to the counter to finish (a button press now would stop it).
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("GAME CORNER");
  for (
    let i = 0;
    i < 16 && !(await page.getByRole("dialog", { name: "PRIZES" }).isVisible());
    i++
  ) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole("dialog", { name: "PRIZES" })).toBeVisible();
  await expect(page.getByRole("button", { name: /SPARKY/ })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.locator(".game")).not.toHaveAttribute("data-palette", /.+/);
});

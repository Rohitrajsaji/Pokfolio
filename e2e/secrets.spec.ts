import { expect, test } from "@playwright/test";
import { rooms, secretRooms } from "../content/world";
import { closeDialogs, said, startGame, tapTile, travelTo } from "./helpers";

const lab = rooms.lab;
const arcade = secretRooms.arcade;
const poster = { x: lab.stairs!.x, y: 1 };
const clerk = arcade.npcs.find((npc) => npc.id === "clerk")!;

test("the crooked poster in the Lab hides a staircase down to the Game Corner", async ({
  page,
}) => {
  await startGame(page);
  await travelTo(page, /LAB/);

  // Tap the poster: the visitor walks up to it and reads it, and that finds the switch.
  await tapTile(page, poster, lab);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("AGENTS AT WORK");
  await closeDialogs(page);

  // The wall has opened. Tapping the same spot now walks up the stairs, and the fade brings the Game Corner.
  await tapTile(page, poster, lab);
  await page.waitForTimeout(2500);
  await closeDialogs(page);

  // The clerk is behind the counter.
  await tapTile(page, clerk, arcade);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("GAME CORNER");
});

test("the lab aide, on the way in, mentions the crooked poster", async ({ page }) => {
  await startGame(page);
  await travelTo(page, /LAB/);
  const aide = lab.npcs.find((npc) => npc.id === "aide")!;
  await tapTile(page, aide, lab);
  // Two lines about the machines, then the aside about the poster.
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("Each machine");
  for (let i = 0; i < 8 && !((await said(page)) ?? "").includes("crooked poster"); i++) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(350);
  }
  expect(await said(page)).toContain("crooked poster");
});

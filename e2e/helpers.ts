import { expect, type Page } from "@playwright/test";

/** Window shapes the layout has to survive. `touch` gives the phone and tablet pad. */
export interface Shape {
  name: string;
  width: number;
  height: number;
  dpr: number;
  touch?: boolean;
}

export const DESKTOPS: Shape[] = [
  { name: "720p", width: 1280, height: 720, dpr: 2 },
  { name: "MacBook 13", width: 1440, height: 789, dpr: 2 },
  { name: "MacBook 14", width: 1512, height: 860, dpr: 2 },
  { name: "1366 laptop", width: 1366, height: 657, dpr: 1 },
  { name: "125% laptop", width: 1536, height: 730, dpr: 1.25 },
  { name: "full HD", width: 1920, height: 947, dpr: 1 },
  { name: "QHD", width: 2560, height: 1300, dpr: 1 },
  { name: "ultra-wide", width: 3440, height: 1400, dpr: 1 },
  { name: "small window", width: 800, height: 600, dpr: 1 },
];

export const PHONES: Shape[] = [
  { name: "320 phone", width: 320, height: 568, dpr: 2, touch: true },
  { name: "Galaxy S8", width: 360, height: 740, dpr: 3, touch: true },
  { name: "iPhone SE", width: 375, height: 667, dpr: 2, touch: true },
  { name: "iPhone 14", width: 390, height: 844, dpr: 3, touch: true },
  { name: "iPhone 15 Pro", width: 393, height: 852, dpr: 3, touch: true },
  { name: "Pixel 7", width: 412, height: 915, dpr: 2.6, touch: true },
  { name: "iPhone Pro Max", width: 430, height: 932, dpr: 3, touch: true },
  { name: "landscape 568", width: 568, height: 320, dpr: 2, touch: true },
  { name: "iPhone SE landscape", width: 667, height: 375, dpr: 2, touch: true },
  { name: "iPhone 14 landscape", width: 844, height: 390, dpr: 3, touch: true },
  { name: "Pixel 7 landscape", width: 915, height: 412, dpr: 2.6, touch: true },
];

export const TABLETS: Shape[] = [
  { name: "iPad mini", width: 744, height: 1133, dpr: 2, touch: true },
  { name: "iPad", width: 810, height: 1080, dpr: 2, touch: true },
  { name: "iPad Air", width: 820, height: 1180, dpr: 2, touch: true },
  { name: "iPad landscape", width: 1080, height: 810, dpr: 2, touch: true },
  { name: "iPad Pro 11 landscape", width: 1194, height: 834, dpr: 2, touch: true },
  { name: "iPad Pro 12.9", width: 1024, height: 1366, dpr: 2, touch: true },
];

export const ALL_SHAPES: Shape[] = [...DESKTOPS, ...PHONES, ...TABLETS];

/** Context options for a shape (a touch shape gets the coarse pointer that shows the pad). */
export function contextFor(shape: Shape) {
  return {
    viewport: { width: shape.width, height: shape.height },
    deviceScaleFactor: shape.dpr,
    hasTouch: !!shape.touch,
    isMobile: !!shape.touch,
  };
}

/** Closes any dialog that's open, however many pages it has. */
export async function closeDialogs(page: Page): Promise<void> {
  for (let i = 0; i < 16; i++) {
    const open = await page
      .getByRole("group", { name: "Dialog" })
      .isVisible()
      .catch(() => false);
    if (!open) return;
    await page.keyboard.press("Enter");
    await page.waitForTimeout(220);
  }
}

/** Opens the title screen and waits until the game is listening (PRESS START has the cursor once it has started up). */
export async function openTitle(page: Page, query = "?time=day"): Promise<void> {
  await page.goto(`/${query}`);
  await expect(page.getByRole("menuitem", { name: "PRESS START" })).toBeFocused();
}

/** From the title to the town, with the welcome dialog dismissed. */
export async function startGame(page: Page): Promise<void> {
  await openTitle(page);
  await page.keyboard.press("Enter");
  await page.locator(".intro-scene").waitFor();
  await page.keyboard.press("Escape");
  await page.locator(".intro-scene").waitFor({ state: "hidden" });
  await page.waitForTimeout(1600);
  await closeDialogs(page);
}

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Bounding boxes of everything a selector matches (empty when none is visible). */
export async function boxes(page: Page, selector: string): Promise<Box[]> {
  return page.$$eval(selector, (elements) =>
    elements
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom })),
  );
}

export const overlaps = (a: Box, b: Box, gap = 0): boolean =>
  a.left < b.right + gap &&
  b.left < a.right + gap &&
  a.top < b.bottom + gap &&
  b.top < a.bottom + gap;

export const inside = (inner: Box, outer: Box, slack = 0.5): boolean =>
  inner.left >= outer.left - slack &&
  inner.top >= outer.top - slack &&
  inner.right <= outer.right + slack &&
  inner.bottom <= outer.bottom + slack;

/** Holds a key down for a while, like a thumb on the D-pad. */
export async function hold(page: Page, key: string, ms: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(80);
}

/** Opens the START menu and takes the TOWN MAP straight to a place, then dismisses anything said on arrival. */
export async function travelTo(page: Page, place: RegExp): Promise<void> {
  await page.keyboard.press("m");
  await page.getByRole("menuitem", { name: /TOWN MAP/ }).click();
  // The list of places is paged: turn pages until the one wanted is there.
  const wanted = page.getByRole("button", { name: place }).first();
  for (let i = 0; i < 5 && !(await wanted.isVisible().catch(() => false)); i++) {
    await page.locator(".paged-bar").getByRole("button", { name: "NEXT", exact: true }).click();
  }
  await wanted.click();
  await page.waitForTimeout(1600);
  await closeDialogs(page);
}

/** Reads what the dialog box says, or null when there isn't one. */
export async function said(page: Page): Promise<string | null> {
  const box = page.getByRole("group", { name: "Dialog" });
  if (!(await box.isVisible().catch(() => false))) return null;
  return (await box.locator(".sr-only").textContent()) ?? null;
}

/**
 * Taps a tile of the room the visitor is in, the way a finger would: they walk there, or up to it and use it.
 * Only for rooms that are smaller than the screen, which sit in the middle of it.
 */
export async function tapTile(
  page: Page,
  tile: { x: number; y: number },
  room: { width: number; height: number },
): Promise<void> {
  const canvas = page.locator(".game-canvas");
  const box = (await canvas.boundingBox())!;
  const view = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height }));
  const left = Math.floor((view.w - room.width * 16) / 2);
  const top = Math.floor((view.h - room.height * 16) / 2);
  const gameX = left + tile.x * 16 + 8;
  const gameY = top + tile.y * 16 + 8;
  await page.mouse.click(
    box.x + (gameX * box.width) / view.w,
    box.y + (gameY * box.height) / view.h,
  );
}

/**
 * From the town to the Game Corner: the Lab's crooked poster is read (which opens the staircase) and the
 * stairs are climbed. Relies on the lab and Game Corner being smaller than the screen (see `tapTile`).
 */
export async function enterArcade(page: Page): Promise<void> {
  await travelTo(page, /LAB/);
  const lab = { width: 12, height: 9 };
  await tapTile(page, { x: 6, y: 1 }, lab);
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("AGENTS AT WORK");
  await closeDialogs(page);
  await tapTile(page, { x: 6, y: 1 }, lab);
  await page.waitForTimeout(2500);
  await closeDialogs(page);
}

/** Opens the first VOLTORB FLIP cabinet in the Game Corner and answers YES to playing. */
export async function openVoltorbFlip(page: Page): Promise<void> {
  await tapTile(page, { x: 4, y: 2 }, { width: 12, height: 9 });
  await expect.poll(() => said(page), { timeout: 8000 }).toContain("VOLTORB FLIP");
  for (
    let i = 0;
    i < 6 && !(await page.getByRole("dialog", { name: "VOLTORB FLIP" }).isVisible());
    i++
  ) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole("dialog", { name: "VOLTORB FLIP" })).toBeVisible();
}

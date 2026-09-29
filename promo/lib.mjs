import { createRequire } from "module";
const require = createRequire(import.meta.url);
export const { chromium } = require("playwright-core");
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const BASE = process.env.E2E_URL ?? "http://localhost:3100";
export const CLIPS = path.join(HERE, "clips");
fs.mkdirSync(CLIPS, { recursive: true });

export const wait = (page, ms) => page.waitForTimeout(ms);

export async function launch() {
  return chromium.launch({ channel: "chrome" });
}

/** A fresh 1280x720 page, recorded when `name` is given. */
export async function scene(browser, name) {
  const dir = path.join(CLIPS, `_${name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ...(name ? { recordVideo: { dir, size: { width: 1280, height: 720 } } } : {}),
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("pageerror", e));
  return {
    page,
    async finish() {
      const video = page.video();
      await context.close();
      if (video && name) {
        const src = await video.path();
        fs.copyFileSync(src, path.join(CLIPS, `${name}.webm`));
        console.log("saved", name);
      }
    },
  };
}

export async function openTitle(page, query = "?time=day") {
  await page.goto(`${BASE}/${query}`);
  await page.getByRole("menuitem", { name: "PRESS START" }).waitFor();
  await page.waitForTimeout(700);
}

export async function closeDialogs(page) {
  for (let i = 0; i < 16; i++) {
    const open = await page.getByRole("group", { name: "Dialog" }).isVisible().catch(() => false);
    if (!open) return;
    await page.keyboard.press("Enter");
    await page.waitForTimeout(220);
  }
}

export async function startGame(page) {
  await openTitle(page);
  await page.keyboard.press("Enter");
  await page.locator(".intro-scene").waitFor();
  await page.keyboard.press("Escape");
  await page.locator(".intro-scene").waitFor({ state: "hidden" });
  await page.waitForTimeout(1600);
  await closeDialogs(page);
}

export async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
  await page.waitForTimeout(80);
}

export async function travelTo(page, place) {
  await page.keyboard.press("m");
  await page.getByRole("menuitem", { name: /TOWN MAP/ }).click();
  const wanted = page.getByRole("button", { name: place }).first();
  for (let i = 0; i < 5 && !(await wanted.isVisible().catch(() => false)); i++) {
    await page.locator(".paged-bar").getByRole("button", { name: "NEXT", exact: true }).click();
  }
  await wanted.click();
  await page.waitForTimeout(1600);
  await closeDialogs(page);
}

/** A caption bar in the game's own pixel font, sitting above the game like a title card. */
export async function caption(page, text, bottom = 84) {
  await page.evaluate(([t, b]) => {
    let bar = document.getElementById("promo-caption");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "promo-caption";
      bar.style.cssText =
        "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;pointer-events:none;" +
        "background:#101820;color:#fff;border:4px solid #fff;outline:4px solid #101820;padding:12px 24px;" +
        "font:600 30px var(--font-pixelify),monospace;letter-spacing:1px;white-space:nowrap;";
      document.body.appendChild(bar);
    }
    bar.style.bottom = `${b}px`;
    bar.textContent = t;
    bar.style.display = t ? "block" : "none";
  }, [text, bottom]);
}

export async function shot(page, name) {
  await page.screenshot({ path: path.join(HERE, "probe", `${name}.png`) });
}
fs.mkdirSync(path.join(HERE, "probe"), { recursive: true });

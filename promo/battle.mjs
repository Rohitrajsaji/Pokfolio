import { wait, hold } from "./lib.mjs";
/** Walks the tall grass until the wild ROHIT turns up. */
export async function findBattle(page) {
  const battle = page.locator(".battle");
  for (let round = 0; round < 12 && !(await battle.isVisible()); round++) {
    for (const key of ["ArrowDown","ArrowLeft","ArrowRight","ArrowRight","ArrowLeft","ArrowUp"]) {
      await hold(page, key, 420);
      await wait(page, 60);
      if (await battle.isVisible()) return;
    }
  }
}
export const line = (page) => page.evaluate(() => document.querySelector(".battle [aria-live]")?.textContent ?? null);

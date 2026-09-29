import { expect, test, type Page } from "@playwright/test";
import {
  DESKTOPS,
  PHONES,
  contextFor,
  startGame,
  travelTo,
  tapTile,
  said,
  type Shape,
} from "./helpers";

/** Includes windows short for their width, like a laptop's browser with its address and bookmark bars. */
const SHORT_BROWSER: Shape = { name: "short browser", width: 1440, height: 560, dpr: 2 };
const SHAPES: Shape[] = [
  DESKTOPS[0],
  DESKTOPS[1],
  DESKTOPS[3],
  DESKTOPS[8],
  SHORT_BROWSER,
  PHONES[3],
  PHONES[0],
  PHONES[7],
];

/**
 * What's wrong with the open screen, as a list: text that overlaps other text, text cut off by
 * its container, an entry name on more than one line, or anything that scrolls.
 */
async function problems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const frame = document.querySelector(".screen-frame");
    if (!frame) return ["no screen open"];
    const found: string[] = [];
    const visible = (el: Element) => {
      if (el.closest("[data-measure]")) return false;
      const style = getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none";
    };

    // Every run of text, with where it is.
    const runs: Array<{ el: Element; text: string; rect: DOMRect }> = [];
    const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? "";
      const el = node.parentElement;
      if (!text || !el || !visible(el) || el.closest(".sr-only")) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const full = range.getBoundingClientRect();
      // A text box is taller than the letters in it: only the middle of it counts, so lines
      // set close together aren't taken for overlapping.
      const rect = new DOMRect(full.x, full.y + full.height * 0.2, full.width, full.height * 0.6);
      if (rect.width > 0 && rect.height > 0) runs.push({ el, text, rect });
    }

    // Text on top of other text.
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length; j++) {
        const a = runs[i];
        const b = runs[j];
        if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const across = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
        const down = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
        if (across > 2 && down > 2) found.push(`overlap: "${a.text}" and "${b.text}"`);
      }
    }

    // Text cut off by an ancestor that hides overflow.
    for (const { el, text, rect } of runs) {
      for (let up: Element | null = el; up && up !== frame; up = up.parentElement) {
        const { overflowX, overflowY } = getComputedStyle(up);
        if (overflowX === "visible" && overflowY === "visible") continue;
        const box = up.getBoundingClientRect();
        if (
          rect.left < box.left - 1 ||
          rect.right > box.right + 1 ||
          rect.top < box.top - 1 ||
          rect.bottom > box.bottom + 1
        ) {
          found.push(`clipped: "${text}"`);
          break;
        }
      }
    }

    // Names on one line.
    for (const name of frame.querySelectorAll(".entry-name")) {
      if (!visible(name)) continue;
      const style = getComputedStyle(name);
      const lines = name.getBoundingClientRect().height / Number.parseFloat(style.lineHeight);
      const small = name.hasAttribute("data-small");
      if (lines > 1.2 && !small) found.push(`name wraps: "${name.textContent}"`);
      if (lines > 2.2)
        found.push(`name wraps to ${Math.round(lines)} lines: "${name.textContent}"`);
    }

    // Nothing scrolls.
    for (const el of [frame, ...frame.querySelectorAll("*")]) {
      const { overflowY } = getComputedStyle(el);
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 1
      ) {
        found.push(`scrolls by ${el.scrollHeight - el.clientHeight}px`);
      }
    }
    return found;
  });
}

/** Audits the open screen on every page it has. */
async function auditPages(page: Page, label: string, into: string[]): Promise<void> {
  for (let turn = 0; turn < 12; turn++) {
    await page.waitForTimeout(150);
    for (const issue of await problems(page)) into.push(`${label}, page ${turn + 1}: ${issue}`);
    const next = page.locator(".paged-bar").getByRole("button", { name: "NEXT", exact: true });
    if (!(await next.isVisible().catch(() => false))) return;
    await next.click();
    // Back on the first page: every page has been seen.
    const count = await page.locator(".paged-count").textContent();
    if (count?.startsWith("1/")) return;
  }
}

async function openFromMenu(page: Page, name: string): Promise<void> {
  await page.keyboard.press("m");
  await page.getByRole("menuitem", { name, exact: true }).click();
  await expect(page.locator(".screen-frame")).toHaveCount(1);
  await page.waitForTimeout(350);
}

async function leave(page: Page): Promise<void> {
  for (let i = 0; i < 3 && (await page.locator(".screen-frame, .start-menu").count()) > 0; i++) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(180);
  }
}

/** The size of each entry's Pokémon picture. */
async function spriteSizes(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll(".screen-frame .entry-portrait .mon-sprite")]
      .filter((el) => !el.closest("[data-measure]"))
      .map((el) => {
        const { width, height } = el.getBoundingClientRect();
        return `${Math.round(width)}x${Math.round(height)}`;
      }),
  );
}

for (const shape of SHAPES) {
  test.describe(`${shape.name} ${shape.width}x${shape.height}`, () => {
    test.use(contextFor(shape));

    test("no text overlaps, is cut off, wraps a name or scrolls, on any screen or page", async ({
      page,
    }) => {
      test.setTimeout(240_000);
      const issues: string[] = [];
      await startGame(page);

      // The Pokédex and the career: every entry, with every Pokémon the same size.
      for (const [menu, list] of [
        ["POKéDEX", "Projects"],
        ["POKéMON", "Career"],
      ] as const) {
        await openFromMenu(page, menu);
        const items = page.getByRole("list", { name: list }).getByRole("button");
        const sizes = new Set<string>();
        for (let i = 0; i < (await items.count()); i++) {
          await items.nth(i).click();
          await page.waitForTimeout(250);
          for (const size of await spriteSizes(page)) sizes.add(size);
          await auditPages(page, `${menu} #${i + 1}`, issues);
        }
        if (sizes.size !== 1)
          issues.push(`${menu}: Pokémon come in sizes ${[...sizes].join(", ")}`);
        await leave(page);
      }

      // The bag and the mart: every pocket.
      await openFromMenu(page, "BAG");
      const pockets = page.getByRole("tab");
      for (let i = 0; i < (await pockets.count()); i++) {
        await pockets.nth(i).click();
        await auditPages(page, `BAG pocket ${i + 1}`, issues);
      }
      await leave(page);

      // The résumé: every tab.
      await openFromMenu(page, "RÉSUMÉ");
      const tabs = page.getByRole("tab");
      for (let i = 0; i < (await tabs.count()); i++) {
        await tabs.nth(i).click();
        await auditPages(page, `RÉSUMÉ tab ${i + 1}`, issues);
      }
      await leave(page);

      for (const name of ["ROHIT", "POKéGEAR", "OPTIONS"]) {
        await openFromMenu(page, name);
        await auditPages(page, name, issues);
        await leave(page);
      }

      // The career as an evolution: every stage.
      await travelTo(page, /GYM/);
      const gym = { width: 11, height: 10 };
      await tapTile(page, { x: 6, y: 6 }, gym);
      await expect.poll(() => said(page), { timeout: 8000 }).toContain("CAREER GYM");
      for (
        let i = 0;
        i < 8 && !(await page.getByRole("dialog", { name: "EVOLUTION" }).isVisible());
        i++
      ) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(400);
      }
      await expect(page.getByRole("dialog", { name: "EVOLUTION" })).toBeVisible();
      for (let stage = 0; stage < 6; stage++) {
        await auditPages(page, `EVOLUTION stage ${stage + 1}`, issues);
        const skip = page.getByRole("button", { name: /^(NEXT|SKIP)$/ });
        if (!(await skip.isVisible().catch(() => false))) break;
        await skip.click();
        await page.waitForTimeout(300);
        if (
          await page
            .getByRole("button", { name: "SKIP" })
            .isVisible()
            .catch(() => false)
        ) {
          await page.getByRole("button", { name: "SKIP" }).click();
          await page.waitForTimeout(300);
        }
      }

      expect([...new Set(issues)]).toEqual([]);
    });
  });
}

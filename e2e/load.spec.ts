import { expect, test } from "@playwright/test";
import { contextFor, DESKTOPS, PHONES, TABLETS } from "./helpers";

/** One shape from each family: a laptop, a phone, a tablet. */
const SHAPES = [DESKTOPS[1], DESKTOPS[5], PHONES[3], TABLETS[2]];

for (const shape of SHAPES) {
  test.describe(`${shape.name} ${shape.width}x${shape.height}`, () => {
    test.use(contextFor(shape));

    test("loads without a single layout shift, so nothing jumps as it arrives", async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "Only Chromium reports layout shifts.");
      await page.addInitScript(() => {
        const shifts: number[] = [];
        (window as unknown as { __shifts: number[] }).__shifts = shifts;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            shifts.push((entry as PerformanceEntry & { value: number }).value);
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/?time=day");
      await expect(page.getByRole("menuitem", { name: "PRESS START" })).toBeFocused();
      // Give the Pokémon pictures and the fonts time to land.
      await page.waitForTimeout(2500);
      const shifts = await page.evaluate(
        () => (window as unknown as { __shifts: number[] }).__shifts,
      );
      expect(shifts).toEqual([]);
    });
  });
}

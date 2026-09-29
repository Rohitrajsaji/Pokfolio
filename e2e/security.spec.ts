import { expect, test } from "@playwright/test";
import { startGame } from "./helpers";

test("every page is sent with the security headers, and says nothing about what runs it", async ({
  request,
}) => {
  for (const path of ["/", "/robots.txt", "/manifest.webmanifest"]) {
    const response = await request.get(path);
    const headers = response.headers();
    expect(response.status(), path).toBe(200);
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["x-frame-options"], path).toBe("DENY");
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"], path).toContain("camera=()");
    expect(headers["x-powered-by"], path).toBeUndefined();
    const csp = headers["content-security-policy"];
    expect(csp, path).toContain("default-src 'self'");
    expect(csp, path).toContain("frame-ancestors 'none'");
    expect(csp, path).toContain("object-src 'none'");
    // The page may load from itself and from PokeAPI's sprites on GitHub, and nowhere else.
    expect(csp, path).not.toMatch(/\*(?!\.)| http:/);
    const hosts = [...csp.matchAll(/https:\/\/[^\s;]+/g)].map((match) => match[0]);
    expect(new Set(hosts)).toEqual(new Set(["https://raw.githubusercontent.com"]));
  }
});

test("the development-only art preview is not on the live site", async ({ request }) => {
  const response = await request.get("/dev/sprites");
  expect(response.status()).toBe(404);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /dev/");
});

test("the game runs without the policy blocking anything it needs", async ({ page }) => {
  test.setTimeout(60_000);
  const violations: string[] = [];
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __csp: string[] }).__csp.push(
        `${event.violatedDirective} ${event.blockedURI}`,
      );
    });
  });
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) violations.push(message.text());
  });

  await startGame(page);
  // Screens with sprites, and a walk.
  await page.keyboard.press("m");
  await page.getByRole("menuitem", { name: "POKéDEX", exact: true }).click();
  await page.waitForTimeout(800);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(800);
  await page.keyboard.up("ArrowUp");

  const seen = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
  expect(seen).toEqual([]);
  expect(violations).toEqual([]);
});

import { defineConfig, devices } from "@playwright/test";

/** Real-browser smoke tests: `npm run e2e`. Chrome (installed here), plus Playwright's WebKit (Safari) and Firefox. */
export default defineConfig({
  testDir: "e2e",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  retries: 0,
  use: { baseURL: "http://localhost:3200" },
  projects: [
    { name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Opt-in (E2E_FIREFOX=1): Playwright's Firefox would not launch on the machine this was set up on.
    ...(process.env.E2E_FIREFOX
      ? [{ name: "firefox", use: { ...devices["Desktop Firefox"] } }]
      : []),
  ],
  webServer: {
    command: "npm run build && npx next start -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});

import { defineConfig } from "@playwright/test";

/** Real-browser smoke tests: `npm run e2e`. Uses the Chrome installed on this machine. */
export default defineConfig({
  testDir: "e2e",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  retries: 0,
  use: { baseURL: "http://localhost:3200", channel: "chrome" },
  webServer: {
    command: "npm run build && npx next start -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});

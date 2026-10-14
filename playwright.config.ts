import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run the built game (`dist/`) in a real browser, for what only
 * exists end to end: persisted state through to rendered UI (§6, #63).
 * Run `npm run build` first; `npm run test:e2e` does both.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // A registered sign-in address (cloud.ts LOCAL_REDIRECTS), so the game behaves as it does locally.
    baseURL: "http://localhost:8080",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "python3 -m http.server 8080 --directory dist",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
  },
});

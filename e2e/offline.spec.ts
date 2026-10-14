import { expect, test, type Page } from "@playwright/test";

// #64, franchise bible §6 Backends: "The game must remain fully playable with the
// network down, or the backend gone entirely." Each test cuts the backend off a
// different way and checks a real browser still reaches a game that plays.

const OWN_ORIGIN = "http://localhost:8080";

/** Signs the browser in, as a returning player with an unexpired token would be. */
async function signIn(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem("toddpocalypse-token", "e2e-token");
    localStorage.setItem("toddpocalypse-token-expiry", String(Date.now() + 3_600_000));
  });
}

/** Starts a new hero from the creation screen. */
async function createHero(page: Page, name: string): Promise<void> {
  await page.goto("/");
  await expect(page.locator("#creation-overlay")).toBeVisible();
  await page.fill("#char-name-input", name);
  await page.click("#start-btn");
  await expect(page.locator("#creation-overlay")).toBeHidden();
}

/** The game is playing: it shows this hero, and attacking kills things. */
async function expectPlaying(page: Page, name: string): Promise<void> {
  // Startup may wait out one cloud request timeout (REQUEST_TIMEOUT_MS) first.
  await expect(page.locator("body")).toContainText(name, { timeout: 15_000 });
  await expect(page.locator("#creation-overlay")).toBeHidden();
  const kills = async () => Number((await page.locator("#stat-kills").textContent())?.replace(/\D/g, "") || 0);
  const before = await kills();
  // A new hero has no gear and so no idle damage; clicking is how play starts.
  await expect.poll(async () => {
    await page.click("#attack-btn");
    return kills();
  }, { timeout: 20_000, intervals: [100] }).toBeGreaterThan(before);
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (err) => { throw err; });
});

test("a new player plays and keeps their game with every outside request blocked", async ({ page }) => {
  await page.route((url) => url.origin !== OWN_ORIGIN, (route) => route.abort("internetdisconnected"));
  await createHero(page, "Offline Olga");
  await expectPlaying(page, "Offline Olga");
  await page.reload();
  await expectPlaying(page, "Offline Olga");
});

test("a signed-in player keeps playing when every API call returns 500", async ({ page }) => {
  await createHero(page, "Erroring Erin");
  await page.route((url) => url.origin !== OWN_ORIGIN, (route) => route.fulfill({ status: 500, body: "" }));
  await signIn(page);
  await page.reload();
  await expectPlaying(page, "Erroring Erin");
});

test("a signed-in player keeps playing when the API never answers", async ({ page }) => {
  await createHero(page, "Hanging Hal");
  // Never fulfilled: a blackholed host. Startup waits on the cloud load, so this
  // is the case that would hang the game without a request timeout.
  await page.route((url) => url.origin !== OWN_ORIGIN, () => {});
  await signIn(page);
  await page.reload();
  await expectPlaying(page, "Hanging Hal");
});

test("an expired sign-in falls back to the local game without asking the server", async ({ page }) => {
  await createHero(page, "Expired Ezra");
  const outside: string[] = [];
  await page.route((url) => url.origin !== OWN_ORIGIN, (route) => { outside.push(route.request().url()); return route.abort(); });
  await page.evaluate(() => {
    localStorage.setItem("toddpocalypse-token", "e2e-token");
    localStorage.setItem("toddpocalypse-token-expiry", String(Date.now() - 1_000));
  });
  await page.reload();
  await expectPlaying(page, "Expired Ezra");
  expect(outside).toEqual([]);
});

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import indexHtml from "../public/index.html?raw";
import { wrapFocusIndex, CLOSE_CONTROL_SELECTOR } from "../src/ui/dialogs.js";
import { tabTitle } from "../src/ui/html.js";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const mainTs = readFileSync(path("../src/main.ts"), "utf8");
const PAGES_URL = "https://nerdytoddgerdy.github.io/toddpocalypse/";

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): [number, number] {
  const b = readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

/** Each `role="dialog"` element's opening tag and inner markup. */
function dialogs(): { id: string; tag: string; body: string }[] {
  const starts = [...indexHtml.matchAll(/<div id="([^"]+)"[^>]*role="dialog"[^>]*>/g)];
  return starts.map((m, i) => ({
    id: m[1],
    tag: m[0],
    body: indexHtml.slice(m.index!, starts[i + 1]?.index ?? indexHtml.length),
  }));
}

describe("dialogs: keyboard and focus", () => {
  it.each([
    [0, 3, false, 1],
    [2, 3, false, 0], // Tab off the last control wraps to the first
    [0, 3, true, 2],  // Shift+Tab off the first wraps to the last
    [-1, 3, false, 0], // focus outside the dialog: Tab enters at the start
    [-1, 3, true, 2],
    [0, 0, false, -1], // nothing focusable
  ])("wrapFocusIndex(%i, %i, back=%s) → %i", (i, n, back, want) => {
    expect(wrapFocusIndex(i, n, back)).toBe(want);
  });

  it("finds all 18 dialogs", () => {
    expect(dialogs()).toHaveLength(18);
  });

  // Escape works by clicking the dialog's own close control, so every dialog
  // needs one — unless it demands a decision, and says so.
  it("Escape targets the same controls the HTML uses", () => {
    expect(CLOSE_CONTROL_SELECTOR).toBe('[data-dialog-close], [aria-label="Close"], [id$="-close"], [id$="-cancel"]');
  });

  // Escape works by clicking the dialog's own close control, so every dialog
  // needs one — unless it demands a decision, and says so.
  const CLOSE = /<button[^>]*(data-dialog-close|aria-label="Close"|id="[^"]*-(close|cancel)")/;
  it.each(dialogs().map((d) => [d.id, d] as const))("%s can be dismissed with Escape, or opts out", (_id, d) => {
    expect(d.tag.includes("data-dialog-required") || CLOSE.test(d.body)).toBe(true);
  });

  it("the save-conflict choice can't be escaped — it needs a decision", () => {
    expect(dialogs().find((d) => d.id === "save-conflict-modal")!.tag).toContain("data-dialog-required");
  });

  it("Retire opens on Cancel, not on the irreversible button", () => {
    expect(indexHtml).toMatch(/<button id="retire-confirm-cancel"[^>]*data-autofocus/);
  });

  it("main.ts wires it up", () => {
    expect(mainTs).toMatch(/import \{[^}]*initDialogs[^}]*\} from "\.\/ui\/dialogs\.js"/);
    expect(mainTs).toMatch(/initDialogs\(\);/);
  });
});

describe("announcements", () => {
  it("toasts — feats, deaths, homecoming — are read aloud", () => {
    expect(indexHtml).toMatch(/<div id="achievement-toast-container" role="status" aria-live="polite"><\/div>/);
  });

  it("UI errors are announced immediately", () => {
    expect(mainTs).toMatch(/<div class="log-line" role="alert"/);
  });
});

describe("web app manifest", () => {
  const file = path("../public/manifest.webmanifest");
  const manifest = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};

  it("is linked from the page", () => {
    expect(indexHtml).toContain('<link rel="manifest" href="manifest.webmanifest" />');
  });

  it("installs as a standalone app named for the game", () => {
    expect(manifest.name).toBe("GerdQuest: Idle Depths");
    expect(manifest.short_name).toBe("Idle Depths");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe(".");
    expect(manifest.background_color).toBe("#0a0807");
    expect(manifest.theme_color).toBe("#0a0807");
  });

  it.each([[192, "any"], [512, "any"], [512, "maskable"]])("has a %ipx %s icon that really is that size", (size, purpose) => {
    const icon = (manifest.icons ?? []).find((i: { sizes: string; purpose?: string }) =>
      i.sizes === `${size}x${size}` && (i.purpose ?? "any") === purpose);
    expect(icon).toBeDefined();
    expect(pngSize(path(`../public/${icon.src}`))).toEqual([size, size]);
  });

  it("tints the browser chrome to the table colour", () => {
    expect(indexHtml).toContain('<meta name="theme-color" content="#0a0807" />');
  });
});

describe("share metadata", () => {
  const meta = (attr: string, key: string) =>
    indexHtml.match(new RegExp(`<meta ${attr}="${key}" content="([^"]+)"`))?.[1];

  it("describes the game", () => {
    expect(meta("name", "description")?.length ?? 0).toBeGreaterThan(40);
  });

  it.each(["og:title", "og:description", "og:type", "og:url", "og:image"])("has %s", (key) => {
    expect(meta("property", key)).toBeDefined();
  });

  it("points at the live site with an absolute image URL", () => {
    expect(meta("property", "og:url")).toBe(PAGES_URL);
    expect(meta("property", "og:image")).toBe(`${PAGES_URL}social-card.png`);
  });

  it("ships a 1200×630 card", () => {
    expect(pngSize(path("../public/social-card.png"))).toEqual([1200, 630]);
  });

  it("asks for the large card on X/Twitter", () => {
    expect(meta("name", "twitter:card")).toBe("summary_large_image");
  });
});

describe("tab title", () => {
  it("leads with progress, so it reads from another tab", () => {
    expect(tabTitle(1234, 12)).toBe("1,234 gold · Floor 12 — GerdQuest: Idle Depths");
    expect(tabTitle(25_000, 3)).toBe("25k gold · Floor 3 — GerdQuest: Idle Depths");
  });

  it("main.ts keeps the title current", () => {
    expect(mainTs).toMatch(/document\.title = tabTitle\(/);
  });
});

describe("before the first fight", () => {
  it("says something plain instead of 'Loading…'", () => {
    expect(indexHtml).not.toContain("Loading…");
  });
});

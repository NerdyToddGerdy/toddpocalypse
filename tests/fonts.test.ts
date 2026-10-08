import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import indexHtml from "../public/index.html?raw";

// style.css is read from disk rather than imported: vitest stubs CSS modules to
// an empty string, and the `?raw` suffix does not survive that for .css files.
const styleCss = readFileSync(
  fileURLToPath(new URL("../public/style.css", import.meta.url)),
  "utf8",
);

/**
 * §3: "All self-hosted `woff2`, all OFL, **no CDN**", with a semantic split —
 * display for voice, body for fiction, mono for anything a player counts.
 * See #54 and docs/franchise-divergences.md.
 */

const FRANCHISE_FACES = ["Metamorphous", "Spectral", "JetBrains Mono"];

/** The Google-hosted faces this replaced. None may survive anywhere. */
const RETIRED_FACES = [
  "Cinzel Decorative",
  "Cinzel",
  "Crimson Pro",
  "Pirata One",
  "Philosopher",
];

describe("no CDN", () => {
  it("makes no request to Google Fonts from the page", () => {
    expect(indexHtml).not.toContain("fonts.googleapis.com");
    expect(indexHtml).not.toContain("fonts.gstatic.com");
  });

  it("preconnects to nothing — the page has no third-party hosts left", () => {
    expect(indexHtml).not.toContain("preconnect");
  });

  it("loads no stylesheet over http", () => {
    const sheets = [...indexHtml.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => m[0]);
    expect(sheets.length).toBeGreaterThan(0);
    for (const sheet of sheets) expect(sheet).not.toMatch(/href="https?:/);
  });
});

describe("@font-face declarations", () => {
  const faces = [...styleCss.matchAll(/@font-face\s*\{([^}]+)\}/g)].map((m) => m[1]);

  it("declares every franchise face", () => {
    for (const family of FRANCHISE_FACES) {
      expect(faces.some((f) => f.includes(`'${family}'`))).toBe(true);
    }
  });

  it("serves every face from a relative path, never a remote host", () => {
    expect(faces.length).toBeGreaterThan(0);
    for (const face of faces) {
      const src = face.match(/src: url\('([^']+)'\)/);
      expect(src).not.toBeNull();
      expect(src![1]).toMatch(/^fonts\/[\w-]+\.woff2$/);
    }
  });

  it("uses font-display: swap so text renders before the face arrives", () => {
    for (const face of faces) expect(face).toContain("font-display: swap");
  });
});

describe("the §3 semantic split", () => {
  it("defines all three role variables", () => {
    expect(styleCss).toMatch(/--font-display:/);
    expect(styleCss).toMatch(/--font-body:/);
    expect(styleCss).toMatch(/--font-mono:/);
  });

  it("points each role at its franchise face", () => {
    expect(styleCss).toMatch(/--font-display:\s*'Metamorphous'/);
    expect(styleCss).toMatch(/--font-body:\s*'Spectral'/);
    expect(styleCss).toMatch(/--font-mono:\s*'JetBrains Mono'/);
  });

  it("counts numbers in tabular figures so they don't jitter as they tick", () => {
    expect(styleCss).toContain("font-variant-numeric: tabular-nums");
  });
});

describe("retired faces", () => {
  it.each(RETIRED_FACES)("no longer references %s anywhere", (face) => {
    expect(styleCss).not.toContain(face);
    expect(indexHtml).not.toContain(face);
  });
});

/**
 * §2: one heading holds both halves, so its accessible name is the full phrase;
 * the series prefix is a <small> above the installment name. See #55.
 */
describe("two-tier wordmark", () => {
  const headings = [...indexHtml.matchAll(/<(h[12])\b[^>]*class="[^"]*\bwordmark\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)];

  it("marks both the header and the start screen", () => {
    expect(headings.map((m) => m[1]).sort()).toEqual(["h1", "h2"]);
  });

  it.each(headings.map((m) => [m[1], m[2]]))("%s carries <small>GerdQuest</small> then Idle Depths", (_tag, inner) => {
    expect(inner).toMatch(/<small>GerdQuest<\/small>\s+Idle Depths/);
    expect(inner).not.toContain("GerdQuest: Idle Depths");
  });

  it("leaves no flat colon-form heading behind", () => {
    expect(indexHtml).not.toMatch(/<h[12][^>]*>[^<]*(<img[^>]*>)?\s*GerdQuest: Idle Depths/);
  });
});

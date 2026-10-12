import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** Tablet sizes: 768–1023 portrait (phone layout) and 1024–1279 landscape (desktop layout). */
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const css = read("../public/style.css");
const mainTs = read("../src/main.ts");
const block = (marker: string, media: string) => {
  const esc = media.replace(/[()]/g, (c) => `\\${c}`);
  return css.match(new RegExp(`/\\* ── ${marker}[\\s\\S]*?@media ${esc}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
};

describe("tap for details on any touch screen", () => {
  // Was gated to <=768px, so 820px portrait and every landscape iPad got nothing.
  it("opens the detail card on touch screens of any width", () => {
    expect(mainTs).not.toContain('matchMedia("(max-width: 768px)")');
    expect(mainTs).toMatch(/if \(!window\.matchMedia\("\(hover: none\)"\)\.matches\) return;/);
  });

  it("styles the card for touch screens, not only narrow ones", () => {
    expect(css).toMatch(/@media \(max-width: 1023px\), \(hover: none\)\s*\{\s*\.mic-overlay/);
  });
});

describe("portrait tablets (600–1023px)", () => {
  const t = block("Portrait tablets", "(min-width: 600px) and (max-width: 1023px)");

  it("scales up for the bigger screen", () => {
    expect(t).toMatch(/html\s*\{\s*font-size:\s*125%/);
    expect(t).toMatch(/#monster-portrait-wrap\s*\{[^}]*width:\s*96px/);
    expect(t).toMatch(/\.hero-token :is\(img, \.party-token-icon\)\s*\{[^}]*width:\s*52px/);
    expect(t).toMatch(/#loot-items\s*\{[^}]*grid-template-columns:\s*repeat\(6,/);
  });

  it("shows the gear beside the stats on the Sheet", () => {
    expect(t).toMatch(/main\[data-hero-screen="sheet"\] #party-panel \.gear-pdoll-grid\s*\{[^}]*display:\s*grid/);
    expect(t).toMatch(/#party-cards > \.char-card\s*\{[^}]*grid-template-columns:\s*84px 1fr 120px minmax\(/);
  });
});

describe("landscape tablets (1024–1279px)", () => {
  const t = block("Landscape tablets", "(min-width: 1024px) and (max-width: 1279px)");

  it("shows one hero per row, with the gear beside the stats", () => {
    expect(t).toMatch(/#party-cards\s*\{[^}]*grid-template-columns:\s*1fr/);
    expect(t).toMatch(/#party-cards > \.char-card\s*\{[^}]*grid-template-columns:\s*84px 1fr 100px minmax\(/);
    expect(t).toMatch(/#party-cards > \.char-card \.gear-pdoll-grid\s*\{[^}]*grid-column:\s*4/);
  });

  it("keeps class, DPS and crit to one line each", () => {
    expect(t).toMatch(/#party-cards \.char-card :is\(\.char-class, \.char-dps, \.char-crit\)\s*\{\s*white-space:\s*nowrap/);
  });
});

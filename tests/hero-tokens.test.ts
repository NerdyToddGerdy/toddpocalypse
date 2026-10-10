import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import indexHtml from "../public/index.html?raw";
import { depthStripHTML, heroBarHTML, heroTokensHTML, emptyLootSquaresHTML, lootCardActionsHTML, lootSquareHTML, nextHeroIndex, resolveHeroView } from "../src/ui/html.js";

/**
 * Phone heroes: a row of hero tokens above the dock. The selected token fills
 * the space above with that hero's screens, with ‹ › to step between heroes.
 * A party token at the end opens Loot and Stars.
 */
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const css = read("../public/style.css");
const mainTs = read("../src/main.ts");

const party = [
  { name: "Aldric", character_class: "fighter", level: 29, health: 90, max_health: 100 },
  { name: "Vesper", character_class: "rogue", level: 29, health: 0, max_health: 80 },
  { name: "Lyric", character_class: "mage", level: 30, health: 40, max_health: 60 },
];

describe("heroTokensHTML", () => {
  const html = heroTokensHTML(party as never, 1);
  const tokens = [...html.matchAll(/<button[^>]*class="hero-token[^"]*"[^>]*>/g)].map((m) => m[0]);

  it("has one token per hero, then the party token", () => {
    expect(tokens).toHaveLength(4);
    expect(tokens[3]).toContain('data-hero="party"');
  });

  it("marks the selected one for sight and for screen readers", () => {
    expect(tokens[1]).toContain("selected");
    expect(tokens[1]).toContain('aria-pressed="true"');
    expect(tokens[0]).toContain('aria-pressed="false"');
  });

  it("names each token by hero", () => {
    expect(tokens[0]).toMatch(/aria-label="Aldric, fighter level 29"/);
    expect(tokens[3]).toMatch(/aria-label="Party: loot and stars"/);
  });

  it("shows a fallen hero as fallen", () => {
    expect(tokens[1]).toContain("fallen");
  });

  it("selects the party token with 'party'", () => {
    expect(heroTokensHTML(party as never, "party")).toMatch(/data-hero="party"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-hero="party"/);
  });
});

describe("nextHeroIndex", () => {
  it.each([
    [0, 1, 3, 1],
    [2, 1, 3, 0], // wraps forward
    [0, -1, 3, 2], // wraps back
    ["party", 1, 3, 0], // from the party token, › goes to the first hero
    ["party", -1, 3, 2], // and ‹ to the last
  ] as const)("from %s step %i of %i heroes → %i", (from, step, n, want) => {
    expect(nextHeroIndex(from, step, n)).toBe(want);
  });
});

describe("resolveHeroView", () => {
  const avail = { runes: true, artifacts: false, stars: false };
  it("keeps a valid view", () => {
    expect(resolveHeroView({ hero: 1, screen: "gear" }, 3, avail)).toEqual({ hero: 1, screen: "gear" });
  });
  it("falls back to the sheet when a screen isn't unlocked", () => {
    expect(resolveHeroView({ hero: 1, screen: "artifacts" }, 3, avail)).toEqual({ hero: 1, screen: "sheet" });
  });
  it("clamps a hero who left the party", () => {
    expect(resolveHeroView({ hero: 5, screen: "sheet" }, 3, avail)).toEqual({ hero: 0, screen: "sheet" });
  });
  it("gives the party token Loot, and Stars only once unlocked", () => {
    expect(resolveHeroView({ hero: "party", screen: "stars" }, 3, avail)).toEqual({ hero: "party", screen: "loot" });
    expect(resolveHeroView({ hero: "party", screen: "sheet" }, 3, avail)).toEqual({ hero: "party", screen: "loot" });
  });
});

describe("heroBarHTML", () => {
  const avail = { runes: true, artifacts: false, stars: true };

  it("names the hero between ‹ and ›, with real buttons", () => {
    const html = heroBarHTML(party as never, { hero: 0, screen: "sheet" }, avail);
    expect(html).toMatch(/data-action="hero-prev"[^>]*aria-label="Previous hero"/);
    expect(html).toMatch(/data-action="hero-next"[^>]*aria-label="Next hero"/);
    expect(html).toContain("Aldric");
  });

  it("lists only the unlocked screens, current one marked", () => {
    const html = heroBarHTML(party as never, { hero: 0, screen: "gear" }, avail);
    const screens = [...html.matchAll(/data-screen="([a-z]+)"/g)].map((m) => m[1]);
    expect(screens).toEqual(["sheet", "gear", "runes"]);
    expect(html).toMatch(/data-screen="gear"[^>]*aria-pressed="true"/);
  });

  it("gives the party token Loot and Stars, with no title row: the token already says Party", () => {
    const html = heroBarHTML(party as never, { hero: "party", screen: "loot" }, avail);
    const screens = [...html.matchAll(/data-screen="([a-z]+)"/g)].map((m) => m[1]);
    expect(screens).toEqual(["loot", "stars"]);
    expect(html).not.toContain("hero-bar-head");
    expect(html).not.toContain("Party");
  });

  it("hides the arrows with one hero", () => {
    expect(heroBarHTML(party.slice(0, 1) as never, { hero: 0, screen: "sheet" }, avail)).not.toContain("hero-next");
  });
});

describe("depthStripHTML", () => {
  const html = depthStripHTML(39, 44, 35);
  it("states the floor, the best and the checkpoint in words", () => {
    expect(html).toContain("Floor 39");
    expect(html).toContain("best 44");
    expect(html).toContain("⚑ 35");
  });
  it("draws the current floor and best as positions on one bar", () => {
    expect(html).toMatch(/class="depth-strip-fill" style="width:\d+(\.\d+)?%"/);
    expect(html).toMatch(/class="depth-strip-best" style="left:\d+(\.\d+)?%"/);
  });
  it("omits the checkpoint before there is one", () => {
    expect(depthStripHTML(3, 5, 1)).not.toContain("⚑");
  });
});

describe("wiring", () => {
  it("has the token row and hero bar in the page", () => {
    expect(indexHtml).toContain('<nav id="hero-tokens"');
    expect(indexHtml).toContain('<div id="hero-bar"');
    expect(indexHtml).toContain('<div id="depth-strip"');
  });

  it("marks the selected hero's card, rune block and artifact block", () => {
    expect(mainTs).toMatch(/function markSelectedHero\(/);
    expect(mainTs).toMatch(/#party-cards > \.char-card/);
  });

  it("remembers the view between visits", () => {
    expect(mainTs).toMatch(/localStorage\.setItem\("hero-view"/);
  });

  const phone = css.match(/\/\* ── Phone heroes[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("shows only the selected hero on phones", () => {
    expect(phone).toMatch(/#party-cards > \.char-card:not\(\.hero-selected\)[^{]*\{\s*display:\s*none/);
  });

  it("retires the stacked tab rows and the left depth gauge on phones", () => {
    expect(phone).toMatch(/#combat-subtabs[^{]*\{\s*display:\s*none\s*!important/);
    expect(phone).toMatch(/#left-col-subtabs/);
    expect(phone).toMatch(/#party-panel-header/);
    expect(phone).toMatch(/#depth-gauge[^{]*\{\s*display:\s*none/);
  });

  it("gives the depth gauge's width back", () => {
    expect(phone).toMatch(/main\s*\{[^}]*padding-left:\s*12px/);
  });

  it("pins the token row just above the dock", () => {
    expect(phone).toMatch(/#hero-tokens\s*\{[^}]*position:\s*fixed[^}]*bottom:\s*var\(--tabbar-h\)/);
  });
});

// Loot on phones: small squares, four across, like the Gear screen's slots.
describe("lootSquareHTML", () => {
  const item = { slot: "helmet", slot_display: "Helmet", name: "fine hood of warding", quality: "fine", sell_value: 40 };
  const html = lootSquareHTML(item as never, 3, "🪖", true);

  it("is a button styled like a gear slot, coloured by quality", () => {
    expect(html).toMatch(/^<button class="gear-pdoll-slot filled q-fine loot-sq"/);
  });

  it("opens the item card for that loot index", () => {
    expect(html).toContain('data-action="loot-card"');
    expect(html).toContain('data-idx="3"');
  });

  it("marks an upgrade, and says so to screen readers", () => {
    expect(html).toContain('class="loot-sq-up"');
    expect(html).toMatch(/aria-label="fine hood of warding, Helmet, an upgrade"/);
    expect(lootSquareHTML(item as never, 3, "🪖", false)).not.toContain("loot-sq-up");
  });

  it("gives set pieces the set border", () => {
    expect(lootSquareHTML({ ...item, set_name: "Warden" } as never, 0, "🪖", false)).toMatch(/class="[^"]*set-piece/);
  });
});

describe("lootCardActionsHTML", () => {
  it("offers Equip and Sell for that item, with the price", () => {
    const html = lootCardActionsHTML(3, 1500, { unlocked: false, full: false });
    expect(html).toMatch(/data-action="equip" data-idx="3"/);
    expect(html).toMatch(/data-action="sell" data-idx="3"[^>]*>Sell for 1,500g/);
    expect(html).not.toContain("stash-loot");
  });

  it("adds Stash once unlocked, disabled when full", () => {
    expect(lootCardActionsHTML(1, 10, { unlocked: true, full: false })).toMatch(/data-action="stash-loot" data-idx="1"(?![^>]*disabled)/);
    expect(lootCardActionsHTML(1, 10, { unlocked: true, full: true })).toMatch(/data-action="stash-loot"[^>]*disabled/);
  });
});

describe("loot squares wiring", () => {
  it("each loot row carries its square, and the card offers its actions", () => {
    expect(mainTs).toMatch(/\$\{lootSquareHTML\(item, i, /);
    expect(mainTs).toMatch(/action === "loot-card"/);
    expect(mainTs).toMatch(/lootCardActionsHTML\(/);
  });

  const phone = css.match(/\/\* ── Phone loot[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  it("lays loot out four across on phones, showing only the squares", () => {
    expect(phone).toMatch(/#loot-items\s*\{[^}]*grid-template-columns:\s*repeat\(4,/);
    expect(phone).toMatch(/\.loot-item > :not\(\.loot-sq\)\s*\{\s*display:\s*none/);
  });

  it("hides the square on wider screens", () => {
    expect(css).toMatch(/\.loot-sq\s*\{\s*display:\s*none;\s*\}/);
  });
});

describe("phone loot order", () => {
  const phone = css.match(/\/\* ── Phone loot[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  it("puts the items above the automation settings", () => {
    const order = (sel: string) => Number(phone.match(new RegExp(`${sel}\\s*\\{\\s*order:\\s*(\\d+)`))![1]);
    expect(order("#loot-items")).toBeLessThan(order("#auto-toggles-section"));
    expect(order("#loot-items")).toBeLessThan(order("#auto-seller-section"));
  });
});

// The grid always shows every slot, so it never grows or shrinks as loot comes and goes.
describe("emptyLootSquaresHTML", () => {
  it("draws one grey square per free slot", () => {
    const html = emptyLootSquaresHTML(3);
    expect(html.match(/class="loot-sq loot-sq-empty"/g)).toHaveLength(3);
  });

  it("draws nothing when the chest is full", () => {
    expect(emptyLootSquaresHTML(0)).toBe("");
  });

  it("is quiet for screen readers", () => {
    expect(emptyLootSquaresHTML(1)).toContain('aria-hidden="true"');
  });
});

describe("full-size loot grid wiring", () => {
  it("pads the grid to the chest's size", () => {
    expect(mainTs).toMatch(/emptyLootSquaresHTML\(state\.loot_max - (sortedLoot|loot)\.length\)/);
  });

  it("draws empty squares grey on phones", () => {
    expect(css).toMatch(/\.loot-sq-empty\s*\{[^}]*border:[^;]*dashed/);
  });
});

// The Upgrade tab picks heroes the same way the Combat tab does.
describe("hero tokens on the Upgrade tab", () => {
  const phone = css.match(/\/\* ── Phone heroes[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  const upg = css.match(/\/\* ── Phone upgrades[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

  it("shows the token row and hero bar on Upgrade as well as Combat", () => {
    expect(phone).toMatch(/body:is\(\[data-mobile-tab="combat"\], \[data-mobile-tab="upgrade"\]\) #hero-tokens/);
    expect(phone).toMatch(/body:is\(\[data-mobile-tab="combat"\], \[data-mobile-tab="upgrade"\]\) #hero-bar/);
  });

  it("shows only the selected hero's upgrade card", () => {
    expect(mainTs).toMatch(/"#upgrade-cards > \.upgrade-card"/);
    expect(upg).toMatch(/main:not\(\[data-hero="party"\]\) #upgrade-cards\s*\{\s*display:\s*block/);
    expect(upg).toMatch(/#upgrade-cards > \.upgrade-card:not\(\.hero-selected\)\s*\{\s*display:\s*none/);
  });

  it("the Party token shows the whole-party grid there", () => {
    expect(upg).toMatch(/main:not\(\[data-hero="party"\]\) #upgrade-grid\s*\{\s*display:\s*none/);
    expect(mainTs).toMatch(/dataset\.hero = String\(heroView\.hero\)/);
  });

  it("drops the Sheet/Gear chips there, which mean nothing on Upgrade", () => {
    expect(upg).toMatch(/body\[data-mobile-tab="upgrade"\] \.hero-screens\s*\{\s*display:\s*none/);
  });
});

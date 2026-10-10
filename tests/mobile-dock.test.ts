import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import indexHtml from "../public/index.html?raw";
import { skillButtonHTML } from "../src/ui/html.js";

/**
 * The mobile revamp: a dock of round tabs around a raised, round Attack
 * button whose rim is the enemy's HP; the enemy strip moves to the top.
 */
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const css = read("../public/style.css");
const mainTs = read("../src/main.ts");

const dock = indexHtml.slice(indexHtml.indexOf('<nav id="mobile-tabs"'), indexHtml.indexOf("</nav>", indexHtml.indexOf('<nav id="mobile-tabs"')));
/** The `@media (max-width: 1023px)` block that styles the dock. */
const dockCss = css.match(/\/\* ── Mobile dock[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

describe("dock markup", () => {
  it("has two tabs, the Attack slot, then two tabs", () => {
    const order = [...dock.matchAll(/data-tab="([a-z]+)"|id="dock-attack"/g)].map((m) => m[1] ?? "attack");
    expect(order).toEqual(["combat", "upgrade", "attack", "prestige", "guild"]);
  });

  it("calls the prestige tab Renown, as the sidebar does", () => {
    expect(dock).toMatch(/data-tab="prestige"[\s\S]*?<span class="tab-label">Renown<\/span>/);
  });

  it("starts Renown and Guild as locked rings, so the dock never changes shape", () => {
    for (const tab of ["prestige", "guild"]) {
      const tag = dock.match(new RegExp(`<button[^>]*data-tab="${tab}"[^>]*>`))![0];
      expect(tag).toContain("locked");
      expect(tag).toContain("disabled");
      expect(tag).not.toContain("hidden");
    }
  });

  it("moves Settings out of the dock to a header gear", () => {
    expect(dock).not.toContain("Settings");
    expect(indexHtml).toMatch(/<button id="header-settings-btn"[^>]*aria-label="Settings"/);
  });

  it("puts the party's HP in the enemy strip", () => {
    const enemyContent = indexHtml.slice(indexHtml.indexOf('<div id="enemy-content">'), indexHtml.indexOf('<div id="attack-row">'));
    expect(enemyContent).toContain('id="mobile-party-hp-bar"');
  });
});

describe("dock behaviour", () => {
  it("moves the real Attack and AUTO buttons into the dock on phones, and back", () => {
    expect(mainTs).toMatch(/function placeAttackControls\(/);
    expect(mainTs).toMatch(/\$\("dock-attack"\)\.append\(attackBtn, autoBtn\)/);
    expect(mainTs).toMatch(/\$\("attack-row"\)\.append\(attackBtn, autoBtn\)/);
  });

  it("drives the HP ring from the enemy's HP", () => {
    expect(mainTs).toMatch(/style\.setProperty\("--enemy-hp", String\(/);
    expect(dockCss).toMatch(/conic-gradient\([^;]*var\(--enemy-hp/);
  });

  it("unlocks Renown and Guild by enabling them, not by revealing them", () => {
    expect(mainTs).toMatch(/mobilePrestige\.disabled = !prestigeUnlocked/);
    expect(mainTs).toMatch(/mobileGuild\.disabled\s+= !guildUnlocked/);
  });

  it("the header gear opens Settings", () => {
    expect(mainTs).toMatch(/getElementById\("header-settings-btn"\)\?\.addEventListener\("click", openSettings\)/);
  });
});

describe("dock styles", () => {
  it("lays the dock out as tab, tab, Attack, tab, tab", () => {
    expect(dockCss).toMatch(/#mobile-tabs\s*\{[^}]*grid-template-columns:\s*1fr 1fr \S+ 1fr 1fr/);
  });

  it("raises a round Attack above the bar", () => {
    expect(dockCss).toMatch(/\.dock-attack\s*\{[^}]*border-radius:\s*50%/);
    expect(dockCss).toMatch(/\.dock-attack\s*\{[^}]*margin-top:\s*calc\(-1 \* var\(--dock-raise\)\)/);
    expect(dockCss).toMatch(/\.dock-attack #attack-btn\s*\{[^}]*border-radius:\s*50%/);
  });

  it("sits AUTO on the button's edge as a badge", () => {
    expect(dockCss).toMatch(/\.dock-attack #auto-attack-btn\s*\{[^}]*position:\s*absolute/);
  });

  it("pins the enemy strip to the top of the scrolling area", () => {
    expect(dockCss).toMatch(/#enemy-panel\s*\{[^}]*position:\s*sticky[^}]*top:\s*-12px/);
  });

  it("keeps the Party/Equipment tabs below the pinned enemy strip", () => {
    expect(dockCss).toMatch(/#combat-subtabs\s*\{[^}]*top:\s*calc\(var\(--enemy-panel-h/);
  });

  it("round tabs, with locked ones drawn as dashed rings", () => {
    expect(dockCss).toMatch(/\.mobile-tab-btn \.tab-icon\s*\{[^}]*border-radius:\s*50%/);
    expect(dockCss).toMatch(/\.mobile-tab-btn\.locked \.tab-icon\s*\{[^}]*border-style:\s*dashed/);
  });

  it("skills become round icon buttons in the enemy strip", () => {
    expect(dockCss).toMatch(/:is\(#skill-btn, \.companion-skill-btn\)\s*\{[^}]*border-radius:\s*50%/);
    expect(dockCss).toMatch(/\.skill-name\s*\{[^}]*display:\s*none/);
  });
});

describe("skillButtonHTML", () => {
  it("splits the icon from the name, so phones can show just the icon", () => {
    const html = skillButtonHTML("📯 Battle Cry");
    expect(html).toMatch(/^<span class="skill-icon">.+<\/span><span class="skill-name">Battle Cry<\/span>$/);
  });

  it("copes with a name that has no icon", () => {
    expect(skillButtonHTML("Volley")).toBe('<span class="skill-name">Volley</span>');
  });
});

describe("enemy strip height", () => {
  it("puts all skills on one line", () => {
    expect(dockCss).toMatch(/#enemy-content > #skill-row\s*\{\s*grid-column:\s*1;/);
    expect(dockCss).toMatch(/#enemy-content > #companion-skills\s*\{\s*grid-column:\s*2;/);
  });
});

describe("landscape dock", () => {
  // In landscape the 70px Attack overflowed a 54px bar and pushed the tabs off-screen.
  it("fits the Attack circle inside the bar", () => {
    // Every short-screen block, in file order; the dock sizes must come after the dock block.
    const m = [...css.matchAll(/@media \(max-width: 1023px\) and \(max-height: 500px\)\s*\{([\s\S]*?)\n\}/g)].map((x) => x[1]).join("\n");
    expect(css.lastIndexOf("and (max-height: 500px)")).toBeGreaterThan(css.indexOf("/* ── Mobile dock"));
    const bar = Number(m.match(/--tabbar-h:\s*(\d+)px/)![1]);
    const raise = Number(m.match(/--dock-raise:\s*(\d+)px/)![1]);
    const attack = Number(m.match(/\.dock-attack\s*\{[^}]*height:\s*(\d+)px/)![1]);
    expect(attack).toBeLessThanOrEqual(bar + raise);
    expect(m).toMatch(/#mobile-tabs\s*\{[^}]*align-items:\s*center/);
  });
});

describe("page structure", () => {
  // Moving the party HP bar once swallowed the footer and the stats dialog into
  // the enemy strip. They belong after <main>, at the top level of the page.
  it("keeps the footer and stats dialog out of <main>", () => {
    const mainHtml = indexHtml.slice(indexHtml.indexOf("<main"), indexHtml.indexOf("</main>"));
    expect(mainHtml).not.toContain("<footer>");
    expect(mainHtml).not.toContain('id="stats-modal"');
    expect(indexHtml.indexOf("<footer>")).toBeGreaterThan(indexHtml.indexOf("</main>"));
  });
});

describe("enemy strip sizing", () => {
  it("is sized by its content, never stretched to fill a short screen", () => {
    expect(dockCss).toMatch(/#enemy-panel\s*\{[^}]*flex:\s*none/);
  });
});

describe("locked tabs", () => {
  it.each(["prestige", "guild"])("the %s tab carries a lock badge", (tab) => {
    const tag = dock.slice(dock.indexOf(`data-tab="${tab}"`), dock.indexOf("</button>", dock.indexOf(`data-tab="${tab}"`)));
    expect(tag).toContain('<span class="tab-lock" aria-hidden="true">🔒</span>');
  });

  it("shows the lock only while locked", () => {
    expect(css).toMatch(/\.mobile-tab-btn:not\(\.locked\) \.tab-lock\s*\{\s*display:\s*none/);
  });

  it("tells screen readers it's locked", () => {
    expect(mainTs).toMatch(/aria-label", prestigeUnlocked \? "Renown" : "Renown, locked"/);
    expect(mainTs).toMatch(/aria-label", guildUnlocked \? "Guild" : "Guild, locked"/);
  });
});

// Return to Town and Venture live in the Renown tab on phones, not the header.
describe("run-end card", () => {
  const card = indexHtml.slice(indexHtml.indexOf('<div id="run-end-card"'), indexHtml.indexOf("</section>", indexHtml.indexOf('<div id="run-end-card"')));

  it("sits at the top of the Hall of Renown", () => {
    const panel = indexHtml.slice(indexHtml.indexOf('<section id="prestige-panel">'));
    expect(panel.indexOf('id="run-end-card"')).toBeGreaterThan(-1);
    expect(panel.indexOf('id="run-end-card"')).toBeLessThan(panel.indexOf('id="prestige-shop-items"'));
    expect(card).toContain('id="run-end-actions"');
    expect(card).toContain('id="run-end-lead"');
  });

  it("moves the real buttons and the next-renown line into it on phones, and back", () => {
    expect(mainTs).toMatch(/function placeRunControls\(/);
    expect(mainTs).toMatch(/\$\("run-end-actions"\)\.append\(actionBtns\)/);
    expect(mainTs).toMatch(/placeRunControls\(\);/);
  });

  it("is hidden on desktop, where the buttons stay in the header", () => {
    expect(css).toMatch(/#run-end-card\s*\{\s*display:\s*none;\s*\}/);
    const phone = css.match(/\/\* ── Phone run-end[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(phone).toMatch(/#run-end-card\s*\{[^}]*display:\s*block/);
  });

  it("dots the Renown tab whenever Return to Town or Venture is available", () => {
    expect(mainTs).toMatch(/badge\.hidden = !\(canBuyPrestige \|\| state\.prestige_available \|\| state\.venture_available\)/);
  });
});

// Phones: the header stats fit one row, as icons with the words kept for screen readers.
describe("one-row header stats", () => {
  const bar = indexHtml.slice(indexHtml.indexOf('<div id="stats-bar">'), indexHtml.indexOf('<div id="action-btns">'));
  const phone = css.match(/\/\* ── Phone stats row[\s\S]*?@media \(max-width: 1023px\)\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";

  it.each([
    ["stat-gold", "coin", "Gold"], ["stat-dungeon-num", "castle", "Dungeon"],
    ["stat-kills", "dagger", "Kills"], ["stat-deaths", "skull", "Deaths"],
  ])("%s has an icon and a word label", (id, icon, word) => {
    const cell = bar.slice(bar.lastIndexOf("<div", bar.indexOf(`id="${id}"`)), bar.indexOf("</div>", bar.indexOf(`id="${id}"`)));
    expect(cell).toContain(`spr-${icon} stat-icon`);
    expect(cell).toContain(`<span class="stat-label">${word}: </span>`);
  });

  it("keeps everything on one row on phones", () => {
    expect(phone).toMatch(/#stats-bar\s*\{[^}]*flex-wrap:\s*nowrap/);
  });

  it("hides the words visually but not from screen readers", () => {
    expect(phone).toMatch(/\.stat-label\s*\{[^}]*clip-path:\s*inset\(50%\)/);
    expect(phone).not.toMatch(/\.stat-label\s*\{[^}]*display:\s*none/);
  });

  it("drops Depth and Best, which the enemy strip's depth bar already shows", () => {
    // Must out-rank `#stats-bar > div { display: flex }` in the same block.
    expect(phone).toMatch(/#stats-bar > :is\(#stat-depth-wrap, #stat-best-wrap, #stat-party-hp-wrap\)/);
  });

  it("shows icons only on phones", () => {
    expect(css).toMatch(/\.stat-icon\s*\{\s*display:\s*none;\s*\}/);
  });

  it("formats party DPS like every other big number", () => {
    expect(mainTs).toMatch(/\$\("stat-party-dps"\)\.textContent = formatNumber\(totalDps\)/);
  });
});

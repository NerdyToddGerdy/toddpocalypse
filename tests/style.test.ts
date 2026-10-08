import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import indexHtml from "../public/index.html?raw";

// Read from disk, not `?raw` — see the note in fonts.test.ts.
const styleCss = readFileSync(
  fileURLToPath(new URL("../public/style.css", import.meta.url)),
  "utf8",
);

/** First top-level block for an exact selector, e.g. `#attack-btn`. */
function block(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = styleCss.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  expect(m, `no block for ${selector}`).not.toBeNull();
  return m![1];
}

function prop(body: string, name: string): string {
  const m = body.match(new RegExp(`(?:^|[;\\s])${name}\\s*:\\s*([^;]+);`));
  expect(m, `no ${name}`).not.toBeNull();
  return m![1].trim();
}

function luminance(hex: string): number {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every theme's token block, plus the unthemed `:root` fallback. */
const THEMES: [string, string][] = [
  [":root", block(":root")],
  ...[...styleCss.matchAll(/\n\[data-theme="([a-z-]+)"\]\s*\{([^}]*)\}/g)].map(
    (m): [string, string] => [m[1], m[2]],
  ),
];

describe("muted text legibility (#65)", () => {
  it("finds all eight themes", () => {
    expect(THEMES.length).toBe(9);
  });

  // --muted carries every label, cost and inactive tab. Torchlight's was ~2.2:1
  // until v2.38.0; five other themes were below 3.2:1 until #65.
  for (const [name, body] of THEMES) {
    describe(name, () => {
      for (const surface of ["--surface", "--surface2"]) {
        it(`clears WCAG AA against ${surface}`, () => {
          expect(contrast(prop(body, "--muted"), prop(body, surface))).toBeGreaterThanOrEqual(4.5);
        });
      }

      it("stays quieter than primary text", () => {
        expect(luminance(prop(body, "--muted"))).toBeLessThan(luminance(prop(body, "--text")));
      });
    });
  }
});

describe("reduced motion (#67)", () => {
  const m = styleCss.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);

  it("has a prefers-reduced-motion block", () => {
    expect(m).not.toBeNull();
  });

  it("stops every animation looping and collapses transitions", () => {
    const body = m![1];
    expect(body).toMatch(/\*,\s*\*::before,\s*\*::after/);
    expect(body).toMatch(/animation-iteration-count:\s*1\s*!important/);
    expect(body).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(body).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });
});

describe("theme leaks (#66)", () => {
  /** The stylesheet with every theme token block removed. */
  const outsideThemes = styleCss
    .replace(/\n:root\s*\{[^}]*\}/, "")
    .replace(/\n\[data-theme="[a-z-]+"\]\s*\{[^}]*\}/g, "");

  it.each([
    ["#92620e", "Torchlight brown on the Return to Town button"],
    ["#f87171", "fixed light-red highlight on HP bars"],
    ["#ef4444", "fixed red on the low-HP mini bar"],
    ["rgba(8, 6, 18", "blue-black tooltip background"],
  ])("no %s (%s)", (literal) => {
    expect(styleCss).not.toContain(literal);
  });

  // Purple is the artifact / greater-rune / elite signal — constant across
  // themes like the quality tiers, but declared once rather than scattered.
  it.each(["#7c3aed", "#8b5cf6", "#a78bfa", "139, ?92, ?246", "124, ?58, ?237"])(
    "the arcane purple %s is only declared as a token, never inlined",
    (literal) => {
      const uses = outsideThemes.match(new RegExp(literal, "gi")) ?? [];
      const fallbacks = outsideThemes.match(new RegExp(`var\\(--accent2, ${literal}\\)`, "gi")) ?? [];
      expect(uses.length - fallbacks.length).toBe(0);
    },
  );

  it("declares the arcane tokens", () => {
    const root = block(":root");
    expect(prop(root, "--arcane")).toBe("#8b5cf6");
    expect(prop(root, "--arcane-deep")).toBe("#7c3aed");
    expect(prop(root, "--arcane-soft")).toBe("#a78bfa");
  });
});

describe("disabled controls (#72)", () => {
  /** Every rule with a `:disabled` selector, one entry per selector. */
  const disabled = [...styleCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap((m) =>
    m[1]
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(",")
      .map((sel) => sel.trim())
      .filter((sel) => sel.includes(":disabled") && !sel.includes(":not(:disabled)"))
      .map((sel) => [sel, m[2]]),
  );

  it("finds the disabled rules", () => {
    expect(new Set(disabled.map(([sel]) => sel)).size).toBeGreaterThan(10);
  });

  // Fading a label to 30% drops it to ~1.5:1 — and the label is what tells the
  // player the unlock level or the price.
  it.each(disabled)("%s keeps its label legible", (_sel, body) => {
    const op = body.match(/opacity:\s*([\d.]+)/);
    if (op) expect(parseFloat(op[1])).toBeGreaterThanOrEqual(1);
    expect(body).not.toMatch(/background:\s*var\(--border\)/);
  });

  it("marks an unaffordable upgrade price as short of gold", () => {
    const rules = disabled.filter(([sel]) => sel === ".upgrade-btn:disabled").map(([, body]) => body);
    expect(rules.some((body) => /color:[^;]*var\(--danger\)/.test(body))).toBe(true);
  });
});

describe("primary actions", () => {
  // The purple-indigo gradient was off-palette in every theme; §3 reserves gold
  // and flame for anything interactive.
  for (const sel of ["#attack-btn", "#start-btn"]) {
    it(`${sel} draws its colour from the theme, not a hardcoded purple`, () => {
      const body = block(sel);
      expect(body).not.toMatch(/#7c3aed|#4f46e5|124,\s*58,\s*237/);
      expect(prop(body, "background")).toContain("var(--accent)");
    });
  }

  it("#start-btn speaks in the display face", () => {
    expect(prop(block("#start-btn"), "font-family")).toContain("var(--font-display)");
  });
});

describe("controls", () => {
  it("buttons and inputs inherit the page face instead of the system sans", () => {
    expect(styleCss).toMatch(/button,\s*input,\s*select,\s*textarea\s*\{\s*font-family:\s*inherit;/);
  });

  // §3: "Focus ring — always visible, never removed".
  it("draws the §3 focus ring on keyboard focus", () => {
    expect(prop(block(":focus-visible"), "outline")).toContain("var(--focus)");
    expect(styleCss).toMatch(/--focus:\s*#f2c265;/);
  });
});

/** Every declaration body for an exact selector, wherever it appears (grouped or in @media). */
function bodiesFor(selector: string): string[] {
  return [...styleCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, "").split(",").map((s) => s.trim()).includes(selector))
    .map((m) => m[2]);
}

describe("active states (#69)", () => {
  // Navigation switches the view: underline in --accent, label in --text, no fill.
  const NAV = [
    ".stab-btn.active", ".loot-stab.active", ".combat-stab.active", ".mobile-tab-btn.active",
    ".lcol-stab.active", ".ptab-btn.active", ".profile-tab-btn.active",
  ];
  // A choice picks a value: --accent outline over a faint --accent wash.
  const CHOICE = [
    ".class-btn.selected", ".feats-filter-btn.active", ".theme-btn.active",
    ".title-chip.active", ".profile-pick-btn.active",
  ];

  it.each(NAV)("%s is an accent underline with primary text", (sel) => {
    const all = bodiesFor(sel).join(";");
    expect(all, sel).not.toBe("");
    expect(all).not.toContain("--accent2");
    expect(all).toMatch(/color:\s*var\(--text\)/);
    expect(all).toMatch(/border-(bottom|top)-color:\s*var\(--accent\)/);
    expect(all).not.toMatch(/background(-color)?:\s*(?!none|transparent)/);
  });

  it.each(CHOICE)("%s is an accent outline with a faint wash", (sel) => {
    const all = bodiesFor(sel).join(";");
    expect(all, sel).not.toBe("");
    expect(all).not.toContain("--accent2");
    expect(all).toMatch(/border-color:\s*var\(--accent\)/);
    expect(all).toMatch(/background:\s*color-mix\(in srgb, var\(--accent\) \d+%, transparent\)/);
    expect(all).toMatch(/color:\s*var\(--text\)/);
  });
});

describe("enemy portrait column (#68)", () => {
  // The portrait is boss/elite only; for everything else the column must leave
  // the layout rather than sit there invisible.
  it("drops out of the layout when no boss or elite portrait is showing", () => {
    const body = bodiesFor("#monster-portrait-wrap:not(.boss-visible):not(.boss-exiting)").join(";");
    expect(body).toMatch(/display:\s*none/);
  });
});

describe("wordmark (#55)", () => {
  it("styles the series prefix small, uppercase and letter-spaced", () => {
    const body = bodiesFor(".wordmark small").join(";");
    expect(body).toMatch(/text-transform:\s*uppercase/);
    expect(body).toMatch(/letter-spacing:/);
    expect(body).toMatch(/font-size:\s*0?\.\d+em/);
  });
});

describe("panel chrome (#71)", () => {
  // One heading style for every panel title — Feats used to be a large display
  // heading beside small tracked ones.
  it("every panel title shares a single rule", () => {
    const panels = ["#party-panel", "#upgrades-panel", "#loot-panel", "#feats-panel", "#prestige-panel", "#guild-hall-panel", "#log-panel"];
    const shared = [...styleCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((m) =>
      panels.every((p) => m[1].replace(/\/\*[\s\S]*?\*\//g, "").split(",").map((s) => s.trim()).includes(`${p} h2`)),
    );
    expect(shared, "no rule covers all panel titles").toBeDefined();
    expect(shared![2]).toMatch(/text-transform:\s*uppercase/);
  });

  it("a group inside a panel is a heading and whitespace, not another box", () => {
    expect(prop(block(".upgrade-card"), "border")).toBe("none");
    expect(prop(block(".upgrade-card"), "background")).toBe("none");
  });

  it.each([".loot-item", ".feat-card", ".char-card"])("%s sits on a hairline, not a full gold rule", (sel) => {
    expect(prop(block(sel), "border")).toMatch(/color-mix\(in srgb, var\(--border\) \d+%, transparent\)/);
  });

  it("the sidebar carries the panel frame; its sections do not repeat it", () => {
    expect(bodiesFor("[data-theme] #sidebar > section").join(";")).toMatch(/outline:\s*none/);
    expect(bodiesFor("[data-theme] #sidebar").join(";")).toMatch(/outline:\s*1px solid var\(--border\)/);
  });

  // A tab bar with one tab in it is a label pretending to be navigation.
  it.each(["#loot-subtab-nav", "#party-panel-tabs"])("%s hides itself until it has two tabs", (sel) => {
    const rule = [...styleCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      (m) => m[1].includes(`${sel}:not(:has(`) && /display:\s*none/.test(m[2]),
    );
    expect(rule).toBeDefined();
  });
});

describe("desktop layout (#73)", () => {
  it("a lone hero spans the panel with the paperdoll beside the stats", () => {
    expect(bodiesFor(".char-card:only-child").join(";")).toMatch(/grid-column:\s*1 \/ -1/);
    expect(styleCss).toMatch(/\.char-card:only-child \.gear-pdoll-grid\s*\{[^}]*grid-column:\s*4/);
  });

  it("the sticky sidebar clears the sticky header", () => {
    const body = block("#sidebar");
    expect(prop(body, "top")).toContain("var(--header-h");
    expect(prop(body, "max-height")).toContain("var(--header-h");
  });

  it("gold reads left-aligned like every other stat", () => {
    expect(prop(block("#stat-gold"), "text-align")).toBe("left");
  });
});

const mainTs = readFileSync(fileURLToPath(new URL("../src/main.ts", import.meta.url)), "utf8");

describe("breakpoints (mobile/tablet audit)", () => {
  // The desktop grid fits from 1024px; at 1281px it locked every tablet and
  // 1280px laptop into the phone layout.
  it("desktop starts at 1024px, the phone layout ends at 1023px", () => {
    expect(styleCss).not.toMatch(/128[01]px/);
    expect(styleCss).toMatch(/@media \(min-width: 1024px\)/);
    expect(styleCss).toMatch(/@media \(max-width: 1023px\)/);
  });

  it("main.ts agrees with the stylesheet", () => {
    expect(mainTs).not.toMatch(/max-width: 1280px/);
    expect(mainTs).toMatch(/matchMedia\("\(max-width: 1023px\)"\)/);
  });
});

describe("bottom chrome", () => {
  it("is sized by two variables instead of hard-coded offsets", () => {
    expect(styleCss).not.toMatch(/calc\(96px/);
    expect(bodiesFor("#enemy-panel").join(";")).toMatch(/bottom:\s*calc\(var\(--tabbar-h\) \+ var\(--hpbar-h\)\)/);
    expect(bodiesFor("#mobile-party-hp-bar").join(";")).toMatch(/bottom:\s*var\(--tabbar-h\)/);
    expect(bodiesFor("#mobile-tabs").join(";")).toMatch(/height:\s*var\(--tabbar-h\)/);
  });
});

describe("landscape phones (#1)", () => {
  const m = styleCss.match(/@media \(max-width: 1023px\) and \(max-height: 500px\)\s*\{([\s\S]*?)\n\}/);

  it("has a short-screen block", () => {
    expect(m).not.toBeNull();
  });

  // Header + enemy panel + HP bar + tabs filled all 390px; nothing else could show.
  it("lets the header scroll away and shrinks the fixed chrome", () => {
    const body = m![1];
    expect(body).toMatch(/header\s*\{[^}]*position:\s*static/);
    expect(body).toMatch(/body\s*\{[^}]*overflow:\s*visible/);
    expect(body).toMatch(/--tabbar-h:\s*\d+px/);
    expect(body).toMatch(/--hpbar-h:\s*\d+px/);
    expect(body).toMatch(/#monster-portrait-wrap\s*\{[^}]*display:\s*none/);
  });
});

describe("phone header (#3)", () => {
  it("keeps the locked Return to Town / Venture buttons to one line", () => {
    const m = styleCss.match(/@media \(max-width: 600px\)\s*\{([\s\S]*?)\n\}/);
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/#action-btns button\s*\{[^}]*white-space:\s*nowrap/);
    expect(m![1]).toMatch(/text-overflow:\s*ellipsis/);
  });
});

describe("touch targets (#5)", () => {
  const m = styleCss.match(/@media \(pointer: coarse\)\s*\{([\s\S]*?)\n\}/);

  it("enlarges small controls on touch screens", () => {
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/#party-gear-toggle\s*\{[^}]*min-width:\s*40px[^}]*min-height:\s*40px/);
    expect(m![1]).toMatch(/#action-btns button\s*\{[^}]*min-height:\s*36px/);
  });
});

describe("tab bar (#6)", () => {
  // Prestige and Guild flashed in the bar during character creation, then vanished.
  it.each(["prestige", "guild"])("the %s tab starts hidden until unlocked", (tab) => {
    expect(indexHtml).toMatch(new RegExp(`<button class="mobile-tab-btn" data-tab="${tab}" hidden>`));
  });
});

describe("paperdoll width", () => {
  it("never spreads wider than a body's width of slots", () => {
    expect(bodiesFor(".gear-pdoll-grid").join(";")).toMatch(/max-width:\s*\d+px/);
  });
});

describe("narrow desktop, 1024–1279px", () => {
  const m = styleCss.match(/@media \(min-width: 1024px\) and \(max-width: 1279px\)\s*\{([\s\S]*?)\n\}/);

  // Moving the breakpoint down put a 1229px-wide header on 1024px screens.
  it("wraps the stats onto their own header row", () => {
    expect(m).not.toBeNull();
    expect(m![1]).toMatch(/header\s*\{[^}]*flex-wrap:\s*wrap/);
    expect(m![1]).toMatch(/#stats-bar\s*\{[^}]*width:\s*100%/);
  });

  it("only puts a lone hero's paperdoll beside the stats when there's room", () => {
    expect(styleCss).toMatch(/@media \(min-width: 1200px\)\s*\{\s*\.char-card:only-child \{/);
  });
});

describe("phone action labels (#3)", () => {
  // Ellipsis alone cut "Return to Town (need lv20)" to "Return to Town (…" —
  // dropping the unlock level, the one part worth reading.
  it("wraps the droppable verb so phones can omit it", () => {
    const labels = mainTs.match(/★ <span class="act-verb">Return to <\/span>Town/g) ?? [];
    expect(labels.length).toBe(2);
  });

  it("hides that verb on phones", () => {
    const m = styleCss.match(/@media \(max-width: 600px\)\s*\{([\s\S]*?)\n\}/);
    expect(m![1]).toMatch(/\.act-verb\s*\{\s*display:\s*none/);
  });
});

describe("equipment paperdoll", () => {
  // Three rows instead of five in every layout — the stacked mobile/tablet card
  // was ~140px taller than it needed to be.
  it("is 3×3 by default, not only for a lone hero on wide desktop", () => {
    const base = bodiesFor(".gear-pdoll-grid").join(";");
    expect(base).toMatch(/grid-template-areas:\s*"main_hand helmet off_hand"\s*"ring1\s+chest\s+ring2"\s*"gloves\s+legs\s+shoes"/);
  });

  it("is declared once", () => {
    expect(styleCss.match(/"main_hand helmet off_hand"/g)).toHaveLength(1);
  });
});

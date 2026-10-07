import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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
  const disabled = [...styleCss.matchAll(/([^{}]+)\{([^}]*)\}/g)].flatMap((m) =>
    m[1]
      .split(",")
      .map((sel) => sel.replace(/\/\*[\s\S]*?\*\//g, "").trim())
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

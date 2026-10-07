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

describe("torchlight legibility", () => {
  const torch = block('[data-theme="torchlight"]');

  // §3's --ink-soft is for text *on parchment*. As --muted on --bg-1 it was
  // ~2.2:1 — every label in the header and sidebar was near-invisible.
  it("muted text clears WCAG AA against the panel surface", () => {
    expect(contrast(prop(torch, "--muted"), prop(torch, "--surface"))).toBeGreaterThanOrEqual(4.5);
  });

  it("muted text stays quieter than primary text", () => {
    expect(luminance(prop(torch, "--muted"))).toBeLessThan(luminance(prop(torch, "--text")));
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

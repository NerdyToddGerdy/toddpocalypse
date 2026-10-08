import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import indexHtml from "../public/index.html?raw";

/**
 * §3 palette, #52. Source of truth: src/ui/theme/tokens.css. The values below
 * are the bible's table verbatim — change them in the bible first.
 */
const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const TOKENS_PATH = path("../src/ui/theme/tokens.css");
const tokensCss = existsSync(TOKENS_PATH) ? readFileSync(TOKENS_PATH, "utf8") : "";
const styleCss = readFileSync(path("../public/style.css"), "utf8");
const buildMjs = readFileSync(path("../scripts/build.mjs"), "utf8");
const sources = ["../src/main.ts", "../src/ui/html.ts"].map((p) => readFileSync(path(p), "utf8")).join("\n");

const BIBLE_S3: Record<string, string> = {
  "--bg-0": "#0a0807",
  "--bg-1": "#17110d",
  "--torch-core": "#ffc06a",
  "--torch-mid": "#d9791f",
  "--ember": "#b8481f",
  "--gold": "#b8862f",
  "--gold-bright": "#e0ac48",
  "--parchment": "#e9ddc2",
  "--parchment-2": "#ddcca2",
  "--parchment-3": "#cbb686",
  "--ink": "#2a2016",
  "--ink-soft": "#5a4b38",
  "--danger": "#a63c1d",
  "--focus": "#f2c265",
};

/** The pre-franchise names this replaced. None may be used or defined anywhere. */
const RETIRED = ["bg", "surface", "surface2", "card", "border", "accent", "accent2", "text", "muted", "hp-green", "xp-blue", "on-accent"];

const root = tokensCss.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";

describe("tokens.css", () => {
  it("exists at the path §3 names", () => {
    expect(existsSync(TOKENS_PATH)).toBe(true);
  });

  it.each(Object.entries(BIBLE_S3))("defines %s as %s", (name, value) => {
    expect(root).toMatch(new RegExp(`${name}:\\s*${value};`, "i"));
  });

  it("commits to dark — a GerdQuest game does not ship a light mode", () => {
    expect(root).toMatch(/color-scheme:\s*dark;/);
  });

  it("declares the gear-quality ladder as a documented local extension", () => {
    expect(tokensCss).toMatch(/Local extensions[\s\S]*--q-common:/);
  });
});

describe("loading", () => {
  it("is linked before style.css, so the stylesheet and themes build on it", () => {
    const tokens = indexHtml.indexOf('href="tokens.css"');
    const style = indexHtml.indexOf('href="style.css"');
    expect(tokens).toBeGreaterThan(-1);
    expect(tokens).toBeLessThan(style);
  });

  it("is copied into dist by the build", () => {
    expect(buildMjs).toContain("src/ui/theme/tokens.css");
  });
});

describe("retired names", () => {
  it.each(RETIRED)("--%s is gone from style.css, tokens.css and the TS templates", (name) => {
    const use = new RegExp(`var\\(--${name}[,)]`);
    const def = new RegExp(`(^|[\\s;{])--${name}:`, "m");
    for (const src of [styleCss, tokensCss, sources]) {
      expect(src).not.toMatch(use);
      expect(src).not.toMatch(def);
    }
  });

  it("style.css no longer carries its own default palette", () => {
    const styleRoot = styleCss.match(/\n:root\s*\{([^}]*)\}/)?.[1] ?? "";
    for (const name of Object.keys(BIBLE_S3)) expect(styleRoot).not.toContain(`${name}:`);
  });

  // torchlight *is* the §3 palette, so it is the default rather than an override.
  it("torchlight is the default, not a block that repeats it", () => {
    expect(styleCss).not.toMatch(/\[data-theme="torchlight"\]\s*\{/);
  });
});

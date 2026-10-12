import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Alert toasts (feats, defeat, homecoming) all share .achievement-toast in one
 * container. Clicking or tapping one dismisses it, on every screen size.
 */
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const css = read("../public/style.css");
const mainTs = read("../src/main.ts");
const rule = (sel: string) => {
  const esc = sel.replace(/[.#]/g, (c) => `\\${c}`);
  return [...css.matchAll(new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`, "g"))].map((m) => m[1]).join("\n");
};

describe("dismissing alert toasts", () => {
  it("each toast takes clicks and shows it can be clicked", () => {
    expect(rule(".achievement-toast")).toMatch(/pointer-events:\s*auto/);
    expect(rule(".achievement-toast")).toMatch(/cursor:\s*pointer/);
  });

  it("the container still lets clicks through to the game around the toasts", () => {
    expect(rule("#achievement-toast-container")).toMatch(/pointer-events:\s*none/);
  });

  it("no screen size turns clicks off again", () => {
    const off = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, sel, body]) => /\.achievement-toast\b/.test(sel) && /pointer-events:\s*none/.test(body));
    expect(off).toHaveLength(0);
  });

  it("a click on a toast removes it", () => {
    expect(mainTs).toMatch(/\$\("achievement-toast-container"\)\.addEventListener\("click", \(e\) => \{[\s\S]{0,160}closest\("\.achievement-toast"\)\?\.remove\(\)/);
    expect(mainTs).toMatch(/^\s*wireToastDismiss\(\);/m);
  });
});

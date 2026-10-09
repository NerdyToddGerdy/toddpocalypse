import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Bible §4 voice (#59): "Wry, plain, and honest about the odds. Never epic,
 * never cute." No exclamation marks, no ellipses, and the real odds where
 * they're known and cheap to state.
 */
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const engine = read("../src/engine.ts");
const main = read("../src/main.ts");

/** Removes `${...}` interpolations (innermost first), leaving only the words. */
function words(template: string): string {
  let s = template;
  for (let prev = ""; prev !== s; ) { prev = s; s = s.replace(/\$\{[^{}]*\}/g, ""); }
  return s;
}

/** Every line that writes to the log, as written in the source. */
const logLines = engine.split("\n").filter((l) => l.includes("this.addLog(") && !l.includes("private addLog"));

describe("log lines (§4)", () => {
  it("finds the log lines", () => {
    expect(logLines.length).toBeGreaterThan(50);
  });

  it.each(logLines.map((l) => [l.trim().slice(0, 70), l]))("no exclamation or ellipsis: %s", (_l, line) => {
    const text = words(line.slice(line.indexOf("addLog(")));
    expect(text).not.toMatch(/!|\.\.\.|…/);
  });

  it("the death message says what's kept, without softening or trailing off", () => {
    const death = engine.slice(engine.indexOf("onPlayerDeath(): void {"), engine.indexOf("this.addLog(msg);"));
    expect(words(death)).not.toMatch(/!|\.\.\./);
    expect(death).toMatch(/gear, gold and levels kept/);
  });
});

describe("the odds, where they cost nothing (§4)", () => {
  it.each([
    ["Lucky Strike", /LUCKY_STRIKE_CHANCE \* 100/],
    ["Eagle Eye", /EAGLE_EYE_CHANCE \* 100/],
    ["elites", /Elites always drop loot/],
    ["elite set pieces", /ELITE_SET_PIECE_CHANCE/],
    ["rune drops", /dropRandomLesserRune\("Boss", BOSS_RUNE_CHANCE\)/],
    ["boss artifacts", /BOSS_ARTIFACT_CHANCE/],
    ["floor scaling", /about 30% more HP/],
  ])("%s", (_what, pattern) => {
    expect(engine).toMatch(pattern);
  });
});

describe("toasts and town copy (§4)", () => {
  it("feat toasts state it plainly", () => {
    expect(main).toContain('"Feat unlocked"');
    expect(main).toContain('"Hidden feat revealed"');
    expect(main).not.toMatch(/"(Feat Unlocked|Mystery Feat Revealed)!"/);
  });

  it("homecoming lines are never epic", () => {
    const block = main.slice(main.indexOf("const HOMECOMING_LINES"), main.indexOf("];", main.indexOf("const HOMECOMING_LINES")));
    expect(block).not.toMatch(/!|bards|sing of|in your honor|hero has returned/i);
  });
});

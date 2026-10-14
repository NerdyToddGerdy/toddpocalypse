import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// #61, franchise bible §6: "game tables live as typed data in src/data/ … New
// content is a data edit, not a new code path." Data modules export data only;
// behaviour stays in the modules that read it.
const dataDir = new URL("../src/data/", import.meta.url);
const read = (url: URL) => readFileSync(fileURLToPath(url), "utf8");
const dataFiles = existsSync(dataDir) ? readdirSync(dataDir).filter((f) => f.endsWith(".ts")) : [];

/** Source with comments and string literals removed, so prose can't trip the checks. */
const code = (src: string) => src
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "")
  .replace(/"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');

describe("src/data holds the game's tables", () => {
  it.each(["classes", "gear", "enemies", "artifacts", "constellations", "town", "cosmetics"])("has %s.ts", (name) => {
    expect(dataFiles).toContain(`${name}.ts`);
  });

  it.each(dataFiles)("%s exports data only: no functions, no classes", (file) => {
    const src = code(read(new URL(file, dataDir)));
    expect(src).not.toMatch(/\bfunction\b|\bclass\s+[A-Z]|=>/);
  });

  it.each(dataFiles)("%s imports nothing but other data modules", (file) => {
    const imports = [...read(new URL(file, dataDir)).matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    for (const from of imports) expect(from).toMatch(/^\.\/[a-z-]+\.js$/);
  });
});

describe("logic modules no longer declare the tables", () => {
  const moved: Record<string, string[]> = {
    "character.ts": ["CLASS_ABILITIES", "BASE_DPS", "LEVEL_UP", "SWITCHER"],
    "gear.ts": ["SLOTS", "SLOT_DISPLAY", "SLOT_ITEM_TYPES", "STAT_ADJECTIVES", "DROP_WEIGHTS", "STAT_SCALE", "SLOT_STAT_WEIGHTS", "SET_DEFS"],
    "dungeon.ts": ["BOSS_NOUNS", "BOSS_TITLES", "ENEMY_ADJECTIVES", "ENEMY_NOUNS"],
    "artifacts.ts": ["ARTIFACT_DEFS", "ARTIFACT_DROP_POOL", "LEGACY_UPGRADED_MAP"],
    "constellations.ts": ["RAW_NODE_DEFS"],
    "engine.ts": ["UPGRADE_BASES", "PRESTIGE_SHOP_COSTS", "GUILD_HALL_COSTS", "RUNE_DEFS", "CONSUMABLE_DEFS", "SKILL_DEFS", "COMPANION_NAMES", "AVATAR_DEFS", "BORDER_DEFS", "THEME_UNLOCKS"],
  };
  it.each(Object.entries(moved))("%s", (file, names) => {
    const src = read(new URL(`../src/${file}`, import.meta.url));
    for (const name of names) expect(src, name).not.toMatch(new RegExp(`^(export )?const ${name}\\b`, "m"));
  });
});

describe("the quality ladder is one table, a row per quality", async () => {
  const { QUALITY_TABLE } = await import("../src/data/gear.js");
  const { QUAL, DAMAGE_BY_QUALITY, COST_BY_QUALITY, QUALITY_CLASSES } = await import("../src/gear.js");

  it("rows run worst to best, and the old lookups read from them", () => {
    expect(QUALITY_TABLE.map((r) => r.quality)).toEqual([...QUAL]);
    for (const row of QUALITY_TABLE) {
      expect(DAMAGE_BY_QUALITY[row.quality]).toBe(row.damage);
      expect(COST_BY_QUALITY[row.quality]).toBe(row.cost);
      expect(QUALITY_CLASSES[row.quality]).toBe(`q-${row.quality}`);
    }
  });

  it("better quality never costs less", () => {
    for (let i = 1; i < QUALITY_TABLE.length; i++) expect(QUALITY_TABLE[i].cost).toBeGreaterThan(QUALITY_TABLE[i - 1].cost);
  });
});

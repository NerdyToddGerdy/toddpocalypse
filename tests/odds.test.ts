import { describe, expect, it } from "vitest";
import { DROP_CHANCE, DROP_CHANCE_CAP, GameState } from "../src/engine.js";
import { getItem, QUAL, qualityOdds, qualityWeights } from "../src/gear.js";
import { mulberry32 } from "../src/rng.js";

/**
 * #74 — show the maths. Every number the player sees must come from the code
 * that rolls it, so these tests compare the breakdowns against the engine's
 * own combat and loot paths rather than against hand-written expectations.
 */

/** A seeded game whose lead hero has one item on, so it actually fights. */
function armedGame(seed = 1): GameState {
  const gs = new GameState("Hero", "fighter", mulberry32(seed));
  gs.party.team[0].equipItem(getItem("main_hand", 1, mulberry32(seed + 1)));
  return gs;
}

/** One second of party damage, through the real combat path. */
function oneSecond(gs: GameState): number {
  const g = gs as unknown as { scanParty(): unknown; computePartyDps(s: unknown, dt: number): number };
  return g.computePartyDps(g.scanParty(), 1);
}

describe("qualityOdds", () => {
  it("is a probability distribution", () => {
    for (const level of [1, 12, 40]) {
      const sum = qualityOdds(level).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1, 12);
    }
  });

  it("with no boost, is the engine's own weights normalised", () => {
    const w = qualityWeights(12);
    const total = w.reduce((a, b) => a + b, 0);
    expect(qualityOdds(12)).toEqual(w.map((x) => x / total));
  });

  it("a certain boost rolls as if 8 floors deeper", () => {
    expect(qualityOdds(12, 1)).toEqual(qualityOdds(20));
  });

  it("a partial boost blends the two tables", () => {
    const blend = qualityOdds(12, 0.25);
    const a = qualityOdds(12), b = qualityOdds(20);
    blend.forEach((p, i) => expect(p).toBeCloseTo(0.75 * a[i] + 0.25 * b[i], 12));
  });
});

describe("drop chance breakdown", () => {
  it("starts at the base rate, with its source named", () => {
    const d = new GameState("Hero", "fighter", mulberry32(1)).dropChanceBreakdown();
    expect(d.total).toBe(DROP_CHANCE);
    expect(d.parts).toEqual([{ label: "Base", value: DROP_CHANCE }]);
    expect(d.capped).toBe(false);
  });

  it("names each bonus", () => {
    const gs = new GameState("Hero", "fighter", mulberry32(1));
    gs.dungeonIndex = 2;
    gs.prestigeUpgrades = { gear_luck: 1 };
    const d = gs.dropChanceBreakdown();
    expect(d.parts.map((p) => p.label)).toEqual(["Base", "Dungeon 3", "Gear Luck"]);
    expect(d.total).toBeCloseTo(DROP_CHANCE + 0.10 + 0.05, 12);
  });

  it("says when the cap bites", () => {
    const gs = new GameState("Hero", "fighter", mulberry32(1));
    gs.prestigeUpgrades = { gear_luck: 20 };
    const d = gs.dropChanceBreakdown();
    expect(d.total).toBe(DROP_CHANCE_CAP);
    expect(d.capped).toBe(true);
  });
});

describe("loot odds in the state snapshot", () => {
  it("use the effective level the engine rolls at, not the floor number", () => {
    const gs = new GameState("Hero", "fighter", mulberry32(1));
    gs.dungeonIndex = 1;
    gs.dungeonLevel = 3;
    const odds = (JSON.parse(gs.respond()) as ReturnType<GameState["toDict"]>).loot_odds!;
    expect(odds.effective_level).toBe(3 + 5);
    QUAL.forEach((q, i) => expect(odds.quality[q]).toBeCloseTo(qualityOdds(8)[i], 12));
  });

  it("carry the drop chance breakdown", () => {
    const gs = new GameState("Hero", "fighter", mulberry32(1));
    expect(JSON.parse(gs.respond()).loot_odds.drop.total).toBe(gs.dropChanceBreakdown().total);
  });
});

// Derived numbers belong in the live snapshot the UI renders, never in a save.
describe("snapshot vs save", () => {
  it("the live snapshot carries the breakdowns", () => {
    const live = JSON.parse(armedGame().respond());
    expect(live.dps_breakdown).toBeDefined();
    expect(live.loot_odds).toBeDefined();
  });

  it("the save does not", () => {
    const saved = JSON.parse(armedGame().saveJson());
    expect(saved.dps_breakdown).toBeUndefined();
    expect(saved.loot_odds).toBeUndefined();
    expect(saved.dungeon_level).toBe(1);
  });
});

describe("DPS breakdown matches combat", () => {
  it("with crits off, the shown average is exactly what the enemy loses", () => {
    const gs = armedGame();
    gs.party.team[0].critChance = 0;
    expect(gs.partyDpsBreakdown().average).toBeCloseTo(oneSecond(gs), 9);
  });

  it("with certain crits, the shown average doubles like combat does", () => {
    const gs = armedGame();
    gs.party.team[0].critChance = 1;
    const b = gs.partyDpsBreakdown();
    expect(b.heroes[0].crit.multiplier).toBe(2);
    expect(b.average).toBeCloseTo(oneSecond(gs), 9);
  });

  it("an active skill appears as a named factor and still matches", () => {
    const gs = armedGame();
    gs.party.team[0].critChance = 0;
    gs.activeEffects = { skill_battle_cry: 5 };
    const b = gs.partyDpsBreakdown();
    expect(b.factors.find((f) => f.label === "Battle Cry")?.value).toBeGreaterThan(1);
    expect(b.average).toBeCloseTo(oneSecond(gs), 9);
  });

  it("says plainly when a hero deals nothing because nothing is equipped", () => {
    const gs = new GameState("Hero", "fighter", mulberry32(1));
    const hero = gs.partyDpsBreakdown().heroes[0];
    expect(hero.inactive).toMatch(/no gear/i);
    expect(hero.average).toBe(0);
    expect(oneSecond(gs)).toBe(0);
  });

  it("splits base DPS into class & level, gear and runes that add up", () => {
    const gs = armedGame();
    const hero = gs.partyDpsBreakdown().heroes[0];
    const sum = hero.parts.reduce((a, p) => a + p.value, 0);
    expect(sum).toBeCloseTo(gs.party.team[0].dps, 9);
  });
});

describe("crit sources", () => {
  it("add up to the chance combat rolls against", () => {
    const gs = armedGame();
    const c = gs.party.team[0];
    c.critChance += 0.07; // as if from gear or runes
    const crit = gs.partyDpsBreakdown().heroes[0].crit;
    const sum = crit.sources.reduce((a, s) => a + s.value, 0);
    expect(sum).toBeCloseTo(crit.chance, 12);
    expect(crit.chance).toBeCloseTo(c.critChance, 12);
  });
});

describe("wiring (#74)", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
  const mainTs = read("../src/main.ts");
  const html = read("../public/index.html");

  it("the DPS tooltip reads the live breakdown, not a value baked in at render", () => {
    expect(mainTs).toMatch(/data-dps="\$\{ci\}"/);
    expect(mainTs).toMatch(/buildDpsTooltipHTML\(\{ hero[,:]/);
  });

  it("each hero sheet shows its crit chance and multiplier", () => {
    expect(mainTs).toMatch(/class="char-crit"/);
  });

  it("the odds dialog is built from the engine's own loot odds", () => {
    expect(mainTs).toMatch(/buildLootOddsHTML\(game\.lootOdds\(\), game\.dungeonLevel\)/);
  });

  it("the odds button says what it is", () => {
    expect(html).toMatch(/<button id="drop-chart-btn"[^>]*>📊 Odds<\/button>/);
  });

  it("the welcome-back line comes from welcomeBackLine", () => {
    expect(mainTs).toMatch(/welcomeBackLine\(earned, elapsedMs\)/);
  });
});

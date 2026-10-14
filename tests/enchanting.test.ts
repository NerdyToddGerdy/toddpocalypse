import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ENCHANT_PRICE_BOSS_GOLD, ENCHANT_PRICE_GROWTH, GameState } from "../src/engine.js";
import { ENCHANT_STRENGTH, GearItem, enchantOdds, enchantValue, rollEnchant, type GearStats } from "../src/gear.js";
import { bossGoldReward } from "../src/dungeon.js";
import { buildTooltipHTML, enchantSectionHTML } from "../src/ui/html.js";
import { mulberry32 } from "../src/rng.js";

/**
 * #15 phase 2 — enchanting. Decided on the issue: one enchant per item,
 * re-rollable at a rising gold cost, one stat at a time, kept with the item
 * through the stash and Return to Town.
 */

const sword = () => new GearItem("main_hand", "sword", "rare", "fury", { dps: 100, critChance: 0.05 }, 30);

/** A game with the Guild Hall, a sword on the hero, and plenty of gold. */
function guildGame(seed = 1): GameState {
  const gs = new GameState("Aldric", "fighter", mulberry32(seed));
  gs.prestigeUpgrades = { guild_hall_access: 1 };
  gs.party.team[0].equipItem(sword());
  gs.highestLevel = 30;
  gs.gold = 1e12;
  return gs;
}

const heroStats = (gs: GameState) => {
  const c = gs.party.team[0];
  return { dps: c.dps, maxHealth: c.maxHealth, clickBonus: c.clickBonus, critChance: c.critChance, haste: c.haste, lifesteal: c.lifesteal };
};

describe("an enchanted item", () => {
  it("adds its enchant to the item's stats and keeps the base", () => {
    const item = sword().withEnchant({ stat: "haste", value: 0.04 });
    expect(item.stats).toEqual({ dps: 100, critChance: 0.05, haste: 0.04 });
    expect(item.baseStats).toEqual({ dps: 100, critChance: 0.05 });
    expect(item.enchant).toEqual({ stat: "haste", value: 0.04 });
    expect(item.enchantCount).toBe(1);
  });

  it("adds to a stat the item already has", () => {
    expect(sword().withEnchant({ stat: "dps", value: 20 }).stats.dps).toBe(120);
  });

  it("a re-roll replaces the enchant, never stacks it", () => {
    const item = sword().withEnchant({ stat: "dps", value: 20 }).withEnchant({ stat: "haste", value: 0.04 });
    expect(item.stats).toEqual({ dps: 100, critChance: 0.05, haste: 0.04 });
    expect(item.enchantCount).toBe(2);
  });

  it("is otherwise the same item", () => {
    const base = sword();
    const item = base.withEnchant({ stat: "dps", value: 20 });
    expect([item.slot, item.quality, item.getName(), item.sellValue, item.dungeonLevel])
      .toEqual([base.slot, base.quality, base.getName(), base.sellValue, base.dungeonLevel]);
  });

  it("survives a save and load", () => {
    const item = sword().withEnchant({ stat: "haste", value: 0.04 }).withEnchant({ stat: "dps", value: 20 });
    const back = GearItem.fromDict(JSON.parse(JSON.stringify(item.toDict())));
    expect(back.stats).toEqual(item.stats);
    expect(back.baseStats).toEqual(item.baseStats);
    expect(back.enchant).toEqual(item.enchant);
    expect(back.enchantCount).toBe(2);
  });

  it("an item saved before enchanting existed loads unenchanted", () => {
    const d = sword().toDict();
    const back = GearItem.fromDict(d);
    expect(back.enchant).toBeUndefined();
    expect(back.enchantCount).toBe(0);
    expect(back.stats).toEqual(d.stats);
  });

  it("the saved stats are the total, so everything that reads them counts the enchant", () => {
    expect(sword().withEnchant({ stat: "dps", value: 20 }).toDict().stats.dps).toBe(120);
  });
});

describe("the enchant roll", () => {
  it("rolls from the slot's own stat pool, with the odds shown", () => {
    const odds = enchantOdds(sword());
    expect(odds.map((o) => o.stat).sort()).toEqual(["clickBonus", "critChance", "dps", "haste", "lifesteal"]);
    expect(odds.reduce((a, o) => a + o.chance, 0)).toBeCloseTo(1, 10);
    expect(odds.find((o) => o.stat === "dps")!.chance).toBeCloseTo(0.5, 10);
  });

  it("each row's value is what that stat would roll", () => {
    for (const o of enchantOdds(sword())) expect(o.value).toBe(enchantValue(o.stat, "rare", 30));
  });

  it("is worth half a normal roll at the item's quality, scaled by depth like a drop", () => {
    expect(ENCHANT_STRENGTH).toBe(0.5);
    // rare dps rolls 36; floor 30 scales by 1 + 6 × 0.25 = 2.5
    expect(enchantValue("dps", "rare", 30)).toBe(Math.ceil(36 * 0.5 * 2.5));
  });

  it("a percentage enchant is never shown as 0%", () => {
    expect(enchantValue("lifesteal", "broken", 1)).toBeGreaterThanOrEqual(0.01);
  });

  it("better items get better enchants", () => {
    expect(enchantValue("dps", "epic", 30)).toBeGreaterThan(enchantValue("dps", "rare", 30));
  });

  it("only ever lands on a row of the table, at that row's value", () => {
    const rows = new Map(enchantOdds(sword()).map((o) => [o.stat, o.value]));
    const rng = mulberry32(7);
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const e = rollEnchant(sword(), rng);
      expect(rows.get(e.stat)).toBe(e.value);
      seen.add(e.stat);
    }
    expect(seen.size).toBe(rows.size);
  });
});

describe("enchanting in the game", () => {
  it("needs the Guild Hall", () => {
    const gs = guildGame();
    gs.prestigeUpgrades = {};
    const gold = gs.gold;
    gs.enchantGear(0, "main_hand");
    expect(gs.party.team[0].inventory.slots.main_hand!.enchant).toBeUndefined();
    expect(gs.gold).toBe(gold);
  });

  it("costs its multiple of a boss's gold at your deepest floor", () => {
    const gs = guildGame();
    gs.dungeonIndex = 1;
    expect(ENCHANT_PRICE_BOSS_GOLD).toBe(2);
    expect(gs.enchantPrice(0, "main_hand")).toBe(Math.ceil(bossGoldReward(30, 1) * ENCHANT_PRICE_BOSS_GOLD));
  });

  it("each enchant on an item costs more than the last", () => {
    const gs = guildGame();
    const first = gs.enchantPrice(0, "main_hand");
    gs.enchantGear(0, "main_hand");
    const second = gs.enchantPrice(0, "main_hand");
    expect(ENCHANT_PRICE_GROWTH).toBe(1.5);
    expect(second).toBe(Math.ceil(bossGoldReward(30, 0) * ENCHANT_PRICE_BOSS_GOLD * ENCHANT_PRICE_GROWTH));
    expect(second).toBeGreaterThan(first);
  });

  it("the rising price belongs to the item, not the hero", () => {
    const gs = guildGame();
    gs.party.team[0].equipItem(new GearItem("helmet", "helm", "rare", "warding", { maxHp: 50 }, 30));
    const helmet = gs.enchantPrice(0, "helmet");
    gs.enchantGear(0, "main_hand");
    gs.enchantGear(0, "main_hand");
    expect(gs.enchantPrice(0, "helmet")).toBe(helmet);
  });

  it("charges the price and puts the enchant on the hero", () => {
    const gs = guildGame();
    const before = heroStats(gs);
    const price = gs.enchantPrice(0, "main_hand");
    const gold = gs.gold;
    gs.enchantGear(0, "main_hand");
    expect(gs.gold).toBe(gold - price);
    const { stat, value } = gs.party.team[0].inventory.slots.main_hand!.enchant!;
    const key = { dps: "dps", maxHp: "maxHealth", clickBonus: "clickBonus", critChance: "critChance", haste: "haste", lifesteal: "lifesteal" }[stat as string]! as keyof ReturnType<typeof heroStats>;
    expect(heroStats(gs)[key]).toBeCloseTo(before[key] + value, 10);
  });

  it("a re-roll takes the old enchant off the hero", () => {
    const gs = guildGame();
    const bare = heroStats(gs);
    for (let i = 0; i < 6; i++) gs.enchantGear(0, "main_hand");
    const { stat, value } = gs.party.team[0].inventory.slots.main_hand!.enchant!;
    const want: Record<string, number> = { ...bare };
    const key = { dps: "dps", maxHp: "maxHealth", clickBonus: "clickBonus", critChance: "critChance", haste: "haste", lifesteal: "lifesteal" }[stat as string]!;
    want[key] += value;
    for (const [k, v] of Object.entries(heroStats(gs))) expect(v, k).toBeCloseTo(want[k], 10);
  });

  it("without the gold, nothing changes and the log says what it costs", () => {
    const gs = guildGame();
    gs.gold = 0;
    const before = heroStats(gs);
    gs.enchantGear(0, "main_hand");
    expect(heroStats(gs)).toEqual(before);
    expect(gs.party.team[0].inventory.slots.main_hand!.enchant).toBeUndefined();
    expect(gs.log.join("\n")).toMatch(/costs/);
  });

  it("an empty slot or a missing hero is a no-op", () => {
    const gs = guildGame();
    const gold = gs.gold;
    gs.enchantGear(0, "helmet");
    gs.enchantGear(5, "main_hand");
    expect(gs.gold).toBe(gold);
  });

  it("the log names the new enchant", () => {
    const gs = guildGame();
    gs.enchantGear(0, "main_hand");
    expect(gs.log.at(-1)).toMatch(/enchant/i);
  });

  it("is kept through a save and load, without counting it twice", () => {
    const gs = guildGame();
    gs.enchantGear(0, "main_hand");
    const before = heroStats(gs);
    const back = GameState.fromDict(JSON.parse(gs.saveJson()));
    expect(back.party.team[0].inventory.slots.main_hand!.enchant).toEqual(gs.party.team[0].inventory.slots.main_hand!.enchant);
    for (const [k, v] of Object.entries(heroStats(back))) expect(v, k).toBeCloseTo(before[k as keyof typeof before], 10);
  });

  it("goes with the item into the stash, and survives Return to Town there", () => {
    const gs = guildGame();
    gs.prestigeUpgrades.stash = 1;
    gs.enchantGear(0, "main_hand");
    const enchant = gs.party.team[0].inventory.slots.main_hand!.enchant;
    gs.unequipGear(0, "main_hand");
    expect(gs.gearStash.at(-1)!.enchant).toEqual(enchant);
    gs.highestLevel = 25;
    gs.prestige();
    const back = GameState.fromDict(JSON.parse(gs.saveJson()));
    expect(back.gearStash.some((i) => i.enchant?.stat === enchant!.stat && i.enchant?.value === enchant!.value)).toBe(true);
  });
});

describe("the enchant section of the gear dialog", () => {
  const view = (item: GearItem, gold: number, price = 1_000) =>
    enchantSectionHTML(item.toDict(), enchantOdds(item), price, gold, 0, "main_hand");

  it("shows every stat it can roll, with its chance and value", () => {
    const html = view(sword(), 1e6);
    expect(html).toContain("50%");
    expect(html).toContain(`+${enchantValue("dps", "rare", 30).toFixed(1)} DPS`);
    expect(html.match(/class="enchant-odds-row"/g)).toHaveLength(5);
  });

  it("says when an item isn't enchanted, and offers to enchant it", () => {
    const html = view(sword(), 1e6);
    expect(html).toMatch(/not enchanted/i);
    expect(html).toMatch(/data-action="gear-slot-enchant"[^>]*>\s*Enchant/);
  });

  it("shows the current enchant and offers a re-roll that replaces it", () => {
    const html = view(sword().withEnchant({ stat: "haste", value: 0.04 }), 1e6);
    expect(html).toContain("+4% Haste");
    expect(html).toMatch(/Re-roll/);
    expect(html).toMatch(/replaces/i);
  });

  it("shows the price, and is disabled when you can't pay it", () => {
    expect(view(sword(), 1e6, 1_500)).toContain("1,500g");
    expect(view(sword(), 10, 1_500)).toMatch(/data-action="gear-slot-enchant"[^>]*disabled/);
  });
});

describe("the item tooltip", () => {
  it("says which part of the stats is the enchant", () => {
    const html = buildTooltipHTML(sword().withEnchant({ stat: "haste", value: 0.04 }).toDict());
    expect(html).toMatch(/Enchant[^<]*<\/span>[\s\S]*\+4% Haste/);
  });

  it("says nothing about enchants on an item without one", () => {
    expect(buildTooltipHTML(sword().toDict())).not.toMatch(/enchant/i);
  });
});

// #15: the gear slot dialog offers enchanting once the Guild Hall is open.
const mainTs = readFileSync(fileURLToPath(new URL("../src/main.ts", import.meta.url)), "utf8");

describe("enchanting is wired into the gear slot dialog", () => {
  const modal = mainTs.slice(mainTs.indexOf("function openGearSlotModal"), mainTs.indexOf("function closeGearSlotModal"));

  it("shows the enchant section only with Guild Hall access", () => {
    expect(modal).toMatch(/guild_hall_access[\s\S]*enchantSectionHTML\(/);
  });

  it("prices and rolls from the engine, so the dialog shows what will happen", () => {
    expect(modal).toContain("enchantOdds(");
    expect(modal).toContain("game.enchantPrice(charIdx, slot)");
  });

  it("the button enchants, then shows the new roll", () => {
    const handler = mainTs.slice(mainTs.indexOf('action === "gear-slot-enchant"'));
    expect(handler.slice(0, 300)).toMatch(/call\("enchantGear"[\s\S]*openGearSlotModal\(/);
  });
});

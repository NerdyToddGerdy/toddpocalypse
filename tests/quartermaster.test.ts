import { describe, expect, it } from "vitest";
import {
  CONSUMABLE_DEFS, DROP_CHANCE, DROP_CHANCE_CAP, GameState, GOLD_DRAUGHT_MULT, LUCKY_CHARM_BONUS, WHETSTONE_MULT,
} from "../src/engine.js";
import { bossGoldReward, generateBoss } from "../src/dungeon.js";
import { getItem } from "../src/gear.js";
import { mulberry32 } from "../src/rng.js";

/**
 * #15 — the Quartermaster: consumables bought with gold, in the Guild Hall.
 * Each effect is checked through the real combat and loot paths, and prices
 * through the same boss-gold formula bosses pay out with.
 */

/** A game with the Guild Hall, a hero who fights, and plenty of gold. */
function guildGame(seed = 1): GameState {
  const gs = new GameState("Aldric", "fighter", mulberry32(seed));
  gs.prestigeUpgrades = { guild_hall_access: 1 };
  gs.party.team[0].equipItem(getItem("main_hand", 1, mulberry32(seed + 1)));
  gs.party.team[0].critChance = 0;
  gs.highestLevel = 20;
  gs.gold = 1e9;
  return gs;
}

/** Kills the current enemy through the real kill path. */
function killEnemy(gs: GameState): void {
  gs.enemy.hp = 0;
  gs.tick(0.1);
}

function oneSecond(gs: GameState): number {
  const g = gs as unknown as { scanParty(): unknown; computePartyDps(s: unknown, dt: number): number };
  return g.computePartyDps(g.scanParty(), 1);
}

describe("bossGoldReward", () => {
  it("is exactly what generateBoss pays", () => {
    for (const [level, d] of [[1, 0], [12, 0], [40, 2], [77, 4]]) {
      expect(bossGoldReward(level, d)).toBe(generateBoss(level, d, 1, false, mulberry32(9)).gold_reward);
    }
  });
});

describe("prices", () => {
  it.each(Object.keys(CONSUMABLE_DEFS))("%s costs its multiple of a boss's gold at your deepest floor", (id) => {
    const gs = guildGame();
    gs.highestLevel = 30;
    gs.dungeonIndex = 1;
    const want = Math.ceil(bossGoldReward(30, 1) * CONSUMABLE_DEFS[id as keyof typeof CONSUMABLE_DEFS].priceBossGold);
    expect(gs.consumablePrice(id)).toBe(want);
  });

  it("rise as you go deeper, so they stay a real cost", () => {
    const gs = guildGame();
    gs.highestLevel = 10;
    const shallow = gs.consumablePrice("whetstone");
    gs.highestLevel = 50;
    expect(gs.consumablePrice("whetstone")).toBeGreaterThan(shallow * 5);
  });
});

describe("buying", () => {
  it("takes the gold and starts the effect", () => {
    const gs = guildGame();
    const price = gs.consumablePrice("whetstone");
    gs.buyConsumable("whetstone");
    expect(gs.gold).toBe(1e9 - price);
    expect(gs.consumableCharges.whetstone).toBe(CONSUMABLE_DEFS.whetstone.kills);
  });

  it("buying again extends the duration", () => {
    const gs = guildGame();
    gs.buyConsumable("whetstone");
    gs.buyConsumable("whetstone");
    expect(gs.consumableCharges.whetstone).toBe(2 * CONSUMABLE_DEFS.whetstone.kills!);
  });

  it("does nothing without enough gold", () => {
    const gs = guildGame();
    gs.gold = 1;
    gs.buyConsumable("whetstone");
    expect(gs.gold).toBe(1);
    expect(gs.consumableCharges.whetstone ?? 0).toBe(0);
  });

  it("needs the Guild Hall, where the shop is", () => {
    const gs = guildGame();
    gs.prestigeUpgrades = {};
    gs.buyConsumable("whetstone");
    expect(gs.gold).toBe(1e9);
  });
});

describe("Whetstone", () => {
  it("multiplies the damage combat deals, and shows in the breakdown", () => {
    const gs = guildGame();
    const before = oneSecond(gs);
    gs.buyConsumable("whetstone");
    expect(oneSecond(gs)).toBeCloseTo(before * WHETSTONE_MULT, 9);
    const b = gs.partyDpsBreakdown();
    expect(b.factors.find((f) => f.label === "Whetstone")?.value).toBe(WHETSTONE_MULT);
    expect(b.average).toBeCloseTo(oneSecond(gs), 9);
  });

  it("wears off one kill at a time", () => {
    const gs = guildGame();
    gs.buyConsumable("whetstone");
    killEnemy(gs);
    expect(gs.consumableCharges.whetstone).toBe(CONSUMABLE_DEFS.whetstone.kills! - 1);
  });
});

describe("Lucky charm", () => {
  it("adds to the drop chance, named, and is still capped", () => {
    const gs = guildGame();
    gs.buyConsumable("lucky_charm");
    const d = gs.dropChanceBreakdown();
    expect(d.parts.find((p) => p.label === "Lucky charm")?.value).toBe(LUCKY_CHARM_BONUS);
    expect(d.total).toBeCloseTo(DROP_CHANCE + LUCKY_CHARM_BONUS, 12);
    gs.prestigeUpgrades.gear_luck = 20;
    expect(gs.dropChanceBreakdown().total).toBe(DROP_CHANCE_CAP);
  });
});

describe("Gold draught", () => {
  it("raises a boss's gold, and counts down by bosses only", () => {
    const base = guildGame(3);
    base.enemy = generateBoss(5, 0, 1, false, mulberry32(9));
    const g0 = base.gold;
    killEnemy(base);
    const plain = base.gold - g0;

    const gs = guildGame(3);
    gs.buyConsumable("gold_draught");
    const afterBuy = gs.gold;
    killEnemy(gs); // an ordinary enemy: no charge used
    expect(gs.consumableCharges.gold_draught).toBe(CONSUMABLE_DEFS.gold_draught.bosses);
    gs.enemy = generateBoss(5, 0, 1, false, mulberry32(9));
    const g1 = gs.gold;
    killEnemy(gs);
    expect(gs.gold - g1).toBeCloseTo(plain * GOLD_DRAUGHT_MULT, 6);
    expect(gs.consumableCharges.gold_draught).toBe(CONSUMABLE_DEFS.gold_draught.bosses! - 1);
    expect(afterBuy).toBeLessThan(1e9);
  });
});

describe("Healing potion", () => {
  it("heals every living hero to full, at once", () => {
    const gs = guildGame();
    const hero = gs.party.team[0];
    hero.health = 1;
    gs.buyConsumable("healing_potion");
    expect(hero.health).toBe(hero.maxHealth);
    expect(gs.consumableCharges.healing_potion ?? 0).toBe(0);
  });
});

describe("persistence", () => {
  it("active effects survive a save and load", () => {
    const gs = guildGame();
    gs.buyConsumable("whetstone");
    const loaded = GameState.fromDict(JSON.parse(gs.saveJson()));
    expect(loaded.consumableCharges.whetstone).toBe(CONSUMABLE_DEFS.whetstone.kills);
  });

  it("the live snapshot lists every item with its price and what's left", () => {
    const gs = guildGame();
    gs.buyConsumable("lucky_charm");
    const live = JSON.parse(gs.respond());
    const charm = live.consumables.find((c: { id: string }) => c.id === "lucky_charm");
    expect(charm.price).toBe(gs.consumablePrice("lucky_charm"));
    expect(charm.charges).toBe(CONSUMABLE_DEFS.lucky_charm.kills);
    expect(live.consumables).toHaveLength(Object.keys(CONSUMABLE_DEFS).length);
  });

  it("Return to Town clears them, and says so", () => {
    const gs = guildGame();
    gs.highestLevel = 25;
    gs.buyConsumable("whetstone");
    expect(gs.returnToTownSummary().reset.map((r) => r.key)).toContain("consumables");
    gs.prestige();
    expect(gs.consumableCharges.whetstone ?? 0).toBe(0);
  });
});

describe("Quartermaster wiring", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const mainTs = readFileSync(fileURLToPath(new URL("../src/main.ts", import.meta.url)), "utf8");

  it("sits at the top of the Guild Hall tab", () => {
    expect(mainTs).toMatch(/buildQuartermasterHTML\(state\.consumables \?\? \[\], state\.gold\)/);
  });

  it("the buy button calls the engine", () => {
    expect(mainTs).toMatch(/action === "buy-consumable"[\s\S]{0,80}call\("buyConsumable", btn\.dataset\.id!\)/);
  });
});

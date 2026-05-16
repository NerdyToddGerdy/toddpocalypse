import { beforeEach, describe, expect, it } from "vitest";
import {
  GameState, ACHIEVEMENTS, type AchievementDef,
  PRESTIGE_UNLOCK_LEVEL,
} from "../src/engine.js";
import { GearItem } from "../src/gear.js";
import { Character } from "../src/character.js";

function make(): GameState { return new GameState(); }

// ──────────────────────────────────────────
// ACHIEVEMENTS data integrity
// ──────────────────────────────────────────
describe("ACHIEVEMENTS definition", () => {
  it("exports a non-empty array", () => {
    expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
    expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
  });

  it("every achievement has required string fields", () => {
    for (const a of ACHIEVEMENTS) {
      expect(typeof a.id).toBe("string");
      expect(typeof a.name).toBe("string");
      expect(typeof a.description).toBe("string");
      expect(typeof a.category).toBe("string");
      expect(typeof a.hidden).toBe("boolean");
    }
  });

  it("all achievement IDs are unique", () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every getValue returns a finite number", () => {
    const gs = make();
    for (const a of ACHIEVEMENTS) {
      const v = a.getValue(gs);
      expect(typeof v).toBe("number");
      expect(isFinite(v)).toBe(true);
    }
  });

  it("tiered achievements have ascending thresholds", () => {
    for (const a of ACHIEVEMENTS.filter(a => a.tiers)) {
      const thresholds = a.tiers!.map(t => t.threshold);
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
      }
    }
  });

  it("has first_kill achievement", () => {
    expect(ACHIEVEMENTS.find(a => a.id === "first_kill")).toBeTruthy();
  });

  it("has kills_tiered achievement", () => {
    expect(ACHIEVEMENTS.find(a => a.id === "kills_tiered")).toBeTruthy();
  });

  it("has depth_tiered achievement", () => {
    expect(ACHIEVEMENTS.find(a => a.id === "depth_tiered")).toBeTruthy();
  });
});

// ──────────────────────────────────────────
// checkAchievements — flat achievements
// ──────────────────────────────────────────
describe("checkAchievements — flat", () => {
  it("first_kill fires when lifetimeKills+kills >= 1", () => {
    const gs = make();
    gs.kills = 1;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "first_kill")).toBe(true);
  });

  it("first_kill does not fire at 0 kills", () => {
    const gs = make();
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "first_kill")).toBe(false);
  });

  it("first_kill does not re-fire on second call", () => {
    const gs = make();
    gs.kills = 1;
    gs.checkAchievements();
    const second = gs.checkAchievements();
    expect(second.some(u => u.id === "first_kill")).toBe(false);
  });

  it("first_prestige fires after totalPrestiges >= 1", () => {
    const gs = make();
    gs.totalPrestiges = 1;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "first_prestige")).toBe(true);
  });

  it("depth_100 fires at lifetimeBestLevel >= 100", () => {
    const gs = make();
    gs.lifetimeBestLevel = 100;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "depth_100")).toBe(true);
  });

  it("first_loot fires when lifetimeLoot >= 1", () => {
    const gs = make();
    gs.lifetimeLoot = 1;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "first_loot")).toBe(true);
  });

  it("die_50 fires when lifetime deaths >= 50", () => {
    const gs = make();
    gs.lifetimeDeaths = 49;
    gs.deaths = 1;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "die_50")).toBe(true);
  });

  it("die_50 does not fire at 49 lifetime deaths", () => {
    const gs = make();
    gs.lifetimeDeaths = 49;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "die_50")).toBe(false);
  });
});

// ──────────────────────────────────────────
// checkAchievements — tiered achievements
// ──────────────────────────────────────────
describe("checkAchievements — tiered", () => {
  it("kills_tiered bronze fires at 100 kills", () => {
    const gs = make();
    gs.kills = 100;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "kills_tiered" && u.tier === "bronze")).toBe(true);
  });

  it("kills_tiered silver fires at 1000 kills (and bronze is already in unlocked set)", () => {
    const gs = make();
    gs.kills = 1000;
    const unlocks = gs.checkAchievements();
    const tiers = unlocks.filter(u => u.id === "kills_tiered").map(u => u.tier);
    expect(tiers).toContain("bronze");
    expect(tiers).toContain("silver");
  });

  it("kills_tiered gold fires at 10000 kills", () => {
    const gs = make();
    gs.kills = 10000;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "kills_tiered" && u.tier === "gold")).toBe(true);
  });

  it("already-unlocked tiers do not re-fire", () => {
    const gs = make();
    gs.kills = 100;
    gs.checkAchievements(); // unlocks bronze
    gs.kills = 200;
    const second = gs.checkAchievements();
    expect(second.some(u => u.id === "kills_tiered" && u.tier === "bronze")).toBe(false);
  });

  it("depth_tiered bronze fires at lifetimeBestLevel 10", () => {
    const gs = make();
    gs.lifetimeBestLevel = 10;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "depth_tiered" && u.tier === "bronze")).toBe(true);
  });

  it("gold_tiered bronze fires when lifetimeGold >= 10000", () => {
    const gs = make();
    gs.lifetimeGold = 10000;
    const unlocks = gs.checkAchievements();
    expect(unlocks.some(u => u.id === "gold_tiered" && u.tier === "bronze")).toBe(true);
  });
});

// ──────────────────────────────────────────
// Reward application
// ──────────────────────────────────────────
describe("achievement rewards", () => {
  it("gold reward adds to gs.gold", () => {
    const gs = make();
    const before = gs.gold;
    // depth_tiered bronze gives 250g
    gs.lifetimeBestLevel = 10;
    gs.checkAchievements();
    expect(gs.gold).toBeGreaterThan(before);
  });

  it("prestige_points reward adds to gs.prestigePoints", () => {
    const gs = make();
    const before = gs.prestigePoints;
    gs.lifetimeBestLevel = 25; // depth_tiered silver → 1 PP
    gs.checkAchievements();
    expect(gs.prestigePoints).toBeGreaterThan(before);
  });

  it("title reward sets gs.earnedTitle", () => {
    const gs = make();
    gs.lifetimeDeaths = 50;
    gs.checkAchievements(); // die_50 → "The Undying"
    expect(gs.earnedTitle).toBe("The Undying");
  });

  it("reward is only applied once (no duplicate gold)", () => {
    const gs = make();
    gs.lifetimeBestLevel = 10;
    gs.checkAchievements();
    const goldAfterFirst = gs.gold;
    gs.checkAchievements();
    expect(gs.gold).toBe(goldAfterFirst);
  });
});

// ──────────────────────────────────────────
// pendingAchievements (toast queue)
// ──────────────────────────────────────────
describe("pendingAchievements", () => {
  it("newly unlocked achievements are added to pendingAchievements", () => {
    const gs = make();
    gs.kills = 1;
    gs.checkAchievements();
    expect(gs.pendingAchievements.some(u => u.id === "first_kill")).toBe(true);
  });

  it("pendingAchievements are cleared after respond()", () => {
    const gs = make();
    gs.kills = 1;
    gs.checkAchievements();
    gs.respond();
    expect(gs.pendingAchievements).toHaveLength(0);
  });

  it("toDict includes pending_achievements", () => {
    const gs = make();
    gs.kills = 1;
    gs.checkAchievements();
    expect(gs.toDict().pending_achievements.length).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────
// Lifetime counters
// ──────────────────────────────────────────
describe("lifetime counters", () => {
  it("lifetimeLoot increments when item is equipped from loot pool", () => {
    const gs = make();
    const item = new GearItem("main_hand", "sword", "common", "valor", {}, 1);
    gs.lootPool.push(item);
    gs.equipLoot(0);
    expect(gs.lifetimeLoot).toBe(1);
  });

  it("lifetimeSold increments when item is sold from loot pool", () => {
    const gs = make();
    const item = new GearItem("main_hand", "sword", "common", "valor", {}, 1);
    gs.lootPool.push(item);
    gs.sellLoot(0);
    expect(gs.lifetimeSold).toBe(1);
  });

  it("lifetimeSold increments for sellAll", () => {
    const gs = make();
    gs.lootPool.push(new GearItem("main_hand", "sword", "common", "valor", {}, 1));
    gs.lootPool.push(new GearItem("helmet", "helm", "common", "valor", {}, 1));
    gs.sellAll();
    expect(gs.lifetimeSold).toBe(2);
  });

  it("lifetimeGold increments when gold is earned from kills", () => {
    const gs = make();
    const before = gs.lifetimeGold;
    gs.earnGold(500);
    expect(gs.lifetimeGold).toBe(before + 500);
    expect(gs.gold).toBe(before + 500);
  });

  it("lifetimeGold does not go down when gold is spent", () => {
    const gs = make();
    gs.earnGold(1000);
    const lifetimeAfterEarn = gs.lifetimeGold;
    gs.gold -= 500;
    expect(gs.lifetimeGold).toBe(lifetimeAfterEarn);
  });

  it("lifetime counters survive prestige", () => {
    const gs = make();
    gs.lifetimeLoot = 5;
    gs.lifetimeSold = 3;
    gs.lifetimeGold = 10000;
    // Simulate prestige preconditions
    gs.highestLevel = PRESTIGE_UNLOCK_LEVEL;
    gs.prestige();
    expect(gs.lifetimeLoot).toBe(5);
    expect(gs.lifetimeSold).toBe(3);
    expect(gs.lifetimeGold).toBeGreaterThanOrEqual(10000); // may increase from achievement rewards
  });
});

// ──────────────────────────────────────────
// Serialization
// ──────────────────────────────────────────
describe("achievement serialization", () => {
  it("achievementsUnlocked round-trips through toDict/fromDict", () => {
    const gs = make();
    gs.kills = 1;
    gs.checkAchievements();
    expect(gs.achievementsUnlocked.has("first_kill")).toBe(true);

    const restored = GameState.fromDict(gs.toDict());
    expect(restored.achievementsUnlocked.has("first_kill")).toBe(true);
  });

  it("earnedTitle round-trips through toDict/fromDict", () => {
    const gs = make();
    gs.earnedTitle = "The Undying";
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.earnedTitle).toBe("The Undying");
  });

  it("lifetime counters round-trip through toDict/fromDict", () => {
    const gs = make();
    gs.lifetimeGold = 999;
    gs.lifetimeLoot = 42;
    gs.lifetimeSold = 17;
    gs.lifetimeBossKills = 8;
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.lifetimeGold).toBe(999);
    expect(restored.lifetimeLoot).toBe(42);
    expect(restored.lifetimeSold).toBe(17);
    expect(restored.lifetimeBossKills).toBe(8);
  });

  it("already-unlocked achievements do not re-fire on fromDict load", () => {
    const gs = make();
    gs.kills = 1;
    gs.checkAchievements(); // marks first_kill as done
    const dict = gs.toDict();

    const restored = GameState.fromDict(dict);
    // Simulate a fresh checkAchievements call after load (kills still set)
    restored.kills = 1;
    const newUnlocks = restored.checkAchievements();
    expect(newUnlocks.some(u => u.id === "first_kill")).toBe(false);
  });

  it("toDict includes achievements_unlocked as array", () => {
    const gs = make();
    gs.kills = 1;
    gs.checkAchievements();
    const dict = gs.toDict();
    expect(Array.isArray(dict.achievements_unlocked)).toBe(true);
    expect(dict.achievements_unlocked).toContain("first_kill");
  });

  it("toDict includes earned_title", () => {
    const gs = make();
    gs.earnedTitle = "Slayer";
    expect(gs.toDict().earned_title).toBe("Slayer");
  });
});

// ──────────────────────────────────────────
// Issue #26 — new achievements
// ──────────────────────────────────────────

describe("Not Alone", () => {
  it("fires when party has 2+ members", () => {
    const gs = make();
    expect(gs.checkAchievements().some(u => u.id === "not_alone")).toBe(false);
    gs.party.addPlayer(new Character("Ally", "fighter"));
    expect(gs.checkAchievements().some(u => u.id === "not_alone")).toBe(true);
  });
});

describe("Band of Heroes", () => {
  it("fires when party has 5 members", () => {
    const gs = make();
    for (let i = 1; i < 5; i++) gs.party.addPlayer(new Character(`C${i}`, "fighter"));
    expect(gs.checkAchievements().some(u => u.id === "band_of_heroes")).toBe(true);
  });
  it("does not fire with fewer than 5", () => {
    const gs = make();
    gs.party.addPlayer(new Character("C1", "fighter"));
    expect(gs.checkAchievements().some(u => u.id === "band_of_heroes")).toBe(false);
  });
});

describe("Battle Ready", () => {
  it("fires after first skill activation", () => {
    const gs = make();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.activateSkill("skill_battle_cry");
    expect(gs.checkAchievements().some(u => u.id === "battle_ready")).toBe(true);
  });
  it("does not fire before any activation", () => {
    const gs = make();
    expect(gs.checkAchievements().some(u => u.id === "battle_ready")).toBe(false);
  });
});

describe("Arsenal", () => {
  it("fires when all 5 active skills are unlocked", () => {
    const gs = make();
    ["skill_battle_cry","skill_shadow_strike","skill_arcane_surge","skill_consecrate","skill_volley"].forEach(s => {
      gs.guildUpgrades[s] = 1;
    });
    expect(gs.checkAchievements().some(u => u.id === "arsenal")).toBe(true);
  });
  it("does not fire with only 4 skills", () => {
    const gs = make();
    ["skill_battle_cry","skill_shadow_strike","skill_arcane_surge","skill_consecrate"].forEach(s => {
      gs.guildUpgrades[s] = 1;
    });
    expect(gs.checkAchievements().some(u => u.id === "arsenal")).toBe(false);
  });
});

describe("Arcane Brand", () => {
  it("fires after branding a rune", () => {
    const gs = make();
    gs.guildUpgrades["rune_forge"] = 1;
    gs.runeInventory.push({ id: "striking_lesser", name: "Lesser Striking Rune", type: "striking", tier: "lesser", statKey: "dps", value: 8 });
    gs.brandRune(0, "main_hand", "striking_lesser");
    expect(gs.checkAchievements().some(u => u.id === "arcane_brand")).toBe(true);
  });
});

describe("Forge Master", () => {
  it("fires after combining runes", () => {
    const gs = make();
    gs.guildUpgrades["rune_forge"] = 2;
    gs.runeInventory.push({ id: "striking_lesser", name: "Lesser Striking Rune", type: "striking", tier: "lesser", statKey: "dps", value: 8 });
    gs.runeInventory.push({ id: "striking_lesser", name: "Lesser Striking Rune", type: "striking", tier: "lesser", statKey: "dps", value: 8 });
    gs.combineRunes("striking_lesser", "striking_lesser");
    expect(gs.checkAchievements().some(u => u.id === "forge_master")).toBe(true);
  });
});

describe("Rune Trader", () => {
  it("tracks runes sold via sellRune", () => {
    const gs = make();
    gs.runeInventory.push({ id: "striking_lesser", name: "Lesser Striking Rune", type: "striking", tier: "lesser", statKey: "dps", value: 8 });
    gs.sellRune(0);
    expect(gs.lifetimeRunesSold).toBe(1);
  });
  it("tracks runes sold via sellAllRunes", () => {
    const gs = make();
    gs.runeInventory.push({ id: "striking_lesser", name: "x", type: "striking", tier: "lesser", statKey: "dps", value: 8 });
    gs.runeInventory.push({ id: "warding_lesser", name: "x", type: "warding", tier: "lesser", statKey: "maxHp", value: 25 });
    gs.sellAllRunes();
    expect(gs.lifetimeRunesSold).toBe(2);
  });
  it("fires bronze at 10 runes sold", () => {
    const gs = make();
    gs.lifetimeRunesSold = 10;
    expect(gs.checkAchievements().some(u => u.id === "rune_trader")).toBe(true);
  });
});

describe("Elite Hunter", () => {
  it("tracks lifetime elite kills", () => {
    const gs = make();
    expect(gs.lifetimeEliteKills).toBe(0);
    gs.lifetimeEliteKills = 10;
    expect(gs.checkAchievements().some(u => u.id === "elite_hunter")).toBe(true);
  });
});

describe("Upgrade Junkie", () => {
  it("tracks lifetime upgrades bought", () => {
    const gs = make();
    expect(gs.lifetimeUpgradesBought).toBe(0);
    gs.lifetimeUpgradesBought = 50;
    expect(gs.checkAchievements().some(u => u.id === "upgrade_junkie")).toBe(true);
  });
});

describe("new achievement serialization", () => {
  it("lifetimeRunesSold round-trips", () => {
    const gs = make();
    gs.lifetimeRunesSold = 7;
    expect(GameState.fromDict(gs.toDict()).lifetimeRunesSold).toBe(7);
  });
  it("lifetimeEliteKills round-trips", () => {
    const gs = make();
    gs.lifetimeEliteKills = 12;
    expect(GameState.fromDict(gs.toDict()).lifetimeEliteKills).toBe(12);
  });
  it("lifetimeSkillActivations round-trips", () => {
    const gs = make();
    gs.lifetimeSkillActivations = 5;
    expect(GameState.fromDict(gs.toDict()).lifetimeSkillActivations).toBe(5);
  });
  it("lifetimeUpgradesBought round-trips", () => {
    const gs = make();
    gs.lifetimeUpgradesBought = 99;
    expect(GameState.fromDict(gs.toDict()).lifetimeUpgradesBought).toBe(99);
  });
});

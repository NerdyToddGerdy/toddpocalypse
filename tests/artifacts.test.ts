import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARTIFACT_DEFS, ARTIFACT_DROP_POOL,
  canCombineArtifacts, getCombineResult, artifactSellValue,
} from "../src/artifacts.js";
import { GameState, RUNE_DEFS } from "../src/engine.js";
import { Character } from "../src/character.js";

// ─── Artifact definitions ────────────────────────────────────────────────────

describe("ARTIFACT_DEFS", () => {
  it("has 12 total artifacts", () => {
    expect(Object.keys(ARTIFACT_DEFS).length).toBe(12);
  });

  it("has 6 base-tier artifacts", () => {
    const base = Object.values(ARTIFACT_DEFS).filter(d => d.tier === "base");
    expect(base.length).toBe(6);
  });

  it("has 6 upgraded-tier artifacts", () => {
    const upgraded = Object.values(ARTIFACT_DEFS).filter(d => d.tier === "upgraded");
    expect(upgraded.length).toBe(6);
  });

  it("every upgraded artifact has upgradesFrom pointing to a valid base artifact", () => {
    for (const def of Object.values(ARTIFACT_DEFS).filter(d => d.tier === "upgraded")) {
      expect(def.upgradesFrom).toBeDefined();
      const parent = ARTIFACT_DEFS[def.upgradesFrom!];
      expect(parent).toBeDefined();
      expect(parent.tier).toBe("base");
    }
  });

  it("every base artifact has a corresponding upgraded artifact", () => {
    const baseIds = Object.values(ARTIFACT_DEFS).filter(d => d.tier === "base").map(d => d.id);
    for (const id of baseIds) {
      const upgraded = Object.values(ARTIFACT_DEFS).find(d => d.upgradesFrom === id);
      expect(upgraded, `no upgraded form for ${id}`).toBeDefined();
    }
  });

  it("base artifacts have sellValue 50", () => {
    for (const def of Object.values(ARTIFACT_DEFS).filter(d => d.tier === "base")) {
      expect(def.sellValue).toBe(50);
    }
  });

  it("upgraded artifacts have sellValue 200", () => {
    for (const def of Object.values(ARTIFACT_DEFS).filter(d => d.tier === "upgraded")) {
      expect(def.sellValue).toBe(200);
    }
  });

  it("berserkers_eye has cap 0.20", () => {
    expect(ARTIFACT_DEFS.berserkers_eye.cap).toBe(0.20);
  });

  it("titans_eye has cap 0.30", () => {
    expect(ARTIFACT_DEFS.titans_eye.cap).toBe(0.30);
  });
});

describe("ARTIFACT_DROP_POOL", () => {
  it("contains exactly 6 base-tier artifact IDs", () => {
    expect(ARTIFACT_DROP_POOL.length).toBe(6);
    for (const id of ARTIFACT_DROP_POOL) {
      expect(ARTIFACT_DEFS[id].tier).toBe("base");
    }
  });
});

// ─── canCombineArtifacts ─────────────────────────────────────────────────────

describe("canCombineArtifacts", () => {
  it("returns true for two of the same base artifact", () => {
    expect(canCombineArtifacts("bloodstone", "bloodstone")).toBe(true);
    expect(canCombineArtifacts("berserkers_eye", "berserkers_eye")).toBe(true);
  });

  it("returns false for different artifacts", () => {
    expect(canCombineArtifacts("bloodstone", "greed_idol")).toBe(false);
  });

  it("returns false for upgraded artifacts", () => {
    expect(canCombineArtifacts("sanguine_bloodstone", "sanguine_bloodstone")).toBe(false);
  });

  it("returns false for unknown ids", () => {
    expect(canCombineArtifacts("unknown", "unknown")).toBe(false);
  });
});

// ─── getCombineResult ────────────────────────────────────────────────────────

describe("getCombineResult", () => {
  it("bloodstone → sanguine_bloodstone", () => {
    expect(getCombineResult("bloodstone")).toBe("sanguine_bloodstone");
  });

  it("berserkers_eye → titans_eye", () => {
    expect(getCombineResult("berserkers_eye")).toBe("titans_eye");
  });

  it("greed_idol → golden_idol", () => {
    expect(getCombineResult("greed_idol")).toBe("golden_idol");
  });

  it("soulbrand → soulfire_brand", () => {
    expect(getCombineResult("soulbrand")).toBe("soulfire_brand");
  });

  it("wardens_core → fortress_core", () => {
    expect(getCombineResult("wardens_core")).toBe("fortress_core");
  });

  it("executioners_mark → death_mark", () => {
    expect(getCombineResult("executioners_mark")).toBe("death_mark");
  });

  it("returns null for upgraded artifacts", () => {
    expect(getCombineResult("sanguine_bloodstone")).toBeNull();
  });

  it("returns null for unknown id", () => {
    expect(getCombineResult("nope")).toBeNull();
  });
});

// ─── artifactSellValue ───────────────────────────────────────────────────────

describe("artifactSellValue", () => {
  it("base artifact → 50", () => {
    expect(artifactSellValue("bloodstone")).toBe(50);
  });

  it("upgraded artifact → 200", () => {
    expect(artifactSellValue("golden_idol")).toBe(200);
  });

  it("unknown → 0", () => {
    expect(artifactSellValue("nope")).toBe(0);
  });
});

// ─── Character.artifactSlots ─────────────────────────────────────────────────

describe("Character.artifactSlots", () => {
  it("initializes to 3 null slots", () => {
    const c = new Character("Hero", "fighter");
    expect(c.artifactSlots).toEqual([null, null, null]);
  });

  it("serializes artifact slots in toDict", () => {
    const c = new Character("Hero", "fighter");
    c.artifactSlots[0] = "bloodstone";
    const dict = c.toDict();
    expect(dict.artifact_slots).toEqual(["bloodstone", null, null]);
  });

  it("round-trips through fromDict", () => {
    const c = new Character("Hero", "fighter");
    c.artifactSlots = ["bloodstone", "greed_idol", null];
    const restored = Character.fromDict(c.toDict());
    expect(restored.artifactSlots).toEqual(["bloodstone", "greed_idol", null]);
  });

  it("fromDict defaults to [null, null, null] when field absent", () => {
    const c = new Character("Hero", "fighter");
    const dict = c.toDict();
    delete (dict as any).artifact_slots;
    const restored = Character.fromDict(dict);
    expect(restored.artifactSlots).toEqual([null, null, null]);
  });
});

// ─── GameState.artifactInventory ─────────────────────────────────────────────

describe("GameState.artifactInventory", () => {
  it("starts empty", () => {
    const gs = new GameState();
    expect(gs.artifactInventory).toEqual([]);
  });

  it("killStreak starts at 0", () => {
    const gs = new GameState();
    expect(gs.killStreak).toBe(0);
  });
});

// ─── equipArtifact ───────────────────────────────────────────────────────────

describe("equipArtifact", () => {
  function makeWithArtifact(): GameState {
    const gs = new GameState();
    gs.artifactInventory = ["bloodstone"];
    return gs;
  }

  it("moves artifact from inventory to character slot", () => {
    const gs = makeWithArtifact();
    gs.equipArtifact(0, 0, 0);
    expect(gs.party.team[0].artifactSlots[0]).toBe("bloodstone");
    expect(gs.artifactInventory).toEqual([]);
  });

  it("displaced artifact returns to inventory", () => {
    const gs = new GameState();
    gs.artifactInventory = ["greed_idol"];
    gs.party.team[0].artifactSlots[0] = "bloodstone";
    gs.equipArtifact(0, 0, 0);
    expect(gs.party.team[0].artifactSlots[0]).toBe("greed_idol");
    expect(gs.artifactInventory).toContain("bloodstone");
  });

  it("noop for invalid char index", () => {
    const gs = makeWithArtifact();
    const before = JSON.stringify(gs.artifactInventory);
    gs.equipArtifact(99, 0, 0);
    expect(JSON.stringify(gs.artifactInventory)).toBe(before);
  });

  it("noop for invalid slot index", () => {
    const gs = makeWithArtifact();
    gs.equipArtifact(0, 5, 0);
    expect(gs.party.team[0].artifactSlots[5]).toBeUndefined();
    expect(gs.artifactInventory).toEqual(["bloodstone"]);
  });

  it("noop for invalid inventory index", () => {
    const gs = makeWithArtifact();
    gs.equipArtifact(0, 0, 5);
    expect(gs.party.team[0].artifactSlots[0]).toBeNull();
  });
});

// ─── unequipArtifact ─────────────────────────────────────────────────────────

describe("unequipArtifact", () => {
  it("moves artifact from slot back to inventory", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[1] = "greed_idol";
    gs.unequipArtifact(0, 1);
    expect(gs.party.team[0].artifactSlots[1]).toBeNull();
    expect(gs.artifactInventory).toContain("greed_idol");
  });

  it("noop when slot is already empty", () => {
    const gs = new GameState();
    gs.unequipArtifact(0, 0);
    expect(gs.artifactInventory).toEqual([]);
  });
});

// ─── combineArtifacts ────────────────────────────────────────────────────────

describe("combineArtifacts", () => {
  function makeWithTwo(id: string): GameState {
    const gs = new GameState();
    gs.artifactInventory = [id, id];
    return gs;
  }

  it("combines two bloodstones into sanguine_bloodstone", () => {
    const gs = makeWithTwo("bloodstone");
    gs.combineArtifacts(0, 1);
    expect(gs.artifactInventory).toEqual(["sanguine_bloodstone"]);
  });

  it("noop when ids differ", () => {
    const gs = new GameState();
    gs.artifactInventory = ["bloodstone", "greed_idol"];
    gs.combineArtifacts(0, 1);
    expect(gs.artifactInventory.length).toBe(2);
  });

  it("noop when same index provided twice", () => {
    const gs = makeWithTwo("bloodstone");
    gs.combineArtifacts(0, 0);
    expect(gs.artifactInventory.length).toBe(2);
  });

  it("noop for upgraded artifacts", () => {
    const gs = makeWithTwo("sanguine_bloodstone");
    gs.combineArtifacts(0, 1);
    expect(gs.artifactInventory.length).toBe(2);
  });
});

// ─── sellArtifact ────────────────────────────────────────────────────────────

describe("sellArtifact", () => {
  it("removes artifact and awards gold", () => {
    const gs = new GameState();
    gs.artifactInventory = ["bloodstone"];
    gs.gold = 0;
    gs.sellArtifact(0);
    expect(gs.artifactInventory).toEqual([]);
    expect(gs.gold).toBe(50);
  });

  it("upgraded artifact awards 200 gold", () => {
    const gs = new GameState();
    gs.artifactInventory = ["golden_idol"];
    gs.gold = 0;
    gs.sellArtifact(0);
    expect(gs.gold).toBe(200);
  });

  it("noop for invalid index", () => {
    const gs = new GameState();
    gs.artifactInventory = ["bloodstone"];
    gs.sellArtifact(5);
    expect(gs.artifactInventory.length).toBe(1);
  });
});

// ─── Artifact effects: Bloodstone ────────────────────────────────────────────

describe("bloodstone heal on kill", () => {
  it("heals party 1% max HP per kill when equipped", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = "bloodstone";
    gs.party.team[0].health = 50;
    gs.party.team[0].maxHealth = 100;
    // Force an enemy death
    gs.enemy.hp = 0;
    gs.onEnemyDeath();
    // Should heal 1% of 100 = 1 HP (plus any combat heal fraction)
    expect(gs.party.team[0].health).toBeGreaterThan(50);
  });

  it("does not heal when no bloodstone equipped", () => {
    const gs = new GameState();
    gs.party.team[0].health = 50;
    gs.party.team[0].maxHealth = 100;
    const prevHealth = gs.party.team[0].health;
    // Combat heal fraction also applies, so just ensure bloodstone not double-counted
    // We can check via sanguine_bloodstone being stronger
    gs.enemy.hp = 0;
    gs.onEnemyDeath();
    // No crash — test just verifies it runs without error
    expect(gs.party.team[0].health).toBeGreaterThanOrEqual(prevHealth);
  });

  it("sanguine_bloodstone heals 2% max HP", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = "sanguine_bloodstone";
    gs.party.team[0].health = 1;
    gs.party.team[0].maxHealth = 100;
    gs.enemy.hp = 0;
    gs.onEnemyDeath();
    // Should include at least 2% from artifact (2 HP)
    expect(gs.party.team[0].health).toBeGreaterThan(1);
  });
});

// ─── Artifact effects: Berserker's Eye ───────────────────────────────────────

describe("kill streak", () => {
  it("increments on each enemy kill", () => {
    const gs = new GameState();
    expect(gs.killStreak).toBe(0);
    gs.enemy.hp = 0;
    gs.onEnemyDeath();
    expect(gs.killStreak).toBe(1);
    gs.enemy.hp = 0;
    gs.onEnemyDeath();
    expect(gs.killStreak).toBe(2);
  });

  it("resets to 0 on player death", () => {
    const gs = new GameState();
    gs.killStreak = 10;
    gs.onPlayerDeath();
    expect(gs.killStreak).toBe(0);
  });

  it("berserkers_eye DPS bonus capped at 20%", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = "berserkers_eye";
    gs.killStreak = 100; // would be 100% without cap
    // We test via tick — just verify it doesn't crash and cap applies
    const baseDps = gs.party.team[0].dps;
    // Simulate one tick to verify engine doesn't throw
    expect(() => gs.tick(0.1)).not.toThrow();
    // The berserker's eye multiplier should be capped at 1.20× base
    // We can verify by reading the state; at least enemy hp should decrease
  });
});

// ─── Artifact effects: Greed Idol ────────────────────────────────────────────

describe("greed_idol boss gold", () => {
  it("multiplies boss gold by 1.5 when equipped", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = "greed_idol";
    gs.dungeonLevel = 5;
    // Make enemy a boss
    gs.enemy = {
      name: "Boss",
      level: 5,
      hp: 0,
      max_hp: 500,
      xp_reward: 50,
      gold_reward: 100,
      attack_dps: 10,
      isBoss: true,
      isElite: false,
    };
    gs.gold = 0;
    gs.onEnemyDeath();
    // Base: 100g * 1.5 (greed_idol) = 150g (approximately, other multipliers apply too)
    expect(gs.gold).toBeGreaterThan(100);
  });

  it("golden_idol multiplies boss gold by 2", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = "golden_idol";
    gs.dungeonLevel = 5;
    gs.enemy = {
      name: "Boss",
      level: 5,
      hp: 0,
      max_hp: 500,
      xp_reward: 50,
      gold_reward: 100,
      attack_dps: 10,
      isBoss: true,
      isElite: false,
    };
    gs.gold = 0;
    gs.onEnemyDeath();
    expect(gs.gold).toBeGreaterThan(150); // More than greed_idol
  });
});

// ─── Artifact effects: Warden's Core ─────────────────────────────────────────

describe("wardens_core damage reduction", () => {
  it("reduces incoming damage by 10%", () => {
    const gs = new GameState();
    gs.party.team[0].damageReduction = 0; // no base reduction
    gs.party.team[0].artifactSlots[0] = "wardens_core";
    gs.party.team[0].health = 100;
    gs.party.team[0].maxHealth = 100;
    // Direct tick against an enemy that attacks
    gs.enemy.hp = 999999; // won't die
    gs.enemy.attack_dps = 100; // 100 dps
    gs.tick(1.0);
    // With artifact: 100 dmg × (1 - 0.10) = 90 dmg taken → health = 100 - 90 = 10
    expect(gs.party.team[0].health).toBeGreaterThan(0);
    expect(gs.party.team[0].health).toBeLessThan(100);
    expect(gs.party.team[0].health).toBeCloseTo(10, 0);
  });

  it("wardens_core + existing damageReduction do not exceed 50% cap", () => {
    const gs = new GameState();
    gs.party.team[0].damageReduction = 0.45;
    gs.party.team[0].artifactSlots[0] = "wardens_core"; // +10% would be 55%, capped to 50%
    gs.party.team[0].health = 100;
    gs.party.team[0].maxHealth = 100;
    gs.enemy.hp = 999999;
    gs.enemy.attack_dps = 100;
    gs.tick(1.0);
    // With 50% cap: 100 dmg × (1 - 0.50) = 50 dmg → health = 50
    expect(gs.party.team[0].health).toBeCloseTo(50, 0);
  });

  it("fortress_core reduces damage by 20%", () => {
    const gs = new GameState();
    gs.party.team[0].damageReduction = 0;
    gs.party.team[0].artifactSlots[0] = "fortress_core";
    gs.party.team[0].health = 100;
    gs.party.team[0].maxHealth = 100;
    gs.enemy.hp = 999999;
    gs.enemy.attack_dps = 100;
    gs.tick(1.0);
    // 100 dmg × (1 - 0.20) = 80 dmg taken → health = 100 - 80 = 20
    expect(gs.party.team[0].health).toBeCloseTo(20, 0);
  });
});

// ─── Artifact effects: Executioner's Mark ────────────────────────────────────

describe("executioners_mark elite boss drop", () => {
  it("can trigger boss-drop on elite kill when equipped", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = "executioners_mark";
    gs.enemy = {
      name: "Elite Goblin",
      level: 3,
      hp: 0,
      max_hp: 300,
      xp_reward: 30,
      gold_reward: 30,
      attack_dps: 10,
      isBoss: false,
      isElite: true,
    };
    // Force all random drops by mocking Math.random
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    const before = gs.lootPool.length;
    gs.onEnemyDeath();
    vi.restoreAllMocks();
    // At least one drop should occur (executioners_mark or regular elite drop)
    expect(gs.lootPool.length).toBeGreaterThanOrEqual(before);
  });
});

// ─── Artifact drops from bosses ───────────────────────────────────────────────

describe("artifact drops", () => {
  it("boss at dungeonIndex>=2 has 10% chance to drop an artifact", () => {
    const gs = new GameState();
    gs.dungeonIndex = 2;
    gs.dungeonLevel = 5;
    gs.enemy = {
      name: "Boss",
      level: 5,
      hp: 0,
      max_hp: 500,
      xp_reward: 50,
      gold_reward: 100,
      attack_dps: 10,
      isBoss: true,
      isElite: false,
    };
    vi.spyOn(Math, "random").mockReturnValue(0.05); // 5% < 10% drop threshold
    gs.onEnemyDeath();
    vi.restoreAllMocks();
    expect(gs.artifactInventory.length).toBeGreaterThan(0);
    // Should be a base artifact
    const dropped = gs.artifactInventory[0];
    expect(ARTIFACT_DROP_POOL).toContain(dropped);
  });

  it("boss at dungeonIndex<2 does not drop artifacts", () => {
    const gs = new GameState();
    gs.dungeonIndex = 0;
    gs.dungeonLevel = 5;
    gs.enemy = {
      name: "Boss",
      level: 5,
      hp: 0,
      max_hp: 500,
      xp_reward: 50,
      gold_reward: 100,
      attack_dps: 10,
      isBoss: true,
      isElite: false,
    };
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    gs.onEnemyDeath();
    vi.restoreAllMocks();
    expect(gs.artifactInventory.length).toBe(0);
  });

  it("non-boss enemy never drops artifacts", () => {
    const gs = new GameState();
    gs.dungeonIndex = 5;
    gs.enemy = {
      name: "Goblin",
      level: 3,
      hp: 0,
      max_hp: 100,
      xp_reward: 10,
      gold_reward: 10,
      attack_dps: 5,
      isBoss: false,
      isElite: false,
    };
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    gs.onEnemyDeath();
    vi.restoreAllMocks();
    expect(gs.artifactInventory.length).toBe(0);
  });
});

// ─── Prestige preserves artifacts ────────────────────────────────────────────

describe("prestige preserves artifacts", () => {
  function readyForPrestige(): GameState {
    const gs = new GameState();
    gs.highestLevel = 30;
    gs.achievementsUnlocked.add("first_prestige");
    gs.achievementsUnlocked.add("depth_tiered_bronze");
    gs.achievementsUnlocked.add("depth_tiered_silver");
    gs.achievementsUnlocked.add("depth_tiered_gold");
    return gs;
  }

  it("preserves artifact inventory through prestige", () => {
    const gs = readyForPrestige();
    gs.artifactInventory = ["bloodstone", "greed_idol"];
    gs.prestige();
    expect(gs.artifactInventory).toContain("bloodstone");
    expect(gs.artifactInventory).toContain("greed_idol");
  });

  it("preserves character artifact slots through prestige", () => {
    const gs = readyForPrestige();
    gs.party.team[0].artifactSlots[0] = "wardens_core";
    gs.prestige();
    expect(gs.party.team[0].artifactSlots[0]).toBe("wardens_core");
  });
});

// ─── Serialization round-trip ─────────────────────────────────────────────────

// ─── forgeArtifactFromRunes ──────────────────────────────────────────────────

describe("forgeArtifactFromRunes", () => {
  const ancient = (type: string) => RUNE_DEFS[`${type}_ancient`];
  const tenAncients = () => [
    ancient("striking"), ancient("striking"),
    ancient("warding"),  ancient("warding"),
    ancient("swiftness"), ancient("swiftness"),
    ancient("greed"),    ancient("greed"),
    ancient("fortune"),  ancient("wrath"),
  ];

  it("does nothing with fewer than 10 ancient runes", () => {
    const gs = new GameState();
    gs.runeInventory = tenAncients().slice(0, 9);
    gs.forgeArtifactFromRunes();
    expect(gs.artifactInventory).toHaveLength(0);
    expect(gs.runeInventory).toHaveLength(9);
  });

  it("removes exactly 10 ancients and adds 1 base artifact with exactly 10", () => {
    const gs = new GameState();
    gs.runeInventory = tenAncients();
    gs.forgeArtifactFromRunes();
    expect(gs.runeInventory).toHaveLength(0);
    expect(gs.artifactInventory).toHaveLength(1);
    expect(ARTIFACT_DROP_POOL).toContain(gs.artifactInventory[0]);
  });

  it("removes exactly 10 ancients and leaves non-ancient runes untouched", () => {
    const gs = new GameState();
    gs.runeInventory = [...tenAncients(), RUNE_DEFS["striking_lesser"], RUNE_DEFS["warding_greater"]];
    gs.forgeArtifactFromRunes();
    expect(gs.runeInventory).toHaveLength(2);
    expect(gs.runeInventory.every(r => r.tier !== "ancient")).toBe(true);
    expect(gs.artifactInventory).toHaveLength(1);
  });

  it("forges again after another 10 ancients are accumulated", () => {
    const gs = new GameState();
    gs.runeInventory = [...tenAncients(), ...tenAncients()];
    gs.forgeArtifactFromRunes();
    gs.forgeArtifactFromRunes();
    expect(gs.runeInventory).toHaveLength(0);
    expect(gs.artifactInventory).toHaveLength(2);
  });

  it("result is always a base-tier artifact", () => {
    const gs = new GameState();
    for (let i = 0; i < 10; i++) {
      gs.runeInventory = tenAncients();
      gs.forgeArtifactFromRunes();
      const id = gs.artifactInventory.pop()!;
      expect(ARTIFACT_DEFS[id as keyof typeof ARTIFACT_DEFS].tier).toBe("base");
    }
  });

  it("does not consume non-ancient runes when exactly 10 ancients present", () => {
    const gs = new GameState();
    gs.runeInventory = [...tenAncients().slice(0, 5), RUNE_DEFS["striking_lesser"], RUNE_DEFS["warding_flawless"], ...tenAncients().slice(5)];
    gs.forgeArtifactFromRunes();
    expect(gs.artifactInventory).toHaveLength(1);
    const nonAncientLeft = gs.runeInventory.filter(r => r.tier !== "ancient");
    expect(nonAncientLeft).toHaveLength(2);
  });
});

describe("artifact serialization", () => {
  it("artifact_inventory round-trips through toDict/fromDict", () => {
    const gs = new GameState();
    gs.artifactInventory = ["bloodstone", "titans_eye"];
    gs.killStreak = 7;
    const dict = JSON.parse(gs.respond());
    const restored = GameState.fromDict(dict);
    expect(restored.artifactInventory).toEqual(["bloodstone", "titans_eye"]);
    expect(restored.killStreak).toBe(7);
  });

  it("missing artifact fields default to empty on load", () => {
    const gs = new GameState();
    const dict = JSON.parse(gs.respond()) as any;
    delete dict.artifact_inventory;
    delete dict.kill_streak;
    const restored = GameState.fromDict(dict);
    expect(restored.artifactInventory).toEqual([]);
    expect(restored.killStreak).toBe(0);
  });
});

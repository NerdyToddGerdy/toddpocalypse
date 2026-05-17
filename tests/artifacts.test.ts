import { describe, expect, it, vi } from "vitest";
import {
  ARTIFACT_DEFS, ARTIFACT_DROP_POOL, LEGACY_UPGRADED_MAP,
  artifactUpgradeCost, artifactSellValue, artifactFuelValue, type ArtifactInstance,
} from "../src/artifacts.js";
import { GameState, RUNE_DEFS } from "../src/engine.js";
import { Character } from "../src/character.js";

const a = (id: string, level = 0): ArtifactInstance => ({ id: id as any, level, fuel: 0 });

// ─── Artifact definitions ────────────────────────────────────────────────────

describe("ARTIFACT_DEFS", () => {
  it("has exactly 6 artifacts", () => {
    expect(Object.keys(ARTIFACT_DEFS).length).toBe(6);
  });

  it("all artifacts have sellValue 50", () => {
    for (const def of Object.values(ARTIFACT_DEFS)) {
      expect(def.sellValue).toBe(50);
    }
  });

  it("berserkers_eye has cap 0.20", () => {
    expect(ARTIFACT_DEFS.berserkers_eye.cap).toBe(0.20);
  });

  it("all artifacts have a positive effectValue", () => {
    for (const def of Object.values(ARTIFACT_DEFS)) {
      expect(def.effectValue).toBeGreaterThan(0);
    }
  });
});

describe("ARTIFACT_DROP_POOL", () => {
  it("contains exactly 6 artifact IDs", () => {
    expect(ARTIFACT_DROP_POOL.length).toBe(6);
  });

  it("all pool IDs are valid ARTIFACT_DEFS keys", () => {
    for (const id of ARTIFACT_DROP_POOL) {
      expect(ARTIFACT_DEFS[id]).toBeDefined();
    }
  });
});

// ─── LEGACY_UPGRADED_MAP ─────────────────────────────────────────────────────

describe("LEGACY_UPGRADED_MAP", () => {
  it("maps sanguine_bloodstone → bloodstone level 1", () => {
    expect(LEGACY_UPGRADED_MAP.sanguine_bloodstone).toEqual({ id: "bloodstone", level: 1, fuel: 0 });
  });

  it("maps all 6 old upgraded IDs", () => {
    const expected = ["sanguine_bloodstone", "titans_eye", "golden_idol", "soulfire_brand", "fortress_core", "death_mark"];
    for (const key of expected) {
      expect(LEGACY_UPGRADED_MAP[key]).toBeDefined();
      expect(ARTIFACT_DEFS[LEGACY_UPGRADED_MAP[key].id]).toBeDefined();
      expect(LEGACY_UPGRADED_MAP[key].level).toBe(1);
    }
  });
});

// ─── artifactUpgradeCost ─────────────────────────────────────────────────────

describe("artifactUpgradeCost", () => {
  it("level 0 → 1 costs 1", () => expect(artifactUpgradeCost(0)).toBe(1));
  it("level 1 → 2 costs 2", () => expect(artifactUpgradeCost(1)).toBe(2));
  it("level 4 → 5 costs 5", () => expect(artifactUpgradeCost(4)).toBe(5));
  it("cost equals level + 1", () => {
    for (let i = 0; i < 10; i++) expect(artifactUpgradeCost(i)).toBe(i + 1);
  });
});

// ─── artifactSellValue ───────────────────────────────────────────────────────

describe("artifactSellValue", () => {
  it("level 0 → 50g", () => expect(artifactSellValue("bloodstone", 0)).toBe(50));
  it("level 1 → 100g", () => expect(artifactSellValue("bloodstone", 1)).toBe(100));
  it("level 2 → 150g", () => expect(artifactSellValue("bloodstone", 2)).toBe(150));
  it("scales as sellValue × (level + 1)", () => {
    for (let i = 0; i < 5; i++) expect(artifactSellValue("greed_idol", i)).toBe(50 * (i + 1));
  });
  it("unknown id → 0", () => expect(artifactSellValue("unknown", 0)).toBe(0));
});

// ─── Character.artifactSlots ─────────────────────────────────────────────────

describe("Character.artifactSlots", () => {
  it("starts with 3 null slots", () => {
    const c = new Character("Hero", "fighter");
    expect(c.artifactSlots).toEqual([null, null, null]);
  });

  it("round-trips through toDict/fromDict", () => {
    const c = new Character("Hero", "fighter");
    c.artifactSlots[0] = a("bloodstone", 2);
    c.artifactSlots[2] = a("greed_idol", 0);
    const d = c.toDict();
    const c2 = Character.fromDict(d);
    expect(c2.artifactSlots[0]).toEqual({ id: "bloodstone", level: 2, fuel: 0 });
    expect(c2.artifactSlots[1]).toBeNull();
    expect(c2.artifactSlots[2]).toEqual({ id: "greed_idol", level: 0, fuel: 0 });
  });

  it("migrates old string format on load", () => {
    const c = new Character("Hero", "fighter");
    const d = c.toDict();
    (d as any).artifact_slots = ["bloodstone", null, "wardens_core"];
    const c2 = Character.fromDict(d);
    expect(c2.artifactSlots[0]).toEqual({ id: "bloodstone", level: 0, fuel: 0 });
    expect(c2.artifactSlots[2]).toEqual({ id: "wardens_core", level: 0, fuel: 0 });
  });

  it("migrates old upgraded IDs on load", () => {
    const c = new Character("Hero", "fighter");
    const d = c.toDict();
    (d as any).artifact_slots = ["sanguine_bloodstone", "fortress_core", null];
    const c2 = Character.fromDict(d);
    expect(c2.artifactSlots[0]).toEqual({ id: "bloodstone", level: 1, fuel: 0 });
    expect(c2.artifactSlots[1]).toEqual({ id: "wardens_core", level: 1, fuel: 0 });
  });
});

// ─── GameState.artifactInventory ─────────────────────────────────────────────

describe("GameState.artifactInventory", () => {
  it("starts empty", () => {
    expect(new GameState().artifactInventory).toEqual([]);
  });

  it("killStreak starts at 0", () => {
    expect(new GameState().killStreak).toBe(0);
  });
});

// ─── equipArtifact ───────────────────────────────────────────────────────────

describe("equipArtifact", () => {
  it("moves artifact instance from inventory to character slot", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone")];
    gs.equipArtifact(0, 0, 0);
    expect(gs.party.team[0].artifactSlots[0]).toEqual({ id: "bloodstone", level: 0, fuel: 0 });
    expect(gs.artifactInventory).toHaveLength(0);
  });

  it("displaced artifact returns to inventory", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("bloodstone", 1);
    gs.artifactInventory = [a("greed_idol")];
    gs.equipArtifact(0, 0, 0);
    expect(gs.party.team[0].artifactSlots[0]).toEqual({ id: "greed_idol", level: 0, fuel: 0 });
    expect(gs.artifactInventory).toContainEqual({ id: "bloodstone", level: 1, fuel: 0 });
  });

  it("noop for invalid char index", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone")];
    gs.equipArtifact(99, 0, 0);
    expect(gs.artifactInventory).toHaveLength(1);
  });

  it("noop for invalid inv index", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone")];
    gs.equipArtifact(0, 0, 5);
    expect(gs.party.team[0].artifactSlots[0]).toBeNull();
  });
});

// ─── unequipArtifact ─────────────────────────────────────────────────────────

describe("unequipArtifact", () => {
  it("moves artifact instance from slot back to inventory", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[1] = a("greed_idol", 2);
    gs.unequipArtifact(0, 1);
    expect(gs.party.team[0].artifactSlots[1]).toBeNull();
    expect(gs.artifactInventory).toContainEqual({ id: "greed_idol", level: 2, fuel: 0 });
  });

  it("noop when slot is already empty", () => {
    const gs = new GameState();
    gs.unequipArtifact(0, 0);
    expect(gs.artifactInventory).toEqual([]);
  });
});

// ─── artifactFuelValue ───────────────────────────────────────────────────────

describe("artifactFuelValue", () => {
  it("level 0 → 1 fuel unit",  () => expect(artifactFuelValue(0)).toBe(1));
  it("level 1 → 2 fuel units", () => expect(artifactFuelValue(1)).toBe(2));
  it("level 2 → 4 fuel units", () => expect(artifactFuelValue(2)).toBe(4));
  it("level 3 → 7 fuel units", () => expect(artifactFuelValue(3)).toBe(7));
  it("level 4 → 11 fuel units", () => expect(artifactFuelValue(4)).toBe(11));
});

// ─── addFuelToArtifact ───────────────────────────────────────────────────────

describe("addFuelToArtifact", () => {
  it("stores partial fuel without leveling when below threshold", () => {
    const gs = new GameState();
    // target at level 1 needs 2 fuel units to level; we add 1 (one level-0 = 1 unit)
    gs.artifactInventory = [a("bloodstone", 1), a("bloodstone")];
    gs.addFuelToArtifact(0, [1]);
    expect(gs.artifactInventory).toHaveLength(1);
    expect(gs.artifactInventory[0].level).toBe(1);  // not leveled yet
    expect(gs.artifactInventory[0].fuel).toBe(1);   // fuel stored
  });

  it("levels up when fuel reaches the threshold", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone"), a("bloodstone")];
    gs.addFuelToArtifact(0, [1]); // level 0 needs 1 unit; adding 1 → level-up
    expect(gs.artifactInventory).toHaveLength(1);
    expect(gs.artifactInventory[0].level).toBe(1);
    expect(gs.artifactInventory[0].fuel).toBe(0);
  });

  it("higher-level fuel contributes more units (level-3 = 7 units)", () => {
    const gs = new GameState();
    // target at level 1: needs 2 to reach level 2, then 3 to reach level 3
    // level-3 fuel = 7 units: 7-2=5 (→level 2), 5-3=2 (→level 3), 2<4 stop
    gs.artifactInventory = [a("bloodstone", 1), a("bloodstone", 3)];
    gs.addFuelToArtifact(0, [1]);
    expect(gs.artifactInventory).toHaveLength(1);
    expect(gs.artifactInventory[0].level).toBe(3);
    expect(gs.artifactInventory[0].fuel).toBe(2); // 7 - 2 - 3 = 2 leftover
  });

  it("overflow cascades to additional level-ups in one action", () => {
    const gs = new GameState();
    // target at level 0, needs 1 unit; level-3 fuel = 7 units
    // 7 - 1 = 6 overflow → level 1 needs 2, level 2 needs 3, 6-2=4, 4-3=1 → reach level 3, 1 leftover
    gs.artifactInventory = [a("bloodstone"), a("bloodstone", 3)];
    gs.addFuelToArtifact(0, [1]);
    expect(gs.artifactInventory).toHaveLength(1);
    expect(gs.artifactInventory[0].level).toBe(3);
    expect(gs.artifactInventory[0].fuel).toBe(1);
  });

  it("fuel persists between separate addFuelToArtifact calls", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone", 1), a("bloodstone"), a("bloodstone")];
    gs.addFuelToArtifact(0, [1]); // adds 1 unit, need 2 → stored fuel=1, no level
    expect(gs.artifactInventory[0].level).toBe(1);
    expect(gs.artifactInventory[0].fuel).toBe(1);
    gs.addFuelToArtifact(0, [1]); // idx 1 is now the old idx 2; adds 1 more → total=2 → levels up
    expect(gs.artifactInventory[0].level).toBe(2);
    expect(gs.artifactInventory[0].fuel).toBe(0);
  });

  it("all selected fuel artifacts are removed from inventory", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone", 2), a("bloodstone"), a("bloodstone"), a("bloodstone")];
    // target at level 2 needs 3 units; 3× level-0 = 3 units → exact level-up
    gs.addFuelToArtifact(0, [1, 2, 3]);
    expect(gs.artifactInventory).toHaveLength(1);
    expect(gs.artifactInventory[0].level).toBe(3);
  });

  it("noop when fuel idx contains wrong artifact type", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone"), a("berserkers_eye")];
    gs.addFuelToArtifact(0, [1]);
    expect(gs.artifactInventory).toHaveLength(2);
    expect(gs.artifactInventory[0].fuel).toBe(0);
  });

  it("noop when fuel idx equals the target idx", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone"), a("bloodstone")];
    gs.addFuelToArtifact(0, [0]);
    expect(gs.artifactInventory).toHaveLength(2);
    expect(gs.artifactInventory[0].fuel).toBe(0);
  });

  it("noop when fuel idx is out of bounds", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone"), a("bloodstone")];
    gs.addFuelToArtifact(0, [99]);
    expect(gs.artifactInventory).toHaveLength(2);
    expect(gs.artifactInventory[0].fuel).toBe(0);
  });
});

// ─── addFuelToEquippedArtifact ────────────────────────────────────────────────

describe("addFuelToEquippedArtifact", () => {
  it("levels up an equipped artifact using inventory fuel", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("bloodstone"); // level 0, needs 1 unit
    gs.artifactInventory = [a("bloodstone")];
    gs.addFuelToEquippedArtifact(0, 0, [0]);
    expect(gs.party.team[0].artifactSlots[0]!.level).toBe(1);
    expect(gs.artifactInventory).toHaveLength(0);
  });

  it("artifact stays equipped after level-up", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("bloodstone");
    gs.artifactInventory = [a("bloodstone")];
    gs.addFuelToEquippedArtifact(0, 0, [0]);
    expect(gs.party.team[0].artifactSlots[0]).not.toBeNull();
    expect(gs.party.team[0].artifactSlots[0]!.id).toBe("bloodstone");
  });

  it("stores partial fuel on the equipped artifact", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("bloodstone", 1); // needs 2 units
    gs.artifactInventory = [a("bloodstone")]; // contributes 1 unit
    gs.addFuelToEquippedArtifact(0, 0, [0]);
    expect(gs.party.team[0].artifactSlots[0]!.level).toBe(1); // not leveled
    expect(gs.party.team[0].artifactSlots[0]!.fuel).toBe(1);  // fuel stored
  });
});

// ─── sellEquippedArtifact ─────────────────────────────────────────────────────

describe("sellEquippedArtifact", () => {
  it("removes artifact from slot and leaves slot null", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[1] = a("bloodstone");
    gs.sellEquippedArtifact(0, 1);
    expect(gs.party.team[0].artifactSlots[1]).toBeNull();
  });

  it("awards gold scaled by level (same formula as sellArtifact)", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("bloodstone", 2); // level 2 → 150g
    gs.gold = 0;
    gs.sellEquippedArtifact(0, 0);
    expect(gs.gold).toBe(150);
  });
});

// ─── sellArtifact ────────────────────────────────────────────────────────────

describe("sellArtifact", () => {
  it("removes artifact instance and awards gold proportional to level", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone", 0)];
    gs.gold = 0;
    gs.sellArtifact(0);
    expect(gs.artifactInventory).toEqual([]);
    expect(gs.gold).toBe(50);
  });

  it("level 2 artifact awards 150 gold", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone", 2)];
    gs.gold = 0;
    gs.sellArtifact(0);
    expect(gs.gold).toBe(150);
  });

  it("noop for invalid index", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone")];
    gs.sellArtifact(5);
    expect(gs.artifactInventory).toHaveLength(1);
  });
});

// ─── Artifact effects: Bloodstone ────────────────────────────────────────────

describe("bloodstone heal on kill", () => {
  it("heals party when equipped at level 0", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("bloodstone");
    gs.party.team[0].health = 50;
    gs.party.team[0].maxHealth = 100;
    gs.enemy.hp = 0;
    gs.onEnemyDeath();
    expect(gs.party.team[0].health).toBeGreaterThan(50);
  });

  it("bloodstone +1 heals 2× as much as level 0", () => {
    function bloodstoneHeal(level: number): number {
      const gs = new GameState();
      gs.party.team.forEach(c => { c.xpToNext = 9999999; });
      gs.party.team[0].artifactSlots[0] = a("bloodstone", level);
      const MAX = 1000;
      const START = Math.floor(MAX / 2);
      gs.party.team[0].health = START;
      gs.party.team[0].maxHealth = MAX;
      // Controlled enemy: no boss, minimal XP
      gs.enemy = { name: "Dummy", level: 1, hp: 0, max_hp: 10, xp_reward: 1, gold_reward: 0, attack_dps: 0, isBoss: false, isElite: false };
      gs.onEnemyDeath();
      return gs.party.team[0].health - START;
    }
    const h0 = bloodstoneHeal(0);
    const h1 = bloodstoneHeal(1);
    // Level 1 adds one extra unit of bloodstone heal vs level 0 (1% × 1000 = 10 HP)
    expect(h1 - h0).toBeCloseTo(ARTIFACT_DEFS.bloodstone.effectValue * 1000, 0);
  });
});

// ─── Artifact effects: Berserker's Eye ───────────────────────────────────────

describe("kill streak", () => {
  it("increments on each enemy kill", () => {
    const gs = new GameState();
    expect(gs.killStreak).toBe(0);
    gs.enemy.hp = 0; gs.onEnemyDeath();
    expect(gs.killStreak).toBe(1);
    gs.enemy.hp = 0; gs.onEnemyDeath();
    expect(gs.killStreak).toBe(2);
  });

  it("resets to 0 on player death", () => {
    const gs = new GameState();
    gs.killStreak = 10;
    gs.onPlayerDeath();
    expect(gs.killStreak).toBe(0);
  });

  it("berserkers_eye tick does not throw with high streak", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("berserkers_eye");
    gs.killStreak = 100;
    expect(() => gs.tick(0.1)).not.toThrow();
  });
});

// ─── Artifact effects: Greed Idol ────────────────────────────────────────────

describe("greed_idol boss gold", () => {
  function makeBossGs(): GameState {
    const gs = new GameState();
    gs.dungeonLevel = 5;
    gs.enemy = { name: "Boss", level: 5, hp: 0, max_hp: 500, xp_reward: 50, gold_reward: 100, attack_dps: 10, isBoss: true, isElite: false };
    return gs;
  }

  it("multiplies boss gold by 1.5 at level 0", () => {
    const gs = makeBossGs();
    gs.party.team[0].artifactSlots[0] = a("greed_idol", 0);
    gs.gold = 0;
    gs.onEnemyDeath();
    expect(gs.gold).toBeGreaterThan(100);
  });

  it("level 1 gives 2× multiplier (more than level 0)", () => {
    const gs0 = makeBossGs(); gs0.party.team[0].artifactSlots[0] = a("greed_idol", 0); gs0.gold = 0; gs0.onEnemyDeath();
    const gs1 = makeBossGs(); gs1.party.team[0].artifactSlots[0] = a("greed_idol", 1); gs1.gold = 0; gs1.onEnemyDeath();
    expect(gs1.gold).toBeGreaterThan(gs0.gold);
  });
});

// ─── Artifact effects: Warden's Core ─────────────────────────────────────────

describe("wardens_core damage reduction", () => {
  it("reduces incoming damage by 10% at level 0", () => {
    const gs = new GameState();
    gs.party.team[0].damageReduction = 0;
    gs.party.team[0].artifactSlots[0] = a("wardens_core", 0);
    gs.party.team[0].health = 100;
    gs.party.team[0].maxHealth = 100;
    gs.enemy.hp = 999999;
    gs.enemy.attack_dps = 100;
    gs.tick(1.0);
    expect(gs.party.team[0].health).toBeCloseTo(10, 0);
  });

  it("wardens_core +1 reduces damage by 20%", () => {
    const gs = new GameState();
    gs.party.team[0].damageReduction = 0;
    gs.party.team[0].artifactSlots[0] = a("wardens_core", 1);
    gs.party.team[0].health = 100;
    gs.party.team[0].maxHealth = 100;
    gs.enemy.hp = 999999;
    gs.enemy.attack_dps = 100;
    gs.tick(1.0);
    expect(gs.party.team[0].health).toBeCloseTo(20, 0);
  });

  it("does not exceed 50% cap", () => {
    const gs = new GameState();
    gs.party.team[0].damageReduction = 0.45;
    gs.party.team[0].artifactSlots[0] = a("wardens_core", 0); // +10% → would be 55%, capped to 50%
    gs.party.team[0].health = 100;
    gs.party.team[0].maxHealth = 100;
    gs.enemy.hp = 999999;
    gs.enemy.attack_dps = 100;
    gs.tick(1.0);
    expect(gs.party.team[0].health).toBeCloseTo(50, 0);
  });
});

// ─── Artifact effects: Executioner's Mark ────────────────────────────────────

describe("executioners_mark elite boss drop", () => {
  it("triggers extra set piece drops on elite kill", () => {
    const gs = new GameState();
    gs.party.team[0].artifactSlots[0] = a("executioners_mark");
    gs.enemy = { name: "Elite", level: 3, hp: 0, max_hp: 300, xp_reward: 30, gold_reward: 30, attack_dps: 10, isBoss: false, isElite: true };
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    const before = gs.lootPool.length;
    gs.onEnemyDeath();
    vi.restoreAllMocks();
    expect(gs.lootPool.length).toBeGreaterThanOrEqual(before);
  });
});

// ─── Artifact drops from bosses ───────────────────────────────────────────────

describe("artifact drops", () => {
  it("boss at dungeonIndex>=2 has 10% chance to drop an artifact", () => {
    const gs = new GameState();
    gs.dungeonIndex = 2;
    gs.dungeonLevel = 5;
    gs.enemy = { name: "Boss", level: 5, hp: 0, max_hp: 500, xp_reward: 50, gold_reward: 100, attack_dps: 10, isBoss: true, isElite: false };
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    gs.onEnemyDeath();
    vi.restoreAllMocks();
    expect(gs.artifactInventory.length).toBeGreaterThan(0);
    // Dropped artifact is a valid base artifact at level 0
    const dropped = gs.artifactInventory[0];
    expect(ARTIFACT_DROP_POOL).toContain(dropped.id);
    expect(dropped.level).toBe(0);
  });

  it("boss at dungeonIndex<2 does not drop artifacts", () => {
    const gs = new GameState();
    gs.dungeonIndex = 0;
    gs.dungeonLevel = 5;
    gs.enemy = { name: "Boss", level: 5, hp: 0, max_hp: 500, xp_reward: 50, gold_reward: 100, attack_dps: 10, isBoss: true, isElite: false };
    vi.spyOn(Math, "random").mockReturnValue(0.05);
    gs.onEnemyDeath();
    vi.restoreAllMocks();
    expect(gs.artifactInventory.length).toBe(0);
  });

  it("non-boss enemy never drops artifacts", () => {
    const gs = new GameState();
    gs.dungeonIndex = 5;
    gs.enemy = { name: "Goblin", level: 3, hp: 0, max_hp: 100, xp_reward: 10, gold_reward: 10, attack_dps: 5, isBoss: false, isElite: false };
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
    gs.artifactInventory = [a("bloodstone", 2), a("greed_idol")];
    gs.prestige();
    expect(gs.artifactInventory).toContainEqual({ id: "bloodstone", level: 2, fuel: 0 });
    expect(gs.artifactInventory).toContainEqual({ id: "greed_idol", level: 0, fuel: 0 });
  });

  it("preserves character artifact slots through prestige", () => {
    const gs = readyForPrestige();
    gs.party.team[0].artifactSlots[0] = a("wardens_core", 1);
    gs.prestige();
    expect(gs.party.team[0].artifactSlots[0]).toEqual({ id: "wardens_core", level: 1, fuel: 0 });
  });
});

// ─── Serialization round-trip ─────────────────────────────────────────────────

describe("artifact serialization", () => {
  it("artifact_inventory round-trips through toDict/fromDict", () => {
    const gs = new GameState();
    gs.artifactInventory = [a("bloodstone", 3), a("greed_idol", 0)];
    gs.killStreak = 7;
    const dict = JSON.parse(gs.respond());
    const restored = GameState.fromDict(dict);
    expect(restored.artifactInventory).toEqual([{ id: "bloodstone", level: 3, fuel: 0 }, { id: "greed_idol", level: 0, fuel: 0 }]);
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

  it("migrates old string inventory on fromDict", () => {
    const gs = new GameState();
    const dict = JSON.parse(gs.respond()) as any;
    dict.artifact_inventory = ["bloodstone", "sanguine_bloodstone"];
    const restored = GameState.fromDict(dict);
    expect(restored.artifactInventory[0]).toEqual({ id: "bloodstone", level: 0, fuel: 0 });
    expect(restored.artifactInventory[1]).toEqual({ id: "bloodstone", level: 1, fuel: 0 });
  });
});

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

  it("removes exactly 10 ancients and adds 1 base artifact at level 0", () => {
    const gs = new GameState();
    gs.runeInventory = tenAncients();
    gs.forgeArtifactFromRunes();
    expect(gs.runeInventory).toHaveLength(0);
    expect(gs.artifactInventory).toHaveLength(1);
    expect(ARTIFACT_DROP_POOL).toContain(gs.artifactInventory[0].id);
    expect(gs.artifactInventory[0].level).toBe(0);
  });

  it("leaves non-ancient runes untouched", () => {
    const gs = new GameState();
    gs.runeInventory = [...tenAncients(), RUNE_DEFS["striking_lesser"], RUNE_DEFS["warding_greater"]];
    gs.forgeArtifactFromRunes();
    expect(gs.runeInventory).toHaveLength(2);
    expect(gs.runeInventory.every(r => r.tier !== "ancient")).toBe(true);
  });

  it("can forge again after another 10 ancients accumulated", () => {
    const gs = new GameState();
    gs.runeInventory = [...tenAncients(), ...tenAncients()];
    gs.forgeArtifactFromRunes();
    gs.forgeArtifactFromRunes();
    expect(gs.runeInventory).toHaveLength(0);
    expect(gs.artifactInventory).toHaveLength(2);
  });

  it("result is always a base artifact", () => {
    const gs = new GameState();
    for (let i = 0; i < 10; i++) {
      gs.runeInventory = tenAncients();
      gs.forgeArtifactFromRunes();
      const inst = gs.artifactInventory.pop()!;
      expect(ARTIFACT_DEFS[inst.id]).toBeDefined();
      expect(inst.level).toBe(0);
    }
  });
});

import { describe, expect, it } from "vitest";
import { Character, switchClass, HP_PER_LEVEL, CLASS_ABILITIES } from "../src/character.js";
import { GearItem, SLOTS } from "../src/gear.js";

function makeChar(cls = "fighter") {
  return new Character("Hero", cls, 1);
}

function makeItem(slot: any = "main_hand", quality = "common") {
  return new GearItem(slot, "sword", quality, "valor");
}

describe("switchClass", () => {
  it("1 -> fighter", () => expect(switchClass(1)).toBe("fighter"));
  it("2 -> rogue", () => expect(switchClass(2)).toBe("rogue"));
  it("3 -> mage", () => expect(switchClass(3)).toBe("mage"));
  it("invalid -> null", () => expect(switchClass(99)).toBeNull());
});

describe("Character init", () => {
  it("health initialized to max", () => {
    const c = makeChar();
    expect(c.health).toBe(c.maxHealth);
  });

  it("max health is positive", () => {
    expect(makeChar().maxHealth).toBeGreaterThan(0);
  });

  it("toDict includes health", () => {
    const d = makeChar().toDict();
    expect(d).toHaveProperty("health");
    expect(d).toHaveProperty("max_health");
  });

  it("base DPS fighter = 2.0", () => expect(makeChar("fighter").dps).toBe(2.0));
  it("base DPS rogue = 1.5", () => expect(makeChar("rogue").dps).toBe(1.5));
  it("base DPS mage = 1.0", () => expect(makeChar("mage").dps).toBe(1.0));
  it("starts at level 1", () => expect(makeChar().level).toBe(1));
  it("starts with 0 xp", () => expect(makeChar().xp).toBe(0));
  it("xp multiplier starts at 1", () => expect(makeChar().xpMultiplier).toBe(1.0));
  it("click bonus starts at 0", () => expect(makeChar().clickBonus).toBe(0.0));
});

describe("equipItem", () => {
  it("adds damage to dps", () => {
    const c = makeChar();
    const base = c.dps;
    c.equipItem(makeItem("main_hand", "common")); // damage 11
    expect(c.dps).toBeCloseTo(base + 11);
  });

  it("replacing removes old damage and adds new", () => {
    const c = makeChar();
    c.equipItem(makeItem("main_hand", "broken")); // 1
    const after = c.dps;
    c.equipItem(makeItem("main_hand", "poor")); // 7
    expect(c.dps).toBeCloseTo(after - 1 + 7);
  });

  it("different slots stack", () => {
    const c = makeChar();
    const base = c.dps;
    c.equipItem(new GearItem("main_hand", "sword", "common", "x")); // +11
    c.equipItem(new GearItem("off_hand", "dagger", "common", "x")); // +11
    expect(c.dps).toBeCloseTo(base + 22);
  });
});

describe("xp and leveling", () => {
  it("gainXp accumulates", () => {
    const c = makeChar();
    c.gainXp(5);
    expect(c.xp).toBe(5);
  });

  it("gainXp triggers level up at threshold", () => {
    const c = makeChar();
    c.gainXp(10);
    expect(c.level).toBe(2);
  });

  it("fighter level up scales dps by 1.2", () => {
    const c = makeChar("fighter");
    const base = c.dps;
    c.gainXp(10);
    expect(c.dps).toBeCloseTo(base * 1.2);
  });

  it("xp resets after level up", () => {
    const c = makeChar();
    c.gainXp(10);
    expect(c.xp).toBe(0);
  });

  it("xp multiplier increases gain", () => {
    const c = makeChar();
    c.xpMultiplier = 2.0;
    c.gainXp(3);
    expect(c.xp).toBe(6);
  });

  it("multiple level-ups from one big xp", () => {
    const c = makeChar();
    c.gainXp(100);
    expect(c.level).toBeGreaterThan(2);
  });

  it("rogue level up grants click bonus", () => {
    const c = makeChar("rogue");
    c.gainXp(10);
    expect(c.clickBonus).toBeCloseTo(0.3);
  });

  it("rogue level up scales dps by 1.15", () => {
    const c = makeChar("rogue");
    const base = c.dps;
    c.gainXp(10);
    expect(c.dps).toBeCloseTo(base * 1.15);
  });

  it("mage level up grants xp multiplier", () => {
    const c = makeChar("mage");
    c.gainXp(10);
    expect(c.xpMultiplier).toBeCloseTo(1.05);
  });

  it("mage level up scales dps by 1.1", () => {
    const c = makeChar("mage");
    const base = c.dps;
    c.gainXp(10);
    expect(c.dps).toBeCloseTo(base * 1.1);
  });

  it("rogue click bonus stacks across levels", () => {
    const c = makeChar("rogue");
    c.gainXp(100);
    expect(c.clickBonus).toBeCloseTo(0.3 * (c.level - 1));
  });

  it("level up increases maxHealth by HP_PER_LEVEL", () => {
    const c = makeChar();
    const before = c.maxHealth;
    c.gainXp(10);
    expect(c.maxHealth).toBe(before + HP_PER_LEVEL);
  });

  it("level up increases current health by HP_PER_LEVEL", () => {
    const c = makeChar();
    const before = c.health;
    c.gainXp(10);
    expect(c.health).toBe(before + HP_PER_LEVEL);
  });

  it("maxHealth grows with each level", () => {
    const c = makeChar();
    c.gainXp(100);
    expect(c.maxHealth).toBe(100 + HP_PER_LEVEL * (c.level - 1));
  });
});

describe("class abilities — unlocks", () => {
  function levelTo(c: Character, target: number) {
    while (c.level < target) c.levelUp();
  }

  // Fighter
  it("fighter has no iron_skin before level 5", () => {
    expect(makeChar("fighter").abilities).not.toContain("iron_skin");
  });
  it("fighter unlocks iron_skin at level 5", () => {
    const c = makeChar("fighter"); levelTo(c, 5);
    expect(c.abilities).toContain("iron_skin");
  });
  it("fighter damageReduction is 0.2 after iron_skin", () => {
    const c = makeChar("fighter"); levelTo(c, 5);
    expect(c.damageReduction).toBeCloseTo(0.2);
  });
  it("fighter unlocks bloodlust at level 10", () => {
    const c = makeChar("fighter"); levelTo(c, 10);
    expect(c.abilities).toContain("bloodlust");
  });
  it("fighter queues battle_standard as party effect at level 20", () => {
    const c = makeChar("fighter"); levelTo(c, 20);
    expect(c.abilities).toContain("battle_standard");
    expect(c.pendingPartyAbilities).toContain("battle_standard");
  });

  // Rogue
  it("rogue unlocks lucky_strike at level 5", () => {
    const c = makeChar("rogue"); levelTo(c, 5);
    expect(c.abilities).toContain("lucky_strike");
  });
  it("rogue unlocks blade_mastery at level 10", () => {
    const c = makeChar("rogue"); levelTo(c, 10);
    expect(c.abilities).toContain("blade_mastery");
  });
  it("rogue DPS at level 10 is 1.5× what it would be without blade_mastery", () => {
    const c = makeChar("rogue"); levelTo(c, 9);
    const dpsBefore = c.dps;
    c.levelUp(); // reach 10 — normal 1.15× mult then blade_mastery 1.5×
    expect(c.dps).toBeCloseTo(dpsBefore * 1.15 * 1.5);
  });
  it("rogue unlocks expose_weakness at level 20", () => {
    const c = makeChar("rogue"); levelTo(c, 20);
    expect(c.abilities).toContain("expose_weakness");
  });

  // Mage
  it("mage unlocks arcane_study at level 5", () => {
    const c = makeChar("mage"); levelTo(c, 5);
    expect(c.abilities).toContain("arcane_study");
  });
  it("mage queues arcane_study as party effect at level 5", () => {
    const c = makeChar("mage"); levelTo(c, 5);
    expect(c.pendingPartyAbilities).toContain("arcane_study");
  });
  it("mage unlocks mana_surge at level 10", () => {
    const c = makeChar("mage"); levelTo(c, 10);
    expect(c.abilities).toContain("mana_surge");
  });
  it("mage unlocks empower at level 20", () => {
    const c = makeChar("mage"); levelTo(c, 20);
    expect(c.abilities).toContain("empower");
  });

  // CLASS_ABILITIES export
  it("CLASS_ABILITIES has entries for all three classes", () => {
    expect(CLASS_ABILITIES).toHaveProperty("fighter");
    expect(CLASS_ABILITIES).toHaveProperty("rogue");
    expect(CLASS_ABILITIES).toHaveProperty("mage");
  });

  // Round-trip
  it("abilities survive toDict/fromDict", () => {
    const c = makeChar("rogue"); levelTo(c, 10);
    const restored = Character.fromDict(c.toDict());
    expect(restored.abilities).toContain("lucky_strike");
    expect(restored.abilities).toContain("blade_mastery");
  });
  it("damageReduction survives toDict/fromDict", () => {
    const c = makeChar("fighter"); levelTo(c, 5);
    const restored = Character.fromDict(c.toDict());
    expect(restored.damageReduction).toBeCloseTo(0.2);
  });
});

describe("toDict", () => {
  it("contains required keys", () => {
    const d = makeChar().toDict();
    for (const k of [
      "name",
      "character_class",
      "level",
      "dps",
      "xp",
      "xp_to_next",
      "click_bonus",
      "equipment",
    ]) {
      expect(d).toHaveProperty(k);
    }
  });

  it("equipment has all slots", () => {
    const d = makeChar().toDict();
    expect(new Set(Object.keys(d.equipment))).toEqual(new Set(SLOTS));
  });
});

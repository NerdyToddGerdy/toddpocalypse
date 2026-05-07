import { beforeEach, describe, expect, it } from "vitest";
import {
  GameState, KILLS_PER_LEVEL, LOOT_MAX, UPGRADE_BASES, UPGRADE_EFFECTS, HP_UPGRADE_EFFECT,
  PRESTIGE_UNLOCK_LEVEL, PRESTIGE_SHOP_COSTS, STARTING_GOLD_PER_LEVEL, XP_BONUS_PER_LEVEL, AUTO_SELLER_INTERVAL,
} from "../src/engine.js";
import { GearItem, getItem, type Slot } from "../src/gear.js";

function make(): GameState {
  return new GameState();
}

function withHighLevel(level: number): GameState {
  const gs = make(); gs.highestLevel = level; return gs;
}

function withPrestige(pts: number): GameState {
  const gs = make(); gs.prestigePoints = pts; return gs;
}

function withLoot(): GameState {
  const gs = make();
  gs.lootPool = [];
  for (let i = 0; i < 3; i++) gs.lootPool.push(getItem());
  return gs;
}

function withGold(): GameState {
  const gs = make();
  gs.gold = 10_000;
  return gs;
}

describe("init", () => {
  it("one party member", () => expect(make().party.team.length).toBe(1));

  it("custom name", () => {
    expect(new GameState("Zara").party.team[0].name).toBe("Zara");
  });

  it("custom class", () => {
    expect(new GameState(undefined, "mage").party.team[0].characterClass).toBe("mage");
  });

  it("default name and class", () => {
    const gs = make();
    expect(gs.party.team[0].name).toBe("Hero");
    expect(gs.party.team[0].characterClass).toBe("fighter");
  });

  it("starts at dungeon level 1", () => expect(make().dungeonLevel).toBe(1));
  it("starts with zero gold", () => expect(make().gold).toBe(0));
  it("loot pool starts empty", () => expect(make().lootPool).toEqual([]));
  it("deaths starts at 0", () => expect(make().deaths).toBe(0));
  it("highestLevel starts at 1", () => expect(make().highestLevel).toBe(1));

  it("upgrades initialized for all characters", () => {
    const gs = make();
    for (const c of gs.party.team) {
      expect(gs.upgrades).toHaveProperty(c.name);
      expect(new Set(Object.keys(gs.upgrades[c.name]))).toEqual(
        new Set(["dps", "xp", "click", "hp"]),
      );
    }
  });
});

describe("tick", () => {
  it("returns valid JSON with enemy", () => {
    const result = JSON.parse(make().tick(0.1));
    expect(result).toHaveProperty("enemy");
  });

  it("reduces enemy HP when character has gear", () => {
    const gs = make();
    gs.enemy.hp = gs.enemy.max_hp = 1000;
    gs.enemy.attack_dps = 0;
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    const startHp = gs.enemy.hp;
    gs.tick(1.0);
    expect(gs.enemy.hp).toBeLessThan(startHp);
  });

  it("does not reduce enemy HP when no gear is equipped", () => {
    const gs = make();
    gs.enemy.hp = gs.enemy.max_hp = 1000;
    gs.enemy.attack_dps = 0;
    const before = gs.enemy.hp;
    gs.tick(1.0);
    expect(gs.enemy.hp).toBe(before);
  });

  it("kills enemy when HP depletes and character has gear", () => {
    const gs = make();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.enemy.hp = 0.1;
    gs.tick(1.0);
    expect(gs.kills).toBe(1);
  });

  it("boss spawns after KILLS_PER_LEVEL regular enemies, dungeon level stays", () => {
    const gs = make();
    for (let i = 0; i < KILLS_PER_LEVEL; i++) gs.onEnemyDeath();
    expect(gs.enemy.isBoss).toBe(true);
    expect(gs.dungeonLevel).toBe(1);
  });

  it("dungeon level increases only after boss is killed", () => {
    const gs = make();
    for (let i = 0; i < KILLS_PER_LEVEL + 1; i++) gs.onEnemyDeath();
    expect(gs.dungeonLevel).toBe(2);
  });

  it("highestLevel tracks the maximum dungeon level reached", () => {
    const gs = make();
    for (let i = 0; i < 10; i++) gs.onEnemyDeath();
    expect(gs.highestLevel).toBe(gs.dungeonLevel);
    expect(gs.highestLevel).toBeGreaterThan(1);
  });

  it("highestLevel never decreases when dungeon level drops on death", () => {
    const gs = make();
    for (let i = 0; i < 5; i++) gs.onEnemyDeath();
    const peak = gs.highestLevel;
    gs.party.team[0].health = 0.1;
    gs.tick(1.0);
    expect(gs.highestLevel).toBe(peak);
  });

  it("reduces player health", () => {
    const gs = make();
    const player = gs.party.team[0];
    gs.enemy.attack_dps = 10.0;
    const start = player.health;
    gs.tick(1.0);
    expect(player.health).toBeLessThan(start);
  });

  it("enemy kill heals player to full", () => {
    const gs = make();
    const player = gs.party.team[0];
    player.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    player.health = 1;
    gs.enemy.hp = 0.1;
    gs.tick(1.0);
    expect(player.health).toBe(player.maxHealth);
  });

  it("player death resets dungeon level", () => {
    const gs = make();
    gs.dungeonLevel = 5;
    gs.kills = 20;
    gs.party.team[0].health = 0.1;
    gs.tick(1.0);
    expect(gs.dungeonLevel).toBe(1);
  });

  it("player death resets kills", () => {
    const gs = make();
    gs.kills = 20;
    gs.party.team[0].health = 0.1;
    gs.tick(1.0);
    expect(gs.kills).toBe(0);
  });

  it("player death increments deaths", () => {
    const gs = make();
    gs.party.team[0].health = 0.1;
    gs.tick(1.0);
    expect(gs.deaths).toBe(1);
  });

  it("deaths accumulate across multiple deaths", () => {
    const gs = make();
    for (let i = 0; i < 3; i++) {
      gs.party.team[0].health = 0.1;
      gs.tick(1.0);
    }
    expect(gs.deaths).toBe(3);
  });

  it("player death preserves highestLevel", () => {
    const gs = make();
    gs.highestLevel = 8;
    gs.party.team[0].health = 0.1;
    gs.tick(1.0);
    expect(gs.highestLevel).toBe(8);
  });

  it("player death restores health", () => {
    const gs = make();
    const player = gs.party.team[0];
    player.health = 0.1;
    gs.tick(1.0);
    expect(player.health).toBe(player.maxHealth);
  });

  it("player death keeps gear", () => {
    const gs = make();
    const item = new GearItem("helmet" as Slot, "helm", "legendary", "valor");
    gs.party.team[0].inventory.slots.helmet = item;
    gs.party.team[0].health = 0.1;
    gs.tick(1.0);
    expect(gs.party.team[0].inventory.slots.helmet).toBe(item);
  });

  it("player death keeps character level", () => {
    const gs = make();
    gs.party.team[0].level = 10;
    gs.party.team[0].health = 0.1;
    gs.tick(1.0);
    expect(gs.party.team[0].level).toBe(10);
  });

  it("toDict includes player health", () => {
    const state = JSON.parse(make().respond());
    const member = state.party[0];
    expect(member).toHaveProperty("health");
    expect(member).toHaveProperty("max_health");
  });
});

describe("click", () => {
  it("returns valid JSON", () => {
    expect(JSON.parse(make().click())).toHaveProperty("enemy");
  });

  it("reduces enemy HP", () => {
    const gs = make();
    const start = gs.enemy.hp;
    gs.click();
    expect(gs.enemy.hp).toBeLessThan(start);
  });

  it("deals damage even without gear equipped", () => {
    const gs = make();
    gs.enemy.hp = gs.enemy.max_hp = 1000;
    const before = gs.enemy.hp;
    gs.click();
    expect(gs.enemy.hp).toBeLessThan(before);
  });

  it("includes party click bonus", () => {
    const gs = make();
    gs.party.team[0].clickBonus = 100.0;
    gs.enemy.hp = gs.enemy.max_hp = 10_000;
    const before = gs.enemy.hp;
    gs.click();
    expect(before - gs.enemy.hp).toBeGreaterThan(10);
  });
});

describe("loot", () => {
  it("loot pool capped at LOOT_MAX", () => {
    const gs = make();
    for (let i = 0; i < 200; i++) {
      gs.enemy.hp = 0;
      gs.onEnemyDeath();
    }
    expect(gs.lootPool.length).toBeLessThanOrEqual(LOOT_MAX);
  });

  it("equipLoot removes from pool", () => {
    const gs = withLoot();
    const before = gs.lootPool.length;
    gs.equipLoot(0);
    expect(gs.lootPool.length).toBe(before - 1);
  });

  it("equipLoot equips item on a character", () => {
    const gs = withLoot();
    const item = gs.lootPool[0];
    gs.equipLoot(0);
    const equipped = gs.party.team.map((c) => c.inventory.slots[item.slot]);
    expect(equipped.some((s) => s !== null)).toBe(true);
  });

  it("equipLoot out of range is no-op", () => {
    const gs = withLoot();
    const before = gs.lootPool.length;
    gs.equipLoot(999);
    expect(gs.lootPool.length).toBe(before);
  });

  it("sellLoot removes from pool", () => {
    const gs = withLoot();
    const before = gs.lootPool.length;
    gs.sellLoot(0);
    expect(gs.lootPool.length).toBe(before - 1);
  });

  it("sellLoot adds gold", () => {
    const gs = withLoot();
    const item = gs.lootPool[0];
    gs.sellLoot(0);
    expect(gs.gold).toBe(item.sellValue);
  });

  it("sellLoot out of range is no-op", () => {
    const gs = withLoot();
    gs.sellLoot(999);
    expect(gs.gold).toBe(0);
  });

  it("equipLoot returns valid JSON", () => {
    expect(JSON.parse(withLoot().equipLoot(0))).toHaveProperty("loot_pool");
  });

  it("sellLoot returns valid JSON", () => {
    expect(JSON.parse(withLoot().sellLoot(0))).toHaveProperty("gold");
  });

  it("equipLoot sells displaced item", () => {
    const gs = make();
    const weak = new GearItem("main_hand", "sword", "broken", "rusty");
    const strong = new GearItem("main_hand", "sword", "legendary", "legendary");
    for (const c of gs.party.team) {
      c.inventory.slots.main_hand = weak;
      c.dps += weak.damage;
    }
    gs.lootPool = [strong];
    gs.equipLoot(0);
    expect(gs.gold).toBe(weak.sellValue);
  });

  it("equipAll clears the pool", () => {
    const gs = withLoot();
    gs.equipAll();
    expect(gs.lootPool).toEqual([]);
  });

  it("equipAll equips upgrades", () => {
    const gs = make();
    const item = new GearItem("helmet", "helm", "legendary", "shiny");
    gs.lootPool = [item];
    gs.equipAll();
    const equipped = gs.party.team.map((c) => c.inventory.slots.helmet);
    expect(equipped.some((e) => e !== null)).toBe(true);
  });

  it("equipAll sells junk", () => {
    const gs = make();
    const strong = new GearItem("main_hand", "sword", "legendary", "legendary");
    for (const c of gs.party.team) {
      c.inventory.slots.main_hand = strong;
      c.dps += strong.damage;
    }
    const weak = new GearItem("main_hand", "sword", "broken", "rusty");
    gs.lootPool = [weak];
    gs.equipAll();
    expect(gs.gold).toBe(weak.sellValue);
    expect(gs.lootPool).toEqual([]);
  });

  it("equipAll returns valid JSON", () => {
    expect(JSON.parse(withLoot().equipAll())).toHaveProperty("loot_pool");
  });
});

describe("upgrades", () => {
  it("dps upgrade increases character dps", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const before = c.dps;
    gs.buyUpgrade(c.name, "dps");
    expect(c.dps).toBeCloseTo(before + UPGRADE_EFFECTS.dps);
  });

  it("xp upgrade increases multiplier", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const before = c.xpMultiplier;
    gs.buyUpgrade(c.name, "xp");
    expect(c.xpMultiplier).toBeCloseTo(before + UPGRADE_EFFECTS.xp);
  });

  it("click upgrade increases click bonus", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    gs.buyUpgrade(c.name, "click");
    expect(c.clickBonus).toBeCloseTo(UPGRADE_EFFECTS.click);
  });

  it("deducts gold", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const cost = gs.upgradeCost(c.name, "dps");
    gs.buyUpgrade(c.name, "dps");
    expect(gs.gold).toBe(10_000 - cost);
  });

  it("cost doubles each level", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const base = UPGRADE_BASES.dps;
    for (const expected of [base, base * 2, base * 4]) {
      expect(gs.upgradeCost(c.name, "dps")).toBe(expected);
      gs.buyUpgrade(c.name, "dps");
    }
  });

  it("fails without gold", () => {
    const gs = make();
    const c = gs.party.team[0];
    const before = c.dps;
    gs.buyUpgrade(c.name, "dps");
    expect(c.dps).toBe(before);
  });

  it("returns valid JSON", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    expect(JSON.parse(gs.buyUpgrade(c.name, "dps"))).toHaveProperty("upgrades");
  });

  it("invalid upgrade type is a no-op", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const goldBefore = gs.gold;
    gs.buyUpgrade(c.name, "invalid");
    expect(gs.gold).toBe(goldBefore);
  });

  it("hp upgrade increases maxHealth", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const before = c.maxHealth;
    gs.buyUpgrade(c.name, "hp");
    expect(c.maxHealth).toBe(before + HP_UPGRADE_EFFECT);
  });

  it("hp upgrade also raises current health by the same amount", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const before = c.health;
    gs.buyUpgrade(c.name, "hp");
    expect(c.health).toBe(before + HP_UPGRADE_EFFECT);
  });

  it("hp upgrade deducts gold", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    const cost = gs.upgradeCost(c.name, "hp");
    gs.buyUpgrade(c.name, "hp");
    expect(gs.gold).toBe(10_000 - cost);
  });

  it("hp upgrade survives fromDict round-trip", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    gs.buyUpgrade(c.name, "hp");
    gs.buyUpgrade(c.name, "hp");
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.upgrades[c.name].hp).toBe(2);
    expect(restored.party.team[0].maxHealth).toBe(c.maxHealth);
  });
});

describe("toDict", () => {
  it("respond is valid JSON object", () => {
    expect(typeof JSON.parse(make().respond())).toBe("object");
  });

  it("toDict has required keys", () => {
    const d = make().toDict();
    for (const key of [
      "dungeon_level",
      "gold",
      "kills",
      "enemy",
      "party",
      "loot_pool",
      "upgrades",
      "log",
    ]) {
      expect(d).toHaveProperty(key);
    }
  });

  it("loot_pool is included", () => {
    const gs = withLoot();
    expect(gs.toDict().loot_pool.length).toBe(3);
  });

  it("toDict includes deaths", () => {
    const gs = make();
    gs.deaths = 4;
    expect(gs.toDict().deaths).toBe(4);
  });

  it("toDict includes highest_level", () => {
    const gs = make();
    gs.highestLevel = 7;
    expect(gs.toDict().highest_level).toBe(7);
  });

  it("monsters_left is KILLS_PER_LEVEL when no kills", () => {
    expect(make().toDict().monsters_left).toBe(KILLS_PER_LEVEL);
  });

  it("monsters_left counts down as kills accumulate", () => {
    const gs = make();
    gs.kills = 3;
    expect(gs.toDict().monsters_left).toBe(KILLS_PER_LEVEL - 3);
  });

  it("monsters_left resets to KILLS_PER_LEVEL after leveling", () => {
    const gs = make();
    gs.kills = KILLS_PER_LEVEL;
    expect(gs.toDict().monsters_left).toBe(KILLS_PER_LEVEL);
  });
});

describe("boss fight", () => {
  function atBoss(): GameState {
    const gs = make();
    for (let i = 0; i < KILLS_PER_LEVEL; i++) gs.onEnemyDeath();
    return gs;
  }

  it("enemy is a boss after clearing regular enemies", () => {
    expect(atBoss().enemy.isBoss).toBe(true);
  });

  it("kill count does not increment when boss dies", () => {
    const gs = atBoss();
    const before = gs.kills;
    gs.onEnemyDeath();
    expect(gs.kills).toBe(before);
  });

  it("monsters_left is 0 while boss is active", () => {
    expect(atBoss().toDict().monsters_left).toBe(0);
  });

  it("toDict.enemy.is_boss is true during boss fight", () => {
    expect(atBoss().toDict().enemy.is_boss).toBe(true);
  });

  it("toDict.enemy.is_boss is false for regular enemies", () => {
    expect(make().toDict().enemy.is_boss).toBe(false);
  });

  it("boss fight survives fromDict round-trip", () => {
    const gs = atBoss();
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.enemy.isBoss).toBe(true);
  });

  it("boss guarantees a loot drop", () => {
    const gs = atBoss();
    gs.lootPool = [];
    gs.onEnemyDeath();
    expect(gs.lootPool.length).toBeGreaterThan(0);
  });

  it("boss advances floor on death", () => {
    const gs = atBoss();
    gs.onEnemyDeath();
    expect(gs.dungeonLevel).toBe(2);
  });

  it("boss drops gold on death", () => {
    const gs = atBoss();
    const reward = gs.enemy.gold_reward;
    gs.onEnemyDeath();
    expect(gs.gold).toBe(reward);
  });

  it("second floor also gets a boss after KILLS_PER_LEVEL kills", () => {
    const gs = make();
    for (let i = 0; i < KILLS_PER_LEVEL + 1; i++) gs.onEnemyDeath();
    for (let i = 0; i < KILLS_PER_LEVEL; i++) gs.onEnemyDeath();
    expect(gs.enemy.isBoss).toBe(true);
    expect(gs.dungeonLevel).toBe(2);
  });
});

describe("fromDict round-trip", () => {
  it("restores dungeon level, gold, kills", () => {
    const gs = withGold();
    gs.dungeonLevel = 7;
    gs.kills = 33;
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.dungeonLevel).toBe(7);
    expect(restored.gold).toBe(10_000);
    expect(restored.kills).toBe(33);
  });

  it("restores party member name and class", () => {
    const gs = new GameState("Zara", "mage");
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.party.team[0].name).toBe("Zara");
    expect(restored.party.team[0].characterClass).toBe("mage");
  });

  it("restores party dps, xp, level", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    c.gainXp(50);
    gs.buyUpgrade(c.name, "dps");
    const snap = gs.toDict();
    const restored = GameState.fromDict(snap);
    const rc = restored.party.team[0];
    expect(rc.dps).toBeCloseTo(c.dps);
    expect(rc.level).toBe(c.level);
    expect(rc.xp).toBe(c.xp);
  });

  it("restores xp multiplier", () => {
    const gs = make();
    gs.party.team[0].xpMultiplier = 2.5;
    const rc = GameState.fromDict(gs.toDict()).party.team[0];
    expect(rc.xpMultiplier).toBeCloseTo(2.5);
  });

  it("restores click bonus", () => {
    const gs = make();
    gs.party.team[0].clickBonus = 3.7;
    const rc = GameState.fromDict(gs.toDict()).party.team[0];
    expect(rc.clickBonus).toBeCloseTo(3.7);
  });

  it("restores equipped gear into correct slot", () => {
    const gs = make();
    const item = new GearItem("helmet", "helm", "legendary", "valor");
    gs.party.team[0].equipItem(item);
    const restored = GameState.fromDict(gs.toDict());
    const slot = restored.party.team[0].inventory.slots.helmet;
    expect(slot).not.toBeNull();
    expect(slot!.quality).toBe("legendary");
    expect(slot!.damage).toBe(item.damage);
  });

  it("restores loot pool items", () => {
    const gs = withLoot();
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.lootPool.length).toBe(gs.lootPool.length);
    expect(restored.lootPool[0].quality).toBe(gs.lootPool[0].quality);
  });

  it("restores upgrade levels", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    gs.buyUpgrade(c.name, "dps");
    gs.buyUpgrade(c.name, "dps");
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.upgrades[c.name].dps).toBe(2);
  });

  it("restored enemy has correct hp", () => {
    const gs = make();
    gs.enemy.hp = 5.5;
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.enemy.hp).toBeCloseTo(5.5);
  });

  it("restored enemy has attack_dps", () => {
    const gs = make();
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.enemy.attack_dps).toBeGreaterThan(0);
  });

  it("restored state can tick without error", () => {
    const gs = withGold();
    gs.party.team[0].gainXp(50);
    const restored = GameState.fromDict(gs.toDict());
    expect(() => restored.tick(0.1)).not.toThrow();
  });

  it("restores deaths", () => {
    const gs = make();
    gs.deaths = 5;
    expect(GameState.fromDict(gs.toDict()).deaths).toBe(5);
  });

  it("restores highestLevel", () => {
    const gs = make();
    gs.highestLevel = 12;
    expect(GameState.fromDict(gs.toDict()).highestLevel).toBe(12);
  });
});

describe("prestige gate", () => {
  it("prestige() is a no-op when highestLevel < 20", () => {
    const gs = withHighLevel(19); gs.kills = 10; gs.prestige();
    expect(gs.kills).toBe(10);
  });

  it("prestige() succeeds when highestLevel === 20", () => {
    const gs = withHighLevel(20); gs.prestige();
    expect(gs.totalPrestiges).toBe(1);
  });

  it("prestige() succeeds when highestLevel > 20", () => {
    const gs = withHighLevel(25); gs.prestige();
    expect(gs.totalPrestiges).toBe(1);
  });
});

describe("prestige points formula", () => {
  it("level 20 earns 1 point", () => {
    const gs = withHighLevel(20); gs.prestige();
    expect(gs.prestigePoints).toBe(1);
  });

  it("level 25 earns 2 points", () => {
    const gs = withHighLevel(25); gs.prestige();
    expect(gs.prestigePoints).toBe(2);
  });

  it("level 30 earns 3 points", () => {
    const gs = withHighLevel(30); gs.prestige();
    expect(gs.prestigePoints).toBe(3);
  });

  it("prestigePointsPreview returns 1 at level 20", () => {
    expect(withHighLevel(20).prestigePointsPreview()).toBe(1);
  });

  it("prestigePointsPreview returns 4 at level 35", () => {
    expect(withHighLevel(35).prestigePointsPreview()).toBe(4);
  });
});

describe("prestige wipe", () => {
  it("resets dungeonLevel to 1", () => {
    const gs = withHighLevel(20); gs.dungeonLevel = 15; gs.prestige();
    expect(gs.dungeonLevel).toBe(1);
  });

  it("resets kills to 0", () => {
    const gs = withHighLevel(20); gs.kills = 33; gs.prestige();
    expect(gs.kills).toBe(0);
  });

  it("resets deaths to 0", () => {
    const gs = withHighLevel(20); gs.deaths = 5; gs.prestige();
    expect(gs.deaths).toBe(0);
  });

  it("resets highestLevel to 1", () => {
    const gs = withHighLevel(20); gs.prestige();
    expect(gs.highestLevel).toBe(1);
  });

  it("clears loot pool", () => {
    const gs = withHighLevel(20); gs.lootPool = [getItem()]; gs.prestige();
    expect(gs.lootPool).toEqual([]);
  });

  it("resets all upgrades to 0", () => {
    const gs = withHighLevel(20); gs.gold = 10_000;
    gs.buyUpgrade(gs.party.team[0].name, "dps");
    gs.prestige();
    expect(gs.upgrades[gs.party.team[0].name].dps).toBe(0);
  });

  it("resets character to level 1", () => {
    const gs = withHighLevel(20);
    gs.party.team[0].level = 10; gs.party.team[0].gainXp(999);
    gs.prestige();
    expect(gs.party.team[0].level).toBe(1);
  });

  it("preserves character name", () => {
    const gs = new GameState("Zara", "rogue"); gs.highestLevel = 20; gs.prestige();
    expect(gs.party.team[0].name).toBe("Zara");
  });

  it("preserves character class", () => {
    const gs = new GameState("Zara", "rogue"); gs.highestLevel = 20; gs.prestige();
    expect(gs.party.team[0].characterClass).toBe("rogue");
  });

  it("clears equipped gear", () => {
    const gs = withHighLevel(20);
    gs.party.team[0].equipItem(new GearItem("helmet" as Slot, "helm", "legendary", "valor"));
    gs.prestige();
    expect(gs.party.team[0].inventory.slots.helmet).toBeNull();
  });
});

describe("prestige lifetime stats", () => {
  it("accumulates lifetimeKills", () => {
    const gs = withHighLevel(20); gs.kills = 42; gs.prestige();
    expect(gs.lifetimeKills).toBe(42);
  });

  it("accumulates lifetimeKills across multiple prestiges", () => {
    const gs = withHighLevel(20); gs.kills = 10; gs.prestige();
    gs.highestLevel = 20; gs.kills = 15; gs.prestige();
    expect(gs.lifetimeKills).toBe(25);
  });

  it("accumulates lifetimeDeaths", () => {
    const gs = withHighLevel(20); gs.deaths = 3; gs.prestige();
    expect(gs.lifetimeDeaths).toBe(3);
  });

  it("records lifetimeBestLevel", () => {
    const gs = withHighLevel(27); gs.prestige();
    expect(gs.lifetimeBestLevel).toBe(27);
  });

  it("lifetimeBestLevel keeps historical maximum", () => {
    const gs = withHighLevel(30); gs.prestige();
    gs.highestLevel = 22; gs.prestige();
    expect(gs.lifetimeBestLevel).toBe(30);
  });

  it("totalPrestiges increments on each prestige", () => {
    const gs = withHighLevel(20); gs.prestige();
    gs.highestLevel = 20; gs.prestige();
    expect(gs.totalPrestiges).toBe(2);
  });
});

describe("prestige round-trip", () => {
  it("prestige fields survive toDict/fromDict", () => {
    const gs = withHighLevel(25); gs.kills = 8; gs.prestige();
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.prestigePoints).toBe(2);
    expect(restored.totalPrestiges).toBe(1);
    expect(restored.lifetimeKills).toBe(8);
    expect(restored.lifetimeBestLevel).toBe(25);
  });

  it("prestige_available is true when highestLevel >= 20", () => {
    expect(withHighLevel(20).toDict().prestige_available).toBe(true);
  });

  it("prestige_available is false when highestLevel < 20", () => {
    expect(make().toDict().prestige_available).toBe(false);
  });

  it("prestige_points_preview is 0 when below threshold", () => {
    expect(make().toDict().prestige_points_preview).toBe(0);
  });

  it("prestige_points_preview is 1 at level 20", () => {
    expect(withHighLevel(20).toDict().prestige_points_preview).toBe(1);
  });

  it("lifetime_kills includes current run kills", () => {
    const gs = make(); gs.kills = 7;
    expect(gs.toDict().lifetime_kills).toBe(7);
  });

  it("lifetime_kills accumulates stored + current after a prestige", () => {
    const gs = withHighLevel(20); gs.kills = 10; gs.prestige();
    gs.kills = 5;
    expect(gs.toDict().lifetime_kills).toBe(15);
  });

  it("lifetime_deaths includes current run deaths", () => {
    const gs = make(); gs.deaths = 3;
    expect(gs.toDict().lifetime_deaths).toBe(3);
  });

  it("lifetime_best_level reflects current run even before prestige", () => {
    const gs = make(); gs.highestLevel = 12;
    expect(gs.toDict().lifetime_best_level).toBe(12);
  });

  it("lifetime_best_level is max of stored and current", () => {
    const gs = withHighLevel(25); gs.prestige();
    gs.highestLevel = 15;
    expect(gs.toDict().lifetime_best_level).toBe(25);
  });
});

describe("prestige shop", () => {
  it("auto_seller costs 1 point and is recorded", () => {
    const gs = withPrestige(5); gs.buyPrestigeUpgrade("auto_seller");
    expect(gs.prestigeUpgrades["auto_seller"]).toBe(1);
    expect(gs.prestigePoints).toBe(4);
  });

  it("auto_seller cannot be bought twice", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_seller"); gs.buyPrestigeUpgrade("auto_seller");
    expect(gs.prestigeUpgrades["auto_seller"]).toBe(1);
    expect(gs.prestigePoints).toBe(4);
  });

  it("starting_gold is stackable", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("starting_gold"); gs.buyPrestigeUpgrade("starting_gold");
    expect(gs.prestigeUpgrades["starting_gold"]).toBe(2);
  });

  it("xp_bonus applies immediately to all party members", () => {
    const gs = withPrestige(5);
    const before = gs.party.team[0].xpMultiplier;
    gs.buyPrestigeUpgrade("xp_bonus");
    expect(gs.party.team[0].xpMultiplier).toBeCloseTo(before + XP_BONUS_PER_LEVEL);
  });

  it("xp_bonus stacks on second purchase", () => {
    const gs = withPrestige(5);
    const before = gs.party.team[0].xpMultiplier;
    gs.buyPrestigeUpgrade("xp_bonus"); gs.buyPrestigeUpgrade("xp_bonus");
    expect(gs.party.team[0].xpMultiplier).toBeCloseTo(before + XP_BONUS_PER_LEVEL * 2);
  });

  it("party_slot_2 costs 2 points and adds a second member", () => {
    const gs = withPrestige(5); gs.buyPrestigeUpgrade("party_slot_2", "rogue");
    expect(gs.party.team.length).toBe(2);
    expect(gs.prestigePoints).toBe(3);
  });

  it("party_slot_2 member has the chosen class", () => {
    const gs = withPrestige(5); gs.buyPrestigeUpgrade("party_slot_2", "mage");
    expect(gs.party.team[1].characterClass).toBe("mage");
  });

  it("party_slot_3 requires party_slot_2 first", () => {
    const gs = withPrestige(10); gs.buyPrestigeUpgrade("party_slot_3", "fighter");
    expect(gs.party.team.length).toBe(1);
  });

  it("party_slot_3 adds third member after slot 2", () => {
    const gs = withPrestige(10);
    gs.buyPrestigeUpgrade("party_slot_2", "rogue");
    gs.buyPrestigeUpgrade("party_slot_3", "mage");
    expect(gs.party.team.length).toBe(3);
    expect(gs.party.team[2].characterClass).toBe("mage");
  });

  it("invalid upgrade type is a no-op", () => {
    const gs = withPrestige(5); gs.buyPrestigeUpgrade("invalid_upgrade");
    expect(gs.prestigePoints).toBe(5);
  });

  it("fails without enough points", () => {
    const gs = withPrestige(1); gs.buyPrestigeUpgrade("party_slot_2", "fighter");
    expect(gs.party.team.length).toBe(1);
    expect(gs.prestigePoints).toBe(1);
  });

  it("party_slot_2 survives fromDict round-trip", () => {
    const gs = withPrestige(10); gs.buyPrestigeUpgrade("party_slot_2", "mage");
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.party.team.length).toBe(2);
    expect(restored.party.team[1].characterClass).toBe("mage");
    expect(restored.prestigePartyClasses["slot_2"]).toBe("mage");
  });
});

describe("prestige — starting_gold on next run", () => {
  it("1 stack gives 250g after prestige", () => {
    const gs = withHighLevel(20); gs.prestigeUpgrades["starting_gold"] = 1;
    gs.prestige();
    expect(gs.gold).toBe(250);
  });

  it("2 stacks give 500g after prestige", () => {
    const gs = withHighLevel(20); gs.prestigeUpgrades["starting_gold"] = 2;
    gs.prestige();
    expect(gs.gold).toBe(500);
  });
});

describe("prestige — xp_bonus persists through prestige", () => {
  it("xp_bonus stacks are re-applied to fresh party after prestige", () => {
    const gs = withPrestige(5); gs.highestLevel = 20;
    gs.buyPrestigeUpgrade("xp_bonus"); gs.buyPrestigeUpgrade("xp_bonus");
    gs.prestige();
    expect(gs.party.team[0].xpMultiplier).toBeCloseTo(1.20);
  });
});

describe("auto-seller", () => {
  function frozenEnemy(gs: GameState): GameState {
    gs.enemy.hp = gs.enemy.max_hp = 999_999;
    gs.enemy.attack_dps = 0;
    return gs;
  }

  it("does nothing when not purchased", () => {
    const gs = frozenEnemy(make()); gs.lootPool = [getItem()];
    gs.tick(AUTO_SELLER_INTERVAL + 1);
    expect(gs.lootPool.length).toBe(1);
  });

  it("does nothing when loot pool is empty", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    gs.tick(AUTO_SELLER_INTERVAL + 1);
    expect(gs.gold).toBe(0);
  });

  it("sells the lowest quality item after AUTO_SELLER_INTERVAL seconds", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    const broken = new GearItem("helmet" as Slot, "helm", "broken", "valor");
    const legendary = new GearItem("chest" as Slot, "plate", "legendary", "valor");
    // Equip legendary in both slots so neither loot item is an upgrade
    gs.party.team[0].equipItem(new GearItem("helmet" as Slot, "helm", "legendary", "valor"));
    gs.party.team[0].equipItem(new GearItem("chest" as Slot, "plate", "legendary", "valor"));
    gs.lootPool = [legendary, broken];
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(1);
    expect(gs.lootPool[0].quality).toBe("legendary");
    expect(gs.gold).toBe(broken.sellValue);
  });

  it("does not sell before interval elapses", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    gs.lootPool = [getItem(), getItem(), getItem()];
    gs.tick(AUTO_SELLER_INTERVAL - 0.1);
    expect(gs.lootPool.length).toBe(3);
  });

  it("only sells one item per interval", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    // Equip legendary in all three slots so loot items are not upgrades
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.party.team[0].equipItem(new GearItem("off_hand" as Slot, "dagger", "legendary", "valor"));
    gs.party.team[0].equipItem(new GearItem("helmet" as Slot, "helm", "legendary", "valor"));
    const item1 = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    const item2 = new GearItem("off_hand" as Slot, "dagger", "broken", "rusty");
    const item3 = new GearItem("helmet" as Slot, "helm", "broken", "rusty");
    gs.lootPool = [item1, item2, item3];
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(2);
  });

  it("timer carries overshoot into next interval", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    // Equip legendary in both slots so the loot items are not upgrades
    gs.party.team[0].equipItem(new GearItem("helmet" as Slot, "helm", "legendary", "valor"));
    gs.party.team[0].equipItem(new GearItem("chest" as Slot, "plate", "legendary", "valor"));
    const item1 = new GearItem("helmet" as Slot, "helm", "broken", "valor");
    const item2 = new GearItem("chest" as Slot, "plate", "worn", "valor");
    gs.lootPool = [item1, item2];
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(1);
    gs.tick(AUTO_SELLER_INTERVAL - 0.1);
    expect(gs.lootPool.length).toBe(1);
    gs.tick(0.2);
    expect(gs.lootPool.length).toBe(0);
  });

  it("timer resets on fromDict load", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    // Equip legendary so item is not upgrade-protected; test is about timer only
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.lootPool = [new GearItem("main_hand" as Slot, "sword", "broken", "rusty")];
    gs.tick(AUTO_SELLER_INTERVAL - 0.5);
    const restored = GameState.fromDict(gs.toDict());
    frozenEnemy(restored);
    restored.tick(0.1);
    expect(restored.lootPool.length).toBe(1);
  });

  it("does not sell an item that fills an empty slot", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    const item = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    gs.lootPool = [item]; // slot is empty — any item is an upgrade
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(1);
  });

  it("does not sell an item with higher damage than equipped", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "broken", "rusty")); // damage=1
    const better = new GearItem("main_hand" as Slot, "sword", "legendary", "valor"); // damage=75
    gs.lootPool = [better];
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(1);
    expect(gs.gold).toBe(0);
  });

  it("sells an item with lower damage than equipped", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor")); // damage=75
    const weaker = new GearItem("main_hand" as Slot, "sword", "broken", "rusty"); // damage=1
    gs.lootPool = [weaker];
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(0);
    expect(gs.gold).toBe(weaker.sellValue);
  });

  it("does nothing if all items are upgrades for the party", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    // No gear equipped — every item fills an empty slot
    gs.lootPool = [
      new GearItem("main_hand" as Slot, "sword", "broken", "rusty"),
      new GearItem("helmet" as Slot, "helm", "worn", "valor"),
    ];
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(2);
    expect(gs.gold).toBe(0);
  });

  it("skips upgrades and sells the worst non-upgrade", () => {
    const gs = frozenEnemy(withPrestige(5)); gs.buyPrestigeUpgrade("auto_seller");
    // Equip legendary main_hand — any main_hand in loot is not an upgrade
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    // helmet slot is empty — helmet item is an upgrade, keep it
    const helmetUpgrade = new GearItem("helmet" as Slot, "helm", "broken", "rusty"); // upgrade (empty slot)
    const weakSword = new GearItem("main_hand" as Slot, "sword", "broken", "rusty"); // not upgrade
    gs.lootPool = [helmetUpgrade, weakSword];
    gs.tick(AUTO_SELLER_INTERVAL);
    expect(gs.lootPool.length).toBe(1);
    expect(gs.lootPool[0].slot).toBe("helmet");
    expect(gs.gold).toBe(weakSword.sellValue);
  });
});

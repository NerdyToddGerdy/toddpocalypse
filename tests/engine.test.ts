import { beforeEach, describe, expect, it } from "vitest";
import { GameState, KILLS_PER_LEVEL, LOOT_MAX, UPGRADE_BASES, UPGRADE_EFFECTS } from "../src/engine.js";
import { GearItem, getItem, type Slot } from "../src/gear.js";

function make(): GameState {
  return new GameState();
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
        new Set(["dps", "xp", "click"]),
      );
    }
  });
});

describe("tick", () => {
  it("returns valid JSON with enemy", () => {
    const result = JSON.parse(make().tick(0.1));
    expect(result).toHaveProperty("enemy");
  });

  it("reduces enemy HP", () => {
    const gs = make();
    const startHp = gs.enemy.hp;
    gs.tick(1.0);
    expect(gs.enemy.hp).toBeLessThan(startHp);
  });

  it("kills enemy when HP depletes", () => {
    const gs = make();
    gs.enemy.hp = 0.1;
    gs.tick(1.0);
    expect(gs.kills).toBe(1);
  });

  it("dungeon level increases after enough kills", () => {
    const gs = make();
    for (let i = 0; i < 5; i++) {
      gs.enemy.hp = 0;
      gs.onEnemyDeath();
    }
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

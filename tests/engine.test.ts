import { beforeEach, describe, expect, it } from "vitest";
import {
  GameState, KILLS_PER_LEVEL, LOOT_MAX, UPGRADE_BASES, UPGRADE_EFFECTS, HP_UPGRADE_EFFECT,
  PRESTIGE_UNLOCK_LEVEL, PRESTIGE_SHOP_COSTS, STARTING_GOLD_PER_LEVEL, XP_BONUS_PER_LEVEL,
  BLOODLUST_MULTIPLIER, EXPOSE_WEAKNESS_MULT, MANA_SURGE_INTERVAL, MANA_SURGE_MULTIPLIER,
  LUCKY_STRIKE_CHANCE, LUCKY_STRIKE_MULTIPLIER, EMPOWER_MULTIPLIER,
  GUILD_HALL_THRESHOLDS,
  killsForFloor,
} from "../src/engine.js";
import { Character } from "../src/character.js";
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

describe("party combat (multi-member HP)", () => {
  function twoMembers(): GameState {
    const gs = make();
    const rogue = new Character("Rogue", "rogue", 1);
    gs.party.addPlayer(rogue);
    gs.upgrades["Rogue"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    gs.enemy.hp = gs.enemy.max_hp = 999_999;
    gs.enemy.attack_dps = 5;
    return gs;
  }

  it("enemy does not attack a dead party member", () => {
    const gs = twoMembers();
    gs.party.team[0].health = 0; // fighter dead
    const rogueBefore = gs.party.team[1].health;
    gs.tick(1.0);
    expect(gs.party.team[0].health).toBe(0);   // fighter untouched
    expect(gs.party.team[1].health).toBeLessThan(rogueBefore); // rogue took damage
  });

  it("party does not wipe when one member is dead and others live", () => {
    const gs = twoMembers();
    gs.party.team[0].health = 0; // fighter dead, rogue alive
    gs.tick(1.0);
    expect(gs.deaths).toBe(0);
  });

  it("party wipes when all members reach 0 HP", () => {
    const gs = twoMembers();
    gs.party.team[0].health = 0;
    gs.party.team[1].health = 0;
    gs.tick(0.1);
    expect(gs.deaths).toBe(1);
  });

  it("respawn restores all party members to full HP", () => {
    const gs = twoMembers();
    gs.party.team[0].health = 0;
    gs.party.team[1].health = 0;
    gs.tick(0.1);
    for (const c of gs.party.team) {
      expect(c.health).toBe(c.maxHealth);
    }
  });

  it("dead member contributes no auto-DPS", () => {
    const gs = make();
    const rogue = new Character("Rogue", "rogue", 1);
    rogue.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.party.addPlayer(rogue);
    gs.upgrades["Rogue"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    gs.enemy.hp = gs.enemy.max_hp = 999_999;
    gs.enemy.attack_dps = 0;

    gs.tick(1.0);
    const dmgRogueAlive = 999_999 - gs.enemy.hp;

    rogue.health = 0; // kill the rogue
    gs.enemy.hp = 999_999;
    gs.tick(1.0);
    const dmgRogueDead = 999_999 - gs.enemy.hp;

    expect(dmgRogueDead).toBeLessThan(dmgRogueAlive);
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

  it("ring equip replaces weaker ring when ring2 is the worse slot", () => {
    const gs = make();
    gs.party.team[0].equipItem(new GearItem("ring1", "ring", "legendary", "valor")); // ring1 = legendary
    gs.party.team[0].equipItem(new GearItem("ring1", "ring", "broken",    "valor")); // ring2 = broken
    const epic = new GearItem("ring1", "ring", "epic", "valor");
    gs.lootPool = [epic];
    gs.equipLoot(0);
    expect(gs.party.team[0].inventory.slots.ring2).toBe(epic);   // weaker slot replaced
    expect(gs.party.team[0].inventory.slots.ring1?.quality).toBe("legendary"); // strong ring kept
  });

  it("equipAll treats a ring as an upgrade when it beats the weaker ring", () => {
    const gs = make();
    gs.party.team[0].equipItem(new GearItem("ring1", "ring", "legendary", "valor")); // ring1 = strong
    gs.party.team[0].equipItem(new GearItem("ring1", "ring", "broken",    "valor")); // ring2 = weak
    const epic = new GearItem("ring1", "ring", "epic", "valor");
    gs.lootPool = [epic];
    gs.equipAll();
    expect(gs.party.team[0].inventory.slots.ring2).toBe(epic);   // replaces broken
    expect(gs.lootPool).toEqual([]);
  });

  it("equipLoot gives item to lead when both lead and companion have empty slot", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("party_slot_2", "fighter");
    gs.party.team[1].dps = 1000; // companion has much higher DPS (old tiebreaker would pick them)
    const sword = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    gs.lootPool = [sword];
    gs.equipLoot(0);
    expect(gs.party.team[0].inventory.slots["main_hand" as Slot]).toBe(sword);
  });

  it("equipLoot gives item to companion when lead already has better gear", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("party_slot_2", "fighter");
    const legendary = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    gs.party.team[0].equipItem(legendary);
    const common = new GearItem("main_hand" as Slot, "sword", "common", "valor");
    gs.lootPool = [common];
    gs.equipLoot(0);
    expect(gs.party.team[0].inventory.slots["main_hand" as Slot]).toBe(legendary);
    expect(gs.party.team[1].inventory.slots["main_hand" as Slot]).toBe(common);
  });

  it("auto seller protects a ring that beats the weaker equipped ring", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_seller");
    gs.autoSellQualities = ["epic"];
    gs.party.team[0].equipItem(new GearItem("ring1", "ring", "legendary", "valor")); // ring1 = strong
    gs.party.team[0].equipItem(new GearItem("ring1", "ring", "broken",    "valor")); // ring2 = weak
    const epicRing = new GearItem("ring1", "ring", "epic", "valor");
    gs.lootPool = [epicRing]; // epic beats broken → is an upgrade → must be protected
    gs.toggleAutoSellQuality("worn"); // trigger sweep
    expect(gs.lootPool.some(i => i.quality === "epic")).toBe(true);
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

  it("monsters_left counts down as floor kills accumulate", () => {
    const gs = make();
    gs.floorKills = 3;
    expect(gs.toDict().monsters_left).toBe(killsForFloor(1) - 3);
  });

  it("monsters_left resets after boss spawns", () => {
    const gs = make();
    for (let i = 0; i < killsForFloor(1); i++) gs.onEnemyDeath(); // advance to boss
    gs.onEnemyDeath(); // kill boss → enter floor 2
    expect(gs.toDict().monsters_left).toBe(killsForFloor(2));
  });
});

describe("killsForFloor", () => {
  it("returns KILLS_PER_LEVEL (5) at floor 1", () => {
    expect(killsForFloor(1)).toBe(KILLS_PER_LEVEL);
  });

  it("returns 7 at floor 5", () => {
    expect(killsForFloor(5)).toBe(7);
  });

  it("returns 9 at floor 10", () => {
    expect(killsForFloor(10)).toBe(9);
  });

  it("strictly increases every 5 floors", () => {
    for (let lvl = 5; lvl <= 30; lvl += 5) {
      expect(killsForFloor(lvl)).toBeGreaterThan(killsForFloor(lvl - 1));
    }
  });

  it("floorKills starts at 0", () => {
    expect(make().floorKills).toBe(0);
  });

  it("floorKills increments with each regular enemy kill", () => {
    const gs = make();
    gs.onEnemyDeath();
    expect(gs.floorKills).toBe(1);
  });

  it("floorKills resets to 0 after boss advances the floor", () => {
    const gs = make();
    for (let i = 0; i < killsForFloor(1); i++) gs.onEnemyDeath();
    gs.onEnemyDeath(); // kill boss
    expect(gs.floorKills).toBe(0);
  });

  it("player death resets floorKills", () => {
    const gs = make();
    gs.floorKills = 3;
    gs.onPlayerDeath();
    expect(gs.floorKills).toBe(0);
  });

  it("prestige resets floorKills", () => {
    const gs = withHighLevel(20);
    gs.floorKills = 4;
    gs.prestige();
    expect(gs.floorKills).toBe(0);
  });

  it("floor_kills round-trips through toDict/fromDict", () => {
    const gs = make();
    gs.floorKills = 3;
    expect(GameState.fromDict(gs.toDict()).floorKills).toBe(3);
  });

  it("boss spawns after killsForFloor(floor) kills, not always 5", () => {
    const gs = make();
    // advance to floor 5 (needs 5+1+5+1+5+1+5+1 = 24 calls to reach floor 5 boss)
    for (let floor = 1; floor <= 4; floor++) {
      for (let k = 0; k < killsForFloor(floor); k++) gs.onEnemyDeath();
      gs.onEnemyDeath(); // kill boss
    }
    expect(gs.dungeonLevel).toBe(5);
    for (let k = 0; k < killsForFloor(5); k++) gs.onEnemyDeath();
    expect(gs.enemy.isBoss).toBe(true);
    expect(gs.enemy.level).toBe(5);
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

  it("resets autoSellQualities to empty", () => {
    const gs = withHighLevel(20);
    gs.autoSellQualities = ["broken", "worn"];
    gs.prestige();
    expect(gs.autoSellQualities).toEqual([]);
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
  function withAutoSeller(): GameState {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_seller");
    return gs;
  }

  it("autoSellQualities starts empty", () => {
    expect(make().autoSellQualities).toEqual([]);
  });

  it("toggleAutoSellQuality adds a quality to the list", () => {
    const gs = withAutoSeller();
    gs.toggleAutoSellQuality("broken");
    expect(gs.autoSellQualities).toContain("broken");
  });

  it("toggleAutoSellQuality removes a quality already in the list", () => {
    const gs = withAutoSeller();
    gs.toggleAutoSellQuality("broken");
    gs.toggleAutoSellQuality("broken");
    expect(gs.autoSellQualities).not.toContain("broken");
  });

  it("auto seller not purchased — sweep does not run on toggle", () => {
    const gs = make();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.lootPool = [new GearItem("main_hand" as Slot, "sword", "broken", "rusty")];
    gs.toggleAutoSellQuality("broken");
    expect(gs.lootPool.length).toBe(1);
    expect(gs.gold).toBe(0);
  });

  it("auto seller owned, no qualities set — loot stays after kill", () => {
    const gs = withAutoSeller();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.lootPool = [];
    for (let i = 0; i < LOOT_MAX; i++) {
      gs.lootPool.push(new GearItem("main_hand" as Slot, "sword", "broken", "rusty"));
    }
    const before = gs.lootPool.length;
    gs.onEnemyDeath();
    expect(gs.lootPool.length).toBe(before);
  });

  it("toggle 'broken' on — broken items swept immediately", () => {
    const gs = withAutoSeller();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.lootPool = [
      new GearItem("main_hand" as Slot, "sword", "broken", "rusty"),
      new GearItem("main_hand" as Slot, "sword", "common", "valor"),
    ];
    gs.toggleAutoSellQuality("broken");
    expect(gs.lootPool.length).toBe(1);
    expect(gs.lootPool[0].quality).toBe("common");
    expect(gs.gold).toBeGreaterThan(0);
  });

  it("items above checked quality are kept", () => {
    const gs = withAutoSeller();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.lootPool = [
      new GearItem("main_hand" as Slot, "sword", "broken", "rusty"),
      new GearItem("main_hand" as Slot, "sword", "rare", "valor"),
    ];
    gs.toggleAutoSellQuality("broken");
    expect(gs.lootPool.some(i => i.quality === "rare")).toBe(true);
    expect(gs.lootPool.some(i => i.quality === "broken")).toBe(false);
  });

  it("upgrade items not sold even if quality matches checked tier", () => {
    const gs = withAutoSeller();
    // No gear equipped — broken item fills empty slot (is an upgrade)
    gs.lootPool = [new GearItem("main_hand" as Slot, "sword", "broken", "rusty")];
    gs.toggleAutoSellQuality("broken");
    expect(gs.lootPool.length).toBe(1);
    expect(gs.gold).toBe(0);
  });

  it("multiple checked qualities sold in one sweep", () => {
    const gs = withAutoSeller();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.party.team[0].equipItem(new GearItem("chest" as Slot, "plate", "legendary", "valor"));
    const b = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    const w = new GearItem("chest" as Slot, "plate", "worn", "rusty");
    gs.lootPool = [b, w];
    gs.autoSellQualities = ["worn"]; // pre-set worn
    gs.toggleAutoSellQuality("broken"); // add broken, trigger sweep of both
    expect(gs.lootPool.length).toBe(0);
    expect(gs.gold).toBe(b.sellValue + w.sellValue);
  });

  it("sweep after kill sells matching items", () => {
    const gs = withAutoSeller();
    gs.autoSellQualities = ["broken"];
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.lootPool = [];
    for (let i = 0; i < LOOT_MAX; i++) {
      gs.lootPool.push(new GearItem("main_hand" as Slot, "sword", "broken", "rusty"));
    }
    gs.onEnemyDeath();
    expect(gs.lootPool.some(i => i.quality === "broken")).toBe(false);
  });

  it("buying Auto Seller sweeps existing loot immediately", () => {
    const gs = withPrestige(5);
    gs.autoSellQualities = ["broken"]; // pre-configure before purchase
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.lootPool = [new GearItem("main_hand" as Slot, "sword", "broken", "rusty")];
    gs.buyPrestigeUpgrade("auto_seller");
    expect(gs.lootPool.length).toBe(0);
    expect(gs.gold).toBeGreaterThan(0);
  });

  it("auto_sell_qualities round-trips through toDict/fromDict", () => {
    const gs = withAutoSeller();
    gs.autoSellQualities = ["broken", "worn"];
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.autoSellQualities).toEqual(["broken", "worn"]);
  });
});

describe("class ability effects", () => {
  function geared(gs: GameState): GameState {
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    return gs;
  }
  function frozen(gs: GameState): GameState {
    gs.enemy.hp = gs.enemy.max_hp = 999_999;
    gs.enemy.attack_dps = 0;
    return gs;
  }

  // ── Iron Skin ──
  it("iron_skin reduces damage taken by 20%", () => {
    const gs = frozen(geared(make()));
    gs.enemy.attack_dps = 10;
    const player = gs.party.team[0];
    const startHp = player.health;
    gs.tick(1.0);
    const dmgWithout = startHp - player.health;

    player.health = startHp;
    player.damageReduction = 0.2;
    gs.enemy.hp = 999_999;
    gs.tick(1.0);
    const dmgWith = startHp - player.health;

    expect(dmgWith).toBeCloseTo(dmgWithout * 0.8, 1);
  });

  // ── Bloodlust ──
  it("bloodlust boosts DPS when fighter HP is at or below 50%", () => {
    const gs = frozen(geared(make()));
    const fighter = gs.party.team[0];
    fighter.health = Math.floor(fighter.maxHealth * 0.4);

    gs.tick(1.0);
    const dpsNormal = 999_999 - gs.enemy.hp;

    fighter.abilities = ["bloodlust"];
    fighter.health = Math.floor(fighter.maxHealth * 0.4);
    gs.enemy.hp = 999_999;
    gs.tick(1.0);
    const dpsBloodlust = 999_999 - gs.enemy.hp;

    expect(dpsBloodlust).toBeCloseTo(dpsNormal * BLOODLUST_MULTIPLIER, 0);
  });

  it("bloodlust does not apply at full HP", () => {
    const gs = frozen(geared(make()));
    const fighter = gs.party.team[0];

    gs.tick(1.0);
    const dpsNormal = 999_999 - gs.enemy.hp;

    fighter.abilities = ["bloodlust"];
    fighter.health = fighter.maxHealth;
    gs.enemy.hp = 999_999;
    gs.tick(1.0);
    const dpsFullHp = 999_999 - gs.enemy.hp;

    expect(dpsFullHp).toBeCloseTo(dpsNormal, 0);
  });

  // ── Battle Standard ──
  it("battle_standard boosts other party member DPS on fighter level 20", () => {
    const gs = make();
    const rogue = new Character("Rogue", "rogue", 1);
    gs.party.addPlayer(rogue);
    gs.upgrades["Rogue"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    rogue.xpToNext = 999_999;
    const fighter = gs.party.team[0];
    fighter.level = 19; fighter.xpToNext = 1; fighter.xp = 0;

    const rogueDpsBefore = rogue.dps;
    gs.enemy.xp_reward = 5;
    gs.onEnemyDeath();

    expect(rogue.dps).toBeCloseTo(rogueDpsBefore * 1.1);
  });

  it("battle_standard does not boost the fighter herself", () => {
    const gs = make();
    const fighter = gs.party.team[0];
    fighter.level = 19; fighter.xpToNext = 5; fighter.xp = 0; // exactly one level-up
    const dpsBefore = fighter.dps;
    gs.enemy.xp_reward = 5;
    gs.onEnemyDeath();
    // fighter DPS increase should only come from normal level-up mult, not from battle_standard
    expect(fighter.dps).toBeCloseTo(dpsBefore * 1.2); // 1.2 is fighter's dpsMult
  });

  // ── Lucky Strike ──
  it("lucky_strike occasionally crits for more than base click damage", () => {
    const gs = make();
    const rogue = new Character("Rogue", "rogue", 1);
    gs.party.addPlayer(rogue);

    gs.enemy.hp = gs.enemy.max_hp = 999_999_999;
    gs.enemy.attack_dps = 0;

    // Measure baseline click damage with NO ability active (avoids crit inflating baseline)
    gs.click();
    const baseDamage = 999_999_999 - gs.enemy.hp;

    // Now enable lucky_strike and make 200 clicks
    rogue.abilities = ["lucky_strike"];
    gs.enemy.hp = 999_999_999;
    for (let i = 0; i < 200; i++) gs.click();
    const totalDamage = 999_999_999 - gs.enemy.hp;

    // Without any crits: 200 × baseDamage. With 25% crits: ~300 × baseDamage.
    expect(totalDamage).toBeGreaterThan(200 * baseDamage);
  });

  // ── Blade Mastery ──
  it("blade_mastery applies in engine when rogue with ability is present", () => {
    const gs = frozen(make());
    const rogue = new Character("Rogue", "rogue", 1);
    rogue.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.party.addPlayer(rogue);

    gs.tick(1.0);
    const dpsWithout = 999_999 - gs.enemy.hp;

    rogue.abilities = ["blade_mastery"];
    rogue.dps *= 1.5; // manually apply as character.ts would
    gs.enemy.hp = 999_999;
    gs.tick(1.0);
    const dpsWith = 999_999 - gs.enemy.hp;

    expect(dpsWith).toBeGreaterThan(dpsWithout);
  });

  // ── Expose Weakness ──
  it("expose_weakness increases all damage dealt by 25%", () => {
    const gs = frozen(geared(make()));
    gs.tick(1.0);
    const dpsWithout = 999_999 - gs.enemy.hp;

    const rogue = new Character("Rogue", "rogue", 1);
    rogue.abilities = ["expose_weakness"];
    gs.party.addPlayer(rogue);
    gs.enemy.hp = 999_999;
    gs.tick(1.0);
    const dpsWith = 999_999 - gs.enemy.hp;

    expect(dpsWith).toBeCloseTo(dpsWithout * EXPOSE_WEAKNESS_MULT, 0);
  });

  // ── Arcane Study ──
  it("arcane_study boosts all party XP on mage level 5", () => {
    const gs = make();
    const mage = new Character("Mage", "mage", 1);
    gs.party.addPlayer(mage);
    gs.upgrades["Mage"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    gs.party.team[0].xpToNext = 999_999; // fighter won't level up
    mage.level = 4; mage.xpToNext = 5; mage.xp = 0; // exactly one level-up (4→5)

    const fighterMultBefore = gs.party.team[0].xpMultiplier;
    gs.enemy.xp_reward = 5;
    gs.onEnemyDeath();

    // Fighter only gets the arcane_study ×1.25 boost (no level-up of its own)
    expect(gs.party.team[0].xpMultiplier).toBeCloseTo(fighterMultBefore * 1.25);
    // Mage: level-up adds +0.05, then arcane_study ×1.25 is applied to new value
    expect(mage.xpMultiplier).toBeCloseTo((1.0 + 0.05) * 1.25);
  });

  // ── Mana Surge ──
  it("mana_surge deals burst damage at MANA_SURGE_INTERVAL seconds", () => {
    const gs = make();
    const mage = new Character("Mage", "mage", 1);
    mage.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    mage.abilities = ["mana_surge"];
    gs.party.addPlayer(mage);
    gs.enemy.hp = gs.enemy.max_hp = 999_999;
    gs.enemy.attack_dps = 0;
    // lead fighter has no gear — only mage contributes DPS
    gs.party.team[0].inventory.slots["main_hand" as Slot] = null;

    const expectedAuto = mage.dps * MANA_SURGE_INTERVAL;
    const expectedSurge = mage.dps * MANA_SURGE_MULTIPLIER;
    gs.tick(MANA_SURGE_INTERVAL);
    const actualDamage = 999_999 - gs.enemy.hp;

    expect(actualDamage).toBeCloseTo(expectedAuto + expectedSurge, 0);
  });

  it("mana_surge does not fire before the interval", () => {
    const gs = make();
    const mage = new Character("Mage", "mage", 1);
    mage.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    mage.abilities = ["mana_surge"];
    gs.party.addPlayer(mage);
    gs.enemy.hp = gs.enemy.max_hp = 999_999;
    gs.enemy.attack_dps = 0;

    gs.tick(MANA_SURGE_INTERVAL - 0.1);
    const damage = 999_999 - gs.enemy.hp;
    const expectedAutoOnly = mage.dps * (MANA_SURGE_INTERVAL - 0.1);
    expect(damage).toBeCloseTo(expectedAutoOnly, 0);
  });

  // ── Empower ──
  it("empower doubles click damage", () => {
    const gs = make();
    const mage = new Character("Mage", "mage", 1);
    gs.party.addPlayer(mage);

    gs.enemy.hp = gs.enemy.max_hp = 999_999_999;
    gs.click();
    const dmgWithout = 999_999_999 - gs.enemy.hp;

    mage.abilities = ["empower"];
    gs.enemy.hp = 999_999_999;
    gs.click();
    const dmgWith = 999_999_999 - gs.enemy.hp;

    expect(dmgWith).toBeCloseTo(dmgWithout * EMPOWER_MULTIPLIER);
  });
});

describe("auto-equip prestige upgrade", () => {
  function withAutoEquip(): GameState {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_equip");
    return gs;
  }

  it("auto_equip costs 2 points and is recorded", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_equip");
    expect(gs.prestigeUpgrades["auto_equip"]).toBe(1);
    expect(gs.prestigePoints).toBe(3);
  });

  it("auto_equip cannot be bought twice", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_equip");
    gs.buyPrestigeUpgrade("auto_equip");
    expect(gs.prestigeUpgrades["auto_equip"]).toBe(1);
    expect(gs.prestigePoints).toBe(3);
  });

  it("auto_equip not purchased — upgrade loot stays unequipped after kill", () => {
    const gs = make();
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    gs.lootPool = [strong];
    gs.onEnemyDeath();
    expect(gs.party.team[0].inventory.slots["main_hand" as Slot]).toBeNull();
  });

  it("auto_equip owned — upgrade item is equipped after kill", () => {
    const gs = withAutoEquip();
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    gs.lootPool = [strong];
    gs.onEnemyDeath();
    expect(gs.party.team[0].inventory.slots["main_hand" as Slot]).toBe(strong);
    expect(gs.lootPool.includes(strong)).toBe(false);
  });

  it("auto_equip — displaced item sold for gold", () => {
    const gs = withAutoEquip();
    const weak = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    gs.party.team[0].inventory.slots["main_hand" as Slot] = weak;
    gs.party.team[0].dps += weak.damage;
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    gs.lootPool = [strong];
    gs.onEnemyDeath();
    expect(gs.gold).toBeGreaterThanOrEqual(weak.sellValue);
    expect(gs.party.team[0].inventory.slots["main_hand" as Slot]).toBe(strong);
  });

  it("auto_equip — non-upgrade items stay in pool", () => {
    const gs = withAutoEquip();
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    gs.party.team[0].inventory.slots["main_hand" as Slot] = strong;
    gs.party.team[0].dps += strong.damage;
    const weak = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    gs.lootPool = [weak];
    gs.onEnemyDeath();
    expect(gs.lootPool.some(i => i === weak)).toBe(true);
  });

  it("auto_equip sweeps existing loot on purchase", () => {
    const gs = withPrestige(5);
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    gs.lootPool = [strong];
    gs.buyPrestigeUpgrade("auto_equip");
    expect(gs.party.team[0].inventory.slots["main_hand" as Slot]).toBe(strong);
    expect(gs.lootPool.includes(strong)).toBe(false);
  });
});

describe("auto-upgrade prestige upgrade", () => {
  function withAutoUpgrade(): GameState {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_upgrade");
    return gs;
  }

  it("auto_upgrade costs 2 points and is recorded", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_upgrade");
    expect(gs.prestigeUpgrades["auto_upgrade"]).toBe(1);
    expect(gs.prestigePoints).toBe(3);
  });

  it("auto_upgrade cannot be bought twice", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("auto_upgrade");
    gs.buyPrestigeUpgrade("auto_upgrade");
    expect(gs.prestigeUpgrades["auto_upgrade"]).toBe(1);
    expect(gs.prestigePoints).toBe(3);
  });

  it("auto_upgrade not purchased — no upgrades bought after kill", () => {
    const gs = make();
    gs.gold = 10_000;
    const c = gs.party.team[0];
    gs.onEnemyDeath();
    const totalLevels = Object.values(gs.upgrades[c.name]).reduce((s, v) => s + v, 0);
    expect(totalLevels).toBe(0);
  });

  it("auto_upgrade — buys cheapest affordable upgrade after kill", () => {
    const gs = withAutoUpgrade();
    gs.gold = 50; // enough for click (40g), cheapest tier-0 upgrade
    const c = gs.party.team[0];
    gs.onEnemyDeath();
    const totalLevels = Object.values(gs.upgrades[c.name]).reduce((s, v) => s + v, 0);
    expect(totalLevels).toBeGreaterThan(0);
    expect(gs.gold).toBeLessThan(50);
  });

  it("auto_upgrade — does not buy when gold insufficient", () => {
    const gs = withAutoUpgrade();
    gs.gold = 0;
    const c = gs.party.team[0];
    gs.onEnemyDeath();
    const totalLevels = Object.values(gs.upgrades[c.name]).reduce((s, v) => s + v, 0);
    expect(totalLevels).toBe(0);
  });

  it("auto_upgrade — buys multiple upgrades in one sweep", () => {
    const gs = withAutoUpgrade();
    gs.gold = 10_000;
    const c = gs.party.team[0];
    gs.onEnemyDeath();
    const totalLevels = Object.values(gs.upgrades[c.name]).reduce((s, v) => s + v, 0);
    expect(totalLevels).toBeGreaterThan(1);
  });

  it("auto_upgrade runs on purchase immediately if gold available", () => {
    const gs = withPrestige(5);
    gs.gold = 10_000;
    const c = gs.party.team[0];
    gs.buyPrestigeUpgrade("auto_upgrade");
    const totalLevels = Object.values(gs.upgrades[c.name]).reduce((s, v) => s + v, 0);
    expect(totalLevels).toBeGreaterThan(0);
  });
});

describe("checkpoint system", () => {
  function killBossAtLevel(gs: GameState, level: number): void {
    gs.dungeonLevel = level;
    gs.kills = 0;
    gs.enemy = { name: "Boss", level, hp: 0, max_hp: 1, xp_reward: 1, gold_reward: 1, attack_dps: 0, isBoss: true };
    gs.onEnemyDeath();
  }

  it("checkpointLevel starts at 1", () => {
    expect(make().checkpointLevel).toBe(1);
  });

  it("checkpoint updates to dungeonLevel when a multiple-of-10 floor is entered", () => {
    const gs = make();
    killBossAtLevel(gs, 9); // boss on floor 9 → enter floor 10
    expect(gs.checkpointLevel).toBe(10);
  });

  it("checkpoint updates at 20 and 30", () => {
    const gs = make();
    killBossAtLevel(gs, 19);
    expect(gs.checkpointLevel).toBe(20);
    killBossAtLevel(gs, 29);
    expect(gs.checkpointLevel).toBe(30);
  });

  it("checkpoint does NOT update on non-multiple floors", () => {
    const gs = make();
    killBossAtLevel(gs, 5); // floor 6
    killBossAtLevel(gs, 13); // floor 14
    expect(gs.checkpointLevel).toBe(1);
  });

  it("death respawns at checkpointLevel", () => {
    const gs = make();
    killBossAtLevel(gs, 9); // set checkpoint to 10
    gs.onPlayerDeath();
    expect(gs.dungeonLevel).toBe(10);
    expect(gs.enemy.level).toBe(10);
  });

  it("death at checkpointLevel=1 still respawns at floor 1 (no regression)", () => {
    const gs = make();
    expect(gs.checkpointLevel).toBe(1);
    gs.onPlayerDeath();
    expect(gs.dungeonLevel).toBe(1);
  });

  it("prestige resets checkpointLevel to 1", () => {
    const gs = withHighLevel(20);
    killBossAtLevel(gs, 9);
    expect(gs.checkpointLevel).toBe(10);
    gs.prestige();
    expect(gs.checkpointLevel).toBe(1);
  });

  it("checkpoint_level round-trips through toDict/fromDict", () => {
    const gs = make();
    killBossAtLevel(gs, 9);
    expect(gs.checkpointLevel).toBe(10);
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.checkpointLevel).toBe(10);
  });
});

describe("renown", () => {
  it("renown starts at 0", () => {
    expect(make().renown).toBe(0);
  });

  it("renownPreview returns floor(highestLevel / 10)", () => {
    expect(withHighLevel(20).renownPreview()).toBe(2);
    expect(withHighLevel(30).renownPreview()).toBe(3);
    expect(withHighLevel(50).renownPreview()).toBe(5);
  });

  it("renownPreview is 0 below floor 10", () => {
    expect(make().renownPreview()).toBe(0);
    expect(withHighLevel(9).renownPreview()).toBe(0);
  });

  it("chronicle_room stacks add to renownPreview", () => {
    const gs = withHighLevel(20);
    gs.renown = GUILD_HALL_THRESHOLDS["chronicle_room"][1]; // level 2 threshold
    expect(gs.renownPreview()).toBe(4); // 2 base + 2 chronicle levels
  });

  it("prestige() earns renown based on highestLevel", () => {
    const gs = withHighLevel(20);
    gs.prestige();
    expect(gs.renown).toBe(2);
  });

  it("prestige() does NOT reset renown", () => {
    const gs = withHighLevel(20);
    gs.prestige();
    gs.highestLevel = 20;
    gs.prestige();
    expect(gs.renown).toBe(4); // 2 + 2
  });

  it("renown accumulates across multiple prestiges", () => {
    const gs = withHighLevel(30);
    gs.prestige(); // earns 3
    gs.highestLevel = 20;
    gs.prestige(); // earns 2
    expect(gs.renown).toBe(5);
  });

  it("renown round-trips through toDict/fromDict", () => {
    const gs = withHighLevel(20);
    gs.prestige();
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.renown).toBe(2);
  });
});

describe("guild hall", () => {
  function withRenown(n: number): GameState {
    const gs = make();
    gs.renown = n;
    return gs;
  }

  it("guildLevel returns 0 below first threshold", () => {
    const gs = withRenown(GUILD_HALL_THRESHOLDS["armory"][0] - 1);
    expect(gs.guildLevel("armory")).toBe(0);
  });

  it("guildLevel returns 1 at first threshold", () => {
    const gs = withRenown(GUILD_HALL_THRESHOLDS["armory"][0]);
    expect(gs.guildLevel("armory")).toBe(1);
  });

  it("guildLevel returns 2 at second threshold", () => {
    const gs = withRenown(GUILD_HALL_THRESHOLDS["armory"][1]);
    expect(gs.guildLevel("armory")).toBe(2);
  });

  it("guildLevel returns 3 at third threshold (max)", () => {
    const gs = withRenown(GUILD_HALL_THRESHOLDS["armory"][2]);
    expect(gs.guildLevel("armory")).toBe(3);
  });

  it("guildLevel returns 0 for unknown type", () => {
    expect(withRenown(100).guildLevel("nonexistent")).toBe(0);
  });

  it("vault carries 10% of gold per stack on prestige", () => {
    const gs = withHighLevel(20);
    gs.gold = 1000;
    gs.renown = GUILD_HALL_THRESHOLDS["vault"][0]; // level 1
    gs.prestige();
    expect(gs.gold).toBe(100); // 10% of 1000 (no starting_gold perk)
  });

  it("vault 3 stacks carries 30% of gold on prestige", () => {
    const gs = withHighLevel(20);
    gs.gold = 1000;
    gs.renown = GUILD_HALL_THRESHOLDS["vault"][2]; // level 3
    gs.prestige();
    expect(gs.gold).toBe(300);
  });

  it("armory adds N loot items to pool on prestige", () => {
    const gs = withHighLevel(20);
    gs.renown = GUILD_HALL_THRESHOLDS["armory"][1]; // level 2
    gs.prestige();
    expect(gs.lootPool.length).toBe(2);
  });

  it("training_yard levels up all party members on prestige", () => {
    const gs = withHighLevel(20);
    gs.renown = GUILD_HALL_THRESHOLDS["training_yard"][1]; // level 2
    gs.prestige();
    expect(gs.party.team[0].level).toBe(3); // started at 1, +2 from training
  });

  it("training_yard resets XP to 0 after level-ups", () => {
    const gs = withHighLevel(20);
    gs.renown = GUILD_HALL_THRESHOLDS["training_yard"][0]; // level 1
    gs.prestige();
    expect(gs.party.team[0].xp).toBe(0);
  });

  it("guild_upgrades in toDict reflects computed levels", () => {
    const gs = withRenown(GUILD_HALL_THRESHOLDS["armory"][0]); // armory level 1
    const dict = gs.toDict();
    expect(dict.guild_upgrades["armory"]).toBe(1);
    expect(dict.guild_upgrades["vault"]).toBe(0); // below vault threshold
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import {
  GameState, KILLS_PER_LEVEL, LOOT_MAX, UPGRADE_BASES, UPGRADE_EFFECTS, HP_UPGRADE_EFFECT, DEFENSE_UPGRADE_EFFECT,
  PRESTIGE_UNLOCK_LEVEL, PRESTIGE_SHOP_COSTS, STARTING_GOLD_PER_LEVEL, XP_BONUS_PER_LEVEL,
  BLOODLUST_MULTIPLIER, EXPOSE_WEAKNESS_MULT, MANA_SURGE_INTERVAL, MANA_SURGE_MULTIPLIER,
  LUCKY_STRIKE_CHANCE, LUCKY_STRIKE_MULTIPLIER, EMPOWER_MULTIPLIER,
  VENTURE_UNLOCK_LEVEL, IDLE_GOLD_RATE, OFFLINE_GOLD_CAP_SECONDS,
  GUILD_HALL_COSTS, SKILL_DEFS, COMBAT_HEAL_FRACTION,
  THEME_UNLOCKS,
  killsForFloor, prestigeUpgradeCost, ventureUnlockLevel,
} from "../src/engine.js";
import { Character } from "../src/character.js";
import { GearItem, getItem, type Slot } from "../src/gear.js";

function make(): GameState {
  return new GameState();
}

function withHighLevel(level: number): GameState {
  const gs = make();
  gs.highestLevel = level;
  // Pre-mark achievements that would fire during prestige to isolate prestige formula tests
  gs.achievementsUnlocked.add("first_prestige");
  gs.achievementsUnlocked.add("depth_tiered_bronze");
  gs.achievementsUnlocked.add("depth_tiered_silver");
  gs.achievementsUnlocked.add("depth_tiered_gold");
  return gs;
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
        new Set(["dps", "xp", "click", "hp", "defense"]),
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

  it("regular enemy kill partially heals player by COMBAT_HEAL_FRACTION", () => {
    const gs = make();
    const player = gs.party.team[0];
    player.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    player.health = 1;
    gs.enemy.hp = 0.1;
    gs.enemy.isBoss = false;
    gs.tick(1.0);
    const expected = Math.min(player.maxHealth, 1 + (player.maxHealth - 1) * COMBAT_HEAL_FRACTION);
    expect(player.health).toBeCloseTo(expected, 1);
  });

  it("regular enemy kill does not overheal above maxHealth", () => {
    const gs = make();
    const player = gs.party.team[0];
    player.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    player.health = player.maxHealth;
    gs.enemy.hp = 0.1;
    gs.enemy.isBoss = false;
    gs.tick(1.0);
    expect(player.health).toBe(player.maxHealth);
  });

  it("boss kill partially heals party (same as regular enemy)", () => {
    const gs = make();
    const player = gs.party.team[0];
    player.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    player.health = 1;
    gs.enemy = { name: "Boss", level: 1, hp: 0, max_hp: 1, xp_reward: 1, gold_reward: 1, attack_dps: 0, isBoss: true };
    gs.dungeonLevel = 1;
    gs.onEnemyDeath();
    const expected = Math.min(player.maxHealth, 1 + (player.maxHealth - 1) * COMBAT_HEAL_FRACTION);
    expect(player.health).toBeCloseTo(expected, 1);
  });

  it("level-up restores 50% of missing HP", () => {
    const gs = make();
    const player = gs.party.team[0];
    const startHealth = 1;
    player.health = startHealth;
    const maxBefore = player.maxHealth;
    player.levelUp();
    const newMax = player.maxHealth; // maxHealth increased by HP_PER_LEVEL
    const expected = Math.min(newMax, startHealth + (newMax - startHealth) * 0.50);
    expect(player.health).toBeCloseTo(expected, 1);
    expect(player.health).toBeLessThan(newMax);
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
    gs.upgrades["Rogue"] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
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
    gs.upgrades["Rogue"] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
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

  it("equipLoot sells displaced item when no companion benefits", () => {
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

  it("equipLoot passes displaced item to companion if it's an upgrade for them", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("party_slot_2", "fighter");
    const lead = gs.party.team[0];
    const comp = gs.party.team[1];
    const weak = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    lead.inventory.slots["main_hand" as Slot] = weak;
    lead.dps += weak.damage;
    // companion has no weapon
    gs.lootPool = [strong];
    gs.equipLoot(0);
    expect(lead.inventory.slots["main_hand" as Slot]).toBe(strong);  // lead got the upgrade
    expect(comp.inventory.slots["main_hand" as Slot]).toBe(weak);    // displaced item went to companion
    expect(gs.gold).toBe(0);  // nothing was sold
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

  it("equipAll passes displaced item to companion if it's an upgrade for them", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("party_slot_2", "fighter");
    const lead = gs.party.team[0];
    const comp = gs.party.team[1];
    const weak = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    lead.inventory.slots["main_hand" as Slot] = weak;
    lead.dps += weak.damage;
    gs.lootPool = [strong];
    gs.equipAll();
    expect(lead.inventory.slots["main_hand" as Slot]).toBe(strong);
    expect(comp.inventory.slots["main_hand" as Slot]).toBe(weak);
    expect(gs.gold).toBe(0);
  });

  it("equipAll returns valid JSON", () => {
    expect(JSON.parse(withLoot().equipAll())).toHaveProperty("loot_pool");
  });

  it("sellAll clears the pool", () => {
    const gs = withLoot();
    gs.sellAll();
    expect(gs.lootPool.length).toBe(0);
  });

  it("sellAll adds gold for every item", () => {
    const gs = withLoot();
    const total = gs.lootPool.reduce((s, i) => s + i.sellValue, 0);
    gs.sellAll();
    expect(gs.gold).toBe(total);
  });

  it("sellAll on empty pool is a no-op", () => {
    const gs = make();
    gs.lootPool = [];
    gs.sellAll();
    expect(gs.gold).toBe(0);
  });

  it("sellAll returns valid JSON", () => {
    expect(JSON.parse(withLoot().sellAll())).toHaveProperty("loot_pool");
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

  it("all upgrade types survive fromDict round-trip", () => {
    const gs = withGold();
    const c = gs.party.team[0];
    gs.buyUpgrade(c.name, "dps");
    gs.buyUpgrade(c.name, "dps");
    gs.buyUpgrade(c.name, "xp");
    gs.buyUpgrade(c.name, "click");
    gs.buyUpgrade(c.name, "click");
    gs.buyUpgrade(c.name, "click");
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.upgrades[c.name].dps).toBe(2);
    expect(restored.upgrades[c.name].xp).toBe(1);
    expect(restored.upgrades[c.name].click).toBe(3);
    expect(restored.party.team[0].dps).toBeCloseTo(c.dps);
    expect(restored.party.team[0].xpMultiplier).toBeCloseTo(c.xpMultiplier);
    expect(restored.party.team[0].clickBonus).toBeCloseTo(c.clickBonus);
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

  it("player death records the floor in deathFloors", () => {
    const gs = make();
    gs.dungeonLevel = 7;
    gs.onPlayerDeath();
    expect(gs.deathFloors[7]).toBe(1);
  });

  it("deathFloors increments on repeated deaths at the same floor", () => {
    const gs = make();
    gs.dungeonLevel = 3;
    gs.onPlayerDeath();
    gs.dungeonLevel = 3; // reset back (onPlayerDeath sends you to checkpoint)
    gs.onPlayerDeath();
    expect(gs.deathFloors[3]).toBe(2);
  });

  it("deathFloors resets on prestige", () => {
    const gs = withHighLevel(PRESTIGE_UNLOCK_LEVEL);
    gs.deathFloors = { 5: 1, 10: 2 };
    gs.prestige();
    expect(gs.deathFloors).toEqual({});
  });

  it("deathFloors resets on venture", () => {
    const gs = make();
    gs.highestLevel = VENTURE_UNLOCK_LEVEL;
    gs.deathFloors = { 5: 1, 12: 1 };
    gs.venture();
    expect(gs.deathFloors).toEqual({});
  });

  it("death_floors appears in toDict", () => {
    const gs = make();
    gs.dungeonLevel = 8;
    gs.onPlayerDeath();
    expect(gs.toDict().death_floors[8]).toBe(1);
  });

  it("death_floors round-trips through fromDict", () => {
    const gs = make();
    gs.deathFloors = { 5: 2, 10: 1 };
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.deathFloors[5]).toBe(2);
    expect(restored.deathFloors[10]).toBe(1);
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

  it("smart_seller costs 4 points", () => {
    const gs = withPrestige(10);
    gs.buyPrestigeUpgrade("auto_seller");
    gs.buyPrestigeUpgrade("smart_seller");
    expect(gs.prestigeUpgrades["smart_seller"]).toBe(1);
    expect(gs.prestigePoints).toBe(5); // 10 - 1 (auto_seller) - 4 (smart_seller)
  });

  it("smart_seller cannot be bought without auto_seller", () => {
    const gs = withPrestige(10);
    gs.buyPrestigeUpgrade("smart_seller");
    expect(gs.prestigeUpgrades["smart_seller"] ?? 0).toBe(0);
    expect(gs.prestigePoints).toBe(10);
  });

  it("smart_seller cannot be bought twice", () => {
    const gs = withPrestige(20);
    gs.buyPrestigeUpgrade("auto_seller");
    gs.buyPrestigeUpgrade("smart_seller"); gs.buyPrestigeUpgrade("smart_seller");
    expect(gs.prestigeUpgrades["smart_seller"]).toBe(1);
  });

  it("smart_seller immediately adds available qualities on purchase", () => {
    const gs = withPrestige(10);
    gs.highestLevel = 5; // autoSellThreshold(5) = 1 → broken + worn
    gs.buyPrestigeUpgrade("auto_seller");
    gs.buyPrestigeUpgrade("smart_seller");
    expect(gs.autoSellQualities).toContain("broken");
    expect(gs.autoSellQualities).toContain("worn");
  });

  it("smart_seller adds new quality when highestLevel advances past a threshold", () => {
    const gs = withPrestige(10);
    gs.buyPrestigeUpgrade("auto_seller");
    gs.buyPrestigeUpgrade("smart_seller");
    gs.highestLevel = 4; // autoSellThreshold(4) = 0 → only broken
    gs.autoSellQualities = [];
    // Simulate advancing to a new floor that crosses the threshold
    gs.highestLevel = 5; // autoSellThreshold(5) = 1 → worn becomes available
    // Manually call onEnemyDeath path by advancing highestLevel and triggering sync
    // We can test syncSmartSeller indirectly by checking after next boss kill
    // Instead test the public effect: after highestLevel update the qualities sync
    // The sync happens inside onEnemyDeath when dungeonLevel > highestLevel
    gs.highestLevel = 4; // reset
    gs.dungeonLevel = 5;
    gs.enemy.isBoss = true;
    gs.enemy.xp_reward = 0;
    gs.enemy.gold_reward = 0;
    gs.onEnemyDeath();
    expect(gs.autoSellQualities).toContain("worn");
  });

  it("smart_seller sells non-upgrades when chest is full", () => {
    const gs = withPrestige(10);
    gs.buyPrestigeUpgrade("auto_seller");
    gs.buyPrestigeUpgrade("smart_seller");
    gs.autoSellQualities = []; // no quality tiers checked
    // Equip the lead with legendary gear in every slot so nothing in the pool is an upgrade
    const lead = gs.party.team[0];
    for (const slot of Object.keys(lead.inventory.slots)) {
      lead.inventory.slots[slot as Slot] = new GearItem(slot as Slot, "sword", "legendary", "valor");
    }
    // Fill chest to max with weak items
    gs.lootPool = [];
    for (let i = 0; i < gs.lootMax; i++) {
      gs.lootPool.push(new GearItem("main_hand" as Slot, "sword", "broken", "rusty"));
    }
    const goldBefore = gs.gold;
    gs.onEnemyDeath();
    expect(gs.lootPool.length).toBeLessThan(gs.lootMax);
    expect(gs.gold).toBeGreaterThan(goldBefore);
  });

  it("smart_seller does NOT sell non-upgrades when chest is not full", () => {
    const gs = withPrestige(10);
    gs.buyPrestigeUpgrade("auto_seller");
    gs.buyPrestigeUpgrade("smart_seller");
    gs.autoSellQualities = [];
    const lead = gs.party.team[0];
    for (const slot of Object.keys(lead.inventory.slots)) {
      lead.inventory.slots[slot as Slot] = new GearItem(slot as Slot, "sword", "legendary", "valor");
    }
    const weakItem = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    gs.lootPool = [weakItem]; // 1 item — chest not full
    gs.onEnemyDeath();
    expect(gs.lootPool).toContain(weakItem); // item kept since chest wasn't full
  });

  it("starting_gold is stackable", () => {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("starting_gold"); gs.buyPrestigeUpgrade("starting_gold");
    expect(gs.prestigeUpgrades["starting_gold"]).toBe(2);
  });

  it("starting_gold first purchase costs 1 pt", () => {
    expect(prestigeUpgradeCost("starting_gold", 0)).toBe(1);
  });

  it("starting_gold second purchase costs 2 pts", () => {
    expect(prestigeUpgradeCost("starting_gold", 1)).toBe(2);
  });

  it("starting_gold Nth purchase costs base + (N-1) pts", () => {
    for (let n = 0; n < 5; n++) {
      expect(prestigeUpgradeCost("starting_gold", n)).toBe(1 + n);
    }
  });

  it("xp_bonus cost scales the same way", () => {
    for (let n = 0; n < 5; n++) {
      expect(prestigeUpgradeCost("xp_bonus", n)).toBe(1 + n);
    }
  });

  it("starting_gold scaling cost is deducted correctly", () => {
    const gs = withPrestige(10);
    gs.buyPrestigeUpgrade("starting_gold"); // costs 1 → 9 pts left
    gs.buyPrestigeUpgrade("starting_gold"); // costs 2 → 7 pts left
    gs.buyPrestigeUpgrade("starting_gold"); // costs 3 → 4 pts left
    expect(gs.prestigePoints).toBe(4);
    expect(gs.prestigeUpgrades["starting_gold"]).toBe(3);
  });

  it("starting_gold second purchase fails with only 1 pt left", () => {
    const gs = withPrestige(2);
    gs.buyPrestigeUpgrade("starting_gold"); // costs 1 → 1 pt left
    gs.buyPrestigeUpgrade("starting_gold"); // costs 2 → not enough
    expect(gs.prestigeUpgrades["starting_gold"]).toBe(1);
    expect(gs.prestigePoints).toBe(1);
  });

  it("starting_gold adds gold immediately on purchase", () => {
    const gs = withPrestige(10);
    const goldBefore = gs.gold;
    gs.buyPrestigeUpgrade("starting_gold");
    expect(gs.gold).toBe(goldBefore + STARTING_GOLD_PER_LEVEL);
    gs.buyPrestigeUpgrade("starting_gold");
    expect(gs.gold).toBe(goldBefore + STARTING_GOLD_PER_LEVEL * 2);
  });

  it("one-time upgrades (auto_seller) do not scale", () => {
    expect(prestigeUpgradeCost("auto_seller", 0)).toBe(1);
    expect(prestigeUpgradeCost("auto_seller", 1)).toBe(1); // ignored — it's one-time
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
    const broken = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    gs.lootPool = [];
    for (let i = 0; i < LOOT_MAX; i++) {
      gs.lootPool.push(new GearItem("main_hand" as Slot, "sword", "broken", "rusty"));
    }
    const goldBefore = gs.gold;
    gs.onEnemyDeath();
    // All LOOT_MAX broken items were sold before the new drop landed
    expect(gs.gold).toBeGreaterThanOrEqual(goldBefore + broken.sellValue * LOOT_MAX);
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
    gs.upgrades["Rogue"] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
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
    gs.upgrades["Mage"] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
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

  it("auto_equip — displaced item sold for gold when no companion benefits", () => {
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

  it("auto_equip — displaced item goes to companion if it's an upgrade for them", () => {
    const gs = withAutoEquip();
    gs.buyPrestigeUpgrade("party_slot_2", "fighter");
    const lead = gs.party.team[0];
    const comp = gs.party.team[1];
    const weak = new GearItem("main_hand" as Slot, "sword", "broken", "rusty");
    const strong = new GearItem("main_hand" as Slot, "sword", "legendary", "valor");
    lead.inventory.slots["main_hand" as Slot] = weak;
    lead.dps += weak.damage;
    // Clear companion's starting gear so weak is always an upgrade for them
    comp.inventory.slots["main_hand" as Slot] = null;
    gs.lootPool = [strong];
    gs.onEnemyDeath();
    expect(lead.inventory.slots["main_hand" as Slot]).toBe(strong);
    expect(comp.inventory.slots["main_hand" as Slot]).toBe(weak);
    expect(gs.gold).toBe(0);
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

  it("checkpoint updates when entering a covered floor (lv2 = up to floor 10)", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 2;
    killBossAtLevel(gs, 9); // boss on floor 9 → enter floor 10
    expect(gs.checkpointLevel).toBe(10);
  });

  it("checkpoint fires at floor 5 and 10 with lv2", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 2;
    killBossAtLevel(gs, 4);
    expect(gs.checkpointLevel).toBe(5);
    killBossAtLevel(gs, 9);
    expect(gs.checkpointLevel).toBe(10);
  });

  it("checkpoint does NOT update without prestige upgrade", () => {
    const gs = make();
    killBossAtLevel(gs, 4); // → floor 5, no upgrade
    expect(gs.checkpointLevel).toBe(1);
  });

  it("death respawns at checkpointLevel", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 2;
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
    gs.prestigeUpgrades["checkpoint"] = 2;
    killBossAtLevel(gs, 9);
    expect(gs.checkpointLevel).toBe(10);
    gs.prestige();
    expect(gs.checkpointLevel).toBe(1);
  });

  it("checkpoint_level round-trips through toDict/fromDict", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 2;
    killBossAtLevel(gs, 9);
    expect(gs.checkpointLevel).toBe(10);
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.checkpointLevel).toBe(10);
  });
});

describe("venture", () => {
  function withVentureReady(): GameState {
    const gs = withPrestige(5);
    gs.buyPrestigeUpgrade("party_slot_2", "fighter");
    gs.highestLevel = VENTURE_UNLOCK_LEVEL;
    return gs;
  }

  it("venture requires highestLevel >= 40", () => {
    const gs = make();
    gs.highestLevel = VENTURE_UNLOCK_LEVEL - 1;
    gs.venture();
    expect(gs.dungeonIndex).toBe(0);
  });

  it("venture creates fresh lead — same name and class, level 1", () => {
    const gs = withVentureReady();
    const origName = gs.party.team[0].name;
    const origClass = gs.party.team[0].characterClass;
    gs.party.team[0].levelUp(); // bump lead to level 2
    gs.venture();
    expect(gs.party.team[0].name).toBe(origName);
    expect(gs.party.team[0].characterClass).toBe(origClass);
    expect(gs.party.team[0].level).toBe(1);
  });

  it("venture clears lead gear (empty inventory slots)", () => {
    const gs = withVentureReady();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor"));
    gs.venture();
    expect(gs.party.team[0].inventory.slots["main_hand" as Slot]).toBeNull();
  });

  it("venture resets gold to 0", () => {
    const gs = withVentureReady();
    gs.gold = 9999;
    gs.venture();
    expect(gs.gold).toBe(0);
  });

  it("venture sets idleGoldRate from companion DPS × IDLE_GOLD_RATE", () => {
    const gs = withVentureReady();
    const compDps = gs.party.team[1].dps;
    gs.venture();
    expect(gs.idleGoldRate).toBeCloseTo(compDps * IDLE_GOLD_RATE);
  });

  it("venture with no companions sets idleGoldRate to 0", () => {
    const gs = withHighLevel(VENTURE_UNLOCK_LEVEL);
    gs.venture();
    expect(gs.idleGoldRate).toBe(0);
  });

  it("venture increments dungeonIndex to 1", () => {
    const gs = withVentureReady();
    gs.venture();
    expect(gs.dungeonIndex).toBe(1);
  });

  it("venture resets prestige points to 0", () => {
    const gs = withVentureReady();
    gs.prestigePoints = 3;
    gs.venture();
    expect(gs.prestigePoints).toBe(0);
  });

  it("venture removes companions from active party (solo lead)", () => {
    const gs = withVentureReady();
    expect(gs.party.team.length).toBeGreaterThan(1);
    gs.venture();
    expect(gs.party.team.length).toBe(1);
  });

  it("tick() accumulates idle gold when idleGoldRate > 0", () => {
    const gs = make();
    gs.idleGoldRate = 10;
    gs.tick(1);
    expect(gs.gold).toBeGreaterThanOrEqual(10);
  });

  it("dungeon_index and idle_gold_rate round-trip through toDict/fromDict", () => {
    const gs = withVentureReady();
    gs.venture();
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.dungeonIndex).toBe(1);
    expect(restored.idleGoldRate).toBeCloseTo(gs.idleGoldRate);
  });

  it("venture resets party slot upgrades so new companions can be recruited", () => {
    const gs = withVentureReady();
    expect(gs.prestigeUpgrades["party_slot_2"]).toBeGreaterThan(0);
    gs.venture();
    expect(gs.prestigeUpgrades["party_slot_2"]).toBe(0);
    expect(gs.prestigeUpgrades["party_slot_3"] ?? 0).toBe(0);
  });

  it("prestige in dungeon 2 restores companions when party slots re-purchased", () => {
    const gs = withVentureReady();
    gs.venture();
    // Re-buy party slot 2 in dungeon 2
    gs.prestigePoints = 5;
    gs.buyPrestigeUpgrade("party_slot_2", "rogue");
    gs.highestLevel = PRESTIGE_UNLOCK_LEVEL;
    gs.prestige();
    expect(gs.party.team.length).toBe(2);
    expect(gs.party.team[1].characterClass).toBe("rogue");
  });

  it("ventureUnlockLevel increases by 10 per dungeon", () => {
    expect(ventureUnlockLevel(0)).toBe(40);
    expect(ventureUnlockLevel(1)).toBe(50);
    expect(ventureUnlockLevel(2)).toBe(60);
    expect(ventureUnlockLevel(3)).toBe(70);
  });

  it("venture increments dungeonIndex on each call (infinite progression)", () => {
    const gs = withVentureReady();
    gs.venture();
    expect(gs.dungeonIndex).toBe(1);
    gs.highestLevel = ventureUnlockLevel(1); // dungeon 2 requires floor 50
    gs.venture();
    expect(gs.dungeonIndex).toBe(2);
  });

  it("venture accumulates idle gold rate across dungeons", () => {
    const gs = withVentureReady();
    const firstCompDps = gs.party.team[1].dps;
    gs.venture();
    const rateAfterFirst = gs.idleGoldRate;
    // Re-buy party slot and get a companion for dungeon 2
    gs.prestigePoints = 5;
    gs.buyPrestigeUpgrade("party_slot_2", "rogue");
    gs.highestLevel = ventureUnlockLevel(1); // dungeon 2 requires floor 50
    const secondCompDps = gs.party.team[1].dps;
    gs.venture();
    expect(gs.idleGoldRate).toBeCloseTo(rateAfterFirst + secondCompDps * IDLE_GOLD_RATE);
  });

  it("venture_available is true again at floor 50 in dungeon 2", () => {
    const gs = withVentureReady();
    gs.venture();
    gs.highestLevel = ventureUnlockLevel(1); // dungeon 2 requires floor 50
    const d = gs.toDict();
    expect(d.venture_available).toBe(true);
    expect(d.dungeon_index).toBe(1);
  });

  it("venture_available is false at floor 40 in dungeon 2", () => {
    const gs = withVentureReady();
    gs.venture();
    gs.highestLevel = VENTURE_UNLOCK_LEVEL; // only floor 40, dungeon 2 needs 50
    const d = gs.toDict();
    expect(d.venture_available).toBe(false);
  });
});

describe("guild hall", () => {
  function withGuildGold(gold = 100_000): GameState {
    const gs = make();
    gs.gold = gold;
    return gs;
  }

  // ── buyGuildUpgrade ──────────────────────────────────────────────
  it("buyGuildUpgrade deducts gold", () => {
    const gs = withGuildGold();
    const cost = GUILD_HALL_COSTS["expanded_armory"][0];
    gs.buyGuildUpgrade("expanded_armory");
    expect(gs.gold).toBeCloseTo(100_000 - cost);
  });

  it("buyGuildUpgrade fails when insufficient gold", () => {
    const gs = make(); // starts with 0 gold
    gs.buyGuildUpgrade("expanded_armory");
    expect(gs.guildUpgrades["expanded_armory"] ?? 0).toBe(0);
  });

  it("buyGuildUpgrade respects max stacks", () => {
    const gs = withGuildGold();
    const maxStacks = GUILD_HALL_COSTS["expanded_armory"].length;
    for (let i = 0; i <= maxStacks; i++) gs.buyGuildUpgrade("expanded_armory");
    expect(gs.guildUpgrades["expanded_armory"]).toBe(maxStacks);
  });

  // ── companion_hall / party slot expansion ────────────────────────
  it("companion_hall stack 1 allows party_slot_4 purchase", () => {
    const gs = withGuildGold();
    gs.buyGuildUpgrade("companion_hall");
    const d = gs.toDict();
    expect(d.guild_upgrades["companion_hall"]).toBe(1);
    // party_slot_4 should now be purchasable (requires companion_hall >= 1)
    gs.prestigePoints = 20;
    gs.prestigeUpgrades["party_slot_2"] = 1;
    gs.party.team.push(new Character("Companion", "fighter", 1));
    gs.prestigeUpgrades["party_slot_3"] = 1;
    gs.party.team.push(new Character("Ally", "fighter", 1));
    gs.buyPrestigeUpgrade("party_slot_4", "fighter");
    expect(gs.party.team.length).toBe(4);
  });

  it("party_slot_4 blocked when companion_hall < 1", () => {
    const gs = make();
    gs.prestigePoints = 20;
    gs.prestigeUpgrades["party_slot_2"] = 1;
    gs.party.team.push(new Character("Companion", "fighter", 1));
    gs.prestigeUpgrades["party_slot_3"] = 1;
    gs.party.team.push(new Character("Ally", "fighter", 1));
    gs.buyPrestigeUpgrade("party_slot_4", "fighter");
    expect(gs.party.team.length).toBe(3); // not added
  });

  // ── expanded_armory / lootMax ────────────────────────────────────
  it("expanded_armory increases lootMax by 2 per stack", () => {
    const gs = withGuildGold();
    expect(gs.lootMax).toBe(8);
    gs.buyGuildUpgrade("expanded_armory");
    expect(gs.lootMax).toBe(10);
    gs.buyGuildUpgrade("expanded_armory");
    expect(gs.lootMax).toBe(12);
  });

  it("lootMax caps at 14 with 3 stacks", () => {
    const gs = withGuildGold();
    for (let i = 0; i < 3; i++) gs.buyGuildUpgrade("expanded_armory");
    expect(gs.lootMax).toBe(14);
  });

  // ── persistence ──────────────────────────────────────────────────
  it("guildUpgrades survive prestige", () => {
    const gs = withGuildGold();
    gs.buyGuildUpgrade("expanded_armory");
    gs.highestLevel = PRESTIGE_UNLOCK_LEVEL;
    gs.prestige();
    expect(gs.guildUpgrades["expanded_armory"]).toBe(1);
  });

  it("guildUpgrades survive venture", () => {
    const gs = withGuildGold();
    gs.buyGuildUpgrade("expanded_armory");
    gs.highestLevel = VENTURE_UNLOCK_LEVEL;
    gs.venture();
    expect(gs.guildUpgrades["expanded_armory"]).toBe(1);
  });

  // ── activateSkill ────────────────────────────────────────────────
  it("activateSkill sets cooldown and active effect (kill-based)", () => {
    const gs = withGuildGold();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.party.team[0] = new Character("Hero", "fighter", 1);
    gs.activateSkill("skill_battle_cry");
    const def = SKILL_DEFS["skill_battle_cry"];
    expect(gs.skillCooldowns["skill_battle_cry"]).toBe(def.cooldownKills);
    expect(gs.activeEffects["skill_battle_cry"]).toBe(def.durationKills);
  });

  it("activateSkill works when a companion has the matching class", () => {
    const gs = withGuildGold();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    // Lead is rogue, companion is fighter — skill should still activate
    gs.party.team[0] = new Character("Hero", "rogue", 1);
    const fighter = new Character("Tank", "fighter", 1);
    gs.party.team.push(fighter);
    gs.upgrades["Tank"] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
    gs.activateSkill("skill_battle_cry");
    expect(gs.activeEffects["skill_battle_cry"]).toBe(SKILL_DEFS["skill_battle_cry"].durationKills);
  });

  it("activateSkill fails when skill not purchased", () => {
    const gs = make();
    gs.party.team[0] = new Character("Hero", "fighter", 1);
    gs.activateSkill("skill_battle_cry");
    expect(gs.skillCooldowns["skill_battle_cry"]).toBeUndefined();
  });

  it("activateSkill fails when no party member has the matching class", () => {
    const gs = make();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.party.team[0] = new Character("Hero", "rogue", 1);
    gs.activateSkill("skill_battle_cry");
    expect(gs.skillCooldowns["skill_battle_cry"]).toBeUndefined();
  });

  it("active skill decrements by 1 on each enemy kill", () => {
    const gs = make();
    gs.activeEffects["skill_battle_cry"] = 3;
    gs.enemy.hp = 0;
    gs.tick(0.1);
    expect(gs.activeEffects["skill_battle_cry"]).toBe(2);
  });

  it("active skill expires after durationKills kills", () => {
    const gs = make();
    gs.activeEffects["skill_battle_cry"] = 1;
    gs.enemy.hp = 0;
    gs.tick(0.1);
    expect(gs.activeEffects["skill_battle_cry"]).toBeUndefined();
  });

  it("activateSkill fails when on cooldown", () => {
    const gs = withGuildGold();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.party.team[0] = new Character("Hero", "fighter", 1);
    gs.activateSkill("skill_battle_cry");
    const firstActivation = gs.skillCooldowns["skill_battle_cry"];
    gs.activateSkill("skill_battle_cry");
    expect(gs.skillCooldowns["skill_battle_cry"]).toBe(firstActivation); // unchanged
  });

  it("skill cooldown decrements by 1 on each enemy kill", () => {
    const gs = withGuildGold();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.party.team[0] = new Character("Hero", "fighter", 1);
    gs.activateSkill("skill_battle_cry");
    const def = SKILL_DEFS["skill_battle_cry"];
    expect(gs.skillCooldowns["skill_battle_cry"]).toBe(def.cooldownKills);
    // Kill enough enemies to exhaust the active effect first
    for (let i = 0; i < def.durationKills; i++) {
      gs.enemy.hp = 0;
      gs.tick(0.1);
    }
    // Now the skill is off (active expired), cooldown should have decremented durationKills times
    expect(gs.skillCooldowns["skill_battle_cry"]).toBe(def.cooldownKills - def.durationKills);
  });

  it("skill cooldown clears after enough kills", () => {
    const gs = make();
    gs.skillCooldowns["skill_battle_cry"] = 2;
    gs.enemy.hp = 0;
    gs.tick(0.1);
    expect(gs.skillCooldowns["skill_battle_cry"]).toBe(1);
    gs.enemy.hp = 0;
    gs.tick(0.1);
    expect(gs.skillCooldowns["skill_battle_cry"]).toBeUndefined();
  });

  it("fromDict migrates old timestamp cooldowns to 0", () => {
    const gs = make();
    const dict = JSON.parse(gs.respond());
    dict.skill_cooldowns = { skill_battle_cry: Date.now() }; // old timestamp format
    const restored = GameState.fromDict(dict);
    expect(restored.skillCooldowns["skill_battle_cry"]).toBe(0);
  });

  it("skill_battle_cry doubles party DPS during active window", () => {
    const sword = new GearItem("main_hand" as Slot, "sword", "common", "valor");

    const gs = make();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.party.team[0].equipItem(sword);
    gs.activeEffects["skill_battle_cry"] = 5;

    const gs2 = make();
    gs2.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "common", "valor"));

    gs.enemy.hp = 99_999;
    gs2.enemy.hp = 99_999;
    const dmgWith = 99_999 - JSON.parse(gs.tick(1)).enemy.hp;
    const dmgWithout = 99_999 - JSON.parse(gs2.tick(1)).enemy.hp;
    expect(dmgWith).toBeGreaterThan(dmgWithout * 1.5); // battle cry is 2×
  });

  it("skill_shadow_strike multiplies click damage", () => {
    const gs = make();
    gs.guildUpgrades["skill_shadow_strike"] = 1;
    gs.party.team[0] = new Character("Hero", "rogue", 1);
    gs.activeEffects["skill_shadow_strike"] = 3;
    gs.enemy.hp = 99_999;
    const stateBefore = JSON.parse(gs.click());
    const dmgDealt = 99_999 - stateBefore.enemy.hp;
    expect(dmgDealt).toBeGreaterThan(0);
  });

  it("holy_light heals party on kill", () => {
    const gs = make();
    // Add a paladin companion with holy_light
    const paladin = new Character("Pal", "paladin", 10);
    while (paladin.level < 10) paladin.levelUp();
    gs.party.team.push(paladin);
    gs.upgrades["Pal"] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
    // Damage lead so healing is observable
    gs.party.team[0].health = 50;
    gs.party.team[0].maxHealth = 100;
    const hpBefore = gs.party.team[0].health;
    // Trigger a kill
    gs.enemy.hp = 0;
    gs.tick(0.1);
    expect(gs.party.team[0].health).toBeGreaterThan(hpBefore);
  });

  it("hunters_mark increases damage taken by enemy", () => {
    // Both setups get identical gear; only gs has a ranger with hunters_mark
    const gs = make();
    gs.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "common", "valor"));
    const ranger = new Character("Ran", "ranger", 1); // start at 1, level up to unlock abilities
    while (ranger.level < 20) ranger.levelUp();
    gs.party.team.push(ranger);
    gs.upgrades["Ran"] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
    gs.enemy.hp = 99_999;
    const dmgWith = 99_999 - JSON.parse(gs.tick(1)).enemy.hp;

    const gs2 = make();
    gs2.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "common", "valor"));
    gs2.enemy.hp = 99_999;
    const dmgWithout = 99_999 - JSON.parse(gs2.tick(1)).enemy.hp;
    expect(dmgWith).toBeGreaterThan(dmgWithout);
  });

  it("guild_upgrades round-trips through toDict/fromDict", () => {
    const gs = withGuildGold();
    gs.buyGuildUpgrade("expanded_armory");
    gs.buyGuildUpgrade("class_paladin");
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.guildUpgrades["expanded_armory"]).toBe(1);
    expect(restored.guildUpgrades["class_paladin"]).toBe(1);
  });

  it("class_paladin shows in toDict guild_upgrades", () => {
    const gs = withGuildGold();
    gs.buyGuildUpgrade("class_paladin");
    expect(gs.toDict().guild_upgrades["class_paladin"]).toBe(1);
  });

  it("skillCooldowns reset on prestige", () => {
    const gs = withGuildGold();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.party.team[0] = new Character("Hero", "fighter", 1);
    gs.activateSkill("skill_battle_cry");
    gs.highestLevel = PRESTIGE_UNLOCK_LEVEL;
    gs.prestige();
    expect(Object.keys(gs.skillCooldowns)).toHaveLength(0);
  });

  it("skillCooldowns reset on venture", () => {
    const gs = withGuildGold();
    gs.guildUpgrades["skill_battle_cry"] = 1;
    gs.party.team[0] = new Character("Hero", "fighter", 1);
    gs.activateSkill("skill_battle_cry");
    gs.highestLevel = VENTURE_UNLOCK_LEVEL;
    gs.venture();
    expect(Object.keys(gs.skillCooldowns)).toHaveLength(0);
  });
});

describe("lifetime enemy kill tracking", () => {
  it("lifetimeEnemyKills starts empty", () => {
    const gs = make();
    expect(gs.lifetimeEnemyKills).toEqual({});
  });

  it("killing an enemy increments its adjective count", () => {
    const gs = make();
    gs.party.team[0].health = gs.party.team[0].maxHealth;
    // drive enemy to 0 hp
    gs.enemy.hp = 0;
    gs.tick(0.1);
    const total = Object.values(gs.lifetimeEnemyKills).reduce((s, v) => s + v, 0);
    expect(total).toBeGreaterThan(0);
  });

  it("lifetimeEnemyKills key is the enemy name", () => {
    const gs = make();
    const name = gs.enemy.name;
    gs.enemy.hp = 0;
    gs.tick(0.1);
    expect(gs.lifetimeEnemyKills[name]).toBeGreaterThanOrEqual(1);
  });

  it("counts accumulate across multiple kills of same name", () => {
    const gs = make();
    const enemyName = "Monstrous Dragon";
    gs.lifetimeEnemyKills[enemyName] = 5;
    gs.enemy.hp = 0;
    gs.enemy.name = enemyName;
    gs.tick(0.1);
    expect(gs.lifetimeEnemyKills[enemyName]).toBe(6);
  });

  it("lifetimeEnemyKills persists through prestige", () => {
    const gs = make();
    gs.lifetimeEnemyKills["Ancient Goblin"] = 10;
    gs.highestLevel = PRESTIGE_UNLOCK_LEVEL;
    gs.prestige();
    expect(gs.lifetimeEnemyKills["Ancient Goblin"]).toBe(10);
  });

  it("lifetimeEnemyKills persists through venture", () => {
    const gs = make();
    gs.lifetimeEnemyKills["Rotting Zombie"] = 7;
    gs.highestLevel = VENTURE_UNLOCK_LEVEL;
    gs.venture();
    expect(gs.lifetimeEnemyKills["Rotting Zombie"]).toBe(7);
  });

  it("lifetime_enemy_kills round-trips through toDict/fromDict", () => {
    const gs = make();
    gs.lifetimeEnemyKills["Vile Troll"] = 3;
    gs.lifetimeEnemyKills["Savage Bandit"] = 8;
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.lifetimeEnemyKills["Vile Troll"]).toBe(3);
    expect(restored.lifetimeEnemyKills["Savage Bandit"]).toBe(8);
  });

  it("lifetime_enemy_kills in toDict reflects current enemy kills", () => {
    const gs = make();
    gs.lifetimeEnemyKills["Cursed Spider"] = 4;
    expect(gs.toDict().lifetime_enemy_kills["Cursed Spider"]).toBe(4);
  });
});

describe("multi-stat gear — combat integration", () => {
  it("critChance=1 always deals 2× DPS", () => {
    const gs = make();
    const hero = gs.party.team[0];
    hero.equipItem(new GearItem("main_hand" as Slot, "sword", "common", "valor", { dps: 10 }, 1));
    hero.critChance = 1.0;
    gs.enemy.hp = gs.enemy.max_hp = 10_000;
    gs.enemy.attack_dps = 0;
    const before = gs.enemy.hp;
    gs.tick(1.0);
    const dealt = before - gs.enemy.hp;
    expect(dealt).toBeGreaterThan(10 * 1.8); // at least ~2× the base DPS
  });

  it("critChance=0 never crits (DPS is not doubled)", () => {
    const gs = make();
    const hero = gs.party.team[0];
    hero.equipItem(new GearItem("main_hand" as Slot, "sword", "common", "valor", { dps: 10 }, 1));
    hero.critChance = 0;
    gs.enemy.hp = gs.enemy.max_hp = 10_000;
    gs.enemy.attack_dps = 0;
    const before = gs.enemy.hp;
    gs.tick(1.0);
    const dealt = before - gs.enemy.hp;
    expect(dealt).toBeLessThanOrEqual(10 * 1.5); // no crit multiplier applied
  });

  it("gold bonus multiplies gold on boss kill", () => {
    const gs = make();
    const hero = gs.party.team[0];
    hero.goldBonus = 1.0; // 100% bonus = 2× gold
    gs.enemy.isBoss = true;
    gs.enemy.gold_reward = 10;
    gs.gold = 0;
    gs.onEnemyDeath();
    expect(gs.gold).toBeCloseTo(20);
  });

  it("zero gold bonus does not change boss gold reward", () => {
    const gs = make();
    gs.party.team[0].goldBonus = 0;
    gs.enemy.isBoss = true;
    gs.enemy.gold_reward = 10;
    gs.gold = 0;
    gs.onEnemyDeath();
    expect(gs.gold).toBeCloseTo(10);
  });

  it("lifesteal heals the front character proportionally to damage dealt", () => {
    const gs = make();
    const hero = gs.party.team[0];
    hero.equipItem(new GearItem("main_hand" as Slot, "sword", "legendary", "valor", { dps: 100 }, 1));
    hero.lifesteal = 0.5;
    hero.health = 1;
    gs.enemy.hp = gs.enemy.max_hp = 10_000;
    gs.enemy.attack_dps = 0;
    gs.tick(1.0);
    expect(hero.health).toBeGreaterThan(1);
  });

  it("haste increases effective DPS output", () => {
    const gs1 = make();
    const gs2 = make();
    const item = new GearItem("main_hand" as Slot, "sword", "legendary", "valor", { dps: 50 }, 1);
    gs1.party.team[0].equipItem(item);
    gs2.party.team[0].equipItem(item);
    gs2.party.team[0].haste = 1.0; // 100% haste = 2× DPS
    gs1.enemy.hp = gs1.enemy.max_hp = 100_000;
    gs1.enemy.attack_dps = 0;
    gs2.enemy.hp = gs2.enemy.max_hp = 100_000;
    gs2.enemy.attack_dps = 0;
    gs1.tick(1.0);
    gs2.tick(1.0);
    const dealt1 = 100_000 - gs1.enemy.hp;
    const dealt2 = 100_000 - gs2.enemy.hp;
    expect(dealt2).toBeGreaterThan(dealt1 * 1.5);
  });
});

describe("companion_skills_available", () => {
  function withCompanion(leadClass: string, companionClass: string): GameState {
    const gs = new GameState("Hero", leadClass);
    gs.prestigePoints = 100;
    gs.buyPrestigeUpgrade("party_slot_2", companionClass);
    return gs;
  }

  it("is empty when party has only the lead", () => {
    const gs = new GameState("Hero", "rogue");
    gs.guildUpgrades["skill_shadow_strike"] = 1;
    const d = JSON.parse(gs.respond());
    expect(d.companion_skills_available).toEqual([]);
  });

  it("includes companion skill when guild upgrade is purchased", () => {
    const gs = withCompanion("fighter", "rogue");
    gs.guildUpgrades["skill_shadow_strike"] = 1;
    const d = JSON.parse(gs.respond());
    expect(d.companion_skills_available).toContain("skill_shadow_strike");
  });

  it("excludes companion skill when guild upgrade is not purchased", () => {
    const gs = withCompanion("fighter", "rogue");
    const d = JSON.parse(gs.respond());
    expect(d.companion_skills_available).not.toContain("skill_shadow_strike");
  });

  it("excludes skill already shown for lead", () => {
    const gs = withCompanion("fighter", "fighter");
    gs.guildUpgrades["skill_battle_cry"] = 1;
    const d = JSON.parse(gs.respond());
    expect(d.skill_available).toBe("skill_battle_cry");
    expect(d.companion_skills_available).not.toContain("skill_battle_cry");
  });

  it("deduplicates when two companions share a class", () => {
    const gs = new GameState("Hero", "mage");
    gs.prestigePoints = 100;
    gs.buyPrestigeUpgrade("party_slot_2", "rogue");
    gs.buyPrestigeUpgrade("party_slot_3", "rogue");
    gs.guildUpgrades["skill_shadow_strike"] = 1;
    const d = JSON.parse(gs.respond());
    expect(d.companion_skills_available.filter((s: string) => s === "skill_shadow_strike").length).toBe(1);
  });
});

describe("checkpoint prestige upgrades", () => {
  function killBoss(gs: GameState, level: number): void {
    gs.dungeonLevel = level;
    gs.enemy = { name: "Boss", level, hp: 0, max_hp: 1, xp_reward: 1, gold_reward: 1, attack_dps: 0, isBoss: true };
    gs.onEnemyDeath();
  }

  it("no checkpoint without upgrade when boss dies at floor 9 (→ 10)", () => {
    const gs = make();
    killBoss(gs, 9);
    expect(gs.checkpointLevel).toBe(1);
  });

  it("lv1 sets checkpoint at floor 5 only", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 1;
    killBoss(gs, 4); // → floor 5
    expect(gs.checkpointLevel).toBe(5);
  });

  it("lv1 does not trigger at floor 10 (beyond coverage)", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 1;
    killBoss(gs, 9); // → floor 10, beyond lv1 coverage
    expect(gs.checkpointLevel).toBe(1);
  });

  it("lv2 covers floors 5 and 10", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 2;
    killBoss(gs, 4);
    expect(gs.checkpointLevel).toBe(5);
    killBoss(gs, 9);
    expect(gs.checkpointLevel).toBe(10);
  });

  it("lv2 does not trigger at floor 15 (beyond coverage)", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 2;
    killBoss(gs, 14); // → floor 15, beyond lv2 coverage
    expect(gs.checkpointLevel).toBe(1);
  });

  it("lv3 covers floors 5, 10, and 15", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 3;
    killBoss(gs, 14); // → floor 15
    expect(gs.checkpointLevel).toBe(15);
  });

  it("non-multiple-of-5 floor never triggers checkpoint", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint"] = 10;
    killBoss(gs, 6); // → floor 7
    expect(gs.checkpointLevel).toBe(1);
  });

  it("migration: old checkpoint_1/2/3 keys map to appropriate levels", () => {
    const gs = make();
    gs.prestigeUpgrades["checkpoint_1"] = 1;
    gs.prestigeUpgrades["checkpoint_2"] = 1;
    gs.prestigeUpgrades["checkpoint_3"] = 1;
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.prestigeUpgrades["checkpoint"]).toBe(10);
    expect(restored.prestigeUpgrades["checkpoint_1"]).toBeUndefined();
    expect(restored.prestigeUpgrades["checkpoint_2"]).toBeUndefined();
    expect(restored.prestigeUpgrades["checkpoint_3"]).toBeUndefined();
  });
});

describe("venture auto-tool reset", () => {
  function withAutoTools(): GameState {
    const gs = make();
    gs.highestLevel = VENTURE_UNLOCK_LEVEL;
    gs.prestigeUpgrades["auto_seller"] = 1;
    gs.prestigeUpgrades["auto_equip"] = 1;
    gs.prestigeUpgrades["auto_upgrade"] = 1;
    gs.prestigeUpgrades["smart_seller"] = 1;
    gs.autoSellQualities = ["common", "worn"];
    return gs;
  }

  it("venture resets auto_seller to 0", () => {
    const gs = withAutoTools();
    gs.venture();
    expect(gs.prestigeUpgrades["auto_seller"] ?? 0).toBe(0);
  });

  it("venture resets auto_equip to 0", () => {
    const gs = withAutoTools();
    gs.venture();
    expect(gs.prestigeUpgrades["auto_equip"] ?? 0).toBe(0);
  });

  it("venture resets auto_upgrade to 0", () => {
    const gs = withAutoTools();
    gs.venture();
    expect(gs.prestigeUpgrades["auto_upgrade"] ?? 0).toBe(0);
  });

  it("venture resets smart_seller to 0", () => {
    const gs = withAutoTools();
    gs.venture();
    expect(gs.prestigeUpgrades["smart_seller"] ?? 0).toBe(0);
  });

  it("venture clears autoSellQualities", () => {
    const gs = withAutoTools();
    gs.venture();
    expect(gs.autoSellQualities).toEqual([]);
  });
});

describe("dungeon 2 content", () => {
  function withDungeon2Gold(gold = 100_000): GameState {
    const gs = make();
    gs.gold = gold;
    gs.dungeonIndex = 1;
    return gs;
  }

  // ── new guild hall skills ────────────────────────────────────────

  it("skill_consecrate exists in SKILL_DEFS with class paladin", () => {
    expect(SKILL_DEFS["skill_consecrate"]).toBeDefined();
    expect(SKILL_DEFS["skill_consecrate"].class).toBe("paladin");
  });

  it("skill_volley exists in SKILL_DEFS with class ranger", () => {
    expect(SKILL_DEFS["skill_volley"]).toBeDefined();
    expect(SKILL_DEFS["skill_volley"].class).toBe("ranger");
  });

  it("skill_consecrate exists in GUILD_HALL_COSTS", () => {
    expect(GUILD_HALL_COSTS["skill_consecrate"]).toBeDefined();
    expect(GUILD_HALL_COSTS["skill_consecrate"].length).toBeGreaterThan(0);
  });

  it("skill_volley exists in GUILD_HALL_COSTS", () => {
    expect(GUILD_HALL_COSTS["skill_volley"]).toBeDefined();
    expect(GUILD_HALL_COSTS["skill_volley"].length).toBeGreaterThan(0);
  });

  it("buyGuildUpgrade blocks skill_consecrate in dungeon 1", () => {
    const gs = make();
    gs.gold = 100_000;
    gs.dungeonIndex = 0;
    gs.buyGuildUpgrade("skill_consecrate");
    expect(gs.guildUpgrades["skill_consecrate"] ?? 0).toBe(0);
  });

  it("buyGuildUpgrade allows skill_consecrate in dungeon 2+", () => {
    const gs = withDungeon2Gold();
    gs.buyGuildUpgrade("skill_consecrate");
    expect(gs.guildUpgrades["skill_consecrate"]).toBe(1);
  });

  it("buyGuildUpgrade blocks skill_volley in dungeon 1", () => {
    const gs = make();
    gs.gold = 100_000;
    gs.dungeonIndex = 0;
    gs.buyGuildUpgrade("skill_volley");
    expect(gs.guildUpgrades["skill_volley"] ?? 0).toBe(0);
  });

  it("buyGuildUpgrade allows skill_volley in dungeon 2+", () => {
    const gs = withDungeon2Gold();
    gs.buyGuildUpgrade("skill_volley");
    expect(gs.guildUpgrades["skill_volley"]).toBe(1);
  });

  // ── new prestige upgrades ────────────────────────────────────────

  it("gold_mastery exists in PRESTIGE_SHOP_COSTS", () => {
    expect(PRESTIGE_SHOP_COSTS["gold_mastery"]).toBeDefined();
  });

  it("gear_luck exists in PRESTIGE_SHOP_COSTS", () => {
    expect(PRESTIGE_SHOP_COSTS["gear_luck"]).toBeDefined();
  });

  it("buyPrestigeUpgrade blocks gold_mastery in dungeon 1", () => {
    const gs = withPrestige(10);
    gs.dungeonIndex = 0;
    gs.buyPrestigeUpgrade("gold_mastery");
    expect(gs.prestigeUpgrades["gold_mastery"] ?? 0).toBe(0);
  });

  it("buyPrestigeUpgrade allows gold_mastery in dungeon 2+", () => {
    const gs = withPrestige(10);
    gs.dungeonIndex = 1;
    gs.buyPrestigeUpgrade("gold_mastery");
    expect(gs.prestigeUpgrades["gold_mastery"]).toBe(1);
  });

  it("buyPrestigeUpgrade blocks gear_luck in dungeon 1", () => {
    const gs = withPrestige(10);
    gs.dungeonIndex = 0;
    gs.buyPrestigeUpgrade("gear_luck");
    expect(gs.prestigeUpgrades["gear_luck"] ?? 0).toBe(0);
  });

  it("buyPrestigeUpgrade allows gear_luck in dungeon 2+", () => {
    const gs = withPrestige(10);
    gs.dungeonIndex = 1;
    gs.buyPrestigeUpgrade("gear_luck");
    expect(gs.prestigeUpgrades["gear_luck"]).toBe(1);
  });

  it("gold_mastery stacks — each purchase adds 1 to count", () => {
    const gs = withPrestige(20);
    gs.dungeonIndex = 1;
    gs.buyPrestigeUpgrade("gold_mastery");
    gs.buyPrestigeUpgrade("gold_mastery");
    expect(gs.prestigeUpgrades["gold_mastery"]).toBe(2);
  });

  it("gold_mastery increases boss gold reward by 20% per stack", () => {
    const gs = make();
    gs.dungeonIndex = 1;
    gs.prestigeUpgrades["gold_mastery"] = 2; // +40% gold
    const baseGold = 100;
    gs.enemy = { name: "Boss", level: 5, hp: 0, max_hp: 1, xp_reward: 1, gold_reward: baseGold, attack_dps: 0, isBoss: true };
    gs.onEnemyDeath();
    expect(gs.gold).toBeCloseTo(baseGold * 1.4);
  });

  it("gear_luck increases drop chance proportionally", () => {
    const gs = withDungeon2Gold();
    gs.prestigeUpgrades["gear_luck"] = 4; // +20% drop chance
    let drops = 0;
    const trials = 1000;
    for (let i = 0; i < trials; i++) {
      gs.lootPool = [];
      gs.enemy = { name: "Mob", level: 1, hp: 0, max_hp: 1, xp_reward: 1, gold_reward: 1, attack_dps: 0, isBoss: false };
      gs.onEnemyDeath();
      if (gs.lootPool.length > 0) drops++;
    }
    // Base drop chance at dungeonIndex=1 is 0.50; with 4 stacks gear_luck = 0.70
    expect(drops / trials).toBeGreaterThan(0.60);
  });

  // ── skill_volley effect ──────────────────────────────────────────

  it("skill_volley quadruples party DPS during active window", () => {
    const sword = new GearItem("main_hand" as Slot, "sword", "common", "valor");

    const gs = make();
    gs.party.team[0].equipItem(sword);
    gs.activeEffects["skill_volley"] = 4;
    gs.enemy.hp = 99_999;
    const dmgWith = 99_999 - JSON.parse(gs.tick(1)).enemy.hp;

    const gs2 = make();
    gs2.party.team[0].equipItem(new GearItem("main_hand" as Slot, "sword", "common", "valor"));
    gs2.enemy.hp = 99_999;
    const dmgWithout = 99_999 - JSON.parse(gs2.tick(1)).enemy.hp;

    expect(dmgWith).toBeCloseTo(dmgWithout * 4, 0);
  });

  // ── skill_consecrate effect ──────────────────────────────────────

  it("skill_consecrate heals party for 25% max HP per kill during active", () => {
    const gs = make();
    const player = gs.party.team[0];
    player.health = 1; // nearly dead
    player.maxHealth = 100;
    gs.activeEffects["skill_consecrate"] = 5;
    gs.enemy = { name: "Mob", level: 1, hp: 0, max_hp: 1, xp_reward: 1, gold_reward: 1, attack_dps: 0, isBoss: false };
    gs.onEnemyDeath();
    // 12% missing-HP heal + 25% max-HP consecrate heal
    expect(player.health).toBeGreaterThan(25);
  });

  it("skill_consecrate does not heal when inactive", () => {
    const gs = make();
    const player = gs.party.team[0];
    player.health = 1;
    player.maxHealth = 100;
    gs.enemy = { name: "Mob", level: 1, hp: 0, max_hp: 1, xp_reward: 1, gold_reward: 1, attack_dps: 0, isBoss: false };
    gs.onEnemyDeath();
    // Only the 12% missing-HP heal (99 missing × 0.12 ≈ 12.88)
    expect(player.health).toBeLessThan(15);
  });
});

describe("offline progress catch-up", () => {
  it("applyOfflineProgress returns 0 and adds nothing when idleGoldRate is 0", () => {
    const gs = make();
    gs.idleGoldRate = 0;
    const before = gs.gold;
    const earned = gs.applyOfflineProgress(3600_000);
    expect(earned).toBe(0);
    expect(gs.gold).toBe(before);
  });

  it("awards gold = idleGoldRate × elapsed seconds", () => {
    const gs = make();
    gs.idleGoldRate = 5; // 5 gold/sec
    const before = gs.gold;
    const elapsed = 120_000; // 2 minutes
    const earned = gs.applyOfflineProgress(elapsed);
    expect(earned).toBeCloseTo(5 * 120);
    expect(gs.gold).toBeCloseTo(before + 5 * 120);
  });

  it("caps at OFFLINE_GOLD_CAP_SECONDS regardless of elapsed time", () => {
    const gs = make();
    gs.idleGoldRate = 10;
    const before = gs.gold;
    const earned = gs.applyOfflineProgress(999_999_000); // way beyond cap
    expect(earned).toBeCloseTo(10 * OFFLINE_GOLD_CAP_SECONDS);
    expect(gs.gold).toBeCloseTo(before + 10 * OFFLINE_GOLD_CAP_SECONDS);
  });

  it("returns 0 for negative or zero elapsed time", () => {
    const gs = make();
    gs.idleGoldRate = 10;
    const before = gs.gold;
    expect(gs.applyOfflineProgress(0)).toBe(0);
    expect(gs.applyOfflineProgress(-5000)).toBe(0);
    expect(gs.gold).toBe(before);
  });

  it("saved_at round-trips through toDict/fromDict", () => {
    const gs = make();
    const before = Date.now();
    const dict = gs.toDict();
    expect(dict.saved_at).toBeGreaterThanOrEqual(before);
    const restored = GameState.fromDict(dict);
    expect(restored.savedAt).toBe(dict.saved_at);
  });

  it("fromDict with missing saved_at defaults to 0 (triggers no offline award)", () => {
    const gs = make();
    const dict = gs.toDict();
    delete (dict as unknown as Record<string, unknown>).saved_at;
    const restored = GameState.fromDict(dict);
    expect(restored.savedAt).toBe(0);
  });
});

describe("THEME_UNLOCKS", () => {
  it("has exactly 8 themes", () => {
    expect(THEME_UNLOCKS).toHaveLength(8);
  });

  it("prestige requirements are non-decreasing", () => {
    for (let i = 1; i < THEME_UNLOCKS.length; i++) {
      expect(THEME_UNLOCKS[i].prestiges).toBeGreaterThanOrEqual(THEME_UNLOCKS[i - 1].prestiges);
    }
  });

  it("first two themes require 0 prestiges (free)", () => {
    expect(THEME_UNLOCKS[0].prestiges).toBe(0);
    expect(THEME_UNLOCKS[1].prestiges).toBe(0);
  });

  it("last theme requires 17 prestiges", () => {
    expect(THEME_UNLOCKS[THEME_UNLOCKS.length - 1].prestiges).toBe(17);
  });

  it("each entry has theme, icon, label, and prestiges fields", () => {
    for (const entry of THEME_UNLOCKS) {
      expect(typeof entry.theme).toBe("string");
      expect(typeof entry.icon).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.prestiges).toBe("number");
    }
  });

  it("theme strings contain no spaces (safe as CSS data-theme attribute)", () => {
    for (const entry of THEME_UNLOCKS) {
      expect(entry.theme).not.toContain(" ");
    }
  });

  it("all theme slugs are unique", () => {
    const slugs = THEME_UNLOCKS.map(t => t.theme);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

// ──────────────────────────────────────────
// Defense upgrade (#16)
// ──────────────────────────────────────────
describe("defense upgrade", () => {
  it("exists in UPGRADE_BASES", () => {
    expect(UPGRADE_BASES["defense"]).toBeGreaterThan(0);
  });

  it("DEFENSE_UPGRADE_EFFECT is exported and positive", () => {
    expect(DEFENSE_UPGRADE_EFFECT).toBeGreaterThan(0);
  });

  it("buyUpgrade defense increases damageReduction", () => {
    const gs = make();
    gs.gold = 10_000;
    const before = gs.party.team[0].damageReduction;
    gs.buyUpgrade("Hero", "defense");
    expect(gs.party.team[0].damageReduction).toBeCloseTo(before + DEFENSE_UPGRADE_EFFECT);
  });

  it("defense level appears in upgrades dict", () => {
    const gs = make();
    gs.gold = 10_000;
    gs.buyUpgrade("Hero", "defense");
    const state = JSON.parse(gs.respond());
    expect(state.upgrades["Hero"]["defense"].level).toBe(1);
  });

  it("defense upgrade cost doubles each level", () => {
    const gs = make();
    gs.gold = 10_000;
    const cost1 = gs.upgradeCost("Hero", "defense");
    gs.buyUpgrade("Hero", "defense");
    const cost2 = gs.upgradeCost("Hero", "defense");
    expect(cost2).toBe(cost1 * 2);
  });

  it("defense level persists through toDict/fromDict", () => {
    const gs = make();
    gs.gold = 10_000;
    gs.buyUpgrade("Hero", "defense");
    gs.buyUpgrade("Hero", "defense");
    const restored = GameState.fromDict(JSON.parse(gs.respond()));
    expect(restored.upgrades["Hero"]["defense"]).toBe(2);
  });

  it("defense is included in auto_upgrade purchases", () => {
    const gs = make();
    gs.prestigeUpgrades["auto_upgrade"] = 1;
    gs.gold = 100_000; // enough to buy many upgrades; defense will be purchased
    (gs as any).runAutoUpgrade();
    expect(gs.party.team[0].damageReduction).toBeGreaterThan(0);
  });
});

// ──────────────────────────────────────────
// Title selector (#21)
// ──────────────────────────────────────────
describe("setEarnedTitle", () => {
  it("setEarnedTitle with an earned title sets earnedTitle", () => {
    const gs = make();
    gs.achievementsUnlocked.add("kills_tiered_gold");
    gs.earnedTitle = "Slayer";
    gs.setEarnedTitle("Slayer");
    expect(gs.earnedTitle).toBe("Slayer");
  });

  it("setEarnedTitle with empty string clears earnedTitle", () => {
    const gs = make();
    gs.earnedTitle = "Slayer";
    gs.setEarnedTitle("");
    expect(gs.earnedTitle).toBe("");
  });

  it("setEarnedTitle with unearned title does nothing", () => {
    const gs = make();
    gs.earnedTitle = "Slayer";
    gs.setEarnedTitle("The Undying");
    expect(gs.earnedTitle).toBe("Slayer");
  });

  it("earned_titles in toDict lists all earned title rewards", () => {
    const gs = make();
    gs.achievementsUnlocked.add("kills_tiered_gold");
    gs.achievementsUnlocked.add("die_50");
    const state = JSON.parse(gs.respond());
    expect(state.earned_titles).toContain("Slayer");
    expect(state.earned_titles).toContain("The Undying");
  });

  it("earned_titles is empty when no titles earned", () => {
    const gs = make();
    const state = JSON.parse(gs.respond());
    expect(state.earned_titles).toHaveLength(0);
  });
});

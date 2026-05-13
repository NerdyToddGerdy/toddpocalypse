import { Character } from "./character.js";
import { Party } from "./party.js";
import { GearItem, getItem, gearPower, QUAL, autoSellThreshold, type GearItemDict } from "./gear.js";
import { generateEnemy, generateBoss, type Enemy } from "./dungeon.js";

/** Base number of kills required to reach the boss on floor 1. */
export const KILLS_PER_LEVEL = 5;

/** Returns the number of regular kills needed to clear a given floor before the boss spawns. */
export function killsForFloor(dungeonLevel: number): number {
  return KILLS_PER_LEVEL + Math.floor(dungeonLevel / 5) * 2;
}

/** Multiplier applied to total party DPS when computing a manual click's burst damage. */
export const CLICK_DAMAGE_MULTIPLIER = 2.0;

/** Maximum number of messages retained in the combat log. */
export const MAX_LOG = 6;

/** Default maximum number of items the loot pool can hold (before Guild Hall expansion). */
export const LOOT_MAX = 8;

/** Probability that a regular enemy kill produces a loot drop. */
export const DROP_CHANCE = 0.45;

/** Base gold cost for the first level of each upgrade type. */
export const UPGRADE_BASES: Record<string, number> = {
  dps: 50,
  xp: 75,
  click: 40,
  hp: 60,
};

/** Stat delta applied per upgrade level for DPS, XP-rate, and click-damage upgrades. */
export const UPGRADE_EFFECTS: Record<string, number> = {
  dps: 0.5,
  xp: 0.1,
  click: 0.5,
};

/** HP added per HP-upgrade level. */
export const HP_UPGRADE_EFFECT = 15;

/** DPS multiplier applied to a Fighter or Paladin while their HP is at or below 50%. */
export const BLOODLUST_MULTIPLIER = 1.6;

/** Incoming damage multiplier applied to enemies while Expose Weakness / Hunter's Mark is active. */
export const EXPOSE_WEAKNESS_MULT = 1.25;

/** Seconds between each Mana Surge auto-burst. */
export const MANA_SURGE_INTERVAL = 20;

/** DPS multiplier applied during a Mana Surge burst. */
export const MANA_SURGE_MULTIPLIER = 5;

/** Probability that a click triggers Lucky Strike. */
export const LUCKY_STRIKE_CHANCE = 0.25;

/** Click damage multiplier when Lucky Strike procs. */
export const LUCKY_STRIKE_MULTIPLIER = 3;

/** Click damage multiplier granted by the Empower ability. */
export const EMPOWER_MULTIPLIER = 2;

/** Minimum dungeon floor (highest_level) required to trigger a prestige. */
export const PRESTIGE_UNLOCK_LEVEL = 20;


/** Minimum dungeon floor (highest_level) required to venture to the next dungeon. */
export const VENTURE_UNLOCK_LEVEL = 40;

/** Gold earned per idle companion DPS-point per real second after venturing. */
export const IDLE_GOLD_RATE = 0.01;

/** Prestige point cost for each prestige shop item (one-time purchases use a flat cost). */
export const PRESTIGE_SHOP_COSTS: Record<string, number> = {
  guild_hall_access: 5,
  auto_seller: 1,
  auto_equip: 2,
  auto_upgrade: 2,
  smart_seller: 4,
  party_slot_2: 2,
  party_slot_3: 3,
  party_slot_4: 4,
  party_slot_5: 5,
  starting_gold: 1,
  xp_bonus: 1,
  checkpoint_1: 1,
  checkpoint_2: 2,
  checkpoint_3: 3,
};

/** Stackable upgrades whose cost increases by 1 pt per stack already owned. */
const SCALING_PRESTIGE_UPGRADES = new Set(["starting_gold", "xp_bonus"]);

/** Returns the prestige point cost for the next purchase of a given upgrade type. */
export function prestigeUpgradeCost(type: string, currentStacks: number): number {
  if (SCALING_PRESTIGE_UPGRADES.has(type)) {
    return PRESTIGE_SHOP_COSTS[type] + currentStacks;
  }
  return PRESTIGE_SHOP_COSTS[type];
}

/** Gold cost for each stack of every Guild Hall upgrade. */
export const GUILD_HALL_COSTS: Record<string, number[]> = {
  companion_hall:      [5_000, 15_000],
  expanded_armory:     [1_000, 2_000, 3_000],
  class_paladin:       [6_000],
  class_ranger:        [6_000],
  skill_battle_cry:    [2_500],
  skill_shadow_strike: [2_500],
  skill_arcane_surge:  [2_500],
};

/** Cooldown (ms) and duration (kills) and class requirement for each active combat skill. */
export const SKILL_DEFS: Record<string, { cooldownMs: number; durationKills: number; class: string }> = {
  skill_battle_cry:    { cooldownMs: 120_000, durationKills: 5, class: "fighter" },
  skill_shadow_strike: { cooldownMs: 45_000,  durationKills: 3, class: "rogue" },
  skill_arcane_surge:  { cooldownMs: 90_000,  durationKills: 5, class: "mage" },
};

/** Fraction of missing HP restored after each enemy kill. */
export const COMBAT_HEAL_FRACTION = 0.20;

/** Gold granted per starting_gold prestige upgrade level. */
export const STARTING_GOLD_PER_LEVEL = 250;

/** XP multiplier bonus added per xp_bonus prestige upgrade level. */
export const XP_BONUS_PER_LEVEL = 0.10;

/** The four stat categories that can be upgraded per character. */
type UpgradeType = "dps" | "xp" | "click" | "hp";

/** Current level for each upgrade type on a single character. */
type UpgradeLevels = Record<UpgradeType, number>;

/** Full serialized snapshot of a {@link GameState}, sent to the renderer after every action. */
export interface GameStateDict {
  run_id: string;
  dungeon_level: number;
  gold: number;
  kills: number;
  deaths: number;
  highest_level: number;
  monsters_left: number;
  enemy: { name: string; level: number; hp: number; max_hp: number; xp_reward: number; gold_reward: number; attack_dps: number; is_boss: boolean };
  party: ReturnType<Character["toDict"]>[];
  loot_pool: GearItemDict[];
  upgrades: Record<string, Record<UpgradeType, { level: number; cost: number; effect: number }>>;
  log: string[];
  prestige_points: number;
  lifetime_kills: number;
  lifetime_deaths: number;
  lifetime_best_level: number;
  lifetime_enemy_kills: Record<string, number>;
  total_prestiges: number;
  prestige_upgrades: Record<string, number>;
  prestige_party_classes: Record<string, string>;
  prestige_available: boolean;
  prestige_points_preview: number;
  checkpoint_level: number;
  auto_sell_qualities: string[];
  floor_kills: number;
  dungeon_index: number;
  idle_gold_rate: number;
  venture_available: boolean;
  guild_upgrades: Record<string, number>;
  skill_available: string | null;
  companion_skills_available: string[];
  skill_cooldowns: Record<string, number>;
  active_effects: Record<string, number>;
  loot_max: number;
}

/** Central game loop: owns all mutable state and exposes action methods that return serialized JSON. */
export class GameState {
  /** The active party for the current dungeon. */
  party: Party;
  /** Current dungeon floor (resets on prestige/venture). */
  dungeonLevel = 1;
  /** Current gold balance. */
  gold = 0;
  /** Enemy kills this prestige run. */
  kills = 0;
  /** Party deaths this prestige run. */
  deaths = 0;
  /** Deepest floor reached this prestige run. */
  highestLevel = 1;
  /** Recent combat log messages (capped at MAX_LOG). */
  log: string[] = [];
  /** Items currently in the loot chest awaiting equip or sell. */
  lootPool: GearItem[] = [];
  /** The enemy currently being fought. */
  enemy: Enemy;
  /** Upgrade levels keyed by character name then upgrade type. */
  upgrades: Record<string, UpgradeLevels> = {};
  /** Prestige points available to spend in the Prestige Shop. */
  prestigePoints = 0;
  /** Total kills across all prestige runs (never resets). */
  lifetimeKills = 0;
  /** Total deaths across all prestige runs (never resets). */
  lifetimeDeaths = 0;
  /** Highest floor ever reached across all prestige runs. */
  lifetimeBestLevel = 1;
  /** Kill count per enemy name, used in the Lifetime Stats breakdown. */
  lifetimeEnemyKills: Record<string, number> = {};
  /** Number of prestiges performed (never resets). */
  totalPrestiges = 0;
  /** Purchased prestige upgrade stacks, keyed by upgrade type. */
  prestigeUpgrades: Record<string, number> = {};
  /** Class chosen for each companion slot, persisted across prestiges. */
  prestigePartyClasses: Record<string, string> = {};
  /** Quality tier names currently enabled for auto-sell. */
  autoSellQualities: string[] = [];
  /** Floor to respawn on after a party wipe (set every 10 floors). */
  checkpointLevel = 1;
  /** Regular kills on the current floor (resets when the boss spawns). */
  floorKills = 0;
  /** Number of times the player has ventured (0 = first dungeon). */
  dungeonIndex = 0;
  /** Gold per second passively earned from idle companions in previous dungeons. */
  idleGoldRate = 0;
  /** Purchased Guild Hall upgrade stacks, keyed by upgrade id. */
  guildUpgrades: Record<string, number> = {};
  /** Unix-ms timestamp of the last activation per skill id (for cooldown tracking). */
  skillCooldowns: Record<string, number> = {};
  /** Unix-ms expiry timestamp per active skill effect; entries are pruned on tick. */
  activeEffects: Record<string, number> = {};
  /** Unique ID for this save file — generated once on new game, survives prestiges. */
  runId: string = crypto.randomUUID();

  /** Current loot chest capacity, expanding with Expanded Armory guild upgrades. */
  get lootMax(): number { return 8 + 2 * (this.guildUpgrades["expanded_armory"] ?? 0); }

  constructor(name = "Hero", characterClass = "fighter") {
    this.party = new Party();
    this.party.addPlayer(new Character(name, characterClass, 1));
    this.enemy = generateEnemy(this.dungeonLevel, this.dungeonIndex);
    for (const c of this.party.team) {
      this.upgrades[c.name] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }
  }

  /**
   * Advances the game simulation by `dt` seconds.
   * Applies idle gold, mana surges, passive DPS, enemy attacks, and death checks.
   * Returns serialized JSON state.
   */
  tick(dt: number): string {
    if (this.idleGoldRate > 0) this.gold += this.idleGoldRate * dt;
    // Mana Surge — fires before regular DPS so we can early-return if enemy dies
    for (const c of this.party.team) {
      if (!c.isAlive()) continue;
      if (c.abilities.includes("mana_surge") && c.inventory.equippedItems().length > 0) {
        c.surgeTimer += dt;
        if (c.surgeTimer >= MANA_SURGE_INTERVAL) {
          c.surgeTimer -= MANA_SURGE_INTERVAL;
          const surgeDmg = c.dps * MANA_SURGE_MULTIPLIER;
          this.enemy.hp -= surgeDmg;
          this.addLog(`${c.name} Mana Surge! (${surgeDmg.toFixed(1)} dmg)`);
          if (this.enemy.hp <= 0) { this.onEnemyDeath(); return this.respond(); }
        }
      }
    }

    const hasExpose = this.party.team.some(c => c.isAlive() && c.abilities.includes("expose_weakness"));
    const hasMark = this.party.team.some(c => c.isAlive() && c.abilities.includes("hunters_mark"));
    const hasDead = this.party.team.some(c => !c.isAlive());
    const divineWrathActive = hasDead && this.party.team.some(c => c.isAlive() && c.abilities.includes("divine_wrath"));
    const battleCryMult = (this.activeEffects["skill_battle_cry"] ?? 0) > 0 ? 2.0 : 1.0;
    const arcaneSurgeMult = (this.activeEffects["skill_arcane_surge"] ?? 0) > 0 ? 3.0 : 1.0;

    let baseDps = 0;
    const partyHaste = this.party.team.reduce((s, c) => c.isAlive() ? s + c.haste : s, 0);
    for (const c of this.party.team) {
      if (!c.isAlive()) continue;
      if (c.inventory.equippedItems().length === 0) continue;
      let dps = c.dps;
      if (c.abilities.includes("bloodlust") && c.health <= c.maxHealth * 0.5) dps *= BLOODLUST_MULTIPLIER;
      if (c.critChance > 0 && Math.random() < c.critChance) dps *= 2;
      baseDps += dps;
    }
    const totalDps = baseDps * (1 + partyHaste);
    const dmgMult = (hasExpose ? EXPOSE_WEAKNESS_MULT : 1.0) * (hasMark ? 1.20 : 1.0) * battleCryMult * arcaneSurgeMult * (divineWrathActive ? 1.15 : 1.0);
    const damageDealt = totalDps * dmgMult * dt;
    this.enemy.hp -= damageDealt;
    if (this.enemy.hp <= 0) {
      this.onEnemyDeath();
      return this.respond();
    }

    // Lifesteal: heal the first injured alive character proportionally to damage dealt
    const partyLifesteal = this.party.team.reduce((s, c) => c.isAlive() ? s + c.lifesteal : s, 0);
    if (damageDealt > 0 && partyLifesteal > 0) {
      const healTarget = this.party.team.find(c => c.isAlive() && c.health < c.maxHealth);
      if (healTarget) {
        healTarget.health = Math.min(healTarget.maxHealth, healTarget.health + damageDealt * partyLifesteal);
      }
    }

    const living = this.party.team.filter(c => c.isAlive());
    if (living.length > 0) {
      const target = living[Math.floor(Math.random() * living.length)];
      const partySizeMult = Math.sqrt(living.length);
      target.health -= this.enemy.attack_dps * partySizeMult * dt * (1 - target.damageReduction);
      target.health = Math.max(0, target.health);
    }
    if (this.party.team.every(c => !c.isAlive())) {
      this.onPlayerDeath();
    }
    return this.respond();
  }

  /** Deals a burst of manual click damage, with crit and skill-effect modifiers applied. Returns serialized JSON. */
  click(): string {
    const totalDps = this.party.team.reduce((s, c) => c.isAlive() ? s + c.dps : s, 0);
    const clickBonus = this.party.team.reduce((s, c) => c.isAlive() ? s + c.clickBonus : s, 0);
    let damage = Math.max(1.0, totalDps * CLICK_DAMAGE_MULTIPLIER * 0.1 + clickBonus);
    if (this.party.team.some(c => c.isAlive() && c.abilities.includes("empower"))) damage *= EMPOWER_MULTIPLIER;
    const shadowStrikeActive = (this.activeEffects["skill_shadow_strike"] ?? 0) > 0;
    if (shadowStrikeActive) damage *= 5;
    const hasLuckyStrike = this.party.team.some(c => c.isAlive() && c.abilities.includes("lucky_strike"));
    const hasEagleEye = this.party.team.some(c => c.isAlive() && c.abilities.includes("eagle_eye"));
    if (hasLuckyStrike && Math.random() < LUCKY_STRIKE_CHANCE) {
      damage *= LUCKY_STRIKE_MULTIPLIER;
      this.addLog(`Lucky Strike! ${damage.toFixed(1)} dmg!`);
    } else if (hasEagleEye && Math.random() < 0.30) {
      damage *= 2;
      this.addLog(`Eagle Eye! ${damage.toFixed(1)} dmg!`);
    } else {
      this.addLog(`You strike for ${damage.toFixed(1)}!`);
    }
    this.enemy.hp -= damage;
    if (this.enemy.hp <= 0) this.onEnemyDeath();
    return this.respond();
  }

  /** Equips the loot item at the given pool index, routing it to the best party recipient. Returns serialized JSON. */
  equipLoot(idx: number): string {
    if (idx < 0 || idx >= this.lootPool.length) return this.respond();
    const item = this.lootPool.splice(idx, 1)[0];
    const target = this.bestRecipient(item);
    const old = target.equipItem(item);
    this.addLog(`${target.name} equips ${item.getName()}!`);
    if (old) this.disposeItem(old);
    return this.respond();
  }

  /** Equips every item in the loot pool that is an upgrade; sells the rest. Returns serialized JSON. */
  equipAll(): string {
    for (const item of this.lootPool) {
      const target = this.bestRecipient(item);
      const current = this.slotToCompare(target, item);
      const netGain = gearPower(item.stats) - (current ? gearPower(current.stats) : 0);
      if (netGain > 0) {
        const old = target.equipItem(item);
        this.addLog(`${target.name} equips ${item.getName()}!`);
        if (old) this.disposeItem(old);
      } else {
        this.gold += item.sellValue;
        this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
      }
    }
    this.lootPool = [];
    return this.respond();
  }

  /** Sells every item in the loot pool. Returns serialized JSON. */
  sellAll(): string {
    for (const item of this.lootPool) {
      this.gold += item.sellValue;
      this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
    }
    this.lootPool = [];
    return this.respond();
  }

  /** Sells the loot item at the given pool index for its sell value. Returns serialized JSON. */
  sellLoot(idx: number): string {
    if (idx < 0 || idx >= this.lootPool.length) return this.respond();
    const item = this.lootPool.splice(idx, 1)[0];
    this.gold += item.sellValue;
    this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
    return this.respond();
  }

  /** Purchases one level of the specified upgrade for a character, deducting gold. Returns serialized JSON. */
  buyUpgrade(charName: string, upgradeType: string): string {
    if (!(upgradeType in UPGRADE_BASES)) return this.respond();
    const ut = upgradeType as UpgradeType;
    const cost = this.upgradeCost(charName, ut);
    if (this.gold < cost) {
      this.addLog("Not enough gold!");
      return this.respond();
    }
    this.gold -= cost;
    this.upgrades[charName][ut] += 1;
    const char = this.party.team.find((c) => c.name === charName);
    if (!char) return this.respond();
    if (ut === "dps") char.dps += UPGRADE_EFFECTS.dps;
    else if (ut === "xp") char.xpMultiplier += UPGRADE_EFFECTS.xp;
    else if (ut === "click") char.clickBonus += UPGRADE_EFFECTS.click;
    else if (ut === "hp") {
      char.maxHealth += HP_UPGRADE_EFFECT;
      char.health += HP_UPGRADE_EFFECT;
    }
    this.addLog(`${charName}: ${ut} upgraded!`);
    return this.respond();
  }

  /** Calculates how many prestige points the player would earn if they prestiged right now. */
  prestigePointsPreview(): number {
    return 1 + Math.floor(Math.max(0, this.highestLevel - PRESTIGE_UNLOCK_LEVEL) / 5);
  }

  /** Advances to the next dungeon, leaving companions behind as idle earners. Returns serialized JSON. */
  venture(): string {
    if (this.highestLevel < VENTURE_UNLOCK_LEVEL) return this.respond();

    const companions = this.party.team.slice(1);
    this.idleGoldRate += companions.reduce((sum, c) => sum + c.dps, 0) * IDLE_GOLD_RATE;

    this.dungeonIndex += 1;
    this.prestigePoints = 0;
    // Reset party slots so fresh companions can be recruited in the new dungeon
    this.prestigeUpgrades["party_slot_2"] = 0;
    this.prestigeUpgrades["party_slot_3"] = 0;
    this.prestigeUpgrades["party_slot_4"] = 0;
    this.prestigeUpgrades["party_slot_5"] = 0;
    this.skillCooldowns = {};
    this.activeEffects = {};

    const leadName = this.party.team[0].name;
    const leadClass = this.party.team[0].characterClass;
    const newLead = new Character(leadName, leadClass, 1);

    this.party.team = [newLead];
    this.upgrades = { [leadName]: { dps: 0, xp: 0, click: 0, hp: 0 } };
    this.lifetimeBestLevel = Math.max(this.lifetimeBestLevel, this.highestLevel);
    this.gold = 0;
    this.dungeonLevel = 1;
    this.kills = 0;
    this.floorKills = 0;
    this.deaths = 0;
    this.highestLevel = 1;
    this.checkpointLevel = 1;
    this.lootPool = [];
    this.log = [];
    this.enemy = generateEnemy(1, this.dungeonIndex);

    this.addLog(`Ventured to dungeon ${this.dungeonIndex + 1}! Total idle: ${this.idleGoldRate.toFixed(1)} gold/sec.`);
    return this.respond();
  }

  /** Resets the current run, awards prestige points, and rebuilds the party from prestige upgrades. Returns serialized JSON. */
  prestige(): string {
    if (this.highestLevel < PRESTIGE_UNLOCK_LEVEL) return this.respond();
    const earned = this.prestigePointsPreview();

    this.lifetimeKills += this.kills;
    this.lifetimeDeaths += this.deaths;
    this.lifetimeBestLevel = Math.max(this.lifetimeBestLevel, this.highestLevel);
    this.totalPrestiges += 1;
    this.prestigePoints += earned;

    const leadName = this.party.team[0].name;
    const leadClass = this.party.team[0].characterClass;

    this.dungeonLevel = 1;
    this.kills = 0;
    this.floorKills = 0;
    this.deaths = 0;
    this.highestLevel = 1;
    this.checkpointLevel = 1;
    this.autoSellQualities = [];
    this.lootPool = [];
    this.log = [];
    this.enemy = generateEnemy(1, this.dungeonIndex);
    this.skillCooldowns = {};
    this.activeEffects = {};

    this.party.team = [];
    this.upgrades = {};
    const lead = new Character(leadName, leadClass, 1);
    this.party.addPlayer(lead);
    this.upgrades[leadName] = { dps: 0, xp: 0, click: 0, hp: 0 };

    if ((this.prestigeUpgrades["party_slot_2"] ?? 0) > 0) {
      const cls2 = this.prestigePartyClasses["slot_2"] ?? "fighter";
      const comp = new Character("Companion", cls2, 1);
      this.party.addPlayer(comp);
      this.upgrades["Companion"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }
    if ((this.prestigeUpgrades["party_slot_3"] ?? 0) > 0) {
      const cls3 = this.prestigePartyClasses["slot_3"] ?? "fighter";
      const ally = new Character("Ally", cls3, 1);
      this.party.addPlayer(ally);
      this.upgrades["Ally"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }
    if ((this.prestigeUpgrades["party_slot_4"] ?? 0) > 0) {
      const cls4 = this.prestigePartyClasses["slot_4"] ?? "fighter";
      const vet = new Character("Veteran", cls4, 1);
      this.party.addPlayer(vet);
      this.upgrades["Veteran"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }
    if ((this.prestigeUpgrades["party_slot_5"] ?? 0) > 0) {
      const cls5 = this.prestigePartyClasses["slot_5"] ?? "fighter";
      const champ = new Character("Champion", cls5, 1);
      this.party.addPlayer(champ);
      this.upgrades["Champion"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }

    const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
    for (const c of this.party.team) {
      c.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    }

    this.gold = (this.prestigeUpgrades["starting_gold"] ?? 0) * STARTING_GOLD_PER_LEVEL;

    this.addLog(`Prestige ${this.totalPrestiges}! Earned ${earned}pt.`);
    return this.respond();
  }

  /** Purchases a Prestige Shop item, optionally specifying the companion's class for slot unlocks. Returns serialized JSON. */
  buyPrestigeUpgrade(type: string, characterClass?: string): string {
    if (!(type in PRESTIGE_SHOP_COSTS)) return this.respond();
    if (type === "smart_seller" && !(this.prestigeUpgrades["auto_seller"] > 0)) return this.respond();
    if (type === "party_slot_3" && !(this.prestigeUpgrades["party_slot_2"] > 0)) return this.respond();
    if (type === "checkpoint_2" && !(this.prestigeUpgrades["checkpoint_1"] > 0)) return this.respond();
    if (type === "checkpoint_3" && !(this.prestigeUpgrades["checkpoint_2"] > 0)) return this.respond();
    if (type === "party_slot_4") {
      if (!(this.prestigeUpgrades["party_slot_3"] > 0)) return this.respond();
      if (!((this.guildUpgrades["companion_hall"] ?? 0) >= 1)) return this.respond();
    }
    if (type === "party_slot_5") {
      if (!(this.prestigeUpgrades["party_slot_4"] > 0)) return this.respond();
      if (!((this.guildUpgrades["companion_hall"] ?? 0) >= 2)) return this.respond();
    }
    const oneTime = ["guild_hall_access", "auto_seller", "auto_equip", "auto_upgrade", "smart_seller", "party_slot_2", "party_slot_3", "party_slot_4", "party_slot_5", "checkpoint_1", "checkpoint_2", "checkpoint_3"];
    if (oneTime.includes(type) && (this.prestigeUpgrades[type] ?? 0) >= 1) return this.respond();
    const currentStacks = this.prestigeUpgrades[type] ?? 0;
    const cost = prestigeUpgradeCost(type, currentStacks);
    if (this.prestigePoints < cost) {
      this.addLog("Not enough prestige points!");
      return this.respond();
    }
    this.prestigePoints -= cost;
    this.prestigeUpgrades[type] = (this.prestigeUpgrades[type] ?? 0) + 1;

    if (type === "party_slot_2") {
      const cls = characterClass ?? "fighter";
      this.prestigePartyClasses["slot_2"] = cls;
      const comp = new Character("Companion", cls, 1);
      this.party.addPlayer(comp);
      this.upgrades["Companion"] = { dps: 0, xp: 0, click: 0, hp: 0 };
      const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
      comp.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    } else if (type === "party_slot_3") {
      const cls = characterClass ?? "fighter";
      this.prestigePartyClasses["slot_3"] = cls;
      const ally = new Character("Ally", cls, 1);
      this.party.addPlayer(ally);
      this.upgrades["Ally"] = { dps: 0, xp: 0, click: 0, hp: 0 };
      const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
      ally.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    } else if (type === "party_slot_4") {
      const cls = characterClass ?? "fighter";
      this.prestigePartyClasses["slot_4"] = cls;
      const vet = new Character("Veteran", cls, 1);
      this.party.addPlayer(vet);
      this.upgrades["Veteran"] = { dps: 0, xp: 0, click: 0, hp: 0 };
      const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
      vet.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    } else if (type === "party_slot_5") {
      const cls = characterClass ?? "fighter";
      this.prestigePartyClasses["slot_5"] = cls;
      const champ = new Character("Champion", cls, 1);
      this.party.addPlayer(champ);
      this.upgrades["Champion"] = { dps: 0, xp: 0, click: 0, hp: 0 };
      const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
      champ.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    } else if (type === "xp_bonus") {
      for (const c of this.party.team) {
        c.xpMultiplier += XP_BONUS_PER_LEVEL;
      }
    } else if (type === "starting_gold") {
      this.gold += STARTING_GOLD_PER_LEVEL;
    }

    this.addLog(`Prestige upgrade: ${type} purchased!`);
    if (type === "auto_seller") this.runAutoSeller();
    if (type === "auto_equip") this.runAutoEquip();
    if (type === "auto_upgrade") this.runAutoUpgrade();
    if (type === "smart_seller") this.syncSmartSeller();
    return this.respond();
  }

  /** Toggles a quality tier in the auto-sell list, then immediately runs the auto-seller. Returns serialized JSON. */
  toggleAutoSellQuality(quality: string): string {
    const idx = this.autoSellQualities.indexOf(quality);
    if (idx === -1) {
      this.autoSellQualities.push(quality);
    } else {
      this.autoSellQualities.splice(idx, 1);
    }
    this.runAutoSeller();
    return this.respond();
  }

  /** Purchases the next stack of a Guild Hall upgrade, deducting gold. Returns serialized JSON. */
  buyGuildUpgrade(type: string): string {
    if (!(type in GUILD_HALL_COSTS)) return this.respond();
    const costs = GUILD_HALL_COSTS[type];
    const owned = this.guildUpgrades[type] ?? 0;
    if (owned >= costs.length) return this.respond();
    const cost = costs[owned];
    if (this.gold < cost) {
      this.addLog("Not enough gold for Guild Hall upgrade!");
      return this.respond();
    }
    this.gold -= cost;
    this.guildUpgrades[type] = owned + 1;
    this.addLog(`Guild Hall: ${type.replace(/_/g, " ")} upgraded!`);
    return this.respond();
  }

  /** Activates a purchased combat skill for the lead character if off cooldown. Returns serialized JSON. */
  activateSkill(skillId: string): string {
    if (!((this.guildUpgrades[skillId] ?? 0) > 0)) return this.respond();
    const def = SKILL_DEFS[skillId];
    if (!def) return this.respond();
    const caster = this.party.team.find(c => c.characterClass === def.class);
    if (!caster) return this.respond();
    const now = Date.now();
    const lastUsed = this.skillCooldowns[skillId] ?? 0;
    if (now - lastUsed < def.cooldownMs) return this.respond();
    this.skillCooldowns[skillId] = now;
    this.activeEffects[skillId] = def.durationKills;
    this.addLog(`${caster.name} uses ${skillId.replace("skill_", "").replace(/_/g, " ")}!`);
    return this.respond();
  }

  /** Returns the skill id available to the lead character's class, or null if none is purchased. */
  private computeSkillAvailable(): string | null {
    const leadClass = this.party.team[0].characterClass;
    for (const [skillId, def] of Object.entries(SKILL_DEFS)) {
      if ((this.guildUpgrades[skillId] ?? 0) > 0 && def.class === leadClass) return skillId;
    }
    return null;
  }

  /** Returns skill ids available to companions, deduped and excluding the lead's skill. */
  private computeCompanionSkillsAvailable(): string[] {
    const leadSkill = this.computeSkillAvailable();
    const seen = new Set<string>(leadSkill ? [leadSkill] : []);
    const result: string[] = [];
    for (const companion of this.party.team.slice(1)) {
      for (const [skillId, def] of Object.entries(SKILL_DEFS)) {
        if ((this.guildUpgrades[skillId] ?? 0) > 0 && def.class === companion.characterClass && !seen.has(skillId)) {
          seen.add(skillId);
          result.push(skillId);
        }
      }
    }
    return result;
  }

  /** Serializes the current game state to a JSON string for the renderer. */
  respond(): string {
    return JSON.stringify(this.toDict());
  }

  /** Returns a plain-object snapshot of all game state, used by respond() and fromDict(). */
  toDict(): GameStateDict {
    return {
      dungeon_level: this.dungeonLevel,
      gold: this.gold,
      kills: this.kills,
      deaths: this.deaths,
      highest_level: this.highestLevel,
      monsters_left: this.enemy.isBoss ? 0 : killsForFloor(this.dungeonLevel) - this.floorKills,
      enemy: {
        name: this.enemy.name,
        level: this.enemy.level,
        hp: Math.max(0.0, this.enemy.hp),
        max_hp: this.enemy.max_hp,
        xp_reward: this.enemy.xp_reward,
        gold_reward: this.enemy.gold_reward,
        attack_dps: this.enemy.attack_dps,
        is_boss: this.enemy.isBoss,
      },
      party: this.party.team.map((c) => c.toDict()),
      loot_pool: this.lootPool.map((i) => i.toDict()),
      upgrades: Object.fromEntries(
        Object.entries(this.upgrades).map(([name, utypes]) => [
          name,
          Object.fromEntries(
            (Object.entries(utypes) as [UpgradeType, number][]).map(([utype, lvl]) => [
              utype,
              {
                level: lvl,
                cost: this.upgradeCost(name, utype),
                effect: UPGRADE_EFFECTS[utype],
              },
            ]),
          ) as Record<UpgradeType, { level: number; cost: number; effect: number }>,
        ]),
      ),
      log: [...this.log],
      prestige_points: this.prestigePoints,
      lifetime_kills: this.lifetimeKills + this.kills,
      lifetime_deaths: this.lifetimeDeaths + this.deaths,
      lifetime_best_level: Math.max(this.lifetimeBestLevel, this.highestLevel),
      lifetime_enemy_kills: { ...this.lifetimeEnemyKills },
      total_prestiges: this.totalPrestiges,
      prestige_upgrades: { ...this.prestigeUpgrades },
      prestige_party_classes: { ...this.prestigePartyClasses },
      prestige_available: this.highestLevel >= PRESTIGE_UNLOCK_LEVEL,
      prestige_points_preview: this.highestLevel >= PRESTIGE_UNLOCK_LEVEL
        ? this.prestigePointsPreview()
        : 0,
      checkpoint_level: this.checkpointLevel,
      auto_sell_qualities: [...this.autoSellQualities],
      floor_kills: this.floorKills,
      dungeon_index: this.dungeonIndex,
      idle_gold_rate: this.idleGoldRate,
      venture_available: this.highestLevel >= VENTURE_UNLOCK_LEVEL,
      guild_upgrades: { ...this.guildUpgrades },
      skill_available: this.computeSkillAvailable(),
      companion_skills_available: this.computeCompanionSkillsAvailable(),
      skill_cooldowns: { ...this.skillCooldowns },
      active_effects: { ...this.activeEffects },
      run_id: this.runId,
      loot_max: this.lootMax,
    };
  }

  /** Returns the gold cost for the next level of an upgrade (doubles each level). */
  upgradeCost(charName: string, upgradeType: UpgradeType): number {
    const level = this.upgrades[charName][upgradeType];
    return Math.floor(UPGRADE_BASES[upgradeType] * Math.pow(2, level));
  }

  /**
   * Returns the party member who benefits most from the given item.
   * The lead always has first claim; companions compete on net damage gain.
   */
  bestRecipient(item: GearItem): Character {
    const lead = this.party.team[0];
    const leadCurrent = this.slotToCompare(lead, item);
    const itemPower = gearPower(item.stats);
    // Lead has first claim: give item to them if they have an empty slot or it beats their gear
    if (!leadCurrent || itemPower > gearPower(leadCurrent.stats)) return lead;
    // Lead doesn't benefit — pick the companion with the most to gain
    return this.party.team.slice(1).reduce((best, c) => {
      const bestCurrent = this.slotToCompare(best, item);
      const cCurrent = this.slotToCompare(c, item);
      const bestGain = itemPower - (bestCurrent ? gearPower(bestCurrent.stats) : 0);
      const cGain = itemPower - (cCurrent ? gearPower(cCurrent.stats) : 0);
      if (cGain > bestGain) return c;
      if (cGain === bestGain && c.dps > best.dps) return c;
      return best;
    }, lead);
  }

  /** Handles enemy defeat: awards XP/gold/loot, applies pending party abilities, and advances the floor. */
  onEnemyDeath(): void {
    for (const key of Object.keys(this.activeEffects)) {
      this.activeEffects[key] -= 1;
      if (this.activeEffects[key] <= 0) delete this.activeEffects[key];
    }
    const name = this.enemy.name;
    this.lifetimeEnemyKills[name] = (this.lifetimeEnemyKills[name] ?? 0) + 1;
    const xp = this.enemy.xp_reward;
    this.addLog(`${name} defeated! +${xp}xp`);
    for (const c of this.party.team) {
      c.gainXp(xp);
      c.health = Math.min(c.maxHealth, c.health + (c.maxHealth - c.health) * COMBAT_HEAL_FRACTION);
      while (c.pendingPartyAbilities.length > 0) {
        const ability = c.pendingPartyAbilities.shift()!;
        if (ability === "battle_standard") {
          for (const other of this.party.team) {
            if (other !== c) other.dps *= 1.1;
          }
          this.addLog(`${c.name} raises Battle Standard! Party DPS +10%.`);
        } else if (ability === "arcane_study") {
          for (const other of this.party.team) {
            other.xpMultiplier *= 1.25;
          }
          this.addLog(`${c.name} unlocks Arcane Study! Party XP +25%.`);
        } else if (ability === "holy_light") {
          for (const other of this.party.team) {
            other.health = Math.min(other.maxHealth, other.health + 5);
          }
          this.addLog(`${c.name} Holy Light! Party healed 5 HP.`);
        }
      }
    }

    this.runAutoSeller(); // sell existing loot before new drops land
    this.runAutoEquip();  // equip existing loot before new drops land
    const partyGoldBonus = this.party.team.reduce((s, c) => s + c.goldBonus, 0);
    if (this.enemy.isBoss) {
      this.gold += this.enemy.gold_reward * (1 + partyGoldBonus);
      if (this.lootPool.length < this.lootMax) {
        const effectiveLevel = this.dungeonLevel + this.dungeonIndex * 5;
        const drop = getItem(undefined, effectiveLevel);
        this.lootPool.push(drop);
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      this.dungeonLevel += 1;
      this.floorKills = 0;
      if (this.dungeonLevel > this.highestLevel) {
        this.highestLevel = this.dungeonLevel;
        this.syncSmartSeller();
      }
      const cp3 = (this.prestigeUpgrades["checkpoint_3"] ?? 0) > 0;
      const cp2 = (this.prestigeUpgrades["checkpoint_2"] ?? 0) > 0;
      const cp1 = (this.prestigeUpgrades["checkpoint_1"] ?? 0) > 0;
      const isCheckpoint = cp3 ? (this.dungeonLevel % 5 === 0)
        : cp2 ? (this.dungeonLevel % 10 === 0)
        : cp1 ? (this.dungeonLevel === 15)
        : false;
      if (isCheckpoint) {
        this.checkpointLevel = this.dungeonLevel;
        this.addLog(`⚑ Checkpoint! Respawn set to floor ${this.checkpointLevel}.`);
      }
      this.addLog(`Descending to level ${this.dungeonLevel}!`);
      this.enemy = generateEnemy(this.dungeonLevel, this.dungeonIndex);
    } else {
      const dropChance = Math.min(0.75, DROP_CHANCE + this.dungeonIndex * 0.05);
      if (Math.random() < dropChance && this.lootPool.length < this.lootMax) {
        const effectiveLevel = this.dungeonLevel + this.dungeonIndex * 5;
        const drop = getItem(undefined, effectiveLevel);
        this.lootPool.push(drop);
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      this.kills += 1;
      this.floorKills += 1;
      if (this.floorKills >= killsForFloor(this.dungeonLevel)) {
        this.floorKills = 0;
        this.addLog(`Floor ${this.dungeonLevel} cleared! Boss incoming!`);
        this.enemy = generateBoss(this.dungeonLevel, this.dungeonIndex);
      } else {
        this.enemy = generateEnemy(this.dungeonLevel, this.dungeonIndex);
      }
    }
    this.runAutoUpgrade();
  }

  /** Handles party wipe: increments deaths, resets to checkpoint, and fully restores all HP. */
  onPlayerDeath(): void {
    const player = this.party.team[0];
    this.deaths += 1;
    const msg = this.checkpointLevel > 1
      ? `${player.name} was defeated! Respawning at floor ${this.checkpointLevel}...`
      : `${player.name} was defeated! Returning to level 1...`;
    this.addLog(msg);
    this.dungeonLevel = this.checkpointLevel;
    this.kills = 0;
    this.floorKills = 0;
    for (const c of this.party.team) {
      c.health = c.maxHealth;
    }
    this.enemy = generateEnemy(this.checkpointLevel);
  }

  /** Passes a displaced item to the best recipient if it is an upgrade for them; otherwise sells it. */
  private disposeItem(old: GearItem): void {
    if (this.isUpgradeForAnyMember(old)) {
      const recipient = this.bestRecipient(old);
      const further = recipient.equipItem(old);
      this.addLog(`${recipient.name} equips ${old.getName()}!`);
      if (further) {
        this.gold += further.sellValue;
        this.addLog(`Sold ${further.getName()} for ${further.sellValue}g.`);
      }
    } else {
      this.gold += old.sellValue;
      this.addLog(`Sold ${old.getName()} for ${old.sellValue}g.`);
    }
  }

  /**
   * Returns the equipped item that would be displaced if this item were equipped.
   * For rings, returns the weaker ring (the one that will be replaced).
   */
  private slotToCompare(c: Character, item: GearItem): GearItem | null {
    if (item.slot !== "ring1") return c.inventory.slots[item.slot];
    const r1 = c.inventory.slots.ring1;
    const r2 = c.inventory.slots.ring2;
    if (!r1 || !r2) return null; // fills empty ring slot
    return gearPower(r1.stats) <= gearPower(r2.stats) ? r1 : r2; // weaker ring will be displaced
  }

  /** Sells all loot items matching the auto-sell quality list, skipping items that are upgrades. */
  private runAutoSeller(): void {
    if (!(this.prestigeUpgrades["auto_seller"] > 0) || this.autoSellQualities.length === 0) return;
    const toSell = this.lootPool.filter(
      item => this.autoSellQualities.includes(item.quality) && !this.isUpgradeForAnyMember(item)
    );
    if (toSell.length === 0) return;
    const gold = toSell.reduce((sum, item) => sum + item.sellValue, 0);
    this.gold += gold;
    this.lootPool = this.lootPool.filter(item => !toSell.includes(item));
    this.addLog(`Auto Seller: sold ${toSell.length} item(s) for ${gold}g`);
  }

  /** Adds any newly available quality tiers to autoSellQualities when Smart Seller is owned. */
  private syncSmartSeller(): void {
    if (!(this.prestigeUpgrades["smart_seller"] > 0)) return;
    const threshold = autoSellThreshold(this.highestLevel);
    for (let i = 0; i <= threshold; i++) {
      const quality = QUAL[i];
      if (!this.autoSellQualities.includes(quality)) {
        this.autoSellQualities.push(quality);
      }
    }
  }

  /** Equips all upgrade items from the loot pool, cascading displaced items to other party members. */
  private runAutoEquip(): void {
    if (!(this.prestigeUpgrades["auto_equip"] > 0)) return;
    let found = true;
    while (found) {
      found = false;
      for (let i = 0; i < this.lootPool.length; i++) {
        const item = this.lootPool[i];
        if (this.isUpgradeForAnyMember(item)) {
          this.lootPool.splice(i, 1);
          const target = this.bestRecipient(item);
          const old = target.equipItem(item);
          this.addLog(`Auto Equip: ${target.name} equips ${item.getName()}!`);
          if (old) this.disposeItem(old);
          found = true;
          break;
        }
      }
    }
  }

  /** Greedily buys the cheapest affordable stat upgrade for any party member until gold runs out. */
  private runAutoUpgrade(): void {
    if (!(this.prestigeUpgrades["auto_upgrade"] > 0)) return;
    const upgradeTypes: UpgradeType[] = ["dps", "xp", "click", "hp"];
    let bought = true;
    while (bought) {
      bought = false;
      let cheapest: { char: Character; type: UpgradeType; cost: number } | null = null;
      for (const c of this.party.team) {
        for (const type of upgradeTypes) {
          const cost = this.upgradeCost(c.name, type);
          if (this.gold >= cost && (!cheapest || cost < cheapest.cost)) {
            cheapest = { char: c, type, cost };
          }
        }
      }
      if (cheapest) {
        const { char, type } = cheapest;
        this.gold -= cheapest.cost;
        this.upgrades[char.name][type] += 1;
        if (type === "dps") char.dps += UPGRADE_EFFECTS.dps;
        else if (type === "xp") char.xpMultiplier += UPGRADE_EFFECTS.xp;
        else if (type === "click") char.clickBonus += UPGRADE_EFFECTS.click;
        else if (type === "hp") {
          char.maxHealth += HP_UPGRADE_EFFECT;
          char.health += HP_UPGRADE_EFFECT;
        }
        this.addLog(`Auto Upgrade: ${char.name} ${type} → Lv${this.upgrades[char.name][type]}`);
        bought = true;
      }
    }
  }

  /** Returns true if the given item is a net damage upgrade for at least one party member. */
  private isUpgradeForAnyMember(item: GearItem): boolean {
    return this.party.team.some(c => {
      const equipped = this.slotToCompare(c, item);
      return !equipped || gearPower(item.stats) > gearPower(equipped.stats);
    });
  }

  /** Appends a message to the combat log, evicting the oldest entry when full. */
  private addLog(message: string): void {
    this.log.push(message);
    if (this.log.length > MAX_LOG) this.log.shift();
  }

  /** Reconstructs a GameState from a serialized snapshot. */
  static fromDict(d: GameStateDict): GameState {
    const gs = new GameState();
    gs.party.team = [];
    gs.upgrades = {};

    gs.dungeonLevel = d.dungeon_level;
    gs.gold = d.gold;
    gs.kills = d.kills;
    gs.deaths = d.deaths ?? 0;
    gs.highestLevel = d.highest_level ?? d.dungeon_level;
    gs.log = [...d.log];

    for (const cd of d.party) {
      const c = Character.fromDict(cd);
      gs.party.addPlayer(c);
      gs.upgrades[c.name] = {
        dps: d.upgrades[c.name]?.dps?.level ?? 0,
        xp: d.upgrades[c.name]?.xp?.level ?? 0,
        click: d.upgrades[c.name]?.click?.level ?? 0,
        hp: d.upgrades[c.name]?.hp?.level ?? 0,
      };
    }

    gs.lootPool = d.loot_pool.map((item) => GearItem.fromDict(item));

    gs.prestigePoints = d.prestige_points ?? 0;
    gs.lifetimeKills = d.lifetime_kills ?? 0;
    gs.lifetimeDeaths = d.lifetime_deaths ?? 0;
    gs.lifetimeBestLevel = d.lifetime_best_level ?? d.highest_level ?? 1;
    gs.lifetimeEnemyKills = { ...(d.lifetime_enemy_kills ?? {}) };
    gs.totalPrestiges = d.total_prestiges ?? 0;
    gs.prestigeUpgrades = { ...(d.prestige_upgrades ?? {}) };
    gs.prestigePartyClasses = { ...(d.prestige_party_classes ?? {}) };
    gs.autoSellQualities = [...(d.auto_sell_qualities ?? [])];
    gs.checkpointLevel = d.checkpoint_level ?? 1;
    gs.floorKills = d.floor_kills ?? 0;
    gs.dungeonIndex = d.dungeon_index ?? 0;
    gs.idleGoldRate = d.idle_gold_rate ?? 0;
    gs.guildUpgrades = { ...(d.guild_upgrades ?? {}) };
    gs.skillCooldowns = { ...(d.skill_cooldowns ?? {}) };
    gs.activeEffects = { ...(d.active_effects ?? {}) };
    gs.runId = d.run_id ?? crypto.randomUUID();

    gs.enemy = {
      name: d.enemy.name,
      level: d.enemy.level,
      hp: d.enemy.hp,
      max_hp: d.enemy.max_hp,
      xp_reward: d.enemy.xp_reward,
      gold_reward: d.enemy.gold_reward,
      attack_dps: d.enemy.attack_dps,
      isBoss: d.enemy.is_boss ?? false,
    };

    return gs;
  }
}

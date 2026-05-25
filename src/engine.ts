import { Character, type Rune } from "./character.js";
import { getConstellationBonuses, CONSTELLATION_NODE_DEFS, type ConstellationBonuses } from "./constellations.js";
export { CONSTELLATION_NODE_DEFS };
export type { ConstellationBonuses };
import { Party } from "./party.js";
import { GearItem, getItem, getSetItem, SET_DEFS, gearPower, QUAL, SLOTS, autoSellThreshold, type GearItemDict, type Slot } from "./gear.js";
import { generateEnemy, generateBoss, generateEliteEnemy, ENEMY_NOUNS, ELITE_HP_MULT, ELITE_ATTACK_MULT, ELITE_REWARD_MULT, type Enemy, type EnemyDict } from "./dungeon.js";
import { ARTIFACT_DEFS, ARTIFACT_DROP_POOL, LEGACY_UPGRADED_MAP, artifactUpgradeCost, artifactSellValue, artifactFuelValue, artifactStatLabel, type ArtifactEffectId, type ArtifactInstance } from "./artifacts.js";
export { ARTIFACT_DEFS, ARTIFACT_DROP_POOL, artifactUpgradeCost, artifactSellValue, artifactFuelValue, artifactStatLabel };
export type { ArtifactInstance };

export { ELITE_HP_MULT, ELITE_ATTACK_MULT, ELITE_REWARD_MULT };
export const ELITE_SPAWN_CHANCE = 0.15;

/** Formats a number with commas below 10,000 and shorthand (k/m/b) above. */
export function formatNumber(n: number): string {
  const v = Math.floor(n);
  if (v < 10_000) return v.toLocaleString("en-US");
  if (v < 1_000_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  if (v < 1_000_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "b";
}

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
  defense: 150,
};

/** Stat delta applied per upgrade level for XP-rate upgrades. */
export const UPGRADE_EFFECTS: Record<string, number> = {
  xp: 0.1,
};

/** DPS multiplier bonus added per DPS-upgrade level (+5% per level). */
export const DPS_UPGRADE_EFFECT = 0.01;

/** Click damage multiplier bonus added per click-upgrade level (+5% per level). */
export const CLICK_UPGRADE_EFFECT = 0.05;

/** Max-HP multiplier applied per HP-upgrade level (+5% of current max HP per level). */
export const HP_UPGRADE_EFFECT = 0.05;

/** Damage reduction added per defense-upgrade level. */
export const DEFENSE_UPGRADE_EFFECT = 0.01;

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


/** Minimum dungeon floor (highest_level) required to venture from dungeon 1. */
export const VENTURE_UNLOCK_LEVEL = 40;

/** Returns the floor required to venture from the given dungeon (increases by 5 per dungeon). */
export function ventureUnlockLevel(dungeonIndex: number): number {
  return VENTURE_UNLOCK_LEVEL + dungeonIndex * 5;
}

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
  party_slot_6: 6,
  starting_gold: 1,
  xp_bonus: 1,
  gold_bonus: 1,
  dps_bonus: 1,
  checkpoint: 1,
  gold_mastery: 2,
  gear_luck: 2,
  combine_all_runes: 2,
  stash: 0,
};

/** Minimum dungeonIndex required to purchase each prestige upgrade. */
export const PRESTIGE_DUNGEON_REQ: Record<string, number> = {
  gold_mastery: 1,
  gear_luck: 1,
  stash: 2,
};

/** Stackable upgrades whose cost increases by 1 pt per stack already owned. */
const SCALING_PRESTIGE_UPGRADES = new Set(["starting_gold", "xp_bonus", "gold_bonus", "dps_bonus", "checkpoint", "gold_mastery", "gear_luck"]);

/** Prestige point costs for each tier of the gear stash upgrade (levels 1–4). */
export const STASH_TIER_COSTS = [0, 2, 5, 10];

/** Number of stash slots unlocked at each stash tier (index = tier - 1). */
export const STASH_SIZES = [3, 6, 10, 15];

/** Returns the prestige point cost for the next purchase of a given upgrade type. */
export function prestigeUpgradeCost(type: string, currentStacks: number): number {
  if (type === "stash") return STASH_TIER_COSTS[currentStacks] ?? Infinity;
  if (SCALING_PRESTIGE_UPGRADES.has(type)) {
    return PRESTIGE_SHOP_COSTS[type] + currentStacks;
  }
  return PRESTIGE_SHOP_COSTS[type];
}

/** Gold cost for each stack of every Guild Hall upgrade. */
export const GUILD_HALL_COSTS: Record<string, number[]> = {
  companion_hall:      [10_000, 16_000, 24_000],
  expanded_armory:     [2_000,  4_000,  6_000],
  class_paladin:       [8_000],
  class_ranger:        [8_000],
  class_druid:         [12_000],
  skill_battle_cry:    [5_000],
  skill_shadow_strike: [5_000],
  skill_arcane_surge:  [5_000],
  skill_consecrate:    [10_000],
  skill_volley:        [10_000],
  skill_entangle:      [10_000],
  auto_attack:            [6_000],
  eternal_cycle:          [16_000],
  rune_forge:             [10_000, 20_000, 40_000, 80_000],
  constellation_access:   [20_000],
};

/** All rune definitions: 6 types × 4 tiers (Lesser → Greater → Flawless → Ancient, each 2× the previous). */
export const RUNE_DEFS: Record<string, Rune> = {
  striking_lesser:   { id: "striking_lesser",   name: "Lesser Striking Rune",   type: "striking",  tier: "lesser",   statKey: "dps",          value: 8 },
  striking_greater:  { id: "striking_greater",  name: "Greater Striking Rune",  type: "striking",  tier: "greater",  statKey: "dps",          value: 16 },
  striking_flawless: { id: "striking_flawless", name: "Flawless Striking Rune", type: "striking",  tier: "flawless", statKey: "dps",          value: 32 },
  striking_ancient:  { id: "striking_ancient",  name: "Ancient Striking Rune",  type: "striking",  tier: "ancient",  statKey: "dps",          value: 64 },
  warding_lesser:    { id: "warding_lesser",    name: "Lesser Warding Rune",    type: "warding",   tier: "lesser",   statKey: "maxHp",        value: 25 },
  warding_greater:   { id: "warding_greater",   name: "Greater Warding Rune",   type: "warding",   tier: "greater",  statKey: "maxHp",        value: 50 },
  warding_flawless:  { id: "warding_flawless",  name: "Flawless Warding Rune",  type: "warding",   tier: "flawless", statKey: "maxHp",        value: 100 },
  warding_ancient:   { id: "warding_ancient",   name: "Ancient Warding Rune",   type: "warding",   tier: "ancient",  statKey: "maxHp",        value: 200 },
  swiftness_lesser:  { id: "swiftness_lesser",  name: "Lesser Swiftness Rune",  type: "swiftness", tier: "lesser",   statKey: "haste",        value: 0.04 },
  swiftness_greater: { id: "swiftness_greater", name: "Greater Swiftness Rune", type: "swiftness", tier: "greater",  statKey: "haste",        value: 0.08 },
  swiftness_flawless:{ id: "swiftness_flawless",name: "Flawless Swiftness Rune",type: "swiftness", tier: "flawless", statKey: "haste",        value: 0.16 },
  swiftness_ancient: { id: "swiftness_ancient", name: "Ancient Swiftness Rune", type: "swiftness", tier: "ancient",  statKey: "haste",        value: 0.32 },
  greed_lesser:      { id: "greed_lesser",      name: "Lesser Greed Rune",      type: "greed",     tier: "lesser",   statKey: "goldBonus",    value: 0.04 },
  greed_greater:     { id: "greed_greater",     name: "Greater Greed Rune",     type: "greed",     tier: "greater",  statKey: "goldBonus",    value: 0.08 },
  greed_flawless:    { id: "greed_flawless",    name: "Flawless Greed Rune",    type: "greed",     tier: "flawless", statKey: "goldBonus",    value: 0.16 },
  greed_ancient:     { id: "greed_ancient",     name: "Ancient Greed Rune",     type: "greed",     tier: "ancient",  statKey: "goldBonus",    value: 0.32 },
  fortune_lesser:    { id: "fortune_lesser",    name: "Lesser Fortune Rune",    type: "fortune",   tier: "lesser",   statKey: "xpMultiplier", value: 0.04 },
  fortune_greater:   { id: "fortune_greater",   name: "Greater Fortune Rune",   type: "fortune",   tier: "greater",  statKey: "xpMultiplier", value: 0.08 },
  fortune_flawless:  { id: "fortune_flawless",  name: "Flawless Fortune Rune",  type: "fortune",   tier: "flawless", statKey: "xpMultiplier", value: 0.16 },
  fortune_ancient:   { id: "fortune_ancient",   name: "Ancient Fortune Rune",   type: "fortune",   tier: "ancient",  statKey: "xpMultiplier", value: 0.32 },
  wrath_lesser:      { id: "wrath_lesser",      name: "Lesser Wrath Rune",      type: "wrath",     tier: "lesser",   statKey: "critChance",   value: 0.03 },
  wrath_greater:     { id: "wrath_greater",     name: "Greater Wrath Rune",     type: "wrath",     tier: "greater",  statKey: "critChance",   value: 0.06 },
  wrath_flawless:    { id: "wrath_flawless",    name: "Flawless Wrath Rune",    type: "wrath",     tier: "flawless", statKey: "critChance",   value: 0.12 },
  wrath_ancient:     { id: "wrath_ancient",     name: "Ancient Wrath Rune",     type: "wrath",     tier: "ancient",  statKey: "critChance",   value: 0.24 },
};

/** Minimum dungeonIndex required to purchase each Guild Hall upgrade. */
export const GUILD_HALL_DUNGEON_REQ: Record<string, number> = {
  class_paladin:        1,
  class_ranger:         1,
  skill_consecrate:     1,
  skill_volley:         1,
  class_druid:          2,
  skill_entangle:       2,
  constellation_access: 2,
};

/** Guild Hall upgrades that require another upgrade to be owned first. */
export const GUILD_HALL_PREREQS: Record<string, string> = {
  skill_consecrate: "class_paladin",
  skill_volley:     "class_ranger",
  skill_entangle:   "class_druid",
};

/** Cooldown (ms) and duration (kills) and class requirement for each active combat skill. */
/** Floor at which dungeon corruption begins dealing passive damage to the party (dungeon 2+ only). */
export const CORRUPTION_FLOOR = 20;
/** Fraction of a member's maxHealth lost per second per floor of depth beyond CORRUPTION_FLOOR. */
export const CORRUPTION_RATE_PER_FLOOR = 0.0015;
/** Lifesteal is reduced by this fraction per floor of depth, capped at 90%. */
export const CORRUPTION_HEAL_REDUCTION_PER_FLOOR = 0.06;

/** Fraction by which enemy attack DPS is reduced while Entangle is active. */
export const ENTANGLE_REDUCTION = 0.60;

/** Seconds into a boss/elite fight before enrage triggers. */
export const BOSS_ENRAGE_TRIGGER = 15;
/** Seconds between enrage multiplier steps after trigger. */
export const BOSS_ENRAGE_STEP = 10;

export const BATTLE_CRY_MULT    = 2.0;
export const SHADOW_STRIKE_MULT = 3.0;
export const ARCANE_SURGE_MULT  = 3.0;
export const VOLLEY_MULT        = 2.5;

export const SKILL_DEFS: Record<string, { cooldownKills: number; durationKills: number; class: string }> = {
  skill_battle_cry:    { cooldownKills: 20, durationKills: 8, class: "fighter" },
  skill_shadow_strike: { cooldownKills: 20, durationKills: 5, class: "rogue" },
  skill_arcane_surge:  { cooldownKills: 25, durationKills: 6, class: "mage" },
  skill_consecrate:    { cooldownKills: 15, durationKills: 0, class: "paladin" },
  skill_volley:        { cooldownKills: 15, durationKills: 6, class: "ranger" },
  skill_entangle:      { cooldownKills: 20, durationKills: 8, class: "druid" },
};

/** Lifesteal effectiveness against boss and elite enemies. */
export const BOSS_LIFESTEAL_MULT = 0.25;

/** Non-binary class-themed names for companion party slots (slot 2–6 use index 0–4). */
export const COMPANION_NAMES: Record<string, string[]> = {
  fighter: ["Cade",   "Raze",   "Flint",  "Sable",   "Onyx"  ],
  rogue:   ["Vesper", "Vale",   "Ash",    "Cipher",  "Dusk"  ],
  mage:    ["Indigo", "Lyric",  "Zephyr", "Rune",    "Lark"  ],
  paladin: ["Sol",    "Blair",  "Corin",  "Emery",   "Avery" ],
  ranger:  ["River",  "Cedar",  "Finch",  "Briar",   "Brook" ],
  druid:   ["Rowan",  "Hazel",  "Fern",   "Sage",    "Wren"  ],
};

function companionName(cls: string, slotIdx: number): string {
  return (COMPANION_NAMES[cls] ?? COMPANION_NAMES.fighter)[slotIdx] ?? "Companion";
}

const RUNE_TIER_UP: Record<string, string> = { lesser: "greater", greater: "flawless", flawless: "ancient" };

/** Generates a random set piece at the given effective level (random set, random slot from that set). */
function randomSetDrop(effectiveLevel: number): GearItem {
  const setDef = SET_DEFS[Math.floor(Math.random() * SET_DEFS.length)];
  const setSlot = setDef.slots[Math.floor(Math.random() * setDef.slots.length)] as Slot;
  return getSetItem(setDef.id, setSlot, effectiveLevel);
}

/** Applies the per-character side effect (xp/hp/defense) of buying one upgrade level. dps/click are read on tick. */
function applyUpgradeStatEffect(char: Character, type: UpgradeType): void {
  if (type === "xp") {
    char.xpMultiplier += UPGRADE_EFFECTS.xp;
  } else if (type === "hp") {
    const hpGain = Math.round(char.maxHealth * HP_UPGRADE_EFFECT);
    char.maxHealth += hpGain;
    char.health = Math.min(char.maxHealth, char.health + hpGain);
  } else if (type === "defense") {
    char.damageReduction = Math.min(0.95, char.damageReduction + DEFENSE_UPGRADE_EFFECT);
  }
}

/** Fraction of missing HP restored after each enemy kill. */
export const COMBAT_HEAL_FRACTION = 0.12;

/** Maximum offline time (in seconds) credited for idle gold catch-up. */
export const OFFLINE_GOLD_CAP_SECONDS = 8 * 3600; // 8 hours

/** Gold at run start for a given starting_gold prestige level.
 *  Covers the cost of every upgrade type up to that level for one character. */
export function startingGoldForLevel(level: number): number {
  if (level === 0) return 0;
  const sum = Object.values(UPGRADE_BASES).reduce((s, b) => s + b, 0); // 375
  return Math.floor(sum * (Math.pow(2, level) - 1));
}

/** XP multiplier bonus added per xp_bonus prestige upgrade level. */
export const XP_BONUS_PER_LEVEL = 0.10;

/** Gold earn multiplier bonus added per gold_bonus prestige upgrade level. */
export const GOLD_BONUS_PER_LEVEL = 0.10;

/** Party DPS multiplier bonus added per dps_bonus prestige upgrade level. */
export const DPS_BONUS_PER_LEVEL = 0.05;

/** Gold multiplier bonus per additional party member beyond the first. */
export const PARTY_GOLD_BONUS_PER_MEMBER = 0.20;

/** Gold received when selling a rune, keyed by tier. */
export const RUNE_SELL_VALUES: Record<string, number> = {
  lesser:   10,
  greater:  30,
  flawless: 90,
  ancient:  250,
};

/** Player avatar options — unlockable via achievements. */
export const AVATAR_DEFS: { id: string; icon: string; name: string }[] = [
  { id: "default",  icon: "⚔",  name: "Warrior"         },
  { id: "dragon",   icon: "🐉",  name: "Dragon Slayer"   },
  { id: "skull",    icon: "💀",  name: "The Dead"        },
  { id: "gem",      icon: "💎",  name: "Treasure Hunter" },
  { id: "crown",    icon: "👑",  name: "Champion"        },
  { id: "rune",     icon: "🔮",  name: "Arcanist"        },
  { id: "star",     icon: "⭐",  name: "Legend"          },
  { id: "warlord",  icon: "🔱",  name: "Warlord"         },
  { id: "merchant", icon: "💰",  name: "Merchant"        },
  { id: "hunter",   icon: "🏹",  name: "Hunter"          },
];

/** Player avatar border styles — unlockable via achievements. */
export const BORDER_DEFS: { id: string; cssClass: string; name: string }[] = [
  { id: "none",    cssClass: "border-none",    name: "None"    },
  { id: "iron",    cssClass: "border-iron",    name: "Iron"    },
  { id: "silver",  cssClass: "border-silver",  name: "Silver"  },
  { id: "gold",    cssClass: "border-gold",    name: "Gold"    },
  { id: "blood",   cssClass: "border-blood",   name: "Blood"   },
  { id: "arcane",  cssClass: "border-arcane",  name: "Arcane"  },
  { id: "ancient", cssClass: "border-ancient", name: "Ancient" },
  { id: "void",    cssClass: "border-void",    name: "Void"    },
];

/** Snapshot of a retired hero, stored permanently in the Hall of Fame. */
export interface RetiredHero {
  name: string;
  characterClass: string;
  level: number;
  highestFloor: number;
  dungeonIndex: number;
  prestigeCount: number;
  score: number;
  retiredOn: string; // ISO date string
}

/** Legacy unlocks granted per retirement milestone: { retirements → { classes, title, avatars, borders } } */
export const LEGACY_UNLOCKS: Record<number, { classes: string[]; title: string; avatar?: string; border?: string }> = {
  1: { classes: ["paladin"], title: "Veteran",    avatar: "crown" },
  2: { classes: ["ranger"],  title: "Twice-Born", border: "blood" },
  3: { classes: ["druid"],   title: "The Eternal", avatar: "warlord" },
};

/** All visual themes with their prestige unlock requirements. */
export const THEME_UNLOCKS: { theme: string; icon: string; label: string; prestiges: number }[] = [
  { theme: "grimdark",    icon: "⚔",  label: "Grimdark",    prestiges: 0 },
  { theme: "arcane",      icon: "🔮", label: "Arcane",       prestiges: 0 },
  { theme: "tavern",      icon: "🍺", label: "Tavern",       prestiges: 1 },
  { theme: "inferno",     icon: "🔥", label: "Inferno",      prestiges: 3 },
  { theme: "void-rift",   icon: "🌀", label: "Void Rift",    prestiges: 5 },
  { theme: "bloodmoon",   icon: "🩸", label: "Bloodmoon",    prestiges: 8 },
  { theme: "frost-crypt", icon: "❄",  label: "Frost Crypt",  prestiges: 12 },
  { theme: "necropolis",  icon: "💀", label: "Necropolis",   prestiges: 17 },
];

export type AchievementCategory = "combat" | "explorer" | "collector" | "wealth" | "prestige" | "guild" | "runes";
export type AchievementTierLabel = "bronze" | "silver" | "gold";

export interface AchievementReward {
  type: "gold" | "prestige_points" | "title" | "avatar" | "border";
  value?: number;
  title?: string;
  cosmetic?: string; // avatar id or border id
}

export interface AchievementTier {
  label: AchievementTierLabel;
  threshold: number;
  reward?: AchievementReward;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  hidden: boolean;
  tiers?: AchievementTier[];
  reward?: AchievementReward;
  getValue: (gs: GameState) => number;
}

export interface AchievementUnlock {
  id: string;
  tier?: AchievementTierLabel;
  name: string;
  reward?: AchievementReward;
  wasHidden?: boolean;
}

/** The five stat categories that can be upgraded per character. */
type UpgradeType = "dps" | "xp" | "click" | "hp" | "defense";

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
  enemy: EnemyDict;
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
  auto_equip_enabled: boolean;
  auto_sell_enabled: boolean;
  auto_upgrade_enabled: boolean;
  floor_kills: number;
  dungeon_index: number;
  idle_gold_rate: number;
  venture_available: boolean;
  death_floors: Record<number, number>;
  guild_upgrades: Record<string, number>;
  skill_available: string | null;
  companion_skills_available: string[];
  skill_cooldowns: Record<string, number>;
  active_effects: Record<string, number>;
  loot_max: number;
  saved_at: number;
  achievements_unlocked: string[];
  earned_title: string;
  lifetime_gold: number;
  lifetime_loot: number;
  lifetime_sold: number;
  lifetime_boss_kills: number;
  lifetime_legendary: number;
  lifetime_divine: number;
  lifetime_divine_sold: number;
  lifetime_elite_kills: number;
  lifetime_runes_sold: number;
  lifetime_runes_combined: number;
  lifetime_skill_activations: number;
  lifetime_upgrades_bought: number;
  pending_achievements: AchievementUnlock[];
  rune_inventory: Rune[];
  earned_titles: string[];
  gear_stash: GearItemDict[];
  artifact_inventory?: ArtifactInstance[];
  kill_streak?: number;
  lifetime_best_kill_streak?: number;
  earned_avatars?: string[];
  earned_borders?: string[];
  selected_avatar?: string;
  selected_border?: string;
  lifetime_clicks?: number;
  achievement_progress?: Record<string, number>;
  achievement_progress_ts?: number;
  auto_prestige_enabled?: boolean;
  auto_prestige_threshold?: number;
  auto_skill_enabled?: boolean;
  all_skills_unlocked?: boolean;
  boss_enrage_time?: number;
  boss_enrage_mult?: number;
  retired_heroes?: RetiredHero[];
  retirement_count?: number;
  unlocked_hero_classes?: string[];
  legacy_titles?: string[];
  needs_hero_creation?: boolean;
  constellation_shards?: number;
  constellation_nodes?: string[];
  party_version?: number;
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
  /** Whether auto-equip runs automatically on loot drops. */
  autoEquipEnabled = true;
  /** Whether auto-sell runs automatically on loot drops. */
  autoSellEnabled = true;
  /** Whether auto-upgrade runs automatically after each kill. */
  autoUpgradeEnabled = true;
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
  /** Death count per dungeon floor this run (floor → count); resets on prestige/venture. */
  deathFloors: Record<number, number> = {};
  /** Unix-ms timestamp of the last activation per skill id (for cooldown tracking). */
  skillCooldowns: Record<string, number> = {};
  /** Unix-ms expiry timestamp per active skill effect; entries are pruned on tick. */
  activeEffects: Record<string, number> = {};
  /** Unique ID for this save file — generated once on new game, survives prestiges. */
  runId: string = crypto.randomUUID();
  /** Unix-ms timestamp when the state was last serialized (used for offline catch-up). */
  savedAt = 0;
  /** Total gold ever earned across all runs (never resets). */
  lifetimeGold = 0;
  /** Total items ever looted across all runs (never resets). */
  lifetimeLoot = 0;
  /** Total items ever sold across all runs (never resets). */
  lifetimeSold = 0;
  /** Total boss kills across all runs (never resets). */
  lifetimeBossKills = 0;
  /** 1 once the player has ever obtained a legendary item; never resets. */
  lifetimeLegendary = 0;
  /** 1 once the player has ever obtained a divine item; never resets. */
  lifetimeDivine = 0;
  /** 1 once the player has ever sold a divine item; never resets. */
  lifetimeDivineSold = 0;
  /** Total elite enemies killed across all runs. */
  lifetimeEliteKills = 0;
  /** Total runes sold across all runs. */
  lifetimeRunesSold = 0;
  /** Total runes combined across all runs. */
  lifetimeRunesCombined = 0;
  /** Total skill activations across all runs. */
  lifetimeSkillActivations = 0;
  /** Total stat upgrades bought across all runs. */
  lifetimeUpgradesBought = 0;
  /** Set of achievement/tier IDs that have been awarded. */
  achievementsUnlocked: Set<string> = new Set();
  /** Active cosmetic title earned from an achievement. */
  earnedTitle = "nobody";
  /** Achievement unlocks queued for toast notifications; cleared after each respond(). */
  pendingAchievements: AchievementUnlock[] = [];
  /** Runes held in the player's rune inventory, awaiting branding. */
  runeInventory: Rune[] = [];
  /** Items saved in the cross-prestige gear stash. */
  gearStash: GearItem[] = [];
  /** Leveled artifact instances held in the shared inventory (persists through prestige). */
  artifactInventory: ArtifactInstance[] = [];
  /** Consecutive kills without a party wipe (used by Berserker's Eye / Titan's Eye). */
  killStreak = 0;
  /** Highest kill streak ever reached in a single run (never resets). */
  lifetimeBestKillStreak = 0;
  /** Total manual clicks across all runs (never resets). */
  lifetimeClicks = 0;
  /** Set of avatar IDs the player has earned via achievements. */
  earnedAvatars: Set<string> = new Set(["default"]);
  /** Set of border IDs the player has earned via achievements. */
  earnedBorders: Set<string> = new Set(["none"]);
  /** Currently active avatar ID. */
  selectedAvatar = "default";
  /** Currently active border ID. */
  selectedBorder = "none";
  /** Whether auto-prestige fires automatically when prestige is available and threshold is met. */
  autoPrestigeEnabled = false;
  /** Whether auto-skill cycles and fires one ready skill per enemy kill. */
  autoSkillEnabled = false;
  /** Index into the owned-skills list for the auto-skill cycle. */
  private skillCycleIdx = 0;
  bossEncounterTime = 0;
  /** Minimum prestige_points_preview required to trigger auto-prestige. */
  autoPrestigeThreshold = 5;
  /** Hall of Fame records for all retired heroes. */
  retiredHeroes: RetiredHero[] = [];
  /** Total number of times a hero has been retired. */
  retirementCount = 0;
  /** Hero classes unlocked through retirement legacy rewards. */
  unlockedHeroClasses: Set<string> = new Set(["fighter", "rogue", "mage"]);
  /** Titles earned through retirement legacy rewards. */
  legacyTitles: Set<string> = new Set();
  /** True when a hard reset has occurred and the player must create a new hero. */
  needsHeroCreation = false;
  /** Soul shards available to spend in the Constellation tree. */
  constellationShards = 0;
  /** Set of unlocked constellation node IDs. */
  unlockedConstellationNodes: Set<string> = new Set();
  /** Tracks whether Last Stand has fired this floor. */
  lastStandUsedThisFloor = false;

  private _cbCache: ConstellationBonuses | null = null;
  private _achCache: Record<string, number> = {};
  private _achCacheTime = 0;
  private _titlesCache: string[] | null = null;
  private _stateCache: GameStateDict | null = null;
  private _lastJson = "";
  private _lootCache: GearItemDict[] | null = null;
  private _stashCache: GearItemDict[] | null = null;
  private _artifactInvCache: { id: ArtifactEffectId; level: number; fuel: number }[] | null = null;
  private _upgradesCache: GameStateDict["upgrades"] | null = null;
  private _achievementsListCache: string[] | null = null;
  /** Incremented on any structural party change (level, gear, runes, artifacts). Used as a cheap render cache key. */
  partyVersion = 0;

  /** Current loot chest capacity, expanding with Expanded Armory guild upgrades. */
  get lootMax(): number { return 8 + 2 * (this.guildUpgrades["expanded_armory"] ?? 0); }
  /** Maximum stash capacity based on the stash prestige upgrade level (0 if not unlocked). */
  get stashMax(): number {
    const level = this.prestigeUpgrades["stash"] ?? 0;
    if (level === 0) return 0;
    return STASH_SIZES[level - 1] ?? 15;
  }

  constructor(name = "Hero", characterClass = "fighter") {
    this.party = new Party();
    this.party.addPlayer(new Character(name, characterClass, 1));
    this.enemy = generateEnemy(this.dungeonLevel, this.dungeonIndex);
    for (const c of this.party.team) {
      this.upgrades[c.name] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
    }
  }

  /** Returns the effective DPS for a character, applying the per-level DPS upgrade multiplier. */
  private effectiveDps(c: Character): number {
    return c.dps * (1 + DPS_UPGRADE_EFFECT * (this.upgrades[c.name]?.dps ?? 0));
  }

  private get constellationBonuses(): ConstellationBonuses {
    if (!this._cbCache) {
      this._cbCache = getConstellationBonuses([...this.unlockedConstellationNodes]);
    }
    return this._cbCache;
  }

  /** Returns the click damage multiplier from click upgrades across all alive party members. */
  private clickUpgradeMult(): number {
    const totalLevels = this.party.team
      .filter(c => c.isAlive())
      .reduce((s, c) => s + (this.upgrades[c.name]?.click ?? 0), 0);
    return 1 + CLICK_UPGRADE_EFFECT * totalLevels;
  }

  /**
   * Advances the game simulation by `dt` seconds.
   * Applies idle gold, mana surges, passive DPS, enemy attacks, and death checks.
   * Returns serialized JSON state.
   */
  tick(dt: number): string {
    if (this.idleGoldRate > 0) this.earnGold(this.idleGoldRate * dt);
    // Mana Surge — fires before regular DPS so we can early-return if enemy dies
    for (const c of this.party.team) {
      if (!c.isAlive()) continue;
      if (c.abilities.includes("mana_surge") && c.inventory.equippedItems().length > 0) {
        c.surgeTimer += dt;
        if (c.surgeTimer >= MANA_SURGE_INTERVAL) {
          c.surgeTimer -= MANA_SURGE_INTERVAL;
          const surgeDmg = this.effectiveDps(c) * MANA_SURGE_MULTIPLIER;
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
    const shadowStrikeTick = (this.activeEffects["skill_shadow_strike"] ?? 0) > 0 ? SHADOW_STRIKE_MULT : 1.0;
    const battleCryMult = (this.activeEffects["skill_battle_cry"] ?? 0) > 0 ? BATTLE_CRY_MULT : 1.0;
    const arcaneSurgeMult = (this.activeEffects["skill_arcane_surge"] ?? 0) > 0 ? ARCANE_SURGE_MULT : 1.0;
    const volleyMult = (this.activeEffects["skill_volley"] ?? 0) > 0 ? VOLLEY_MULT : 1.0;

    const cb = this.constellationBonuses;
    let baseDps = 0;
    const partyHaste = this.party.team.reduce((s, c) => c.isAlive() ? s + c.haste : s, 0);
    for (const c of this.party.team) {
      if (!c.isAlive()) continue;
      if (c.inventory.equippedItems().length === 0) continue;
      let dps = this.effectiveDps(c);
      if (c.abilities.includes("bloodlust") && c.health <= c.maxHealth * 0.5) dps *= BLOODLUST_MULTIPLIER;
      // Berserker's Eye: streak-based DPS bonus, scales with level
      const eyeSlot = c.artifactSlots.find(s => s?.id === "berserkers_eye");
      if (eyeSlot) {
        const eyeDef = ARTIFACT_DEFS[eyeSlot.id];
        const mult = eyeSlot.level + 1;
        const streakBonus = Math.min(this.killStreak * eyeDef.effectValue * mult, (eyeDef.cap ?? 1) * mult);
        dps *= (1 + streakBonus);
      }
      // Warlord's Sigil: flat DPS bonus per level
      const sigilSlot = c.artifactSlots.find(s => s?.id === "warlords_sigil");
      if (sigilSlot) dps *= (1 + ARTIFACT_DEFS["warlords_sigil"].effectValue * (sigilSlot.level + 1));
      // Soulbrand: crit bonus per rune, scales with level
      const soulSlot = c.artifactSlots.find(s => s?.id === "soulbrand");
      let totalCrit = c.critChance + cb.critChanceBonus;
      if (soulSlot) {
        totalCrit += ARTIFACT_DEFS[soulSlot.id].effectValue * (soulSlot.level + 1) * Object.values(c.runes).filter(Boolean).length;
      }
      const critMult = cb.perfectKillActive ? 3 : 2;
      if (totalCrit > 0 && Math.random() < totalCrit) dps *= critMult;
      baseDps += dps;
    }
    // Runesmith: add extra DPS from rune bonuses above baseline
    if (cb.runeBonusMultiplier > 1.0) {
      for (const c of this.party.team) {
        if (!c.isAlive()) continue;
        const runeBaseDps = Object.values(c.runes ?? {})
          .filter(Boolean)
          .reduce((s, r) => (r as Rune).statKey === "dps" ? s + (r as Rune).value : s, 0);
        baseDps += runeBaseDps * (cb.runeBonusMultiplier - 1.0);
      }
    }
    const dpsPrestigeMult = 1 + DPS_BONUS_PER_LEVEL * (this.prestigeUpgrades["dps_bonus"] ?? 0);
    const partyBelow50 = this.party.team.some(c => c.isAlive() && c.health <= c.maxHealth * 0.5);
    const berserkerBonus = (cb.berserkerActive && partyBelow50) ? 1.30 : 1.0;
    const totalDps = baseDps * (1 + partyHaste * cb.hasteMultiplier) * dpsPrestigeMult * cb.dpsMultiplier * berserkerBonus;
    const dmgMult = (hasExpose ? EXPOSE_WEAKNESS_MULT : 1.0) * (hasMark ? 1.20 : 1.0) * battleCryMult * shadowStrikeTick * arcaneSurgeMult * volleyMult * (divineWrathActive ? 1.15 : 1.0);
    const damageDealt = totalDps * dmgMult * dt;
    this.enemy.hp -= damageDealt;
    if (this.enemy.hp <= 0) {
      this.onEnemyDeath();
      return this.respond();
    }

    // Boss enrage timer: accumulate time on boss/elite encounters
    if (this.enemy.isBoss || this.enemy.isElite) {
      this.bossEncounterTime += dt;
    }

    // Corruption: scales with floor depth × dungeon number (dungeon 2+ only)
    const corruptionDepth = this.dungeonIndex >= 1 ? Math.max(0, this.dungeonLevel - CORRUPTION_FLOOR) : 0;
    const corruptionMult = Math.min(20, corruptionDepth * this.dungeonIndex);
    const healReduction = Math.min(0.90, corruptionMult * CORRUPTION_HEAL_REDUCTION_PER_FLOOR);

    // Lifesteal: heal the first injured alive character — reduced by corruption at depth
    const regrowthBonus = this.party.team.some(c => c.isAlive() && c.abilities.includes("regrowth")) ? 0.05 : 0;
    const partyLifesteal = this.party.team.reduce((s, c) => c.isAlive() ? s + c.lifesteal : s, 0) + regrowthBonus;
    if (damageDealt > 0 && partyLifesteal > 0) {
      const bossReduction = (this.enemy.isBoss || this.enemy.isElite) ? BOSS_LIFESTEAL_MULT : 1.0;
      const effectiveLifesteal = partyLifesteal * (1 - healReduction) * bossReduction;
      const healTarget = this.party.team.find(c => c.isAlive() && c.health < c.maxHealth);
      if (healTarget) {
        healTarget.health = Math.min(healTarget.maxHealth, healTarget.health + damageDealt * effectiveLifesteal);
      }
    }

    const living = this.party.team.filter(c => c.isAlive());
    if (living.length > 0) {
      const target = living[Math.floor(Math.random() * living.length)];
      const partySizeMult = Math.sqrt(this.party.team.length);
      // Warden's Core: additive damage reduction scaled by level, capped at 50%
      let artifactDmgReduction = 0;
      const coreSlot = target.artifactSlots.find(s => s?.id === "wardens_core");
      if (coreSlot) artifactDmgReduction = ARTIFACT_DEFS[coreSlot.id].effectValue * (coreSlot.level + 1);
      const totalDmgReduction = Math.min(0.50, target.damageReduction + artifactDmgReduction) + Math.min(0.35, cb.defenseBonus / 100);
      const entangleMult = (this.activeEffects["skill_entangle"] ?? 0) > 0 ? (1 - ENTANGLE_REDUCTION) : 1.0;
      const phaseReduction = cb.phaseStepActive ? 0.85 : 1.0;
      target.health -= this.enemy.attack_dps * entangleMult * this.bossEnrageMult * partySizeMult * dt * (1 - totalDmgReduction) * phaseReduction;
      target.health = Math.max(0, target.health);
    }

    // Dungeon corruption: all living members lose % of maxHealth per second, scaling with floor depth × dungeon
    if (corruptionMult > 0) {
      for (const c of this.party.team) {
        if (!c.isAlive()) continue;
        c.health = Math.max(0, c.health - c.maxHealth * corruptionMult * CORRUPTION_RATE_PER_FLOOR * dt);
      }
    }

    this.applyLastStandIfActive();
    if (this.party.team.every(c => !c.isAlive())) {
      this.onPlayerDeath();
    }
    // Auto-prestige: fire when enabled and preview meets threshold
    if (this.autoPrestigeEnabled && this.highestLevel >= PRESTIGE_UNLOCK_LEVEL &&
        this.prestigePointsPreview() >= this.autoPrestigeThreshold) {
      return this.prestige();
    }
    return this.respond();
  }

  /** Deals a burst of click damage. Pass `manual=true` when triggered by the attack button to count toward the clicking feat. */
  click(manual = false): string {
    if (manual) this.lifetimeClicks++;
    const totalDps = this.party.team.reduce((s, c) => c.isAlive() ? s + this.effectiveDps(c) : s, 0);
    const clickBonus = this.party.team.reduce((s, c) => c.isAlive() ? s + c.clickBonus : s, 0);
    const clickCb = this.constellationBonuses;
    let damage = Math.max(1.0, totalDps * CLICK_DAMAGE_MULTIPLIER * 0.1 + clickBonus) * this.clickUpgradeMult() * clickCb.clickDpsMultiplier;
    if (this.party.team.some(c => c.isAlive() && c.abilities.includes("empower"))) damage *= EMPOWER_MULTIPLIER;
    const shadowStrikeActive = (this.activeEffects["skill_shadow_strike"] ?? 0) > 0;
    if (shadowStrikeActive) damage *= SHADOW_STRIKE_MULT;
    const hasLuckyStrike = this.party.team.some(c => c.isAlive() && c.abilities.includes("lucky_strike"));
    const hasEagleEye = this.party.team.some(c => c.isAlive() && c.abilities.includes("eagle_eye"));
    const clickCritMult = clickCb.perfectKillActive ? 3 : 2;
    if (hasLuckyStrike && Math.random() < LUCKY_STRIKE_CHANCE) {
      damage *= LUCKY_STRIKE_MULTIPLIER;
      this.addLog(`Lucky Strike! ${damage.toFixed(1)} dmg!`);
    } else if (hasEagleEye && Math.random() < 0.30) {
      damage *= clickCritMult;
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
    target.recomputeSetBonuses();
    this.lifetimeLoot += 1;
    this.addLog(`${target.name} equips ${item.getName()}!`);
    if (old) this.disposeItem(old);
    this._lootCache = null;
    this.partyVersion++;
    this.checkAchievements();
    return this.respond();
  }

  /** Equips a loot item onto a specific character. Displaced item returns to the loot pool. Returns serialized JSON. */
  equipLootOnChar(charIdx: number, lootIdx: number): string {
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    if (lootIdx < 0 || lootIdx >= this.lootPool.length) return this.respond();
    const item = this.lootPool.splice(lootIdx, 1)[0];
    const old = char.equipItem(item);
    char.recomputeSetBonuses();
    this.lifetimeLoot += 1;
    this.addLog(`${char.name} equips ${item.getName()}!`);
    if (old) this.lootPool.push(old);
    this._lootCache = null;
    this.partyVersion++;
    this.checkAchievements();
    return this.respond();
  }

  /** Removes a gear item from a character's slot. Prefers the stash; falls back to loot pool. Returns serialized JSON. */
  unequipGear(charIdx: number, slot: string): string {
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    const canStash = this.gearStash.length < this.stashMax;
    const canLoot = this.lootPool.length < this.lootMax;
    if (!canStash && !canLoot) return this.respond();
    const item = char.inventory.remove(slot as Slot);
    if (!item) return this.respond();
    char.recomputeSetBonuses();
    if (canStash) {
      this.gearStash.push(item);
      this._stashCache = null;
    } else {
      this.lootPool.push(item);
      this._lootCache = null;
    }
    this.partyVersion++;
    this.addLog(`${char.name} unequips ${item.getName()}.`);
    return this.respond();
  }

  /** Equips a stash item onto a character; the displaced item returns to the stash (or loot pool as fallback). Returns serialized JSON. */
  equipFromStash(charIdx: number, stashIdx: number): string {
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    if (stashIdx < 0 || stashIdx >= this.gearStash.length) return this.respond();
    const item = this.gearStash.splice(stashIdx, 1)[0];
    const old = char.equipItem(item);
    char.recomputeSetBonuses();
    this._stashCache = null;
    this.partyVersion++;
    this.addLog(`${char.name} equips ${item.getName()} from stash!`);
    if (old) {
      if (this.gearStash.length < this.stashMax) {
        this.gearStash.push(old);
      } else if (this.lootPool.length < this.lootMax) {
        this.lootPool.push(old);
        this._lootCache = null;
      } else {
        this.earnGold(old.sellValue);
        this.lifetimeSold += 1;
        this.addLog(`Sold ${old.getName()} for ${old.sellValue}g.`);
      }
    }
    return this.respond();
  }

  /** Moves a loot pool item into the stash. No-op if stash is full or not unlocked. Returns serialized JSON. */
  stashLoot(lootIdx: number): string {
    if (lootIdx < 0 || lootIdx >= this.lootPool.length) return this.respond();
    if (this.gearStash.length >= this.stashMax) return this.respond();
    const item = this.lootPool.splice(lootIdx, 1)[0];
    this.gearStash.push(item);
    this._lootCache = null;
    this._stashCache = null;
    this.addLog(`${item.getName()} moved to stash.`);
    return this.respond();
  }

  /** Sells a stash item at the given index for its sell value. Returns serialized JSON. */
  sellFromStash(stashIdx: number): string {
    if (stashIdx < 0 || stashIdx >= this.gearStash.length) return this.respond();
    const item = this.gearStash.splice(stashIdx, 1)[0];
    this.earnGold(item.sellValue);
    this.lifetimeSold += 1;
    this._stashCache = null;
    this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
    this.checkAchievements();
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
        this.lifetimeLoot += 1;
        this.addLog(`${target.name} equips ${item.getName()}!`);
        if (old) this.disposeItem(old);
      } else {
        this.earnGold(item.sellValue);
        this.lifetimeSold += 1;
        this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
      }
    }
    this.lootPool = [];
    for (const char of this.party.team) char.recomputeSetBonuses();
    this._lootCache = null;
    this.partyVersion++;
    this.checkAchievements();
    return this.respond();
  }

  /** Sells every item in the loot pool. Returns serialized JSON. */
  sellAll(): string {
    const count = this.lootPool.length;
    for (const item of this.lootPool) {
      this.earnGold(item.sellValue);
      this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
    }
    this.lootPool = [];
    this.lifetimeSold += count;
    this._lootCache = null;
    this.checkAchievements();
    return this.respond();
  }

  /** Sells the loot item at the given pool index for its sell value. Returns serialized JSON. */
  sellLoot(idx: number): string {
    if (idx < 0 || idx >= this.lootPool.length) return this.respond();
    const item = this.lootPool.splice(idx, 1)[0];
    const isDivine = item.quality === "divine";
    this.earnGold(item.sellValue);
    this.lifetimeSold += 1;
    this._lootCache = null;
    this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
    if (isDivine) this.lifetimeDivineSold = 1;
    this.checkAchievements();
    return this.respond();
  }

  /** Equips an artifact instance from the inventory into a character's artifact slot. Displaced instance returns to inventory. */
  equipArtifact(charIdx: number, slotIdx: number, invIdx: number): string {
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    if (slotIdx < 0 || slotIdx >= 3) return this.respond();
    if (invIdx < 0 || invIdx >= this.artifactInventory.length) return this.respond();
    const existing = char.artifactSlots[slotIdx];
    const instance = this.artifactInventory.splice(invIdx, 1)[0];
    char.artifactSlots[slotIdx] = instance;
    if (existing) this.artifactInventory.push(existing);
    this._artifactInvCache = null;
    this.partyVersion++;
    const label = instance.level > 0 ? `${ARTIFACT_DEFS[instance.id].name} +${instance.level}` : ARTIFACT_DEFS[instance.id].name;
    this.addLog(`${char.name} equips ${label}!`);
    return this.respond();
  }

  /** Unequips an artifact instance from a character's slot back into the shared inventory. */
  unequipArtifact(charIdx: number, slotIdx: number): string {
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    if (slotIdx < 0 || slotIdx >= 3) return this.respond();
    const instance = char.artifactSlots[slotIdx];
    if (!instance) return this.respond();
    char.artifactSlots[slotIdx] = null;
    this.artifactInventory.push(instance);
    this._artifactInvCache = null;
    this.partyVersion++;
    this.addLog(`${char.name} unequips ${ARTIFACT_DEFS[instance.id].name}.`);
    return this.respond();
  }

  private fuelArtifact(target: ArtifactInstance, fuelInvIdxs: number[], excludeIdx: number): boolean {
    const valid = fuelInvIdxs.every(
      fi => fi !== excludeIdx && fi >= 0 && fi < this.artifactInventory.length && this.artifactInventory[fi].id === target.id
    );
    if (!valid) return false;
    const totalUnits = fuelInvIdxs.reduce((sum, fi) => sum + artifactFuelValue(this.artifactInventory[fi].level), 0);
    // Remove fuel from highest index first to avoid index shifting
    for (const fi of [...fuelInvIdxs].sort((a, b) => b - a)) this.artifactInventory.splice(fi, 1);
    target.fuel += totalUnits;
    while (target.fuel >= artifactUpgradeCost(target.level)) {
      target.fuel -= artifactUpgradeCost(target.level);
      target.level += 1;
      this.addLog(`✨ ${ARTIFACT_DEFS[target.id].name} leveled up to +${target.level}!`);
    }
    return true;
  }

  /** Adds fuel from inventory artifacts to a target inventory artifact; levels up on threshold with overflow cascade. */
  addFuelToArtifact(targetInvIdx: number, fuelInvIdxs: number[]): string {
    if (targetInvIdx < 0 || targetInvIdx >= this.artifactInventory.length) return this.respond();
    this.fuelArtifact(this.artifactInventory[targetInvIdx], fuelInvIdxs, targetInvIdx);
    this._artifactInvCache = null;
    return this.respond();
  }

  /** Adds fuel from inventory artifacts to an equipped artifact; levels up on threshold with overflow cascade. */
  addFuelToEquippedArtifact(charIdx: number, slotIdx: number, fuelInvIdxs: number[]): string {
    const char = this.party.team[charIdx];
    if (!char || slotIdx < 0 || slotIdx >= 3) return this.respond();
    const target = char.artifactSlots[slotIdx];
    if (!target) return this.respond();
    this.fuelArtifact(target, fuelInvIdxs, -1);
    this._artifactInvCache = null;
    this.partyVersion++;
    return this.respond();
  }

  /** Sells an equipped artifact directly from a character slot, granting gold. */
  private sellArtifactInstance(inst: ArtifactInstance): void {
    const value = artifactSellValue(inst.id, inst.level);
    this.earnGold(value);
    this.addLog(`Sold ${ARTIFACT_DEFS[inst.id].name}${inst.level > 0 ? ` +${inst.level}` : ""} for ${value}g.`);
  }

  sellEquippedArtifact(charIdx: number, slotIdx: number): string {
    const char = this.party.team[charIdx];
    if (!char || slotIdx < 0 || slotIdx >= 3) return this.respond();
    const inst = char.artifactSlots[slotIdx];
    if (!inst) return this.respond();
    char.artifactSlots[slotIdx] = null;
    this.sellArtifactInstance(inst);
    this.partyVersion++;
    return this.respond();
  }

  /** Sells an artifact instance from the inventory for gold (sell value scales with level). */
  sellArtifact(invIdx: number): string {
    if (invIdx < 0 || invIdx >= this.artifactInventory.length) return this.respond();
    this.sellArtifactInstance(this.artifactInventory.splice(invIdx, 1)[0]);
    this._artifactInvCache = null;
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
    this.lifetimeUpgradesBought += 1;
    const char = this.party.team.find((c) => c.name === charName);
    if (!char) return this.respond();
    applyUpgradeStatEffect(char, ut);
    this._upgradesCache = null;
    this.partyVersion++;
    this.addLog(`${charName}: ${ut} upgraded!`);
    return this.respond();
  }

  /** Attack multiplier applied to boss/elite after BOSS_ENRAGE_TRIGGER seconds. */
  get bossEnrageMult(): number {
    if (this.bossEncounterTime < BOSS_ENRAGE_TRIGGER) return 1.0;
    const stacks = Math.floor((this.bossEncounterTime - BOSS_ENRAGE_TRIGGER) / BOSS_ENRAGE_STEP) + 1;
    return 1.5 ** stacks;
  }

  /** Calculates how many prestige points the player would earn if they prestiged right now. */
  prestigePointsPreview(): number {
    return 1 + Math.floor(Math.max(0, this.highestLevel - PRESTIGE_UNLOCK_LEVEL) / 5);
  }

  /** Advances to the next dungeon, leaving companions behind as idle earners. Returns serialized JSON. */
  venture(): string {
    if (this.highestLevel < ventureUnlockLevel(this.dungeonIndex)) return this.respond();

    const companions = this.party.team.slice(1);
    this.idleGoldRate += companions.reduce((sum, c) => sum + this.effectiveDps(c), 0) * IDLE_GOLD_RATE;

    this.dungeonIndex += 1;
    this.prestigePoints = 0;
    // Reset all prestige upgrades except guild_hall_access (keep the gateway unlock)
    const hadGuildHall = (this.prestigeUpgrades["guild_hall_access"] ?? 0) > 0;
    this.prestigeUpgrades = {};
    if (hadGuildHall) this.prestigeUpgrades["guild_hall_access"] = 1;
    this.autoSellQualities = [];
    this.skillCooldowns = {};
    this.activeEffects = {};

    const leadName = this.party.team[0].name;
    const leadClass = this.party.team[0].characterClass;
    const newLead = new Character(leadName, leadClass, 1);

    this.party.team = [newLead];
    this.upgrades = { [leadName]: { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 } };
    this.lifetimeBestLevel = Math.max(this.lifetimeBestLevel, this.highestLevel);
    this.gold = 0;
    this.dungeonLevel = 1;
    this.kills = 0;
    this.floorKills = 0;
    this.deaths = 0;
    this.highestLevel = 1;
    this.checkpointLevel = 1;
    this.deathFloors = {};
    this.lootPool = [];
    this.gearStash = [];
    this.log = [];
    this.enemy = generateEnemy(1, this.dungeonIndex);
    this._lootCache = null;
    this._stashCache = null;
    this._upgradesCache = null;
    this.partyVersion++;

    const shardsEarned = Math.floor(this.totalPrestiges / 10);
    if (shardsEarned > 0) {
      this.constellationShards += shardsEarned;
      this.addLog(`✦ +${shardsEarned} soul shard${shardsEarned !== 1 ? "s" : ""} from constellation reward!`);
    }
    this.addLog(`Ventured to dungeon ${this.dungeonIndex + 1}! Total idle: ${this.idleGoldRate.toFixed(1)} gold/sec.`);
    return this.respond();
  }

  /** Unlocks a constellation node if adjacent (or a start node) and shards are sufficient. */
  unlockConstellationNode(nodeId: string): string {
    const def = CONSTELLATION_NODE_DEFS[nodeId];
    if (!def) return this.respond();
    if (this.unlockedConstellationNodes.has(nodeId)) return this.respond();
    const isAccessible = def.isStart ||
      def.connections.some(c => this.unlockedConstellationNodes.has(c));
    if (!isAccessible) return this.respond();
    if (this.constellationShards < def.cost) return this.respond();
    this.constellationShards -= def.cost;
    this.unlockedConstellationNodes.add(nodeId);
    this._cbCache = null;
    return this.respond();
  }

  /** Resets all constellation nodes, refunding shards minus a 10-shard fee. */
  respecConstellation(): string {
    if (this.constellationShards < 10) return this.respond();
    const spent = [...this.unlockedConstellationNodes].reduce(
      (sum, id) => sum + (CONSTELLATION_NODE_DEFS[id]?.cost ?? 0), 0
    );
    this.constellationShards += spent - 10;
    this.unlockedConstellationNodes.clear();
    this._cbCache = null;
    return this.respond();
  }

  /** Applies the Last Stand effect for any hero at 0 HP if the keystone is active and not yet used this floor. */
  applyLastStandIfActive(): void {
    const cb = this.constellationBonuses;
    if (!cb.lastStandActive || this.lastStandUsedThisFloor) return;
    for (const c of this.party.team) {
      if (c.health <= 0) {
        c.health = 1;
        this.lastStandUsedThisFloor = true;
        this.addLog(`✦ Last Stand! ${c.name} survives at 1 HP!`);
        return;
      }
    }
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

    // Preserve socketed runes, locked slots, and artifact slots — re-applied after new characters are created
    const savedRunes = new Map(this.party.team.map(c => [c.name, { ...c.runes }]));
    const savedLockedSlots = new Map(this.party.team.map(c => [c.name, new Set(c.lockedSlots)]));
    const savedArtifactSlots = new Map(this.party.team.map(c => [c.name, [...c.artifactSlots]]));
    const savedArtifactInventory = [...this.artifactInventory];

    this.dungeonLevel = 1;
    this.kills = 0;
    this.floorKills = 0;
    this.deaths = 0;
    this.highestLevel = 1;
    this.checkpointLevel = 1;
    this.autoSellQualities = [];
    this.lootPool = [];
    this.log = [];
    this.deathFloors = {};
    this.enemy = generateEnemy(1, this.dungeonIndex);
    this.skillCooldowns = {};
    this.activeEffects = {};

    this.party.team = [];
    this.upgrades = {};
    const lead = new Character(leadName, leadClass, 1);
    this.party.addPlayer(lead);
    this.upgrades[leadName] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
    this._lootCache = null;
    this._upgradesCache = null;
    this.partyVersion++;

    for (let slot = 2; slot <= 6; slot++) {
      if ((this.prestigeUpgrades[`party_slot_${slot}`] ?? 0) > 0) {
        const cls = this.prestigePartyClasses[`slot_${slot}`] ?? "fighter";
        const n = companionName(cls, slot - 2);
        this.party.addPlayer(new Character(n, cls, 1));
        this.upgrades[n] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
      }
    }

    const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
    for (const c of this.party.team) {
      c.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
      const runes = savedRunes.get(c.name) ?? {};
      for (const [slot, rune] of Object.entries(runes)) {
        if (rune) c.applyRune(slot as Slot, rune);
      }
      const locked = savedLockedSlots.get(c.name);
      if (locked) c.lockedSlots = locked;
      const slots = savedArtifactSlots.get(c.name);
      if (slots) c.artifactSlots = slots;
    }
    this.artifactInventory = savedArtifactInventory;

    this.gold = startingGoldForLevel(this.prestigeUpgrades["starting_gold"] ?? 0);

    this.addLog(`Returned to town (run ${this.totalPrestiges})! Earned ${earned} renown.`);
    this.checkAchievements();
    return this.respond();
  }

  /** Hard-resets all progress and records the lead hero in the Hall of Fame. Requires dungeonIndex >= 1. */
  retireHero(): string {
    if (this.dungeonIndex < 1) return this.respond();

    const lead = this.party.team[0];
    const score = lead.level + this.dungeonIndex * 100 + this.totalPrestiges * 25;
    const hero: RetiredHero = {
      name: lead.name,
      characterClass: lead.characterClass,
      level: lead.level,
      highestFloor: Math.max(this.lifetimeBestLevel, this.highestLevel),
      dungeonIndex: this.dungeonIndex,
      prestigeCount: this.totalPrestiges,
      score,
      retiredOn: new Date().toISOString().slice(0, 10),
    };
    this.retiredHeroes.push(hero);
    this.retirementCount += 1;

    // Accumulate lifetime counters before wipe
    this.lifetimeKills += this.kills;
    this.lifetimeDeaths += this.deaths;
    this.lifetimeBestLevel = Math.max(this.lifetimeBestLevel, this.highestLevel);

    // Apply legacy unlocks for this retirement milestone
    const unlock = LEGACY_UNLOCKS[this.retirementCount];
    if (unlock) {
      for (const cls of unlock.classes) this.unlockedHeroClasses.add(cls);
      this.legacyTitles.add(unlock.title);
      this._titlesCache = null;
      if (unlock.avatar) this.earnedAvatars.add(unlock.avatar);
      if (unlock.border) this.earnedBorders.add(unlock.border);
    }

    // Preserve account-wide constellation access across retirement
    const savedConstellationAccess = this.guildUpgrades["constellation_access"] ?? 0;

    // Hard reset — wipe everything except permanents
    this.kills = 0;
    this.deaths = 0;
    this.dungeonLevel = 1;
    this.highestLevel = 1;
    this.floorKills = 0;
    this.checkpointLevel = 1;
    this.gold = 0;
    this.lootPool = [];
    this.log = [];
    this.deathFloors = {};
    this.dungeonIndex = 0;
    this.idleGoldRate = 0;
    this.prestigePoints = 0;
    this.totalPrestiges = 0;
    this.prestigeUpgrades = {};
    this.prestigePartyClasses = {};
    this.guildUpgrades = savedConstellationAccess > 0 ? { constellation_access: savedConstellationAccess } : {};
    this.runeInventory = [];
    this.artifactInventory = [];
    this.gearStash = [];
    this.autoSellQualities = [];
    this.autoEquipEnabled = true;
    this.autoSellEnabled = true;
    this.autoUpgradeEnabled = true;
    this.skillCooldowns = {};
    this.activeEffects = {};
    this.killStreak = 0;
    this.bossEncounterTime = 0;
    this.party.team = [];
    this.upgrades = {};

    // Mark that a new hero must be created before gameplay resumes
    this.needsHeroCreation = true;
    this.enemy = generateEnemy(1, 0);
    this._lootCache = null;
    this._stashCache = null;
    this._artifactInvCache = null;
    this._upgradesCache = null;
    this.partyVersion++;

    return this.respond();
  }

  /** Creates a new hero after a retirement reset, clearing the needs_hero_creation flag. */
  createHeroAfterRetirement(name: string, characterClass: string): string {
    if (!this.needsHeroCreation) return this.respond();
    this.party.team = [];
    this.upgrades = {};
    const hero = new Character(name, characterClass, 1);
    this.party.addPlayer(hero);
    this.upgrades[name] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
    this.needsHeroCreation = false;
    this.enemy = generateEnemy(1, 0);
    this._upgradesCache = null;
    this.partyVersion++;
    this.addLog(`Welcome, ${name} the ${characterClass}!`);
    return this.respond();
  }

  /** Purchases a Prestige Shop item, optionally specifying the companion's class for slot unlocks. Returns serialized JSON. */
  buyPrestigeUpgrade(type: string, characterClass?: string): string {
    if (!(type in PRESTIGE_SHOP_COSTS)) return this.respond();
    if (this.dungeonIndex < (PRESTIGE_DUNGEON_REQ[type] ?? 0)) return this.respond();
    if (type === "smart_seller" && !(this.prestigeUpgrades["auto_seller"] > 0)) return this.respond();
    if (type === "party_slot_3" && !(this.prestigeUpgrades["party_slot_2"] > 0)) return this.respond();
    if (type === "party_slot_4") {
      if (!(this.prestigeUpgrades["party_slot_3"] > 0)) return this.respond();
      if (!((this.guildUpgrades["companion_hall"] ?? 0) >= 1)) return this.respond();
    }
    if (type === "party_slot_5") {
      if (!(this.prestigeUpgrades["party_slot_4"] > 0)) return this.respond();
      if (!((this.guildUpgrades["companion_hall"] ?? 0) >= 2)) return this.respond();
    }
    if (type === "party_slot_6") {
      if (!(this.prestigeUpgrades["party_slot_5"] > 0)) return this.respond();
      if (!((this.guildUpgrades["companion_hall"] ?? 0) >= 3)) return this.respond();
    }
    const oneTime = ["guild_hall_access", "auto_seller", "auto_equip", "auto_upgrade", "smart_seller", "party_slot_2", "party_slot_3", "party_slot_4", "party_slot_5", "party_slot_6"];
    if (oneTime.includes(type) && (this.prestigeUpgrades[type] ?? 0) >= 1) return this.respond();
    if (type === "stash" && (this.prestigeUpgrades["stash"] ?? 0) >= STASH_TIER_COSTS.length) return this.respond();
    const currentStacks = this.prestigeUpgrades[type] ?? 0;
    const cost = prestigeUpgradeCost(type, currentStacks);
    if (this.prestigePoints < cost) {
      this.addLog("Not enough renown!");
      return this.respond();
    }
    this.prestigePoints -= cost;
    this.prestigeUpgrades[type] = (this.prestigeUpgrades[type] ?? 0) + 1;

    const slotMatch = /^party_slot_([2-6])$/.exec(type);
    if (slotMatch) {
      const slot = parseInt(slotMatch[1], 10);
      const cls = characterClass ?? "fighter";
      this.prestigePartyClasses[`slot_${slot}`] = cls;
      const n = companionName(cls, slot - 2);
      const comp = new Character(n, cls, 1);
      this.party.addPlayer(comp);
      this.upgrades[n] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
      comp.xpMultiplier += XP_BONUS_PER_LEVEL * (this.prestigeUpgrades["xp_bonus"] ?? 0);
      this._upgradesCache = null;
      this.partyVersion++;
    } else if (type === "xp_bonus") {
      for (const c of this.party.team) {
        c.xpMultiplier += XP_BONUS_PER_LEVEL;
      }
    } else if (type === "starting_gold") {
      const lvl = this.prestigeUpgrades["starting_gold"] ?? 0;
      this.gold += startingGoldForLevel(lvl) - startingGoldForLevel(lvl - 1);
    }

    this.addLog(`Hall of Renown: ${type} purchased!`);
    if (type === "auto_seller") this.runAutoSeller();
    if (type === "auto_equip") this.runAutoEquip();
    if (type === "auto_upgrade") this.runAutoUpgrade();
    if (type === "smart_seller") this.syncSmartSeller();
    this.checkAchievements();
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
    if (this.dungeonIndex < (GUILD_HALL_DUNGEON_REQ[type] ?? 0)) return this.respond();
    const prereq = GUILD_HALL_PREREQS[type];
    if (prereq && !(this.guildUpgrades[prereq] ?? 0)) return this.respond();
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
    this.checkAchievements();
    return this.respond();
  }

  /** Sockets a rune from the inventory into a character's gear slot. Requires Rune Forge ≥ 1.
   *  Tier 1: old rune is destroyed. Tier 2+: old rune is returned to inventory. Returns serialized JSON. */
  brandRune(charIdx: number, slot: Slot, runeId: string): string {
    if ((this.guildUpgrades["rune_forge"] ?? 0) < 1) return this.respond();
    const inventoryIdx = this.runeInventory.findIndex(r => r.id === runeId);
    if (inventoryIdx === -1) return this.respond();
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    const rune = this.runeInventory.splice(inventoryIdx, 1)[0];
    const old = char.applyRune(slot, rune);
    if (old && (this.guildUpgrades["rune_forge"] ?? 0) >= 2) {
      this.runeInventory.push(old);
    }
    this.partyVersion++;
    return this.respond();
  }

  /** Removes the rune from the given slot and returns it to the inventory. */
  unbrandRune(charIdx: number, slot: Slot): string {
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    const old = char.removeRune(slot);
    if (old) this.runeInventory.push(old);
    this.partyVersion++;
    return this.respond();
  }

  /** Combines two lesser runes of the same type into a greater rune. Requires Rune Forge Tier 3. Returns serialized JSON. */
  combineRunes(runeId1: string, runeId2: string): string {
    const forge = this.guildUpgrades["rune_forge"] ?? 0;
    if (forge < 2) return this.respond();
    const def1 = RUNE_DEFS[runeId1];
    const def2 = RUNE_DEFS[runeId2];
    if (!def1 || !def2 || def1.type !== def2.type || def1.tier !== def2.tier) return this.respond();
    const nextTier = RUNE_TIER_UP[def1.tier];
    if (!nextTier) return this.respond(); // ancient cannot be combined
    // Forge 2: lesser→greater. Forge 3: greater→flawless. Forge 4: flawless→ancient.
    if (def1.tier === "flawless" && forge < 4) return this.respond();
    if (def1.tier === "greater"  && forge < 3) return this.respond();
    const idx1 = this.runeInventory.findIndex(r => r.id === runeId1);
    if (idx1 === -1) return this.respond();
    const remaining = [...this.runeInventory];
    remaining.splice(idx1, 1);
    const idx2 = remaining.findIndex(r => r.id === runeId2);
    if (idx2 === -1) return this.respond();
    remaining.splice(idx2, 1);
    const nextId = `${def1.type}_${nextTier}`;
    const next = RUNE_DEFS[nextId];
    if (!next) return this.respond();
    this.runeInventory = remaining;
    this.runeInventory.push(next);
    this.lifetimeRunesCombined += 1;
    return this.respond();
  }

  /** Combines all combinable pairs in the inventory (lesser→greater→flawless→ancient), cascading.
   *  Requires prestige upgrade combine_all_runes and rune_forge ≥ 2. */
  combineAllRunes(): string {
    if (!(this.prestigeUpgrades["combine_all_runes"] ?? 0)) return this.respond();
    const forge = this.guildUpgrades["rune_forge"] ?? 0;
    if (forge < 2) return this.respond();
    const tiersAllowed = ["lesser"];
    if (forge >= 3) tiersAllowed.push("greater");
    if (forge >= 4) tiersAllowed.push("flawless");
    let combined = 0;
    for (const tier of tiersAllowed) {
      let changed = true;
      while (changed) {
        changed = false;
        const types = [...new Set(this.runeInventory.filter(r => r.tier === tier).map(r => r.type))];
        for (const type of types) {
          const idxs = this.runeInventory.reduce<number[]>((acc, r, i) => {
            if (r.tier === tier && r.type === type) acc.push(i);
            return acc;
          }, []);
          if (idxs.length >= 2) {
            this.runeInventory.splice(idxs[1], 1);
            this.runeInventory.splice(idxs[0], 1);
            this.runeInventory.push(RUNE_DEFS[`${type}_${RUNE_TIER_UP[tier]}`]);
            this.lifetimeRunesCombined++;
            combined++;
            changed = true;
          }
        }
      }
    }
    if (combined > 0) this.addLog(`Combined ${combined} rune pair${combined === 1 ? "" : "s"}.`);
    return this.respond();
  }

  /** Sells the rune at the given inventory index for its tier's gold value. Returns serialized JSON. */
  sellRune(idx: number): string {
    if (idx < 0 || idx >= this.runeInventory.length) return this.respond();
    const rune = this.runeInventory.splice(idx, 1)[0];
    const gold = RUNE_SELL_VALUES[rune.tier] ?? 0;
    this.lifetimeRunesSold += 1;
    this.earnGold(gold);
    this.addLog(`Sold ${rune.name} for ${gold}g.`);
    return this.respond();
  }

  /** Consumes 10 ancient runes (any types) and adds one random base artifact. */
  forgeArtifactFromRunes(): string {
    const ancientIdxs: number[] = [];
    for (let i = 0; i < this.runeInventory.length && ancientIdxs.length < 10; i++) {
      if (this.runeInventory[i].tier === "ancient") ancientIdxs.push(i);
    }
    if (ancientIdxs.length < 10) return this.respond();
    for (let i = ancientIdxs.length - 1; i >= 0; i--) this.runeInventory.splice(ancientIdxs[i], 1);
    const id = ARTIFACT_DROP_POOL[Math.floor(Math.random() * ARTIFACT_DROP_POOL.length)];
    this.artifactInventory.push({ id, level: 0, fuel: 0 });
    this.addLog(`Forged ${ARTIFACT_DEFS[id]?.name ?? id} from 10 ancient runes!`);
    return this.respond();
  }

  /** Sells all runes in the inventory. Returns serialized JSON. */
  sellAllRunes(): string {
    if (this.runeInventory.length === 0) return this.respond();
    let total = 0;
    for (const rune of this.runeInventory) total += RUNE_SELL_VALUES[rune.tier] ?? 0;
    this.lifetimeRunesSold += this.runeInventory.length;
    this.runeInventory = [];
    this.earnGold(total);
    this.addLog(`Sold all runes for ${total}g.`);
    return this.respond();
  }

  /** Sets the active avatar if it has been earned. Returns serialized JSON. */
  setAvatar(id: string): string {
    if (this.earnedAvatars.has(id)) this.selectedAvatar = id;
    return this.respond();
  }

  /** Sets the active border if it has been earned. Returns serialized JSON. */
  setBorder(id: string): string {
    if (this.earnedBorders.has(id)) this.selectedBorder = id;
    return this.respond();
  }

  /** Activates a purchased combat skill for the lead character if off cooldown. Returns serialized JSON. */
  private doActivateSkill(skillId: string): boolean {
    if (!((this.guildUpgrades[skillId] ?? 0) > 0)) return false;
    const def = SKILL_DEFS[skillId];
    if (!def) return false;
    const caster = this.party.team.find(c => c.characterClass === def.class);
    if (!caster) return false;
    if ((this.skillCooldowns[skillId] ?? 0) > 0) return false;
    this.skillCooldowns[skillId] = def.cooldownKills;
    if (def.durationKills > 0) this.activeEffects[skillId] = def.durationKills;
    this.lifetimeSkillActivations += 1;
    this.addLog(`${caster.name} uses ${skillId.replace("skill_", "").replace(/_/g, " ")}!`);
    if (skillId === "skill_consecrate") {
      for (const c of this.party.team) {
        if (c.isAlive()) c.health = Math.min(c.maxHealth, c.health + c.maxHealth * 0.50);
      }
      this.addLog(`Holy light surges — party healed 50% max HP!`);
    }
    return true;
  }

  activateSkill(skillId: string): string {
    this.doActivateSkill(skillId);
    return this.respond();
  }

  /** Returns the skill id available to the lead character's class, or null if none is purchased. */
  private computeSkillAvailable(): string | null {
    if (this.party.team.length === 0) return null;
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

  /** Toggles the auto-skill cycling on or off. Returns serialized JSON. */
  toggleAutoSkill(): string {
    this.autoSkillEnabled = !this.autoSkillEnabled;
    return this.respond();
  }

  /** Toggles auto-prestige and sets the minimum preview threshold. Returns serialized JSON. */
  setAutoPrestige(enabled: boolean, threshold: number): string {
    this.autoPrestigeEnabled = enabled;
    this.autoPrestigeThreshold = Math.max(1, threshold);
    return this.respond();
  }

  /** Serializes the current game state to a JSON string for the renderer. */
  respond(): string {
    const dict = this.toDict();
    this._stateCache = dict;
    this._lastJson = JSON.stringify(dict);
    this.pendingAchievements = [];
    return this._lastJson;
  }

  /** Returns the last JSON string produced by respond(), for use by save routines without re-serializing. */
  getLastJson(): string { return this._lastJson; }

  /** Returns the GameStateDict from the most recent respond() call, or recomputes if needed. */
  getState(): GameStateDict {
    return this._stateCache ?? this.toDict();
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
        is_elite: this.enemy.isElite,
      },
      party: this.party.team.map((c) => c.toDict()),
      loot_pool: (this._lootCache !== null && this._lootCache.length === this.lootPool.length ? this._lootCache : (this._lootCache = this.lootPool.map((i) => i.toDict()))),
      upgrades: (this._upgradesCache ??= Object.fromEntries(
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
      )),
      log: this.log,
      prestige_points: this.prestigePoints,
      lifetime_kills: this.lifetimeKills + this.kills,
      lifetime_deaths: this.lifetimeDeaths + this.deaths,
      lifetime_best_level: Math.max(this.lifetimeBestLevel, this.highestLevel),
      lifetime_enemy_kills: this.lifetimeEnemyKills,
      total_prestiges: this.totalPrestiges,
      prestige_upgrades: { ...this.prestigeUpgrades },
      prestige_party_classes: { ...this.prestigePartyClasses },
      prestige_available: this.highestLevel >= PRESTIGE_UNLOCK_LEVEL,
      prestige_points_preview: this.highestLevel >= PRESTIGE_UNLOCK_LEVEL
        ? this.prestigePointsPreview()
        : 0,
      checkpoint_level: this.checkpointLevel,
      auto_sell_qualities: [...this.autoSellQualities],
      auto_equip_enabled: this.autoEquipEnabled,
      auto_sell_enabled: this.autoSellEnabled,
      auto_upgrade_enabled: this.autoUpgradeEnabled,
      floor_kills: this.floorKills,
      dungeon_index: this.dungeonIndex,
      idle_gold_rate: this.idleGoldRate,
      venture_available: this.highestLevel >= ventureUnlockLevel(this.dungeonIndex),
      guild_upgrades: { ...this.guildUpgrades },
      death_floors: { ...this.deathFloors },
      skill_available: this.computeSkillAvailable(),
      companion_skills_available: this.computeCompanionSkillsAvailable(),
      skill_cooldowns: { ...this.skillCooldowns },
      active_effects: { ...this.activeEffects },
      run_id: this.runId,
      loot_max: this.lootMax,
      saved_at: Date.now(),
      achievements_unlocked: (this._achievementsListCache ??= [...this.achievementsUnlocked]),
      earned_title: this.earnedTitle,
      lifetime_gold: this.lifetimeGold,
      lifetime_loot: this.lifetimeLoot,
      lifetime_sold: this.lifetimeSold,
      lifetime_boss_kills: this.lifetimeBossKills,
      lifetime_legendary: this.lifetimeLegendary,
      lifetime_divine: this.lifetimeDivine,
      lifetime_divine_sold: this.lifetimeDivineSold,
      lifetime_elite_kills: this.lifetimeEliteKills,
      lifetime_runes_sold: this.lifetimeRunesSold,
      lifetime_runes_combined: this.lifetimeRunesCombined,
      lifetime_skill_activations: this.lifetimeSkillActivations,
      lifetime_upgrades_bought: this.lifetimeUpgradesBought,
      pending_achievements: this.pendingAchievements,
      rune_inventory: this.runeInventory,
      earned_titles: (this._titlesCache ??= this.computeEarnedTitles()),
      gear_stash: (this._stashCache !== null && this._stashCache.length === this.gearStash.length ? this._stashCache : (this._stashCache = this.gearStash.map(i => i.toDict()))),
      artifact_inventory: (this._artifactInvCache !== null && this._artifactInvCache.length === this.artifactInventory.length ? this._artifactInvCache : (this._artifactInvCache = this.artifactInventory.map(a => ({ id: a.id as ArtifactEffectId, level: a.level, fuel: a.fuel })))),
      kill_streak: this.killStreak,
      lifetime_best_kill_streak: this.lifetimeBestKillStreak,
      earned_avatars: [...this.earnedAvatars],
      earned_borders: [...this.earnedBorders],
      selected_avatar: this.selectedAvatar,
      selected_border: this.selectedBorder,
      lifetime_clicks: this.lifetimeClicks,
      achievement_progress: (() => {
        const now = Date.now();
        if (now - this._achCacheTime > 1000) {
          this._achCache = Object.fromEntries(ACHIEVEMENTS.map(def => [def.id, def.getValue(this)]));
          this._achCacheTime = now;
        }
        return this._achCache;
      })(),
      achievement_progress_ts: this._achCacheTime,
      auto_prestige_enabled: this.autoPrestigeEnabled,
      auto_prestige_threshold: this.autoPrestigeThreshold,
      auto_skill_enabled: this.autoSkillEnabled,
      all_skills_unlocked: Object.keys(SKILL_DEFS).every(id => (this.guildUpgrades[id] ?? 0) > 0),
      boss_enrage_time: this.bossEncounterTime,
      boss_enrage_mult: this.bossEnrageMult,
      retired_heroes: [...this.retiredHeroes],
      retirement_count: this.retirementCount,
      unlocked_hero_classes: [...this.unlockedHeroClasses],
      legacy_titles: [...this.legacyTitles],
      needs_hero_creation: this.needsHeroCreation,
      constellation_shards: this.constellationShards,
      constellation_nodes: [...this.unlockedConstellationNodes],
      party_version: this.partyVersion,
    };
  }

  private computeEarnedTitles(): string[] {
    const titles: string[] = [];
    for (const def of ACHIEVEMENTS) {
      if (def.tiers) {
        for (const tier of def.tiers) {
          if (tier.reward?.type === "title" && tier.reward.title && this.achievementsUnlocked.has(`${def.id}_${tier.label}`)) {
            titles.push(tier.reward.title);
          }
        }
      } else if (def.reward?.type === "title" && def.reward.title && this.achievementsUnlocked.has(def.id)) {
        titles.push(def.reward.title);
      }
    }
    for (const t of this.legacyTitles) titles.push(t);
    return titles;
  }

  /** Sets the displayed title to any title the player has already earned, or resets to "nobody". */
  setEarnedTitle(title: string): string {
    const resolved = title === "" ? "nobody" : title;
    if (resolved === "nobody" || this.computeEarnedTitles().includes(resolved) || this.legacyTitles.has(resolved)) {
      this.earnedTitle = resolved;
    }
    return this.respond();
  }

  /** Adds gold to balance and to the lifetime-gold counter. Use this everywhere gold is earned. */
  earnGold(amount: number): void {
    this.gold += amount;
    this.lifetimeGold += amount;
  }

  /** Applies a single achievement reward to this game state. */
  private applyReward(reward?: AchievementReward): void {
    if (!reward) return;
    if (reward.type === "gold" && reward.value) this.earnGold(reward.value);
    else if (reward.type === "prestige_points" && reward.value) this.prestigePoints += reward.value;
    else if (reward.type === "title" && reward.title) this.earnedTitle = reward.title;
    else if (reward.type === "avatar" && reward.cosmetic) this.earnedAvatars.add(reward.cosmetic);
    else if (reward.type === "border" && reward.cosmetic) this.earnedBorders.add(reward.cosmetic);
  }

  /** Checks all achievements against current state; awards any newly crossed thresholds. Returns newly unlocked achievements (also queued to pendingAchievements for toast display). */
  checkAchievements(): AchievementUnlock[] {
    const newly: AchievementUnlock[] = [];
    let unlockedSomething = false;
    for (const def of ACHIEVEMENTS) {
      const val = def.getValue(this);
      if (def.tiers) {
        for (const tier of def.tiers) {
          const key = `${def.id}_${tier.label}`;
          if (!this.achievementsUnlocked.has(key) && val >= tier.threshold) {
            const hadAnyTier = def.tiers.some(t2 => this.achievementsUnlocked.has(`${def.id}_${t2.label}`));
            this.achievementsUnlocked.add(key);
            this.applyReward(tier.reward);
            unlockedSomething = true;
            const unlock: AchievementUnlock = { id: def.id, tier: tier.label, name: def.name, reward: tier.reward, wasHidden: def.hidden && !hadAnyTier };
            newly.push(unlock);
            this.pendingAchievements.push(unlock);
          }
        }
      } else {
        if (!this.achievementsUnlocked.has(def.id) && val >= 1) {
          this.achievementsUnlocked.add(def.id);
          this.applyReward(def.reward);
          unlockedSomething = true;
          const unlock: AchievementUnlock = { id: def.id, name: def.name, reward: def.reward, wasHidden: def.hidden };
          newly.push(unlock);
          this.pendingAchievements.push(unlock);
        }
      }
    }
    if (unlockedSomething) {
      this._titlesCache = null;
      this._achievementsListCache = null;
    }
    return newly;
  }

  /** Awards idle gold for time spent offline, capped at OFFLINE_GOLD_CAP_SECONDS. Returns gold earned. */
  applyOfflineProgress(elapsedMs: number): number {
    if (elapsedMs <= 0 || this.idleGoldRate <= 0) return 0;
    const elapsedSec = Math.min(elapsedMs / 1000, OFFLINE_GOLD_CAP_SECONDS);
    const earned = this.idleGoldRate * elapsedSec;
    this.gold += earned;
    return earned;
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

  private spawnNextEnemy(): Enemy {
    if (Math.random() < ELITE_SPAWN_CHANCE) {
      const elite = generateEliteEnemy(this.dungeonLevel, this.dungeonIndex);
      this.addLog(`⚡ An Elite ${elite.name.replace("Elite ", "")} appears!`);
      return elite;
    }
    return generateEnemy(this.dungeonLevel, this.dungeonIndex);
  }

  /** Handles enemy defeat: awards XP/gold/loot, applies pending party abilities, and advances the floor. */
  onEnemyDeath(): void {
    this.bossEncounterTime = 0;
    for (const key of Object.keys(this.activeEffects)) {
      this.activeEffects[key] -= 1;
      if (this.activeEffects[key] <= 0) delete this.activeEffects[key];
    }
    for (const key of Object.keys(this.skillCooldowns)) {
      this.skillCooldowns[key] -= 1;
      if (this.skillCooldowns[key] <= 0) delete this.skillCooldowns[key];
    }
    if (this.autoSkillEnabled) {
      const owned = Object.keys(SKILL_DEFS).filter(id => (this.guildUpgrades[id] ?? 0) > 0);
      const n = owned.length;
      for (let i = 0; i < n; i++) {
        const idx = (this.skillCycleIdx + i) % n;
        if (this.doActivateSkill(owned[idx])) {
          this.skillCycleIdx = (idx + 1) % n;
          break;
        }
      }
    }
    const name = this.enemy.name;
    this.lifetimeEnemyKills[name] = (this.lifetimeEnemyKills[name] ?? 0) + 1;
    if (this.enemy.isElite) this.lifetimeEliteKills += 1;
    const xp = this.enemy.xp_reward;
    this.addLog(`${name} defeated! +${xp}xp`);
    const xpCb = this.constellationBonuses;
    const constellationXpMult = xpCb.xpMultiplier + (xpCb.ancientWisdomActive ? this.dungeonIndex * 0.02 : 0);
    const levelsBeforeXp = this.party.team.map(c => c.level);
    for (const c of this.party.team) {
      // Phantom Compass: per-character XP bonus, scales with level
      const compassSlot = c.artifactSlots.find(s => s?.id === "phantom_compass");
      const xpMult = compassSlot ? 1 + ARTIFACT_DEFS["phantom_compass"].effectValue * (compassSlot.level + 1) : 1;
      c.gainXp(xp * xpMult * constellationXpMult);
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

    this.killStreak += 1;
    if (this.killStreak > this.lifetimeBestKillStreak) this.lifetimeBestKillStreak = this.killStreak;
    if (this.party.team.some((c, i) => c.level > levelsBeforeXp[i])) this.partyVersion++;

    // Druid wild_growth: heals all living members 2% maxHP on each kill
    if (this.party.team.some(c => c.isAlive() && c.abilities.includes("wild_growth"))) {
      for (const c of this.party.team) {
        if (c.isAlive()) c.health = Math.min(c.maxHealth, c.health + c.maxHealth * 0.02);
      }
    }

    // Bloodstone: heal party on each kill, scales with level
    let bloodHealFrac = 0;
    for (const c of this.party.team) {
      const bloodSlot = c.artifactSlots.find(s => s?.id === "bloodstone");
      if (bloodSlot) bloodHealFrac += ARTIFACT_DEFS[bloodSlot.id].effectValue * (bloodSlot.level + 1);
    }
    if (bloodHealFrac > 0) {
      for (const ally of this.party.team) {
        ally.health = Math.min(ally.maxHealth, ally.health + ally.maxHealth * bloodHealFrac);
      }
    }

    this.runAutoSeller(); // sell existing loot before new drops land
    this.runAutoEquip();  // equip existing loot before new drops land
    const partyGoldBonus = this.party.team.reduce((s, c) => s + c.goldBonus, 0);
    const goldMasteryMult = 1 + 0.20 * (this.prestigeUpgrades["gold_mastery"] ?? 0);
    const prestigeGoldMult = 1 + GOLD_BONUS_PER_LEVEL * (this.prestigeUpgrades["gold_bonus"] ?? 0);
    const partySizeMult = 1 + PARTY_GOLD_BONUS_PER_MEMBER * (this.party.team.length - 1);
    // Greed Idol: boss gold multiplier scaled by level (1 + 0.5*(level+1)); take highest
    let artifactGoldMult = 1.0;
    for (const c of this.party.team) {
      const greedSlot = c.artifactSlots.find(s => s?.id === "greed_idol");
      if (greedSlot) {
        const mult = 1 + ARTIFACT_DEFS[greedSlot.id].effectValue * (greedSlot.level + 1);
        artifactGoldMult = Math.max(artifactGoldMult, mult);
      }
    }
    const constellationGoldMult = this.constellationBonuses.goldMultiplier;
    if (this.enemy.isBoss) {
      this.earnGold(this.enemy.gold_reward * (1 + partyGoldBonus) * goldMasteryMult * prestigeGoldMult * partySizeMult * artifactGoldMult * constellationGoldMult);
      this.lifetimeBossKills += 1;
      if (this.lootPool.length < this.lootMax) {
        const drop = randomSetDrop(this.dungeonLevel + this.dungeonIndex * 5);
        this.lootPool.push(drop);
        if (drop.quality === "divine") this.lifetimeDivine = 1;
        else if (QUAL.indexOf(drop.quality as typeof QUAL[number]) >= QUAL.indexOf("legendary")) this.lifetimeLegendary = 1;
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      if ((this.guildUpgrades["rune_forge"] ?? 0) >= 1 && Math.random() < 0.20) {
        this.dropRandomLesserRune("Boss");
      }
      // Artifact drop: dungeon 3+ (dungeonIndex >= 2), 10% chance
      if (this.dungeonIndex >= 2 && Math.random() < 0.10) {
        const artifactId = ARTIFACT_DROP_POOL[Math.floor(Math.random() * ARTIFACT_DROP_POOL.length)];
        this.artifactInventory.push({ id: artifactId, level: 0, fuel: 0 });
        this.addLog(`✨ Boss dropped: ${ARTIFACT_DEFS[artifactId].name}!`);
      }
      this.dungeonLevel += 1;
      this.floorKills = 0;
      if (this.dungeonLevel > this.highestLevel) {
        this.highestLevel = this.dungeonLevel;
        this.syncSmartSeller();
      }
      const cpLevel = this.prestigeUpgrades["checkpoint"] ?? 0;
      const isCheckpoint = cpLevel > 0 && this.dungeonLevel % 5 === 0 && this.dungeonLevel <= cpLevel * 5;
      if (isCheckpoint) {
        this.checkpointLevel = this.dungeonLevel;
        this.addLog(`⚑ Checkpoint! Respawn set to floor ${this.checkpointLevel}.`);
      }
      this.lastStandUsedThisFloor = false;
      this.addLog(`Descending to level ${this.dungeonLevel}!`);
      this.enemy = this.spawnNextEnemy();
    } else {
      const gearLuckBonus = 0.05 * (this.prestigeUpgrades["gear_luck"] ?? 0);
      // Fortune's Eye: additive drop chance bonus, sum across all equipped copies
      const fortunesEyeBonus = this.party.team.reduce((s, c) => {
        const slot = c.artifactSlots.find(a => a?.id === "fortunes_eye");
        return slot ? s + ARTIFACT_DEFS["fortunes_eye"].effectValue * (slot.level + 1) : s;
      }, 0);
      const dropChance = Math.min(0.75, DROP_CHANCE + this.dungeonIndex * 0.05 + gearLuckBonus + fortunesEyeBonus);
      if ((this.enemy.isElite || Math.random() < dropChance) && this.lootPool.length < this.lootMax) {
        const effectiveLevel = this.dungeonLevel + this.dungeonIndex * 5;
        const lootCb = this.constellationBonuses;
        const qualityBoost = (lootCb.lootQualityBonus > 0 && Math.random() < lootCb.lootQualityBonus / 100) ? 8 : 0;
        const drop = getItem(undefined, effectiveLevel + qualityBoost);
        this.lootPool.push(drop);
        if (drop.quality === "divine") this.lifetimeDivine = 1;
        else if (QUAL.indexOf(drop.quality as typeof QUAL[number]) >= QUAL.indexOf("legendary")) this.lifetimeLegendary = 1;
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      if (this.enemy.isElite && (this.guildUpgrades["rune_forge"] ?? 0) >= 1 && Math.random() < 0.10) {
        this.dropRandomLesserRune("Elite");
      }
      if (this.enemy.isElite && Math.random() < 0.15 && this.lootPool.length < this.lootMax) {
        const setDrop = randomSetDrop(this.dungeonLevel + this.dungeonIndex * 5);
        this.lootPool.push(setDrop);
        this.addLog(`Elite dropped a set piece: ${setDrop.getName()}!`);
      }
      // Executioner's Mark: elite triggers (level+1) extra boss-quality set piece drop checks
      const execMarkSlot = this.party.team
        .flatMap(c => c.artifactSlots)
        .find(s => s?.id === "executioners_mark");
      if (this.enemy.isElite && execMarkSlot) {
        const checks = execMarkSlot.level + 1;
        for (let i = 0; i < checks && this.lootPool.length < this.lootMax; i++) {
          const execDrop = randomSetDrop(this.dungeonLevel + this.dungeonIndex * 5);
          this.lootPool.push(execDrop);
          this.addLog(`⚔ Executioner's Mark: ${execDrop.getName()}!`);
        }
      }
      this.kills += 1;
      this.floorKills += 1;
      if (this.floorKills >= killsForFloor(this.dungeonLevel)) {
        this.floorKills = 0;
        this.addLog(`Floor ${this.dungeonLevel} cleared! Boss incoming!`);
        this.enemy = generateBoss(this.dungeonLevel, this.dungeonIndex);
      } else {
        this.enemy = this.spawnNextEnemy();
      }
    }
    this._lootCache = null;
    this._artifactInvCache = null;
    this.runAutoUpgrade();
    this.checkAchievements();
  }

  /** Handles party wipe: increments deaths, resets to checkpoint, and fully restores all HP. */
  onPlayerDeath(): void {
    const player = this.party.team[0];
    this.deaths += 1;
    this.killStreak = 0;
    this.deathFloors[this.dungeonLevel] = (this.deathFloors[this.dungeonLevel] ?? 0) + 1;
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

  /** Drops a random lesser-tier rune into the rune inventory and logs it with the given source label. */
  private dropRandomLesserRune(source: string): void {
    const lesserIds = Object.keys(RUNE_DEFS).filter(id => id.endsWith("_lesser"));
    const runeId = lesserIds[Math.floor(Math.random() * lesserIds.length)];
    this.runeInventory.push(RUNE_DEFS[runeId]);
    this.addLog(`${source} dropped a ${RUNE_DEFS[runeId].name}!`);
  }

  /** Passes a displaced item to the best recipient if it is an upgrade for them; otherwise sells it. */
  private disposeItem(old: GearItem): void {
    if (this.isUpgradeForAnyMember(old)) {
      const recipient = this.bestRecipient(old);
      const further = recipient.equipItem(old);
      recipient.recomputeSetBonuses();
      this.addLog(`${recipient.name} equips ${old.getName()}!`);
      if (further) {
        this.earnGold(further.sellValue);
        this.lifetimeSold += 1;
        this.addLog(`Sold ${further.getName()} for ${further.sellValue}g.`);
      }
    } else {
      this.earnGold(old.sellValue);
      this.lifetimeSold += 1;
      this.addLog(`Sold ${old.getName()} for ${old.sellValue}g.`);
    }
  }

  /**
   * Returns the equipped item that would be displaced if this item were equipped.
   * For rings, returns the weaker ring (the one that will be replaced).
   */
  /** Sentinel returned by slotToCompare when a slot is locked. Its enormous power prevents displacement. */
  private static readonly LOCKED: GearItem = new GearItem("main_hand", "sword", "divine", "valor", { dps: 1e12 }, 1);

  /** Returns the item that would be displaced if the new item were auto-equipped, respecting gear locks.
   *  Returns LOCKED sentinel (enormous power) when displacement is blocked by a lock. */
  private slotToCompare(c: Character, item: GearItem): GearItem | null {
    if (item.slot !== "ring1") {
      const existing = c.inventory.slots[item.slot];
      // Locked slot: block replacement if occupied; block filling if empty and locked
      if (c.lockedSlots.has(item.slot)) return GameState.LOCKED;
      return existing;
    }
    // Ring logic
    const r1 = c.inventory.slots.ring1;
    const r2 = c.inventory.slots.ring2;
    const r1Locked = c.lockedSlots.has("ring1");
    const r2Locked = c.lockedSlots.has("ring2");
    if (!r1 || !r2) {
      // At least one ring slot is empty — block filling if that empty slot is locked
      if (!r1 && r1Locked && !r2 && r2Locked) return GameState.LOCKED;
      if (!r1 && r1Locked) return r1 ?? null; // r1 locked and empty → try r2
      if (!r2 && r2Locked) return r2 ?? null; // r2 locked and empty → try r1
      return null; // fill empty slot
    }
    if (r1Locked && r2Locked) return GameState.LOCKED; // both occupied and locked
    if (r1Locked) return r2; // only r2 can be displaced
    if (r2Locked) return r1; // only r1 can be displaced
    return gearPower(r1.stats) <= gearPower(r2.stats) ? r1 : r2; // weaker ring displaced
  }

  /** Toggles the lock state of a gear slot on a character. Locked slots are skipped by auto systems. */
  toggleGearLock(charIdx: number, slot: string): string {
    const char = this.party.team[charIdx];
    if (!char) return this.respond();
    const s = slot as Slot;
    if (char.lockedSlots.has(s)) char.lockedSlots.delete(s);
    else char.lockedSlots.add(s);
    return this.respond();
  }

  /** Sells all loot items matching the auto-sell quality list, skipping items that are upgrades. */
  toggleAutoAction(type: "auto_equip" | "auto_sell" | "auto_upgrade"): string {
    if (type === "auto_equip") this.autoEquipEnabled = !this.autoEquipEnabled;
    else if (type === "auto_sell") this.autoSellEnabled = !this.autoSellEnabled;
    else if (type === "auto_upgrade") this.autoUpgradeEnabled = !this.autoUpgradeEnabled;
    return this.respond();
  }

  private runAutoSeller(): void {
    if (!(this.prestigeUpgrades["auto_seller"] > 0)) return;
    if (!this.autoSellEnabled) return;
    const smartFull = (this.prestigeUpgrades["smart_seller"] ?? 0) > 0 && this.lootPool.length >= this.lootMax;
    if (this.autoSellQualities.length === 0 && !smartFull) return;
    const toSell = this.lootPool.filter(item => {
      if (this.isUpgradeForAnyMember(item)) return false;
      if (this.autoSellQualities.includes(item.quality)) return true;
      return smartFull; // chest full + smart seller: clear non-upgrades regardless of quality
    });
    if (toSell.length === 0) return;
    const gold = toSell.reduce((sum, item) => sum + item.sellValue, 0);
    this.earnGold(gold);
    this.lifetimeSold += toSell.length;
    this.lootPool = this.lootPool.filter(item => !toSell.includes(item));
    this._lootCache = null;
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
    if (!this.autoEquipEnabled) return;
    let anyEquipped = false;
    let found = true;
    while (found) {
      found = false;
      for (let i = 0; i < this.lootPool.length; i++) {
        const item = this.lootPool[i];
        if (this.isUpgradeForAnyMember(item)) {
          this.lootPool.splice(i, 1);
          const target = this.bestRecipient(item);
          const old = target.equipItem(item);
          target.recomputeSetBonuses();
          this.addLog(`Auto Equip: ${target.name} equips ${item.getName()}!`);
          if (old) this.disposeItem(old);
          anyEquipped = true;
          found = true;
          break;
        }
      }
    }
    if (anyEquipped) {
      this._lootCache = null;
      this.partyVersion++;
    }
  }

  /** Greedily buys the cheapest affordable stat upgrade for any party member until gold runs out. */
  /** Returns the cost of the next available guild hall upgrade, or 0 if all are owned. */
  private nextGuildHallCost(): number {
    let cheapest = Infinity;
    for (const [type, costs] of Object.entries(GUILD_HALL_COSTS)) {
      const owned = this.guildUpgrades[type] ?? 0;
      if (owned < costs.length && this.dungeonIndex >= (GUILD_HALL_DUNGEON_REQ[type] ?? 0)) {
        cheapest = Math.min(cheapest, costs[owned]);
      }
    }
    return cheapest === Infinity ? 0 : cheapest;
  }

  private runAutoUpgrade(): void {
    if (!(this.prestigeUpgrades["auto_upgrade"] > 0)) return;
    if (!this.autoUpgradeEnabled) return;
    const upgradeTypes: UpgradeType[] = ["dps", "xp", "click", "hp", "defense"];
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
        this._upgradesCache = null;
        applyUpgradeStatEffect(char, type);
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
        defense: d.upgrades[c.name]?.defense?.level ?? 0,
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
    gs.autoEquipEnabled = d.auto_equip_enabled ?? true;
    gs.autoSellEnabled = d.auto_sell_enabled ?? true;
    gs.autoUpgradeEnabled = d.auto_upgrade_enabled ?? true;
    gs.checkpointLevel = d.checkpoint_level ?? 1;
    gs.floorKills = d.floor_kills ?? 0;
    gs.dungeonIndex = d.dungeon_index ?? 0;
    gs.idleGoldRate = d.idle_gold_rate ?? 0;
    gs.guildUpgrades = { ...(d.guild_upgrades ?? {}) };
    gs.deathFloors = { ...(d.death_floors ?? {}) };
    // Migrate old timestamp-based cooldowns (values > 1000) to 0 (kill-based system)
    const rawCooldowns = d.skill_cooldowns ?? {};
    gs.skillCooldowns = Object.fromEntries(
      Object.entries(rawCooldowns).map(([k, v]) => [k, v > 1000 ? 0 : v])
    );
    gs.activeEffects = { ...(d.active_effects ?? {}) };
    gs.runId = d.run_id ?? crypto.randomUUID();
    gs.savedAt = d.saved_at ?? 0;
    gs.achievementsUnlocked = new Set(d.achievements_unlocked ?? []);
    gs.earnedTitle = d.earned_title || "nobody";
    gs.lifetimeGold = d.lifetime_gold ?? 0;
    gs.lifetimeLoot = d.lifetime_loot ?? 0;
    gs.lifetimeSold = d.lifetime_sold ?? 0;
    gs.lifetimeBossKills = d.lifetime_boss_kills ?? 0;
    gs.lifetimeLegendary = d.lifetime_legendary ?? 0;
    gs.lifetimeDivine = d.lifetime_divine ?? 0;
    gs.lifetimeDivineSold = d.lifetime_divine_sold ?? 0;
    gs.lifetimeEliteKills = d.lifetime_elite_kills ?? 0;
    gs.lifetimeRunesSold = d.lifetime_runes_sold ?? 0;
    gs.lifetimeRunesCombined = d.lifetime_runes_combined ?? 0;
    gs.lifetimeSkillActivations = d.lifetime_skill_activations ?? 0;
    gs.lifetimeUpgradesBought = d.lifetime_upgrades_bought ?? 0;
    gs.runeInventory = [...(d.rune_inventory ?? [])];
    gs.gearStash = (d.gear_stash ?? []).map(item => GearItem.fromDict(item));
    // Legacy saves may store artifact IDs as plain strings; current format is ArtifactInstance
    const rawArtifacts = (d.artifact_inventory ?? []) as (string | ArtifactInstance)[];
    gs.artifactInventory = rawArtifacts.map(item => {
      if (typeof item === "string") {
        return LEGACY_UPGRADED_MAP[item]
          ? { ...LEGACY_UPGRADED_MAP[item], fuel: 0 }
          : { id: item as ArtifactEffectId, level: 0, fuel: 0 };
      }
      return LEGACY_UPGRADED_MAP[item.id] && item.level === 0
        ? { ...LEGACY_UPGRADED_MAP[item.id], fuel: item.fuel ?? 0 }
        : { id: item.id as ArtifactEffectId, level: item.level ?? 0, fuel: item.fuel ?? 0 };
    });
    gs.killStreak = d.kill_streak ?? 0;
    gs.lifetimeBestKillStreak = d.lifetime_best_kill_streak ?? 0;
    gs.lifetimeClicks = d.lifetime_clicks ?? 0;
    gs.earnedAvatars = new Set(d.earned_avatars ?? ["default"]);
    gs.earnedBorders = new Set(d.earned_borders ?? ["none"]);
    gs.selectedAvatar = d.selected_avatar ?? "default";
    gs.selectedBorder = d.selected_border ?? "none";
    gs.autoPrestigeEnabled = d.auto_prestige_enabled ?? false;
    gs.autoPrestigeThreshold = d.auto_prestige_threshold ?? 5;
    gs.autoSkillEnabled = d.auto_skill_enabled ?? false;
    gs.bossEncounterTime = d.boss_enrage_time ?? 0;
    gs.retiredHeroes = [...(d.retired_heroes ?? [])];
    gs.retirementCount = d.retirement_count ?? 0;
    gs.unlockedHeroClasses = new Set(d.unlocked_hero_classes ?? ["fighter", "rogue", "mage"]);
    gs.legacyTitles = new Set(d.legacy_titles ?? []);
    gs.needsHeroCreation = d.needs_hero_creation ?? false;
    gs.constellationShards = d.constellation_shards ?? 0;
    gs.unlockedConstellationNodes = new Set(d.constellation_nodes ?? []);

    // Backfill cosmetic rewards for saves predating the avatar/border reward system
    for (const def of ACHIEVEMENTS) {
      if (def.tiers) {
        for (const tier of def.tiers) {
          if (gs.achievementsUnlocked.has(`${def.id}_${tier.label}`) && tier.reward) {
            if (tier.reward.type === "avatar" && tier.reward.cosmetic) gs.earnedAvatars.add(tier.reward.cosmetic);
            if (tier.reward.type === "border" && tier.reward.cosmetic) gs.earnedBorders.add(tier.reward.cosmetic);
          }
        }
      } else {
        if (gs.achievementsUnlocked.has(def.id) && def.reward) {
          if (def.reward.type === "avatar" && def.reward.cosmetic) gs.earnedAvatars.add(def.reward.cosmetic);
          if (def.reward.type === "border" && def.reward.cosmetic) gs.earnedBorders.add(def.reward.cosmetic);
        }
      }
    }

    // Migrate old checkpoint_1/2/3 one-time upgrades to single leveled checkpoint
    if (!("checkpoint" in gs.prestigeUpgrades)) {
      const cp3 = (gs.prestigeUpgrades["checkpoint_3"] ?? 0) > 0;
      const cp2 = (gs.prestigeUpgrades["checkpoint_2"] ?? 0) > 0;
      const cp1 = (gs.prestigeUpgrades["checkpoint_1"] ?? 0) > 0;
      gs.prestigeUpgrades["checkpoint"] = cp3 ? 10 : cp2 ? 6 : cp1 ? 3 : 0;
      delete gs.prestigeUpgrades["checkpoint_1"];
      delete gs.prestigeUpgrades["checkpoint_2"];
      delete gs.prestigeUpgrades["checkpoint_3"];
    }

    gs.enemy = {
      name: d.enemy.name,
      level: d.enemy.level,
      hp: d.enemy.hp,
      max_hp: d.enemy.max_hp,
      xp_reward: d.enemy.xp_reward,
      gold_reward: d.enemy.gold_reward,
      attack_dps: d.enemy.attack_dps,
      isBoss: d.enemy.is_boss ?? false,
      isElite: d.enemy.is_elite ?? false,
    };

    return gs;
  }
}

// ─── Total max stacks across all guild upgrades (used for Patron gold tier) ───
const GUILD_MAX_STACKS = Object.values(GUILD_HALL_COSTS).reduce((s, costs) => s + costs.length, 0);

/** All achievement definitions. Defined after GameState so getValue functions can reference it. */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Combat ────────────────────────────────────────────────────────────────
  {
    id: "first_kill", name: "Drawing Blood",
    description: "Score your first kill.",
    category: "combat", hidden: false,
    getValue: gs => gs.lifetimeKills + gs.kills,
  },
  {
    id: "kills_tiered", name: "Slayer",
    description: "Kill enemies across your journey.",
    category: "combat", hidden: false,
    tiers: [
      { label: "bronze", threshold: 100,   reward: { type: "gold", value: 500 } },
      { label: "silver", threshold: 1_000, reward: { type: "avatar", cosmetic: "dragon" } },
      { label: "gold",   threshold: 10_000, reward: { type: "title", title: "Slayer" } },
    ],
    getValue: gs => gs.lifetimeKills + gs.kills,
  },
  {
    id: "boss_kills_tiered", name: "Boss Hunter",
    description: "Slay mighty bosses.",
    category: "combat", hidden: false,
    tiers: [
      { label: "bronze", threshold: 10,  reward: { type: "border", cosmetic: "iron" } },
      { label: "silver", threshold: 50,  reward: { type: "border", cosmetic: "silver" } },
      { label: "gold",   threshold: 100, reward: { type: "border", cosmetic: "blood" } },
    ],
    getValue: gs => gs.lifetimeBossKills,
  },
  {
    id: "kill_all_types", name: "Bestiary",
    description: "Kill every type of enemy.",
    category: "combat", hidden: false,
    reward: { type: "avatar", cosmetic: "dragon" },
    getValue: gs => new Set(Object.keys(gs.lifetimeEnemyKills).map(n => n.split(" ").pop()!)).size >= ENEMY_NOUNS.length ? 1 : 0,
  },
  {
    id: "deathless_depth", name: "Untouchable",
    description: "???",
    category: "combat", hidden: true,
    reward: { type: "border", cosmetic: "void" },
    getValue: gs => gs.deaths === 0 && gs.highestLevel >= 20 ? 1 : 0,
  },
  {
    id: "die_50", name: "Veteran of Many Deaths",
    description: "???",
    category: "combat", hidden: true,
    reward: { type: "title", title: "The Undying" },
    getValue: gs => gs.lifetimeDeaths + gs.deaths >= 50 ? 1 : 0,
  },
  // ── Explorer ──────────────────────────────────────────────────────────────
  {
    id: "depth_tiered", name: "Spelunker",
    description: "Descend ever deeper into the dungeon.",
    category: "explorer", hidden: false,
    tiers: [
      { label: "bronze", threshold: 10, reward: { type: "gold", value: 250 } },
      { label: "silver", threshold: 25, reward: { type: "border", cosmetic: "silver" } },
      { label: "gold",   threshold: 50, reward: { type: "border", cosmetic: "void" } },
    ],
    getValue: gs => gs.lifetimeBestLevel,
  },
  {
    id: "depth_100", name: "Into the Abyss",
    description: "Reach depth 100.",
    category: "explorer", hidden: false,
    reward: { type: "title", title: "Abyssal" },
    getValue: gs => gs.lifetimeBestLevel >= 100 ? 1 : 0,
  },
  {
    id: "dungeons_tiered", name: "Dungeon Crawler",
    description: "Venture into multiple dungeons.",
    category: "explorer", hidden: false,
    tiers: [
      { label: "bronze", threshold: 5,  reward: { type: "gold", value: 500 } },
      { label: "silver", threshold: 10, reward: { type: "avatar", cosmetic: "hunter" } },
      { label: "gold",   threshold: 25, reward: { type: "border", cosmetic: "ancient" } },
    ],
    getValue: gs => gs.dungeonIndex,
  },
  // ── Collector ─────────────────────────────────────────────────────────────
  {
    id: "first_loot", name: "Treasure Hunter",
    description: "Loot your first item.",
    category: "collector", hidden: false,
    getValue: gs => gs.lifetimeLoot,
  },
  {
    id: "first_legendary", name: "Legendary",
    description: "???",
    category: "collector", hidden: true,
    reward: { type: "avatar", cosmetic: "gem" },
    getValue: gs => gs.lifetimeLegendary,
  },
  {
    id: "first_divine", name: "Touched by the Gods",
    description: "???",
    category: "collector", hidden: true,
    reward: { type: "border", cosmetic: "gold" },
    getValue: gs => gs.lifetimeDivine,
  },
  {
    id: "full_kit", name: "Fully Loaded",
    description: "Have every party member fully equipped.",
    category: "collector", hidden: false,
    reward: { type: "avatar", cosmetic: "warlord" },
    getValue: gs => gs.party.team.every(c => SLOTS.every(slot => c.inventory.slots[slot] !== null)) ? 1 : 0,
  },
  {
    id: "items_looted_tiered", name: "Hoarder",
    description: "Accumulate items from the dungeon.",
    category: "collector", hidden: false,
    tiers: [
      { label: "bronze", threshold: 50,  reward: { type: "gold", value: 250 } },
      { label: "silver", threshold: 200, reward: { type: "gold", value: 500 } },
      { label: "gold",   threshold: 500, reward: { type: "avatar", cosmetic: "gem" } },
    ],
    getValue: gs => gs.lifetimeLoot,
  },
  {
    id: "items_sold_tiered", name: "Merchant",
    description: "Sell items to the vendor.",
    category: "collector", hidden: false,
    tiers: [
      { label: "bronze", threshold: 25,  reward: { type: "gold", value: 250 } },
      { label: "silver", threshold: 100, reward: { type: "gold", value: 500 } },
      { label: "gold",   threshold: 500, reward: { type: "title", title: "The Gilded" } },
    ],
    getValue: gs => gs.lifetimeSold,
  },
  // ── Wealth ────────────────────────────────────────────────────────────────
  {
    id: "gold_tiered", name: "Gold Rush",
    description: "Earn gold across your adventure.",
    category: "wealth", hidden: false,
    tiers: [
      { label: "bronze", threshold: 10_000,    reward: { type: "gold", value: 500 } },
      { label: "silver", threshold: 100_000,   reward: { type: "avatar", cosmetic: "merchant" } },
      { label: "gold",   threshold: 1_000_000, reward: { type: "border", cosmetic: "gold" } },
    ],
    getValue: gs => gs.lifetimeGold,
  },
  {
    id: "sell_divine", name: "Letting Go",
    description: "???",
    category: "wealth", hidden: true,
    reward: { type: "avatar", cosmetic: "merchant" },
    getValue: gs => gs.lifetimeDivineSold,
  },
  // ── Prestige ──────────────────────────────────────────────────────────────
  {
    id: "first_prestige", name: "Reborn",
    description: "Return to Town for the first time.",
    category: "prestige", hidden: false,
    reward: { type: "border", cosmetic: "arcane" },
    getValue: gs => gs.totalPrestiges,
  },
  {
    id: "prestiges_tiered", name: "Phoenix",
    description: "Rise from the ashes again and again.",
    category: "prestige", hidden: false,
    tiers: [
      { label: "bronze", threshold: 5,  reward: { type: "border", cosmetic: "arcane" } },
      { label: "silver", threshold: 10, reward: { type: "border", cosmetic: "ancient" } },
      { label: "gold",   threshold: 25, reward: { type: "title", title: "The Eternal" } },
    ],
    getValue: gs => gs.totalPrestiges,
  },
  {
    id: "prestige_shop_full", name: "The Complete Package",
    description: "Purchase every item in the Hall of Renown.",
    category: "prestige", hidden: false,
    reward: { type: "border", cosmetic: "ancient" },
    getValue: gs => Object.keys(PRESTIGE_SHOP_COSTS).every(k => (gs.prestigeUpgrades[k] ?? 0) > 0) ? 1 : 0,
  },
  // ── Guild ─────────────────────────────────────────────────────────────────
  {
    id: "guild_unlocked", name: "Founding Member",
    description: "Unlock the Guild Hall.",
    category: "guild", hidden: false,
    getValue: gs => (gs.prestigeUpgrades["guild_hall_access"] ?? 0) > 0 || Object.values(gs.guildUpgrades).some(v => v > 0) ? 1 : 0,
  },
  {
    id: "guild_max", name: "Guild Master",
    description: "Max every Guild Hall upgrade.",
    category: "guild", hidden: false,
    reward: { type: "title", title: "Guild Master" },
    getValue: gs => Object.keys(GUILD_HALL_COSTS).every(k => (gs.guildUpgrades[k] ?? 0) >= GUILD_HALL_COSTS[k].length) ? 1 : 0,
  },
  {
    id: "guild_upgrades_tiered", name: "Patron",
    description: "Invest in the Guild Hall.",
    category: "guild", hidden: false,
    tiers: [
      { label: "bronze", threshold: 3,                reward: { type: "gold", value: 500 } },
      { label: "silver", threshold: 6,                reward: { type: "avatar", cosmetic: "warlord" } },
      { label: "gold",   threshold: GUILD_MAX_STACKS, reward: { type: "border", cosmetic: "gold" } },
    ],
    getValue: gs => Object.values(gs.guildUpgrades).reduce((s: number, v) => s + (v as number), 0),
  },
  // ── Party ─────────────────────────────────────────────────────────────────
  {
    id: "not_alone", name: "Not Alone",
    description: "Hire your first companion.",
    category: "guild", hidden: false,
    getValue: gs => gs.party.team.length >= 2 ? 1 : 0,
  },
  {
    id: "band_of_heroes", name: "Band of Heroes",
    description: "Field a full 5-member party.",
    category: "guild", hidden: false,
    reward: { type: "avatar", cosmetic: "crown" },
    getValue: gs => gs.party.team.length >= 5 ? 1 : 0,
  },
  {
    id: "battle_ready", name: "Battle Ready",
    description: "Activate a skill for the first time.",
    category: "guild", hidden: false,
    getValue: gs => gs.lifetimeSkillActivations,
  },
  {
    id: "arsenal", name: "Arsenal",
    description: "Unlock all active skills.",
    category: "guild", hidden: false,
    reward: { type: "avatar", cosmetic: "merchant" },
    getValue: gs => Object.keys(SKILL_DEFS).filter(id => (gs.guildUpgrades[id] ?? 0) > 0).length >= Object.keys(SKILL_DEFS).length ? 1 : 0,
  },
  // ── Runes ─────────────────────────────────────────────────────────────────
  {
    id: "arcane_brand", name: "Arcane Brand",
    description: "Socket your first rune.",
    category: "runes", hidden: false,
    getValue: gs => gs.party.team.some(c => Object.keys(c.runes ?? {}).length > 0) ? 1 : 0,
  },
  {
    id: "forge_master", name: "Forge Master",
    description: "Combine runes for the first time.",
    category: "runes", hidden: false,
    getValue: gs => gs.lifetimeRunesCombined,
  },
  {
    id: "fully_attuned", name: "Fully Attuned",
    description: "Fill every rune slot on one character.",
    category: "runes", hidden: false,
    reward: { type: "avatar", cosmetic: "rune" },
    getValue: gs => gs.party.team.some(c => Object.keys(c.runes ?? {}).length >= 9) ? 1 : 0,
  },
  {
    id: "ancient_power", name: "Ancient Power",
    description: "???",
    category: "runes", hidden: true,
    reward: { type: "border", cosmetic: "arcane" },
    getValue: gs =>
      gs.runeInventory.some(r => r.tier === "ancient") ||
      gs.party.team.some(c => Object.values(c.runes ?? {}).some(r => r?.tier === "ancient")) ? 1 : 0,
  },
  {
    id: "gem_collector", name: "Gem Collector",
    description: "Amass a collection of runes.",
    category: "runes", hidden: false,
    tiers: [
      { label: "bronze", threshold: 5,  reward: { type: "gold", value: 250 } },
      { label: "silver", threshold: 15, reward: { type: "gold", value: 500 } },
      { label: "gold",   threshold: 30, reward: { type: "avatar", cosmetic: "rune" } },
    ],
    getValue: gs => gs.runeInventory.length,
  },
  {
    id: "rune_trader", name: "Rune Trader",
    description: "Sell runes to earn gold.",
    category: "runes", hidden: false,
    tiers: [
      { label: "bronze", threshold: 10,  reward: { type: "gold", value: 250 } },
      { label: "silver", threshold: 50,  reward: { type: "gold", value: 500 } },
      { label: "gold",   threshold: 200, reward: { type: "avatar", cosmetic: "merchant" } },
    ],
    getValue: gs => gs.lifetimeRunesSold,
  },
  // ── Combat (additions) ────────────────────────────────────────────────────
  {
    id: "elite_hunter", name: "Elite Hunter",
    description: "Slay elite enemies.",
    category: "combat", hidden: false,
    tiers: [
      { label: "bronze", threshold: 10,  reward: { type: "gold", value: 250 } },
      { label: "silver", threshold: 50,  reward: { type: "border", cosmetic: "blood" } },
      { label: "gold",   threshold: 200, reward: { type: "avatar", cosmetic: "dragon" } },
    ],
    getValue: gs => gs.lifetimeEliteKills,
  },
  // ── Wealth (additions) ────────────────────────────────────────────────────
  {
    id: "upgrade_junkie", name: "Upgrade Junkie",
    description: "Buy stat upgrades for your party.",
    category: "wealth", hidden: false,
    tiers: [
      { label: "bronze", threshold: 50,    reward: { type: "gold", value: 500 } },
      { label: "silver", threshold: 250,   reward: { type: "border", cosmetic: "iron" } },
      { label: "gold",   threshold: 1_000, reward: { type: "border", cosmetic: "silver" } },
    ],
    getValue: gs => gs.lifetimeUpgradesBought,
  },
  // ── Clicks ────────────────────────────────────────────────────────────────
  {
    id: "clicks_tiered", name: "Clicking Maniac",
    description: "Click to deal bonus damage.",
    category: "combat", hidden: false,
    tiers: [
      { label: "bronze", threshold: 100,    reward: { type: "border", cosmetic: "iron" } },
      { label: "silver", threshold: 1_000,  reward: { type: "avatar", cosmetic: "hunter" } },
      { label: "gold",   threshold: 10_000, reward: { type: "border", cosmetic: "arcane" } },
    ],
    getValue: gs => gs.lifetimeClicks,
  },
  // ── Constellations ────────────────────────────────────────────────────────
  {
    id: "first_light", name: "First Light",
    description: "Unlock your first Constellation node.",
    category: "guild", hidden: false,
    reward: { type: "gold", value: 500 },
    getValue: gs => gs.unlockedConstellationNodes.size,
  },
  {
    id: "stargazer_tiered", name: "Stargazer",
    description: "Illuminate the Constellation tree.",
    category: "guild", hidden: false,
    tiers: [
      { label: "bronze", threshold: 10, reward: { type: "gold", value: 1_000 } },
      { label: "silver", threshold: 30, reward: { type: "avatar", cosmetic: "star" } },
      { label: "gold",   threshold: 70, reward: { type: "title", title: "The Starborn" } },
    ],
    getValue: gs => gs.unlockedConstellationNodes.size,
  },
  {
    id: "constellation_master", name: "Constellation Master",
    description: "Unlock every node in the Constellation tree.",
    category: "guild", hidden: false,
    reward: { type: "title", title: "Celestial" },
    getValue: gs => gs.unlockedConstellationNodes.size >= Object.keys(CONSTELLATION_NODE_DEFS).length ? 1 : 0,
  },
  // ── Artifacts ────────────────────────────────────────────────────────────
  {
    id: "relic_finder", name: "Relic Finder",
    description: "Equip an artifact to a hero for the first time.",
    category: "collector", hidden: false,
    reward: { type: "gold", value: 250 },
    getValue: gs => gs.party.team.some(c => c.artifactSlots.some(s => s !== null)) ? 1 : 0,
  },
  {
    id: "archaeologist_tiered", name: "Archaeologist",
    description: "Collect a variety of distinct artifacts.",
    category: "collector", hidden: false,
    tiers: [
      { label: "bronze", threshold: 3,                       reward: { type: "gold", value: 500 } },
      { label: "silver", threshold: 6,                       reward: { type: "avatar", cosmetic: "warlord" } },
      { label: "gold",   threshold: ARTIFACT_DROP_POOL.length, reward: { type: "title", title: "The Collector" } },
    ],
    getValue: gs => new Set([
      ...gs.artifactInventory.map(a => a.id),
      ...gs.party.team.flatMap(c => c.artifactSlots.filter((s): s is ArtifactInstance => s !== null).map(s => s.id)),
    ]).size,
  },
  {
    id: "artifact_max_level", name: "Ancient Relic",
    description: "???",
    category: "collector", hidden: true,
    reward: { type: "border", cosmetic: "ancient" },
    getValue: gs => [
      ...gs.artifactInventory,
      ...gs.party.team.flatMap(c => c.artifactSlots.filter((s): s is ArtifactInstance => s !== null)),
    ].some(a => a.level >= 5) ? 1 : 0,
  },
  // ── Kill Streak ───────────────────────────────────────────────────────────
  {
    id: "on_a_roll_tiered", name: "On a Roll",
    description: "Build an unstoppable kill streak.",
    category: "combat", hidden: false,
    tiers: [
      { label: "bronze", threshold: 25,  reward: { type: "avatar", cosmetic: "skull" } },
      { label: "silver", threshold: 100, reward: { type: "border", cosmetic: "blood" } },
      { label: "gold",   threshold: 500, reward: { type: "title", title: "The Relentless" } },
    ],
    getValue: gs => gs.lifetimeBestKillStreak,
  },
  // ── Party ─────────────────────────────────────────────────────────────────
  {
    id: "full_roster", name: "Full Roster",
    description: "Field a full 6-member party.",
    category: "guild", hidden: false,
    reward: { type: "title", title: "The Warlord" },
    getValue: gs => gs.party.team.length >= 6 ? 1 : 0,
  },
  // ── Skills ───────────────────────────────────────────────────────────────
  {
    id: "tactician_tiered", name: "Tactician",
    description: "Master the art of skill activation.",
    category: "guild", hidden: false,
    tiers: [
      { label: "bronze", threshold: 10,    reward: { type: "gold", value: 500 } },
      { label: "silver", threshold: 100,   reward: { type: "border", cosmetic: "arcane" } },
      { label: "gold",   threshold: 1_000, reward: { type: "title", title: "Spellblade" } },
    ],
    getValue: gs => gs.lifetimeSkillActivations,
  },
];

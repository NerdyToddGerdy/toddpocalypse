// Town tables (#61): upgrades, the prestige shop, the Guild Hall, runes and the
// Quartermaster. Data only; engine.ts holds the rules.

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
export const SCALING_PRESTIGE_UPGRADES = new Set(["starting_gold", "xp_bonus", "gold_bonus", "dps_bonus", "checkpoint", "gold_mastery", "gear_luck"]);

/** Prestige point costs for each tier of the gear stash upgrade (levels 1–4). */
export const STASH_TIER_COSTS = [0, 2, 5, 10];

/** Number of stash slots unlocked at each stash tier (index = tier - 1). */
export const STASH_SIZES = [3, 6, 10, 15];

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

export const RUNE_TIER_UP: Record<string, string> = { lesser: "greater", greater: "flawless", flawless: "ancient" };

/** Gold received when selling a rune, keyed by tier. */
export const RUNE_SELL_VALUES: Record<string, number> = {
  lesser:   10,
  greater:  30,
  flawless: 90,
  ancient:  250,
};

export type ConsumableId = "whetstone" | "lucky_charm" | "gold_draught" | "healing_potion";

/** A Quartermaster item. Lasts `kills` kills or `bosses` bosses, or acts at once. */
export interface ConsumableDef {
  name: string;
  icon: string;
  /** What it does, in plain words with the real numbers (§4). */
  effect: string;
  kills?: number;
  bosses?: number;
  /** Price, in multiples of what a boss pays at your deepest floor this run. */
  priceBossGold: number;
}

/**
 * The Quartermaster's stock (#15). Prices track boss gold at your deepest floor,
 * so they stay a real cost from the first dungeon to the last.
 */
export const CONSUMABLE_DEFS: Record<ConsumableId, ConsumableDef> = {
  whetstone:      { name: "Whetstone",      icon: "🗡", effect: "Party damage ×1.5 for the next 10 kills.", kills: 10, priceBossGold: 1 },
  lucky_charm:    { name: "Lucky charm",    icon: "🍀", effect: "+15% drop chance for the next 10 kills, still capped at 75%.", kills: 10, priceBossGold: 1 },
  gold_draught:   { name: "Gold draught",   icon: "🍺", effect: "Boss gold ×1.5 for the next 3 bosses.", bosses: 3, priceBossGold: 2 },
  healing_potion: { name: "Healing potion", icon: "🧪", effect: "Heals every living hero to full, now.", priceBossGold: 0.5 },
};

/** A socketed rune that grants a flat stat bonus to the wearer. */
export interface Rune {
  id: string;
  name: string;
  type: string;
  tier: "lesser" | "greater" | "flawless" | "ancient";
  statKey: string;
  value: number;
}

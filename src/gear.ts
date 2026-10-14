import { pick, weightedPick } from "./utils.js";
import { defaultRng, type RNG } from "./rng.js";
import {
  DROP_WEIGHTS, QUALITY_TABLE, SET_DEFS, SLOT_DISPLAY, SLOT_ITEM_TYPES, SLOT_STAT_WEIGHTS, SLOTS, STAT_ADJECTIVES, STAT_SCALE,
  type GearStats, type Quality, type SetDef, type Slot,
} from "./data/gear.js";

export { DROP_WEIGHTS, QUALITY_TABLE, SET_DEFS, SLOT_DISPLAY, SLOT_ITEM_TYPES, SLOTS, STAT_ADJECTIVES };
export type { GearStats, Quality, SetDef, Slot };

/** Quality tiers ordered worst to best. */
export const QUAL: readonly Quality[] = QUALITY_TABLE.map((r) => r.quality);

/** Base damage value for each quality tier before depth scaling (retained for cost reference). */
export const DAMAGE_BY_QUALITY = Object.fromEntries(QUALITY_TABLE.map((r) => [r.quality, r.damage])) as Record<Quality, number>;

/** Base gold cost for each quality tier before depth scaling. */
export const COST_BY_QUALITY = Object.fromEntries(QUALITY_TABLE.map((r) => [r.quality, r.cost])) as Record<Quality, number>;

/** CSS class name for each quality tier, used by the loot renderer. */
export const QUALITY_CLASSES = Object.fromEntries(QUALITY_TABLE.map((r) => [r.quality, `q-${r.quality}`])) as Record<Quality, string>;

/** Type guard for quality tier strings (e.g. when reading saves). */
export function isQuality(s: string): s is Quality {
  return (QUAL as readonly string[]).includes(s);
}

/** Dream-drop weights for the one and two tiers above the current max. */
const DREAM_WEIGHTS = [1.0, 0.5] as const;

/** Returns per-tier drop weights for the given dungeon floor.
 *  The two tiers above the current max have a small dream-drop chance (~1% / ~0.5%). */
export function qualityWeights(dungeonLevel: number): number[] {
  const maxTier = Math.min(3 + Math.floor(dungeonLevel / 4), QUAL.length - 1);
  return QUAL.map((_, i) => {
    if (i === maxTier + 1) return DREAM_WEIGHTS[0];
    if (i === maxTier + 2) return DREAM_WEIGHTS[1];
    if (i > maxTier) return 0;
    return DROP_WEIGHTS[maxTier - i];
  });
}

/**
 * The chance of each quality tier, aligned with `QUAL` (#74).
 *
 * Built from `qualityWeights`, the same table `getItem` rolls on, so what the
 * player is shown is what the game rolls. `boostChance` is the chance the drop
 * rolls `boostLevels` floors deeper instead (the constellation loot bonus).
 */
export function qualityOdds(level: number, boostChance = 0, boostLevels = 8): number[] {
  const normalise = (w: number[]) => {
    const total = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / total);
  };
  const base = normalise(qualityWeights(level));
  if (boostChance <= 0) return base;
  if (boostChance >= 1) return normalise(qualityWeights(level + boostLevels));
  const boosted = normalise(qualityWeights(level + boostLevels));
  return base.map((p, i) => (1 - boostChance) * p + boostChance * boosted[i]);
}

/** Returns the CSS class for a quality string, defaulting to q-common for unknown values. */
export function qualityClass(quality: string): string {
  return isQuality(quality) ? QUALITY_CLASSES[quality] : "q-common";
}

/** Damage and cost multiplier derived from dungeon depth: +25% per 5 floors. */
export function gearLevelScale(level: number): number {
  return 1 + Math.floor(level / 5) * 0.25;
}

/** Index into QUAL of the highest tier the Auto Seller may target at this floor (never divine). */
export function autoSellThreshold(highestLevel: number): number {
  return Math.min(Math.floor((highestLevel - 1) / 4), QUAL.length - 2);
}

/** Stats that scale with dungeon level (numeric); percentage stats do not scale. */
const NUMERIC_STATS = new Set<keyof GearStats>(["dps", "maxHp", "clickBonus"]);

/** Number of stat rolls based on quality tier index. Sub-common (< index 4) always roll 1. */
function getRollCount(qualityIdx: number, rng: RNG): number {
  if (qualityIdx <= 3) return 1;                               // broken, worn, crude, poor
  if (qualityIdx <= 6) return rng() < 0.5 ? 1 : 2;   // common, fine, superior
  if (qualityIdx <= 8) return 2;                               // rare, epic
  if (qualityIdx <= 10) return rng() < 0.5 ? 2 : 3;  // legendary, mythic
  return 3;                                                    // ancient+
}

/** Rolls 1–3 stat bonuses for a gear item based on slot, quality, and dungeon level.
 *  Returns the stats and the primary (first-rolled) stat key. */
function rollStats(slot: Slot, quality: Quality, dungeonLevel: number, rng: RNG): { stats: GearStats; primaryStat: keyof GearStats } {
  const qIdx = QUAL.indexOf(quality);
  const rollCount = getRollCount(qIdx < 0 ? 4 : qIdx, rng);
  const pool = { ...SLOT_STAT_WEIGHTS[slot] } as Record<keyof GearStats, number>;
  const scale = gearLevelScale(dungeonLevel);
  const result: Partial<Record<keyof GearStats, number>> = {};
  let primaryStat: keyof GearStats = "dps";

  for (let i = 0; i < rollCount; i++) {
    const keys = Object.keys(pool) as (keyof GearStats)[];
    if (keys.length === 0) break;
    const stat = weightedPick(keys, keys.map(k => pool[k] ?? 0), rng);
    if (i === 0) primaryStat = stat;
    delete pool[stat];
    const base = qIdx >= 0 ? STAT_SCALE[stat][qIdx] : (STAT_SCALE[stat][4]);
    result[stat] = NUMERIC_STATS.has(stat) ? Math.ceil(base * scale) : base;
  }
  return { stats: result, primaryStat };
}

/**
 * Normalised power score for comparing items across stat types.
 * Used for ▲/▼ tier indicators and ring replacement logic.
 */
export function gearPower(stats: GearStats): number {
  return (stats.dps ?? 0)
    + (stats.maxHp ?? 0) * 0.08
    + (stats.clickBonus ?? 0) * 0.5
    + (stats.defense ?? 0) * 120
    + (stats.critChance ?? 0) * 150
    + (stats.goldBonus ?? 0) * 80
    + (stats.lifesteal ?? 0) * 180
    + (stats.haste ?? 0) * 100
    + (stats.xpBonus ?? 0) * 60;
}

/** Serialized, plain-object form of a {@link GearItem}. */
export interface GearItemDict {
  slot: Slot;
  slot_display: string;
  name: string;
  short_name: string;
  quality: string;
  item_type: string;
  adjective: string;
  stats: GearStats;
  /** Retained for backward-compat when reading old saves that have no stats field. */
  damage: number;
  cost: number;
  sell_value: number;
  dungeon_level: number;
  /** Present only for named set pieces. */
  set_name?: string;
  /** Present only once enchanted (#15): the enchant, already counted in `stats`. */
  enchant?: Enchant;
  /** The stats without the enchant; present only when enchanted. */
  base_stats?: GearStats;
  /** Times this item has been enchanted; each costs more than the last. */
  enchant_count?: number;
}

/** One enchant (#15): a single stat bonus. An item holds at most one. */
export interface Enchant {
  stat: keyof GearStats;
  value: number;
}

/** A single piece of loot with slot, quality, and depth-scaled stats. */
export class GearItem {
  /** Equipment slot this item occupies. */
  readonly slot: Slot;
  /** Specific item type name (e.g. "sword", "hood"). */
  readonly itemType: string;
  /** Quality tier name (e.g. "rare"). */
  readonly quality: Quality;
  /** Flavor adjective in the item name. */
  readonly adjective: string;
  /** All stat bonuses this item grants when equipped, its enchant included. */
  readonly stats: GearStats;
  /** The item's own stats, without its enchant. */
  readonly baseStats: GearStats;
  /** Its enchant, if it has one (#15). */
  readonly enchant?: Enchant;
  /** Times it has been enchanted, which sets the next enchant's price. */
  readonly enchantCount: number;
  /** Gold cost to buy from a shop (currently unused in UI but tracked). */
  readonly cost: number;
  /** Gold received when selling. */
  readonly sellValue: number;
  /** Dungeon floor at which this item dropped, used for damage scaling. */
  readonly dungeonLevel: number;
  /** Named gear set this item belongs to, or undefined for random drops. */
  readonly setName?: string;

  /**
   * Creates a GearItem with explicit stats.
   * When the 5th argument is a number it is treated as dungeonLevel (backward-compat)
   * and stats are auto-computed as { dps: scaledDamage }.
   */
  constructor(
    slot: Slot,
    itemType: string,
    quality: Quality,
    adjective: string,
    statsOrLevel: GearStats | number = 1,
    dungeonLevel?: number,
    setName?: string,
    enchanting: { enchant?: Enchant; count: number } = { count: 0 },
  ) {
    const isNum = typeof statsOrLevel === "number";
    const level = isNum ? (statsOrLevel as number) : (dungeonLevel ?? 1);
    const scale = gearLevelScale(level);
    this.slot = slot;
    this.itemType = itemType;
    this.quality = quality;
    this.adjective = adjective;
    this.dungeonLevel = level;
    this.setName = setName;
    this.baseStats = isNum
      ? { dps: Math.ceil(DAMAGE_BY_QUALITY[quality] * scale) }
      : (statsOrLevel as GearStats);
    this.enchant = enchanting.enchant;
    this.enchantCount = enchanting.count;
    this.stats = this.enchant
      ? { ...this.baseStats, [this.enchant.stat]: (this.baseStats[this.enchant.stat] ?? 0) + this.enchant.value }
      : this.baseStats;
    this.cost = Math.ceil(COST_BY_QUALITY[quality] * scale);
    this.sellValue = Math.max(1, Math.floor(this.cost / 3));
  }

  /** DPS contribution; equals stats.dps for backward compatibility with code that reads .damage. */
  get damage(): number {
    return Math.round((this.stats.dps ?? 0) * 100) / 100;
  }

  /** Returns "[Set Name] itemType" for set pieces, or "quality itemType of adjective" for normal drops. */
  getName(): string {
    if (this.setName) return `[${this.setName}] ${this.itemType}`;
    return `${this.quality} ${this.itemType} of ${this.adjective}`;
  }

  /** The same item with `enchant` in place of any it had, counted as one more enchant. */
  withEnchant(enchant: Enchant): GearItem {
    return new GearItem(this.slot, this.itemType, this.quality, this.adjective, this.baseStats, this.dungeonLevel, this.setName,
      { enchant, count: this.enchantCount + 1 });
  }

  /** Serializes to a plain object safe for JSON. */
  toDict(): GearItemDict {
    return {
      slot: this.slot,
      slot_display: SLOT_DISPLAY[this.slot],
      name: this.getName(),
      short_name: `${this.itemType} of ${this.adjective}`,
      quality: this.quality,
      item_type: this.itemType,
      adjective: this.adjective,
      stats: this.stats,
      damage: this.damage,
      cost: this.cost,
      sell_value: this.sellValue,
      dungeon_level: this.dungeonLevel,
      ...(this.setName !== undefined ? { set_name: this.setName } : {}),
      ...(this.enchant ? { enchant: this.enchant, base_stats: this.baseStats } : {}),
      ...(this.enchantCount > 0 ? { enchant_count: this.enchantCount } : {}),
    };
  }

  /** Reconstructs a GearItem from its serialized form, migrating old saves that have damage but no stats. */
  static fromDict(d: GearItemDict & { damage?: number; stats?: GearStats }): GearItem {
    const stats: GearStats = d.base_stats ?? d.stats ?? (d.damage !== undefined ? { dps: d.damage } : {});
    const quality = isQuality(d.quality) ? d.quality : "common";
    return new GearItem(d.slot, d.item_type, quality, d.adjective, stats, d.dungeon_level ?? 1, d.set_name,
      { enchant: d.enchant, count: d.enchant_count ?? 0 });
  }
}

// ── Enchanting (#15) ──

/** An enchant is worth this share of what its stat rolls on a drop of the item's quality. */
export const ENCHANT_STRENGTH = 0.5;

/** One row of the enchant table: a stat it can roll, its chance, and what it gives. */
export interface EnchantOdds { stat: keyof GearStats; chance: number; value: number }

/** What an enchant of `stat` gives on an item of this quality from this floor. */
export function enchantValue(stat: keyof GearStats, quality: Quality, dungeonLevel: number): number {
  const base = STAT_SCALE[stat][QUAL.indexOf(quality)] * ENCHANT_STRENGTH;
  return NUMERIC_STATS.has(stat)
    ? Math.ceil(base * gearLevelScale(dungeonLevel))
    : Math.max(0.01, Math.round(base * 100) / 100);
}

/**
 * The enchant table for an item: the stats its slot rolls on a drop, at the
 * same weights. The roll reads this table, so the odds shown are the odds rolled.
 */
export function enchantOdds(item: GearItem): EnchantOdds[] {
  const weights = SLOT_STAT_WEIGHTS[item.slot] as Record<keyof GearStats, number>;
  const stats = Object.keys(weights) as (keyof GearStats)[];
  const total = stats.reduce((a, k) => a + weights[k], 0);
  return stats.map((stat) => ({ stat, chance: weights[stat] / total, value: enchantValue(stat, item.quality, item.dungeonLevel) }));
}

/** An enchant in plain words for the log, e.g. "+45 Damage" or "+4% Haste". */
export function enchantLabel(e: Enchant): string {
  const [label, numeric] = SET_STAT_FORMAT[e.stat] ?? [e.stat, true];
  return numeric ? `+${e.value} ${label}` : `+${Math.round(e.value * 100)}% ${label}`;
}

/** Rolls an enchant for an item from its enchant table. */
export function rollEnchant(item: GearItem, rng: RNG = defaultRng): Enchant {
  const odds = enchantOdds(item);
  const row = weightedPick(odds, odds.map((o) => o.chance), rng);
  return { stat: row.stat, value: row.value };
}

/** ring2 is never an explicit drop; inventory spill logic handles the second ring slot. */
const DROP_SLOTS = SLOTS.filter(s => s !== "ring2");

/** Generates a random loot drop for the given floor, optionally forcing a specific slot. */
export function getItem(slot?: Slot, dungeonLevel = 1, rng: RNG = defaultRng): GearItem {
  const effectiveSlot: Slot = slot === "ring2" ? "ring1" : (slot ?? pick(DROP_SLOTS, rng));
  const itemType = pick(SLOT_ITEM_TYPES[effectiveSlot], rng);
  const quality = weightedPick(QUAL, qualityWeights(dungeonLevel), rng);
  const { stats, primaryStat } = rollStats(effectiveSlot, quality, dungeonLevel, rng);
  const adjective = pick(STAT_ADJECTIVES[primaryStat], rng);
  return new GearItem(effectiveSlot, itemType, quality, adjective, stats, dungeonLevel);
}

/** Convenience wrapper — generates a random main-hand weapon. */
export function getWeapon(rng: RNG = defaultRng): GearItem {
  return getItem("main_hand");
}

const SET_STAT_FORMAT: Partial<Record<keyof GearStats, [string, boolean]>> = {
  dps:        ["Damage",      true],
  maxHp:      ["Max HP",      true],
  clickBonus: ["Click Dmg",   true],
  defense:    ["Defense",     false],
  critChance: ["Crit Chance", false],
  goldBonus:  ["Gold Find",   false],
  lifesteal:  ["Lifesteal",   false],
  haste:      ["Haste",       false],
  xpBonus:    ["XP Bonus",    false],
};

const EFFECT3PC_LABELS: Record<string, string> = {
  elite_rune:     "Grants an Elite Rune",
  cooldown_reset: "Resets skill cooldowns",
};

/** Builds the set-bonus section HTML for use in item tooltips.
 *  equippedCount is how many pieces of the set are currently in the party's gear slots. */
export function buildSetBonusHTML(setName: string, equippedCount: number): string {
  const def = SET_DEFS.find(d => d.name === setName);
  if (!def) return "";

  const displayed = Math.min(equippedCount, 3);

  function bonusLine(bonus: GearStats, effect: string | undefined, threshold: number): string {
    const parts: string[] = [];
    for (const [key, val] of Object.entries(bonus) as [keyof GearStats, number][]) {
      if (!val) continue;
      const [label, isNumeric] = SET_STAT_FORMAT[key] ?? [key, true];
      const fmt = isNumeric ? `+${(val as number).toFixed(1)}` : `+${((val as number) * 100).toFixed(0)}%`;
      parts.push(`${fmt} ${label}`);
    }
    if (effect) parts.push(EFFECT3PC_LABELS[effect] ?? effect);
    if (!parts.length) parts.push("Special effect");
    const active = equippedCount >= threshold;
    return `<div class="tt-set-bonus ${active ? "active" : "inactive"}"><span class="tt-set-threshold">${threshold}pc:</span> ${parts.join(", ")}</div>`;
  }

  return `<div class="tt-divider"></div><div class="tt-set-name">⚙ ${def.name} (${displayed} / 3)</div>${bonusLine(def.bonus2pc, undefined, 2)}${bonusLine(def.bonus3pc, def.effect3pc, 3)}`;
}

/** Generates a named set piece for the given set, slot, and dungeon level.
 *  Always at least rare quality. ring2 falls back to ring1 (inventory logic handles placement). */
export function getSetItem(setId: string, slot: Slot, dungeonLevel = 1, rng: RNG = defaultRng): GearItem {
  const def = SET_DEFS.find(d => d.id === setId)!;
  const effectiveSlot: Slot = slot === "ring2" ? "ring1" : slot;
  const itemType = pick(SLOT_ITEM_TYPES[effectiveSlot], rng);
  const minQualIdx = QUAL.indexOf("rare");
  // Zero out sub-rare weights; ensure rare always has at least weight 1 even at low dungeon levels
  const weights = qualityWeights(dungeonLevel).map((w, i) => {
    if (i < minQualIdx) return 0;
    if (i === minQualIdx) return Math.max(w, 1.0);
    return w;
  });
  const quality = weightedPick(QUAL, weights, rng);
  const { stats, primaryStat } = rollStats(effectiveSlot, quality, dungeonLevel, rng);
  const adjective = pick(STAT_ADJECTIVES[primaryStat], rng);
  return new GearItem(effectiveSlot, itemType, quality, adjective, stats, dungeonLevel, def.name);
}

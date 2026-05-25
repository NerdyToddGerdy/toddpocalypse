/** All equipment slot identifiers, in render order. */
export const SLOTS = [
  "main_hand",
  "off_hand",
  "helmet",
  "chest",
  "gloves",
  "legs",
  "shoes",
  "ring1",
  "ring2",
] as const;

/** Union of valid equipment slot keys. */
export type Slot = (typeof SLOTS)[number];

/** Human-readable label for each equipment slot. */
export const SLOT_DISPLAY: Record<Slot, string> = {
  main_hand: "Main Hand",
  off_hand: "Off Hand",
  helmet: "Helmet",
  chest: "Chest",
  gloves: "Gloves",
  legs: "Legs",
  shoes: "Shoes",
  ring1: "Ring",
  ring2: "Ring",
};

/** Candidate item type names for each equipment slot. */
export const SLOT_ITEM_TYPES: Record<Slot, string[]> = {
  main_hand: ["sword", "axe", "staff", "bow"],
  off_hand: ["dagger", "shield", "tome", "quiver"],
  helmet: ["helm", "cap", "crown", "hood"],
  chest: ["plate", "robe", "tunic", "mail"],
  gloves: ["gauntlets", "gloves", "wraps", "mitts"],
  legs: ["greaves", "leggings", "trousers", "chaps"],
  shoes: ["boots", "slippers", "sandals", "sabatons"],
  ring1: ["ring", "band", "signet", "loop"],
  ring2: ["ring", "band", "signet", "loop"],
};

/** Quality tiers ordered worst to best. */
export const QUAL = [
  "broken",
  "worn",
  "crude",
  "poor",
  "common",
  "fine",
  "superior",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "ancient",
  "celestial",
  "void",
  "divine",
] as const;

/** Adjectives keyed by primary stat — used in "itemType of adjective" naming. */
export const STAT_ADJECTIVES: Record<keyof GearStats, string[]> = {
  dps:        ["destruction", "fury", "carnage", "ruin", "slaughter"],
  maxHp:      ["fortitude", "endurance", "resilience", "the bear", "the ox"],
  clickBonus: ["impact", "the fist", "striking", "force"],
  defense:    ["warding", "protection", "bulwark", "the shield"],
  critChance: ["sharpness", "cruelty", "the hawk", "the viper"],
  goldBonus:  ["greed", "fortune", "avarice", "wealth"],
  xpBonus:    ["wisdom", "the sage", "learning", "insight"],
  lifesteal:  ["vampirism", "draining", "the leech", "hunger"],
  haste:      ["swiftness", "alacrity", "the wind", "the zephyr"],
};

/** Base drop-weight curve; index 0 = max available tier, higher index = farther below max. */
export const DROP_WEIGHTS = [30, 22, 16, 12, 8, 5, 4, 2, 1, 0.5, 0.3, 0.15, 0.08, 0.04, 0.02];

/** Base damage value for each quality tier before depth scaling (retained for cost reference). */
export const DAMAGE_BY_QUALITY: Record<string, number> = {
  broken: 1,
  worn: 2,
  crude: 4,
  poor: 7,
  common: 11,
  fine: 17,
  superior: 25,
  rare: 36,
  epic: 52,
  legendary: 75,
  mythic: 110,
  ancient: 160,
  celestial: 230,
  void: 335,
  divine: 480,
};

/** Base gold cost for each quality tier before depth scaling. */
export const COST_BY_QUALITY: Record<string, number> = {
  broken: 3,
  worn: 8,
  crude: 18,
  poor: 35,
  common: 60,
  fine: 100,
  superior: 160,
  rare: 260,
  epic: 420,
  legendary: 680,
  mythic: 1_100,
  ancient: 1_750,
  celestial: 2_800,
  void: 4_500,
  divine: 7_200,
};

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

/** CSS class name for each quality tier, used by the loot renderer. */
export const QUALITY_CLASSES: Record<string, string> = {
  broken:    "q-broken",
  worn:      "q-worn",
  crude:     "q-crude",
  poor:      "q-poor",
  common:    "q-common",
  fine:      "q-fine",
  superior:  "q-superior",
  rare:      "q-rare",
  epic:      "q-epic",
  legendary: "q-legendary",
  mythic:    "q-mythic",
  ancient:   "q-ancient",
  celestial: "q-celestial",
  void:      "q-void",
  divine:    "q-divine",
};

/** Returns the CSS class for a quality string, defaulting to q-common for unknown values. */
export function qualityClass(quality: string): string {
  return QUALITY_CLASSES[quality] ?? "q-common";
}

/** Damage and cost multiplier derived from dungeon depth: +25% per 5 floors. */
export function gearLevelScale(level: number): number {
  return 1 + Math.floor(level / 5) * 0.25;
}

/** Index into QUAL of the highest tier the Auto Seller may target at this floor (never divine). */
export function autoSellThreshold(highestLevel: number): number {
  return Math.min(Math.floor((highestLevel - 1) / 4), QUAL.length - 2);
}

/** Stat bonuses a gear item can contribute to the equipped character. */
export interface GearStats {
  /** Passive DPS contribution. */
  dps?: number;
  /** Max health bonus (current health also increases when equipping). */
  maxHp?: number;
  /** Flat click damage bonus. */
  clickBonus?: number;
  /** Additive damage reduction (0–1). */
  defense?: number;
  /** Additive XP multiplier bonus. */
  xpBonus?: number;
  /** Per-tick crit probability (0–1). */
  critChance?: number;
  /** Additive gold drop multiplier. */
  goldBonus?: number;
  /** Fraction of damage dealt returned as healing (0–1). */
  lifesteal?: number;
  /** Additive passive DPS rate multiplier. */
  haste?: number;
}

/** Per-stat base values at each quality tier (index matches QUAL order). */
const STAT_SCALE: Record<keyof GearStats, number[]> = {
  dps:        [1,2,4,7,11,17,25,36,52,75,110,160,230,335,480],
  maxHp:      [4,8,15,25,40,60,90,130,180,260,380,540,780,1100,1500],
  clickBonus: [0.5,1,2,3.5,5.5,8,12,18,26,38,55,80,115,168,240],
  defense:    [0.01,0.01,0.02,0.02,0.03,0.03,0.04,0.05,0.06,0.07,0.08,0.10,0.12,0.15,0.18],
  xpBonus:    [0.01,0.02,0.02,0.03,0.03,0.04,0.05,0.06,0.07,0.09,0.11,0.13,0.15,0.18,0.20],
  critChance: [0.01,0.01,0.02,0.02,0.03,0.03,0.04,0.05,0.06,0.07,0.09,0.11,0.13,0.16,0.20],
  goldBonus:  [0.01,0.02,0.02,0.03,0.04,0.05,0.06,0.08,0.10,0.12,0.15,0.18,0.22,0.27,0.30],
  lifesteal:  [0.005,0.005,0.01,0.01,0.015,0.02,0.025,0.03,0.04,0.05,0.06,0.07,0.08,0.09,0.10],
  haste:      [0.01,0.01,0.02,0.02,0.03,0.04,0.05,0.06,0.07,0.09,0.11,0.13,0.15,0.18,0.20],
};

/** Stats that scale with dungeon level (numeric); percentage stats do not scale. */
const NUMERIC_STATS = new Set<keyof GearStats>(["dps", "maxHp", "clickBonus"]);

/** Weighted probability of each stat rolling on each slot. */
const SLOT_STAT_WEIGHTS: Record<Slot, Partial<Record<keyof GearStats, number>>> = {
  main_hand: { dps:50, critChance:20, clickBonus:15, haste:10, lifesteal:5 },
  off_hand:  { dps:25, defense:35, maxHp:20, haste:10, lifesteal:10 },
  helmet:    { maxHp:35, defense:20, critChance:15, xpBonus:20, goldBonus:10 },
  chest:     { maxHp:50, defense:30, lifesteal:15, haste:5 },
  gloves:    { clickBonus:40, critChance:25, dps:20, haste:15 },
  legs:      { maxHp:40, defense:25, haste:20, lifesteal:15 },
  shoes:     { haste:35, xpBonus:30, goldBonus:25, defense:10 },
  ring1:     { dps:15, maxHp:15, critChance:20, goldBonus:20, xpBonus:15, lifesteal:15 },
  ring2:     { dps:15, maxHp:15, critChance:20, goldBonus:20, xpBonus:15, lifesteal:15 },
};

/** Number of stat rolls based on quality tier index. Sub-common (< index 4) always roll 1. */
function getRollCount(qualityIdx: number): number {
  if (qualityIdx <= 3) return 1;                               // broken, worn, crude, poor
  if (qualityIdx <= 6) return Math.random() < 0.5 ? 1 : 2;   // common, fine, superior
  if (qualityIdx <= 8) return 2;                               // rare, epic
  if (qualityIdx <= 10) return Math.random() < 0.5 ? 2 : 3;  // legendary, mythic
  return 3;                                                    // ancient+
}

/** Rolls 1–3 stat bonuses for a gear item based on slot, quality, and dungeon level.
 *  Returns the stats and the primary (first-rolled) stat key. */
function rollStats(slot: Slot, quality: string, dungeonLevel: number): { stats: GearStats; primaryStat: keyof GearStats } {
  const qIdx = QUAL.indexOf(quality as typeof QUAL[number]);
  const rollCount = getRollCount(qIdx < 0 ? 4 : qIdx);
  const pool = { ...SLOT_STAT_WEIGHTS[slot] } as Record<keyof GearStats, number>;
  const scale = gearLevelScale(dungeonLevel);
  const result: GearStats = {};
  let primaryStat: keyof GearStats = "dps";

  for (let i = 0; i < rollCount; i++) {
    const keys = Object.keys(pool) as (keyof GearStats)[];
    if (keys.length === 0) break;
    const stat = weightedPick(keys, keys.map(k => pool[k] ?? 0));
    if (i === 0) primaryStat = stat;
    delete pool[stat];
    const base = qIdx >= 0 ? STAT_SCALE[stat][qIdx] : (STAT_SCALE[stat][4]);
    result[stat] = NUMERIC_STATS.has(stat)
      ? Math.ceil(base * scale) as never
      : base as never;
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

/** Definition of a named gear set with slot requirements and stat bonuses. */
export interface SetDef {
  /** Unique identifier (snake_case). */
  id: string;
  /** Display name shown in UI. */
  name: string;
  /** Accent color for set borders and highlights (hex). */
  color: string;
  /** The three slots that make up this set. */
  slots: Slot[];
  /** Stat bonus applied when 2 pieces are equipped. */
  bonus2pc: GearStats;
  /** Additional stat bonus applied when all 3 pieces are equipped. */
  bonus3pc: GearStats;
  /** Optional engine-level effect key triggered by the 3-piece bonus. */
  effect3pc?: string;
}

/** The four named gear sets. */
export const SET_DEFS: SetDef[] = [
  {
    id: "shadowbane",
    name: "Shadowbane",
    color: "#c77dff",
    slots: ["helmet", "gloves", "shoes"],
    bonus2pc: { critChance: 0.15 },
    bonus3pc: { haste: 0.15 },
  },
  {
    id: "iron_bulwark",
    name: "Iron Bulwark",
    color: "#48cae4",
    slots: ["chest", "legs", "off_hand"],
    bonus2pc: { maxHp: 100 },
    bonus3pc: { defense: 0.15 },
  },
  {
    id: "plunderers_kit",
    name: "Plunderer's Kit",
    color: "#ffd166",
    slots: ["main_hand", "ring1", "ring2"],
    bonus2pc: { goldBonus: 0.20 },
    bonus3pc: { goldBonus: 0.10 },
    effect3pc: "elite_rune",
  },
  {
    id: "warlords_grasp",
    name: "Warlord's Grasp",
    color: "#ef233c",
    slots: ["main_hand", "chest", "helmet"],
    bonus2pc: { haste: 0.10 },
    bonus3pc: {},
    effect3pc: "cooldown_reset",
  },
];

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
}

/** A single piece of loot with slot, quality, and depth-scaled stats. */
export class GearItem {
  /** Equipment slot this item occupies. */
  readonly slot: Slot;
  /** Specific item type name (e.g. "sword", "hood"). */
  readonly itemType: string;
  /** Quality tier name (e.g. "rare"). */
  readonly quality: string;
  /** Flavor adjective in the item name. */
  readonly adjective: string;
  /** All stat bonuses this item grants when equipped. */
  readonly stats: GearStats;
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
    quality: string,
    adjective: string,
    statsOrLevel: GearStats | number = 1,
    dungeonLevel?: number,
    setName?: string,
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
    this.stats = isNum
      ? { dps: Math.ceil(DAMAGE_BY_QUALITY[quality] * scale) }
      : (statsOrLevel as GearStats);
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
    };
  }

  /** Reconstructs a GearItem from its serialized form, migrating old saves that have damage but no stats. */
  static fromDict(d: GearItemDict & { damage?: number; stats?: GearStats }): GearItem {
    const stats: GearStats = d.stats ?? (d.damage !== undefined ? { dps: d.damage } : {});
    return new GearItem(d.slot, d.item_type, d.quality, d.adjective, stats, d.dungeon_level ?? 1, d.set_name);
  }
}

/** Returns a uniformly random element from an array. */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns a random element sampled proportionally to the provided weights. */
function weightedPick<T>(arr: readonly T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

/** ring2 is never an explicit drop; inventory spill logic handles the second ring slot. */
const DROP_SLOTS = SLOTS.filter(s => s !== "ring2");

/** Generates a random loot drop for the given floor, optionally forcing a specific slot. */
export function getItem(slot?: Slot, dungeonLevel = 1): GearItem {
  const effectiveSlot: Slot = slot === "ring2" ? "ring1" : (slot ?? pick(DROP_SLOTS));
  const itemType = pick(SLOT_ITEM_TYPES[effectiveSlot]);
  const quality = weightedPick(QUAL, qualityWeights(dungeonLevel));
  const { stats, primaryStat } = rollStats(effectiveSlot, quality, dungeonLevel);
  const adjective = pick(STAT_ADJECTIVES[primaryStat]);
  return new GearItem(effectiveSlot, itemType, quality, adjective, stats, dungeonLevel);
}

/** Convenience wrapper — generates a random main-hand weapon. */
export function getWeapon(): GearItem {
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
export function getSetItem(setId: string, slot: Slot, dungeonLevel = 1): GearItem {
  const def = SET_DEFS.find(d => d.id === setId)!;
  const effectiveSlot: Slot = slot === "ring2" ? "ring1" : slot;
  const itemType = pick(SLOT_ITEM_TYPES[effectiveSlot]);
  const minQualIdx = QUAL.indexOf("rare");
  // Zero out sub-rare weights; ensure rare always has at least weight 1 even at low dungeon levels
  const weights = qualityWeights(dungeonLevel).map((w, i) => {
    if (i < minQualIdx) return 0;
    if (i === minQualIdx) return Math.max(w, 1.0);
    return w;
  });
  const quality = weightedPick(QUAL, weights);
  const { stats, primaryStat } = rollStats(effectiveSlot, quality, dungeonLevel);
  const adjective = pick(STAT_ADJECTIVES[primaryStat]);
  return new GearItem(effectiveSlot, itemType, quality, adjective, stats, dungeonLevel, def.name);
}

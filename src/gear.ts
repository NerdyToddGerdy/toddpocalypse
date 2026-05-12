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

/** Flavor adjectives appended to gear names. */
export const ADJ = [
  "awesomeness",
  "gentleness",
  "hilarity",
  "shyness",
  "destruction",
  "valor",
  "cunning",
];

/** Base drop-weight curve; index 0 = max available tier, higher index = farther below max. */
export const DROP_WEIGHTS = [30, 22, 16, 12, 8, 5, 4, 2, 1, 0.5, 0.3, 0.15, 0.08, 0.04, 0.02];

/** Base damage value for each quality tier before depth scaling. */
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

/** Returns per-tier drop weights for the given dungeon floor; tiers above the current max get weight 0. */
export function qualityWeights(dungeonLevel: number): number[] {
  const maxTier = Math.min(3 + Math.floor(dungeonLevel / 4), QUAL.length - 1);
  return QUAL.map((_, i) => {
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

/** Serialized, plain-object form of a {@link GearItem}. */
export interface GearItemDict {
  slot: Slot;
  slot_display: string;
  name: string;
  quality: string;
  item_type: string;
  adjective: string;
  damage: number;
  cost: number;
  sell_value: number;
  dungeon_level: number;
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
  /** Scaled DPS contribution when equipped. */
  readonly damage: number;
  /** Gold cost to buy from a shop (currently unused in UI but tracked). */
  readonly cost: number;
  /** Gold received when selling. */
  readonly sellValue: number;
  /** Dungeon floor at which this item dropped, used for damage scaling. */
  readonly dungeonLevel: number;

  constructor(slot: Slot, itemType: string, quality: string, adjective: string, dungeonLevel = 1) {
    const scale = gearLevelScale(dungeonLevel);
    this.slot = slot;
    this.itemType = itemType;
    this.quality = quality;
    this.adjective = adjective;
    this.dungeonLevel = dungeonLevel;
    this.damage = Math.ceil(DAMAGE_BY_QUALITY[quality] * scale);
    this.cost = Math.ceil(COST_BY_QUALITY[quality] * scale);
    this.sellValue = Math.max(1, Math.floor(this.cost / 3));
  }

  /** Returns the display name in "quality itemType of adjective" format. */
  getName(): string {
    return `${this.quality} ${this.itemType} of ${this.adjective}`;
  }

  /** Serializes to a plain object safe for JSON. */
  toDict(): GearItemDict {
    return {
      slot: this.slot,
      slot_display: SLOT_DISPLAY[this.slot],
      name: this.getName(),
      quality: this.quality,
      item_type: this.itemType,
      adjective: this.adjective,
      damage: this.damage,
      cost: this.cost,
      sell_value: this.sellValue,
      dungeon_level: this.dungeonLevel,
    };
  }

  /** Reconstructs a GearItem from its serialized form. */
  static fromDict(d: GearItemDict): GearItem {
    return new GearItem(d.slot, d.item_type, d.quality, d.adjective, d.dungeon_level ?? 1);
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
  const adjective = pick(ADJ);
  return new GearItem(effectiveSlot, itemType, quality, adjective, dungeonLevel);
}

/** Convenience wrapper — generates a random main-hand weapon. */
export function getWeapon(): GearItem {
  return getItem("main_hand");
}
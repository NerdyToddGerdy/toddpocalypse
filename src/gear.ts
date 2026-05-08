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

export type Slot = (typeof SLOTS)[number];

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
] as const;

export const ADJ = [
  "awesomeness",
  "gentleness",
  "hilarity",
  "shyness",
  "destruction",
  "valor",
  "cunning",
];

export const DROP_WEIGHTS = [30, 22, 16, 12, 8, 5, 4, 2, 1, 0.5];

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
};

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
};

export function qualityWeights(dungeonLevel: number): number[] {
  const minTier = Math.min(Math.floor((dungeonLevel - 1) / 5), QUAL.length - 1);
  const maxTier = Math.min(3 + Math.floor(dungeonLevel / 5), QUAL.length - 1);
  return QUAL.map((_, i) => {
    if (i < minTier || i > maxTier) return 0;
    return DROP_WEIGHTS[i - minTier];
  });
}

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
};

export function qualityClass(quality: string): string {
  return QUALITY_CLASSES[quality] ?? "q-common";
}

export function gearLevelScale(level: number): number {
  return 1 + Math.floor(level / 5) * 0.25;
}

export function autoSellThreshold(highestLevel: number): number {
  return Math.min(Math.floor(highestLevel / 5), QUAL.length - 2);
}

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

export class GearItem {
  readonly slot: Slot;
  readonly itemType: string;
  readonly quality: string;
  readonly adjective: string;
  readonly damage: number;
  readonly cost: number;
  readonly sellValue: number;
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

  getName(): string {
    return `${this.quality} ${this.itemType} of ${this.adjective}`;
  }

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

  static fromDict(d: GearItemDict): GearItem {
    return new GearItem(d.slot, d.item_type, d.quality, d.adjective, d.dungeon_level ?? 1);
  }
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T>(arr: readonly T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

const DROP_SLOTS = SLOTS.filter(s => s !== "ring2");

export function getItem(slot?: Slot, dungeonLevel = 1): GearItem {
  // ring2 is never an explicit drop; inventory spill logic handles the second ring slot
  const effectiveSlot: Slot = slot === "ring2" ? "ring1" : (slot ?? pick(DROP_SLOTS));
  const itemType = pick(SLOT_ITEM_TYPES[effectiveSlot]);
  const quality = weightedPick(QUAL, qualityWeights(dungeonLevel));
  const adjective = pick(ADJ);
  return new GearItem(effectiveSlot, itemType, quality, adjective, dungeonLevel);
}

export function getWeapon(): GearItem {
  return getItem("main_hand");
}

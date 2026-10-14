// Gear tables (#61): slots, stats, stat rolls and named sets. Data only; gear.ts
// holds the rules that read them.

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

/** What each quality means, as one row per quality. */
export interface QualityRow {
  quality: string;
  /** Base damage before depth scaling (kept as the cost reference). */
  damage: number;
  /** Base gold cost before depth scaling. */
  cost: number;
}

/**
 * The quality ladder, worst to best: the row a drop's quality roll lands on.
 * A new quality is a new row here (and a column in STAT_SCALE and DROP_WEIGHTS).
 */
export const QUALITY_TABLE = [
  { quality: "broken",    damage: 1,   cost: 3 },
  { quality: "worn",      damage: 2,   cost: 8 },
  { quality: "crude",     damage: 4,   cost: 18 },
  { quality: "poor",      damage: 7,   cost: 35 },
  { quality: "common",    damage: 11,  cost: 60 },
  { quality: "fine",      damage: 17,  cost: 100 },
  { quality: "superior",  damage: 25,  cost: 160 },
  { quality: "rare",      damage: 36,  cost: 260 },
  { quality: "epic",      damage: 52,  cost: 420 },
  { quality: "legendary", damage: 75,  cost: 680 },
  { quality: "mythic",    damage: 110, cost: 1_100 },
  { quality: "ancient",   damage: 160, cost: 1_750 },
  { quality: "celestial", damage: 230, cost: 2_800 },
  { quality: "void",      damage: 335, cost: 4_500 },
  { quality: "divine",    damage: 480, cost: 7_200 },
] as const satisfies readonly QualityRow[];

/** Union of valid quality tier names. */
export type Quality = (typeof QUALITY_TABLE)[number]["quality"];

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

/** Per-stat base values at each quality tier (index matches QUAL order). */
export const STAT_SCALE: Record<keyof GearStats, number[]> = {
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

/** Weighted probability of each stat rolling on each slot. */
export const SLOT_STAT_WEIGHTS: Record<Slot, Partial<Record<keyof GearStats, number>>> = {
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

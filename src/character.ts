import { Inventory, type InventoryDict } from "./inventory.js";
import { GearItem, SET_DEFS, type GearStats, type Slot } from "./gear.js";
import { type ArtifactInstance, LEGACY_UPGRADED_MAP, type ArtifactEffectId } from "./artifacts.js";

/** A socketed rune that grants a flat stat bonus to the wearer. */
export interface Rune {
  id: string;
  name: string;
  type: string;
  tier: "lesser" | "greater" | "flawless" | "ancient";
  statKey: string;
  value: number;
}

/** Maps job-number codes (used by legacy Python save format) to class name strings. */
const SWITCHER: Record<number, string> = {
  1: "fighter",
  2: "rogue",
  3: "mage",
};

/** Display and unlock metadata for a single class ability. */
export interface AbilityMeta {
  /** Character level at which this ability unlocks. */
  level: number;
  /** Internal identifier used to check if a character has the ability. */
  id: string;
  /** Short display name shown on the ability badge. */
  name: string;
  /** One-line description shown in the tooltip. */
  desc: string;
  /** Emoji icon rendered on the badge. */
  icon: string;
}

/** Ability definitions for each class, in unlock-level order. */
export const CLASS_ABILITIES: Record<string, AbilityMeta[]> = {
  fighter: [
    { level: 5,  id: "iron_skin",       name: "Iron Skin",       desc: "20% damage reduction",          icon: "🛡" },
    { level: 10, id: "bloodlust",        name: "Bloodlust",       desc: "+60% DPS at ≤50% HP",           icon: "🩸" },
    { level: 20, id: "battle_standard",  name: "Battle Standard", desc: "Party members +10% DPS",        icon: "🚩" },
  ],
  rogue: [
    { level: 5,  id: "lucky_strike",    name: "Lucky Strike",    desc: "25% click crit (3× dmg)",       icon: "🎯" },
    { level: 10, id: "blade_mastery",   name: "Blade Mastery",   desc: "Passive DPS +50%",               icon: "⚔" },
    { level: 20, id: "expose_weakness", name: "Expose Weakness", desc: "Enemy takes +25% dmg",           icon: "💀" },
  ],
  mage: [
    { level: 5,  id: "arcane_study",    name: "Arcane Study",    desc: "Party XP +25%",                  icon: "📚" },
    { level: 10, id: "mana_surge",      name: "Mana Surge",      desc: "Auto-burst 5× DPS every 20s",   icon: "⚡" },
    { level: 20, id: "empower",         name: "Empower",         desc: "All click damage ×2",            icon: "✨" },
  ],
  paladin: [
    { level: 5,  id: "sacred_shield",   name: "Sacred Shield",   desc: "25% damage reduction",          icon: "🛡" },
    { level: 10, id: "holy_light",      name: "Holy Light",      desc: "Party heals 5 HP on kill",       icon: "✝" },
    { level: 20, id: "divine_wrath",    name: "Divine Wrath",    desc: "+15% party DPS when ally falls", icon: "⚜" },
  ],
  ranger: [
    { level: 5,  id: "eagle_eye",       name: "Eagle Eye",       desc: "30% click crit (2× dmg)",       icon: "🦅" },
    { level: 10, id: "swift_quiver",    name: "Swift Quiver",    desc: "Passive DPS +60%",               icon: "🏹" },
    { level: 20, id: "hunters_mark",    name: "Hunter's Mark",   desc: "Enemy takes +20% dmg",           icon: "🎯" },
  ],
  druid: [
    { level: 5,  id: "regrowth",        name: "Regrowth",        desc: "Party gains 5% lifesteal",       icon: "🌿" },
    { level: 10, id: "thornwall",       name: "Thornwall",       desc: "Passive DPS +40%",               icon: "🌱" },
    { level: 20, id: "wild_growth",     name: "Wild Growth",     desc: "Party heals 2% max HP per kill", icon: "🍀" },
  ],
};

/** Base idle DPS per class before any level-ups or gear. */
const BASE_DPS: Record<string, number> = {
  fighter: 2.0,
  rogue: 1.5,
  mage: 1.0,
  paladin: 1.7,
  ranger: 1.5,
  druid: 1.3,
};

/** Per-level-up stat bonuses for each class. */
interface LevelUpBonuses {
  /** Multiplicative DPS scaling applied each level. */
  dpsMult: number;
  /** Flat click damage added each level. */
  clickBonus: number;
  /** XP multiplier added each level. */
  xpMultiplier: number;
}

/** Level-up bonus definitions per class. */
const LEVEL_UP: Record<string, LevelUpBonuses> = {
  fighter: { dpsMult: 1.2,  clickBonus: 0.0, xpMultiplier: 0.0 },
  rogue:   { dpsMult: 1.15, clickBonus: 0.3, xpMultiplier: 0.0 },
  mage:    { dpsMult: 1.1,  clickBonus: 0.0, xpMultiplier: 0.05 },
  paladin: { dpsMult: 1.16, clickBonus: 0.0, xpMultiplier: 0.0 },
  ranger:  { dpsMult: 1.18, clickBonus: 0.2, xpMultiplier: 0.0 },
  druid:   { dpsMult: 1.13, clickBonus: 0.0, xpMultiplier: 0.0 },
};

/** HP gained per character level-up. */
export const HP_PER_LEVEL = 10;

/** Fraction of missing HP restored on level-up. */
export const LEVELUP_HEAL_FRACTION = 0.50;

/** Maps a legacy job number (1–3) to a class name string, or null if unknown. */
export function switchClass(jobNumber: number): string | null {
  return SWITCHER[jobNumber] ?? null;
}

/** Serialized, plain-object form of a {@link Character}. */
export interface CharacterDict {
  name: string;
  character_class: string;
  level: number;
  dps: number;
  xp: number;
  xp_to_next: number;
  xp_multiplier: number;
  click_bonus: number;
  health: number;
  max_health: number;
  equipment: InventoryDict;
  abilities: string[];
  damage_reduction: number;
  crit_chance: number;
  gold_bonus: number;
  lifesteal: number;
  haste: number;
  runes?: Partial<Record<Slot, Rune>>;
  applied_set_bonuses?: Record<string, GearStats>;
  locked_slots?: string[];
  artifact_slots?: (ArtifactInstance | null)[];
}

/** A player character or companion with class stats, equipment, and abilities. */
export class Character {
  /** Display name shown in the party card and combat log. */
  name: string;
  /** Class identifier (e.g. "fighter", "mage"). */
  characterClass: string;
  /** Current character level. */
  level: number;
  /** Equipped gear slots. */
  inventory: Inventory;
  /** Accumulated XP toward the next level. */
  xp: number;
  /** XP required to reach the next level. */
  xpToNext: number;
  /** Current passive DPS output including gear and abilities. */
  dps: number;
  /** Multiplier applied to all XP gained. */
  xpMultiplier: number;
  /** Flat damage added per manual click. */
  clickBonus: number;
  /** Maximum HP (increases with level and hp upgrades). */
  maxHealth: number;
  /** Current HP; 0 means dead until party respawn. */
  health: number;
  /** Ids of unlocked ability effects. */
  abilities: string[] = [];
  /** Fraction of incoming damage negated (0–1). */
  damageReduction = 0;
  /** Per-tick probability of dealing double damage (0–1). */
  critChance = 0;
  /** Additive bonus to gold dropped by enemies (0 = no bonus). */
  goldBonus = 0;
  /** Fraction of damage dealt returned as HP (0–1). */
  lifesteal = 0;
  /** Additive multiplier on passive DPS tick rate (0 = no bonus). */
  haste = 0;
  /** Rune socketed into each gear slot (null if empty). */
  runes: Partial<Record<Slot, Rune>> = {};
  /** Currently applied named-set stat bonuses, keyed by set id. Used for reversal on recompute. */
  appliedSetBonuses: Record<string, GearStats> = {};
  /** Gear slots the player has locked against automatic replacement. */
  lockedSlots: Set<Slot> = new Set();
  /** Leveled artifacts equipped in each of the 3 artifact slots (null = empty). */
  artifactSlots: (ArtifactInstance | null)[] = [null, null, null];
  /** Seconds accumulated toward the next Mana Surge burst. */
  surgeTimer = 0;
  /** Party-wide ability effects queued to apply after the current enemy dies. */
  pendingPartyAbilities: string[] = [];

  constructor(name: string, characterClass: string, level = 1) {
    this.name = name;
    this.characterClass = characterClass;
    this.level = level;
    this.inventory = new Inventory();
    this.xp = 0;
    this.xpToNext = 10;
    this.dps = BASE_DPS[characterClass] ?? 1.0;
    this.xpMultiplier = 1.0;
    this.clickBonus = 0.0;
    this.maxHealth = 100;
    this.health = this.maxHealth;
  }

  /** Returns true if this character has HP remaining. */
  isAlive(): boolean {
    return this.health > 0;
  }

  /** Equips an item, applying all stat deltas, and returns the displaced item (or null). */
  equipItem(item: GearItem): GearItem | null {
    const old = this.inventory.equip(item);
    if (old) this.removeStats(old.stats);
    this.applyStats(item.stats);
    return old;
  }

  /** Sockets a rune into the given slot, applying its stat. Returns the old rune (or null). */
  applyRune(slot: Slot, rune: Rune): Rune | null {
    const old = this.runes[slot] ?? null;
    if (old) this.subtractRune(old);
    this.runes[slot] = rune;
    this.addRune(rune);
    return old;
  }

  /** Removes the rune from the given slot, reversing its stat. Returns the removed rune (or null). */
  removeRune(slot: Slot): Rune | null {
    const old = this.runes[slot] ?? null;
    if (old) {
      this.subtractRune(old);
      delete this.runes[slot];
    }
    return old;
  }

  private addRune(rune: Rune): void {
    this.applyRuneDelta(rune, 1);
  }

  private subtractRune(rune: Rune): void {
    this.applyRuneDelta(rune, -1);
  }

  private applyRuneDelta(rune: Rune, sign: 1 | -1): void {
    const v = rune.value * sign;
    switch (rune.statKey) {
      case "dps":          this.dps += v; break;
      case "maxHp":        this.maxHealth += v; this.health = Math.min(sign > 0 ? this.health + v : this.health, this.maxHealth); break;
      case "haste":        this.haste += v; break;
      case "goldBonus":    this.goldBonus += v; break;
      case "xpMultiplier": this.xpMultiplier += v; break;
      case "critChance":   this.critChance += v; break;
    }
  }

  /** Adds all stat bonuses from a GearStats object to this character. */
  private applyStats(s: import("./gear.js").GearStats): void {
    this.applyStatsDelta(s, 1);
  }

  /** Removes all stat bonuses from a GearStats object from this character. */
  private removeStats(s: import("./gear.js").GearStats): void {
    this.applyStatsDelta(s, -1);
  }

  private applyStatsDelta(s: import("./gear.js").GearStats, sign: 1 | -1): void {
    this.dps += (s.dps ?? 0) * sign;
    const hp = (s.maxHp ?? 0) * sign;
    this.maxHealth += hp;
    this.health = Math.min(sign > 0 ? this.health + hp : this.health, this.maxHealth);
    this.clickBonus += (s.clickBonus ?? 0) * sign;
    this.damageReduction = Math.max(0, Math.min(0.95, this.damageReduction + (s.defense ?? 0) * sign));
    this.xpMultiplier += (s.xpBonus ?? 0) * sign;
    this.critChance += (s.critChance ?? 0) * sign;
    this.goldBonus += (s.goldBonus ?? 0) * sign;
    this.lifesteal += (s.lifesteal ?? 0) * sign;
    this.haste += (s.haste ?? 0) * sign;
  }

  /** Recomputes named-set bonuses from the current inventory and applies the delta.
   *  Call this after any inventory change (equip, unequip, restore from save). */
  recomputeSetBonuses(): void {
    // Reverse previous bonuses
    for (const bonus of Object.values(this.appliedSetBonuses)) {
      this.removeStats(bonus);
    }
    this.appliedSetBonuses = {};

    // Count equipped pieces per set name
    const counts: Record<string, number> = {};
    for (const item of this.inventory.equippedItems()) {
      if (item.setName) counts[item.setName] = (counts[item.setName] ?? 0) + 1;
    }

    // Apply bonuses for each set
    for (const def of SET_DEFS) {
      const count = counts[def.name] ?? 0;
      if (count < 2) continue;
      const newBonus: GearStats = { ...def.bonus2pc };
      if (count >= 3) {
        for (const [k, v] of Object.entries(def.bonus3pc) as [keyof GearStats, number][]) {
          (newBonus[k] as number) = ((newBonus[k] as number) ?? 0) + v;
        }
      }
      if (Object.keys(newBonus).length > 0) {
        this.appliedSetBonuses[def.id] = newBonus;
        this.applyStats(newBonus);
      }
    }
  }

  /** Adds XP scaled by xpMultiplier and triggers level-ups until XP is consumed. */
  gainXp(amount: number): void {
    this.xp += Math.floor(amount * this.xpMultiplier);
    while (this.xp >= this.xpToNext) {
      this.levelUp();
    }
  }

  /** Increments level, applies class bonuses, and unlocks any ability at the new level. */
  levelUp(): void {
    this.level += 1;
    this.xp -= this.xpToNext;
    this.xpToNext = Math.floor(this.xpToNext * 1.5);
    const bonuses = LEVEL_UP[this.characterClass] ?? LEVEL_UP.fighter;
    this.dps *= bonuses.dpsMult;
    this.clickBonus += bonuses.clickBonus;
    this.xpMultiplier += bonuses.xpMultiplier;
    this.maxHealth += HP_PER_LEVEL;
    this.health = Math.min(this.maxHealth, this.health + (this.maxHealth - this.health) * LEVELUP_HEAL_FRACTION);

    const unlock = CLASS_ABILITIES[this.characterClass]?.find(a => a.level === this.level);
    if (unlock) {
      this.abilities.push(unlock.id);
      this.applyAbilityEffect(unlock.id);
    }
  }

  /** Applies the immediate stat effect of a newly unlocked ability; party effects are deferred. */
  private applyAbilityEffect(id: string): void {
    if (id === "iron_skin") {
      this.damageReduction = 0.2;
    } else if (id === "sacred_shield") {
      this.damageReduction = 0.25;
    } else if (id === "blade_mastery") {
      this.dps *= 1.5;
    } else if (id === "swift_quiver") {
      this.dps *= 1.6;
    } else if (id === "battle_standard" || id === "arcane_study" || id === "holy_light") {
      this.pendingPartyAbilities.push(id);
    }
  }

  /** Serializes to a plain object safe for JSON. */
  toDict(): CharacterDict {
    return {
      name: this.name,
      character_class: this.characterClass,
      level: this.level,
      dps: Math.round(this.dps * 100) / 100,
      xp: this.xp,
      xp_to_next: this.xpToNext,
      xp_multiplier: Math.round(this.xpMultiplier * 1000) / 1000,
      click_bonus: Math.round(this.clickBonus * 100) / 100,
      health: this.health,
      max_health: this.maxHealth,
      equipment: this.inventory.toDict(),
      abilities: [...this.abilities],
      damage_reduction: this.damageReduction,
      crit_chance: Math.round(this.critChance * 10000) / 10000,
      gold_bonus: Math.round(this.goldBonus * 10000) / 10000,
      lifesteal: Math.round(this.lifesteal * 10000) / 10000,
      haste: Math.round(this.haste * 10000) / 10000,
      runes: Object.keys(this.runes).length > 0 ? { ...this.runes } : undefined,
      applied_set_bonuses: Object.keys(this.appliedSetBonuses).length > 0 ? { ...this.appliedSetBonuses } : undefined,
      locked_slots: this.lockedSlots.size > 0 ? [...this.lockedSlots] : undefined,
      artifact_slots: this.artifactSlots.map(s => s ? { id: s.id, level: s.level, fuel: s.fuel } : null),
    };
  }

  /** Reconstructs a Character from its serialized form. */
  static fromDict(d: CharacterDict): Character {
    const c = new Character(d.name, d.character_class, d.level);
    c.dps = d.dps;
    c.xp = d.xp;
    c.xpToNext = d.xp_to_next;
    c.xpMultiplier = d.xp_multiplier;
    c.clickBonus = d.click_bonus;
    c.health = d.health;
    c.maxHealth = d.max_health;
    c.abilities = [...(d.abilities ?? [])];
    c.damageReduction = d.damage_reduction ?? 0;
    c.critChance = d.crit_chance ?? 0;
    c.goldBonus = d.gold_bonus ?? 0;
    c.lifesteal = d.lifesteal ?? 0;
    c.haste = d.haste ?? 0;
    for (const [slot, item] of Object.entries(d.equipment)) {
      if (item) {
        c.inventory.slots[slot as keyof typeof c.inventory.slots] = GearItem.fromDict(item);
      }
    }
    // Restore rune map without re-applying stats (stats are already baked into serialized values)
    if (d.runes) {
      for (const [slot, rune] of Object.entries(d.runes)) {
        if (rune) c.runes[slot as Slot] = rune;
      }
    }
    // Restore applied set bonuses without re-applying (baked into serialized stat fields)
    if (d.applied_set_bonuses) {
      c.appliedSetBonuses = { ...d.applied_set_bonuses };
    }
    if (d.locked_slots) {
      c.lockedSlots = new Set(d.locked_slots as Slot[]);
    }
    c.artifactSlots = (d.artifact_slots ?? [null, null, null]).map(s => {
      if (!s) return null;
      if (typeof s === "string") {
        return LEGACY_UPGRADED_MAP[s]
          ? { ...LEGACY_UPGRADED_MAP[s], fuel: 0 }
          : { id: s as ArtifactEffectId, level: 0, fuel: 0 };
      }
      return LEGACY_UPGRADED_MAP[s.id] !== undefined && s.level === 0
        ? { ...LEGACY_UPGRADED_MAP[s.id], fuel: s.fuel ?? 0 }
        : { id: s.id as ArtifactEffectId, level: s.level ?? 0, fuel: s.fuel ?? 0 };
    });
    return c;
  }
}

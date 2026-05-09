import { Inventory, type InventoryDict } from "./inventory.js";
import { GearItem } from "./gear.js";

const SWITCHER: Record<number, string> = {
  1: "fighter",
  2: "rogue",
  3: "mage",
};

export interface AbilityMeta {
  level: number;
  id: string;
  name: string;
  desc: string;
  icon: string;
}

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
};

const BASE_DPS: Record<string, number> = {
  fighter: 2.0,
  rogue: 1.5,
  mage: 1.0,
  paladin: 1.7,
  ranger: 1.5,
};

interface LevelUpBonuses {
  dpsMult: number;
  clickBonus: number;
  xpMultiplier: number;
}

const LEVEL_UP: Record<string, LevelUpBonuses> = {
  fighter: { dpsMult: 1.2,  clickBonus: 0.0, xpMultiplier: 0.0 },
  rogue:   { dpsMult: 1.15, clickBonus: 0.3, xpMultiplier: 0.0 },
  mage:    { dpsMult: 1.1,  clickBonus: 0.0, xpMultiplier: 0.05 },
  paladin: { dpsMult: 1.16, clickBonus: 0.0, xpMultiplier: 0.0 },
  ranger:  { dpsMult: 1.18, clickBonus: 0.2, xpMultiplier: 0.0 },
};

export const HP_PER_LEVEL = 10;

export function switchClass(jobNumber: number): string | null {
  return SWITCHER[jobNumber] ?? null;
}

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
}

export class Character {
  name: string;
  characterClass: string;
  level: number;
  inventory: Inventory;
  xp: number;
  xpToNext: number;
  dps: number;
  xpMultiplier: number;
  clickBonus: number;
  maxHealth: number;
  health: number;
  abilities: string[] = [];
  damageReduction = 0;
  surgeTimer = 0;
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

  isAlive(): boolean {
    return this.health > 0;
  }

  equipItem(item: GearItem): GearItem | null {
    const old = this.inventory.equip(item);
    if (old) this.dps -= old.damage;
    this.dps += item.damage;
    return old;
  }

  gainXp(amount: number): void {
    this.xp += Math.floor(amount * this.xpMultiplier);
    while (this.xp >= this.xpToNext) {
      this.levelUp();
    }
  }

  levelUp(): void {
    this.level += 1;
    this.xp -= this.xpToNext;
    this.xpToNext = Math.floor(this.xpToNext * 1.5);
    const bonuses = LEVEL_UP[this.characterClass] ?? LEVEL_UP.fighter;
    this.dps *= bonuses.dpsMult;
    this.clickBonus += bonuses.clickBonus;
    this.xpMultiplier += bonuses.xpMultiplier;
    this.maxHealth += HP_PER_LEVEL;
    this.health += HP_PER_LEVEL;

    const unlock = CLASS_ABILITIES[this.characterClass]?.find(a => a.level === this.level);
    if (unlock) {
      this.abilities.push(unlock.id);
      this.applyAbilityEffect(unlock.id);
    }
  }

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
    };
  }

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
    for (const [slot, item] of Object.entries(d.equipment)) {
      if (item) {
        c.inventory.slots[slot as keyof typeof c.inventory.slots] = GearItem.fromDict(item);
      }
    }
    return c;
  }
}

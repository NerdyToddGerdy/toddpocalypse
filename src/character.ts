import { Inventory, type InventoryDict } from "./inventory.js";
import { GearItem } from "./gear.js";

const SWITCHER: Record<number, string> = {
  1: "fighter",
  2: "rogue",
  3: "mage",
};

const BASE_DPS: Record<string, number> = {
  fighter: 2.0,
  rogue: 1.5,
  mage: 1.0,
};

interface LevelUpBonuses {
  dpsMult: number;
  clickBonus: number;
  xpMultiplier: number;
}

const LEVEL_UP: Record<string, LevelUpBonuses> = {
  fighter: { dpsMult: 1.2, clickBonus: 0.0, xpMultiplier: 0.0 },
  rogue: { dpsMult: 1.15, clickBonus: 0.3, xpMultiplier: 0.0 },
  mage: { dpsMult: 1.1, clickBonus: 0.0, xpMultiplier: 0.05 },
};

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
    for (const [slot, item] of Object.entries(d.equipment)) {
      if (item) {
        c.inventory.slots[slot as keyof typeof c.inventory.slots] = GearItem.fromDict(item);
      }
    }
    return c;
  }
}

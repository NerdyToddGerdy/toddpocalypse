// Class tables (#61): base stats, level-ups, abilities, skills and companion names.
// Data only; character.ts and engine.ts hold the rules that read them.

/** Maps job-number codes (used by legacy Python save format) to class name strings. */
export const SWITCHER: Record<number, string> = {
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
export const BASE_DPS: Record<string, number> = {
  fighter: 2.0,
  rogue: 1.5,
  mage: 1.0,
  paladin: 1.7,
  ranger: 1.5,
  druid: 1.3,
};

/** Per-level-up stat bonuses for each class. */
export interface LevelUpBonuses {
  /** Multiplicative DPS scaling applied each level. */
  dpsMult: number;
  /** Flat click damage added each level. */
  clickBonus: number;
  /** XP multiplier added each level. */
  xpMultiplier: number;
}

/** Level-up bonus definitions per class. */
export const LEVEL_UP: Record<string, LevelUpBonuses> = {
  fighter: { dpsMult: 1.2,  clickBonus: 0.0, xpMultiplier: 0.0 },
  rogue:   { dpsMult: 1.15, clickBonus: 0.3, xpMultiplier: 0.0 },
  mage:    { dpsMult: 1.1,  clickBonus: 0.0, xpMultiplier: 0.05 },
  paladin: { dpsMult: 1.16, clickBonus: 0.0, xpMultiplier: 0.0 },
  ranger:  { dpsMult: 1.18, clickBonus: 0.2, xpMultiplier: 0.0 },
  druid:   { dpsMult: 1.13, clickBonus: 0.0, xpMultiplier: 0.0 },
};

/** Cooldown and duration (in kills) and the class each active combat skill belongs to. */
export const SKILL_DEFS: Record<string, { cooldownKills: number; durationKills: number; class: string }> = {
  skill_battle_cry:    { cooldownKills: 20, durationKills: 8, class: "fighter" },
  skill_shadow_strike: { cooldownKills: 20, durationKills: 5, class: "rogue" },
  skill_arcane_surge:  { cooldownKills: 25, durationKills: 6, class: "mage" },
  skill_consecrate:    { cooldownKills: 15, durationKills: 0, class: "paladin" },
  skill_volley:        { cooldownKills: 15, durationKills: 6, class: "ranger" },
  skill_entangle:      { cooldownKills: 20, durationKills: 8, class: "druid" },
};

/** Non-binary class-themed names for companion party slots (slot 2–6 use index 0–4). */
export const COMPANION_NAMES: Record<string, string[]> = {
  fighter: ["Cade",   "Raze",   "Flint",  "Sable",   "Onyx"  ],
  rogue:   ["Vesper", "Vale",   "Ash",    "Cipher",  "Dusk"  ],
  mage:    ["Indigo", "Lyric",  "Zephyr", "Rune",    "Lark"  ],
  paladin: ["Sol",    "Blair",  "Corin",  "Emery",   "Avery" ],
  ranger:  ["River",  "Cedar",  "Finch",  "Briar",   "Brook" ],
  druid:   ["Rowan",  "Hazel",  "Fern",   "Sage",    "Wren"  ],
};

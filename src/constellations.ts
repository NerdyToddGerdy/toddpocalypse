export interface ConstellationNodeDef {
  id: string;
  constellation: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  type: "center" | "start" | "minor" | "notable" | "keystone";
  stat: string;
  value: number;
  label: string;
  description: string;
  cost: 1 | 2 | 5;
  /** Maximum investable level: 1 for keystones (binary unlock), 3 for all others. */
  maxLevel: number;
  connections: string[];
  isStart?: true;
  x: number;
  y: number;
}

export interface ConstellationBonuses {
  dpsMultiplier: number;
  maxHpMultiplier: number;
  goldMultiplier: number;
  xpMultiplier: number;
  clickDpsMultiplier: number;
  hasteMultiplier: number;
  defenseBonus: number;
  critChanceBonus: number;
  runeBonusMultiplier: number;
  lootQualityBonus: number;
  berserkerActive: boolean;
  lastStandActive: boolean;
  midasTouchActive: boolean;
  ancientWisdomActive: boolean;
  perfectKillActive: boolean;
  phaseStepActive: boolean;
  runicMasteryActive: boolean;
}

// Layout: 600×600 SVG, center (300,300).
// Radii: start=85  minor_side=140  minor_center=148  notable=205  keystone=258
// 7 constellations spaced 51.4° apart (360/7), starting at 270° (north):
//   C1 Warrior 270° | C2 Guardian 321° | C3 Fortune 13°  | C4 Sage 64°
//   C5 Hunter 116°  | C6 Wanderer 167° | C7 Runesmith 219°
// Each constellation: center→start→{minor1(θ-15°), minor2(θ), minor3(θ+15°)}→{notable1,notable2}→keystone
// minor2 bridges both notables; no cross-constellation connections.

type RawNodeDef = Omit<ConstellationNodeDef, "maxLevel">;
const RAW_NODE_DEFS: Record<string, RawNodeDef> = {

  // ── CENTER ───────────────────────────────────────────────────────────────
  center: {
    id: "center", constellation: 0, type: "center", isStart: true,
    stat: "dps", value: 2, label: "Nexus",
    description: "The heart of the Constellations. Unlocking this node reveals all seven paths. Party DPS +2%.",
    cost: 1, x: 300, y: 300,
    connections: [
      "warrior_start", "guardian_start", "fortune_start", "sage_start",
      "hunter_start", "wanderer_start", "runesmith_start",
    ],
  },

  // ── CONSTELLATION 1: THE WARRIOR (DPS) ── θ=270°
  warrior_start: {
    id: "warrior_start", constellation: 1, type: "start",
    stat: "dps", value: 5, label: "Call to Arms",
    description: "Party DPS +5%.",
    cost: 1, x: 300, y: 215,
    connections: ["center", "warrior_minor1", "warrior_minor2", "warrior_minor3"],
  },
  warrior_minor1: {
    id: "warrior_minor1", constellation: 1, type: "minor",
    stat: "dps", value: 4, label: "Iron Edge",
    description: "Party DPS +4%.",
    cost: 1, x: 264, y: 165,
    connections: ["warrior_start", "warrior_notable1"],
  },
  warrior_minor2: {
    id: "warrior_minor2", constellation: 1, type: "minor",
    stat: "dps", value: 4, label: "Savage Fury",
    description: "Party DPS +4%.",
    cost: 1, x: 300, y: 152,
    connections: ["warrior_start", "warrior_notable1", "warrior_notable2"],
  },
  warrior_minor3: {
    id: "warrior_minor3", constellation: 1, type: "minor",
    stat: "dps", value: 3, label: "Battle Hardened",
    description: "Party DPS +3%.",
    cost: 1, x: 336, y: 165,
    connections: ["warrior_start", "warrior_notable2"],
  },
  warrior_notable1: {
    id: "warrior_notable1", constellation: 1, type: "notable",
    stat: "dps", value: 12, label: "War Cry",
    description: "Party DPS +12%.",
    cost: 2, x: 264, y: 98,
    connections: ["warrior_minor1", "warrior_minor2", "warrior_keystone"],
  },
  warrior_notable2: {
    id: "warrior_notable2", constellation: 1, type: "notable",
    stat: "dps", value: 12, label: "Blood Price",
    description: "Party DPS +12%.",
    cost: 2, x: 336, y: 98,
    connections: ["warrior_minor2", "warrior_minor3", "warrior_keystone"],
  },
  warrior_keystone: {
    id: "warrior_keystone", constellation: 1, type: "keystone",
    stat: "dps", value: 30, label: "Berserker",
    description: "Party DPS +30% while any hero is below 50% HP.",
    cost: 5, x: 300, y: 42,
    connections: ["warrior_notable1", "warrior_notable2"],
  },

  // ── CONSTELLATION 2: THE GUARDIAN (HP/Defense) ── θ=321°
  guardian_start: {
    id: "guardian_start", constellation: 2, type: "start",
    stat: "maxHp", value: 5, label: "Bulwark",
    description: "Party max HP +5%.",
    cost: 1, x: 367, y: 247,
    connections: ["center", "guardian_minor1", "guardian_minor2", "guardian_minor3"],
  },
  guardian_minor1: {
    id: "guardian_minor1", constellation: 2, type: "minor",
    stat: "maxHp", value: 4, label: "Stonewall",
    description: "Party max HP +4%.",
    cost: 1, x: 383, y: 187,
    connections: ["guardian_start", "guardian_notable1"],
  },
  guardian_minor2: {
    id: "guardian_minor2", constellation: 2, type: "minor",
    stat: "maxHp", value: 4, label: "Tempered Hide",
    description: "Party max HP +4%.",
    cost: 1, x: 416, y: 208,
    connections: ["guardian_start", "guardian_notable1", "guardian_notable2"],
  },
  guardian_minor3: {
    id: "guardian_minor3", constellation: 2, type: "minor",
    stat: "defense", value: 2, label: "Iron Scales",
    description: "Party damage reduction +2%.",
    cost: 1, x: 428, y: 244,
    connections: ["guardian_start", "guardian_notable2"],
  },
  guardian_notable1: {
    id: "guardian_notable1", constellation: 2, type: "notable",
    stat: "maxHp", value: 14, label: "Fortress",
    description: "Party max HP +14%.",
    cost: 2, x: 436, y: 146,
    connections: ["guardian_minor1", "guardian_minor2", "guardian_keystone"],
  },
  guardian_notable2: {
    id: "guardian_notable2", constellation: 2, type: "notable",
    stat: "defense", value: 5, label: "Aegis",
    description: "Party damage reduction +5%.",
    cost: 2, x: 480, y: 202,
    connections: ["guardian_minor2", "guardian_minor3", "guardian_keystone"],
  },
  guardian_keystone: {
    id: "guardian_keystone", constellation: 2, type: "keystone",
    stat: "maxHp", value: 0, label: "Last Stand",
    description: "Once per floor, if any hero would die, they survive at 1 HP instead.",
    cost: 5, x: 502, y: 139,
    connections: ["guardian_notable1", "guardian_notable2"],
  },

  // ── CONSTELLATION 3: FORTUNE'S EYE (Gold/Loot) ── θ=13°
  fortune_start: {
    id: "fortune_start", constellation: 3, type: "start",
    stat: "gold", value: 8, label: "Lucky Coin",
    description: "Gold drops +8%.",
    cost: 1, x: 383, y: 319,
    connections: ["center", "fortune_minor1", "fortune_minor2", "fortune_minor3"],
  },
  fortune_minor1: {
    id: "fortune_minor1", constellation: 3, type: "minor",
    stat: "gold", value: 6, label: "Finder's Fee",
    description: "Gold drops +6%.",
    cost: 1, x: 440, y: 295,
    connections: ["fortune_start", "fortune_notable1"],
  },
  fortune_minor2: {
    id: "fortune_minor2", constellation: 3, type: "minor",
    stat: "gold", value: 6, label: "Treasure Sense",
    description: "Gold drops +6%.",
    cost: 1, x: 444, y: 333,
    connections: ["fortune_start", "fortune_notable1", "fortune_notable2"],
  },
  fortune_minor3: {
    id: "fortune_minor3", constellation: 3, type: "minor",
    stat: "lootQuality", value: 4, label: "Sharp Eye",
    description: "Loot upgrade chance +4%.",
    cost: 1, x: 424, y: 365,
    connections: ["fortune_start", "fortune_notable2"],
  },
  fortune_notable1: {
    id: "fortune_notable1", constellation: 3, type: "notable",
    stat: "gold", value: 16, label: "Golden Hoard",
    description: "Gold drops +16%.",
    cost: 2, x: 505, y: 310,
    connections: ["fortune_minor1", "fortune_minor2", "fortune_keystone"],
  },
  fortune_notable2: {
    id: "fortune_notable2", constellation: 3, type: "notable",
    stat: "lootQuality", value: 8, label: "Fortune Favors",
    description: "Loot upgrade chance +8%.",
    cost: 2, x: 489, y: 380,
    connections: ["fortune_minor2", "fortune_minor3", "fortune_keystone"],
  },
  fortune_keystone: {
    id: "fortune_keystone", constellation: 3, type: "keystone",
    stat: "gold", value: 50, label: "Midas Touch",
    description: "Gold drops +50%.",
    cost: 5, x: 552, y: 357,
    connections: ["fortune_notable1", "fortune_notable2"],
  },

  // ── CONSTELLATION 4: SAGE'S LIGHT (XP) ── θ=64°
  sage_start: {
    id: "sage_start", constellation: 4, type: "start",
    stat: "xp", value: 8, label: "Open Tome",
    description: "Party XP +8%.",
    cost: 1, x: 337, y: 377,
    connections: ["center", "sage_minor1", "sage_minor2", "sage_minor3"],
  },
  sage_minor1: {
    id: "sage_minor1", constellation: 4, type: "minor",
    stat: "xp", value: 6, label: "Field Notes",
    description: "Party XP +6%.",
    cost: 1, x: 391, y: 406,
    connections: ["sage_start", "sage_notable1"],
  },
  sage_minor2: {
    id: "sage_minor2", constellation: 4, type: "minor",
    stat: "xp", value: 6, label: "Wandering Scholar",
    description: "Party XP +6%.",
    cost: 1, x: 364, y: 433,
    connections: ["sage_start", "sage_notable1", "sage_notable2"],
  },
  sage_minor3: {
    id: "sage_minor3", constellation: 4, type: "minor",
    stat: "xp", value: 5, label: "Careful Study",
    description: "Party XP +5%.",
    cost: 1, x: 326, y: 438,
    connections: ["sage_start", "sage_notable2"],
  },
  sage_notable1: {
    id: "sage_notable1", constellation: 4, type: "notable",
    stat: "xp", value: 16, label: "Learned Lore",
    description: "Party XP +16%.",
    cost: 2, x: 420, y: 467,
    connections: ["sage_minor1", "sage_minor2", "sage_keystone"],
  },
  sage_notable2: {
    id: "sage_notable2", constellation: 4, type: "notable",
    stat: "xp", value: 14, label: "Scholar's Focus",
    description: "Party XP +14%.",
    cost: 2, x: 355, y: 498,
    connections: ["sage_minor2", "sage_minor3", "sage_keystone"],
  },
  sage_keystone: {
    id: "sage_keystone", constellation: 4, type: "keystone",
    stat: "xp", value: 0, label: "Ancient Wisdom",
    description: "XP bonus scales +2% per dungeon explored.",
    cost: 5, x: 412, y: 533,
    connections: ["sage_notable1", "sage_notable2"],
  },

  // ── CONSTELLATION 5: THE HUNTER (Click/Crit) ── θ=116°
  hunter_start: {
    id: "hunter_start", constellation: 5, type: "start",
    stat: "clickDps", value: 8, label: "First Arrow",
    description: "Click damage +8%.",
    cost: 1, x: 263, y: 377,
    connections: ["center", "hunter_minor1", "hunter_minor2", "hunter_minor3"],
  },
  hunter_minor1: {
    id: "hunter_minor1", constellation: 5, type: "minor",
    stat: "critChance", value: 2, label: "Keen Sight",
    description: "Crit chance +2%.",
    cost: 1, x: 274, y: 438,
    connections: ["hunter_start", "hunter_notable1"],
  },
  hunter_minor2: {
    id: "hunter_minor2", constellation: 5, type: "minor",
    stat: "clickDps", value: 6, label: "Quick Nock",
    description: "Click damage +6%.",
    cost: 1, x: 236, y: 433,
    connections: ["hunter_start", "hunter_notable1", "hunter_notable2"],
  },
  hunter_minor3: {
    id: "hunter_minor3", constellation: 5, type: "minor",
    stat: "critChance", value: 2, label: "Predator's Eye",
    description: "Crit chance +2%.",
    cost: 1, x: 209, y: 406,
    connections: ["hunter_start", "hunter_notable2"],
  },
  hunter_notable1: {
    id: "hunter_notable1", constellation: 5, type: "notable",
    stat: "critChance", value: 5, label: "Deadeye",
    description: "Crit chance +5%.",
    cost: 2, x: 245, y: 498,
    connections: ["hunter_minor1", "hunter_minor2", "hunter_keystone"],
  },
  hunter_notable2: {
    id: "hunter_notable2", constellation: 5, type: "notable",
    stat: "clickDps", value: 16, label: "Volley of Strikes",
    description: "Click damage +16%.",
    cost: 2, x: 181, y: 467,
    connections: ["hunter_minor2", "hunter_minor3", "hunter_keystone"],
  },
  hunter_keystone: {
    id: "hunter_keystone", constellation: 5, type: "keystone",
    stat: "clickDps", value: 0, label: "Perfect Kill",
    description: "Click crits always deal 3× instead of 2×.",
    cost: 5, x: 188, y: 533,
    connections: ["hunter_notable1", "hunter_notable2"],
  },

  // ── CONSTELLATION 6: THE WANDERER (Haste) ── θ=167°
  wanderer_start: {
    id: "wanderer_start", constellation: 6, type: "start",
    stat: "haste", value: 5, label: "Light Feet",
    description: "Attack interval −5% (faster attacks).",
    cost: 1, x: 217, y: 319,
    connections: ["center", "wanderer_minor1", "wanderer_minor2", "wanderer_minor3"],
  },
  wanderer_minor1: {
    id: "wanderer_minor1", constellation: 6, type: "minor",
    stat: "haste", value: 4, label: "Fleet Step",
    description: "Attack interval −4%.",
    cost: 1, x: 176, y: 365,
    connections: ["wanderer_start", "wanderer_notable1"],
  },
  wanderer_minor2: {
    id: "wanderer_minor2", constellation: 6, type: "minor",
    stat: "haste", value: 4, label: "Swiftness",
    description: "Attack interval −4%.",
    cost: 1, x: 156, y: 333,
    connections: ["wanderer_start", "wanderer_notable1", "wanderer_notable2"],
  },
  wanderer_minor3: {
    id: "wanderer_minor3", constellation: 6, type: "minor",
    stat: "haste", value: 3, label: "Blur",
    description: "Attack interval −3%.",
    cost: 1, x: 160, y: 295,
    connections: ["wanderer_start", "wanderer_notable2"],
  },
  wanderer_notable1: {
    id: "wanderer_notable1", constellation: 6, type: "notable",
    stat: "haste", value: 10, label: "Wind Runner",
    description: "Attack interval −10%.",
    cost: 2, x: 111, y: 380,
    connections: ["wanderer_minor1", "wanderer_minor2", "wanderer_keystone"],
  },
  wanderer_notable2: {
    id: "wanderer_notable2", constellation: 6, type: "notable",
    stat: "haste", value: 8, label: "Phantom Trail",
    description: "Attack interval −8%.",
    cost: 2, x: 95, y: 310,
    connections: ["wanderer_minor2", "wanderer_minor3", "wanderer_keystone"],
  },
  wanderer_keystone: {
    id: "wanderer_keystone", constellation: 6, type: "keystone",
    stat: "haste", value: 0, label: "Phase Step",
    description: "Haste bonuses apply to your party; enemy attack speed is also reduced by 15%.",
    cost: 5, x: 49, y: 357,
    connections: ["wanderer_notable1", "wanderer_notable2"],
  },

  // ── CONSTELLATION 7: RUNESMITH'S LORE (Rune/Loot) ── θ=219°
  runesmith_start: {
    id: "runesmith_start", constellation: 7, type: "start",
    stat: "runeBonus", value: 8, label: "Rune Primer",
    description: "Rune stat effects +8%.",
    cost: 1, x: 234, y: 247,
    connections: ["center", "runesmith_minor1", "runesmith_minor2", "runesmith_minor3"],
  },
  runesmith_minor1: {
    id: "runesmith_minor1", constellation: 7, type: "minor",
    stat: "runeBonus", value: 6, label: "Carved Stone",
    description: "Rune stat effects +6%.",
    cost: 1, x: 172, y: 244,
    connections: ["runesmith_start", "runesmith_notable1"],
  },
  runesmith_minor2: {
    id: "runesmith_minor2", constellation: 7, type: "minor",
    stat: "runeBonus", value: 6, label: "Rune Lore",
    description: "Rune stat effects +6%.",
    cost: 1, x: 184, y: 208,
    connections: ["runesmith_start", "runesmith_notable1", "runesmith_notable2"],
  },
  runesmith_minor3: {
    id: "runesmith_minor3", constellation: 7, type: "minor",
    stat: "lootQuality", value: 4, label: "Arcane Eye",
    description: "Loot upgrade chance +4%.",
    cost: 1, x: 217, y: 187,
    connections: ["runesmith_start", "runesmith_notable2"],
  },
  runesmith_notable1: {
    id: "runesmith_notable1", constellation: 7, type: "notable",
    stat: "runeBonus", value: 16, label: "Deep Inscription",
    description: "Rune stat effects +16%.",
    cost: 2, x: 120, y: 202,
    connections: ["runesmith_minor1", "runesmith_minor2", "runesmith_keystone"],
  },
  runesmith_notable2: {
    id: "runesmith_notable2", constellation: 7, type: "notable",
    stat: "lootQuality", value: 8, label: "Runic Sight",
    description: "Loot upgrade chance +8%.",
    cost: 2, x: 164, y: 146,
    connections: ["runesmith_minor2", "runesmith_minor3", "runesmith_keystone"],
  },
  runesmith_keystone: {
    id: "runesmith_keystone", constellation: 7, type: "keystone",
    stat: "runeBonus", value: 100, label: "Runic Mastery",
    description: "All rune stat effects are doubled.",
    cost: 5, x: 98, y: 139,
    connections: ["runesmith_notable1", "runesmith_notable2"],
  },
};

export const CONSTELLATION_NODE_DEFS: Record<string, ConstellationNodeDef> =
  Object.fromEntries(Object.entries(RAW_NODE_DEFS).map(([k, v]) => [
    k, { ...v, maxLevel: v.type === "keystone" ? 1 : 3 } as ConstellationNodeDef,
  ]));

export function getConstellationBonuses(nodeLevels: Map<string, number>): ConstellationBonuses {
  const b: ConstellationBonuses = {
    dpsMultiplier: 1.0,
    maxHpMultiplier: 1.0,
    goldMultiplier: 1.0,
    xpMultiplier: 1.0,
    clickDpsMultiplier: 1.0,
    hasteMultiplier: 1.0,
    defenseBonus: 0,
    critChanceBonus: 0,
    runeBonusMultiplier: 1.0,
    lootQualityBonus: 0,
    berserkerActive: false,
    lastStandActive: false,
    midasTouchActive: false,
    ancientWisdomActive: false,
    perfectKillActive: false,
    phaseStepActive: false,
    runicMasteryActive: false,
  };

  for (const [id, level] of nodeLevels) {
    const def = CONSTELLATION_NODE_DEFS[id];
    if (!def || level < 1) continue;

    if (def.type === "keystone") {
      switch (id) {
        case "warrior_keystone":   b.berserkerActive     = true; break;
        case "guardian_keystone":  b.lastStandActive     = true; break;
        case "fortune_keystone":   b.midasTouchActive    = true; b.goldMultiplier *= 1.50; break;
        case "sage_keystone":      b.ancientWisdomActive = true; break;
        case "hunter_keystone":    b.perfectKillActive   = true; break;
        case "wanderer_keystone":  b.phaseStepActive     = true; break;
        case "runesmith_keystone": b.runicMasteryActive  = true; break;
      }
      continue;
    }

    const pct = def.value / 100;
    switch (def.stat) {
      case "dps":         b.dpsMultiplier       *= (1 + pct * level); break;
      case "maxHp":       b.maxHpMultiplier      *= (1 + pct * level); break;
      case "gold":        b.goldMultiplier        *= (1 + pct * level); break;
      case "xp":          b.xpMultiplier          *= (1 + pct * level); break;
      case "clickDps":    b.clickDpsMultiplier    *= (1 + pct * level); break;
      case "haste":       b.hasteMultiplier       *= (1 - pct * level); break;
      case "defense":     b.defenseBonus          += def.value * level; break;
      case "critChance":  b.critChanceBonus       += pct * level;       break;
      case "runeBonus":   b.runeBonusMultiplier   *= (1 + pct * level); break;
      case "lootQuality": b.lootQualityBonus      += def.value * level; break;
    }
  }

  // Runic Mastery: double the accumulated rune bonus above 1.0
  if (b.runicMasteryActive) {
    b.runeBonusMultiplier = 1.0 + (b.runeBonusMultiplier - 1.0) * 2.0;
  }

  return b;
}

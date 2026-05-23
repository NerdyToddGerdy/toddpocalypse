export interface ConstellationNodeDef {
  id: string;
  constellation: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  type: "start" | "minor" | "notable" | "keystone";
  stat: string;
  value: number;
  label: string;
  description: string;
  cost: 1 | 2 | 5;
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

// Constellation centers (600×600 SVG, center 300,300), radius 185
// C1 Warrior:   (300, 115)
// C2 Guardian:  (445, 185)
// C3 Fortune:   (480, 341)
// C4 Sage:      (380, 467)
// C5 Hunter:    (220, 467)
// C6 Wanderer:  (120, 341)
// C7 Runesmith: (155, 185)
//
// Each cluster: start(0,-42) minor1(32,-22) minor2(-32,-22) minor3(18,-50) minor4(-18,-50)
//               notable1(42,5) notable2(-42,5) keystone(0,32)
// Keystone connects to adjacent constellation starts (cross-tree edges)

export const CONSTELLATION_NODE_DEFS: Record<string, ConstellationNodeDef> = {

  // ── CONSTELLATION 1: THE WARRIOR (DPS) ──
  warrior_start: {
    id: "warrior_start", constellation: 1, type: "start", isStart: true,
    stat: "dps", value: 5, label: "Call to Arms",
    description: "Party DPS +5%.",
    cost: 1, x: 300, y: 73,
    connections: ["warrior_minor1", "warrior_minor2", "warrior_minor3", "warrior_minor4"],
  },
  warrior_minor1: {
    id: "warrior_minor1", constellation: 1, type: "minor",
    stat: "dps", value: 4, label: "Iron Edge",
    description: "Party DPS +4%.",
    cost: 1, x: 332, y: 93,
    connections: ["warrior_start", "warrior_notable1"],
  },
  warrior_minor2: {
    id: "warrior_minor2", constellation: 1, type: "minor",
    stat: "dps", value: 4, label: "Savage Fury",
    description: "Party DPS +4%.",
    cost: 1, x: 268, y: 93,
    connections: ["warrior_start", "warrior_notable2"],
  },
  warrior_minor3: {
    id: "warrior_minor3", constellation: 1, type: "minor",
    stat: "dps", value: 3, label: "Battle Hardened",
    description: "Party DPS +3%.",
    cost: 1, x: 318, y: 65,
    connections: ["warrior_start", "warrior_notable1"],
  },
  warrior_minor4: {
    id: "warrior_minor4", constellation: 1, type: "minor",
    stat: "dps", value: 3, label: "Relentless",
    description: "Party DPS +3%.",
    cost: 1, x: 282, y: 65,
    connections: ["warrior_start", "warrior_notable2"],
  },
  warrior_notable1: {
    id: "warrior_notable1", constellation: 1, type: "notable",
    stat: "dps", value: 12, label: "War Cry",
    description: "Party DPS +12%.",
    cost: 2, x: 342, y: 120,
    connections: ["warrior_minor1", "warrior_minor3", "warrior_keystone"],
  },
  warrior_notable2: {
    id: "warrior_notable2", constellation: 1, type: "notable",
    stat: "dps", value: 12, label: "Blood Price",
    description: "Party DPS +12%.",
    cost: 2, x: 258, y: 120,
    connections: ["warrior_minor2", "warrior_minor4", "warrior_keystone"],
  },
  warrior_keystone: {
    id: "warrior_keystone", constellation: 1, type: "keystone",
    stat: "dps", value: 30, label: "Berserker",
    description: "Party DPS +30% while any hero is below 50% HP.",
    cost: 5, x: 300, y: 147,
    connections: ["warrior_notable1", "warrior_notable2", "guardian_start", "runesmith_start"],
  },

  // ── CONSTELLATION 2: THE GUARDIAN (HP/Defense) ──
  guardian_start: {
    id: "guardian_start", constellation: 2, type: "start", isStart: true,
    stat: "maxHp", value: 5, label: "Bulwark",
    description: "Party max HP +5%.",
    cost: 1, x: 445, y: 143,
    connections: ["guardian_minor1", "guardian_minor2", "guardian_minor3", "guardian_minor4"],
  },
  guardian_minor1: {
    id: "guardian_minor1", constellation: 2, type: "minor",
    stat: "maxHp", value: 4, label: "Stonewall",
    description: "Party max HP +4%.",
    cost: 1, x: 477, y: 163,
    connections: ["guardian_start", "guardian_notable1"],
  },
  guardian_minor2: {
    id: "guardian_minor2", constellation: 2, type: "minor",
    stat: "maxHp", value: 4, label: "Tempered Hide",
    description: "Party max HP +4%.",
    cost: 1, x: 413, y: 163,
    connections: ["guardian_start", "guardian_notable2"],
  },
  guardian_minor3: {
    id: "guardian_minor3", constellation: 2, type: "minor",
    stat: "defense", value: 2, label: "Iron Scales",
    description: "Party damage reduction +2%.",
    cost: 1, x: 463, y: 135,
    connections: ["guardian_start", "guardian_notable1"],
  },
  guardian_minor4: {
    id: "guardian_minor4", constellation: 2, type: "minor",
    stat: "defense", value: 2, label: "Shield Wall",
    description: "Party damage reduction +2%.",
    cost: 1, x: 427, y: 135,
    connections: ["guardian_start", "guardian_notable2"],
  },
  guardian_notable1: {
    id: "guardian_notable1", constellation: 2, type: "notable",
    stat: "maxHp", value: 14, label: "Fortress",
    description: "Party max HP +14%.",
    cost: 2, x: 487, y: 190,
    connections: ["guardian_minor1", "guardian_minor3", "guardian_keystone"],
  },
  guardian_notable2: {
    id: "guardian_notable2", constellation: 2, type: "notable",
    stat: "defense", value: 5, label: "Aegis",
    description: "Party damage reduction +5%.",
    cost: 2, x: 403, y: 190,
    connections: ["guardian_minor2", "guardian_minor4", "guardian_keystone"],
  },
  guardian_keystone: {
    id: "guardian_keystone", constellation: 2, type: "keystone",
    stat: "maxHp", value: 0, label: "Last Stand",
    description: "Once per floor, if any hero would die, they survive at 1 HP instead.",
    cost: 5, x: 445, y: 217,
    connections: ["guardian_notable1", "guardian_notable2", "fortune_start", "warrior_start"],
  },

  // ── CONSTELLATION 3: FORTUNE'S EYE (Gold/Loot) ──
  fortune_start: {
    id: "fortune_start", constellation: 3, type: "start", isStart: true,
    stat: "gold", value: 8, label: "Lucky Coin",
    description: "Gold drops +8%.",
    cost: 1, x: 480, y: 299,
    connections: ["fortune_minor1", "fortune_minor2", "fortune_minor3", "fortune_minor4"],
  },
  fortune_minor1: {
    id: "fortune_minor1", constellation: 3, type: "minor",
    stat: "gold", value: 6, label: "Finder's Fee",
    description: "Gold drops +6%.",
    cost: 1, x: 512, y: 319,
    connections: ["fortune_start", "fortune_notable1"],
  },
  fortune_minor2: {
    id: "fortune_minor2", constellation: 3, type: "minor",
    stat: "gold", value: 6, label: "Treasure Sense",
    description: "Gold drops +6%.",
    cost: 1, x: 448, y: 319,
    connections: ["fortune_start", "fortune_notable2"],
  },
  fortune_minor3: {
    id: "fortune_minor3", constellation: 3, type: "minor",
    stat: "lootQuality", value: 4, label: "Sharp Eye",
    description: "Loot upgrade chance +4%.",
    cost: 1, x: 498, y: 291,
    connections: ["fortune_start", "fortune_notable1"],
  },
  fortune_minor4: {
    id: "fortune_minor4", constellation: 3, type: "minor",
    stat: "gold", value: 5, label: "Haggler",
    description: "Gold drops +5%.",
    cost: 1, x: 462, y: 291,
    connections: ["fortune_start", "fortune_notable2"],
  },
  fortune_notable1: {
    id: "fortune_notable1", constellation: 3, type: "notable",
    stat: "gold", value: 16, label: "Golden Hoard",
    description: "Gold drops +16%.",
    cost: 2, x: 522, y: 346,
    connections: ["fortune_minor1", "fortune_minor3", "fortune_keystone"],
  },
  fortune_notable2: {
    id: "fortune_notable2", constellation: 3, type: "notable",
    stat: "lootQuality", value: 8, label: "Fortune Favors",
    description: "Loot upgrade chance +8%.",
    cost: 2, x: 438, y: 346,
    connections: ["fortune_minor2", "fortune_minor4", "fortune_keystone"],
  },
  fortune_keystone: {
    id: "fortune_keystone", constellation: 3, type: "keystone",
    stat: "gold", value: 50, label: "Midas Touch",
    description: "Gold drops +50%.",
    cost: 5, x: 480, y: 373,
    connections: ["fortune_notable1", "fortune_notable2", "sage_start", "guardian_start"],
  },

  // ── CONSTELLATION 4: SAGE'S LIGHT (XP) ──
  sage_start: {
    id: "sage_start", constellation: 4, type: "start", isStart: true,
    stat: "xp", value: 8, label: "Open Tome",
    description: "Party XP +8%.",
    cost: 1, x: 380, y: 425,
    connections: ["sage_minor1", "sage_minor2", "sage_minor3", "sage_minor4"],
  },
  sage_minor1: {
    id: "sage_minor1", constellation: 4, type: "minor",
    stat: "xp", value: 6, label: "Field Notes",
    description: "Party XP +6%.",
    cost: 1, x: 412, y: 445,
    connections: ["sage_start", "sage_notable1"],
  },
  sage_minor2: {
    id: "sage_minor2", constellation: 4, type: "minor",
    stat: "xp", value: 6, label: "Wandering Scholar",
    description: "Party XP +6%.",
    cost: 1, x: 348, y: 445,
    connections: ["sage_start", "sage_notable2"],
  },
  sage_minor3: {
    id: "sage_minor3", constellation: 4, type: "minor",
    stat: "xp", value: 5, label: "Careful Study",
    description: "Party XP +5%.",
    cost: 1, x: 398, y: 417,
    connections: ["sage_start", "sage_notable1"],
  },
  sage_minor4: {
    id: "sage_minor4", constellation: 4, type: "minor",
    stat: "xp", value: 5, label: "Scholar's Notes",
    description: "Party XP +5%.",
    cost: 1, x: 362, y: 417,
    connections: ["sage_start", "sage_notable2"],
  },
  sage_notable1: {
    id: "sage_notable1", constellation: 4, type: "notable",
    stat: "xp", value: 16, label: "Learned Lore",
    description: "Party XP +16%.",
    cost: 2, x: 422, y: 472,
    connections: ["sage_minor1", "sage_minor3", "sage_keystone"],
  },
  sage_notable2: {
    id: "sage_notable2", constellation: 4, type: "notable",
    stat: "xp", value: 14, label: "Scholar's Focus",
    description: "Party XP +14%.",
    cost: 2, x: 338, y: 472,
    connections: ["sage_minor2", "sage_minor4", "sage_keystone"],
  },
  sage_keystone: {
    id: "sage_keystone", constellation: 4, type: "keystone",
    stat: "xp", value: 0, label: "Ancient Wisdom",
    description: "XP bonus scales +2% per dungeon explored (stacks with other XP bonuses).",
    cost: 5, x: 380, y: 499,
    connections: ["sage_notable1", "sage_notable2", "hunter_start", "fortune_start"],
  },

  // ── CONSTELLATION 5: THE HUNTER (Click/Crit) ──
  hunter_start: {
    id: "hunter_start", constellation: 5, type: "start", isStart: true,
    stat: "clickDps", value: 8, label: "First Arrow",
    description: "Click damage +8%.",
    cost: 1, x: 220, y: 425,
    connections: ["hunter_minor1", "hunter_minor2", "hunter_minor3", "hunter_minor4"],
  },
  hunter_minor1: {
    id: "hunter_minor1", constellation: 5, type: "minor",
    stat: "critChance", value: 2, label: "Keen Sight",
    description: "Crit chance +2%.",
    cost: 1, x: 252, y: 445,
    connections: ["hunter_start", "hunter_notable1"],
  },
  hunter_minor2: {
    id: "hunter_minor2", constellation: 5, type: "minor",
    stat: "clickDps", value: 6, label: "Quick Nock",
    description: "Click damage +6%.",
    cost: 1, x: 188, y: 445,
    connections: ["hunter_start", "hunter_notable2"],
  },
  hunter_minor3: {
    id: "hunter_minor3", constellation: 5, type: "minor",
    stat: "critChance", value: 2, label: "Predator's Eye",
    description: "Crit chance +2%.",
    cost: 1, x: 238, y: 417,
    connections: ["hunter_start", "hunter_notable1"],
  },
  hunter_minor4: {
    id: "hunter_minor4", constellation: 5, type: "minor",
    stat: "clickDps", value: 5, label: "Arrow Rain",
    description: "Click damage +5%.",
    cost: 1, x: 202, y: 417,
    connections: ["hunter_start", "hunter_notable2"],
  },
  hunter_notable1: {
    id: "hunter_notable1", constellation: 5, type: "notable",
    stat: "critChance", value: 5, label: "Deadeye",
    description: "Crit chance +5%.",
    cost: 2, x: 262, y: 472,
    connections: ["hunter_minor1", "hunter_minor3", "hunter_keystone"],
  },
  hunter_notable2: {
    id: "hunter_notable2", constellation: 5, type: "notable",
    stat: "clickDps", value: 16, label: "Volley of Strikes",
    description: "Click damage +16%.",
    cost: 2, x: 178, y: 472,
    connections: ["hunter_minor2", "hunter_minor4", "hunter_keystone"],
  },
  hunter_keystone: {
    id: "hunter_keystone", constellation: 5, type: "keystone",
    stat: "clickDps", value: 0, label: "Perfect Kill",
    description: "Click crits always deal 3× instead of 2×.",
    cost: 5, x: 220, y: 499,
    connections: ["hunter_notable1", "hunter_notable2", "wanderer_start", "sage_start"],
  },

  // ── CONSTELLATION 6: THE WANDERER (Haste) ──
  wanderer_start: {
    id: "wanderer_start", constellation: 6, type: "start", isStart: true,
    stat: "haste", value: 5, label: "Light Feet",
    description: "Attack interval −5% (faster attacks).",
    cost: 1, x: 120, y: 299,
    connections: ["wanderer_minor1", "wanderer_minor2", "wanderer_minor3", "wanderer_minor4"],
  },
  wanderer_minor1: {
    id: "wanderer_minor1", constellation: 6, type: "minor",
    stat: "haste", value: 4, label: "Fleet Step",
    description: "Attack interval −4%.",
    cost: 1, x: 152, y: 319,
    connections: ["wanderer_start", "wanderer_notable1"],
  },
  wanderer_minor2: {
    id: "wanderer_minor2", constellation: 6, type: "minor",
    stat: "haste", value: 4, label: "Swiftness",
    description: "Attack interval −4%.",
    cost: 1, x: 88, y: 319,
    connections: ["wanderer_start", "wanderer_notable2"],
  },
  wanderer_minor3: {
    id: "wanderer_minor3", constellation: 6, type: "minor",
    stat: "haste", value: 3, label: "Blur",
    description: "Attack interval −3%.",
    cost: 1, x: 138, y: 291,
    connections: ["wanderer_start", "wanderer_notable1"],
  },
  wanderer_minor4: {
    id: "wanderer_minor4", constellation: 6, type: "minor",
    stat: "haste", value: 3, label: "Windborne",
    description: "Attack interval −3%.",
    cost: 1, x: 102, y: 291,
    connections: ["wanderer_start", "wanderer_notable2"],
  },
  wanderer_notable1: {
    id: "wanderer_notable1", constellation: 6, type: "notable",
    stat: "haste", value: 10, label: "Wind Runner",
    description: "Attack interval −10%.",
    cost: 2, x: 162, y: 346,
    connections: ["wanderer_minor1", "wanderer_minor3", "wanderer_keystone"],
  },
  wanderer_notable2: {
    id: "wanderer_notable2", constellation: 6, type: "notable",
    stat: "haste", value: 8, label: "Phantom Trail",
    description: "Attack interval −8%.",
    cost: 2, x: 78, y: 346,
    connections: ["wanderer_minor2", "wanderer_minor4", "wanderer_keystone"],
  },
  wanderer_keystone: {
    id: "wanderer_keystone", constellation: 6, type: "keystone",
    stat: "haste", value: 0, label: "Phase Step",
    description: "Haste bonuses apply to your party; enemy attack speed is also reduced by 15%.",
    cost: 5, x: 120, y: 373,
    connections: ["wanderer_notable1", "wanderer_notable2", "runesmith_start", "hunter_start"],
  },

  // ── CONSTELLATION 7: RUNESMITH'S LORE (Rune/Loot) ──
  runesmith_start: {
    id: "runesmith_start", constellation: 7, type: "start", isStart: true,
    stat: "runeBonus", value: 8, label: "Rune Primer",
    description: "Rune stat effects +8%.",
    cost: 1, x: 155, y: 143,
    connections: ["runesmith_minor1", "runesmith_minor2", "runesmith_minor3", "runesmith_minor4"],
  },
  runesmith_minor1: {
    id: "runesmith_minor1", constellation: 7, type: "minor",
    stat: "runeBonus", value: 6, label: "Carved Stone",
    description: "Rune stat effects +6%.",
    cost: 1, x: 187, y: 163,
    connections: ["runesmith_start", "runesmith_notable1"],
  },
  runesmith_minor2: {
    id: "runesmith_minor2", constellation: 7, type: "minor",
    stat: "runeBonus", value: 6, label: "Rune Lore",
    description: "Rune stat effects +6%.",
    cost: 1, x: 123, y: 163,
    connections: ["runesmith_start", "runesmith_notable2"],
  },
  runesmith_minor3: {
    id: "runesmith_minor3", constellation: 7, type: "minor",
    stat: "lootQuality", value: 4, label: "Arcane Eye",
    description: "Loot upgrade chance +4%.",
    cost: 1, x: 173, y: 135,
    connections: ["runesmith_start", "runesmith_notable1"],
  },
  runesmith_minor4: {
    id: "runesmith_minor4", constellation: 7, type: "minor",
    stat: "lootQuality", value: 3, label: "Rune Read",
    description: "Loot upgrade chance +3%.",
    cost: 1, x: 137, y: 135,
    connections: ["runesmith_start", "runesmith_notable2"],
  },
  runesmith_notable1: {
    id: "runesmith_notable1", constellation: 7, type: "notable",
    stat: "runeBonus", value: 16, label: "Deep Inscription",
    description: "Rune stat effects +16%.",
    cost: 2, x: 197, y: 190,
    connections: ["runesmith_minor1", "runesmith_minor3", "runesmith_keystone"],
  },
  runesmith_notable2: {
    id: "runesmith_notable2", constellation: 7, type: "notable",
    stat: "lootQuality", value: 8, label: "Runic Sight",
    description: "Loot upgrade chance +8%.",
    cost: 2, x: 113, y: 190,
    connections: ["runesmith_minor2", "runesmith_minor4", "runesmith_keystone"],
  },
  runesmith_keystone: {
    id: "runesmith_keystone", constellation: 7, type: "keystone",
    stat: "runeBonus", value: 100, label: "Runic Mastery",
    description: "All rune stat effects are doubled.",
    cost: 5, x: 155, y: 217,
    connections: ["runesmith_notable1", "runesmith_notable2", "warrior_start", "wanderer_start"],
  },
};

export function getConstellationBonuses(nodes: string[]): ConstellationBonuses {
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

  for (const id of nodes) {
    const def = CONSTELLATION_NODE_DEFS[id];
    if (!def) continue;

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
      case "dps":         b.dpsMultiplier       *= (1 + pct); break;
      case "maxHp":       b.maxHpMultiplier      *= (1 + pct); break;
      case "gold":        b.goldMultiplier        *= (1 + pct); break;
      case "xp":          b.xpMultiplier          *= (1 + pct); break;
      case "clickDps":    b.clickDpsMultiplier    *= (1 + pct); break;
      case "haste":       b.hasteMultiplier       *= (1 - pct); break;
      case "defense":     b.defenseBonus          += def.value; break;
      case "critChance":  b.critChanceBonus       += pct;       break;
      case "runeBonus":   b.runeBonusMultiplier   *= (1 + pct); break;
      case "lootQuality": b.lootQualityBonus      += def.value; break;
    }
  }

  // Runic Mastery: double the accumulated rune bonus above 1.0
  if (b.runicMasteryActive) {
    b.runeBonusMultiplier = 1.0 + (b.runeBonusMultiplier - 1.0) * 2.0;
  }

  return b;
}

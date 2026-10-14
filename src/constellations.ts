import { RAW_NODE_DEFS, type ConstellationNodeDef } from "./data/constellations.js";
export type { ConstellationNodeDef };
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

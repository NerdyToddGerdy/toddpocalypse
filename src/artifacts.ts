export type ArtifactEffectId =
  | "bloodstone"
  | "berserkers_eye"
  | "greed_idol"
  | "soulbrand"
  | "wardens_core"
  | "executioners_mark";

export interface ArtifactDef {
  id: ArtifactEffectId;
  name: string;
  desc: string;
  icon: string;
  effectValue: number;
  cap?: number;
  sellValue: number;
}

/** A leveled artifact instance — used in inventory and equipped slots. */
export interface ArtifactInstance {
  id: ArtifactEffectId;
  level: number;
  fuel: number; // stored fuel units toward next level
}

export const ARTIFACT_DEFS: Record<ArtifactEffectId, ArtifactDef> = {
  bloodstone: {
    id: "bloodstone",
    name: "Bloodstone",
    desc: "Heal party 1% max HP per level on each kill",
    icon: "🩸",
    effectValue: 0.01,
    sellValue: 50,
  },
  berserkers_eye: {
    id: "berserkers_eye",
    name: "Berserker's Eye",
    desc: "+1% DPS per kill streak per level (cap +20% per level)",
    icon: "👁",
    effectValue: 0.01,
    cap: 0.20,
    sellValue: 50,
  },
  greed_idol: {
    id: "greed_idol",
    name: "Greed Idol",
    desc: "Boss gold ×1.5 per level (+0.5 per additional level)",
    icon: "🪙",
    effectValue: 0.5,
    sellValue: 50,
  },
  soulbrand: {
    id: "soulbrand",
    name: "Soulbrand",
    desc: "+3% crit chance per rune per level",
    icon: "💫",
    effectValue: 0.03,
    sellValue: 50,
  },
  wardens_core: {
    id: "wardens_core",
    name: "Warden's Core",
    desc: "-10% damage taken per level (capped at 50% total)",
    icon: "🛡",
    effectValue: 0.10,
    sellValue: 50,
  },
  executioners_mark: {
    id: "executioners_mark",
    name: "Executioner's Mark",
    desc: "Elite enemies trigger (level+1) extra boss-quality drop checks",
    icon: "⚔",
    effectValue: 1.0,
    sellValue: 50,
  },
};

/** Base artifact IDs eligible to drop from dungeon bosses. */
export const ARTIFACT_DROP_POOL: ArtifactEffectId[] = [
  "bloodstone",
  "berserkers_eye",
  "greed_idol",
  "soulbrand",
  "wardens_core",
  "executioners_mark",
];

/** Number of same-type artifacts consumed to level up from `level` → `level + 1`. */
export function artifactUpgradeCost(level: number): number {
  return level + 1;
}

/** Fuel units contributed by sacrificing one artifact at the given level.
 *  Equal to the total base artifacts that went into making it: 1 + level*(level+1)/2 */
export function artifactFuelValue(level: number): number {
  return 1 + level * (level + 1) / 2;
}

/** Gold value for selling a leveled artifact instance. */
export function artifactSellValue(id: string, level = 0): number {
  const def = ARTIFACT_DEFS[id as ArtifactEffectId];
  if (!def) return 0;
  return def.sellValue * (level + 1);
}

/** Maps old "upgraded" artifact IDs (pre-leveling system) to their base equivalent. */
export const LEGACY_UPGRADED_MAP: Record<string, ArtifactInstance> = {
  sanguine_bloodstone: { id: "bloodstone",         level: 1, fuel: 0 },
  titans_eye:          { id: "berserkers_eye",      level: 1, fuel: 0 },
  golden_idol:         { id: "greed_idol",          level: 1, fuel: 0 },
  soulfire_brand:      { id: "soulbrand",           level: 1, fuel: 0 },
  fortress_core:       { id: "wardens_core",        level: 1, fuel: 0 },
  death_mark:          { id: "executioners_mark",   level: 1, fuel: 0 },
};

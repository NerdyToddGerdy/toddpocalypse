export type ArtifactEffectId =
  | "bloodstone"
  | "berserkers_eye"
  | "greed_idol"
  | "soulbrand"
  | "wardens_core"
  | "executioners_mark"
  | "sanguine_bloodstone"
  | "titans_eye"
  | "golden_idol"
  | "soulfire_brand"
  | "fortress_core"
  | "death_mark";

export interface ArtifactDef {
  id: ArtifactEffectId;
  name: string;
  desc: string;
  icon: string;
  tier: "base" | "upgraded";
  upgradesFrom?: ArtifactEffectId;
  effectValue: number;
  cap?: number;
  sellValue: number;
}

export const ARTIFACT_DEFS: Record<ArtifactEffectId, ArtifactDef> = {
  bloodstone: {
    id: "bloodstone",
    name: "Bloodstone",
    desc: "Heal party 1% max HP on each kill",
    icon: "🩸",
    tier: "base",
    effectValue: 0.01,
    sellValue: 50,
  },
  berserkers_eye: {
    id: "berserkers_eye",
    name: "Berserker's Eye",
    desc: "+1% DPS per kill streak (max 20%), resets on death",
    icon: "👁",
    tier: "base",
    effectValue: 0.01,
    cap: 0.20,
    sellValue: 50,
  },
  greed_idol: {
    id: "greed_idol",
    name: "Greed Idol",
    desc: "Boss gold ×1.5",
    icon: "🪙",
    tier: "base",
    effectValue: 1.5,
    sellValue: 50,
  },
  soulbrand: {
    id: "soulbrand",
    name: "Soulbrand",
    desc: "+3% crit chance per rune equipped on this character",
    icon: "💫",
    tier: "base",
    effectValue: 0.03,
    sellValue: 50,
  },
  wardens_core: {
    id: "wardens_core",
    name: "Warden's Core",
    desc: "-10% damage taken (additive, capped at 50% total)",
    icon: "🛡",
    tier: "base",
    effectValue: 0.10,
    sellValue: 50,
  },
  executioners_mark: {
    id: "executioners_mark",
    name: "Executioner's Mark",
    desc: "Elite enemies trigger an extra boss-drop check",
    icon: "⚔",
    tier: "base",
    effectValue: 1.0,
    sellValue: 50,
  },
  sanguine_bloodstone: {
    id: "sanguine_bloodstone",
    name: "Sanguine Bloodstone",
    desc: "Heal party 2% max HP on each kill",
    icon: "❤",
    tier: "upgraded",
    upgradesFrom: "bloodstone",
    effectValue: 0.02,
    sellValue: 200,
  },
  titans_eye: {
    id: "titans_eye",
    name: "Titan's Eye",
    desc: "+2% DPS per kill streak (max 30%), resets on death",
    icon: "🔥",
    tier: "upgraded",
    upgradesFrom: "berserkers_eye",
    effectValue: 0.02,
    cap: 0.30,
    sellValue: 200,
  },
  golden_idol: {
    id: "golden_idol",
    name: "Golden Idol",
    desc: "Boss gold ×2",
    icon: "🏆",
    tier: "upgraded",
    upgradesFrom: "greed_idol",
    effectValue: 2.0,
    sellValue: 200,
  },
  soulfire_brand: {
    id: "soulfire_brand",
    name: "Soulfire Brand",
    desc: "+5% crit chance per rune equipped on this character",
    icon: "✨",
    tier: "upgraded",
    upgradesFrom: "soulbrand",
    effectValue: 0.05,
    sellValue: 200,
  },
  fortress_core: {
    id: "fortress_core",
    name: "Fortress Core",
    desc: "-20% damage taken (additive, capped at 50% total)",
    icon: "🏰",
    tier: "upgraded",
    upgradesFrom: "wardens_core",
    effectValue: 0.20,
    sellValue: 200,
  },
  death_mark: {
    id: "death_mark",
    name: "Death Mark",
    desc: "Elite enemies have a 10% chance to drop an extra item",
    icon: "💀",
    tier: "upgraded",
    upgradesFrom: "executioners_mark",
    effectValue: 0.10,
    sellValue: 200,
  },
};

/** Base-tier artifact IDs eligible to drop from dungeon bosses. */
export const ARTIFACT_DROP_POOL: ArtifactEffectId[] = [
  "bloodstone",
  "berserkers_eye",
  "greed_idol",
  "soulbrand",
  "wardens_core",
  "executioners_mark",
];

/** Returns true if two inventory artifact IDs can be combined into an upgraded artifact. */
export function canCombineArtifacts(id1: string, id2: string): boolean {
  if (id1 !== id2) return false;
  const def = ARTIFACT_DEFS[id1 as ArtifactEffectId];
  return !!def && def.tier === "base";
}

/** Returns the upgraded artifact ID produced by combining two copies of the given base artifact. */
export function getCombineResult(id: string): ArtifactEffectId | null {
  const upgraded = Object.values(ARTIFACT_DEFS).find(
    d => d.tier === "upgraded" && d.upgradesFrom === (id as ArtifactEffectId)
  );
  return upgraded?.id ?? null;
}

/** Returns the gold value for selling an artifact. */
export function artifactSellValue(id: string): number {
  return ARTIFACT_DEFS[id as ArtifactEffectId]?.sellValue ?? 0;
}

import { ARTIFACT_DEFS, ARTIFACT_DROP_POOL, LEGACY_UPGRADED_MAP, type ArtifactDef, type ArtifactEffectId, type ArtifactInstance } from "./data/artifacts.js";
export { ARTIFACT_DEFS, ARTIFACT_DROP_POOL, LEGACY_UPGRADED_MAP };
export type { ArtifactDef, ArtifactEffectId, ArtifactInstance };

/** Number of same-type artifacts consumed to level up from `level` → `level + 1`. */
export function artifactUpgradeCost(level: number): number {
  return level + 1;
}

/** Fuel units contributed by sacrificing one artifact at the given level.
 *  Equal to the total base artifacts that went into making it: 1 + level*(level+1)/2 */
export function artifactFuelValue(level: number): number {
  return 1 + level * (level + 1) / 2;
}

/** Human-readable current stat string for an artifact at a given level. */
export function artifactStatLabel(id: ArtifactEffectId, level: number): string {
  const def = ARTIFACT_DEFS[id];
  if (!def) return "";
  const eff = def.effectValue * (level + 1);
  switch (id) {
    case "warlords_sigil":    return `+${(eff * 100).toFixed(0)}% party DPS`;
    case "wardens_core":      return `-${(eff * 100).toFixed(0)}% damage taken`;
    case "bloodstone":        return `${(eff * 100).toFixed(0)}% max HP healed per kill`;
    case "greed_idol":        return `×${(1 + eff).toFixed(1)} boss gold`;
    case "soulbrand":         return `+${(eff * 100).toFixed(0)}% crit per rune`;
    case "berserkers_eye":    return `+${(eff * 100).toFixed(0)}% DPS per kill streak (cap ${((def.cap ?? 0.20) * (level + 1) * 100).toFixed(0)}%)`;
    case "executioners_mark": return `${level + 1} extra boss drop check${level > 0 ? "s" : ""} on elites`;
    case "phantom_compass":   return `+${(eff * 100).toFixed(0)}% XP gain`;
    case "fortunes_eye":      return `+${(eff * 100).toFixed(0)}% gear drop chance`;
  }
}

/** Gold value for selling a leveled artifact instance. */
export function artifactSellValue(id: string, level = 0): number {
  const def = ARTIFACT_DEFS[id as ArtifactEffectId];
  if (!def) return 0;
  return def.sellValue * (level + 1);
}

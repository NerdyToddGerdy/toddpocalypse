/**
 * Visual theme identity and persistence rules.
 *
 * Pure module — no DOM, no localStorage — so the resolution and migration logic
 * is testable on its own. `main.ts` owns the actual reading, writing and applying.
 */

/**
 * Every selectable look, default first.
 *
 * `torchlight` is the franchise house look (bible §3). The other seven are a
 * deliberate divergence — see `docs/franchise-divergences.md` for the reasoning.
 */
export const THEMES = [
  "torchlight",
  "grimdark",
  "arcane",
  "inferno",
  "void-rift",
  "bloodmoon",
  "frost-crypt",
  "necropolis",
] as const;

/** A selectable visual theme. */
export type Theme = typeof THEMES[number];

/** The look a player sees before they choose anything. */
export const DEFAULT_THEME: Theme = "torchlight";

/**
 * Retired theme ids mapped to their replacements.
 *
 * `torchlight` shipped as `tavern` until v2.34.0. Per bible §6, stored player
 * state is never dropped on a rename — anyone who picked Tavern keeps the same
 * look under its new name rather than being silently reset.
 */
export const LEGACY_THEME_ALIASES: Record<string, Theme> = {
  tavern: "torchlight",
};

/** Type guard for theme strings read back from storage. */
export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/**
 * Turns whatever is in storage into a theme that actually exists.
 *
 * Live ids pass through, retired ids migrate via {@link LEGACY_THEME_ALIASES},
 * and anything unrecognised (or absent) falls back to {@link DEFAULT_THEME}.
 *
 * @param saved - The raw stored value, or null when nothing is stored yet.
 */
export function resolveTheme(saved: string | null): Theme {
  if (!saved) return DEFAULT_THEME;
  if (isTheme(saved)) return saved;
  return LEGACY_THEME_ALIASES[saved] ?? DEFAULT_THEME;
}

/**
 * Pure HTML/string builders shared by the main.ts renderer.
 * Nothing in this module may touch the DOM (`document`/`window`) — these functions
 * take serialized state and return markup strings, which keeps them unit-testable.
 */
import {
  CLICK_UPGRADE_EFFECT,
  DEFENSE_UPGRADE_EFFECT,
  DPS_UPGRADE_EFFECT,
  formatNumber,
  type GameStateDict,
  HP_UPGRADE_EFFECT,
  SKILL_DEFS,
  startingGoldForLevel,
  UPGRADE_EFFECTS,
} from "../engine.js";
import {
  autoSellThreshold,
  buildSetBonusHTML,
  type GearItemDict,
  type GearStats,
  QUAL,
  qualityClass,
} from "../gear.js";
import { CLASS_ABILITIES, type Rune } from "../character.js";

/** Serialized character snapshot as rendered by the UI. */
export type CharDict = GameStateDict["party"][number];
/** CharDict augmented with the renderer-computed effective_dps (base dps × upgrade multiplier). */
export type CharDictWithEffectiveDps = CharDict & { effective_dps?: number };
/** Data for one ability card in the skills tooltip. */
export interface AbilityCardData { icon: string; name: string; desc: string; level: number; unlocked: boolean; }

const EMOJI_SPR: Record<string, string> = {
  "⚔": "sword",  "⚔️": "sword",
  "🛡": "shield",
  "💀": "skull",
  "💎": "gem",
  "🏆": "trophy",
  "💰": "bag",
  "🪙": "coin",
  "🍀": "clover",
  "🔥": "flame",
  "📖": "book",
  "📦": "chest",
  "🏰": "castle",
  "⚑": "flag",
  "🚩": "redflag",
  "👑": "crown",
  "👁": "eye",
  "👢": "boot",
  "🧥": "robe",
  "🌑": "moon",
  "✨": "sparkle",
  "⚠": "warning",
  "🏹": "bow",
  "🗡": "dagger",
  "🔮": "orb",
  "⚡": "lightning",
  "🌿": "herb",
  "🩸": "blood",
  "📜": "scroll",
  "🧤": "armor",
  "❤": "heart",  "♥": "heart",
  "💍": "ring",
  "⛑": "helmet",
};

/**
   * Returns an inline 16×16 pixel sprite span for a mapped emoji, or the raw emoji as fallback.
   *
   * @param emoji - the name of the emoji
   * @returns The inline 16x16 pixel sprite span for a mapped emoji, or the raw emoji as fallback
*/
export function getSprite(emoji: string): string {
  const name = EMOJI_SPR[emoji];
  return name ? `<span class="spr spr-${name}" aria-hidden="true"></span>` : emoji;
}

/** Colors for each enrage stack level (index 0 = charging/not enraged, 1+ = stack N). */
export const ENRAGE_COLORS = ["#f59e0b", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"];

/** Bar fill gradient per enrage stack (current in-progress fill). */
export const ENRAGE_BAR_GRADIENTS = [
  "linear-gradient(90deg, #b45309, #f59e0b)",
  "linear-gradient(90deg, #ef4444, #f87171)",
  "linear-gradient(90deg, #dc2626, #ef4444)",
  "linear-gradient(90deg, #b91c1c, #dc2626)",
  "linear-gradient(90deg, #991b1b, #b91c1c)",
  "linear-gradient(90deg, #7f1d1d, #991b1b)",
];

export function enrageColor(stack: number): string {
  return ENRAGE_COLORS[Math.min(stack, ENRAGE_COLORS.length - 1)];
}

export function enrageBarGradient(stack: number): string {
  return ENRAGE_BAR_GRADIENTS[Math.min(stack, ENRAGE_BAR_GRADIENTS.length - 1)];
}

/**
 * get the labels for the upgrade section.
 * @param utype - The upgrade type identifier (for example, "dps" or "xp").
 * @param level - the numeric upgrade level
 * @returns a string of the calculated effect's percentage.
 */
export function getUpgradeBonusLabel(utype: string, level: number): string {
  if (level === 0) return "";
  switch (utype) {
    case "dps":     return `+${(level * DPS_UPGRADE_EFFECT * 100).toFixed(0)}% DPS`;
    case "xp":      return `+${Math.round(level * UPGRADE_EFFECTS.xp * 100)}% XP`;
    case "click":   return `+${(level * CLICK_UPGRADE_EFFECT * 100).toFixed(0)}% Click`;
    case "hp":      return `+${(level * HP_UPGRADE_EFFECT * 100).toFixed(0)}% HP`;
    case "defense": return `+${(level * DEFENSE_UPGRADE_EFFECT * 100).toFixed(0)}% Def`;
    default:        return "";
  }
}

/**
 * Like {@link getUpgradeBonusLabel} but strips the trailing stat name — used in the mobile grid where the name is already on the left.
 *
 * @param utype - string - The upgrade type identifier (for example, "dps" or "xp")
 * @param level - number - the numeric upgrade level
 * @returns - string - string without the stat name for the mobile version
 */
export function getMobileUpgradeValue(utype: string, level: number): string {
  const full = getUpgradeBonusLabel(utype, level);
  return full ? full.replace(/\s+\S+$/, "") : "";
}

// RecordImages for the hero character and their companions
export const HERO_IMG: Record<string, string> = {
  fighter: "hero_fighter.png",
  rogue:   "hero_rogue.png",
  mage:    "hero_mage.png",
  paladin: "hero_paladin.png",
  ranger:  "hero_ranger.png",
  druid:   "hero_fighter.png",
};

export const RUNE_STAT_LABELS: Record<string, string> = {
  dps: "DPS", maxHp: "Max HP", haste: "Haste", goldBonus: "Gold Bonus", xpMultiplier: "XP Mult", critChance: "Crit Chance",
};
export const RUNE_ICONS: Record<string, string> = {
  striking: "⚔️", warding: "🛡", swiftness: "💨", greed: "💰", fortune: "🍀", wrath: "💢",
};
export const ALL_SLOTS = ["main_hand","off_hand","helmet","chest","gloves","legs","shoes","ring1","ring2"] as const;
export const SLOT_LABELS: Record<string, string> = {
  main_hand: "Main Hand", off_hand: "Off Hand", helmet: "Helmet", chest: "Chest",
  gloves: "Gloves", legs: "Legs", shoes: "Shoes", ring1: "Ring 1", ring2: "Ring 2",
};

export const SKILL_NAMES: Record<string, string> = {
  skill_battle_cry:    "📯 Battle Cry",
  skill_shadow_strike: "🌑 Shadow Strike",
  skill_arcane_surge:  "⚡ Arcane Surge",
  skill_consecrate:    "🙏 Consecrate",
  skill_volley:        "🏹 Volley",
  skill_entangle:      "🌿 Entangle",
};
export const SKILL_DESCS: Record<string, string> = {
  skill_battle_cry:    "Doubles party damage for 8 kills.",
  skill_shadow_strike: "Triples all damage (tick + click) for 5 kills.",
  skill_arcane_surge:  "Triples party damage for 6 kills.",
  skill_consecrate:    "Instantly heals all party members for 50% of their max HP.",
  skill_volley:        "×2.5 party DPS for 6 kills.",
  skill_entangle:      "Reduces enemy attack by 60% for 8 kills.",
};

export function renderAutoSellerConfig(state: GameStateDict): string {
  const threshold = autoSellThreshold(state.highest_level);
  const checked = new Set(state.auto_sell_qualities ?? []);
  const rows = (QUAL as readonly string[]).slice(0, threshold + 1).map(q =>
    `<label class="auto-sell-row">
      <input type="checkbox" data-action="toggle-auto-sell" data-quality="${q}" ${checked.has(q) ? "checked" : ""} />
      <span class="auto-sell-name ${qualityClass(q)}">${q}</span>
    </label>`
  ).join("");
  const nextIdx = threshold + 1;
  const nextFloor = nextIdx * 4 + 1;
  const nextTier = nextIdx < (QUAL as readonly string[]).length - 1
    ? `<div class="auto-sell-next">Next: <span class="${qualityClass((QUAL as readonly string[])[nextIdx])}">${(QUAL as readonly string[])[nextIdx]}</span> at floor ${nextFloor}</div>`
    : "";
  return `<div class="auto-seller-config">${rows}${nextTier}</div>`;
}

/** Returns a short "Current: …" label for a stackable prestige upgrade, or "" if not applicable. */
export function prestigeCurrentStat(type: string, owned: number): string {
  if (owned <= 0) return "";
  switch (type) {
    case "starting_gold":  return `Current: +${startingGoldForLevel(owned)}g per run`;
    case "xp_bonus":       return `Current: +${owned * 10}% XP`;
    case "gold_bonus":     return `Current: +${owned * 10}% gold`;
    case "dps_bonus":      return `Current: +${owned * 5}% DPS`;
    case "gold_mastery":   return `Current: +${owned * 20}% boss gold`;
    case "gear_luck":      return `Current: +${Math.min(owned * 5, 75)}% drop chance`;
    case "checkpoint":     return `Current: respawn at floor ${owned * 5}`;
    case "stash":          return `Current: ${[3, 6, 10, 15][owned - 1] ?? 15} stash slots`;
    default: return "";
  }
}

/** Returns a short "Current: …" label for a guild upgrade at its current tier, or "" if not applicable. */
export function guildCurrentStat(type: string, stacks: number, lootMax: number): string {
  if (stacks <= 0) return "";
  switch (type) {
    case "expanded_armory": return `Current: ${lootMax} loot slots`;
    case "companion_hall":  return stacks >= 3 ? "Current: Party Slots IV + V + VI unlocked" : stacks >= 2 ? "Current: Party Slots IV + V unlocked" : "Current: Party Slot IV unlocked";
    case "rune_forge":      return `Current: Forge Tier ${stacks}`;
    default: return "";
  }
}

/** Renders Guild Hall upgrade cards with current stack count, gold cost, and description. */
export function guildUpgradePreview(type: string, stacks: number, lootMax: number): string {
  if (type === "expanded_armory") {
    const cur = lootMax;
    return `Loot chest: ${cur} → ${cur + 2} slots`;
  }
  if (type === "companion_hall") {
    return stacks === 0 ? "Unlocks: Party Slot IV" : stacks === 1 ? "Unlocks: Party Slot V" : "Unlocks: Party Slot VI";
  }
  return "";
}

export function runeStatSummary(c: CharDict): string {
  const totals: Record<string, number> = {};
  for (const rune of Object.values(c.runes ?? {})) {
    if (!rune) continue;
    totals[rune.statKey] = (totals[rune.statKey] ?? 0) + rune.value;
  }
  const chips = Object.entries(totals)
    .map(([key, val]) => `<span class="pdoll-stat-chip">+${val} ${RUNE_STAT_LABELS[key] ?? key}</span>`)
    .join("");
  return chips || `<span class="pdoll-stats-empty">No runes socketed</span>`;
}

export function charMiniHeader(c: CharDict): string {
  const heroImg = HERO_IMG[c.character_class] ?? HERO_IMG.fighter;
  const hpPct = c.max_health > 0 ? Math.max(0, Math.round((c.health / c.max_health) * 100)) : 0;
  const xpPct = c.xp_to_next > 0 ? Math.round((c.xp / c.xp_to_next) * 100) : 0;
  const hpLow = hpPct <= 25;
  return `<div class="char-mini-header">
    <img class="char-mini-sprite" src="${heroImg}" alt="${c.character_class}">
    <div class="char-mini-info">
      <div class="char-mini-name">${c.name}</div>
      <div class="char-mini-class">${c.character_class} · <span class="char-level">Lv ${c.level}</span></div>
      <div class="char-mini-dps">${c.dps.toFixed(1)} DPS</div>
      <div class="char-mini-bars">
        <div class="char-mini-bar-wrap">
          <div class="char-mini-bar hp-fill${hpLow ? " hp-bar-low" : ""}" style="width:${hpPct}%"></div>
        </div>
        <div class="char-mini-bar-wrap">
          <div class="char-mini-bar xp-fill" style="width:${xpPct}%"></div>
        </div>
      </div>
    </div>
  </div>`;
}

export function buildRuneTooltipHTML(rune: Rune & { slotLabel: string }): string {
  const icon = RUNE_ICONS[rune.type] ?? "🔮";
  const statLabel = RUNE_STAT_LABELS[rune.statKey] ?? rune.statKey;
  const TIER_LABELS: Record<string, string> = { lesser: "Lesser", greater: "Greater", flawless: "Flawless", ancient: "Ancient" };
  const TIER_CLS: Record<string, string> = { lesser: "tt-rarity quality-common", greater: "tt-rarity quality-legendary", flawless: "tt-rarity quality-epic", ancient: "tt-rarity quality-divine" };
  const tierLabel = TIER_LABELS[rune.tier] ?? rune.tier;
  const tierCls = TIER_CLS[rune.tier] ?? "tt-rarity quality-common";
  return `
    <span class="tt-name">${getSprite(icon)} ${rune.name}</span>
    <div class="${tierCls}">${tierLabel}</div>
    <div class="tt-subtitle">${rune.slotLabel}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats"><div class="tt-stat-row"><span class="tt-stat-label">${statLabel}</span><span class="tt-stat-val tt-dps">+${rune.value}</span></div></div>
  `;
}

/** Builds the inner HTML for the item tooltip given a serialized GearItemDict. */
export function buildTooltipHTML(item: GearItemDict, equippedSetCount = 0): string {
  const qc = qualityClass(item.quality);
  const stats = item.stats ?? { dps: item.damage };
  const defs: [keyof GearStats, string, string, boolean][] = [
    ["dps",        "Damage",      "tt-dps",   true],
    ["maxHp",      "Max HP",      "tt-hp",    true],
    ["clickBonus", "Click Dmg",   "tt-click", true],
    ["defense",    "Defense",     "tt-def",   false],
    ["critChance", "Crit Chance", "tt-crit",  false],
    ["goldBonus",  "Gold Find",   "tt-gold",  false],
    ["lifesteal",  "Lifesteal",   "tt-life",  false],
    ["haste",      "Haste",       "tt-haste", false],
    ["xpBonus",    "XP Bonus",    "tt-xp",    false],
  ];
  const statRows = defs
    .filter(([k]) => (stats[k] ?? 0) > 0)
    .map(([k, label, cls, isNumeric]) => {
      const v = stats[k]!;
      const fmt = isNumeric ? `+${v.toFixed(1)}` : `+${(v * 100).toFixed(0)}%`;
      return `<div class="tt-stat-row"><span class="tt-stat-label">${label}</span><span class="tt-stat-val ${cls}">${fmt}</span></div>`;
    })
    .join("");
  const rarity = item.quality.charAt(0).toUpperCase() + item.quality.slice(1);
  const setBlock = item.set_name ? buildSetBonusHTML(item.set_name, equippedSetCount) : "";
  return `
    <span class="tt-name ${qc}">${item.short_name ?? item.name}</span>
    <div class="tt-rarity ${qc}">${rarity}</div>
    <div class="tt-subtitle">${item.slot_display} · Floor ${item.dungeon_level}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">${statRows || '<div class="tt-stat-row"><span class="tt-stat-label">No stats</span></div>'}</div>
    ${setBlock}
    <div class="tt-divider"></div>
    <div class="tt-sell">Sell: ${formatNumber(item.sell_value)}g</div>
  `;
}

export function statRow(label: string, value: string, cls = ""): string {
  return `<div class="tt-stat-row"><span class="tt-stat-label">${label}</span><span class="tt-stat-val${cls ? " " + cls : ""}">${value}</span></div>`;
}

export function buildCharTooltipHTML(c: CharDictWithEffectiveDps): string {
  const classAbilities = CLASS_ABILITIES[c.character_class] ?? [];
  const unlocked = classAbilities.filter(a => c.abilities.includes(a.id));
  const rows = [
    statRow("DPS",        `${(c.effective_dps ?? c.dps).toFixed(1)}`,                   "tt-dps"),
    statRow("HP",         `${Math.ceil(c.health)} / ${c.max_health}`, "tt-hp"),
    c.click_bonus   > 0 ? statRow("Click Dmg",   `+${c.click_bonus.toFixed(1)}`,           "tt-click") : "",
    c.damage_reduction > 0 ? statRow("Defense",  `+${(c.damage_reduction * 100).toFixed(0)}%`, "tt-def")   : "",
    c.crit_chance   > 0 ? statRow("Crit Chance", `+${(c.crit_chance * 100).toFixed(1)}%`,  "tt-crit")  : "",
    c.gold_bonus    > 0 ? statRow("Gold Find",   `+${(c.gold_bonus * 100).toFixed(0)}%`,   "tt-gold")  : "",
    c.lifesteal     > 0 ? statRow("Lifesteal",   `+${(c.lifesteal * 100).toFixed(0)}%`,    "tt-life")  : "",
    c.haste         > 0 ? statRow("Haste",        `+${(c.haste * 100).toFixed(0)}%`,        "tt-haste") : "",
    c.xp_multiplier > 1 ? statRow("XP Bonus",    `${(c.xp_multiplier * 100).toFixed(0)}%`, "tt-xp")   : "",
  ].filter(Boolean).join("");
  const runeSquares = ALL_SLOTS.map(slot => {
    const rune: Rune | undefined = c.runes?.[slot];
    if (!rune) return `<span class="tt-rune-slot empty" title="${SLOT_LABELS[slot] ?? slot}: empty"></span>`;
    const tierClass = rune.tier ?? "lesser";
    const icon = RUNE_ICONS[rune.type] ?? "🔮";
    const statLabel = RUNE_STAT_LABELS[rune.statKey] ?? rune.statKey;
    return `<span class="tt-rune-slot ${tierClass}" title="${SLOT_LABELS[slot] ?? slot}: ${icon} +${rune.value} ${statLabel}"></span>`;
  }).join("");
  const runeBadges = `<div class="tt-divider"></div><div class="tt-rune-row">${runeSquares}</div>`;
  const abilityBadges = unlocked.length
    ? `<div class="tt-divider"></div><div class="tt-abilities">${unlocked.map(a => `<span class="tt-ability">${getSprite(a.icon)} ${a.name}</span>`).join("")}</div>`
    : "";
  const heroImg = HERO_IMG[c.character_class] ?? HERO_IMG.fighter;
  return `
    <img class="tt-hero-portrait" src="${heroImg}" alt="${c.character_class}">
    <span class="tt-name">${c.name}</span>
    <div class="tt-rarity" style="color:var(--muted);text-transform:none;font-weight:400">Lv${c.level} ${c.character_class}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">${rows}</div>
    ${runeBadges}
    ${abilityBadges}
  `;
}

export function buildPartyTooltipHTML(party: CharDictWithEffectiveDps[]): string {
  const alive = party.filter(c => c.health > 0);
  const totalDps  = alive.reduce((s, c) => s + (c.effective_dps ?? c.dps), 0);
  const totalHp   = party.reduce((s, c) => s + Math.ceil(c.health), 0);
  const totalMaxHp = party.reduce((s, c) => s + c.max_health, 0);
  const members = party.map(c =>
    `<div class="tt-stat-row"><span class="tt-stat-label">${c.name}</span><span class="tt-stat-val" style="color:var(--muted);font-weight:400">Lv${c.level} ${c.character_class}</span></div>`
  ).join("");
  return `
    <span class="tt-name">Your Party</span>
    <div class="tt-subtitle">${party.length} member${party.length !== 1 ? "s" : ""}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">
      ${statRow("Total DPS", totalDps.toFixed(1), "tt-dps")}
      ${statRow("Total HP",  `${totalHp} / ${totalMaxHp}`, "tt-hp")}
    </div>
    <div class="tt-divider"></div>
    <div class="tt-stats">${members}</div>
  `;
}

function statParts(stats: GearStats): string[] {
  const parts: string[] = [];
  if (stats.dps)        parts.push(`+${stats.dps.toFixed(1)} DPS`);
  if (stats.maxHp)      parts.push(`+${stats.maxHp} HP`);
  if (stats.clickBonus) parts.push(`+${stats.clickBonus.toFixed(1)} Click`);
  if (stats.defense)    parts.push(`+${(stats.defense * 100).toFixed(0)}% Def`);
  if (stats.critChance) parts.push(`+${(stats.critChance * 100).toFixed(0)}% Crit`);
  if (stats.goldBonus)  parts.push(`+${(stats.goldBonus * 100).toFixed(0)}% Gold`);
  if (stats.lifesteal)  parts.push(`+${(stats.lifesteal * 100).toFixed(0)}% Life`);
  if (stats.haste)      parts.push(`+${(stats.haste * 100).toFixed(0)}% Haste`);
  if (stats.xpBonus)    parts.push(`+${(stats.xpBonus * 100).toFixed(0)}% XP`);
  return parts;
}

export function formatStats(stats: GearStats): string {
  return statParts(stats).join("  ") || "+0";
}

/** Renders loot chest stats as individual <span> elements for grid layout, with tri indicator on first stat. */
export function formatLootStats(tri: string, stats: GearStats): string {
  const parts = statParts(stats);
  if (parts.length === 0) return '<span class="loot-stat">+0</span>';
  return parts.map((p, i) => `<span class="loot-stat">${i === 0 && tri ? tri : ""}${p}</span>`).join("");
}

export function buildSkillTooltipHTML(a: AbilityCardData): string {
  const statusClass = a.unlocked ? "rarity-rare" : "rarity-common";
  const statusText  = a.unlocked ? "Unlocked" : `Requires Level ${a.level}`;
  return `
    <div class="tt-name">${getSprite(a.icon)} ${a.name}</div>
    <div class="tt-rarity ${statusClass}">${statusText}</div>
    <div class="tt-divider"></div>
    <div class="tt-stat-row"><span class="tt-stat-label">${a.desc}</span></div>`;
}

export function buildActiveSkillTooltipHTML(skillId: string, skillState?: { remaining: number; expiry: number; totalCooldown: number; isActive: boolean; onCooldown: boolean }): string {
  const name = SKILL_NAMES[skillId] ?? skillId;
  const desc = SKILL_DESCS[skillId] ?? "";
  let cooldownKills: number;
  cooldownKills = skillState?.totalCooldown ?? SKILL_DEFS[skillId]?.cooldownKills ?? 30;
  let statusLine: string;
  if (skillState?.isActive) {
    const left = skillState.expiry;
    statusLine = `<div class="skill-tooltip-status skill-status-active">${getSprite("⚡")} Active — ${left} kill${left !== 1 ? "s" : ""} remaining</div>`;
  } else if (skillState?.onCooldown) {
    const left = skillState.remaining;
    statusLine = `<div class="skill-tooltip-status skill-status-cooldown">⏳ Cooldown — ${left} / ${cooldownKills} kills</div>`;
  } else {
    statusLine = `<div class="skill-tooltip-status skill-status-ready">✓ Ready</div>`;
  }
  return `<div class="skill-tooltip"><div class="skill-tooltip-name">${name}</div><div class="skill-tooltip-desc">${desc}</div><div class="skill-tooltip-cd">Cooldown: ${cooldownKills} kills</div>${statusLine}</div>`;
}

export function buildDpsTooltipHTML(d: { total: number; base: number; gear: number; runes?: number; upgDps: number }): string {
  return `
    <div class="tt-name">DPS Breakdown</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">
      ${statRow("Base", d.base.toFixed(1), "tt-dps")}
      ${d.upgDps > 0 ? statRow("Upgrades", `+${d.upgDps.toFixed(1)}`, "tt-dps") : ""}
      ${d.gear > 0 ? statRow("Gear", `+${d.gear.toFixed(1)}`, "tt-dps") : ""}
      ${d.runes && d.runes > 0 ? statRow("Runes", `+${d.runes.toFixed(1)}`, "tt-dps") : ""}
    </div>
    <div class="tt-divider"></div>
    ${statRow("Total", d.total.toFixed(1), "tt-dps")}
  `;
}

export function buildArtifactTooltipHTML(a: { id: string; level: number; name: string; icon: string; stat: string }): string {
  const lvlLabel = a.level > 0 ? ` +${a.level}` : "";
  return `
    <span class="tt-name">${getSprite(a.icon)} ${a.name}${lvlLabel}</span>
    <div class="tt-divider"></div>
    <div class="tt-stats"><div class="tt-stat-row"><span class="tt-stat-label">${a.stat || "No effect"}</span></div></div>
  `;
}

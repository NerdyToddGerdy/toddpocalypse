import { GameState, type GameStateDict, type ArtifactInstance, VENTURE_UNLOCK_LEVEL, ventureUnlockLevel, PRESTIGE_UNLOCK_LEVEL, GUILD_HALL_COSTS, GUILD_HALL_DUNGEON_REQ, GUILD_HALL_PREREQS, SKILL_DEFS, prestigeUpgradeCost, THEME_UNLOCKS, ACHIEVEMENTS, RUNE_DEFS, type AchievementUnlock, ARTIFACT_DEFS, artifactFuelValue, artifactStatLabel, AVATAR_DEFS, BORDER_DEFS, formatNumber, LEGACY_UNLOCKS, type RetiredHero, UPGRADE_EFFECTS, HP_UPGRADE_EFFECT, DEFENSE_UPGRADE_EFFECT, CONSTELLATION_NODE_DEFS } from "./engine.js";
import { qualityClass, autoSellThreshold, QUAL, qualityWeights, QUALITY_CLASSES, gearPower, SET_DEFS, buildSetBonusHTML, type GearStats, type GearItemDict } from "./gear.js";
import { VERSION, CHANGELOG } from "./changelog.js";
import { CLASS_ABILITIES, type Rune } from "./character.js";
import { parseAuthHash, getStoredToken, storeToken, clearToken, getLoginUrl, cloudLoad, cloudSave, cloudClaimSession, resetSessionId, getOrCreateSessionId } from "./cloud.js";

const HERO_IMG: Record<string, string> = {
  fighter: "hero_fighter.png",
  rogue:   "hero_rogue.png",
  mage:    "hero_mage.png",
  paladin: "hero_paladin.png",
  ranger:  "hero_ranger.png",
  druid:   "hero_fighter.png",
};

const CLASS_DESCS: Record<string, string> = {
  fighter: "Highest idle DPS. Each level-up multiplies damage by 1.2×.",
  rogue: "Gains +0.3 click damage every level. Rewards active play.",
  mage: "Gains +5% XP rate every level. Slow start, fast late-game.",
  paladin: "Tank/healer. 25% damage reduction at Lv5, heals party on kill at Lv10.",
  ranger: "Gains +0.2 click damage every level. 30% crit chance at Lv5, +60% DPS at Lv10.",
  druid: "Nature warden. Party lifesteal at Lv5, +40% passive DPS at Lv10, party heal per kill at Lv20.",
};

const GUILD_HALL_META: Record<string, { icon: string; name: string; desc: string; dungeonReq?: number }> = {
  companion_hall:      { icon: "🏰", name: "Companion Hall",   desc: "Unlock Party Slot IV (stack 1), Slot V (stack 2), and Slot VI (stack 3) in the Hall of Renown." },
  expanded_armory:     { icon: "🗄", name: "Expanded Armory",  desc: "+2 loot chest capacity per stack (max 14)." },
  class_paladin:       { icon: "🛡", name: "Recruit: Paladin", desc: "Unlock Paladin as a recruitable class for companions. Dungeon 2+.", dungeonReq: 1 },
  class_ranger:        { icon: "🏹", name: "Recruit: Ranger",  desc: "Unlock Ranger as a recruitable class for companions. Dungeon 2+.", dungeonReq: 1 },
  class_druid:         { icon: "🌿", name: "Recruit: Druid",   desc: "Unlock Druid as a recruitable class. Dungeon 3+.", dungeonReq: 2 },
  skill_battle_cry:    { icon: "📯", name: "Battle Cry",       desc: "Fighter: ×2 party DPS for 8 kills. 20-kill cooldown." },
  skill_shadow_strike: { icon: "🌑", name: "Shadow Strike",    desc: "Rogue: ×3 all damage (tick + click) for 5 kills. 20-kill cooldown." },
  skill_arcane_surge:  { icon: "⚡", name: "Arcane Surge",     desc: "Mage: ×3 DPS for 6 kills. 25-kill cooldown." },
  skill_consecrate:    { icon: "🙏", name: "Consecrate",       desc: "Paladin: immediately heals all party members for 50% max HP. 15-kill cooldown.", dungeonReq: 1 },
  skill_volley:        { icon: "🏹", name: "Volley",           desc: "Ranger: ×2.5 party DPS for 6 kills. 15-kill cooldown.", dungeonReq: 1 },
  skill_entangle:      { icon: "🌿", name: "Entangle",         desc: "Druid: reduces enemy attack by 60% for 8 kills. 20-kill cooldown. Dungeon 3+.", dungeonReq: 2 },
  auto_attack:         { icon: "⚔", name: "Auto-Attack",      desc: "Automatically fires a click attack every second. Toggle the AUTO button next to the Attack button." },
  eternal_cycle:       { icon: "⟳", name: "Eternal Cycle",    desc: "Automatically return to town when a run would yield at least N renown. Set the threshold and toggle below." },
  rune_forge:          { icon: "🔮", name: "Rune Forge",       desc: "Socket runes into gear slots for flat stat bonuses. Bosses drop runes at 20%, elites at 10%. Tier 2: recover replaced runes + combine 2 lessers → greater. Tier 3: combine 2 greaters → flawless. Tier 4: combine 2 flawless → ancient." },
  constellation_access: { icon: "✦", name: "Constellation Chart", desc: "Unlock the Constellations passive tree. Invest soul shards to permanently empower your party. Shards are earned by venturing to new dungeons.", dungeonReq: 2 },
};

const SLOT_ICONS: Record<string, string> = {
  main_hand: "🗡",
  off_hand: "🛡",
  helmet: "⛑",
  chest: "🧥",
  gloves: "🧤",
  legs: "👖",
  shoes: "👢",
  ring1: "💍",
  ring2: "💍",
};

const UPGRADE_LABELS: Record<string, { icon: string; label: string }> = {
  dps: { icon: "⚔", label: "DPS" },
  xp: { icon: "✨", label: "XP Rate" },
  click: { icon: "👆", label: "Click Dmg" },
  hp: { icon: "❤", label: "Max HP" },
  defense: { icon: "🛡", label: "Defense" },
};

/** Maps emoji characters to their sprite-sheet class names in 16x16.png. */
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

/** Returns an inline 16×16 pixel sprite span for a mapped emoji, or the raw emoji as fallback. */
function spr(emoji: string): string {
  const name = EMOJI_SPR[emoji];
  return name ? `<span class="spr spr-${name}" aria-hidden="true"></span>` : emoji;
}

/** Colors for each enrage stack level (index 0 = charging/not enraged, 1+ = stack N). */
const ENRAGE_COLORS = ["#f59e0b", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d"];
/** Bar fill gradient per enrage stack (current in-progress fill). */
const ENRAGE_BAR_GRADIENTS = [
  "linear-gradient(90deg, #b45309, #f59e0b)",
  "linear-gradient(90deg, #ef4444, #f87171)",
  "linear-gradient(90deg, #dc2626, #ef4444)",
  "linear-gradient(90deg, #b91c1c, #dc2626)",
  "linear-gradient(90deg, #991b1b, #b91c1c)",
  "linear-gradient(90deg, #7f1d1d, #991b1b)",
];
function enrageColor(stack: number): string {
  return ENRAGE_COLORS[Math.min(stack, ENRAGE_COLORS.length - 1)];
}
function enrageBarGradient(stack: number): string {
  return ENRAGE_BAR_GRADIENTS[Math.min(stack, ENRAGE_BAR_GRADIENTS.length - 1)];
}

function upgradeBonusLabel(utype: string, level: number): string {
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

const SAVE_KEY = "toddpocalypse-save";
const THEME_KEY = "toddpocalypse-theme";
const THEMES = ["grimdark", "arcane", "tavern", "inferno", "void-rift", "bloodmoon", "frost-crypt", "necropolis"] as const;
type Theme = typeof THEMES[number];

/** Sets the active visual theme on the root element, persists it, and updates picker button states. */
function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  document.querySelectorAll<HTMLElement>(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

const BOSS_BORDER_PREFIXES = [
  "abyssal","ancient","cursed","decrepit","dread","eternal","forsaken","foul",
  "frightening","hideous","infernal","monstrous","ravager","rotting","savage",
  "shadow","shadowy","terrible","titan","twisted","undying","venomous","vile",
  "warlord","wretched",
];

function preloadBossAssets(): void {
  for (const prefix of BOSS_BORDER_PREFIXES) {
    const img = new Image();
    img.src = `border_${prefix}.png`;
  }
}

/** Loads the persisted theme from localStorage (defaulting to "arcane") and applies it. */
function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme((THEMES.includes(saved as Theme) ? saved : "arcane") as Theme);
}

let game: GameState | null = null;
let floorProgressKey: string | null = null;
let lifetimeStatsKey: string | null = null;
let logKey: string | null = null;
let lootKey: string | null = null;
let autoSellKey: string | null = null;
let stashKey: string | null = null;
let artifactKey: string | null = null;
let artifactModalArtId: string | null = null;
let artifactModalTargetIdx: number = -1;  // inv index; -1 = viewing an equipped artifact
let artifactModalCharIdx: number = -1;    // char index when viewing equipped
let artifactModalSlotIdx: number = -1;    // slot index when viewing equipped
let artifactModalFuelSelected: Set<number> = new Set();
let aspCharIdx = -1;
let aspSlotIdx = -1;
let upgradeKey: string | null = null;
let partyStructKey: string | null = null;
let partyLootKey: string | null = null;
let prevEquipJsonByChar: string[] = [];
let prevLevelsByChar: number[] = [];
let prestigeKey: string | null = null;
let ventureKey: string | null = null;
let guildKey: string | null = null;
let skillKey: string | null = null;
let companionSkillKey: string | null = null;
let hoveredLootSlot: string | null = null;
let gearSlotModalCharIdx = -1;
let gearSlotModalSlot = "";
let gearLootPickerCharIdx = -1;
let gearLootPickerSlot = "";
let lastDeathCount: number | null = null;
let lastEnrageStacks = -1;
const fullLog: string[] = []; // persistent combat log history (last 200 entries)
const flashStartTimes = new Map<string, number>(); // "ci:slot" → ms timestamp when flash began
let bossPortraitShowing = false;
let autoAttackEnabled = localStorage.getItem("autoAttack") === "1";
let autoAttackIntervalId: number | undefined;
let lastTickSaveTime = 0;
const TICK_SAVE_INTERVAL_MS = 5000;
let gameLoopId: number | undefined;
let portraitEnterTimer: number | undefined;
let portraitExitTimer: number | undefined;
let featsBadgeTimer: number | undefined;

/** Typed getElementById helper — throws if the element is missing rather than returning null. */
function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el;
}

/** Invokes a GameState method, re-renders with the returned JSON, and auto-saves.
 *  Tick calls are throttled to one save per TICK_SAVE_INTERVAL_MS; all other actions save immediately. */
function call<K extends keyof GameState>(method: K, ...args: any[]): void {
  if (!game) return;
  try {
    const fn = game[method] as unknown as (...a: any[]) => string;
    fn.apply(game, args);
    render(game.getState());
    const now = Date.now();
    if (method !== "tick" || now - lastTickSaveTime >= TICK_SAVE_INTERVAL_MS) {
      lastTickSaveTime = now;
      saveGame();
    }
  } catch (e: any) {
    appendLog(spr("⚠") + " " + (e?.message ?? String(e)));
    console.error(method, e);
  }
}

import { KILLS_PER_LEVEL, killsForFloor, CORRUPTION_FLOOR, CORRUPTION_RATE_PER_FLOOR, CORRUPTION_HEAL_REDUCTION_PER_FLOOR, startingGoldForLevel, DPS_UPGRADE_EFFECT, CLICK_UPGRADE_EFFECT, BOSS_ENRAGE_TRIGGER, BOSS_ENRAGE_STEP } from "./engine.js";

/** Full re-render of all UI panels from a GameStateDict snapshot. */
function render(state: GameStateDict): void {
  const currentDeaths = state.deaths;
  if (lastDeathCount === null) {
    lastDeathCount = currentDeaths;
  } else if (currentDeaths > lastDeathCount) {
    showDeathToast(state.dungeon_level);
    lastDeathCount = currentDeaths;
  } else if (currentDeaths < lastDeathCount) {
    lastDeathCount = currentDeaths;
  }

  const enemy = state.enemy;
  $("enemy-name").textContent = enemy.name;
  $("enemy-level").textContent = `Level ${enemy.level}`;
  const stickyNameEl = document.getElementById("enemy-sticky-name");
  if (stickyNameEl) stickyNameEl.textContent = `${enemy.name} · Lv ${enemy.level}`;
  const enemyPanel = document.getElementById("enemy-panel")!;
  enemyPanel.classList.toggle("elite-enemy", !!enemy.is_elite);
  enemyPanel.classList.toggle("boss-enemy", !!enemy.is_boss);
  const portraitWrap = document.getElementById("monster-portrait-wrap")!;
  const portraitInner = document.getElementById("portrait-inner")!;
  const wantsPortrait = enemy.is_boss || !!enemy.is_elite;
  if (wantsPortrait && !bossPortraitShowing) {
    bossPortraitShowing = true;
    const eWords = enemy.name.split(" ");
    ($("monster-portrait") as HTMLImageElement).src = `monster_${eWords[2].toLowerCase()}.png`;
    const borderEl = $("monster-border") as HTMLImageElement;
    if (enemy.is_boss) {
      borderEl.src = `border_${eWords[1].toLowerCase()}.png`;
      borderEl.removeAttribute("hidden");
      portraitInner.classList.remove("elite-portrait-frame");
    } else {
      borderEl.removeAttribute("src");
      borderEl.setAttribute("hidden", "");
      portraitInner.classList.add("elite-portrait-frame");
    }
    portraitWrap.classList.remove("boss-exiting");
    void portraitWrap.offsetWidth;
    portraitWrap.classList.add("boss-visible", "boss-entering");
    clearTimeout(portraitEnterTimer);
    portraitEnterTimer = setTimeout(() => portraitWrap.classList.remove("boss-entering"), 750);
  } else if (!wantsPortrait && bossPortraitShowing) {
    bossPortraitShowing = false;
    portraitInner.classList.remove("elite-portrait-frame");
    portraitWrap.classList.add("boss-exiting");
    clearTimeout(portraitExitTimer);
    portraitExitTimer = setTimeout(() => {
      portraitWrap.classList.remove("boss-visible");
      setTimeout(() => portraitWrap.classList.remove("boss-exiting"), 600);
    }, 380);
  }
  const pct = Math.max(0, (enemy.hp / enemy.max_hp) * 100);
  ($("enemy-hp-bar") as HTMLElement).style.width = pct + "%";
  $("enemy-hp-text").textContent = `${formatNumber(Math.ceil(enemy.hp))} / ${formatNumber(enemy.max_hp)}`;
  const stickyHpBar = document.getElementById("enemy-sticky-hp-bar") as HTMLElement | null;
  if (stickyHpBar) stickyHpBar.style.width = pct + "%";

  // Enrage bar (boss/elite only)
  const enrageEl = $("enemy-enrage-bar-wrap") as HTMLElement;
  if (enrageEl) {
    const enrageTime = state.boss_enrage_time ?? 0;
    const enrageMult = state.boss_enrage_mult ?? 1;
    const wantsEnrage = enemy.is_boss || !!enemy.is_elite;
    enrageEl.classList.toggle("active", wantsEnrage);
    if (wantsEnrage) {
      const isEnraged = enrageMult > 1;
      const stacks = isEnraged
        ? Math.round(Math.log(enrageMult) / Math.log(1.5))
        : 0;

      // Fill percent within current cycle
      const fillPct = isEnraged
        ? Math.min(100, ((enrageTime - BOSS_ENRAGE_TRIGGER) % BOSS_ENRAGE_STEP) / BOSS_ENRAGE_STEP * 100)
        : Math.min(100, enrageTime / BOSS_ENRAGE_TRIGGER * 100);

      const enrageBar = $("enemy-enrage-bar") as HTMLElement;
      const enrageLayers = $("enemy-enrage-layers") as HTMLElement;

      // Rebuild completed-stack strips only when stack count changes
      if (stacks !== lastEnrageStacks) {
        lastEnrageStacks = stacks;
        enrageLayers.innerHTML = "";
        for (let i = 1; i <= stacks; i++) {
          const strip = document.createElement("div");
          strip.className = "enrage-layer";
          strip.style.background = enrageColor(i);
          enrageLayers.appendChild(strip);
        }
        enrageBar.style.background = enrageBarGradient(isEnraged ? stacks + 1 : 0);

        // Border color escalates with stacks
        enrageEl.style.borderColor = stacks > 0 ? enrageColor(stacks) : "#b45309";

        // Portrait border: thicker + more intense per stack
        if (stacks > 0) {
          const idx = Math.min(stacks, ENRAGE_COLORS.length - 1);
          const col = enrageColor(idx);
          const spread = 2 + idx * 2;
          const blur = 10 + idx * 8;
          const glow = 4 + idx * 4;
          portraitInner.style.boxShadow = `0 0 0 ${spread}px ${col}, 0 0 ${blur}px ${glow}px ${col}99`;
          const speed = Math.max(0.25, 0.7 - (stacks - 1) * 0.1);
          portraitInner.style.animationDuration = speed + "s";
          enrageEl.style.animationDuration = speed + "s";
        } else {
          portraitInner.style.boxShadow = "";
          portraitInner.style.animationDuration = "";
          enrageEl.style.animationDuration = "";
        }
      }

      enrageBar.style.width = fillPct + "%";
      $("enemy-enrage-label").innerHTML = isEnraged
        ? `${spr("⚡")} ENRAGED ${enrageMult.toFixed(2)}×`
        : `Enrage in ${Math.ceil(BOSS_ENRAGE_TRIGGER - enrageTime)}s`;
      enrageEl.classList.toggle("enraged", isEnraged);
      portraitInner.classList.toggle("enraged", isEnraged);
    } else {
      if (lastEnrageStacks !== -1) {
        lastEnrageStacks = -1;
        ($("enemy-enrage-layers") as HTMLElement).innerHTML = "";
        portraitInner.style.boxShadow = "";
        portraitInner.style.animationDuration = "";
        enrageEl.style.borderColor = "";
        enrageEl.style.animationDuration = "";
      }
      portraitInner.classList.remove("enraged");
    }
  }

  $("stat-gold").textContent = formatNumber(state.gold);
  const partyGoldEl = $("stat-party-gold-bonus");
  if (partyGoldEl) {
    const bonus = (state.party.length - 1) * 20;
    partyGoldEl.textContent = bonus > 0 ? `+${bonus}% Gold` : "";
    partyGoldEl.hidden = bonus === 0;
  }
  $("stat-dungeon-num").textContent = String(state.dungeon_index + 1);
  $("stat-level").textContent = String(state.dungeon_level);
  $("stat-best").textContent = String(state.highest_level);
  $("stat-kills").textContent = String(state.kills);
  $("stat-deaths").textContent = String(state.deaths);

  const corruptionDepth = state.dungeon_index >= 1 ? Math.max(0, state.dungeon_level - CORRUPTION_FLOOR) : 0;
  const corruptionMult = corruptionDepth * state.dungeon_index;
  const totalCorruptionDps = corruptionMult > 0
    ? state.party.reduce((s, c) => s + c.max_health * corruptionMult * CORRUPTION_RATE_PER_FLOOR, 0)
    : 0;
  const corruptionEl = $("stat-corruption");
  corruptionEl.hidden = totalCorruptionDps <= 0;
  if (totalCorruptionDps > 0) {
    $("stat-corruption-dps").textContent = formatNumber(Math.round(totalCorruptionDps));
    const healReductionPct = Math.round(Math.min(90, corruptionMult * CORRUPTION_HEAL_REDUCTION_PER_FLOOR * 100));
    corruptionEl.title = `Dungeon corruption: ${formatNumber(Math.round(totalCorruptionDps))} damage/s to all party members. Lifesteal reduced by ${healReductionPct}%.`;
  }

  const aliveMembers = state.party.filter(c => c.health > 0);
  const totalHp = aliveMembers.reduce((s, c) => s + Math.ceil(c.health), 0);
  const totalMaxHp = state.party.reduce((s, c) => s + c.max_health, 0);
  const totalDps = aliveMembers.reduce((s, c) => {
    const upgLevel = state.upgrades[c.name]?.dps?.level ?? 0;
    return s + c.dps * (1 + DPS_UPGRADE_EFFECT * upgLevel);
  }, 0);
  $("stat-party-hp").textContent = `${totalHp}/${totalMaxHp}`;
  $("stat-party-dps").textContent = totalDps < 10 ? totalDps.toFixed(1) : String(Math.round(totalDps));

  const hpPct = totalMaxHp > 0 ? totalHp / totalMaxHp : 1;
  (document.getElementById("mobile-party-hp-fill") as HTMLElement).style.width = `${hpPct * 100}%`;
  (document.getElementById("mobile-party-hp-text") as HTMLElement).innerHTML = `${spr("♥")} ${totalHp}/${totalMaxHp}`;
  document.getElementById("mobile-party-hp-bar")!.classList.toggle("hp-low", hpPct < 0.3);

  const idleEl = $("stat-idle-gold");
  if (state.idle_gold_rate > 0) {
    $("stat-idle-rate").textContent = state.idle_gold_rate.toFixed(1);
    idleEl.hidden = false;
  } else {
    idleEl.hidden = true;
  }

  renderProfileWidget(state);
  if (profilePickerOpen) updateProfileDropdownStats(state);
  renderFloorProgress(state);
  renderDepthGauge(state);
  renderParty(state);
  renderLoot(state);
  renderStash(state);
  renderUpgrades(state);
  renderPrestigeShop(state);
  renderGuildHall(state);
  renderConstellationPanel(state);
  renderArtifactPanel(state);
  renderSkillButton(state);
  renderCompanionSkills(state);
  renderLog(state);
  renderThemePicker(state);
  renderFeats(state);
  showAchievementToasts(state.pending_achievements ?? []);
  updateAutoAttackButton();
  updatePrestigeButton(state);
  updateVentureButton(state);
  updateLifetimeStats(state);
  updateShopBadge(state);
  updateTabVisibility(state);
}

let tabVisKey = "";
/** Hides the Prestige and Guild tabs until the player has reached the unlock thresholds. */
function updateTabVisibility(state: GameStateDict): void {
  const ups = state.prestige_upgrades;
  const guildUpgrades = state.guild_upgrades;
  const prestigeUnlocked = state.lifetime_best_level >= PRESTIGE_UNLOCK_LEVEL || state.total_prestiges > 0;
  // unlocked by prestige purchase, or already has guild items (backward compat for existing saves)
  const guildUnlocked = (ups["guild_hall_access"] ?? 0) > 0
    || Object.values(guildUpgrades).some(v => v > 0);
  const constellationUnlocked = (guildUpgrades["constellation_access"] ?? 0) > 0;
  const newKey = `${prestigeUnlocked}|${guildUnlocked}|${constellationUnlocked}`;
  if (newKey === tabVisKey) return;
  tabVisKey = newKey;

  // Sidebar tabs
  const stabPrestige = document.querySelector<HTMLElement>(".stab-btn[data-stab='prestige']");
  const stabGuild    = document.querySelector<HTMLElement>(".stab-btn[data-stab='guild']");
  if (stabPrestige) stabPrestige.hidden = !prestigeUnlocked;
  if (stabGuild)    stabGuild.hidden    = !guildUnlocked;

  // Left-col sub-tab bar for constellations
  const lcoldSubtabs = document.getElementById("left-col-subtabs");
  if (lcoldSubtabs) lcoldSubtabs.hidden = !constellationUnlocked;
  if (!constellationUnlocked) switchLeftColSub("party");

  // Mobile tabs
  const mobilePrestige = document.querySelector<HTMLElement>(".mobile-tab-btn[data-tab='prestige']");
  const mobileGuild    = document.querySelector<HTMLElement>(".mobile-tab-btn[data-tab='guild']");
  if (mobilePrestige) mobilePrestige.hidden = !prestigeUnlocked;
  if (mobileGuild)    mobileGuild.hidden    = !guildUnlocked;

  $("prestige-panel").classList.toggle("prestige-locked", !prestigeUnlocked);
  $("guild-hall-panel").classList.toggle("guild-locked", !guildUnlocked);
}

/** Renders the kill-progress pips, boss indicator text, and checkpoint label below the enemy panel. */
function renderFloorProgress(state: GameStateDict): void {
  const isBoss = state.enemy.is_boss;
  const left = state.monsters_left;
  const total = killsForFloor(state.dungeon_level);
  const done = total - left;
  const isElite = state.enemy.is_elite;

  const newKey = `${state.dungeon_level}|${done}|${isBoss}|${isElite}|${state.checkpoint_level}`;
  if (newKey === floorProgressKey) return;
  floorProgressKey = newKey;


  $("monsters-left-text").textContent = "";
  $("monsters-left-text").className = "";

  const row = $("floor-pip-row");
  row.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="floor-pip${i < done || isBoss ? " done" : ""}"></div>`
  ).join("")
    + (isBoss ? `<div class="floor-pip boss-pip">★</div>` : "");

  const cp = $("checkpoint-display");
  if (state.checkpoint_level > 1) {
    cp.innerHTML = `${spr("⚑")} Checkpoint: Floor ${state.checkpoint_level}`;
    cp.className = "checkpoint-active";
  } else {
    cp.textContent = "";
    cp.className = "";
  }
}

let depthKey: string | null = null;

/** Renders the vertical depth gauge showing current floor, personal best, checkpoint, and death markers. */
function renderDepthGauge(state: GameStateDict): void {
  const current = state.dungeon_level;
  const highest = state.highest_level;
  const maxDisplay = Math.max(highest + 3, 10);
  const deathFloors = state.death_floors ?? {};

  const newKey = `${current}|${highest}|${state.checkpoint_level}|${JSON.stringify(deathFloors)}`;
  if (newKey === depthKey) return;
  depthKey = newKey;

  $("depth-label-top").textContent = "▲ 1";
  $("depth-label-bottom").textContent = `▼ ${maxDisplay}`;

  const track = $("depth-track");
  const trackH = Math.max(160, highest * 10);
  track.style.height = trackH + "px";

  const toPercent = (level: number) =>
    ((level - 1) / (maxDisplay - 1)) * (trackH - 12);

  const currentEl = $("depth-current-marker");
  currentEl.style.top = toPercent(current) + "px";
  $("depth-current-label").textContent = `${current}`;

  $("depth-fill").style.height = (toPercent(current) + 10) + "px";

  const highestEl = $("depth-highest-marker");
  highestEl.style.top = toPercent(highest) + "px";
  $("depth-highest-label").textContent = highest > current ? `${highest}` : "";

  const checkpoint = state.checkpoint_level;
  const cpEl = $("depth-checkpoint-marker") as HTMLElement;
  cpEl.hidden = checkpoint <= 1;
  if (checkpoint > 1) {
    cpEl.style.top = toPercent(checkpoint) + "px";
  }

  // Every-5-floor tick marks on the left side; checkpoint tick gets ⚑ prefix
  const tickContainer = $("depth-ticks-container");
  const ticks: string[] = [];
  for (let floor = 5; floor <= maxDisplay; floor += 5) {
    const top = toPercent(floor);
    const isCp = floor === checkpoint && checkpoint > 1;
    const label = isCp ? `${spr("⚑")}${floor}` : `${floor}`;
    const cls = isCp ? "depth-tick checkpoint-tick" : "depth-tick";
    ticks.push(`<div class="${cls}" style="top:${top}px"><span class="depth-tick-label">${label}</span></div>`);
  }
  tickContainer.innerHTML = ticks.join("");

  const deathContainer = $("depth-deaths-container");
  deathContainer.innerHTML = Object.entries(deathFloors).map(([floor, count]) => {
    const top = toPercent(Number(floor));
    const label = count > 1 ? `${spr("💀")}×${count}` : spr("💀");
    return `<div class="depth-death-marker" style="top:${top}px"><span class="depth-death-label">${label}</span></div>`;
  }).join("");
}

/** Re-renders the party cards section, skipping the DOM write if nothing has changed. */
function renderParty(state: GameStateDict): void {
  const partyEl = $("party-cards");
  const partyH2 = document.querySelector<HTMLElement>("#party-panel h2");

  // Structure key: things that require a full DOM rebuild.
  // Health and XP are intentionally excluded — they are updated in-place below.
  const newLootKey = state.loot_pool.map(i => i.slot + i.name).join("|");
  // Health, XP, and loot pool are intentionally excluded — they are updated in-place below.
  const newStructKey = `${state.party_version ?? 0}|${state.earned_title ?? ""}`;

  if (newStructKey !== partyStructKey) {
    // Detect changed gear slots for the flash animation
    const changedSlots: [number, string][] = [];
    state.party.forEach((c, ci) => {
      const prevEquip: Record<string, { name: string } | null> =
        JSON.parse(prevEquipJsonByChar[ci] ?? "{}") ?? {};
      Object.entries(c.equipment).forEach(([slot, item]) => {
        const prevName = prevEquip[slot]?.name ?? null;
        const newName = item?.name ?? null;
        if (newName !== null && newName !== prevName) changedSlots.push([ci, slot]);
      });
    });
    const leveledUpFlags = state.party.map((c, ci) => c.level > (prevLevelsByChar[ci] ?? 0));

    prevEquipJsonByChar = state.party.map(c => JSON.stringify(c.equipment));
    prevLevelsByChar = state.party.map(c => c.level);
    partyStructKey = newStructKey;
    partyLootKey = newLootKey;

    if (partyH2) partyH2.dataset.party = encodeURIComponent(JSON.stringify(
      state.party.map(c => {
        const upgLevel = state.upgrades[c.name]?.dps?.level ?? 0;
        return { ...c, effective_dps: c.dps * (1 + DPS_UPGRADE_EFFECT * upgLevel) };
      })
    ));

    partyEl.innerHTML = state.party.map((c, ci) => {
      const lootForSlot = (slot: string) => {
        const matchSlot = slot === "ring2" ? "ring1" : slot;
        return state.loot_pool
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => item.slot === matchSlot);
      };
      const lockedSlots = new Set<string>(c.locked_slots ?? []);
      const gearGrid = Object.entries(c.equipment).map(([slot, item]) => {
        const locked = lockedSlots.has(slot);
        const lockBadge = locked ? `<span class="gear-pdoll-lock" title="Locked">🔒</span>` : "";
        const short = GEAR_SLOT_SHORT[slot] ?? slot;
        const icon = SLOT_ICONS[slot] ?? "◻";
        if (item) {
          const qc = qualityClass(item.quality);
          const itemJson = encodeURIComponent(JSON.stringify(item));
          return `<div class="gear-pdoll-cell" data-slot="${slot}">
            <button class="gear-pdoll-slot filled ${qc}${locked ? " gear-locked" : ""}" data-action="gear-slot-click" data-char-idx="${ci}" data-slot="${slot}" data-item="${itemJson}">
              <span class="gear-pdoll-icon">${spr(icon)}</span>
              ${lockBadge}
            </button>
            <span class="gear-pdoll-label">${short}</span>
          </div>`;
        }
        const options = lootForSlot(slot);
        const hasLoot = options.length > 0;
        const countBadge = hasLoot ? `<span class="gear-pdoll-count">${options.length}</span>` : "";
        return `<div class="gear-pdoll-cell" data-slot="${slot}">
          <button class="gear-pdoll-slot ${hasLoot ? "has-loot" : "empty"}${locked ? " gear-locked" : ""}" data-action="${hasLoot ? "gear-slot-click" : ""}" data-char-idx="${ci}" data-slot="${slot}" ${!hasLoot ? "disabled" : ""}>
            <span class="gear-pdoll-icon">${spr(icon)}</span>
            ${countBadge}
            ${lockBadge}
          </button>
          <span class="gear-pdoll-label">${short}</span>
        </div>`;
      }).join("");
      const gearDps = Object.values(c.equipment).reduce((sum, item) =>
        sum + (item?.stats?.dps ?? 0), 0);
      const runeDps = Object.values(c.runes ?? {}).reduce((sum, rune) =>
        sum + (rune?.statKey === "dps" ? (rune?.value ?? 0) : 0), 0);
      const upgLevel = state.upgrades[c.name]?.dps?.level ?? 0;
      const upgMult = 1 + DPS_UPGRADE_EFFECT * upgLevel;
      const upgDps = c.dps * (upgMult - 1);
      const dpsData = encodeURIComponent(JSON.stringify({ total: c.dps * upgMult, base: Math.max(0, c.dps - gearDps - runeDps), gear: gearDps, runes: runeDps, upgDps }));
      const classAbilities = CLASS_ABILITIES[c.character_class] ?? [];
      const abilitiesHtml = classAbilities.map(a => {
        const unlocked = c.abilities.includes(a.id);
        const skillJson = encodeURIComponent(JSON.stringify({ icon: a.icon, name: a.name, desc: a.desc, level: a.level, unlocked }));
        return unlocked
          ? `<span class="ability-badge unlocked" tabindex="0" data-tip="${a.desc}" data-skill="${skillJson}">${spr(a.icon)} ${a.name}</span>`
          : `<span class="ability-badge locked" tabindex="0" data-tip="Lv${a.level}: ${a.desc}" data-skill="${skillJson}">${spr(a.icon)} Lv${a.level}</span>`;
      }).join("");
      const charJson = encodeURIComponent(JSON.stringify({ ...c, effective_dps: c.dps * upgMult }));
      const heroImg = HERO_IMG[c.character_class] ?? HERO_IMG.fighter;
      const runeRowHtml = ALL_SLOTS.map(slot => {
        const rune: Rune | undefined = c.runes?.[slot];
        if (!rune) return `<span class="tt-rune-slot empty"></span>`;
        const tierClass = rune.tier ?? "lesser";
        const runeJson = encodeURIComponent(JSON.stringify({ ...rune, slotLabel: SLOT_LABELS[slot] ?? slot }));
        return `<span class="tt-rune-slot ${tierClass}" data-rune="${runeJson}"></span>`;
      }).join("");
      const artifactSlots: (ArtifactInstance | null)[] = c.artifact_slots ?? [null, null, null];
      const artifactBadgesHtml = artifactSlots.map((inst, si) => {
        if (!inst) return `<span class="char-artifact-badge empty" title="Artifact slot ${si + 1}: empty">·</span>`;
        const def = ARTIFACT_DEFS[inst.id];
        const statLabel = def ? artifactStatLabel(def.id, inst.level) : "";
        const artifactJson = encodeURIComponent(JSON.stringify({ id: inst.id, level: inst.level, name: def?.name ?? inst.id, icon: def?.icon ?? "✨", stat: statLabel }));
        return `<span class="char-artifact-badge filled${inst.level > 0 ? " upgraded" : ""}" data-artifact="${artifactJson}">${spr(def?.icon ?? "✨")}${inst.level > 0 ? `<sup>+${inst.level}</sup>` : ""}</span>`;
      }).join("");

      const hpPct = Math.max(0, Math.round((c.health / c.max_health) * 100));
      const hpLow = hpPct <= 25;
      const xpPct = Math.round((c.xp / c.xp_to_next) * 100);
      // Compute set bonus display for this character
      const equippedItems = Object.values(c.equipment).filter(Boolean) as GearItemDict[];
      const setPieceCounts: Record<string, number> = {};
      for (const item of equippedItems) {
        const sn = item.set_name;
        if (sn) setPieceCounts[sn] = (setPieceCounts[sn] ?? 0) + 1;
      }
      const setBonus2pcActive = SET_DEFS.filter(d => (setPieceCounts[d.name] ?? 0) >= 2);
      const setBonus3pcActive = SET_DEFS.filter(d => (setPieceCounts[d.name] ?? 0) >= 3);
      const setBonusHtml = setBonus2pcActive.length > 0
        ? `<div class="char-set-bonuses">${setBonus2pcActive.map(d => {
            const has3pc = setBonus3pcActive.some(x => x.id === d.id);
            const pcs = setPieceCounts[d.name];
            const setData = encodeURIComponent(JSON.stringify({ name: d.name, count: pcs }));
            return `<span class="set-bonus-badge${has3pc ? " set-3pc" : " set-2pc"}" data-set="${setData}">⚙ ${d.name} ${pcs}/3</span>`;
          }).join("")}</div>`
        : "";

      return `
<div class="char-card${leveledUpFlags[ci] ? " levelup-flash" : ""}${c.health <= 0 ? " is-dead" : ""}">
  <div class="char-header">
    <div class="char-header-left">
      <div class="char-name" data-char="${charJson}">${c.name}</div>
      <div class="char-class">${c.character_class} <span class="char-level">Lv ${c.level}</span></div>
      <div class="char-dps" data-dps="${dpsData}">${(c.dps * upgMult).toFixed(1)} DPS</div>
      <div class="char-rune-row">${runeRowHtml}</div>
      ${artifactSlots.some(Boolean) ? `<div class="char-artifact-row">${artifactBadgesHtml}</div>` : ""}
    </div>
    <img class="hero-sprite" src="${heroImg}" alt="${c.character_class}" data-char="${charJson}">
  </div>
  <div class="char-bars">
    <div class="hp-section">
      <div class="hp-bar-header">
        <span class="hp-label">HP</span>
        <span class="hp-numbers${hpLow ? " hp-low" : ""}">${Math.ceil(c.health)} / ${c.max_health}</span>
      </div>
      <div class="player-hp-bar-wrap">
        <div class="player-hp-bar${hpLow ? " hp-bar-low" : ""}" style="width:${hpPct}%"></div>
      </div>
    </div>
    <div class="xp-section">
      <div class="xp-header">
        <span class="xp-level-label">Level ${c.level}</span>
        <span class="xp-numbers">${c.xp} / ${c.xp_to_next} XP</span>
      </div>
      <div class="xp-bar-wrap">
        <div class="xp-bar" style="width:${xpPct}%"></div>
        <div class="xp-bar-text">${xpPct}%</div>
      </div>
    </div>
  </div>
  <div class="pdoll-grid gear-pdoll-grid">${gearGrid}</div>
  ${setBonusHtml}
  ${abilitiesHtml ? `<div class="char-abilities">${abilitiesHtml}</div>` : ""}
</div>`;
    }).join("");

    applySlotHighlight();

    // Register gear-slot flash animations
    const flashDuration = 2000;
    const now = Date.now();
    changedSlots.forEach(([ci, slot]) => flashStartTimes.set(`${ci}:${slot}`, now));
    for (const [key, start] of flashStartTimes) {
      if (now - start >= flashDuration) flashStartTimes.delete(key);
    }
    const cards = partyEl.querySelectorAll<HTMLElement>(".char-card");
    for (const [key, start] of flashStartTimes) {
      const [ciStr, slot] = key.split(":");
      const row = cards[+ciStr]?.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
      if (row) {
        const elapsed = (now - start) / 1000;
        row.style.animationDelay = `-${elapsed}s`;
        row.classList.add("slot-flash");
      }
    }
  }

  // In-place live updates — patch HP/XP bars without touching gear DOM
  const cards = partyEl.querySelectorAll<HTMLElement>(".char-card");
  state.party.forEach((c, ci) => {
    const card = cards[ci];
    if (!card) return;

    const hpPct = Math.max(0, Math.round((c.health / c.max_health) * 100));
    const hpLow = hpPct <= 25;
    const isDead = c.health <= 0;
    card.classList.toggle("is-dead", isDead);

    const hpBar = card.querySelector<HTMLElement>(".player-hp-bar");
    if (hpBar) { hpBar.style.width = `${hpPct}%`; hpBar.classList.toggle("hp-bar-low", hpLow); }
    const hpNumbers = card.querySelector<HTMLElement>(".hp-numbers");
    if (hpNumbers) { hpNumbers.textContent = `${Math.ceil(c.health)} / ${c.max_health}`; hpNumbers.classList.toggle("hp-low", hpLow); }

    const xpPct = Math.round((c.xp / c.xp_to_next) * 100);
    const xpBar = card.querySelector<HTMLElement>(".xp-bar");
    if (xpBar) xpBar.style.width = `${xpPct}%`;
    const xpBarText = card.querySelector<HTMLElement>(".xp-bar-text");
    if (xpBarText) xpBarText.textContent = `${xpPct}%`;
    const xpNumbers = card.querySelector<HTMLElement>(".xp-numbers");
    if (xpNumbers) xpNumbers.textContent = `${c.xp} / ${c.xp_to_next} XP`;
  });

  // In-place loot row updates — only patch empty gear slot rows when loot pool changes
  if (newLootKey !== partyLootKey) {
    partyLootKey = newLootKey;
    const lootBySlot = new Map<string, { item: GearItemDict; idx: number }[]>();
    state.loot_pool.forEach((item, idx) => {
      const slot = item.slot === "ring2" ? "ring1" : item.slot;
      if (!lootBySlot.has(slot)) lootBySlot.set(slot, []);
      lootBySlot.get(slot)!.push({ item, idx });
    });
    const lootCards = partyEl.querySelectorAll<HTMLElement>(".char-card");
    state.party.forEach((c, ci) => {
      const card = lootCards[ci];
      if (!card) return;
      const lockedSlots = new Set<string>(c.locked_slots ?? []);
      card.querySelectorAll<HTMLElement>(".gear-pdoll-cell").forEach(cell => {
        const slot = cell.dataset.slot;
        if (!slot) return;
        const btn = cell.querySelector<HTMLButtonElement>(".gear-pdoll-slot");
        if (!btn || btn.classList.contains("filled")) return;
        const locked = lockedSlots.has(slot);
        const matchSlot = slot === "ring2" ? "ring1" : slot;
        const options = lootBySlot.get(matchSlot) ?? [];
        const hasLoot = options.length > 0;
        btn.className = `gear-pdoll-slot ${hasLoot ? "has-loot" : "empty"}${locked ? " gear-locked" : ""}`;
        btn.disabled = !hasLoot;
        btn.dataset.action = hasLoot ? "gear-slot-click" : "";
        const countEl = btn.querySelector<HTMLElement>(".gear-pdoll-count");
        if (hasLoot) {
          if (countEl) countEl.textContent = String(options.length);
          else btn.insertAdjacentHTML("beforeend", `<span class="gear-pdoll-count">${options.length}</span>`);
        } else {
          countEl?.remove();
        }
        const lockEl = btn.querySelector<HTMLElement>(".gear-pdoll-lock");
        if (locked && !lockEl) btn.insertAdjacentHTML("beforeend", `<span class="gear-pdoll-lock" title="Locked">🔒</span>`);
        else if (!locked) lockEl?.remove();
      });
    });
  }
}

function applySlotHighlight(): void {
  document.querySelectorAll<HTMLElement>(".gear-pdoll-slot[data-slot]").forEach(btn => {
    btn.classList.toggle("slot-highlight", hoveredLootSlot !== null && btn.dataset.slot === hoveredLootSlot);
  });
}

function openGearSlotModal(charIdx: number, slot: string, state: GameStateDict): void {
  const item = (state.party[charIdx]?.equipment as Record<string, GearItemDict | null> | undefined)?.[slot];
  if (!item) return;
  gearSlotModalCharIdx = charIdx;
  gearSlotModalSlot = slot;
  const qc = qualityClass(item.quality);
  const locked = (state.party[charIdx]?.locked_slots ?? []).includes(slot);
  document.getElementById("gear-slot-modal-title")!.innerHTML =
    `<span class="${qc}">${item.name}</span>`;
  document.getElementById("gear-slot-modal-subtitle")!.textContent =
    `${SLOT_LABELS[slot] ?? slot} · ${item.quality}`;
  document.getElementById("gear-slot-modal-body")!.innerHTML = `
    <div class="gear-sm-stats">${formatStats(item.stats ?? { dps: item.damage })}</div>
    <div class="gear-sm-actions">
      <button class="gear-sm-lock-btn" data-action="gear-slot-lock" data-char-idx="${charIdx}" data-slot="${slot}">
        ${locked ? "🔒 Locked" : "🔓 Unlocked"}
      </button>
      <button class="gear-sm-unequip-btn" data-action="gear-slot-unequip" data-char-idx="${charIdx}" data-slot="${slot}">Remove</button>
    </div>
  `;
  document.getElementById("gear-slot-modal")!.classList.add("open");
}

function closeGearSlotModal(): void {
  gearSlotModalCharIdx = -1;
  gearSlotModalSlot = "";
  document.getElementById("gear-slot-modal")!.classList.remove("open");
}

function openGearLootPicker(charIdx: number, slot: string, state: GameStateDict): void {
  gearLootPickerCharIdx = charIdx;
  gearLootPickerSlot = slot;
  document.getElementById("gear-loot-picker-title")!.textContent =
    `${SLOT_LABELS[slot] ?? slot}`;
  const matchSlot = slot === "ring2" ? "ring1" : slot;
  const items = (state.loot_pool ?? [])
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.slot === matchSlot);
  const body = document.getElementById("gear-loot-picker-body")!;
  body.innerHTML = items.length === 0
    ? `<div class="prune-empty">No items available for this slot.</div>`
    : items
        .sort((a, b) => (QUAL as readonly string[]).indexOf(b.item.quality) - (QUAL as readonly string[]).indexOf(a.item.quality))
        .map(({ item: li, idx }) => {
          const qc = qualityClass(li.quality);
          return `<button class="gear-loot-pick-item" data-action="gear-loot-pick-equip" data-char-idx="${charIdx}" data-slot="${slot}" data-inv-idx="${idx}">
            <span class="gear-loot-pick-quality ${qc}">●</span>
            <span class="gear-loot-pick-name ${qc}">${li.short_name ?? li.name}</span>
            <span class="gear-loot-pick-stat">${formatStats(li.stats ?? { dps: li.damage })}</span>
          </button>`;
        }).join("");
  document.getElementById("gear-loot-picker-modal")!.classList.add("open");
}

function closeGearLootPicker(): void {
  gearLootPickerCharIdx = -1;
  gearLootPickerSlot = "";
  document.getElementById("gear-loot-picker-modal")!.classList.remove("open");
}

/** Renders the loot chest with equip/sell buttons and auto-seller quality checkboxes. */
function renderLoot(state: GameStateDict): void {
  const loot = state.loot_pool;
  const ups = state.prestige_upgrades;
  const autoSellOwned    = (ups["auto_seller"]  ?? 0) > 0;
  const autoEquipOwned   = (ups["auto_equip"]   ?? 0) > 0;
  const autoUpgradeOwned = (ups["auto_upgrade"] ?? 0) > 0;
  const stashUnlocked = (ups["stash"] ?? 0) > 0;
  const stash = state.gear_stash ?? [];
  const stashSizes = [3, 6, 10, 15];
  const stashLevel = ups["stash"] ?? 0;
  const stashMax = stashSizes[stashLevel - 1] ?? 15;
  const stashFull = stash.length >= stashMax;

  // Auto-action toggles
  const togglesSection = document.getElementById("auto-toggles-section")!;
  const hasToggles = autoEquipOwned || autoSellOwned || autoUpgradeOwned;
  togglesSection.hidden = !hasToggles;
  if (hasToggles) {
    const togglesKey = `${autoEquipOwned}|${state.auto_equip_enabled}|${autoSellOwned}|${state.auto_sell_enabled}|${autoUpgradeOwned}|${state.auto_upgrade_enabled}`;
    if (togglesSection.dataset.key !== togglesKey) {
      togglesSection.dataset.key = togglesKey;
      const btns = [
        autoEquipOwned   ? `<button class="auto-toggle-btn${state.auto_equip_enabled   ? " on" : ""}" data-action="toggle-auto-action" data-type="auto_equip">Auto Equip: ${state.auto_equip_enabled ? "ON" : "OFF"}</button>` : "",
        autoSellOwned    ? `<button class="auto-toggle-btn${state.auto_sell_enabled    ? " on" : ""}" data-action="toggle-auto-action" data-type="auto_sell">Auto Sell: ${state.auto_sell_enabled ? "ON" : "OFF"}</button>` : "",
        autoUpgradeOwned ? `<button class="auto-toggle-btn${state.auto_upgrade_enabled ? " on" : ""}" data-action="toggle-auto-action" data-type="auto_upgrade">Auto Upgrade: ${state.auto_upgrade_enabled ? "ON" : "OFF"}</button>` : "",
      ].filter(Boolean).join("");
      togglesSection.innerHTML = btns;
    }
  }

  const newKey = loot.map((i) => i.slot + i.name).join("|") + "|" + JSON.stringify(state.auto_sell_qualities) + "|" + state.highest_level + "|" + stashUnlocked + "|" + stashFull;
  if (newKey !== lootKey) {
    lootKey = newKey;

    const lootEl = $("loot-items");
    $("loot-count").textContent = loot.length ? `(${loot.length}/${state.loot_max})` : "";
    const equipAllBtn = document.querySelector<HTMLButtonElement>(".equip-all-btn");
    if (equipAllBtn) equipAllBtn.disabled = loot.length === 0;
    const sellAllBtn = document.querySelector<HTMLButtonElement>(".sell-all-btn");
    if (sellAllBtn) sellAllBtn.disabled = loot.length === 0;

    const sortedLoot = [...loot].sort((a, b) =>
      (QUAL as readonly string[]).indexOf(b.quality) - (QUAL as readonly string[]).indexOf(a.quality)
    );
    lootEl.innerHTML = sortedLoot.length === 0
      ? `<div class="loot-empty">No drops yet…</div>`
      : sortedLoot.map((item) => {
          const i = loot.indexOf(item);
          const [tri, triCls] = lootTier(item, state.party);
          const qc = qualityClass(item.quality);
          const itemJson = encodeURIComponent(JSON.stringify(item));
          const setName = item.set_name;
          const displayName = setName ? `${setName} ${item.slot_display}` : (item.short_name ?? item.name);
          return `
<div class="loot-item${setName ? " set-piece" : ""}" data-slot="${item.slot}" data-item="${itemJson}">
  <div class="loot-header">
    <span class="loot-name ${qc}">${displayName}</span>
    <span class="loot-slot-badge">${item.slot_display}</span>
  </div>
  ${setName ? `<div class="set-badge">${setName}</div>` : ""}
  <div class="loot-body">
    <div class="loot-dmg ${triCls || qc}">${formatLootStats(tri, item.stats ?? { dps: item.damage })}</div>
    <div class="loot-btns">
      <button class="equip-btn" data-action="equip" data-idx="${i}">Equip</button>
      <button class="sell-btn"  data-action="sell"  data-idx="${i}">${formatNumber(item.sell_value)}g</button>
      ${stashUnlocked ? `<button class="stash-loot-btn" data-action="stash-loot" data-idx="${i}" ${stashFull ? "disabled" : ""}>📦</button>` : ""}
    </div>
  </div>
</div>`;
        }).join("");
  }

  const section = document.getElementById("auto-seller-section")!;
  section.hidden = !autoSellOwned;
  const divider = document.getElementById("loot-divider");
  if (divider) divider.hidden = !autoSellOwned;
  if (autoSellOwned) {
    const newAutoSellKey = JSON.stringify(state.auto_sell_qualities) + "|" + state.highest_level;
    if (newAutoSellKey !== autoSellKey) {
      autoSellKey = newAutoSellKey;
      $("auto-seller-config").innerHTML = renderAutoSellerConfig(state);
    }
  }
}

/** Renders the gear stash panel if the stash upgrade is purchased. */
function renderStash(state: GameStateDict): void {
  const ups = state.prestige_upgrades;
  const stashLevel = ups["stash"] ?? 0;
  const section = document.getElementById("stash-section")!;
  section.hidden = stashLevel === 0;
  if (stashLevel === 0) return;

  const stash = state.gear_stash ?? [];
  const stashSizes = [3, 6, 10, 15];
  const stashMax = stashSizes[stashLevel - 1] ?? 15;
  const partyNames = state.party.map(c => c.name);
  const newKey = stash.map(i => i.slot + i.name + i.quality).join("|") + "|" + stashMax + "|" + partyNames.join(",");
  if (newKey === stashKey) return;
  stashKey = newKey;

  document.getElementById("stash-count")!.textContent = `(${stash.length}/${stashMax})`;
  const container = document.getElementById("stash-items")!;
  if (stash.length === 0) {
    container.innerHTML = `<div class="stash-empty">Stash is empty</div>`;
    return;
  }
  const multiChar = partyNames.length > 1;
  const charOptions = partyNames.map((name, ci) => `<option value="${ci}">${name}</option>`).join("");
  container.innerHTML = stash.map((item, idx) => {
    const qc = qualityClass(item.quality);
    const statsText = formatLootStats("", item.stats ?? {});
    const setName = item.set_name;
    const displayName = setName ? `${setName} ${item.slot_display}` : (item.short_name ?? item.name);
    const charSel = multiChar
      ? `<select class="stash-char-select">${charOptions}</select>`
      : `<input type="hidden" class="stash-char-select" value="0">`;
    return `<div class="stash-item${setName ? " set-piece" : ""}">
  <div class="stash-item-header">
    <span class="stash-item-name ${qc}">${displayName}</span>
    <span class="stash-item-slot">${item.slot_display}</span>
  </div>
  ${setName ? `<div class="set-badge">${setName}</div>` : ""}
  ${statsText ? `<div class="stash-item-stats">${statsText}</div>` : ""}
  <div class="stash-item-btns">
    ${charSel}
    <button class="stash-equip-btn" data-action="equip-from-stash" data-stash-idx="${idx}">Equip</button>
    <button class="stash-sell-btn" data-action="sell-from-stash" data-stash-idx="${idx}">${formatNumber(item.sell_value)}g</button>
  </div>
</div>`;
  }).join("");
}

/** Renders per-character stat upgrade cards with current level, cost, and effect. */
function renderUpgrades(state: GameStateDict): void {
  const structureKey = JSON.stringify(state.upgrades);
  if (structureKey !== upgradeKey) {
    upgradeKey = structureKey;

    // ── Desktop cards ──────────────────────────────────────────────────────
    $("upgrade-cards").innerHTML = state.party
      .map((c) => {
        const ups = state.upgrades[c.name];
        const rows = Object.entries(ups)
          .map(([utype, u]) => {
            const meta = UPGRADE_LABELS[utype];
            const bonus = upgradeBonusLabel(utype, u.level);
            return `<div class="upgrade-row">
              <span class="upgrade-icon">${spr(meta.icon)}</span>
              <span class="upgrade-label">${meta.label}</span>
              <div class="upgrade-level">
                <span>Lv ${u.level}</span>
                ${bonus ? `<span class="upgrade-bonus">${bonus}</span>` : ""}
              </div>
              <button class="upgrade-btn"
                  data-action="upgrade"
                  data-char="${c.name}"
                  data-type="${utype}"
                  data-cost="${u.cost}">${formatNumber(u.cost)}g</button>
            </div>`;
          })
          .join("");
        return `<div class="upgrade-card">
          <div class="upgrade-char-name">${c.name}</div>
          ${rows}
        </div>`;
      })
      .join("");

    // ── Mobile grid (stats down, heroes across) ───────────────────────────
    const cols = state.party.length;
    const statOrder = Object.keys(UPGRADE_LABELS);
    const gridEl = document.getElementById("upgrade-grid")!;
    gridEl.style.gridTemplateColumns = `auto repeat(${cols}, 1fr)`;

    // Header row: empty corner + one name per character
    const headerCells = state.party.map(c =>
      `<div class="ug-char-header">${c.name.split(" ")[0]}</div>`
    ).join("");

    // Stat rows: label cell + one button per character
    const statRows = statOrder.map(utype => {
      const meta = UPGRADE_LABELS[utype];
      const btnCells = state.party.map(c => {
        const u = state.upgrades[c.name]?.[utype as keyof typeof state.upgrades[string]];
        if (!u) return `<div class="ug-cell ug-empty"></div>`;
        const bonus = upgradeBonusLabel(utype, u.level);
        return `<button class="upgrade-btn ug-btn"
            data-action="upgrade"
            data-char="${c.name}"
            data-type="${utype}"
            data-cost="${u.cost}"
            title="${meta.label} — ${c.name} (Lv ${u.level})">${formatNumber(u.cost)}g<span class="ug-btn-meta">Lv ${u.level}${bonus ? ` · ${bonus}` : ""}</span></button>`;
      }).join("");
      return `<div class="ug-stat-label">${spr(meta.icon)} ${meta.label}</div>${btnCells}`;
    }).join("");

    gridEl.innerHTML = `<div class="ug-corner"></div>${headerCells}${statRows}`;
  }

  // Update disabled state for both layouts in one pass
  $("upgrades-panel").querySelectorAll<HTMLButtonElement>(".upgrade-btn").forEach(btn => {
    btn.disabled = state.gold < parseInt(btn.dataset.cost!, 10);
  });
}

const PRESTIGE_SHOP_META: Record<string, { icon: string; name: string; desc: string; max: number; guildReq?: number; dungeonReq?: number }> = {
  guild_hall_access: { icon: "⚔", name: "Guild Hall",    desc: "Unlocks the Guild Hall — hire companions, learn skills, and expand your party.", max: 1 },
  auto_seller:   { icon: "🤖", name: "Auto Seller",    desc: "Auto-sells checked quality tiers after each kill.", max: 1 },
  auto_equip:    { icon: "⚔", name: "Auto Equip",     desc: "Automatically equips loot upgrades after each kill.", max: 1 },
  auto_upgrade:  { icon: "📈", name: "Auto Upgrade",   desc: "Automatically buys the cheapest affordable stat upgrade after each kill.", max: 1 },
  smart_seller:  { icon: "🧠", name: "Smart Seller",   desc: "Automatically checks new quality tiers in the Auto Seller as they become available. Requires Auto Seller.", max: 1 },
  party_slot_2:  { icon: "👤", name: "Party Slot II",  desc: "Add a 2nd party member (pick class).", max: 1 },
  party_slot_3:  { icon: "👥", name: "Party Slot III", desc: "Add a 3rd member. Requires Slot II.", max: 1 },
  party_slot_4:  { icon: "👥", name: "Party Slot IV",  desc: "Add a 4th member. Requires Slot III + Companion Hall.", max: 1, guildReq: 1 },
  party_slot_5:  { icon: "👥", name: "Party Slot V",   desc: "Add a 5th member. Requires Slot IV + Companion Hall II.", max: 1, guildReq: 2 },
  party_slot_6:  { icon: "👥", name: "Party Slot VI",  desc: "Add a 6th member. Requires Slot V + Companion Hall III.", max: 1, guildReq: 3 },
  starting_gold:    { icon: "💰", name: "Starting Gold",    desc: "Gold at run start scales with level — covers all upgrades to match.", max: Infinity },
  xp_bonus:         { icon: "✨", name: "XP Bonus",         desc: "+10% XP gain for all party members.", max: Infinity },
  gold_bonus:       { icon: "🪙", name: "Gold Bonus",       desc: "+10% gold from kills per stack.", max: Infinity },
  dps_bonus:        { icon: "⚔", name: "DPS Bonus",        desc: "+5% party DPS per stack.", max: Infinity },
  checkpoint:       { icon: "⚑", name: "Checkpoint",       desc: "Each level adds a respawn checkpoint at the next multiple of 5 (lv1→floor 5, lv2→floor 10, lv3→floor 15…).", max: 20 },
  gold_mastery:     { icon: "💰", name: "Gold Mastery",     desc: "+20% gold from bosses per stack. Dungeon 2+.", max: Infinity, dungeonReq: 1 },
  gear_luck:        { icon: "🍀", name: "Gear Luck",        desc: "+5% item drop chance per stack (max 75%). Dungeon 2+.", max: 10, dungeonReq: 1 },
  combine_all_runes:{ icon: "🔮", name: "Combine All Runes",desc: "Adds a 'Combine All' button to the rune panel — auto-combines all matching pairs in sequence. Dungeon 3+.", max: 1, dungeonReq: 2 },
  stash:            { icon: "📦", name: "Gear Stash",       desc: "Persistent stash that survives a return to town. Lv1: 3 slots (free), Lv2: 6 slots, Lv3: 10 slots, Lv4: 15 slots. Dungeon 3+.", max: 4, dungeonReq: 2 },
};

/** Builds the HTML for quality-tier auto-sell checkboxes shown beneath the loot chest. */
function renderAutoSellerConfig(state: GameStateDict): string {
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

let profilePickerOpen = false;
let profilePickerTab: "avatar" | "border" | "title" = "avatar";

let profileWidgetKey = "";

function renderProfileWidget(state: GameStateDict): void {
  const selectedAvatar = state.selected_avatar ?? "default";
  const selectedBorder = state.selected_border ?? "none";
  const selectedTitle = state.earned_title ?? "nobody";
  const newKey = `${selectedAvatar}|${selectedBorder}|${selectedTitle}|${profilePickerOpen}`;
  if (newKey === profileWidgetKey) return;
  profileWidgetKey = newKey;

  const avatarDef = AVATAR_DEFS.find(a => a.id === selectedAvatar) ?? AVATAR_DEFS[0];
  const borderDef = BORDER_DEFS.find(b => b.id === selectedBorder) ?? BORDER_DEFS[0];

  $("header-avatar-btn").innerHTML = `
    <div class="header-avatar-wrap ${borderDef.cssClass}">
      <span class="header-avatar-icon">${spr(avatarDef.icon)}</span>
    </div>
    <span class="header-avatar-label">${selectedTitle}</span>`;

  $("profile-picker-dropdown").hidden = !profilePickerOpen;

  const retireBtn = document.getElementById("retire-hero-btn") as HTMLButtonElement | null;
  if (retireBtn) {
    const canRetire = (state.dungeon_index ?? 0) >= 1;
    retireBtn.disabled = !canRetire;
    retireBtn.title = canRetire ? "Permanently retire this hero and start over" : "Reach Dungeon 2 to unlock retirement";
  }
}

function updateProfileDropdownStats(state: GameStateDict): void {
  const set = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  const hero = state.party?.[0];
  if (hero) {
    set("pstat-hero-name",   hero.name ?? "—");
    set("pstat-hero-class",  hero.character_class ?? "—");
    set("pstat-hero-level",  String(hero.level ?? 1));
    set("pstat-hero-floor",  String(state.dungeon_level ?? 1));
    set("pstat-hero-gold",   formatNumber(state.gold ?? 0) + "g");
    set("pstat-hero-kills",  String(state.kills ?? 0));
    set("pstat-hero-deaths", String(state.deaths ?? 0));
  }
  set("pstat-acc-dungeon",   String((state.dungeon_index ?? 0) + 1));
  set("pstat-acc-best",      String(state.lifetime_best_level ?? 1));
  set("pstat-acc-prestiges", String(state.total_prestiges ?? 0));
  set("pstat-acc-kills",     String(state.lifetime_kills ?? 0));
  set("pstat-acc-deaths",    String(state.lifetime_deaths ?? 0));
}

function renderHallOfFame(retiredHeroes: RetiredHero[]): void {
  const body = $("hall-of-fame-body");
  if (retiredHeroes.length === 0) {
    body.innerHTML = `<p class="hof-empty">No retired heroes yet. Reach Dungeon 2 and retire your hero to leave a legacy.</p>`;
    return;
  }
  const sorted = [...retiredHeroes].sort((a, b) => b.score - a.score);
  body.innerHTML = sorted.map((h, i) => `
    <div class="hof-entry">
      <span class="hof-rank">#${i + 1}</span>
      <div class="hof-info">
        <span class="hof-name">${h.name}</span>
        <span class="hof-class">${h.characterClass}</span>
      </div>
      <div class="hof-stats">
        <span>Lv ${h.level}</span>
        <span>Floor ${h.highestFloor}</span>
        <span>D${h.dungeonIndex + 1}</span>
        <span>${h.prestigeCount}★</span>
      </div>
      <span class="hof-score">${h.score.toLocaleString()}</span>
      <span class="hof-date">${h.retiredOn}</span>
    </div>
  `).join("");
}

function renderRetireConfirm(state: GameStateDict): void {
  const nextCount = (state.retirement_count ?? 0) + 1;
  const unlock = LEGACY_UNLOCKS[nextCount];
  const preview = $("retire-unlock-preview");
  if (unlock) {
    const parts: string[] = [];
    if (unlock.classes.length) parts.push(`Unlock class: <strong>${unlock.classes.map(c => c[0].toUpperCase() + c.slice(1)).join(", ")}</strong>`);
    parts.push(`Earn title: <strong>${unlock.title}</strong>`);
    if (unlock.avatar) parts.push(`Earn avatar: <strong>${AVATAR_DEFS.find(a => a.id === unlock.avatar)?.name ?? unlock.avatar}</strong>`);
    if (unlock.border) parts.push(`Earn border: <strong>${unlock.border[0].toUpperCase() + unlock.border.slice(1)}</strong>`);
    preview.innerHTML = `<div class="retire-unlock-box"><div class="retire-unlock-title">Legacy Reward #${nextCount}</div>${parts.map(p => `<div class="retire-unlock-item">✦ ${p}</div>`).join("")}</div>`;
  } else {
    preview.innerHTML = `<div class="retire-unlock-box retire-unlock-none">All legacy unlocks already earned.</div>`;
  }
}

function showCreationOverlayForRetirement(state: GameStateDict): void {
  const unlockedClasses = new Set<string>(state.unlocked_hero_classes ?? ["fighter", "rogue", "mage"]);
  const picker = $("class-picker");
  picker.querySelectorAll<HTMLButtonElement>(".class-btn").forEach(btn => {
    const cls = btn.dataset.class ?? "";
    const unlocked = unlockedClasses.has(cls);
    btn.disabled = !unlocked;
    btn.classList.toggle("locked-class", !unlocked);
    if (!unlocked) {
      const legacyUnlockNum = Object.entries(LEGACY_UNLOCKS).find(([, u]) => u.classes.includes(cls));
      btn.title = legacyUnlockNum ? `Retire ${legacyUnlockNum[0]} time${parseInt(legacyUnlockNum[0]) > 1 ? "s" : ""} to unlock` : "Locked";
    } else {
      btn.title = "";
    }
  });
  const firstUnlocked = picker.querySelector<HTMLButtonElement>(".class-btn:not([disabled])");
  picker.querySelectorAll(".class-btn").forEach(b => b.classList.remove("selected"));
  firstUnlocked?.classList.add("selected");
  ($("char-name-input") as HTMLInputElement).value = "";
  $("save-section").style.display = "none";
  $("new-game-section").style.display = "flex";
  $("creation-overlay").style.display = "flex";
  updateClassDesc();
}

const COSMETIC_SOURCE: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const def of ACHIEVEMENTS) {
    const rewards = def.tiers ? def.tiers.map(t => t.reward).filter(Boolean) : def.reward ? [def.reward] : [];
    for (const r of rewards) {
      if (r && r.cosmetic) m.set(r.cosmetic, def.name);
    }
  }
  return m;
})();

function renderCustomizeModal(state: GameStateDict): void {
  const earnedAvatars = new Set<string>(state.earned_avatars ?? ["default"]);
  const earnedBorders = new Set<string>(state.earned_borders ?? ["none"]);
  const selectedAvatar = state.selected_avatar ?? "default";
  const selectedBorder = state.selected_border ?? "none";
  const earnedTitles: string[] = state.earned_titles ?? [];
  const selectedTitle = state.earned_title ?? "nobody";
  const allTitles = ["nobody", ...earnedTitles];

  $("customize-picker-content").innerHTML = `
    <div class="profile-picker-tabs">
      <button class="profile-tab-btn ${profilePickerTab === "avatar" ? "active" : ""}" data-action="profile-tab" data-tab="avatar">Avatar</button>
      <button class="profile-tab-btn ${profilePickerTab === "border" ? "active" : ""}" data-action="profile-tab" data-tab="border">Border</button>
      <button class="profile-tab-btn ${profilePickerTab === "title" ? "active" : ""}" data-action="profile-tab" data-tab="title">Title</button>
    </div>
    ${profilePickerTab === "avatar"
      ? `<div class="profile-picker-grid">
          ${AVATAR_DEFS.map(a => {
            const earned = earnedAvatars.has(a.id);
            const active = a.id === selectedAvatar;
            const src = COSMETIC_SOURCE.get(a.id);
            const tip = src ? (earned ? `From: ${src}` : `Unlock via: ${src}`) : "";
            return `<button class="profile-pick-btn ${earned ? "" : "locked"} ${active ? "active" : ""}" data-action="set-avatar" data-avatar-id="${a.id}" ${earned ? "" : "disabled"}${tip ? ` title="${tip}"` : ""}>
              <span class="pick-icon">${spr(a.icon)}</span>
              <span class="pick-name">${a.name}</span>
            </button>`;
          }).join("")}
        </div>`
      : profilePickerTab === "border"
      ? `<div class="profile-picker-grid">
          ${BORDER_DEFS.map(b => {
            const earned = earnedBorders.has(b.id);
            const active = b.id === selectedBorder;
            const src = COSMETIC_SOURCE.get(b.id);
            const tip = src ? (earned ? `From: ${src}` : `Unlock via: ${src}`) : "";
            return `<button class="profile-pick-btn ${b.cssClass} ${earned ? "" : "locked"} ${active ? "active" : ""}" data-action="set-border" data-border-id="${b.id}" ${earned ? "" : "disabled"}${tip ? ` title="${tip}"` : ""}>
              <div class="pick-border-preview ${b.cssClass}"></div>
              <span class="pick-name">${b.name}</span>
            </button>`;
          }).join("")}
        </div>`
      : `<div class="title-picker-chips">
          ${allTitles.map(t =>
            `<button class="title-chip${selectedTitle === t ? " active" : ""}" data-action="set-title" data-title="${t}">${t}</button>`
          ).join("")}
        </div>`
    }`;
}

/** Renders the Prestige Shop item list, marking purchased one-time items and unaffordable items. */
function renderPrestigeShop(state: GameStateDict): void {
  const newKey = JSON.stringify(state.prestige_upgrades) + "|" + state.prestige_points + "|" + state.dungeon_index + "|" + state.auto_prestige_enabled + "|" + state.auto_prestige_threshold + "|" + JSON.stringify(state.guild_upgrades);
  if (newKey === prestigeKey) return;
  prestigeKey = newKey;

  const pts = state.prestige_points;
  $("prestige-points-display").textContent = pts > 0 ? `(${formatNumber(pts)} renown)` : "";

  const ups = state.prestige_upgrades;
  const guildUpgrades = state.guild_upgrades;
  const companionHall = guildUpgrades["companion_hall"] ?? 0;

  // --- Party Members unified card ---
  const PARTY_SLOT_KEYS = ["party_slot_2","party_slot_3","party_slot_4","party_slot_5","party_slot_6"];
  const partySlotOwned = PARTY_SLOT_KEYS.filter(k => (ups[k] ?? 0) > 0).length;
  const nextSlotKey = PARTY_SLOT_KEYS[partySlotOwned] as string | undefined;
  const nextSlotCost = nextSlotKey ? prestigeUpgradeCost(nextSlotKey, 0) : Infinity;
  const partySlotAtMax = partySlotOwned >= PARTY_SLOT_KEYS.length;
  const partySlotPrereqMissing = !partySlotAtMax && (
    (partySlotOwned >= 2 && companionHall < 1) ||
    (partySlotOwned >= 3 && companionHall < 2) ||
    (partySlotOwned >= 4 && companionHall < 3)
  );
  const partySlotCanAfford = pts >= nextSlotCost;
  const partySlotDisabled = partySlotAtMax || partySlotPrereqMissing || !partySlotCanAfford;
  const partySlotLabel = partySlotAtMax
    ? "Full (6/6)"
    : partySlotPrereqMissing
      ? `Locked (need Hall ${partySlotOwned >= 4 ? "III" : partySlotOwned >= 3 ? "II" : "I"})`
      : `${formatNumber(nextSlotCost)}pt`;
  const partyMembersCard = `<div class="prestige-item">
    <div class="prestige-item-meta">
      <div class="prestige-item-name">👥 Party Members${partySlotOwned > 0 ? ` (${partySlotOwned + 1}/6)` : ""}</div>
      <div class="prestige-item-desc">Recruit a new companion (you choose their class). Slots 4+ require Companion Hall upgrades.</div>
    </div>
    <button class="prestige-buy-btn" data-action="buy-prestige" data-type="${nextSlotKey ?? ""}" ${partySlotDisabled ? "disabled" : ""}>${partySlotLabel}</button>
  </div>`;

  // --- Normal items (excluding party_slot_*) ---
  const partySlotSet = new Set(PARTY_SLOT_KEYS);
  type SortableItem = { atMax: boolean; cost: number; html: string };
  const allItems: SortableItem[] = [];

  // Party Members card enters the sort pool; locked (prereq missing) sorts just above owned items
  allItems.push({
    atMax: partySlotAtMax,
    cost: partySlotAtMax || partySlotPrereqMissing ? Infinity : nextSlotCost,
    html: partyMembersCard,
  });

  Object.entries(PRESTIGE_SHOP_META)
    .filter(([type, meta]) => {
      if (partySlotSet.has(type)) return false;
      const guildReq = meta.guildReq ?? 0;
      if (guildReq > 0 && companionHall < guildReq) return false;
      const dungeonReq = meta.dungeonReq ?? 0;
      return state.dungeon_index >= dungeonReq;
    })
    .forEach(([type, meta]) => {
      const owned = ups[type] ?? 0;
      const cost = prestigeUpgradeCost(type, owned);
      const atMax = owned >= meta.max;
      const prereqMissing = (type === "smart_seller" && !(ups["auto_seller"] > 0));
      const canAfford = pts >= cost;
      const disabled = atMax || prereqMissing || !canAfford;
      const ownedLabel = atMax ? " ✓" : owned > 0 ? ` (${owned})` : "";
      const currentStat = prestigeCurrentStat(type, owned);
      allItems.push({
        atMax,
        cost: atMax ? Infinity : cost,
        html: `<div class="prestige-item">
      <div class="prestige-item-meta">
        <div class="prestige-item-name">${spr(meta.icon)} ${meta.name}${ownedLabel}</div>
        <div class="prestige-item-desc">${meta.desc}</div>
        ${currentStat ? `<div class="shop-current-stat">${currentStat}</div>` : ""}
      </div>
      <button class="prestige-buy-btn" data-action="buy-prestige" data-type="${type}" ${disabled ? "disabled" : ""}>${atMax ? "Owned" : formatNumber(cost) + " rn"}</button>
    </div>`,
      });
    });

  allItems.sort((a, b) => {
    if (a.atMax !== b.atMax) return a.atMax ? 1 : -1;
    return a.cost - b.cost;
  });

  const guildUps = state.guild_upgrades;
  const eternalUnlocked = (guildUps["eternal_cycle"] ?? 0) >= 1;
  const autoEnabled = state.auto_prestige_enabled ?? false;
  const autoThreshold = state.auto_prestige_threshold ?? 5;
  const eternalRow = eternalUnlocked ? `<div class="prestige-setting-row">
    <div class="prestige-setting-label">⟳ Eternal Cycle</div>
    <div class="prestige-setting-desc">Auto-prestige when a run would yield at least <strong>${autoThreshold}</strong> pt${autoThreshold !== 1 ? "s" : ""}.</div>
    <div class="prestige-auto-controls">
      <input type="number" class="prestige-auto-threshold" data-action="set-auto-prestige-threshold" value="${autoThreshold}" min="1" max="99" style="width:48px;text-align:center" />
      <button class="prestige-buy-btn ${autoEnabled ? "auto-prestige-active" : ""}" data-action="toggle-auto-prestige">${autoEnabled ? "ON" : "OFF"}</button>
    </div>
  </div>` : "";

  $("prestige-shop-items").innerHTML = eternalRow + allItems.map(i => i.html).join("");
}

/** Enables/disables the Venture button based on whether the player has reached floor 40. */
function updateVentureButton(state: GameStateDict): void {
  const newKey = String(state.venture_available) + "|" + state.dungeon_index;
  if (newKey === ventureKey) return;
  ventureKey = newKey;
  const btn = $("venture-btn") as HTMLButtonElement;
  btn.hidden = false;
  if (state.venture_available) {
    btn.disabled = false;
    btn.innerHTML = `${spr("⚔")} Venture Forth`;
  } else {
    btn.disabled = true;
    btn.innerHTML = `${spr("⚔")} Venture (need lv${ventureUnlockLevel(state.dungeon_index)})`;
  }
}

/** Returns a short "Current: …" label for a stackable prestige upgrade, or "" if not applicable. */
function prestigeCurrentStat(type: string, owned: number): string {
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
function guildCurrentStat(type: string, stacks: number, lootMax: number): string {
  if (stacks <= 0) return "";
  switch (type) {
    case "expanded_armory": return `Current: ${lootMax} loot slots`;
    case "companion_hall":  return stacks >= 3 ? "Current: Party Slots IV + V + VI unlocked" : stacks >= 2 ? "Current: Party Slots IV + V unlocked" : "Current: Party Slot IV unlocked";
    case "rune_forge":      return `Current: Forge Tier ${stacks}`;
    default: return "";
  }
}

/** Renders Guild Hall upgrade cards with current stack count, gold cost, and description. */
function guildUpgradePreview(type: string, stacks: number, lootMax: number): string {
  if (type === "expanded_armory") {
    const cur = lootMax;
    return `Loot chest: ${cur} → ${cur + 2} slots`;
  }
  if (type === "companion_hall") {
    return stacks === 0 ? "Unlocks: Party Slot IV" : stacks === 1 ? "Unlocks: Party Slot V" : "Unlocks: Party Slot VI";
  }
  return "";
}

function renderGuildHall(state: GameStateDict): void {
  const owned = state.guild_upgrades;
  const affordKey = Object.keys(GUILD_HALL_META).map(type => {
    const stacks = owned[type] ?? 0;
    const costs = GUILD_HALL_COSTS[type];
    if (stacks >= costs.length) return "max";
    return state.gold >= costs[stacks] ? "yes" : "no";
  }).join(",");
  const inv = state.rune_inventory ?? [];
  const runeInvKey = inv.length > 0 ? `${inv.length}:${inv[0].id}:${inv[inv.length - 1].id}` : "0";
  const socketKey = state.party.map(c =>
    Object.values(c.runes ?? {}).filter(Boolean).map((r: any) => r.id).join(",")
  ).join("|");
  const newKey = JSON.stringify(state.guild_upgrades) + "|" + affordKey + "|" + state.dungeon_index + "|" + runeInvKey + "|" + socketKey;
  if (newKey === guildKey) return;
  guildKey = newKey;

  const upgradesHtml = Object.entries(GUILD_HALL_META).filter(([, meta]) => {
    return state.dungeon_index >= (meta.dungeonReq ?? 0);
  }).map(([type, meta]) => {
    const stacks = owned[type] ?? 0;
    const costs = GUILD_HALL_COSTS[type];
    const atMax = stacks >= costs.length;
    const nextCost = atMax ? 0 : costs[stacks];
    return { type, meta, stacks, costs, atMax, nextCost };
  }).sort((a, b) => {
    if (a.atMax !== b.atMax) return a.atMax ? 1 : -1;
    return a.nextCost - b.nextCost;
  }).map(({ type, meta, stacks, costs, atMax, nextCost }) => {
    const prereqKey = GUILD_HALL_PREREQS[type];
    const prereqMet = !prereqKey || (owned[prereqKey] ?? 0) > 0;
    const prereqName = prereqKey ? (GUILD_HALL_META[prereqKey]?.name ?? prereqKey) : "";
    const canAfford = !atMax && prereqMet && state.gold >= nextCost;
    const disabled = atMax || !canAfford || !prereqMet;
    const stackLabel = costs.length > 1 ? (atMax ? ` (${stacks}/${costs.length})` : stacks > 0 ? ` (${stacks}/${costs.length})` : "") : atMax ? " ✓" : "";
    const preview = atMax ? "" : guildUpgradePreview(type, stacks, state.loot_max);
    const currentStat = guildCurrentStat(type, stacks, state.loot_max);

    return `<div class="prestige-item${!prereqMet ? " guild-prereq-locked" : ""}">
      <div class="prestige-item-meta">
        <div class="prestige-item-name">${spr(meta.icon)} ${meta.name}${stackLabel}</div>
        <div class="prestige-item-desc">${meta.desc}</div>
        ${!prereqMet ? `<div class="guild-prereq-notice">Requires: ${prereqName}</div>` : ""}
        ${prereqMet && currentStat ? `<div class="shop-current-stat">${currentStat}</div>` : ""}
        ${prereqMet && preview ? `<div class="guild-preview">→ ${preview}</div>` : ""}
      </div>
      <button class="guild-buy-btn" data-action="buy-guild" data-type="${type}" ${disabled ? "disabled" : ""}>${atMax ? "Owned" : formatNumber(nextCost) + "g"}</button>
    </div>`;
  }).join("");

  const runeForge = owned["rune_forge"] ?? 0;
  const runeInv: Rune[] = state.rune_inventory ?? [];
  const hasCombineAll = (state.prestige_upgrades["combine_all_runes"] ?? 0) >= 1;

  $("guild-hall-items").innerHTML = upgradesHtml;
  renderPartyRunePanel(runeInv, state.party, runeForge);
  renderLootRuneInventory(runeInv, state.party, runeForge, hasCombineAll);
}

// ── Constellation Panel ─────────────────────────────────────────────────────

const CONSTELLATION_NAMES: Record<number, string> = {
  1: "The Warrior", 2: "The Guardian", 3: "Fortune's Eye",
  4: "Sage's Light", 5: "The Hunter", 6: "The Wanderer", 7: "Runesmith's Lore",
};

let constellationKey = "";
let cdollModalNodeId: string | null = null;

function renderConstellationPanel(state: GameStateDict): void {
  const unlocked = (state.guild_upgrades["constellation_access"] ?? 0) > 0;
  const nodes: string[] = state.constellation_nodes ?? [];
  const shards = state.constellation_shards ?? 0;
  const newKey = `${unlocked}|${shards}|${nodes.join(",")}`;
  if (newKey === constellationKey) return;
  constellationKey = newKey;

  const el = document.getElementById("constellation-content");
  if (!el) return;

  if (!unlocked) {
    el.innerHTML = `<div class="prune-empty">Purchase the Constellation Chart in the Guild Hall to unlock the passive tree.</div>`;
    return;
  }

  const nodeSet = new Set(nodes);
  const defs = CONSTELLATION_NODE_DEFS;

  // Build deduplicated edge list
  const edgeSet = new Set<string>();
  const edges: Array<{ a: string; b: string }> = [];
  for (const def of Object.values(defs)) {
    for (const conn of def.connections) {
      const key = [def.id, conn].sort().join("|");
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ a: def.id, b: conn });
      }
    }
  }

  const svgLines = edges.map(({ a, b }) => {
    const da = defs[a], db = defs[b];
    if (!da || !db) return "";
    const bothOn = nodeSet.has(a) && nodeSet.has(b);
    const oneOn  = nodeSet.has(a) || nodeSet.has(b);
    const cls = bothOn ? "cdoll-edge both-unlocked" : oneOn ? "cdoll-edge one-unlocked" : "cdoll-edge locked";
    return `<line class="${cls}" x1="${da.x}" y1="${da.y}" x2="${db.x}" y2="${db.y}" />`;
  }).join("");

  const svgNodes = Object.values(defs).map(def => {
    const on = nodeSet.has(def.id);
    const r = def.type === "center" ? 16 : def.type === "keystone" ? 14 : def.type === "notable" ? 10 : 8;
    const cls = [
      "cdoll-node",
      def.type,
      on ? "unlocked" : "locked",
      def.isStart ? "start" : "",
    ].filter(Boolean).join(" ");
    const label = def.label.length > 10 ? def.label.substring(0, 9) + "…" : def.label;
    return `<g class="cdoll-node-group" data-node-id="${def.id}">
      <circle class="${cls}" cx="${def.x}" cy="${def.y}" r="${r}" />
      <text x="${def.x}" y="${def.y + r + 9}" text-anchor="middle" class="cdoll-node-text">${label}</text>
    </g>`;
  }).join("");

  const respecBtn = nodes.length > 0
    ? `<button class="cdoll-respec-btn" data-action="respec-constellation">Respec (costs 10 ✦ shards, refunds the rest)</button>`
    : "";

  el.dataset.nodes = JSON.stringify(nodes);
  el.dataset.shards = String(shards);
  el.innerHTML = `
    <div class="cdoll-shard-header">✦ ${shards} Soul Shard${shards !== 1 ? "s" : ""}</div>
    <div class="cdoll-svg-wrap">
      <svg viewBox="0 0 600 560" xmlns="http://www.w3.org/2000/svg" style="width:100%">
        <g class="cdoll-edges">${svgLines}</g>
        <g class="cdoll-nodes">${svgNodes}</g>
      </svg>
    </div>
    ${respecBtn}
  `;
}

function openConstellationNodeModal(nodeId: string): void {
  cdollModalNodeId = nodeId;
  const def = CONSTELLATION_NODE_DEFS[nodeId];
  if (!def) return;
  const el = document.getElementById("constellation-content");
  const nodeSet = new Set(JSON.parse(el?.dataset.nodes ?? "[]") as string[]);
  const shards = parseInt(el?.dataset.shards ?? "0");
  const on = nodeSet.has(nodeId);
  const isAdjacentUnlocked = def.isStart || def.connections.some(c => nodeSet.has(c));
  const canAfford = shards >= def.cost;

  document.getElementById("cdoll-modal-title")!.textContent = def.label;
  document.getElementById("cdoll-modal-subtitle")!.textContent =
    `${CONSTELLATION_NAMES[def.constellation]} · ${def.type}`;

  const btnLabel = on ? "Unlocked ✓"
    : !isAdjacentUnlocked ? "Unlock adjacent node first"
    : !canAfford ? `Need ${def.cost} ✦ shards`
    : `Unlock (${def.cost} ✦ shard${def.cost !== 1 ? "s" : ""})`;
  const disabled = on || !isAdjacentUnlocked || !canAfford ? "disabled" : "";

  document.getElementById("cdoll-modal-body")!.innerHTML = `
    <div class="cdoll-modal-desc">${def.description}</div>
    <button class="cdoll-unlock-btn" data-action="unlock-node" data-node-id="${nodeId}" ${disabled}>${btnLabel}</button>
  `;
  document.getElementById("cdoll-node-modal")!.classList.add("open");
}

function closeConstellationNodeModal(): void {
  cdollModalNodeId = null;
  document.getElementById("cdoll-node-modal")!.classList.remove("open");
}

function initConstellationPanel(): void {
  const panel = document.getElementById("constellation-panel");
  if (!panel) return;
  const tooltip = document.getElementById("cdoll-tooltip")!;

  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const nodeGroup = target.closest<HTMLElement>(".cdoll-node-group");
    if (nodeGroup?.dataset.nodeId) {
      openConstellationNodeModal(nodeGroup.dataset.nodeId);
      return;
    }
    const action = (target.closest("[data-action]") as HTMLElement)?.dataset.action;
    if (action === "respec-constellation") {
      call("respecConstellation");
    }
  });

  panel.addEventListener("mousemove", (e) => {
    const nodeGroup = (e.target as HTMLElement).closest<HTMLElement>(".cdoll-node-group");
    if (!nodeGroup?.dataset.nodeId) { tooltip.hidden = true; return; }
    const def = CONSTELLATION_NODE_DEFS[nodeGroup.dataset.nodeId];
    if (!def) { tooltip.hidden = true; return; }
    const nodeSet = new Set(JSON.parse(document.getElementById("constellation-content")?.dataset.nodes ?? "[]") as string[]);
    const on = nodeSet.has(def.id);
    const statusBadge = on ? `<span class="cdoll-tt-badge unlocked">Unlocked</span>` : `<span class="cdoll-tt-badge locked">${def.cost} ✦</span>`;
    tooltip.innerHTML = `
      <div class="cdoll-tt-name">${def.label} ${statusBadge}</div>
      <div class="cdoll-tt-sub">${CONSTELLATION_NAMES[def.constellation]} · ${def.type}</div>
      <div class="cdoll-tt-desc">${def.description}</div>
    `;
    tooltip.hidden = false;
    tooltip.style.left = `${e.clientX + 14}px`;
    tooltip.style.top = `${e.clientY + 14}px`;
  });

  panel.addEventListener("mouseleave", () => { tooltip.hidden = true; });

  document.getElementById("cdoll-modal-close")?.addEventListener("click", closeConstellationNodeModal);
  document.getElementById("cdoll-node-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("cdoll-node-modal")) closeConstellationNodeModal();
  });
}

const RUNE_STAT_LABELS: Record<string, string> = {
  dps: "DPS", maxHp: "Max HP", haste: "Haste", goldBonus: "Gold Bonus", xpMultiplier: "XP Mult", critChance: "Crit Chance",
};
const RUNE_ICONS: Record<string, string> = {
  striking: "⚔️", warding: "🛡", swiftness: "💨", greed: "💰", fortune: "🍀", wrath: "💢",
};
const ALL_SLOTS = ["main_hand","off_hand","helmet","chest","gloves","legs","shoes","ring1","ring2"] as const;
const SLOT_LABELS: Record<string, string> = {
  main_hand: "Main Hand", off_hand: "Off Hand", helmet: "Helmet", chest: "Chest",
  gloves: "Gloves", legs: "Legs", shoes: "Shoes", ring1: "Ring 1", ring2: "Ring 2",
};
const GEAR_SLOT_SHORT: Record<string, string> = {
  main_hand: "Main", off_hand: "Off", helmet: "Helm", chest: "Chest",
  gloves: "Gloves", legs: "Legs", shoes: "Shoes", ring1: "Ring", ring2: "Ring 2",
};
const PDOLL_TIER_ICONS: Record<string, string> = { lesser: "◆", greater: "★", flawless: "✦", ancient: "✸" };
const PDOLL_TIER_ORDER = ["lesser", "greater", "flawless", "ancient"];

let lastRuneInv: Rune[] = [];
let rrCharIdx = -1;
let rrSlot = "";
let rrSelectedId = "";

function runeStatSummary(c: CharDict): string {
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

function charMiniHeader(c: CharDict): string {
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

function renderPartyRunePanel(runeInv: Rune[], party: CharDict[], runeForge: number): void {
  lastRuneInv = runeInv;
  const el = $("party-rune-panel");
  const ptabRunesBtn = document.querySelector<HTMLButtonElement>('.ptab-btn[data-ptab="runes"]');
  if (ptabRunesBtn) ptabRunesBtn.hidden = runeForge < 1;
  if (runeForge < 1) {
    el.innerHTML = `<div class="prune-empty">Unlock the Rune Forge in the Guild Hall to start socketing runes.</div>`;
    return;
  }

  const SLOT_SHORT: Record<string, string> = {
    main_hand: "Main", off_hand: "Off", helmet: "Helm", chest: "Chest",
    gloves: "Gloves", legs: "Legs", shoes: "Shoes", ring1: "Ring 1", ring2: "Ring 2",
  };

  const charBlocks = party.map((c, charIdx) => {
    const slots = ALL_SLOTS.map(slot => {
      const rune = c.runes?.[slot];
      const slotIcon = SLOT_ICONS[slot] ?? "◻";
      const label = SLOT_LABELS[slot] ?? slot;
      const shortLabel = SLOT_SHORT[slot] ?? label;
      if (rune) {
        const runeIcon = RUNE_ICONS[rune.type] ?? "🔮";
        const statLabel = RUNE_STAT_LABELS[rune.statKey] ?? rune.statKey;
        const runeData = encodeURIComponent(JSON.stringify({ ...rune, slotLabel: label }));
        return `<div class="pdoll-slot-cell" data-slot="${slot}">
          <button class="pdoll-slot equipped ${rune.tier}"
            data-slot="${slot}" data-char-idx="${charIdx}"
            data-rune-name="${PDOLL_TIER_ICONS[rune.tier] ?? "◆"} ${runeIcon} ${rune.name}"
            data-rune-stat="+${rune.value} ${statLabel}"
            data-rune="${runeData}"
            aria-expanded="false">${spr(runeIcon)}</button>
          <span class="pdoll-slot-label">${shortLabel}</span>
        </div>`;
      }
      return `<div class="pdoll-slot-cell" data-slot="${slot}">
        <button class="pdoll-slot empty"
          data-slot="${slot}" data-char-idx="${charIdx}"
          aria-expanded="false">${spr(slotIcon)}</button>
        <span class="pdoll-slot-label">${shortLabel}</span>
      </div>`;
    }).join("");

    return `<div class="prune-char-block">
      ${charMiniHeader(c)}
      <div class="pdoll-grid">${slots}</div>
      <div class="pdoll-stats-bar">${runeStatSummary(c)}</div>
    </div>`;
  }).join("");

  el.innerHTML = charBlocks;
}

function openRuneReplaceModal(charIdx: number, slot: string): void {
  rrCharIdx = charIdx;
  rrSlot = slot;
  rrSelectedId = "";
  const modal = document.getElementById("rune-replace-modal")!;
  const title = document.getElementById("rune-replace-title")!;
  const body = document.getElementById("rune-replace-body")!;
  title.textContent = `Socket Rune — ${SLOT_LABELS[slot] ?? slot}`;
  if (lastRuneInv.length === 0) {
    body.innerHTML = `<div class="prune-empty">No runes in inventory.</div>`;
  } else {
    body.innerHTML = [...lastRuneInv]
      .sort((a, b) => {
        const td = PDOLL_TIER_ORDER.indexOf(b.tier) - PDOLL_TIER_ORDER.indexOf(a.tier);
        return td !== 0 ? td : a.name.localeCompare(b.name);
      })
      .map(r => {
        const icon = RUNE_ICONS[r.type] ?? "🔮";
        const statLabel = RUNE_STAT_LABELS[r.statKey] ?? r.statKey;
        return `<button class="rr-rune-item" data-rune-id="${r.id}">
          <span class="rr-tier-badge rune-tier-badge ${r.tier}">${PDOLL_TIER_ICONS[r.tier] ?? "◆"}</span>
          <span>${spr(icon)} ${r.name}</span>
          <span class="rr-rune-stat">+${r.value} ${statLabel}</span>
        </button>`;
      }).join("");
  }
  modal.classList.add("open");
}

function closeRuneReplaceModal(): void {
  rrCharIdx = -1;
  rrSlot = "";
  rrSelectedId = "";
  document.getElementById("rune-replace-modal")!.classList.remove("open");
}

function openRuneSlotDetailModal(slotBtn: HTMLElement): void {
  const slot = slotBtn.dataset.slot!;
  const charIdx = slotBtn.dataset.charIdx!;
  const isEquipped = slotBtn.classList.contains("equipped");
  const modal = document.getElementById("rune-slot-detail-modal")!;
  document.getElementById("rsd-title")!.textContent = SLOT_LABELS[slot] ?? slot;
  const body = document.getElementById("rsd-body")!;
  if (isEquipped) {
    body.innerHTML = `
      <div class="pdoll-detail-rune">${slotBtn.dataset.runeName ?? ""}</div>
      <div class="pdoll-detail-stat">${slotBtn.dataset.runeStat ?? ""}</div>
      <div class="pdoll-detail-actions">
        <button class="pdoll-remove-btn" data-action="pdoll-remove" data-char-idx="${charIdx}" data-slot="${slot}">Remove</button>
        <button class="pdoll-replace-btn" data-action="pdoll-open-replace" data-char-idx="${charIdx}" data-slot="${slot}">Replace</button>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="pdoll-detail-empty">No rune socketed</div>
      <div class="pdoll-detail-actions">
        <button class="pdoll-replace-btn" data-action="pdoll-open-replace" data-char-idx="${charIdx}" data-slot="${slot}">Socket Rune</button>
      </div>`;
  }
  modal.classList.add("open");
  slotBtn.setAttribute("aria-expanded", "true");
}

function closeRuneSlotDetailModal(): void {
  document.getElementById("rune-slot-detail-modal")!.classList.remove("open");
  document.querySelectorAll<HTMLElement>(".pdoll-slot[aria-expanded='true']")
    .forEach(b => b.setAttribute("aria-expanded", "false"));
}

function initRuneSlotPanel(): void {
  const panel = document.getElementById("party-rune-panel")!;

  panel.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const slotBtn = target.closest<HTMLElement>(".pdoll-slot");
    if (!slotBtn) return;
    if (slotBtn.classList.contains("empty")) {
      openRuneReplaceModal(parseInt(slotBtn.dataset.charIdx!, 10), slotBtn.dataset.slot!);
    } else {
      openRuneSlotDetailModal(slotBtn);
    }
  });

  const detailModal = document.getElementById("rune-slot-detail-modal")!;
  document.getElementById("rsd-close")!.addEventListener("click", closeRuneSlotDetailModal);
  detailModal.addEventListener("click", (e) => { if (e.target === detailModal) closeRuneSlotDetailModal(); });

  detailModal.addEventListener("click", (e) => {
    const actionBtn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!actionBtn) return;
    const action = actionBtn.dataset.action;
    const charIdx = parseInt(actionBtn.dataset.charIdx!, 10);
    const slot = actionBtn.dataset.slot!;
    if (action === "pdoll-remove") {
      call("unbrandRune", charIdx, slot);
      closeRuneSlotDetailModal();
    } else if (action === "pdoll-open-replace") {
      closeRuneSlotDetailModal();
      openRuneReplaceModal(charIdx, slot);
    }
  });

  const replaceModal = document.getElementById("rune-replace-modal")!;
  const replaceBody = document.getElementById("rune-replace-body")!;

  document.getElementById("rune-replace-close")!.addEventListener("click", closeRuneReplaceModal);
  replaceModal.addEventListener("click", (e) => { if (e.target === replaceModal) closeRuneReplaceModal(); });

  replaceBody.addEventListener("click", (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(".rr-rune-item");
    if (!item) return;
    const runeId = item.dataset.runeId!;
    if (runeId && rrCharIdx >= 0) {
      call("brandRune", rrCharIdx, rrSlot, runeId);
      closeRuneReplaceModal();
    }
  });
}

function buildSlotOptions(char: CharDict): string {
  return ALL_SLOTS.map(s => {
    const existing = char.runes?.[s];
    const label = SLOT_LABELS[s] + (existing ? ` (${existing.tier})` : "");
    return `<option value="${s}">${label}</option>`;
  }).join("");
}

function renderLootRuneInventory(runeInv: Rune[], party: CharDict[], runeForge: number, hasCombineAll = false): void {
  const runesTabBtn = document.getElementById("loot-stab-runes");
  if (runesTabBtn) runesTabBtn.hidden = runeForge < 1;
  const runeCountEl = document.getElementById("loot-rune-count");
  if (runeCountEl) runeCountEl.textContent = runeInv.length > 0 ? `(${runeInv.length})` : "";
  const el = $("loot-rune-inventory");
  // Dot is set after combinePairs + ancientCount are computed — see below
  if (runeForge < 1) { el.innerHTML = ""; return; }

  const charOptions = party.map((c, i) =>
    `<option value="${i}">${c.name}</option>`
  ).join("");

  const TIER_ICONS: Record<string, string> = { lesser: "◆", greater: "★", flawless: "✦", ancient: "✸" };
  const SELL_VALUES: Record<string, number> = { lesser: 10, greater: 30, flawless: 90, ancient: 250 };
  const TIER_ORDER = ["lesser", "greater", "flawless", "ancient"];

  const sortedRuneInv = [...runeInv].sort((a, b) => {
    const tierDiff = TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier);
    if (tierDiff !== 0) return tierDiff;
    return a.type.localeCompare(b.type);
  });

  const items = sortedRuneInv.length === 0
    ? `<div class="prune-empty">No runes — bosses have a 20% chance to drop one, elites have a 10% chance.</div>`
    : sortedRuneInv.map(rune => {
        const i = runeInv.indexOf(rune);
        const runeIcon = RUNE_ICONS[rune.type] ?? "🔮";
        const statLabel = RUNE_STAT_LABELS[rune.statKey] ?? rune.statKey;
        const slotOpts = buildSlotOptions(party[0]);
        const sellVal = SELL_VALUES[rune.tier] ?? 10;
        return `<div class="rune-item ${rune.tier}" data-rune-idx="${i}">
          <div class="rune-item-top">
            <span class="rune-tier-badge ${rune.tier}">${TIER_ICONS[rune.tier] ?? "◆"}</span>
            <span class="rune-icon">${spr(runeIcon)}</span>
            <span class="rune-name">${rune.name}</span>
          </div>
          <div class="rune-item-selects">
            <select class="rune-char-select">${charOptions}</select>
            <select class="rune-slot-select">${slotOpts}</select>
          </div>
          <div class="rune-item-bottom">
            <span class="rune-stat">+${rune.value} ${statLabel}</span>
            <div class="rune-item-btns">
              <button class="rune-brand-btn" data-action="brand-rune" data-rune-id="${rune.id}" data-rune-idx="${i}">Brand</button>
              <button class="rune-sell-btn" data-action="sell-rune" data-rune-idx="${i}">${formatNumber(sellVal)}g</button>
            </div>
          </div>
        </div>`;
      }).join("");

  const sellAllVal = runeInv.reduce((s, r) => s + (SELL_VALUES[r.tier] ?? 10), 0);

  const maxCombineTier: Rune["tier"] = runeForge >= 4 ? "flawless" : runeForge >= 3 ? "greater" : "lesser";
  const combinePairs = runeForge >= 2 ? findCombinePairs(runeInv, maxCombineTier) : [];
  const combineAllBtn = hasCombineAll && runeForge >= 2 && combinePairs.length > 0
    ? `<button class="rune-combine-all-btn" data-action="combine-all-runes">Combine All</button>`
    : "";
  const combineHtml = runeForge >= 2 && combinePairs.length > 0
    ? `<div class="rune-combine-section">
        <span class="rune-combine-label">Combine:</span>
        <select class="rune-combine-select">${combinePairs.map(p =>
          `<option value="${p.id1}|${p.id2}">${RUNE_ICONS[p.type] ?? "🔮"} 2× ${p.name} → ${p.result}</option>`
        ).join("")}</select>
        <button class="rune-combine-btn" data-action="combine-runes">Combine</button>
        ${combineAllBtn}
      </div>`
    : runeForge < 2
      ? `<div class="rune-combine-hint">Rune Forge Tier 2 unlocks combining two matching lesser runes into a greater.</div>`
      : runeForge < 3
        ? `<div class="rune-combine-hint">Rune Forge Tier 3 unlocks combining greater runes into flawless.</div>`
        : runeForge < 4
          ? `<div class="rune-combine-hint">Rune Forge Tier 4 unlocks combining flawless runes into ancient.</div>`
          : "";

  const ancientCount = runeInv.filter(r => r.tier === "ancient").length;
  const canForge = ancientCount >= 10;
  const runeHasAction = canForge || combinePairs.length > 0;
  const runeDotEl = document.getElementById("loot-rune-dot");
  if (runeDotEl) runeDotEl.hidden = !runeHasAction;

  const forgeArtifactHtml = ancientCount > 0
    ? `<div class="rune-forge-artifact-row">
         <span class="rune-forge-artifact-label">${spr("✨")} Forge Artifact</span>
         <span class="rune-forge-artifact-cost">${ancientCount} / 10 Ancient runes</span>
         <button class="rune-forge-artifact-btn" data-action="forge-artifact-from-runes"${canForge ? "" : " disabled"}>Forge</button>
       </div>`
    : "";

  el.innerHTML = `<div class="rune-inv-section">
    <div class="rune-inv-title">
      <span>${spr("🔮")} Runes (${runeInv.length})</span>
      ${runeInv.length > 0 ? `<button class="rune-sell-all-btn" data-action="sell-all-runes">Sell All (${formatNumber(sellAllVal)}g)</button>` : ""}
    </div>
    ${forgeArtifactHtml}
    ${combineHtml}
    <div class="rune-inv-items">${items}</div>
  </div>`;

  // Update slot options when character selection changes
  el.querySelectorAll<HTMLSelectElement>(".rune-char-select").forEach(charSel => {
    charSel.addEventListener("change", () => {
      const charIdx = parseInt(charSel.value, 10);
      const slotSel = charSel.closest(".rune-item")!.querySelector<HTMLSelectElement>(".rune-slot-select")!;
      const prev = slotSel.value;
      slotSel.innerHTML = buildSlotOptions(party[charIdx]);
      // restore previous selection if still valid
      if ([...slotSel.options].some(o => o.value === prev)) slotSel.value = prev;
    });
  });
}

function renderArtifactPanel(state: GameStateDict): void {
  const artifactInv: ArtifactInstance[] = state.artifact_inventory ?? [];
  const party = state.party;

  const newArtKey = artifactInv.map(a => `${a.id}:${a.level}`).join(",") + "|" + party.map(c => (c.artifact_slots ?? []).map(s => s ? `${s.id}:${s.level}` : "null").join(",")).join("|");
  if (newArtKey === artifactKey) return;
  artifactKey = newArtKey;

  const hasAnyArtifact = artifactInv.length > 0 || party.some(c => c.artifact_slots?.some(s => s !== null));

  const lootArtBtn = document.getElementById("loot-stab-artifacts");
  const ptabBtn = document.getElementById("ptab-artifacts-btn");
  if (lootArtBtn) lootArtBtn.hidden = !hasAnyArtifact;
  if (ptabBtn) ptabBtn.hidden = !hasAnyArtifact;

  const countEl = document.getElementById("artifact-count");
  if (countEl) countEl.textContent = artifactInv.length > 0 ? `(${artifactInv.length})` : "";

  // Notification dot: show when any artifact can be leveled up
  const levelUpPossible = artifactInv.some((inst, i) => {
    const cost = inst.level + 1;
    const fuel = artifactInv.filter((o, j) => j !== i && o.id === inst.id).length;
    return fuel >= cost;
  });
  const artifactDotEl = document.getElementById("loot-artifact-dot");
  if (artifactDotEl) artifactDotEl.hidden = !levelUpPossible;

  // Build character + slot options for equip dropdowns
  const charSlotOptions = party.map((c, ci) => {
    const slots: (ArtifactInstance | null)[] = c.artifact_slots ?? [null, null, null];
    return slots.map((s, si) =>
      s ? "" : `<option value="${ci}:${si}">${c.name} — slot ${si + 1}</option>`
    ).join("");
  }).join("");
  const hasOpenSlot = charSlotOptions.includes("<option");

  const invEl = document.getElementById("artifact-inventory");
  if (!invEl) return;

  function instLabel(inst: ArtifactInstance): string {
    const def = ARTIFACT_DEFS[inst.id];
    return `${spr(def?.icon ?? "✨")} ${def?.name ?? inst.id}${inst.level > 0 ? ` <span class="artifact-level-badge">+${inst.level}</span>` : ""}`;
  }

  const sortedArtifactIndices = artifactInv.map((_, i) => i).sort((a, b) => {
    const defA = ARTIFACT_DEFS[artifactInv[a].id];
    const defB = ARTIFACT_DEFS[artifactInv[b].id];
    const nameCmp = (defA?.name ?? artifactInv[a].id).localeCompare(defB?.name ?? artifactInv[b].id);
    if (nameCmp !== 0) return nameCmp;
    return artifactInv[b].level - artifactInv[a].level; // higher level first within same name
  });

  const itemsHtml = artifactInv.length === 0
    ? `<div class="artifact-empty">No artifacts in inventory.</div>`
    : sortedArtifactIndices.map(i => {
        const inst = artifactInv[i];
        const def = ARTIFACT_DEFS[inst.id];
        if (!def) return "";
        const sellVal = def.sellValue * (inst.level + 1);
        const fuelCount = artifactInv.filter((o, j) => j !== i && o.id === inst.id).length;
        const canLevel = fuelCount >= inst.level + 1;
        return `<div class="artifact-inv-row${canLevel ? " artifact-inv-row--levelup" : ""}" data-action="open-artifact-modal" data-inv-idx="${i}" role="button" tabindex="0">
          <span class="artifact-inv-icon">${spr(def.icon)}</span>
          <div class="artifact-inv-info">
            <div class="artifact-inv-name">${def.name}${inst.level > 0 ? ` <span class="artifact-level-badge">+${inst.level}</span>` : ""}</div>
            <div class="artifact-inv-desc">${def.desc}</div>
          </div>
          <button class="artifact-sell-btn" data-action="sell-artifact" data-inv-idx="${i}" title="Sell for ${formatNumber(sellVal)}g">${formatNumber(sellVal)}g</button>
        </div>`;
      }).join("");

  invEl.innerHTML = itemsHtml;

  // Party panel equipped artifacts — 3 square slot boxes per character
  const partyArtEl = document.getElementById("party-artifact-panel");
  if (partyArtEl) {
    const hasArtifacts = artifactInv.length > 0;
    const charBlocks = party.map((c, charIdx) => {
      const slots: (ArtifactInstance | null)[] = c.artifact_slots ?? [null, null, null];
      const slotBtns = slots.map((inst, slotIdx) => {
        if (inst) {
          const def = ARTIFACT_DEFS[inst.id];
          const lvlBadge = inst.level > 0 ? `<span class="art-slot-level">+${inst.level}</span>` : "";
          return `<div class="art-slot-cell">
            <button class="art-pdoll-slot filled" data-action="open-equipped-artifact-modal"
              data-char-idx="${charIdx}" data-slot-idx="${slotIdx}"
              title="${def?.name ?? inst.id}">
              ${lvlBadge}
              <span class="art-slot-icon">${spr(def?.icon ?? "✨")}</span>
            </button>
          </div>`;
        }
        return `<div class="art-slot-cell">
          <button class="art-pdoll-slot empty" data-action="open-art-slot-picker"
            data-char-idx="${charIdx}" data-slot-idx="${slotIdx}"
            ${!hasArtifacts ? "disabled" : ""}
            title="${hasArtifacts ? "Equip artifact" : "No artifacts in inventory"}">
            <span class="art-slot-icon">✦</span>
          </button>
        </div>`;
      }).join("");
      return `<div class="artifact-char-block">
        ${charMiniHeader(c)}
        <div class="art-pdoll-row">${slotBtns}</div>
      </div>`;
    }).join("");
    partyArtEl.innerHTML = charBlocks;
  }

  if (artifactModalArtId) renderArtifactModalBody(state);
}

function openArtifactModal(invIdx: number, state: GameStateDict): void {
  const inv: ArtifactInstance[] = state.artifact_inventory ?? [];
  const inst = inv[invIdx];
  if (!inst) return;
  artifactModalArtId = inst.id;
  artifactModalTargetIdx = invIdx;
  artifactModalFuelSelected = new Set();
  renderArtifactModalBody(state);
  $("artifact-detail-modal").classList.add("open");
}

function closeArtifactModal(): void {
  artifactModalArtId = null;
  artifactModalTargetIdx = -1;
  artifactModalCharIdx = -1;
  artifactModalSlotIdx = -1;
  artifactModalFuelSelected = new Set();
  $("artifact-detail-modal").classList.remove("open");
}

function openArtifactSlotPicker(charIdx: number, slotIdx: number, state: GameStateDict): void {
  aspCharIdx = charIdx;
  aspSlotIdx = slotIdx;
  const charName = state.party[charIdx]?.name ?? `Hero ${charIdx + 1}`;
  document.getElementById("asp-title")!.textContent = `${charName} — Slot ${slotIdx + 1}`;
  const body = document.getElementById("asp-body")!;
  const inv: ArtifactInstance[] = state.artifact_inventory ?? [];
  if (inv.length === 0) {
    body.innerHTML = `<div class="prune-empty">No artifacts in inventory.</div>`;
  } else {
    body.innerHTML = inv
      .map((inst, i) => ({ ...inst, invIdx: i }))
      .sort((a, b) => {
        const na = ARTIFACT_DEFS[a.id]?.name ?? a.id;
        const nb = ARTIFACT_DEFS[b.id]?.name ?? b.id;
        return na.localeCompare(nb) || b.level - a.level;
      })
      .map(inst => {
        const def = ARTIFACT_DEFS[inst.id];
        const lvlBadge = inst.level > 0 ? ` <span class="artifact-level-badge">+${inst.level}</span>` : "";
        const statLabel = def ? artifactStatLabel(inst.id, inst.level) : "";
        return `<button class="asp-artifact-item" data-action="asp-equip" data-inv-idx="${inst.invIdx}">
          <span class="asp-artifact-icon">${spr(def?.icon ?? "✨")}</span>
          <div class="asp-artifact-info">
            <span class="asp-artifact-name">${def?.name ?? inst.id}${lvlBadge}</span>
            <span class="asp-artifact-stat">${statLabel}</span>
          </div>
        </button>`;
      }).join("");
  }
  document.getElementById("artifact-slot-pick-modal")!.classList.add("open");
}

function closeArtifactSlotPicker(): void {
  aspCharIdx = -1;
  aspSlotIdx = -1;
  document.getElementById("artifact-slot-pick-modal")!.classList.remove("open");
}

function openEquippedArtifactModal(charIdx: number, slotIdx: number, state: GameStateDict): void {
  const inst = state.party[charIdx]?.artifact_slots?.[slotIdx];
  if (!inst) return;
  artifactModalArtId = inst.id;
  artifactModalTargetIdx = -1;
  artifactModalCharIdx = charIdx;
  artifactModalSlotIdx = slotIdx;
  artifactModalFuelSelected = new Set();
  renderArtifactModalBody(state);
  $("artifact-detail-modal").classList.add("open");
}

function renderArtifactModalBody(state: GameStateDict): void {
  if (!artifactModalArtId) return;
  const el = document.getElementById("artifact-detail-body");
  if (!el) return;

  const inv: ArtifactInstance[] = state.artifact_inventory ?? [];
  const party = state.party;

  // Resolve target artifact and context (equipped or inventory)
  const isEquipped = artifactModalTargetIdx === -1 && artifactModalCharIdx >= 0;
  let inst: ArtifactInstance | null = null;
  let charName = "";

  if (isEquipped) {
    const char = party[artifactModalCharIdx];
    const raw = char?.artifact_slots?.[artifactModalSlotIdx];
    if (!raw || raw.id !== artifactModalArtId) { closeArtifactModal(); return; }
    inst = { id: raw.id, level: raw.level ?? 0, fuel: raw.fuel ?? 0 };
    charName = char?.name ?? "";
  } else {
    const raw = inv[artifactModalTargetIdx];
    if (!raw || raw.id !== artifactModalArtId) {
      const anyIdx = inv.findIndex(a => a.id === artifactModalArtId);
      if (anyIdx < 0) { closeArtifactModal(); return; }
      artifactModalTargetIdx = anyIdx;
      artifactModalFuelSelected = new Set();
    }
    inst = inv[artifactModalTargetIdx];
  }
  if (!inst) { closeArtifactModal(); return; }

  const def = ARTIFACT_DEFS[inst.id];
  if (!def) { closeArtifactModal(); return; }

  const titleEl = document.getElementById("artifact-detail-title");
  if (titleEl) titleEl.textContent = def.name;

  const levelBadge = inst.level > 0 ? ` <span class="artifact-level-badge">+${inst.level}</span>` : "";
  const cost = inst.level + 1; // fuel units needed for next level
  const storedFuel = inst.fuel;
  const pct = Math.min(100, Math.round((storedFuel / cost) * 100));

  // Fuel candidates are always inventory copies of the same type (excluding the target if in inventory)
  const fuelCandidates = inv
    .map((a, i) => ({ ...a, invIdx: i }))
    .filter(a => a.id === artifactModalArtId && (isEquipped || a.invIdx !== artifactModalTargetIdx));

  // Clear stale selections
  for (const fi of artifactModalFuelSelected) {
    if (!fuelCandidates.some(c => c.invIdx === fi)) artifactModalFuelSelected.delete(fi);
  }

  const selectedUnits = [...artifactModalFuelSelected].reduce(
    (sum, fi) => sum + artifactFuelValue(inv[fi]?.level ?? 0), 0
  );

  const allSelected = fuelCandidates.length > 0 && fuelCandidates.every(c => artifactModalFuelSelected.has(c.invIdx));
  const anySelected = fuelCandidates.some(c => artifactModalFuelSelected.has(c.invIdx));
  const fuelListHtml = fuelCandidates.length === 0
    ? `<div class="amodal-no-fuel">No other copies in inventory.</div>`
    : `<label class="amodal-fuel-item amodal-fuel-select-all">
        <input type="checkbox" id="amodal-fuel-select-all"${allSelected ? " checked" : ""}>
        <span class="amodal-fuel-label">Select all</span>
        <span class="amodal-fuel-unit">${fuelCandidates.length} artifact${fuelCandidates.length !== 1 ? "s" : ""}</span>
       </label>` +
      fuelCandidates.map(c => {
        const checked = artifactModalFuelSelected.has(c.invIdx) ? " checked" : "";
        const lvlLabel = c.level > 0 ? ` <span class="artifact-level-badge">+${c.level}</span>` : "";
        const units = artifactFuelValue(c.level);
        return `<label class="amodal-fuel-item">
          <input type="checkbox" class="amodal-fuel-check" data-fuel-idx="${c.invIdx}"${checked}>
          <span class="amodal-fuel-label">${spr(def.icon)} ${def.name}${lvlLabel}</span>
          <span class="amodal-fuel-unit">+${units} fuel</span>
        </label>`;
      }).join("");

  const addFuelAction = isEquipped ? "modal-add-fuel-equipped-artifact" : "modal-add-fuel-artifact";
  const addFuelExtra = isEquipped
    ? `data-char-idx="${artifactModalCharIdx}" data-slot-idx="${artifactModalSlotIdx}"`
    : `data-inv-idx="${artifactModalTargetIdx}"`;

  const fuelSection = `
    <div class="amodal-section">
      <div class="amodal-section-title">Level Up to +${inst.level + 1}</div>
      <div class="amodal-fuel-progress-wrap">
        <div class="amodal-fuel-progress-label">
          <span>Stored fuel</span>
          <span id="amodal-fuel-stored">${storedFuel} / ${cost} units</span>
        </div>
        <div class="amodal-fuel-bar-track">
          <div class="amodal-fuel-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
      <div class="amodal-fuel-list">${fuelListHtml}</div>
      <button class="amodal-addfuel-btn" data-action="${addFuelAction}" ${addFuelExtra} id="amodal-addfuel-btn"${selectedUnits > 0 ? "" : " disabled"}>
        ${selectedUnits > 0 ? `Add ${selectedUnits} fuel unit${selectedUnits === 1 ? "" : "s"}` : "Select artifacts below"}
      </button>
    </div>`;

  let actionsHtml = "";
  if (isEquipped) {
    actionsHtml = `
      <div class="amodal-section amodal-equipped-actions">
        <button class="amodal-switch-btn" data-action="modal-switch-artifact" data-char-idx="${artifactModalCharIdx}" data-slot-idx="${artifactModalSlotIdx}">
          ↔ Switch
        </button>
        <button class="amodal-remove-btn" data-action="modal-unequip-artifact" data-char-idx="${artifactModalCharIdx}" data-slot-idx="${artifactModalSlotIdx}" title="Remove — return to inventory">🗑</button>
        <button class="artifact-sell-btn amodal-sell-btn" data-action="modal-sell-equipped-artifact" data-char-idx="${artifactModalCharIdx}" data-slot-idx="${artifactModalSlotIdx}">
          Sell ${formatNumber(def.sellValue * (inst.level + 1))}g
        </button>
      </div>`;
  } else {
    const charSlotOptions = party.map((c, ci) => {
      const slots: (ArtifactInstance | null)[] = c.artifact_slots ?? [null, null, null];
      return slots.map((s, si) =>
        s ? "" : `<option value="${ci}:${si}">${c.name} — slot ${si + 1}</option>`
      ).join("");
    }).join("");
    const hasOpenSlot = charSlotOptions.includes("<option");
    const equipSection = hasOpenSlot ? `
      <div class="amodal-section">
        <div class="amodal-section-title">Equip to Hero</div>
        <div class="amodal-equip-row">
          <select class="artifact-char-slot-select">${charSlotOptions}</select>
          <button class="artifact-equip-btn" data-action="equip-artifact" data-inv-idx="${artifactModalTargetIdx}">Equip</button>
        </div>
      </div>` : "";
    actionsHtml = `
      ${equipSection}
      <div class="amodal-section amodal-sell-section">
        <button class="artifact-sell-btn amodal-sell-btn" data-action="sell-artifact" data-inv-idx="${artifactModalTargetIdx}">
          Sell for ${formatNumber(def.sellValue * (inst.level + 1))}g
        </button>
      </div>`;
  }

  const subTitle = isEquipped
    ? `Equipped on ${charName}, slot ${artifactModalSlotIdx + 1}`
    : `${inv.filter(a => a.id === artifactModalArtId).length} in inventory`;

  el.innerHTML = `
    <div class="amodal-hero-row">
      <span class="amodal-icon">${spr(def.icon)}</span>
      <div>
        <div class="amodal-name">${def.name}${levelBadge}</div>
        <div class="amodal-copies">${subTitle}</div>
      </div>
    </div>
    <div class="amodal-desc">${def.desc}</div>
    ${fuelSection}
    ${actionsHtml}`;

  function syncFuelUI(): void {
    const total = [...artifactModalFuelSelected].reduce(
      (s, idx) => s + artifactFuelValue(inv[idx]?.level ?? 0), 0
    );
    const btn = document.getElementById("amodal-addfuel-btn") as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = total === 0;
      btn.textContent = total > 0 ? `Add ${total} fuel unit${total === 1 ? "" : "s"}` : "Select artifacts below";
    }
    applyFuelBarPreview(inst!.fuel, inst!.level, total);
    const allCb = document.getElementById("amodal-fuel-select-all") as HTMLInputElement | null;
    if (allCb) {
      const all = fuelCandidates.every(c => artifactModalFuelSelected.has(c.invIdx));
      const any = fuelCandidates.some(c => artifactModalFuelSelected.has(c.invIdx));
      allCb.checked = all;
      allCb.indeterminate = !all && any;
    }
  }

  // Wire checkboxes — no cap, any combination allowed
  el.querySelectorAll<HTMLInputElement>(".amodal-fuel-check").forEach(cb => {
    cb.addEventListener("change", () => {
      const fi = parseInt(cb.dataset.fuelIdx!, 10);
      if (cb.checked) artifactModalFuelSelected.add(fi);
      else artifactModalFuelSelected.delete(fi);
      syncFuelUI();
    });
  });

  const selectAllCb = document.getElementById("amodal-fuel-select-all") as HTMLInputElement | null;
  if (selectAllCb) {
    selectAllCb.indeterminate = !allSelected && anySelected;
    selectAllCb.addEventListener("change", () => {
      if (selectAllCb.checked) fuelCandidates.forEach(c => artifactModalFuelSelected.add(c.invIdx));
      else artifactModalFuelSelected.clear();
      el.querySelectorAll<HTMLInputElement>(".amodal-fuel-check").forEach(cb => {
        cb.checked = selectAllCb.checked;
      });
      syncFuelUI();
    });
  }
}

/** Animates the artifact fuel progress bar to preview the effect of adding `totalAdded` fuel units.
 *  Rushes through completed levels quickly, then eases to the final resting position. */
function applyFuelBarPreview(storedFuel: number, instLevel: number, totalAdded: number): void {
  const bar = document.querySelector<HTMLElement>(".amodal-fuel-bar-fill");
  const label = document.getElementById("amodal-fuel-stored");
  if (!bar) return;

  if (totalAdded === 0) {
    // Reset to the stored (real) state
    bar.style.animation = "none";
    bar.style.transition = "";
    bar.style.width = `${Math.min(100, Math.round(storedFuel / (instLevel + 1) * 100))}%`;
    if (label) label.textContent = `${storedFuel} / ${instLevel + 1} units`;
    return;
  }

  // Simulate the cascade to build the animation keyframe sequence
  const RUSH = 0.15;  // seconds to fill one level bar
  const RESET = 0.03; // seconds for the near-instant reset flash
  const EASE = 0.45;  // seconds to ease to the final resting position

  let fuel = storedFuel;
  let level = instLevel;
  let remaining = totalAdded;
  const segments: { dt: number; width: number }[] = [];

  while (remaining > 0) {
    const levelCost = level + 1;
    const space = levelCost - fuel;
    if (remaining >= space) {
      segments.push({ dt: RUSH, width: 1.0 });
      remaining -= space;
      fuel = 0;
      level++;
      if (remaining > 0) segments.push({ dt: RESET, width: 0.0 });
    } else {
      fuel += remaining;
      remaining = 0;
      segments.push({ dt: EASE, width: fuel / (level + 1) });
    }
  }
  // If we ended exactly on a level-up (bar at 100%), ease to 0% of next level
  if (segments.length > 0 && segments[segments.length - 1].width === 1.0) {
    segments[segments.length - 1].dt = EASE;
    fuel = 0;
  }

  const totalDuration = segments.reduce((s, seg) => s + seg.dt, 0);
  const startWidth = Math.min(100, Math.round(storedFuel / (instLevel + 1) * 100));

  // Build percentage keyframes
  let accumulated = 0;
  let kfCss = `0% { width: ${startWidth}% }`;
  for (const seg of segments) {
    accumulated += seg.dt;
    const pct = Math.round((accumulated / totalDuration) * 100);
    kfCss += `\n${pct}% { width: ${Math.round(seg.width * 100)}% }`;
  }

  const animName = `fuel-preview-${Date.now()}`;
  let styleEl = document.getElementById("amodal-fuel-anim-style") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "amodal-fuel-anim-style";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `@keyframes ${animName} { ${kfCss} }`;

  bar.style.transition = "none";
  bar.style.animation = `${animName} ${totalDuration.toFixed(2)}s ease-out forwards`;

  if (label) label.textContent = `${fuel} / ${level + 1} units (preview)`;
}

function findCombinePairs(runeInv: Rune[], maxTier: Rune["tier"] = "lesser"): { id1: string; id2: string; type: string; tier: string; name: string; result: string }[] {
  const TIER_ORDER = ["lesser", "greater", "flawless", "ancient"];
  const maxIdx = TIER_ORDER.indexOf(maxTier);
  const combinableTiers = TIER_ORDER.slice(0, maxIdx + 1);
  const TIER_UP: Record<string, string> = { lesser: "greater", greater: "flawless", flawless: "ancient" };
  const TIER_LABELS: Record<string, string> = { lesser: "Lesser", greater: "Greater", flawless: "Flawless", ancient: "Ancient" };
  const counts: Record<string, number> = {};
  for (const r of runeInv) {
    if (combinableTiers.includes(r.tier) && TIER_UP[r.tier]) counts[r.id] = (counts[r.id] ?? 0) + 1;
  }
  const pairs: { id1: string; id2: string; type: string; tier: string; name: string; result: string }[] = [];
  const seen = new Set<string>();
  for (const [id, count] of Object.entries(counts)) {
    if (count >= 2 && !seen.has(id)) {
      seen.add(id);
      const def = RUNE_DEFS[id];
      if (def) pairs.push({ id1: id, id2: id, type: def.type, tier: def.tier, name: `${TIER_LABELS[def.tier]} ${def.type}`, result: TIER_LABELS[TIER_UP[def.tier]] ?? "?" });
    }
  }
  return pairs;
}

const SKILL_NAMES: Record<string, string> = {
  skill_battle_cry:    "📯 Battle Cry",
  skill_shadow_strike: "🌑 Shadow Strike",
  skill_arcane_surge:  "⚡ Arcane Surge",
  skill_consecrate:    "🙏 Consecrate",
  skill_volley:        "🏹 Volley",
  skill_entangle:      "🌿 Entangle",
};
const SKILL_DESCS: Record<string, string> = {
  skill_battle_cry:    "Doubles party damage for 8 kills.",
  skill_shadow_strike: "Triples all damage (tick + click) for 5 kills.",
  skill_arcane_surge:  "Triples party damage for 6 kills.",
  skill_consecrate:    "Instantly heals all party members for 50% of their max HP.",
  skill_volley:        "×2.5 party DPS for 6 kills.",
  skill_entangle:      "Reduces enemy attack by 60% for 8 kills.",
};

/** Shows/hides the active skill button and updates its cooldown drain bar. */
function renderSkillButton(state: GameStateDict): void {
  const skillId = state.skill_available;
  const newKey = skillId + "|" + (skillId ? (state.skill_cooldowns[skillId] ?? 0) : 0) + "|" + (skillId ? (state.active_effects[skillId] ?? 0) : 0) + "|" + (state.all_skills_unlocked ? "1" : "0") + "|" + (state.auto_skill_enabled ? "1" : "0");
  if (newKey === skillKey) return;
  skillKey = newKey;

  const btn = $("skill-btn") as HTMLButtonElement;
  const autoBtn = document.getElementById("auto-skill-btn") as HTMLButtonElement;

  if (!skillId) {
    btn.hidden = true;
    autoBtn.hidden = true;
    return;
  }

  btn.hidden = false;
  const remaining = state.skill_cooldowns[skillId] ?? 0;
  const expiry = state.active_effects[skillId] ?? 0;
  const totalCooldown = SKILL_DEFS[skillId]?.cooldownKills ?? 30;
  const isActive = expiry > 0;
  const onCooldown = remaining > 0 && !isActive;

  btn.textContent = SKILL_NAMES[skillId] ?? skillId;
  btn.dataset.activeSkill = skillId;
  btn.dataset.skillState = encodeURIComponent(JSON.stringify({ remaining, expiry, totalCooldown, isActive, onCooldown }));
  btn.disabled = onCooldown;
  btn.className = isActive ? "active" : "";

  autoBtn.hidden = !state.all_skills_unlocked;
  autoBtn.className = state.auto_skill_enabled ? "active" : "";
}

/** Renders skill buttons for companion party members below the attack button. */
function renderCompanionSkills(state: GameStateDict): void {
  const skills = state.companion_skills_available;
  const newKey = JSON.stringify(skills) + "|" + skills.map(id =>
    (state.skill_cooldowns[id] ?? 0) + ":" + (state.active_effects[id] ?? 0)
  ).join(",");
  if (newKey === companionSkillKey) return;
  companionSkillKey = newKey;

  const container = document.getElementById("companion-skills")!;
  if (!skills.length) { container.innerHTML = ""; return; }

  container.innerHTML = skills.map(skillId => {
    const remaining = state.skill_cooldowns[skillId] ?? 0;
    const expiry = state.active_effects[skillId] ?? 0;
    const totalCooldown = SKILL_DEFS[skillId]?.cooldownKills ?? 30;
    const isActive = expiry > 0;
    const onCooldown = remaining > 0 && !isActive;
    const label = SKILL_NAMES[skillId] ?? skillId;
    return `<div class="companion-skill-cell">
      <button class="companion-skill-btn${isActive ? " active" : ""}" data-action="activate-companion-skill" data-skill="${skillId}" data-active-skill="${skillId}" data-skill-state="${encodeURIComponent(JSON.stringify({ remaining, expiry, totalCooldown, isActive, onCooldown }))}"${onCooldown ? " disabled" : ""}>${label}</button>
    </div>`;
  }).join("");
}

/** Enables/disables the Prestige button and updates its label with the points preview. */
function updatePrestigeButton(state: GameStateDict): void {
  const btn = $("prestige-btn") as HTMLButtonElement;
  if (state.prestige_available) {
    btn.disabled = false;
    btn.textContent = `★ Return to Town (+${state.prestige_points_preview} rn)`;
  } else {
    btn.disabled = true;
    btn.textContent = `★ Return to Town (need lv${20})`;
  }
}

/** Populates the Lifetime Stats modal with totals and the enemy kill breakdown. */
function updateLifetimeStats(state: GameStateDict): void {
  const newKey = `${state.lifetime_kills}|${state.lifetime_deaths}|${state.lifetime_best_level}|${state.total_prestiges}|${state.dungeon_index}`;
  if (newKey === lifetimeStatsKey) return;
  lifetimeStatsKey = newKey;

  const ltKills = document.getElementById("lt-kills");
  const ltDeaths = document.getElementById("lt-deaths");
  const ltBest = document.getElementById("lt-best");
  const ltPrestiges = document.getElementById("lt-prestiges");
  if (ltKills) ltKills.textContent = String(state.lifetime_kills);
  if (ltDeaths) ltDeaths.textContent = String(state.lifetime_deaths);
  if (ltBest) ltBest.textContent = String(state.lifetime_best_level);
  if (ltPrestiges) ltPrestiges.textContent = String(state.total_prestiges);
  const ltDungeon = document.getElementById("lt-dungeon");
  if (ltDungeon) ltDungeon.textContent = String(state.dungeon_index + 1);

  const enemyKillsEl = document.getElementById("lt-enemy-kills");
  const enemySection = document.getElementById("lt-enemy-section");
  if (!enemyKillsEl || !enemySection) return;
  const ekMap = state.lifetime_enemy_kills;
  const entries = Object.entries(ekMap).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    enemySection.hidden = true;
    return;
  }
  enemySection.hidden = false;
  enemyKillsEl.innerHTML = entries
    .map(([adj, count]) => `<div class="stat-row"><span class="stat-label">${adj}</span><span>${count}</span></div>`)
    .join("");
}

/** Shows notification badges on sidebar/mobile tabs when a Prestige or Guild item is affordable. */
function updateShopBadge(state: GameStateDict): void {
  const badge = document.getElementById("shop-tab-badge");
  if (!badge) return;
  const canBuyUpgrade = state.party.some(c => {
    const ups = state.upgrades[c.name];
    return ups && Object.values(ups).some(u => state.gold >= u.cost);
  });
  const ups = state.prestige_upgrades;
  const canBuyPrestige = Object.keys(PRESTIGE_SHOP_META).some(type => {
    const owned = ups[type] ?? 0;
    const atMax = owned >= (PRESTIGE_SHOP_META[type]?.max ?? 1);
    const prereqMissing = (type === "smart_seller" && !(ups["auto_seller"] > 0))
      || (type === "party_slot_3" && !(ups["party_slot_2"] > 0))
      || (type === "checkpoint_2" && !(ups["checkpoint_1"] > 0))
      || (type === "checkpoint_3" && !(ups["checkpoint_2"] > 0));
    const dungeonReq = PRESTIGE_SHOP_META[type]?.dungeonReq ?? 0;
    const cost = prestigeUpgradeCost(type, owned);
    return !atMax && !prereqMissing && state.dungeon_index >= dungeonReq && state.prestige_points >= cost;
  });
  const guildUpgrades = state.guild_upgrades;
  const guildUnlocked = (ups["guild_hall_access"] ?? 0) > 0;
  const canBuyGuild = guildUnlocked && Object.entries(GUILD_HALL_COSTS).some(([type, costs]) => {
    const owned = guildUpgrades[type] ?? 0;
    const dungeonReq = GUILD_HALL_DUNGEON_REQ[type] ?? 0;
    return owned < costs.length && state.dungeon_index >= dungeonReq && state.gold >= costs[owned];
  });
  badge.hidden = !canBuyPrestige;
  const upgradeTabBadge = document.getElementById("upgrade-tab-badge");
  if (upgradeTabBadge) upgradeTabBadge.hidden = !canBuyUpgrade;
  const stabPrestigeBadge = document.getElementById("stab-prestige-badge");
  if (stabPrestigeBadge) stabPrestigeBadge.hidden = !canBuyPrestige;
  const stabGuildBadge = document.getElementById("stab-guild-badge");
  if (stabGuildBadge) stabGuildBadge.hidden = !canBuyGuild;
  const mobileGuildBadge = document.getElementById("guild-tab-badge");
  if (mobileGuildBadge) mobileGuildBadge.hidden = !canBuyGuild;
}

/** Renders the drop-rate chart modal showing per-tier probabilities for the given dungeon floor. */
function renderDropChart(dungeonLevel: number): void {
  $("drop-chart-floor").textContent = String(dungeonLevel);
  const weights = qualityWeights(dungeonLevel);
  const total = weights.reduce((s, w) => s + w, 0);
  const rows = [...QUAL].reverse().map((q, ri) => {
    const i = QUAL.length - 1 - ri;
    const w = weights[i];
    const locked = w === 0;
    const pct = locked ? 0 : (w / total) * 100;
    const cssVar = `var(--q-${q})`;
    return `
      <div class="drop-chart-row${locked ? " drop-chart-locked" : ""}">
        <span class="drop-chart-label ${QUALITY_CLASSES[q]}">${q}</span>
        <div class="drop-chart-bar-wrap">
          ${locked ? "" : `<div class="drop-chart-bar" style="width:${pct.toFixed(2)}%;background:${cssVar}"></div>`}
        </div>
        <span class="drop-chart-pct">${locked ? "locked" : pct < 0.05 ? "<0.1%" : pct.toFixed(1) + "%"}</span>
      </div>`;
  }).join("");
  $("drop-chart-body").innerHTML = rows;
}

/** Renders the combat log panel from the state snapshot. */
let themePickerKey = "";
function renderThemePicker(state: GameStateDict): void {
  const prestiges = state.total_prestiges ?? 0;
  const current = (document.documentElement.dataset.theme ?? "arcane") as Theme;
  const newKey = `${prestiges}|${current}`;
  if (newKey === themePickerKey) return;
  themePickerKey = newKey;

  const picker = document.getElementById("theme-picker");
  if (!picker) return;
  picker.innerHTML = THEME_UNLOCKS.map(({ theme, icon, label, prestiges: req }) => {
    const unlocked = prestiges >= req;
    const isActive = theme === current;
    const lockedAttr = unlocked ? "" : ' tabindex="-1" aria-disabled="true"';
    const activeCls = isActive ? " active" : "";
    const lockCls = unlocked ? "" : " locked";
    const lockSpan = unlocked ? "" : `<span class="theme-lock">${req}✦ prestiges</span>`;
    return `<button class="theme-btn${activeCls}${lockCls}" data-theme="${theme}"${lockedAttr}>${icon} ${label}${lockSpan}</button>`;
  }).join("");
}

const CATEGORY_LABELS: Record<string, string> = {
  combat: "Combat", explorer: "Explorer", collector: "Collector",
  wealth: "Wealth", prestige: "Renown", guild: "Guild", runes: "Runes",
};

const CATEGORY_ICONS: Record<string, string> = {
  combat: "⚔", explorer: "🗺", collector: "🎒", wealth: "💰", prestige: "✦", guild: "🏰", runes: "🔮",
};

let featsKey = "";
let featsFilterKey = "";
let featsFilter: "all" | "in_progress" | "completed" = "all";

// Feats that should remain hidden until their related feature is unlocked.
// Omitted IDs are always visible.
const FEAT_VISIBILITY: Record<string, (s: GameStateDict) => boolean> = (() => {
  const hasGuildHall  = (s: GameStateDict) => (s.prestige_upgrades?.["guild_hall_access"] ?? 0) > 0;
  const hasConstell   = (s: GameStateDict) => (s.guild_upgrades?.["constellation_access"] ?? 0) > 0;
  const hasRuneForge  = (s: GameStateDict) => (s.guild_upgrades?.["rune_forge"] ?? 0) > 0;
  const hasAnySkill   = (s: GameStateDict) => Object.keys(s.guild_upgrades ?? {}).some(k => k.startsWith("skill_") && (s.guild_upgrades![k] ?? 0) > 0);
  const hasPartySlot2 = (s: GameStateDict) => (s.prestige_upgrades?.["party_slot_2"] ?? 0) > 0;
  const hasPartySlot6 = (s: GameStateDict) => (s.prestige_upgrades?.["party_slot_6"] ?? 0) > 0;
  return {
    // Guild Hall
    guild_max:             hasGuildHall,
    guild_upgrades_tiered: hasGuildHall,
    // Party expansion
    not_alone:             hasPartySlot2,
    band_of_heroes:        hasPartySlot2,
    full_roster:           hasPartySlot6,
    // Skills
    battle_ready:          hasAnySkill,
    arsenal:               hasAnySkill,
    tactician_tiered:      hasAnySkill,
    // Runes
    arcane_brand:          hasRuneForge,
    forge_master:          hasRuneForge,
    fully_attuned:         hasRuneForge,
    ancient_power:         hasRuneForge,
    gem_collector:         hasRuneForge,
    rune_trader:           hasRuneForge,
    // Artifacts (crafted via rune forge)
    relic_finder:          hasRuneForge,
    archaeologist_tiered:  hasRuneForge,
    artifact_max_level:    hasRuneForge,
    // Constellations
    first_light:           hasConstell,
    stargazer_tiered:      hasConstell,
    constellation_master:  hasConstell,
  };
})();

function isFeatVisible(def: typeof ACHIEVEMENTS[0], state: GameStateDict): boolean {
  const check = FEAT_VISIBILITY[def.id];
  return !check || check(state);
}

function renderFeats(state: GameStateDict): void {
  // Filter tabs live in a separate stable element so re-renders of feat content don't destroy them
  if (featsFilter !== featsFilterKey) {
    featsFilterKey = featsFilter;
    $("feats-filter-bar").innerHTML = `<div class="feats-filter-tabs">
      <button class="feats-filter-btn${featsFilter === "all" ? " active" : ""}" data-action="feats-filter" data-filter="all">All</button>
      <button class="feats-filter-btn${featsFilter === "in_progress" ? " active" : ""}" data-action="feats-filter" data-filter="in_progress">In Progress</button>
      <button class="feats-filter-btn${featsFilter === "completed" ? " active" : ""}" data-action="feats-filter" data-filter="completed">Completed</button>
    </div>`;
  }

  const unlockedCount = state.achievements_unlocked?.length ?? 0;
  const pu = state.prestige_upgrades ?? {};
  const gu = state.guild_upgrades ?? {};
  const visKey = `${pu["guild_hall_access"] ?? 0}_${pu["party_slot_2"] ?? 0}_${pu["party_slot_6"] ?? 0}_${gu["constellation_access"] ?? 0}_${gu["rune_forge"] ?? 0}_${Object.keys(gu).some(k => k.startsWith("skill_") && (gu[k] ?? 0) > 0) ? 1 : 0}`;
  const newKey = `${unlockedCount}|${featsFilter}|${state.achievement_progress_ts ?? 0}|${visKey}`;
  if (newKey === featsKey) return;
  featsKey = newKey;

  const unlocked = new Set(state.achievements_unlocked ?? []);
  const progress = state.achievement_progress ?? {};

  const categories = ["combat", "explorer", "collector", "wealth", "prestige", "guild", "runes"];
  const byCategory: Record<string, typeof ACHIEVEMENTS> = {};
  for (const cat of categories) byCategory[cat] = [];
  for (const def of ACHIEVEMENTS) {
    if (isFeatVisible(def, state)) byCategory[def.category]?.push(def);
  }

  function featRewardChip(r: { type: string; value?: number; title?: string; cosmetic?: string }, tierLabel?: string): string {
    let text = "";
    if (r.type === "gold") text = `+${formatNumber(r.value ?? 0)}g`;
    else if (r.type === "title") text = `"${r.title}"`;
    else if (r.type === "avatar") {
      const a = AVATAR_DEFS.find(x => x.id === r.cosmetic);
      text = `${a?.icon ?? ""} ${a?.name ?? r.cosmetic}`;
    } else if (r.type === "border") {
      const b = BORDER_DEFS.find(x => x.id === r.cosmetic);
      text = `${b?.name ?? r.cosmetic} border`;
    }
    if (!text) return "";
    const cls = tierLabel ? ` reward-${tierLabel}` : "";
    return `<span class="feat-reward-chip${cls}">${tierLabel ? tierLabel[0].toUpperCase() + ": " : ""}${text}</span>`;
  }

  function featStatus(def: typeof ACHIEVEMENTS[0]): "done" | "active" | "locked" {
    if (def.tiers) {
      const lastLabel = def.tiers[def.tiers.length - 1].label;
      const isDone = unlocked.has(`${def.id}_${lastLabel}`);
      if (isDone) return "done";
      const hasProgress = (progress[def.id] ?? 0) > 0 || def.tiers.some(t => unlocked.has(`${def.id}_${t.label}`));
      return hasProgress ? "active" : "locked";
    } else {
      if (unlocked.has(def.id)) return "done";
      return (progress[def.id] ?? 0) > 0 ? "active" : "locked";
    }
  }

  const categorySections = categories.map(cat => {
    const allDefs = byCategory[cat];
    const doneCount = allDefs.filter(def => featStatus(def) === "done").length;

    // Sort: active → locked → done
    const sorted = [...allDefs].sort((a, b) => {
      const order = { active: 0, locked: 1, done: 2 };
      return order[featStatus(a)] - order[featStatus(b)];
    });

    // Apply filter
    const visible = sorted.filter(def => {
      const st = featStatus(def);
      if (featsFilter === "in_progress") return st === "active";
      if (featsFilter === "completed") return st === "done";
      return true;
    });

    if (visible.length === 0) return "";

    const allDone = doneCount === allDefs.length;
    const countCls = allDone ? " complete" : "";
    const header = `<div class="feat-category-title">${spr(CATEGORY_ICONS[cat])} ${CATEGORY_LABELS[cat]}<span class="feat-cat-count${countCls}">${doneCount}/${allDefs.length}</span></div>`;

    const cards = visible.map(def => {
      const status = featStatus(def);
      const isDone = status === "done";
      const isHidden = def.hidden && !isDone && !def.tiers?.some(t => unlocked.has(`${def.id}_${t.label}`));

      const name = isHidden ? "???" : def.name;
      const desc = isHidden ? "Complete a hidden challenge to reveal this feat." : def.description;

      let tierHtml = "";
      let progressHtml = "";
      if (def.tiers && !isHidden) {
        const pips = def.tiers.map(t => {
          const done = unlocked.has(`${def.id}_${t.label}`);
          const cls = done ? ` ${t.label}-done` : "";
          const rewardTip = t.reward ? " — " + (t.reward.type === "gold" ? `+${formatNumber(t.reward.value ?? 0)}g` : t.reward.type === "title" ? `"${t.reward.title}"` : t.reward.cosmetic ?? "") : "";
          return `<span class="feat-tier-pip${cls}" title="${t.label[0].toUpperCase() + t.label.slice(1)}: ${formatNumber(t.threshold)}${rewardTip}">
            <span class="feat-tier-letter">${t.label[0].toUpperCase()}</span>
            <span class="feat-tier-thresh">${formatNumber(t.threshold)}</span>
          </span>`;
        }).join("");
        tierHtml = `<div class="feat-tiers">${pips}</div>`;

        const nextTier = def.tiers.find(t => !unlocked.has(`${def.id}_${t.label}`));
        if (nextTier) {
          const prevThreshold = def.tiers[def.tiers.indexOf(nextTier) - 1]?.threshold ?? 0;
          const current = progress[def.id] ?? 0;
          const pct = prevThreshold > 0
            ? Math.min(100, ((current - prevThreshold) / (nextTier.threshold - prevThreshold)) * 100)
            : Math.min(100, (current / nextTier.threshold) * 100);
          progressHtml = `<div class="feat-progress-wrap">
            <div class="feat-progress-bar"><div class="feat-progress-fill" style="width:${pct.toFixed(1)}%"></div></div>
            <span class="feat-progress-text">${formatNumber(current)} / ${formatNumber(nextTier.threshold)}</span>
          </div>`;
        }
      } else if (!def.tiers && !isHidden && !isDone) {
        const current = progress[def.id] ?? 0;
        if (current > 0) {
          progressHtml = `<div class="feat-progress-wrap">
            <div class="feat-progress-bar"><div class="feat-progress-fill" style="width:100%"></div></div>
            <span class="feat-progress-text">${formatNumber(current)}</span>
          </div>`;
        }
      }

      let rewardHtml = "";
      if (!isHidden) {
        const chips = def.tiers
          ? def.tiers.filter(t => t.reward).map(t => featRewardChip(t.reward!, t.label)).filter(Boolean).join("")
          : def.reward ? featRewardChip(def.reward) : "";
        if (chips) rewardHtml = `<div class="feat-rewards">${chips}</div>`;
      }

      return `<div class="feat-card feat-card--${status}">
        <div class="feat-card-header">
          <span class="feat-name${isHidden ? " feat-name--hidden" : ""}">${name}</span>
          ${isDone ? '<span class="feat-done-badge">✓</span>' : ""}
        </div>
        <div class="feat-desc">${desc}</div>
        ${rewardHtml}${tierHtml}${progressHtml}
      </div>`;
    }).join("");

    return `<div class="feat-category">${header}${cards}</div>`;
  }).filter(Boolean).join("");

  const noResults = `<div class="feat-empty">No feats match this filter.</div>`;

  $("feats-content").innerHTML = categorySections || noResults;

  // Badge: show count of pending toasts as a brief notification
  const badge = document.getElementById("stab-feats-badge");
  if (badge) {
    const pending = (state.pending_achievements ?? []).length;
    if (pending > 0) {
      badge.textContent = String(pending);
      badge.hidden = false;
      clearTimeout(featsBadgeTimer);
      featsBadgeTimer = setTimeout(() => { badge.hidden = true; }, 5000);
    }
  }
}

function showAchievementToasts(unlocks: AchievementUnlock[]): void {
  if (!unlocks.length) return;
  const container = document.getElementById("achievement-toast-container");
  if (!container) return;
  unlocks.forEach((u, i) => {
    setTimeout(() => {
      const r = u.reward;
      const rewardText = !r ? "" :
        r.type === "gold" ? `+${formatNumber(r.value ?? 0)}g` :
        r.type === "prestige_points" ? `+${r.value} renown` :
        r.type === "title" ? `Title unlocked: "${r.title}"` :
        r.type === "avatar" ? (() => { const a = AVATAR_DEFS.find(x => x.id === r.cosmetic); return `Avatar: ${a?.icon ?? ""} ${a?.name ?? r.cosmetic}`; })() :
        r.type === "border" ? (() => { const b = BORDER_DEFS.find(x => x.id === r.cosmetic); return `Border: ${b?.name ?? r.cosmetic}`; })() : "";
      const tierTag = u.tier ? ` <span style="font-size:0.6rem;color:var(--muted)">(${u.tier})</span>` : "";
      const toastTitle = u.wasHidden ? "Mystery Feat Revealed!" : "Feat Unlocked!";
      const el = document.createElement("div");
      el.className = "achievement-toast";
      el.innerHTML = `<div class="toast-title">${toastTitle}</div><div class="toast-name">${u.name}${tierTag}</div>${rewardText ? `<div class="toast-reward">${rewardText}</div>` : ""}`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 3200);
    }, i * 400);
  });
}

const DEATH_LINES_FLOOR1 = [
  "You open your eyes. Cold stone, a torch nearby. Somehow you're back at the entrance.",
  "The last thing you remember was the blow. Now you're standing at the dungeon gate, inexplicably alive.",
  "You wake face-down in the dirt outside the entrance. Your wounds are healed. How long were you out?",
  "Strange. You were certain that was the end. You're back at the start, with no memory of how.",
  "Death didn't take you. Or something brought you back. Floor 1. Again.",
  "You gasp awake in the dark. The dungeon entrance looms ahead. Some force has returned you here.",
];

const DEATH_LINES_CHECKPOINT = [
  "You come to at the checkpoint. Someone — or something — dragged you back here.",
  "Barely alive. You stir at the checkpoint torch, wounds already closing.",
  "The dungeon claimed one life — but not yours. You recover at the checkpoint.",
  "You wake at the waystone. The depths didn't keep you. Press on.",
];

function showDeathToast(respawnFloor: number): void {
  const container = document.getElementById("achievement-toast-container");
  if (!container) return;
  const pool = respawnFloor <= 1 ? DEATH_LINES_FLOOR1 : DEATH_LINES_CHECKPOINT;
  const line = pool[Math.floor(Math.random() * pool.length)];
  const sub = respawnFloor <= 1 ? "back at floor 1" : `back at floor ${respawnFloor}`;
  const el = document.createElement("div");
  el.className = "achievement-toast death-toast";
  el.innerHTML = `<div class="toast-title">Defeated</div><div class="toast-name">${line}</div><div class="toast-reward">${sub}</div>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

const HOMECOMING_LINES = [
  "The villagers cheer as you stumble through the gates. Bards will sing of this tonight.",
  "Word spreads fast — the hero has returned. Coin and cheer flow freely at the tavern.",
  "Children run to meet you at the gates. The innkeeper has your usual room ready.",
  "The village elder nods in quiet respect. You've earned this rest.",
  "The market stirs. Stories of your deeds are already trading hands.",
  "Fires are lit in your honor. The village is glad to have you back.",
];

function showHomecomingToast(renownEarned: number): void {
  const container = document.getElementById("achievement-toast-container");
  if (!container) return;
  const line = HOMECOMING_LINES[Math.floor(Math.random() * HOMECOMING_LINES.length)];
  const el = document.createElement("div");
  el.className = "achievement-toast homecoming-toast";
  el.innerHTML = `<div class="toast-title">Returned to Town</div><div class="toast-name">${line}</div><div class="toast-reward">+${renownEarned} renown • the dungeon shifts anew</div>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function renderLog(state: GameStateDict): void {
  const newKey = state.log.join("|");
  if (newKey !== logKey) {
    logKey = newKey;
    const lines = [...state.log].reverse();
    $("combat-log").innerHTML = lines.map((l) => `<div class="log-line">${l}</div>`).join("");
  }
  // Accumulate new entries into fullLog (dedupe by checking against last entry)
  for (const line of state.log) {
    if (fullLog[fullLog.length - 1] !== line) {
      fullLog.push(line);
      if (fullLog.length > 200) fullLog.shift();
    }
  }
}

/** Prepends a message directly to the combat log DOM element (used for UI-layer error messages). */
function appendLog(msg: string): void {
  const log = $("combat-log");
  log.insertAdjacentHTML(
    "afterbegin",
    `<div class="log-line" style="color:var(--danger)">${msg}</div>`,
  );
  while (log.children.length > 50) log.lastElementChild!.remove();
}

function buildRuneTooltipHTML(rune: Rune & { slotLabel: string }): string {
  const icon = RUNE_ICONS[rune.type] ?? "🔮";
  const statLabel = RUNE_STAT_LABELS[rune.statKey] ?? rune.statKey;
  const TIER_LABELS: Record<string, string> = { lesser: "Lesser", greater: "Greater", flawless: "Flawless", ancient: "Ancient" };
  const TIER_CLS: Record<string, string> = { lesser: "tt-rarity quality-common", greater: "tt-rarity quality-legendary", flawless: "tt-rarity quality-epic", ancient: "tt-rarity quality-divine" };
  const tierLabel = TIER_LABELS[rune.tier] ?? rune.tier;
  const tierCls = TIER_CLS[rune.tier] ?? "tt-rarity quality-common";
  return `
    <span class="tt-name">${spr(icon)} ${rune.name}</span>
    <div class="${tierCls}">${tierLabel}</div>
    <div class="tt-subtitle">${rune.slotLabel}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats"><div class="tt-stat-row"><span class="tt-stat-label">${statLabel}</span><span class="tt-stat-val tt-dps">+${rune.value}</span></div></div>
  `;
}

/** Builds the inner HTML for the item tooltip given a serialized GearItemDict. */
function buildTooltipHTML(item: GearItemDict, equippedSetCount = 0): string {
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

type CharDict = GameStateDict["party"][number];
/** CharDict augmented with the renderer-computed effective_dps (base dps × upgrade multiplier). */
type CharDictWithEffectiveDps = CharDict & { effective_dps?: number };

function statRow(label: string, value: string, cls = ""): string {
  return `<div class="tt-stat-row"><span class="tt-stat-label">${label}</span><span class="tt-stat-val${cls ? " " + cls : ""}">${value}</span></div>`;
}

function buildCharTooltipHTML(c: CharDictWithEffectiveDps): string {
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
    ? `<div class="tt-divider"></div><div class="tt-abilities">${unlocked.map(a => `<span class="tt-ability">${spr(a.icon)} ${a.name}</span>`).join("")}</div>`
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

function buildPartyTooltipHTML(party: CharDictWithEffectiveDps[]): string {
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

function formatStats(stats: GearStats): string {
  return statParts(stats).join("  ") || "+0";
}

/** Renders loot chest stats as individual <span> elements for grid layout, with tri indicator on first stat. */
function formatLootStats(tri: string, stats: GearStats): string {
  const parts = statParts(stats);
  if (parts.length === 0) return '<span class="loot-stat">+0</span>';
  return parts.map((p, i) => `<span class="loot-stat">${i === 0 && tri ? tri : ""}${p}</span>`).join("");
}

// ▲ green: beats every party member's equip in this slot
// ▼ red:   loses to the worst equipped item and nobody has an empty slot
function lootTier(
  item: GameStateDict["loot_pool"][number],
  party: GameStateDict["party"],
): [string, string] {
  const itemPower = gearPower(item.stats ?? { dps: item.damage });
  const powers = party.map((c) => {
    const eq = c.equipment[item.slot as keyof typeof c.equipment];
    return eq ? gearPower(eq.stats ?? { dps: eq.damage }) : 0;
  });
  const max = Math.max(...powers);
  const min = Math.min(...powers);
  if (itemPower > max) return ["▲", "ind-up"];
  if (min > 0 && itemPower < min) return ["▼", "ind-down"];
  return ["", ""];
}

function slotLabel(slot: string): string {
  return slot.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const TAB_PANELS: Record<string, string[]> = {
  combat:   ["enemy-panel", "party-panel", "constellation-panel", "loot-panel"],
  upgrade:  ["upgrades-panel"],
  prestige: ["prestige-panel"],
  guild:    ["guild-hall-panel"],
  log:      ["log-panel"],
};

const SIDEBAR_TAB_PANELS: Record<string, string[]> = {
  upgrades:      ["upgrades-panel"],
  loot:          ["loot-panel"],
  prestige:      ["prestige-panel"],
  guild:         ["guild-hall-panel"],
  feats:         ["feats-panel"],
  log:           ["log-panel"],
};

let applyCombatSubTab: (() => void) | null = null;

function initCombatSubTabs(): void {
  const bar = document.getElementById("combat-subtabs")!;
  const mainEl = document.querySelector("main")!;
  const saved = localStorage.getItem("combat-sub-tab") ?? "party";

  function switchSub(which: string): void {
    bar.querySelectorAll<HTMLElement>(".combat-stab").forEach(b =>
      b.classList.toggle("active", b.dataset.combatStab === which)
    );
    mainEl.dataset.combatSub = which;
    localStorage.setItem("combat-sub-tab", which);
  }

  applyCombatSubTab = () => switchSub(mainEl.dataset.combatSub ?? saved);

  bar.querySelectorAll<HTMLElement>(".combat-stab").forEach(btn =>
    btn.addEventListener("click", () => switchSub(btn.dataset.combatStab!))
  );

  switchSub(saved);
}

function initMobileTabs(): void {
  const allPanelIds = Object.values(TAB_PANELS).flat();
  const tabs = document.querySelectorAll<HTMLElement>(".mobile-tab-btn");
  const combatSubBar = document.getElementById("combat-subtabs")!;

  function showTab(tab: string): void {
    allPanelIds.forEach(id => document.getElementById(id)?.classList.remove("tab-visible"));
    TAB_PANELS[tab]?.forEach(id => document.getElementById(id)?.classList.add("tab-visible"));
    tabs.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
    const isMobile = window.matchMedia("(max-width: 1280px)").matches;
    combatSubBar.style.display = isMobile && tab === "combat" ? "flex" : "none";
    if (tab === "combat") applyCombatSubTab?.();
  }

  tabs.forEach(btn => btn.addEventListener("click", () => showTab(btn.dataset.tab!)));
  showTab("combat");
}

function initSidebarTabs(): void {
  const allPanelIds = Object.values(SIDEBAR_TAB_PANELS).flat();
  const tabs = document.querySelectorAll<HTMLElement>(".stab-btn");

  function showSidebarTab(tab: string): void {
    allPanelIds.forEach(id => document.getElementById(id)?.classList.remove("stab-visible"));
    SIDEBAR_TAB_PANELS[tab]?.forEach(id => document.getElementById(id)?.classList.add("stab-visible"));
    tabs.forEach(btn => btn.classList.toggle("active", btn.dataset.stab === tab));
  }

  tabs.forEach(btn => btn.addEventListener("click", () => showSidebarTab(btn.dataset.stab!)));
  showSidebarTab("upgrades");
}

const LOOT_SUBPANEL_IDS = ["loot-equipment-sub", "loot-runes-sub", "loot-artifacts-sub"] as const;

const LOOT_TO_PTAB: Record<string, string> = {
  equipment: "party",
  runes:     "runes",
  artifacts: "artifacts",
};

let switchPartyTab: (which: string) => void = () => {};
let switchLeftColSub: (which: string) => void = () => {};

function initLootSubtabs(): void {
  const btns = document.querySelectorAll<HTMLElement>(".loot-stab");

  function showLootSub(tab: string): void {
    btns.forEach(b => b.classList.toggle("active", b.dataset.lootStab === tab));
    LOOT_SUBPANEL_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = id !== `loot-${tab}-sub`;
    });
    switchPartyTab(LOOT_TO_PTAB[tab] ?? "party");
  }

  btns.forEach(btn => btn.addEventListener("click", () => showLootSub(btn.dataset.lootStab!)));
}

interface AbilityCardData { icon: string; name: string; desc: string; level: number; unlocked: boolean; }

function buildSkillTooltipHTML(a: AbilityCardData): string {
  const statusClass = a.unlocked ? "rarity-rare" : "rarity-common";
  const statusText  = a.unlocked ? "Unlocked" : `Requires Level ${a.level}`;
  return `
    <div class="tt-name">${spr(a.icon)} ${a.name}</div>
    <div class="tt-rarity ${statusClass}">${statusText}</div>
    <div class="tt-divider"></div>
    <div class="tt-stat-row"><span class="tt-stat-label">${a.desc}</span></div>`;
}

const TOOLTIP_SELECTORS = ".gear-pdoll-slot.filled[data-item], .loot-item[data-item], .char-name[data-char], .hero-sprite[data-char], #party-panel h2[data-party], [data-active-skill], .char-dps[data-dps], .tt-rune-slot[data-rune], .pdoll-slot.equipped[data-rune], .char-artifact-badge[data-artifact], .set-bonus-badge[data-set], .ability-badge[data-skill]";

function buildActiveSkillTooltipHTML(skillId: string, skillState?: { remaining: number; expiry: number; totalCooldown: number; isActive: boolean; onCooldown: boolean }): string {
  const name = SKILL_NAMES[skillId] ?? skillId;
  const desc = SKILL_DESCS[skillId] ?? "";
  const cooldownKills = skillState?.totalCooldown ?? SKILL_DEFS[skillId]?.cooldownKills ?? 30;
  let statusLine = "";
  if (skillState?.isActive) {
    const left = skillState.expiry;
    statusLine = `<div class="skill-tooltip-status skill-status-active">${spr("⚡")} Active — ${left} kill${left !== 1 ? "s" : ""} remaining</div>`;
  } else if (skillState?.onCooldown) {
    const left = skillState.remaining;
    statusLine = `<div class="skill-tooltip-status skill-status-cooldown">⏳ Cooldown — ${left} / ${cooldownKills} kills</div>`;
  } else {
    statusLine = `<div class="skill-tooltip-status skill-status-ready">✓ Ready</div>`;
  }
  return `<div class="skill-tooltip"><div class="skill-tooltip-name">${name}</div><div class="skill-tooltip-desc">${desc}</div><div class="skill-tooltip-cd">Cooldown: ${cooldownKills} kills</div>${statusLine}</div>`;
}

function buildDpsTooltipHTML(d: { total: number; base: number; gear: number; runes?: number; upgDps: number }): string {
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

function buildArtifactTooltipHTML(a: { id: string; level: number; name: string; icon: string; stat: string }): string {
  const lvlLabel = a.level > 0 ? ` +${a.level}` : "";
  return `
    <span class="tt-name">${spr(a.icon)} ${a.name}${lvlLabel}</span>
    <div class="tt-divider"></div>
    <div class="tt-stats"><div class="tt-stat-row"><span class="tt-stat-label">${a.stat || "No effect"}</span></div></div>
  `;
}

function getTooltipContent(el: HTMLElement): string | null {
  try {
    if (el.dataset.activeSkill) {
      const skillState = el.dataset.skillState ? JSON.parse(decodeURIComponent(el.dataset.skillState)) : undefined;
      return buildActiveSkillTooltipHTML(el.dataset.activeSkill, skillState);
    }
    if (el.dataset.dps)      return buildDpsTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.dps)));
    if (el.dataset.item) {
      const item = JSON.parse(decodeURIComponent(el.dataset.item)) as GearItemDict;
      let equippedSetCount = 0;
      if (item.set_name && game) {
        for (const char of game.party.team) {
          for (const piece of char.inventory.equippedItems()) {
            if (piece.setName === item.set_name) equippedSetCount++;
          }
        }
      }
      return buildTooltipHTML(item, equippedSetCount);
    }
    if (el.dataset.rune)     return buildRuneTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.rune)));
    if (el.dataset.char)     return buildCharTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.char)) as CharDict);
    if (el.dataset.party)    return buildPartyTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.party)) as CharDict[]);
    if (el.dataset.skill)    return buildSkillTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.skill)) as AbilityCardData);
    if (el.dataset.artifact) return buildArtifactTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.artifact)));
    if (el.dataset.set) {
      const { name, count } = JSON.parse(decodeURIComponent(el.dataset.set)) as { name: string; count: number };
      return buildSetBonusHTML(name, count).replace('<div class="tt-divider"></div>', "");
    }
  } catch { /* ignore */ }
  return null;
}

function initItemTooltip(): void {
  const tooltip = document.getElementById("item-tooltip")!;
  let currentTarget: HTMLElement | null = null;

  function show(content: string): void {
    tooltip.innerHTML = content;
    tooltip.classList.add("visible");
  }

  function hide(): void {
    tooltip.classList.remove("visible");
    currentTarget = null;
  }

  function position(e: MouseEvent): void {
    const W = window.innerWidth, H = window.innerHeight;
    const tw = tooltip.offsetWidth || 240;
    const th = tooltip.offsetHeight || 180;
    let x = e.clientX + 18;
    let y = e.clientY + 18;
    if (x + tw > W - 8) x = e.clientX - tw - 8;
    if (y + th > H - 8) y = e.clientY - th - 8;
    if (y < 8) y = 8;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  document.addEventListener("mousemove", (e) => {
    if (!currentTarget) return;
    position(e);
  });

  document.addEventListener("mouseover", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>(TOOLTIP_SELECTORS);
    if (!el || el === currentTarget) return;
    const content = getTooltipContent(el);
    if (!content) return;
    currentTarget = el;
    show(content);
    position(e as MouseEvent);
  });

  document.addEventListener("mouseout", (e) => {
    if (!currentTarget) return;
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && currentTarget.contains(relatedTarget)) return;
    if (relatedTarget?.closest(TOOLTIP_SELECTORS) !== currentTarget) hide();
  });

  document.addEventListener("click", () => hide());
}

function initMobileItemCard(): void {
  const overlay = document.getElementById("mobile-item-card")!;
  const content = overlay.querySelector<HTMLElement>(".mic-content")!;
  const closeBtn = overlay.querySelector<HTMLElement>(".mic-close")!;
  const backdrop = overlay.querySelector<HTMLElement>(".mic-backdrop")!;

  const MOBILE_SELECTORS = TOOLTIP_SELECTORS;

  function openCard(html: string): void {
    content.innerHTML = html;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("open");
  }

  function closeCard(): void {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  closeBtn.addEventListener("click", closeCard);
  backdrop.addEventListener("click", closeCard);

  document.addEventListener("click", (e) => {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;

    const el = target.closest<HTMLElement>(MOBILE_SELECTORS);
    if (!el) return;
    const html = getTooltipContent(el);
    if (html) openCard(html);
  });
}

function updateClassDesc(): void {
  const cls = (document.querySelector(".class-btn.selected") as HTMLElement | null)?.dataset.class ?? "fighter";
  $("class-desc").textContent = CLASS_DESCS[cls] ?? "";
}

function openPartyClassModal(slotType: string): void {
  const modal = $("party-class-modal");
  const picker = $("party-class-picker");
  const desc = $("party-class-desc");

  // Show/hide guild-unlocked classes
  const guildUpgrades = game ? game.getState().guild_upgrades : {};
  const paladinBtn = document.getElementById("party-class-paladin");
  const rangerBtn = document.getElementById("party-class-ranger");
  const druidBtn = document.getElementById("party-class-druid");
  if (paladinBtn) paladinBtn.hidden = !((guildUpgrades["class_paladin"] ?? 0) > 0);
  if (rangerBtn) rangerBtn.hidden = !((guildUpgrades["class_ranger"] ?? 0) > 0);
  if (druidBtn) druidBtn.hidden = !((guildUpgrades["class_druid"] ?? 0) > 0);

  picker.querySelectorAll(".class-btn").forEach((b) => b.classList.remove("selected"));
  (picker.querySelector(".class-btn:not([hidden])") as HTMLElement)?.classList.add("selected");
  const firstClass = (picker.querySelector(".class-btn:not([hidden])") as HTMLElement)?.dataset.class ?? "fighter";
  desc.textContent = CLASS_DESCS[firstClass] ?? "";

  modal.classList.add("open");

  const confirm = $("party-class-confirm");
  const cancel = $("party-class-cancel");

  const onConfirm = () => {
    const cls = (picker.querySelector(".class-btn.selected") as HTMLElement | null)?.dataset.class ?? "fighter";
    call("buyPrestigeUpgrade", slotType, cls);
    modal.classList.remove("open");
    cleanup();
  };
  const onCancel = () => { modal.classList.remove("open"); cleanup(); };
  const onBackdrop = (e: Event) => { if (e.target === modal) onCancel(); };
  const onPickerClick = (e: Event) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".class-btn");
    if (!btn) return;
    picker.querySelectorAll(".class-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    desc.textContent = CLASS_DESCS[btn.dataset.class ?? "fighter"] ?? "";
  };

  function cleanup() {
    confirm.removeEventListener("click", onConfirm);
    cancel.removeEventListener("click", onCancel);
    modal.removeEventListener("click", onBackdrop);
    picker.removeEventListener("click", onPickerClick);
  }

  confirm.addEventListener("click", onConfirm);
  cancel.addEventListener("click", onCancel);
  modal.addEventListener("click", onBackdrop);
  picker.addEventListener("click", onPickerClick);
}

const CLOUD_SAVE_INTERVAL_MS = 30_000;
let lastCloudSaveAt = 0;

/** Shows the session-conflict warning banner. */
function showSessionConflictBanner(): void {
  $("session-conflict-banner").hidden = false;
}

/** Hides the session-conflict warning banner. */
function hideSessionConflictBanner(): void {
  $("session-conflict-banner").hidden = true;
}

/** Serializes game state to localStorage every tick; writes to DynamoDB at most once per 30 seconds. */
async function saveGame(): Promise<void> {
  if (!game) return;
  const data = game.getLastJson() || game.respond();
  localStorage.setItem(SAVE_KEY, data);
  const token = getStoredToken();
  const now = Date.now();
  if (token && now - lastCloudSaveAt >= CLOUD_SAVE_INTERVAL_MS) {
    lastCloudSaveAt = now;
    const result = await cloudSave(token, data);
    if (result === "conflict") showSessionConflictBanner();
    else if (result === "ok") hideSessionConflictBanner();
  }
}

/** Shows a brief message in the cloud-status element, then hides it after a delay. */
function showCloudStatus(msg: string, isError = false): void {
  const el = document.getElementById("cloud-status-msg");
  if (!el) return;
  el.textContent = msg;
  el.className = `cloud-status ${isError ? "cloud-status-error" : "cloud-status-ok"}`;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 4000);
}

/**
 * Forces this device to become the active save device by resetting the session ID
 * and writing a force-claim save to DynamoDB (bypasses the 409 session lock).
 */
async function setActiveDevice(): Promise<void> {
  const token = getStoredToken();
  if (!token || !game) return;
  const btn = document.getElementById("claim-device-btn") as HTMLButtonElement | null;
  const bannerBtn = document.getElementById("claim-device-banner-btn") as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  if (bannerBtn) bannerBtn.disabled = true;
  try {
    resetSessionId();
    lastCloudSaveAt = Date.now(); // block periodic saves from racing the claim
    const data = game.respond();
    localStorage.setItem(SAVE_KEY, data);
    const result = await cloudClaimSession(token, data, true);
    if (result === "ok") {
      hideSessionConflictBanner();
      showCloudStatus("✓ This device is now the active save device.");
    } else if (result === "conflict") {
      showCloudStatus("⚠ Other device is still active. Close it and try again — the lock expires in up to 90 seconds.", true);
    } else {
      showCloudStatus("✗ Could not reach the server — check your connection.", true);
    }
  } finally {
    if (btn) btn.disabled = false;
    if (bannerBtn) bannerBtn.disabled = false;
  }
}

/** Pulls the latest save from DynamoDB and reloads the page to apply it. */
async function pullCloudSave(): Promise<void> {
  const token = getStoredToken();
  if (!token) return;
  const btn = document.getElementById("pull-save-btn") as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  try {
    const cloudData = await cloudLoad(token);
    if (!cloudData) {
      showCloudStatus("✗ No cloud save found.", true);
      return;
    }
    localStorage.setItem(SAVE_KEY, cloudData);
    showCloudStatus("✓ Cloud save loaded — reloading…");
    setTimeout(() => window.location.reload(), 1200);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/** Reads and parses the save from localStorage; returns null if absent or corrupt. */
function loadSave(): GameStateDict | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameStateDict) : null;
  } catch {
    return null;
  }
}

/** Removes the localStorage save (called before starting a new game). */
function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

/** Shows/hides the sign-in and sign-out UI elements based on whether a valid token is stored. */
function updateAuthUI(): void {
  const token = getStoredToken();
  document.querySelectorAll<HTMLElement>("#cloud-signin-btn").forEach(btn => {
    btn.hidden = !!token;
  });
  const signoutRow = document.getElementById("cloud-signout-row");
  if (signoutRow) signoutRow.hidden = !token;
}

/** Returns a human-readable summary of a save for the conflict modal. */
function saveConflictStats(d: GameStateDict): string {
  const kills = (d.lifetime_kills as number) ?? 0;
  const best = (d.lifetime_best_level as number) ?? 1;
  const prestiges = (d.total_prestiges as number) ?? 0;
  return `Floor ${best} reached<br>${kills.toLocaleString()} lifetime kills<br>${prestiges} town return${prestiges !== 1 ? "s" : ""}`;
}

/** Shows the save-conflict modal and resolves with the chosen save JSON string. */
function promptSaveConflict(localRaw: string, cloudRaw: string): Promise<string> {
  const localDict = JSON.parse(localRaw) as GameStateDict;
  const cloudDict = JSON.parse(cloudRaw) as GameStateDict;
  $("conflict-local-stats").innerHTML = saveConflictStats(localDict);
  $("conflict-cloud-stats").innerHTML = saveConflictStats(cloudDict);
  $("save-conflict-modal").classList.add("open");
  return new Promise(resolve => {
    document.getElementById("conflict-use-local")!.onclick = () => {
      $("save-conflict-modal").classList.remove("open");
      resolve(localRaw);
    };
    document.getElementById("conflict-use-cloud")!.onclick = () => {
      $("save-conflict-modal").classList.remove("open");
      resolve(cloudRaw);
    };
  });
}

/** Handles the Cognito redirect hash, updates auth UI, and attempts to load save data from the cloud. */
async function initAuth(): Promise<GameStateDict | null> {
  getOrCreateSessionId(); // ensure session ID exists before first save
  // Coming back from Google sign-in — hash contains the token
  const parsed = parseAuthHash(window.location.hash);
  if (parsed) {
    storeToken(parsed.token, parsed.expiry);
    history.replaceState(null, "", window.location.pathname);
  }

  const token = getStoredToken();
  updateAuthUI();
  if (!token) return null;

  const cloudRaw = await cloudLoad(token);
  if (!cloudRaw) return null;

  try {
    const cloudDict = JSON.parse(cloudRaw) as GameStateDict;
    const localRaw = localStorage.getItem(SAVE_KEY);
    const localDict: GameStateDict | null = localRaw ? JSON.parse(localRaw) as GameStateDict : null;

    let chosenRaw = cloudRaw;

    if (localDict && localDict.run_id && cloudDict.run_id && localDict.run_id !== cloudDict.run_id) {
      // Different runs — ask the user
      chosenRaw = await promptSaveConflict(localRaw!, cloudRaw);
    } else if (localDict) {
      // Same run (or old save without run_id) — silently use whichever has more progress
      const localKills = (localDict.lifetime_kills as number) ?? 0;
      const cloudKills = (cloudDict.lifetime_kills as number) ?? 0;
      if (localKills > cloudKills) chosenRaw = localRaw!;
    }

    localStorage.setItem(SAVE_KEY, chosenRaw);
    return JSON.parse(chosenRaw) as GameStateDict;
  } catch {
    return null;
  }
}

/** Creates a fresh GameState, clears any existing save, and starts the 100ms game loop. */
function startGame(name: string, characterClass: string): void {
  $("creation-overlay").style.display = "none";
  switchLeftColSub("party");
  if (game?.needsHeroCreation) {
    const json = game.createHeroAfterRetirement(name, characterClass);
    render(JSON.parse(json));
  } else {
    deleteSave();
    game = new GameState(name, characterClass);
    render(JSON.parse(game.respond()));
  }
  clearInterval(gameLoopId);
  gameLoopId = setInterval(() => { call("tick", 0.1); }, 100);
  applyAutoAttackState();
}

/** Restores a GameState from a saved snapshot, hides the creation overlay, and starts the game loop. */
function continueGame(saved: GameStateDict): void {
  if (saved.needs_hero_creation) {
    game = GameState.fromDict(saved);
    showCreationOverlayForRetirement(saved);
    render(JSON.parse(game.respond()));
    return;
  }
  $("creation-overlay").style.display = "none";
  game = GameState.fromDict(saved);

  if (saved.saved_at && saved.saved_at > 0) {
    const elapsedMs = Date.now() - saved.saved_at;
    const earned = game.applyOfflineProgress(elapsedMs);
    if (earned >= 1) {
      const mins = Math.round(elapsedMs / 60_000);
      const timeStr = mins >= 60
        ? `${Math.floor(mins / 60)}h ${mins % 60}m`
        : `${mins}m`;
      game.log.push(`Welcome back! Earned ${Math.floor(earned).toLocaleString()} gold while away (${timeStr}).`);
    }
  }

  render(JSON.parse(game.respond()));
  clearInterval(gameLoopId);
  gameLoopId = setInterval(() => { call("tick", 0.1); }, 100);
  applyAutoAttackState();
}

function isAutoAttackUnlocked(): boolean {
  if (!game) return false;
  const state = JSON.parse(game.respond()) as GameStateDict;
  return ((state.guild_upgrades)["auto_attack"] ?? 0) >= 1;
}

function updateAutoAttackButton(): void {
  const btn = document.getElementById("auto-attack-btn") as HTMLButtonElement | null;
  if (!btn) return;
  const unlocked = isAutoAttackUnlocked();
  btn.disabled = !unlocked;
  btn.title = unlocked ? "Toggle auto-attack (fires every second)" : "Unlock Auto-Attack in the Guild Hall";
  btn.innerHTML = autoAttackEnabled && unlocked ? `${spr("⚔")} AUTO ON` : `${spr("⚔")} AUTO`;
  btn.classList.toggle("active", autoAttackEnabled && unlocked);
  if (!unlocked && autoAttackEnabled) {
    autoAttackEnabled = false;
    localStorage.setItem("autoAttack", "0");
    clearInterval(autoAttackIntervalId);
    autoAttackIntervalId = undefined;
  }
}

function applyAutoAttackState(): void {
  updateAutoAttackButton();
  clearInterval(autoAttackIntervalId);
  autoAttackIntervalId = autoAttackEnabled && isAutoAttackUnlocked()
    ? setInterval(() => { if (game) call("click", true); }, 1000) as unknown as number
    : undefined;
}

function initPartyGearToggle(): void {
  const panel = $("party-panel");
  const btn = $("party-gear-toggle");
  const hidden = localStorage.getItem("party-gear-hidden") === "1";
  if (hidden) { panel.classList.add("gear-hidden"); btn.classList.add("active"); }
  btn.addEventListener("click", () => {
    const nowHidden = panel.classList.toggle("gear-hidden");
    btn.classList.toggle("active", nowHidden);
    localStorage.setItem("party-gear-hidden", nowHidden ? "1" : "0");
  });
}

function initPartyPanelTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>(".ptab-btn");
  const cardsEl = $("party-cards");
  const runeEl = $("party-rune-panel");
  const artEl = $("party-artifact-panel");
  const gearToggle = $("party-gear-toggle");

  switchPartyTab = (which: string) => {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.ptab === which));
    cardsEl.hidden = which !== "party";
    runeEl.hidden = which !== "runes";
    artEl.hidden = which !== "artifacts";
    gearToggle.hidden = which !== "party";
  };

  tabs.forEach(tab => {
    tab.addEventListener("click", () => switchPartyTab(tab.dataset.ptab!));
  });
}

function initLeftColSubTabs(): void {
  const bar = document.getElementById("left-col-subtabs")!;
  const mainEl = document.querySelector("main")!;
  const saved = localStorage.getItem("left-col-sub") ?? "party";

  function switchSub(which: string): void {
    bar.querySelectorAll<HTMLElement>(".lcol-stab").forEach(b =>
      b.classList.toggle("active", b.dataset.lcolStab === which)
    );
    mainEl.dataset.leftSub = which;
    localStorage.setItem("left-col-sub", which);
  }

  bar.querySelectorAll<HTMLElement>(".lcol-stab").forEach(btn =>
    btn.addEventListener("click", () => switchSub(btn.dataset.lcolStab!))
  );

  switchLeftColSub = switchSub;
  switchSub(saved);
}

function initSaveBackup(): void {
  const exportBtn  = document.getElementById("export-save-btn")!;
  const importBtn  = document.getElementById("import-save-btn")!;
  const fileInput  = document.getElementById("import-save-input") as HTMLInputElement;
  const statusEl   = document.getElementById("import-save-msg")!;

  function showImportStatus(msg: string, isError: boolean): void {
    statusEl.textContent = msg;
    statusEl.className = `cloud-status ${isError ? "cloud-status-error" : "cloud-status-ok"}`;
    statusEl.hidden = false;
    setTimeout(() => { statusEl.hidden = true; }, 4000);
  }

  exportBtn.addEventListener("click", () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { showImportStatus("No save found to export.", true); return; }
    const blob = new Blob([raw], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `toddpocalypse-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = reader.result as string;
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (typeof parsed.dungeon_level !== "number" || !Array.isArray(parsed.party)) {
          showImportStatus("Invalid save file.", true);
          return;
        }
        localStorage.setItem(SAVE_KEY, raw);
        showImportStatus("Save imported — reloading…", false);
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        showImportStatus("Could not read file.", true);
      } finally {
        fileInput.value = "";
      }
    };
    reader.readAsText(file);
  });
}

function initHeaderHeightVar(): void {
  const hdr = document.querySelector("header") as HTMLElement;
  const update = () => document.documentElement.style.setProperty("--header-h", hdr.offsetHeight + "px");
  update();
  new ResizeObserver(update).observe(hdr);
}

function initEnemySticky(): void {
  const hdr = document.querySelector("header") as HTMLElement;
  const enemyPanel = document.getElementById("enemy-panel");
  if (!enemyPanel) return;

  function update() {
    const rect = enemyPanel!.getBoundingClientRect();
    hdr.classList.toggle("enemy-scrolled", rect.bottom <= hdr.offsetHeight);
  }

  window.addEventListener("scroll", update, { passive: true });
  document.querySelector("main")?.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

document.addEventListener("DOMContentLoaded", () => {
  preloadBossAssets();
  initTheme();
  initHeaderHeightVar();
  initEnemySticky();
  initSaveBackup();
  initCombatSubTabs();
  initMobileTabs();
  initRuneSlotPanel();
  initConstellationPanel();
  initLeftColSubTabs();
  initSidebarTabs();
  initLootSubtabs();
  initItemTooltip();
  initMobileItemCard();
  initPartyGearToggle();
  initPartyPanelTabs();

  document.getElementById("theme-picker")?.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".theme-btn");
    if (!btn || btn.classList.contains("locked")) return;
    if (btn.dataset.theme) {
      applyTheme(btn.dataset.theme as Theme);
      themePickerKey = ""; // force re-render to update active state
      if (game) render(game.toDict());
    }
  });

  $("loot-items").addEventListener("mouseover", (e) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(".loot-item");
    const slot = item?.dataset.slot ?? null;
    if (slot === hoveredLootSlot) return;
    hoveredLootSlot = slot;
    applySlotHighlight();
  });
  $("loot-items").addEventListener("mouseleave", () => {
    if (hoveredLootSlot === null) return;
    hoveredLootSlot = null;
    applySlotHighlight();
  });

  const openStats = () => { $("stats-modal").classList.add("open"); };
  $("stats-btn").addEventListener("click", openStats);
  $("stats-close").addEventListener("click", () => { $("stats-modal").classList.remove("open"); });
  $("stats-modal").addEventListener("click", (e) => {
    if (e.target === $("stats-modal")) $("stats-modal").classList.remove("open");
  });

  $("version-btn").textContent = VERSION;

  $("changelog-body").innerHTML = CHANGELOG.map(entry => `
    <div class="cl-entry">
      <div class="cl-version">${entry.version}</div>
      <div class="cl-date">${entry.date}</div>
      <ul class="cl-changes">
        ${entry.changes.map(c => `<li>${c}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  const openChangelog = () => { $("changelog-modal").classList.add("open"); };
  $("version-btn").addEventListener("click", openChangelog);
  $("mobile-changelog-btn").addEventListener("click", openChangelog);
  $("changelog-close").addEventListener("click", () => {
    $("changelog-modal").classList.remove("open");
  });
  $("changelog-modal").addEventListener("click", (e) => {
    if (e.target === $("changelog-modal")) $("changelog-modal").classList.remove("open");
  });

  $("hard-reset-btn").addEventListener("click", () => {
    $("hard-reset-confirm").hidden = false;
    $("hard-reset-btn").hidden = true;
  });
  $("hard-reset-no").addEventListener("click", () => {
    $("hard-reset-confirm").hidden = true;
    $("hard-reset-btn").hidden = false;
  });
  $("hard-reset-yes").addEventListener("click", async () => {
    const token = getStoredToken();
    if (token) {
      const btn = $("hard-reset-yes") as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = "Clearing cloud…";
      const freshData = new GameState().respond();
      const result = await cloudClaimSession(token, freshData, true);
      if (result === "error") {
        btn.disabled = false;
        btn.textContent = "Yes, reset everything";
        showCloudStatus("✗ Could not clear cloud save — check your connection and try again.", true);
        return;
      }
    }
    deleteSave();
    window.location.reload();
  });

  $("drop-chart-btn").addEventListener("click", () => {
    const level = game ? game.dungeonLevel : 1;
    renderDropChart(level);
    $("drop-chart-modal").classList.add("open");
  });
  $("drop-chart-close").addEventListener("click", () => {
    $("drop-chart-modal").classList.remove("open");
  });
  $("drop-chart-modal").addEventListener("click", (e) => {
    if (e.target === $("drop-chart-modal")) $("drop-chart-modal").classList.remove("open");
  });

  // Wire up cloud auth UI — two sign-in buttons share the same id (creation overlay + settings)
  document.querySelectorAll<HTMLElement>("#cloud-signin-btn").forEach(btn => {
    btn.addEventListener("click", () => { window.location.href = getLoginUrl(); });
  });
  document.getElementById("cloud-signout-btn")?.addEventListener("click", () => {
    clearToken();
    updateAuthUI();
  });
  document.getElementById("pull-save-btn")?.addEventListener("click", () => { pullCloudSave(); });
  document.getElementById("claim-device-btn")?.addEventListener("click", () => { setActiveDevice(); });
  document.getElementById("claim-device-banner-btn")?.addEventListener("click", () => { setActiveDevice(); });

  // Auth → cloud load → local load → new game
  initAuth().then(cloudSaved => {
    const saved = cloudSaved ?? loadSave();
    if (saved) {
      continueGame(saved);
    } else {
      $("save-section").style.display = "none";
      $("new-game-section").style.display = "flex";
      $("creation-overlay").style.display = "flex";
      updateClassDesc();
    }
  });

  $("class-picker").addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".class-btn");
    if (!btn || btn.disabled) return;
    document.querySelectorAll(".class-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    updateClassDesc();
  });

  $("start-btn").addEventListener("click", () => {
    const raw = ($("char-name-input") as HTMLInputElement).value.trim();
    const name = raw || "Hero";
    const cls = (document.querySelector(".class-btn.selected") as HTMLElement | null)?.dataset.class ?? "fighter";
    startGame(name, cls);
  });

  ($("char-name-input") as HTMLInputElement).addEventListener("keydown", (e) => {
    if (e.key === "Enter") ($("start-btn") as HTMLButtonElement).click();
  });

  document.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!btn || !game) return;
    const action = btn.dataset.action;
    const idx = btn.dataset.idx ? parseInt(btn.dataset.idx, 10) : -1;
    if (action === "toggle-auto-action") call("toggleAutoAction", btn.dataset.type!);
    else if (action === "equip") call("equipLoot", idx);
    else if (action === "equip-loot-on-char") {
      const row = btn.closest(".gear-row-equip")!;
      const sel = row.querySelector(".gear-loot-select") as HTMLSelectElement;
      call("equipLootOnChar", parseInt(btn.dataset.char!, 10), parseInt(sel.value, 10));
    }
    else if (action === "unequip-gear") call("unequipGear", parseInt(btn.dataset.char!, 10), btn.dataset.slot!);
    else if (action === "toggle-gear-lock") call("toggleGearLock", parseInt(btn.dataset.char!, 10), btn.dataset.slot!);
    else if (action === "gear-slot-click") {
      const charIdx = parseInt(btn.dataset.charIdx!, 10);
      const slot = btn.dataset.slot!;
      if (game) {
        const st = JSON.parse(game.respond()) as GameStateDict;
        const item = (st.party[charIdx]?.equipment as Record<string, GearItemDict | null> | undefined)?.[slot];
        if (item) openGearSlotModal(charIdx, slot, st);
        else openGearLootPicker(charIdx, slot, st);
      }
    }
    else if (action === "gear-slot-unequip") {
      call("unequipGear", parseInt(btn.dataset.charIdx!, 10), btn.dataset.slot!);
      closeGearSlotModal();
    }
    else if (action === "gear-slot-lock") {
      call("toggleGearLock", parseInt(btn.dataset.charIdx!, 10), btn.dataset.slot!);
      closeGearSlotModal();
    }
    else if (action === "gear-loot-pick-equip") {
      call("equipLootOnChar", parseInt(btn.dataset.charIdx!, 10), parseInt(btn.dataset.invIdx!, 10));
      closeGearLootPicker();
    }
    else if (action === "equip-from-stash") {
      const row = btn.closest(".stash-item")!;
      const sel = row.querySelector(".stash-char-select") as HTMLSelectElement | HTMLInputElement;
      call("equipFromStash", parseInt(sel.value, 10), parseInt(btn.dataset.stashIdx!, 10));
    }
    else if (action === "sell-from-stash") call("sellFromStash", parseInt(btn.dataset.stashIdx!, 10));
    else if (action === "stash-loot") call("stashLoot", idx);
    else if (action === "sell") call("sellLoot", idx);
    else if (action === "upgrade") call("buyUpgrade", btn.dataset.char!, btn.dataset.type!);
    else if (action === "attack") call("click", true);
    else if (action === "toggle-auto-attack") {
      autoAttackEnabled = !autoAttackEnabled;
      localStorage.setItem("autoAttack", autoAttackEnabled ? "1" : "0");
      applyAutoAttackState();
    }
    else if (action === "equip-all") call("equipAll");
    else if (action === "sell-all") call("sellAll");
    else if (action === "prestige") {
      if (!game) return;
      const pts = game.prestigePointsPreview();
      if (confirm(`Return to Town? You will earn ${pts} renown.\n\nThe dungeon shifts while you rest — its passages rearrange and your hard-won knowledge of the depths fades. Expedition upgrades and progress will be lost.`)) {
        call("prestige");
        showHomecomingToast(pts);
      }
    }
    else if (action === "buy-prestige") {
      const type = btn.dataset.type!;
      if (!type) return;
      if (type.startsWith("party_slot_")) {
        openPartyClassModal(type);
      } else {
        call("buyPrestigeUpgrade", type);
      }
    }
    else if (action === "toggle-auto-prestige") {
      if (!game) return;
      const state = JSON.parse(game.respond()) as GameStateDict;
      const enabled = !(state.auto_prestige_enabled ?? false);
      const threshold = state.auto_prestige_threshold ?? 5;
      const json = game.setAutoPrestige(enabled, threshold);
      render(JSON.parse(json) as GameStateDict);
    }
    else if (action === "set-auto-prestige-threshold") {
      // handled on change event below
    }
    else if (action === "buy-guild") {
      call("buyGuildUpgrade", btn.dataset.type!);
    }
    else if (action === "activate-skill") {
      if (!game) return;
      const state = JSON.parse(game.respond()) as GameStateDict;
      if (state.skill_available) call("activateSkill", state.skill_available);
    }
    else if (action === "activate-companion-skill") {
      if (btn.dataset.skill) call("activateSkill", btn.dataset.skill);
    }
    else if (action === "toggle-auto-skill") {
      call("toggleAutoSkill");
    }
    else if (action === "venture") {
      if (confirm("Venture to a new dungeon? Your companions will stay behind and earn gold. You start fresh with just your class.")) {
        call("venture");
      }
    }
    else if (action === "toggle-auto-sell") {
      call("toggleAutoSellQuality", btn.dataset.quality!);
    }
    else if (action === "brand-rune") {
      const runeId = btn.dataset.runeId!;
      const row = btn.closest(".rune-item")!;
      const charIdx = parseInt((row.querySelector(".rune-char-select") as HTMLSelectElement).value, 10);
      const slot = (row.querySelector(".rune-slot-select") as HTMLSelectElement).value;
      call("brandRune", charIdx, slot, runeId);
    }
    else if (action === "combine-runes") {
      const row = btn.closest(".rune-combine-section")!;
      const sel = row.querySelector(".rune-combine-select") as HTMLSelectElement;
      const [id1, id2] = sel.value.split("|");
      call("combineRunes", id1, id2);
    }
    else if (action === "combine-all-runes") {
      call("combineAllRunes");
    }
    else if (action === "sell-rune") {
      call("sellRune", parseInt(btn.dataset.runeIdx!, 10));
    }
    else if (action === "sell-all-runes") {
      call("sellAllRunes");
    }
    else if (action === "forge-artifact-from-runes") {
      call("forgeArtifactFromRunes");
    }
    else if (action === "open-artifact-modal") {
      if (game) openArtifactModal(parseInt(btn.dataset.invIdx!, 10), JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "open-equipped-artifact-modal") {
      if (game) openEquippedArtifactModal(parseInt(btn.dataset.charIdx!, 10), parseInt(btn.dataset.slotIdx!, 10), JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "open-art-slot-picker") {
      if (game) openArtifactSlotPicker(parseInt(btn.dataset.charIdx!, 10), parseInt(btn.dataset.slotIdx!, 10), JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "asp-equip") {
      const invIdx = parseInt(btn.dataset.invIdx!, 10);
      if (game && aspCharIdx >= 0) {
        call("equipArtifact", aspCharIdx, aspSlotIdx, invIdx);
        closeArtifactSlotPicker();
      }
    }
    else if (action === "close-artifact-slot-picker") {
      closeArtifactSlotPicker();
    }
    else if (action === "unlock-node") {
      const nodeId = btn.dataset.nodeId;
      if (nodeId) { call("unlockConstellationNode", nodeId); closeConstellationNodeModal(); }
    }
    else if (action === "modal-switch-artifact") {
      const charIdx = parseInt(btn.dataset.charIdx!, 10);
      const slotIdx = parseInt(btn.dataset.slotIdx!, 10);
      closeArtifactModal();
      if (game) openArtifactSlotPicker(charIdx, slotIdx, JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "modal-unequip-artifact") {
      call("unequipArtifact", parseInt(btn.dataset.charIdx!, 10), parseInt(btn.dataset.slotIdx!, 10));
      closeArtifactModal();
    }
    else if (action === "close-artifact-modal") {
      closeArtifactModal();
    }
    else if (action === "modal-add-fuel-artifact") {
      const targetIdx = parseInt(btn.dataset.invIdx!, 10);
      const fuelIdxs = [...artifactModalFuelSelected];
      artifactModalFuelSelected = new Set();
      call("addFuelToArtifact", targetIdx, fuelIdxs);
    }
    else if (action === "modal-add-fuel-equipped-artifact") {
      const charIdx = parseInt(btn.dataset.charIdx!, 10);
      const slotIdx = parseInt(btn.dataset.slotIdx!, 10);
      const fuelIdxs = [...artifactModalFuelSelected];
      artifactModalFuelSelected = new Set();
      call("addFuelToEquippedArtifact", charIdx, slotIdx, fuelIdxs);
    }
    else if (action === "modal-sell-equipped-artifact") {
      call("sellEquippedArtifact", parseInt(btn.dataset.charIdx!, 10), parseInt(btn.dataset.slotIdx!, 10));
      closeArtifactModal();
    }
    else if (action === "equip-artifact") {
      const invIdx = parseInt(btn.dataset.invIdx!, 10);
      const container = btn.closest(".amodal-equip-row, .artifact-inv-row")!;
      const sel = container.querySelector(".artifact-char-slot-select") as HTMLSelectElement;
      if (sel && sel.value) {
        const [charIdx, slotIdx] = sel.value.split(":").map(Number);
        call("equipArtifact", charIdx, slotIdx, invIdx);
        closeArtifactModal();
      }
    }
    else if (action === "unequip-artifact") {
      call("unequipArtifact", parseInt(btn.dataset.charIdx!, 10), parseInt(btn.dataset.slotIdx!, 10));
    }
    else if (action === "sell-artifact") {
      call("sellArtifact", parseInt(btn.dataset.invIdx!, 10));
      if (artifactModalArtId) closeArtifactModal();
    }
    else if (action === "set-title") {
      call("setEarnedTitle", btn.dataset.title ?? "");
      if (game) renderCustomizeModal(JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "feats-filter") {
      featsFilter = (btn.dataset.filter as "all" | "in_progress" | "completed") ?? "all";
      featsKey = "";
      featsFilterKey = "";
      if (game) renderFeats(JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "open-profile-picker") {
      profilePickerOpen = !profilePickerOpen;
      profileWidgetKey = "";
      if (game) {
        const s = JSON.parse(game.respond()) as GameStateDict;
        renderProfileWidget(s);
        if (profilePickerOpen) updateProfileDropdownStats(s);
      }
    }
    else if (action === "open-customize-modal") {
      profilePickerOpen = false;
      profileWidgetKey = "";
      if (game) renderProfileWidget(JSON.parse(game.respond()) as GameStateDict);
      $("customize-modal").classList.add("open");
      if (game) renderCustomizeModal(JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "open-settings-modal") {
      profilePickerOpen = false;
      profileWidgetKey = "";
      if (game) renderProfileWidget(JSON.parse(game.respond()) as GameStateDict);
      openSettings();
    }
    else if (action === "open-about-modal") {
      profilePickerOpen = false;
      profileWidgetKey = "";
      if (game) renderProfileWidget(JSON.parse(game.respond()) as GameStateDict);
      $("about-modal").classList.add("open");
    }
    else if (action === "open-stats-modal") {
      $("stats-modal").classList.add("open");
    }
    else if (action === "open-hall-of-fame-modal") {
      profilePickerOpen = false;
      profileWidgetKey = "";
      if (game) {
        const state = JSON.parse(game.respond()) as GameStateDict;
        renderProfileWidget(state);
        renderHallOfFame(state.retired_heroes ?? []);
      }
      $("hall-of-fame-modal").classList.add("open");
    }
    else if (action === "retire-hero") {
      if (!game) return;
      const state = JSON.parse(game.respond()) as GameStateDict;
      profilePickerOpen = false;
      profileWidgetKey = "";
      renderProfileWidget(state);
      renderRetireConfirm(state);
      $("retire-confirm-modal").classList.add("open");
    }
    else if (action === "profile-tab") {
      profilePickerTab = (btn.dataset.tab as "avatar" | "border" | "title") ?? "avatar";
      if (game) renderCustomizeModal(JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "set-avatar") {
      call("setAvatar", btn.dataset.avatarId!);
      if (game) renderCustomizeModal(JSON.parse(game.respond()) as GameStateDict);
    }
    else if (action === "set-border") {
      call("setBorder", btn.dataset.borderId!);
      if (game) renderCustomizeModal(JSON.parse(game.respond()) as GameStateDict);
    }
  });

  // Settings modal
  function openSettings(): void { $("settings-modal").classList.add("open"); }
  function closeSettings(): void { $("settings-modal").classList.remove("open"); }
  $("settings-modal-close").addEventListener("click", closeSettings);
  $("settings-modal").addEventListener("click", (e) => { if (e.target === $("settings-modal")) closeSettings(); });
  document.getElementById("mobile-settings-tab-btn")?.addEventListener("click", openSettings);

  // Customize modal
  $("customize-modal-close").addEventListener("click", () => $("customize-modal").classList.remove("open"));
  $("customize-modal").addEventListener("click", (e) => { if (e.target === $("customize-modal")) $("customize-modal").classList.remove("open"); });

  // About modal
  $("about-modal-close").addEventListener("click", () => $("about-modal").classList.remove("open"));
  $("about-modal").addEventListener("click", (e) => { if (e.target === $("about-modal")) $("about-modal").classList.remove("open"); });

  // Hall of Fame modal
  $("hall-of-fame-close").addEventListener("click", () => $("hall-of-fame-modal").classList.remove("open"));
  $("hall-of-fame-modal").addEventListener("click", (e) => { if (e.target === $("hall-of-fame-modal")) $("hall-of-fame-modal").classList.remove("open"); });

  // Retire confirmation modal
  $("retire-confirm-close").addEventListener("click", () => $("retire-confirm-modal").classList.remove("open"));
  $("retire-confirm-cancel").addEventListener("click", () => $("retire-confirm-modal").classList.remove("open"));
  $("retire-confirm-modal").addEventListener("click", (e) => { if (e.target === $("retire-confirm-modal")) $("retire-confirm-modal").classList.remove("open"); });
  $("retire-confirm-yes").addEventListener("click", () => {
    if (!game) return;
    $("retire-confirm-modal").classList.remove("open");
    const json = game.retireHero();
    const state = JSON.parse(json) as GameStateDict;
    localStorage.setItem(SAVE_KEY, json);
    clearInterval(gameLoopId);
    showCreationOverlayForRetirement(state);
    render(state);
  });

  // Combat log history modal
  document.getElementById("log-history-btn")?.addEventListener("click", () => {
    const body = $("log-history-body");
    body.innerHTML = [...fullLog].reverse().map(l => `<div class="log-line">${l}</div>`).join("") || `<div class="log-line" style="color:var(--muted)">No history yet.</div>`;
    $("log-history-modal").classList.add("open");
  });
  document.getElementById("log-history-close")?.addEventListener("click", () => {
    $("log-history-modal").classList.remove("open");
  });
  document.getElementById("log-history-modal")?.addEventListener("click", (e) => {
    if (e.target === $("log-history-modal")) $("log-history-modal").classList.remove("open");
  });

  // Close profile picker when clicking outside the header avatar area.
  // Use composedPath() so the check survives innerHTML mutations that detach the clicked node.
  document.addEventListener("click", (e) => {
    if (profilePickerOpen && !e.composedPath().some(el => (el as Element).id === "header-avatar-area")) {
      profilePickerOpen = false;
      profileWidgetKey = "";
      if (game) renderProfileWidget(JSON.parse(game.respond()) as GameStateDict);
    }
  });

  // Auto-prestige threshold input (delegated change)
  document.addEventListener("change", (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>(".prestige-auto-threshold");
    if (!input || !game) return;
    const state = JSON.parse(game.respond()) as GameStateDict;
    const threshold = Math.max(1, parseInt(input.value, 10) || 1);
    const enabled = state.auto_prestige_enabled ?? false;
    const json = game.setAutoPrestige(enabled, threshold);
    render(JSON.parse(json) as GameStateDict);
  });

  document.getElementById("artifact-detail-close")?.addEventListener("click", closeArtifactModal);
  document.getElementById("artifact-detail-modal")?.addEventListener("click", (e) => {
    if (e.target === $("artifact-detail-modal")) closeArtifactModal();
  });

  document.getElementById("gear-slot-modal-close")?.addEventListener("click", closeGearSlotModal);
  document.getElementById("gear-slot-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("gear-slot-modal")) closeGearSlotModal();
  });
  document.getElementById("gear-loot-picker-close")?.addEventListener("click", closeGearLootPicker);
  document.getElementById("gear-loot-picker-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("gear-loot-picker-modal")) closeGearLootPicker();
  });

  document.getElementById("asp-close")?.addEventListener("click", closeArtifactSlotPicker);
  document.getElementById("artifact-slot-pick-modal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("artifact-slot-pick-modal")) closeArtifactSlotPicker();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (!game) return;
    if ((e.target as HTMLElement).closest("input, textarea, select")) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); call("click"); }
    else if (e.key === "e" || e.key === "E") call("equipAll");
    else if (e.key === "x" || e.key === "X") call("sellAll");
    else if (e.key === "s" || e.key === "S") {
      const state = JSON.parse(game.respond()) as GameStateDict;
      if (state.skill_available) call("activateSkill", state.skill_available);
    }
  });
});

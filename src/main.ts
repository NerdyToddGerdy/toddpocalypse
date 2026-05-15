import { GameState, type GameStateDict, VENTURE_UNLOCK_LEVEL, ventureUnlockLevel, PRESTIGE_UNLOCK_LEVEL, GUILD_HALL_COSTS, SKILL_DEFS, prestigeUpgradeCost, THEME_UNLOCKS, ACHIEVEMENTS, RUNE_DEFS, type AchievementUnlock } from "./engine.js";
import { qualityClass, autoSellThreshold, QUAL, qualityWeights, QUALITY_CLASSES, gearPower, type GearStats, type GearItemDict } from "./gear.js";
import { VERSION, CHANGELOG } from "./changelog.js";
import { CLASS_ABILITIES } from "./character.js";
import { parseAuthHash, getStoredToken, storeToken, clearToken, getLoginUrl, cloudLoad, cloudSave, cloudClaimSession, resetSessionId, getOrCreateSessionId } from "./cloud.js";

const HERO_IMG: Record<string, string> = {
  fighter: "hero_fighter.png",
  rogue:   "hero_rogue.png",
  mage:    "hero_mage.png",
  paladin: "hero_paladin.png",
  ranger:  "hero_ranger.png",
};

const CLASS_DESCS: Record<string, string> = {
  fighter: "Highest idle DPS. Each level-up multiplies damage by 1.2×.",
  rogue: "Gains +0.3 click damage every level. Rewards active play.",
  mage: "Gains +5% XP rate every level. Slow start, fast late-game.",
  paladin: "Tank/healer. 25% damage reduction at Lv5, heals party on kill at Lv10.",
  ranger: "Gains +0.2 click damage every level. 30% crit chance at Lv5, +60% DPS at Lv10.",
};

const GUILD_HALL_META: Record<string, { icon: string; name: string; desc: string; dungeonReq?: number }> = {
  companion_hall:      { icon: "🏰", name: "Companion Hall",   desc: "Unlock Party Slot IV (stack 1) and Slot V (stack 2) in the Prestige Shop." },
  expanded_armory:     { icon: "🗄", name: "Expanded Armory",  desc: "+2 loot chest capacity per stack (max 14)." },
  class_paladin:       { icon: "🛡", name: "Recruit: Paladin", desc: "Unlock Paladin as a recruitable class for companions." },
  class_ranger:        { icon: "🏹", name: "Recruit: Ranger",  desc: "Unlock Ranger as a recruitable class for companions." },
  skill_battle_cry:    { icon: "📯", name: "Battle Cry",       desc: "Fighter: ×2 party DPS for 5 kills. 30-kill cooldown." },
  skill_shadow_strike: { icon: "🌑", name: "Shadow Strike",    desc: "Rogue: ×5 click damage for 3 kills. 15-kill cooldown." },
  skill_arcane_surge:  { icon: "⚡", name: "Arcane Surge",     desc: "Mage: ×3 DPS for 5 kills. 25-kill cooldown." },
  skill_consecrate:    { icon: "✝", name: "Consecrate",       desc: "Paladin: heals party 25% max HP per kill for 5 kills. 20-kill cooldown.", dungeonReq: 1 },
  skill_volley:        { icon: "🏹", name: "Volley",           desc: "Ranger: ×4 party DPS for 4 kills. 20-kill cooldown.", dungeonReq: 1 },
  rune_forge:          { icon: "🔮", name: "Rune Forge",       desc: "Socket runes into gear slots for flat stat bonuses. Tier 2: recover replaced runes. Tier 3: combine 2 lessers into a greater." },
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

/** Loads the persisted theme from localStorage (defaulting to "arcane") and applies it. */
function initTheme(): void {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme((THEMES.includes(saved as Theme) ? saved : "arcane") as Theme);
}

let game: GameState | null = null;
let lootKey: string | null = null;
let autoSellKey: string | null = null;
let upgradeKey: string | null = null;
let partyKey: string | null = null;
let prestigeKey: string | null = null;
let ventureKey: string | null = null;
let guildKey: string | null = null;
let skillKey: string | null = null;
let companionSkillKey: string | null = null;
let hoveredLootSlot: string | null = null;
let lootFilterActive = false;
const fullLog: string[] = []; // persistent combat log history (last 200 entries)
const flashStartTimes = new Map<string, number>(); // "ci:slot" → ms timestamp when flash began
let bossPortraitShowing = false;

/** Typed getElementById helper — throws if the element is missing rather than returning null. */
function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el;
}

/** Invokes a GameState method, re-renders with the returned JSON, and auto-saves. */
function call<K extends keyof GameState>(method: K, ...args: any[]): void {
  if (!game) return;
  try {
    const fn = game[method] as unknown as (...a: any[]) => string;
    const json = fn.apply(game, args);
    render(JSON.parse(json) as GameStateDict);
    saveGame();
  } catch (e: any) {
    appendLog("⚠ " + (e?.message ?? String(e)));
    console.error(method, e);
  }
}

import { KILLS_PER_LEVEL, killsForFloor } from "./engine.js";

/** Full re-render of all UI panels from a GameStateDict snapshot. */
function render(state: GameStateDict): void {
  const enemy = state.enemy;
  $("enemy-name").textContent = enemy.name;
  $("enemy-level").textContent = `Level ${enemy.level}`;
  const portraitWrap = document.getElementById("monster-portrait-wrap")!;
  if (enemy.is_boss && !bossPortraitShowing) {
    bossPortraitShowing = true;
    const eWords = enemy.name.split(" ");
    ($("monster-portrait") as HTMLImageElement).src = `monster_${eWords[2].toLowerCase()}.png`;
    ($("monster-border") as HTMLImageElement).src   = `border_${eWords[1].toLowerCase()}.png`;
    portraitWrap.classList.remove("boss-exiting");
    void portraitWrap.offsetWidth; // flush pending transitions
    portraitWrap.classList.add("boss-visible", "boss-entering");
    setTimeout(() => portraitWrap.classList.remove("boss-entering"), 750);
  } else if (!enemy.is_boss && bossPortraitShowing) {
    bossPortraitShowing = false;
    portraitWrap.classList.add("boss-exiting");
    // wait for collapse animation, then shrink the width
    setTimeout(() => {
      portraitWrap.classList.remove("boss-visible");
      setTimeout(() => portraitWrap.classList.remove("boss-exiting"), 600);
    }, 380);
  }
  const pct = Math.max(0, (enemy.hp / enemy.max_hp) * 100);
  ($("enemy-hp-bar") as HTMLElement).style.width = pct + "%";
  $("enemy-hp-text").textContent = `${Math.ceil(enemy.hp)} / ${enemy.max_hp}`;

  $("stat-gold").textContent = String(Math.floor(state.gold));
  $("stat-dungeon-num").textContent = String(state.dungeon_index + 1);
  $("stat-level").textContent = String(state.dungeon_level);
  $("stat-best").textContent = String(state.highest_level);
  $("stat-kills").textContent = String(state.kills);
  $("stat-deaths").textContent = String(state.deaths);

  const aliveMembers = state.party.filter(c => c.health > 0);
  const totalHp = aliveMembers.reduce((s, c) => s + Math.ceil(c.health), 0);
  const totalMaxHp = state.party.reduce((s, c) => s + c.max_health, 0);
  const totalDps = aliveMembers.reduce((s, c) => s + c.dps, 0);
  $("stat-party-hp").textContent = `${totalHp}/${totalMaxHp}`;
  $("stat-party-dps").textContent = totalDps < 10 ? totalDps.toFixed(1) : String(Math.round(totalDps));

  const idleEl = $("stat-idle-gold");
  if (state.idle_gold_rate > 0) {
    $("stat-idle-rate").textContent = state.idle_gold_rate.toFixed(1);
    idleEl.hidden = false;
  } else {
    idleEl.hidden = true;
  }

  renderFloorProgress(state);
  renderDepthGauge(state);
  renderParty(state);
  renderLoot(state);
  renderUpgrades(state);
  renderPrestigeShop(state);
  renderGuildHall(state);
  renderSkillButton(state);
  renderCompanionSkills(state);
  renderLog(state);
  renderThemePicker(state);
  renderFeats(state);
  showAchievementToasts(state.pending_achievements ?? []);
  updatePrestigeButton(state);
  updateVentureButton(state);
  updateLifetimeStats(state);
  updateShopBadge(state);
  updateTabVisibility(state);
}

let tabVisKey = "";
/** Hides the Prestige and Guild tabs until the player has reached the unlock thresholds. */
function updateTabVisibility(state: GameStateDict): void {
  const ups = state.prestige_upgrades as Record<string, number>;
  const guildUpgrades = state.guild_upgrades as Record<string, number>;
  const prestigeUnlocked = state.lifetime_best_level >= PRESTIGE_UNLOCK_LEVEL || state.total_prestiges > 0;
  // unlocked by prestige purchase, or already has guild items (backward compat for existing saves)
  const guildUnlocked = (ups["guild_hall_access"] ?? 0) > 0
    || Object.values(guildUpgrades).some(v => v > 0);
  const newKey = `${prestigeUnlocked}|${guildUnlocked}`;
  if (newKey === tabVisKey) return;
  tabVisKey = newKey;

  // Sidebar tabs
  const stabPrestige = document.querySelector<HTMLElement>(".stab-btn[data-stab='prestige']");
  const stabGuild    = document.querySelector<HTMLElement>(".stab-btn[data-stab='guild']");
  if (stabPrestige) stabPrestige.hidden = !prestigeUnlocked;
  if (stabGuild)    stabGuild.hidden    = !guildUnlocked;

  // Mobile tabs
  const mobileGuild = document.querySelector<HTMLElement>(".mobile-tab-btn[data-tab='guild']");
  if (mobileGuild) mobileGuild.hidden = !guildUnlocked;

  // Mobile shop panel visibility — hide until unlocked so the shop tab doesn't show empty sections
  $("prestige-panel").classList.toggle("prestige-locked", !prestigeUnlocked);
  $("guild-hall-panel").classList.toggle("guild-locked", !guildUnlocked);
}

/** Renders the kill-progress pips, boss indicator text, and checkpoint label below the enemy panel. */
function renderFloorProgress(state: GameStateDict): void {
  const isBoss = state.enemy.is_boss;
  const left = state.monsters_left;
  const total = killsForFloor(state.dungeon_level);
  const done = total - left;

  if (isBoss) {
    $("monsters-left-text").textContent = "★ BOSS FIGHT ★";
    $("monsters-left-text").className = "boss-text";
  } else {
    $("monsters-left-text").textContent =
      left === 1 ? "1 monster until boss" : `${left} monsters until boss`;
    $("monsters-left-text").className = "";
  }

  const row = $("floor-pip-row");
  row.innerHTML = Array.from({ length: total }, (_, i) =>
    `<div class="floor-pip${i < done || isBoss ? " done" : ""}"></div>`
  ).join("")
    + (isBoss ? `<div class="floor-pip boss-pip">★</div>` : "");

  const cp = $("checkpoint-display");
  if (state.checkpoint_level > 1) {
    cp.textContent = `⚑ Checkpoint: Floor ${state.checkpoint_level}`;
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
  const deathFloors = state.death_floors as Record<number, number> ?? {};

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
    const label = isCp ? `⚑${floor}` : `${floor}`;
    const cls = isCp ? "depth-tick checkpoint-tick" : "depth-tick";
    ticks.push(`<div class="${cls}" style="top:${top}px"><span class="depth-tick-label">${label}</span></div>`);
  }
  tickContainer.innerHTML = ticks.join("");

  const deathContainer = $("depth-deaths-container");
  deathContainer.innerHTML = Object.entries(deathFloors).map(([floor, count]) => {
    const top = toPercent(Number(floor));
    const label = count > 1 ? `💀×${count}` : "💀";
    return `<div class="depth-death-marker" style="top:${top}px"><span class="depth-death-label">${label}</span></div>`;
  }).join("");
}

/** Re-renders the party cards section, skipping the DOM write if nothing has changed. */
function renderParty(state: GameStateDict): void {
  const prevPartyKey = partyKey;
  const newKey = JSON.stringify(
    state.party.map((c) => [c.dps, c.level, c.xp, c.health, JSON.stringify(c.equipment), c.abilities.join(",")]),
  );
  if (newKey === partyKey) return;
  const prevParsed = prevPartyKey
    ? (JSON.parse(prevPartyKey) as [number, number, number, number, string, string][])
    : null;
  const prevLevels = prevParsed
    ? prevParsed.map(([, lvl]) => lvl)
    : state.party.map(() => 0);

  // Determine which gear slots changed so we can flash them after re-render
  const changedSlots: [number, string][] = [];
  if (prevParsed) {
    state.party.forEach((c, ci) => {
      const prevEquip: Record<string, { name: string } | null> =
        JSON.parse(prevParsed[ci]?.[4] ?? "{}") ?? {};
      Object.entries(c.equipment).forEach(([slot, item]) => {
        const prevName = prevEquip[slot]?.name ?? null;
        const newName = (item as { name: string } | null)?.name ?? null;
        if (newName !== null && newName !== prevName) changedSlots.push([ci, slot]);
      });
    });
  }

  partyKey = newKey;

  const partyEl = $("party-cards");
  const partyH2 = document.querySelector<HTMLElement>("#party-panel h2");
  if (partyH2) partyH2.dataset.party = encodeURIComponent(JSON.stringify(state.party));

  partyEl.innerHTML = state.party
    .map((c, ci) => {
      const xpPct = Math.round((c.xp / c.xp_to_next) * 100);
      const leveledUp = c.level > (prevLevels[ci] ?? 0);
      const gearRows = Object.entries(c.equipment)
        .map(([slot, item]) => {
          if (item) {
            const qc = qualityClass(item.quality);
            const itemJson = encodeURIComponent(JSON.stringify(item));
            return `<div class="gear-row filled" data-slot="${slot}" data-item="${itemJson}">
              <span class="gear-icon">${SLOT_ICONS[slot]}</span>
              <span class="gear-name ${qc}">${item.name}</span>
              <span class="gear-bonus ${qc}">${formatStats(item.stats ?? { dps: item.damage })}</span>
            </div>`;
          }
          return `<div class="gear-row empty" data-slot="${slot}">
            <span class="gear-icon">${SLOT_ICONS[slot]}</span>
            <span class="gear-slot-label">${slotLabel(slot)}</span>
          </div>`;
        })
        .join("");
      const hpPct = Math.max(0, Math.round((c.health / c.max_health) * 100));
      const hpLow = hpPct <= 25;
      const isDead = c.health <= 0;
      const gearDps = Object.values(c.equipment).reduce((sum, item) => {
        return sum + ((item as GearItemDict | null)?.stats?.dps ?? 0);
      }, 0);
      const dpsData = encodeURIComponent(JSON.stringify({ total: c.dps, base: Math.max(0, c.dps - gearDps), gear: gearDps, upgLevel: (state.upgrades[c.name]?.dps as { level: number } | undefined)?.level ?? 0 }));
      const classAbilities = CLASS_ABILITIES[c.character_class] ?? [];
      const abilitiesHtml = classAbilities.map(a => {
        const unlocked = c.abilities.includes(a.id);
        const skillJson = encodeURIComponent(JSON.stringify({ icon: a.icon, name: a.name, desc: a.desc, level: a.level, unlocked }));
        return unlocked
          ? `<span class="ability-badge unlocked" tabindex="0" data-tip="${a.desc}" data-skill="${skillJson}">${a.icon} ${a.name}</span>`
          : `<span class="ability-badge locked" tabindex="0" data-tip="Lv${a.level}: ${a.desc}" data-skill="${skillJson}">${a.icon} Lv${a.level}</span>`;
      }).join("");
      const charJson = encodeURIComponent(JSON.stringify(c));
      const heroImg = HERO_IMG[c.character_class] ?? HERO_IMG.fighter;
      return `
<div class="char-card${leveledUp ? " levelup-flash" : ""}${isDead ? " is-dead" : ""}">
  <div class="char-header">
    <div class="char-header-left">
      <div class="char-name" data-char="${charJson}">${c.name}</div>
      <div class="char-class">${c.character_class}</div>${ci === 0 && state.earned_title ? `<div class="char-title">${state.earned_title}</div>` : ""}
      <div class="char-dps" data-dps="${dpsData}">${c.dps.toFixed(1)} DPS</div>
    </div>
    <img class="hero-sprite" src="${heroImg}" alt="${c.character_class}">
  </div>
  <div class="hp-section">
    <div class="hp-bar-header">
      <span class="hp-label">HP</span>
      <span class="hp-numbers${hpLow ? " hp-low" : ""}">${Math.ceil(c.health)} / ${c.max_health}</span>
    </div>
    <div class="player-hp-bar-wrap">
      <div class="player-hp-bar${hpLow ? " hp-bar-low" : ""}" style="width:${hpPct}%"></div>
    </div>
  </div>
  <div class="char-gear">${gearRows}</div>
  <div class="char-abilities">${abilitiesHtml}</div>
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
</div>`;
    })
    .join("");
  applySlotHighlight();

  // Register new flashes and prune expired ones
  const flashDuration = 2000;
  const now = Date.now();
  changedSlots.forEach(([ci, slot]) => flashStartTimes.set(`${ci}:${slot}`, now));
  for (const [key, start] of flashStartTimes) {
    if (now - start >= flashDuration) flashStartTimes.delete(key);
  }

  // Re-apply flashes to the freshly rendered DOM.
  // Negative animation-delay resumes the animation mid-timeline instead of restarting it,
  // which is necessary because the DOM is replaced every tick (HP updates partyKey constantly).
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

function applySlotHighlight(): void {
  document.querySelectorAll<HTMLElement>(".gear-row").forEach(row => {
    row.classList.toggle("slot-highlight", hoveredLootSlot !== null && row.dataset.slot === hoveredLootSlot);
  });
}

/** Renders the loot chest with equip/sell buttons and auto-seller quality checkboxes. */
function renderLoot(state: GameStateDict): void {
  const loot = state.loot_pool;
  const autoSellOwned = ((state.prestige_upgrades as Record<string, number>)["auto_seller"] ?? 0) > 0;
  const newKey = loot.map((i) => i.slot + i.name).join("|") + "|" + JSON.stringify(state.auto_sell_qualities) + "|" + state.highest_level + "|" + lootFilterActive;
  if (newKey !== lootKey) {
    lootKey = newKey;

    const lootEl = $("loot-items");
    $("loot-count").textContent = loot.length ? `(${loot.length}/${state.loot_max})` : "";
    const equipAllBtn = document.querySelector<HTMLButtonElement>(".equip-all-btn");
    if (equipAllBtn) equipAllBtn.disabled = loot.length === 0;
    const sellAllBtn = document.querySelector<HTMLButtonElement>(".sell-all-btn");
    if (sellAllBtn) sellAllBtn.disabled = loot.length === 0;

    const filterBtn = document.getElementById("loot-filter-btn");
    if (filterBtn) filterBtn.classList.toggle("active", lootFilterActive);

    lootEl.innerHTML = loot.length === 0
      ? `<div class="loot-empty">No drops yet…</div>`
      : loot.map((item, i) => {
          const [tri, triCls] = lootTier(item, state.party);
          const qc = qualityClass(item.quality);
          const itemJson = encodeURIComponent(JSON.stringify(item));
          const isUpgrade = tri !== null;
          const dimmed = lootFilterActive && !isUpgrade;
          return `
<div class="loot-item${dimmed ? " loot-dim" : ""}" data-slot="${item.slot}" data-item="${itemJson}">
  <div class="loot-header">
    <span class="loot-name ${qc}">${item.short_name ?? item.name}</span>
    <span class="loot-slot-badge">${item.slot_display}</span>
  </div>
  <div class="loot-body">
    <div class="loot-dmg ${triCls || qc}">${formatLootStats(tri, item.stats ?? { dps: item.damage })}</div>
    <div class="loot-btns">
      <button class="equip-btn" data-action="equip" data-idx="${i}">Equip</button>
      <button class="sell-btn"  data-action="sell"  data-idx="${i}">${item.sell_value}g</button>
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

/** Renders per-character stat upgrade cards with current level, cost, and effect. */
function renderUpgrades(state: GameStateDict): void {
  const newKey = JSON.stringify(state.upgrades) + "|" + state.gold;
  if (newKey === upgradeKey) return;
  upgradeKey = newKey;

  $("upgrade-cards").innerHTML = state.party
    .map((c) => {
      const ups = state.upgrades[c.name];
      const rows = Object.entries(ups)
        .map(([utype, u]) => {
          const meta = UPGRADE_LABELS[utype];
          const canAfford = state.gold >= u.cost;
          return `<div class="upgrade-row">
            <span class="upgrade-icon">${meta.icon}</span>
            <span class="upgrade-label">${meta.label}</span>
            <span class="upgrade-level">Lv ${u.level}</span>
            <button class="upgrade-btn"
                data-action="upgrade"
                data-char="${c.name}"
                data-type="${utype}"
                ${canAfford ? "" : "disabled"}>${u.cost}g</button>
          </div>`;
        })
        .join("");
      return `<div class="upgrade-card">
        <div class="upgrade-char-name">${c.name}</div>
        ${rows}
      </div>`;
    })
    .join("");
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
  starting_gold: { icon: "💰", name: "Starting Gold",  desc: "+250g at the start of each run.", max: Infinity },
  xp_bonus:      { icon: "✨", name: "XP Bonus",       desc: "+10% XP gain for all party members.", max: Infinity },
  checkpoint:    { icon: "⚑", name: "Checkpoint",     desc: "Each level adds a respawn checkpoint at the next multiple of 5 (lv1→floor 5, lv2→floor 10, lv3→floor 15…).", max: 20 },
  gold_mastery:  { icon: "💰", name: "Gold Mastery",   desc: "+20% gold from bosses per stack. Dungeon 2+.", max: Infinity, dungeonReq: 1 },
  gear_luck:     { icon: "🍀", name: "Gear Luck",      desc: "+5% item drop chance per stack (max 75%). Dungeon 2+.", max: 10, dungeonReq: 1 },
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

/** Renders the Prestige Shop item list, marking purchased one-time items and unaffordable items. */
function renderPrestigeShop(state: GameStateDict): void {
  const newKey = JSON.stringify(state.prestige_upgrades) + "|" + state.prestige_points + "|" + state.highest_level + "|" + JSON.stringify(state.auto_sell_qualities) + "|" + state.dungeon_index;
  if (newKey === prestigeKey) return;
  prestigeKey = newKey;

  const pts = state.prestige_points;
  $("prestige-points-display").textContent = pts === 1 ? "(1 pt)" : pts > 0 ? `(${pts} pts)` : "";

  const ups = state.prestige_upgrades as Record<string, number>;
  const guildUpgrades = state.guild_upgrades as Record<string, number>;
  const companionHall = guildUpgrades["companion_hall"] ?? 0;
  $("prestige-shop-items").innerHTML = Object.entries(PRESTIGE_SHOP_META)
    .filter(([type, meta]) => {
      const guildReq = meta.guildReq ?? 0;
      if (guildReq > 0 && companionHall < guildReq) return false;
      const dungeonReq = meta.dungeonReq ?? 0;
      return state.dungeon_index >= dungeonReq;
    })
    .map(([type, meta]) => {
      const owned = ups[type] ?? 0;
      const cost = prestigeUpgradeCost(type, owned);
      const atMax = owned >= meta.max;
      return { type, meta, owned, cost, atMax };
    })
    .sort((a, b) => {
      if (a.atMax !== b.atMax) return a.atMax ? 1 : -1;
      return a.cost - b.cost;
    })
    .map(({ type, meta, owned, cost, atMax }) => {
      const prereqMissing = (type === "smart_seller" && !(ups["auto_seller"] > 0))
        || (type === "party_slot_3" && !(ups["party_slot_2"] > 0))
        || (type === "party_slot_4" && !(ups["party_slot_3"] > 0))
        || (type === "party_slot_5" && !(ups["party_slot_4"] > 0))
;
      const canAfford = pts >= cost;
      const disabled = atMax || prereqMissing || !canAfford;
      const ownedLabel = atMax ? " ✓" : owned > 0 ? ` (${owned})` : "";
      return `<div class="prestige-item">
      <div class="prestige-item-meta">
        <div class="prestige-item-name">${meta.icon} ${meta.name}${ownedLabel}</div>
        <div class="prestige-item-desc">${meta.desc}</div>
      </div>
      <button class="prestige-buy-btn" data-action="buy-prestige" data-type="${type}" ${disabled ? "disabled" : ""}>${atMax ? "Owned" : cost + "pt"}</button>
    </div>`;
    })
    .join("");
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
    btn.textContent = "⚔ Venture Forth";
  } else {
    btn.disabled = true;
    btn.textContent = `⚔ Venture (need lv${ventureUnlockLevel(state.dungeon_index)})`;
  }
}

/** Renders Guild Hall upgrade cards with current stack count, gold cost, and description. */
function guildUpgradePreview(type: string, stacks: number, lootMax: number): string {
  if (type === "expanded_armory") {
    const cur = lootMax;
    return `Loot chest: ${cur} → ${cur + 2} slots`;
  }
  if (type === "companion_hall") {
    return stacks === 0 ? "Unlocks: Party Slot IV" : "Unlocks: Party Slot V";
  }
  return "";
}

function renderGuildHall(state: GameStateDict): void {
  const owned = state.guild_upgrades as Record<string, number>;
  const affordKey = Object.keys(GUILD_HALL_META).map(type => {
    const stacks = owned[type] ?? 0;
    const costs = GUILD_HALL_COSTS[type];
    if (stacks >= costs.length) return "max";
    return state.gold >= costs[stacks] ? "yes" : "no";
  }).join(",");
  const runeInvKey = JSON.stringify(state.rune_inventory ?? []);
  const newKey = JSON.stringify(state.guild_upgrades) + "|" + affordKey + "|" + state.dungeon_index + "|" + runeInvKey + "|" + JSON.stringify(state.party.map(c => c.runes));
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
    const canAfford = !atMax && state.gold >= nextCost;
    const disabled = atMax || !canAfford;
    const stackLabel = costs.length > 1 ? (atMax ? ` (${stacks}/${costs.length})` : stacks > 0 ? ` (${stacks}/${costs.length})` : "") : atMax ? " ✓" : "";
    const preview = atMax ? "" : guildUpgradePreview(type, stacks, state.loot_max);
    return `<div class="prestige-item">
      <div class="prestige-item-meta">
        <div class="prestige-item-name">${meta.icon} ${meta.name}${stackLabel}</div>
        <div class="prestige-item-desc">${meta.desc}</div>
        ${preview ? `<div class="guild-preview">→ ${preview}</div>` : ""}
      </div>
      <button class="guild-buy-btn" data-action="buy-guild" data-type="${type}" ${disabled ? "disabled" : ""}>${atMax ? "Owned" : nextCost.toLocaleString() + "g"}</button>
    </div>`;
  }).join("");

  const runeForge = owned["rune_forge"] ?? 0;
  const runeInv: any[] = state.rune_inventory ?? [];
  const runeSection = runeForge >= 1 ? renderRuneSection(runeInv, state.party, runeForge) : "";

  $("guild-hall-items").innerHTML = upgradesHtml + runeSection;
}

const RUNE_STAT_LABELS: Record<string, string> = {
  dps: "DPS", maxHp: "Max HP", haste: "Haste", goldBonus: "Gold Bonus", xpMultiplier: "XP Mult", critChance: "Crit Chance",
};
const RUNE_ICONS: Record<string, string> = {
  striking: "⚔", warding: "🛡", swiftness: "💨", greed: "💰", fortune: "🍀", wrath: "💢",
};
const ALL_SLOTS = ["main_hand","off_hand","helmet","chest","gloves","legs","shoes","ring1","ring2"] as const;
const SLOT_LABELS: Record<string, string> = {
  main_hand: "Main Hand", off_hand: "Off Hand", helmet: "Helmet", chest: "Chest",
  gloves: "Gloves", legs: "Legs", shoes: "Shoes", ring1: "Ring 1", ring2: "Ring 2",
};

function renderRuneSection(runeInv: any[], party: any[], runeForge: number): string {
  const charOptions = party.map((c, i) =>
    `<option value="${i}">${c.name}</option>`
  ).join("");
  const slotOptions = ALL_SLOTS.map(s =>
    `<option value="${s}">${SLOT_LABELS[s]}</option>`
  ).join("");

  const runeItems = runeInv.length === 0
    ? `<div class="rune-empty">No runes — boss kills have a 20% chance to drop one.</div>`
    : runeInv.map((rune, i) => {
        const icon = RUNE_ICONS[rune.type] ?? "🔮";
        const statLabel = RUNE_STAT_LABELS[rune.statKey] ?? rune.statKey;
        return `<div class="rune-item" data-rune-idx="${i}">
          <span class="rune-tier-badge ${rune.tier}">${rune.tier === "greater" ? "★" : "◆"}</span>
          <span class="rune-icon">${icon}</span>
          <span class="rune-name">${rune.name}</span>
          <span class="rune-stat">+${rune.value} ${statLabel}</span>
          <select class="rune-char-select">${charOptions}</select>
          <select class="rune-slot-select">${slotOptions}</select>
          <button class="rune-brand-btn" data-action="brand-rune" data-rune-id="${rune.id}" data-rune-idx="${i}">Brand</button>
        </div>`;
      }).join("");

  const combinePairs = findCombinePairs(runeInv);
  const combineHtml = runeForge >= 3 && combinePairs.length > 0
    ? `<div class="rune-combine-section">
        <span class="rune-combine-label">Combine:</span>
        <select class="rune-combine-select">${combinePairs.map(p =>
          `<option value="${p.id1}|${p.id2}">${RUNE_ICONS[p.type] ?? "🔮"} 2× ${p.name} → Greater</option>`
        ).join("")}</select>
        <button class="rune-combine-btn" data-action="combine-runes">Combine</button>
      </div>`
    : runeForge < 3
      ? `<div class="rune-combine-hint">Rune Forge Tier 3 unlocks combining two matching lesser runes into a greater.</div>`
      : "";

  return `<div class="rune-inv-section">
    <div class="rune-inv-title">🔮 Rune Inventory (${runeInv.length})</div>
    <div class="rune-inv-items">${runeItems}</div>
    ${combineHtml}
  </div>`;
}

function findCombinePairs(runeInv: any[]): { id1: string; id2: string; type: string; name: string }[] {
  const counts: Record<string, number> = {};
  for (const r of runeInv) {
    if (r.tier === "lesser") counts[r.id] = (counts[r.id] ?? 0) + 1;
  }
  const pairs: { id1: string; id2: string; type: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const [id, count] of Object.entries(counts)) {
    if (count >= 2 && !seen.has(id)) {
      seen.add(id);
      const def = RUNE_DEFS[id];
      if (def) pairs.push({ id1: id, id2: id, type: def.type, name: def.name });
    }
  }
  return pairs;
}

const SKILL_NAMES: Record<string, string> = {
  skill_battle_cry:    "📯 Battle Cry",
  skill_shadow_strike: "🌑 Shadow Strike",
  skill_arcane_surge:  "⚡ Arcane Surge",
  skill_consecrate:    "✝ Consecrate",
  skill_volley:        "🏹 Volley",
};
const SKILL_DESCS: Record<string, string> = {
  skill_battle_cry:    "Doubles party damage for 5 kills.",
  skill_shadow_strike: "Multiplies click damage by 5× for 3 kills.",
  skill_arcane_surge:  "Triples party damage for 5 kills.",
  skill_consecrate:    "Heals party 25% max HP per kill for 5 kills.",
  skill_volley:        "Quadruples party DPS for 4 kills.",
};

/** Shows/hides the active skill button and updates its cooldown drain bar. */
function renderSkillButton(state: GameStateDict): void {
  const skillId = state.skill_available;
  const newKey = skillId + "|" + (skillId ? (state.skill_cooldowns[skillId] ?? 0) : 0) + "|" + (skillId ? (state.active_effects[skillId] ?? 0) : 0);
  if (newKey === skillKey) return;
  skillKey = newKey;

  const btn = $("skill-btn") as HTMLButtonElement;
  const bar = $("skill-cooldown-bar");
  const fill = $("skill-cooldown-fill");

  if (!skillId) {
    btn.hidden = true;
    bar.hidden = true;
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
  btn.disabled = onCooldown;
  btn.className = isActive ? "active" : "";

  if (onCooldown) {
    const pct = Math.min(100, ((totalCooldown - remaining) / totalCooldown) * 100);
    fill.style.width = pct + "%";
    bar.hidden = false;
  } else {
    bar.hidden = true;
  }
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
    const pct = onCooldown ? Math.min(100, ((totalCooldown - remaining) / totalCooldown) * 100) : 0;
    const label = SKILL_NAMES[skillId] ?? skillId;
    return `
      <button class="companion-skill-btn${isActive ? " active" : ""}" data-action="activate-companion-skill" data-skill="${skillId}" data-active-skill="${skillId}"${onCooldown ? " disabled" : ""}>${label}</button>
      ${onCooldown ? `<div class="skill-cooldown-bar companion-cooldown-bar"><div class="skill-cooldown-fill" style="width:${pct}%"></div></div>` : ""}
    `;
  }).join("");
}

/** Enables/disables the Prestige button and updates its label with the points preview. */
function updatePrestigeButton(state: GameStateDict): void {
  const btn = $("prestige-btn") as HTMLButtonElement;
  if (state.prestige_available) {
    btn.disabled = false;
    btn.textContent = `★ Prestige (+${state.prestige_points_preview}pt)`;
  } else {
    btn.disabled = true;
    btn.textContent = `★ Prestige (need lv${20})`;
  }
}

/** Populates the Lifetime Stats modal with totals and the enemy kill breakdown. */
function updateLifetimeStats(state: GameStateDict): void {
  const ltKills = document.getElementById("lt-kills");
  const ltDeaths = document.getElementById("lt-deaths");
  const ltBest = document.getElementById("lt-best");
  const ltPrestiges = document.getElementById("lt-prestiges");
  if (ltKills) ltKills.textContent = String(state.lifetime_kills);
  if (ltDeaths) ltDeaths.textContent = String(state.lifetime_deaths);
  if (ltBest) ltBest.textContent = String(state.lifetime_best_level);
  if (ltPrestiges) ltPrestiges.textContent = String(state.total_prestiges);

  const enemyKillsEl = document.getElementById("lt-enemy-kills");
  const enemySection = document.getElementById("lt-enemy-section");
  if (!enemyKillsEl || !enemySection) return;
  const ekMap = state.lifetime_enemy_kills as Record<string, number>;
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
  const ups = state.prestige_upgrades as Record<string, number>;
  const canBuyPrestige = Object.keys(PRESTIGE_SHOP_META).some(type => {
    const owned = ups[type] ?? 0;
    const atMax = owned >= (PRESTIGE_SHOP_META[type]?.max ?? 1);
    const prereqMissing = (type === "smart_seller" && !(ups["auto_seller"] > 0))
      || (type === "party_slot_3" && !(ups["party_slot_2"] > 0))
      || (type === "checkpoint_2" && !(ups["checkpoint_1"] > 0))
      || (type === "checkpoint_3" && !(ups["checkpoint_2"] > 0));
    const cost = prestigeUpgradeCost(type, owned);
    return !atMax && !prereqMissing && state.prestige_points >= cost;
  });
  const guildUpgrades = state.guild_upgrades as Record<string, number>;
  const canBuyGuild = Object.entries(GUILD_HALL_COSTS).some(([type, costs]) => {
    const owned = guildUpgrades[type] ?? 0;
    return owned < costs.length && state.gold >= costs[owned];
  });
  badge.hidden = !(canBuyUpgrade || canBuyPrestige || canBuyGuild);
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
  wealth: "Wealth", prestige: "Prestige", guild: "Guild",
};

const CATEGORY_ICONS: Record<string, string> = {
  combat: "⚔", explorer: "🗺", collector: "🎒", wealth: "💰", prestige: "✦", guild: "🏰",
};

let featsKey = "";
function renderFeats(state: GameStateDict): void {
  const unlocked = new Set(state.achievements_unlocked ?? []);
  const newKey = `${state.achievements_unlocked?.length}|${state.earned_title}`;
  if (newKey === featsKey) return;
  featsKey = newKey;

  const categories = ["combat", "explorer", "collector", "wealth", "prestige", "guild"];
  const byCategory: Record<string, typeof ACHIEVEMENTS> = {};
  for (const cat of categories) byCategory[cat] = [];
  for (const def of ACHIEVEMENTS) byCategory[def.category]?.push(def);

  const html = categories.map(cat => {
    const defs = byCategory[cat];
    const rows = defs.map(def => {
      const isDone = def.tiers
        ? unlocked.has(`${def.id}_gold`) || (!def.tiers.some(t => t.label === "gold") && unlocked.has(`${def.id}_${def.tiers[def.tiers.length-1].label}`))
        : unlocked.has(def.id);
      const isHidden = def.hidden && !isDone && !def.tiers?.some(t => unlocked.has(`${def.id}_${t.label}`));

      const name = isHidden ? "???" : def.name;
      const desc = isHidden ? "Unlock to reveal." : def.description;
      const iconCls = isDone ? "" : " locked";

      let tierHtml = "";
      let progressHtml = "";
      if (def.tiers && !isHidden) {
        const labels = { bronze: "B", silver: "S", gold: "G" };
        const pips = def.tiers.map(t => {
          const key = `${def.id}_${t.label}`;
          const done = unlocked.has(key);
          const cls = done ? ` ${t.label}-done` : "";
          return `<span class="feat-tier-pip${cls}" title="${t.label}: ${t.threshold.toLocaleString()}">${labels[t.label]}</span>`;
        }).join("");
        tierHtml = `<div class="feat-tiers">${pips}</div>`;

        // Show progress toward next tier
        const nextTier = def.tiers.find(t => !unlocked.has(`${def.id}_${t.label}`));
        if (nextTier) {
          const prevThreshold = def.tiers[def.tiers.indexOf(nextTier) - 1]?.threshold ?? 0;
          const raw = 0; // We don't have current progress in state easily; skip for now
          const pct = Math.min(100, raw);
          progressHtml = `<div class="feat-progress-bar"><div class="feat-progress-fill" style="width:${pct}%"></div></div>`;
        }
      }

      let rewardHtml = "";
      if (!isHidden) {
        const rewards = def.tiers ? def.tiers.filter(t => t.reward).map(t => {
          const r = t.reward!;
          if (r.type === "gold") return `${t.label}: +${r.value}g`;
          if (r.type === "prestige_points") return `${t.label}: +${r.value}✦`;
          if (r.type === "title") return `${t.label}: "${r.title}"`;
          return "";
        }) : def.reward ? [
          def.reward.type === "gold" ? `+${def.reward.value}g` :
          def.reward.type === "prestige_points" ? `+${def.reward.value}✦` :
          def.reward.type === "title" ? `"${def.reward.title}"` : ""
        ] : [];
        if (rewards.filter(Boolean).length) {
          rewardHtml = `<div class="feat-reward">${rewards.filter(Boolean).join(" · ")}</div>`;
        }
      }

      const nameCls = isHidden ? " locked-hidden" : "";
      return `<div class="feat-row">
        <div class="feat-icon${iconCls}">${isDone ? "✅" : (isHidden ? "❓" : "🔲")}</div>
        <div class="feat-info">
          <div class="feat-name${nameCls}">${name}</div>
          <div class="feat-desc">${desc}</div>
          ${rewardHtml}${tierHtml}
        </div>
      </div>`;
    }).join("");

    return `<div class="feat-category">
      <div class="feat-category-title">${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}</div>
      ${rows}
    </div>`;
  }).join("");

  const earnedTitles: string[] = (state as any).earned_titles ?? [];
  const titleHtml = earnedTitles.length > 0
    ? `<div class="title-picker-section">
        <div class="title-picker-label">Your Title</div>
        <div class="title-picker-chips">
          <button class="title-chip${state.earned_title === "" ? " active" : ""}" data-action="set-title" data-title="">None</button>
          ${earnedTitles.map(t =>
            `<button class="title-chip${state.earned_title === t ? " active" : ""}" data-action="set-title" data-title="${t}">${t}</button>`
          ).join("")}
        </div>
      </div>`
    : "";

  $("feats-content").innerHTML = titleHtml + html;

  // Badge: show count of pending toasts as a brief notification
  const badge = document.getElementById("stab-feats-badge");
  if (badge) {
    const pending = (state.pending_achievements ?? []).length;
    if (pending > 0) {
      badge.textContent = String(pending);
      badge.hidden = false;
      setTimeout(() => { badge.hidden = true; }, 5000);
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
        r.type === "gold" ? `+${r.value}g` :
        r.type === "prestige_points" ? `+${r.value} prestige point${(r.value ?? 1) > 1 ? "s" : ""}` :
        r.type === "title" ? `Title unlocked: "${r.title}"` : "";
      const tierTag = u.tier ? ` <span style="font-size:0.6rem;color:var(--muted)">(${u.tier})</span>` : "";
      const el = document.createElement("div");
      el.className = "achievement-toast";
      el.innerHTML = `<div class="toast-title">Feat Unlocked!</div><div class="toast-name">${u.name}${tierTag}</div>${rewardText ? `<div class="toast-reward">${rewardText}</div>` : ""}`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 3200);
    }, i * 400);
  });
}

function renderLog(state: GameStateDict): void {
  const lines = [...state.log].reverse();
  $("combat-log").innerHTML = lines.map((l) => `<div class="log-line">${l}</div>`).join("");
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
  $("combat-log").insertAdjacentHTML(
    "afterbegin",
    `<div class="log-line" style="color:var(--danger)">${msg}</div>`,
  );
}

/** Builds the inner HTML for the item tooltip given a serialized GearItemDict. */
function buildTooltipHTML(item: GearItemDict): string {
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
  return `
    <span class="tt-name ${qc}">${item.short_name ?? item.name}</span>
    <div class="tt-rarity ${qc}">${rarity}</div>
    <div class="tt-subtitle">${item.slot_display} · Floor ${item.dungeon_level}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">${statRows || '<div class="tt-stat-row"><span class="tt-stat-label">No stats</span></div>'}</div>
    <div class="tt-divider"></div>
    <div class="tt-sell">Sell: ${item.sell_value}g</div>
  `;
}

type CharDict = GameStateDict["party"][number];

function statRow(label: string, value: string, cls = ""): string {
  return `<div class="tt-stat-row"><span class="tt-stat-label">${label}</span><span class="tt-stat-val${cls ? " " + cls : ""}">${value}</span></div>`;
}

function buildCharTooltipHTML(c: CharDict): string {
  const classAbilities = CLASS_ABILITIES[c.character_class] ?? [];
  const unlocked = classAbilities.filter(a => c.abilities.includes(a.id));
  const rows = [
    statRow("DPS",        `${c.dps.toFixed(1)}`,                   "tt-dps"),
    statRow("HP",         `${Math.ceil(c.health)} / ${c.max_health}`, "tt-hp"),
    c.click_bonus   > 0 ? statRow("Click Dmg",   `+${c.click_bonus.toFixed(1)}`,           "tt-click") : "",
    c.damage_reduction > 0 ? statRow("Defense",  `+${(c.damage_reduction * 100).toFixed(0)}%`, "tt-def")   : "",
    c.crit_chance   > 0 ? statRow("Crit Chance", `+${(c.crit_chance * 100).toFixed(1)}%`,  "tt-crit")  : "",
    c.gold_bonus    > 0 ? statRow("Gold Find",   `+${(c.gold_bonus * 100).toFixed(0)}%`,   "tt-gold")  : "",
    c.lifesteal     > 0 ? statRow("Lifesteal",   `+${(c.lifesteal * 100).toFixed(0)}%`,    "tt-life")  : "",
    c.haste         > 0 ? statRow("Haste",        `+${(c.haste * 100).toFixed(0)}%`,        "tt-haste") : "",
    c.xp_multiplier > 1 ? statRow("XP Bonus",    `${(c.xp_multiplier * 100).toFixed(0)}%`, "tt-xp")   : "",
  ].filter(Boolean).join("");
  const abilityBadges = unlocked.length
    ? `<div class="tt-divider"></div><div class="tt-abilities">${unlocked.map(a => `<span class="tt-ability">${a.icon} ${a.name}</span>`).join("")}</div>`
    : "";
  const heroImg = HERO_IMG[c.character_class] ?? HERO_IMG.fighter;
  return `
    <img class="tt-hero-portrait" src="${heroImg}" alt="${c.character_class}">
    <span class="tt-name">${c.name}</span>
    <div class="tt-rarity" style="color:var(--muted);text-transform:none;font-weight:400">Lv${c.level} ${c.character_class}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">${rows}</div>
    ${abilityBadges}
  `;
}

function buildPartyTooltipHTML(party: CharDict[]): string {
  const alive = party.filter(c => c.health > 0);
  const totalDps  = alive.reduce((s, c) => s + c.dps, 0);
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

function formatStats(stats: GearStats): string {
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
  return parts.join("  ") || "+0";
}

/** Renders loot chest stats as individual <span> elements for grid layout, with tri indicator on first stat. */
function formatLootStats(tri: string, stats: GearStats): string {
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
  combat:   ["enemy-panel", "party-panel", "loot-panel"],
  shop:     ["upgrades-panel", "prestige-panel", "guild-hall-panel"],
  log:      ["log-panel"],
};

const SIDEBAR_TAB_PANELS: Record<string, string[]> = {
  upgrades: ["upgrades-panel"],
  loot:     ["loot-panel"],
  prestige: ["prestige-panel"],
  guild:    ["guild-hall-panel"],
  feats:    ["feats-panel"],
  log:      ["log-panel"],
};

function initMobileTabs(): void {
  const allPanelIds = Object.values(TAB_PANELS).flat();
  const tabs = document.querySelectorAll<HTMLElement>(".mobile-tab-btn");

  function showTab(tab: string): void {
    allPanelIds.forEach(id => document.getElementById(id)?.classList.remove("tab-visible"));
    TAB_PANELS[tab]?.forEach(id => document.getElementById(id)?.classList.add("tab-visible"));
    tabs.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tab));
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

interface AbilityCardData { icon: string; name: string; desc: string; level: number; unlocked: boolean; }

function buildSkillTooltipHTML(a: AbilityCardData): string {
  const statusClass = a.unlocked ? "rarity-rare" : "rarity-common";
  const statusText  = a.unlocked ? "Unlocked" : `Requires Level ${a.level}`;
  return `
    <div class="tt-name">${a.icon} ${a.name}</div>
    <div class="tt-rarity ${statusClass}">${statusText}</div>
    <div class="tt-divider"></div>
    <div class="tt-stat-row"><span class="tt-stat-label">${a.desc}</span></div>`;
}

const TOOLTIP_SELECTORS = ".gear-row.filled[data-item], .loot-item[data-item], .char-name[data-char], #party-panel h2[data-party], [data-active-skill], .char-dps[data-dps]";

function buildActiveSkillTooltipHTML(skillId: string): string {
  const name = SKILL_NAMES[skillId] ?? skillId;
  const desc = SKILL_DESCS[skillId] ?? "";
  const cooldownKills = SKILL_DEFS[skillId]?.cooldownKills ?? 30;
  return `<div class="skill-tooltip"><div class="skill-tooltip-name">${name}</div><div class="skill-tooltip-desc">${desc}</div><div class="skill-tooltip-cd">Cooldown: ${cooldownKills} kills</div></div>`;
}

function buildDpsTooltipHTML(d: { total: number; base: number; gear: number; upgLevel: number }): string {
  return `
    <div class="tt-name">DPS Breakdown</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">
      ${statRow("Base", d.base.toFixed(1), "tt-dps")}
      ${d.gear > 0 ? statRow("Gear", `+${d.gear.toFixed(1)}`, "tt-dps") : ""}
      ${d.upgLevel > 0 ? statRow("Upgrades", `Lv${d.upgLevel}`, "tt-click") : ""}
    </div>
    <div class="tt-divider"></div>
    ${statRow("Total", d.total.toFixed(1), "tt-dps")}
  `;
}

function getTooltipContent(el: HTMLElement): string | null {
  try {
    if (el.dataset.activeSkill) return buildActiveSkillTooltipHTML(el.dataset.activeSkill);
    if (el.dataset.dps)   return buildDpsTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.dps)));
    if (el.dataset.item)  return buildTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.item)) as GearItemDict);
    if (el.dataset.char)  return buildCharTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.char)) as CharDict);
    if (el.dataset.party) return buildPartyTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.party)) as CharDict[]);
    if (el.dataset.skill) return buildSkillTooltipHTML(JSON.parse(decodeURIComponent(el.dataset.skill)) as AbilityCardData);
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

  const MOBILE_SELECTORS = ".gear-row.filled[data-item], .loot-item[data-item], .char-name[data-char], .ability-badge[data-skill]";

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
  const guildUpgrades = game ? (JSON.parse(game.respond()) as GameStateDict).guild_upgrades : {};
  const paladinBtn = document.getElementById("party-class-paladin");
  const rangerBtn = document.getElementById("party-class-ranger");
  if (paladinBtn) paladinBtn.hidden = !((guildUpgrades["class_paladin"] ?? 0) > 0);
  if (rangerBtn) rangerBtn.hidden = !((guildUpgrades["class_ranger"] ?? 0) > 0);

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
  const data = game.respond();
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
  return `Floor ${best} reached<br>${kills.toLocaleString()} lifetime kills<br>${prestiges} prestige${prestiges !== 1 ? "s" : ""}`;
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
  deleteSave();
  game = new GameState(name, characterClass);
  render(JSON.parse(game.respond()));
  setInterval(() => { call("tick", 0.1); saveGame(); }, 100);
}

/** Restores a GameState from a saved snapshot, hides the creation overlay, and starts the game loop. */
function continueGame(saved: GameStateDict): void {
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
  setInterval(() => { call("tick", 0.1); saveGame(); }, 100);
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

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHeaderHeightVar();
  initSaveBackup();
  initMobileTabs();
  initSidebarTabs();
  initItemTooltip();
  initMobileItemCard();
  initPartyGearToggle();

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
  $("mobile-stats-btn").addEventListener("click", openStats);
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
    if (!btn) return;
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
    if (action === "equip") call("equipLoot", idx);
    else if (action === "sell") call("sellLoot", idx);
    else if (action === "upgrade") call("buyUpgrade", btn.dataset.char!, btn.dataset.type!);
    else if (action === "attack") call("click");
    else if (action === "equip-all") call("equipAll");
    else if (action === "sell-all") call("sellAll");
    else if (action === "prestige") {
      if (!game) return;
      const pts = game.prestigePointsPreview();
      if (confirm(`Prestige? You will earn ${pts} pt. ALL run progress will be wiped.`)) {
        call("prestige");
      }
    }
    else if (action === "buy-prestige") {
      const type = btn.dataset.type!;
      if (type === "party_slot_2" || type === "party_slot_3" || type === "party_slot_4" || type === "party_slot_5") {
        openPartyClassModal(type);
      } else {
        call("buyPrestigeUpgrade", type);
      }
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
    else if (action === "set-title") {
      call("setEarnedTitle", btn.dataset.title ?? "");
    }
  });

  // Settings modal
  function openSettings(): void { $("settings-modal").classList.add("open"); }
  function closeSettings(): void { $("settings-modal").classList.remove("open"); }
  $("settings-open-btn").addEventListener("click", openSettings);
  $("settings-modal-close").addEventListener("click", closeSettings);
  $("settings-modal").addEventListener("click", (e) => { if (e.target === $("settings-modal")) closeSettings(); });
  document.getElementById("mobile-settings-tab-btn")?.addEventListener("click", openSettings);

  // Loot filter toggle
  document.getElementById("loot-filter-btn")?.addEventListener("click", () => {
    lootFilterActive = !lootFilterActive;
    lootKey = null; // force re-render
    if (game) render(JSON.parse(game.respond()));
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

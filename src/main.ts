import { GameState, type GameStateDict, VENTURE_UNLOCK_LEVEL, GUILD_HALL_COSTS, SKILL_DEFS } from "./engine.js";
import { qualityClass, autoSellThreshold, QUAL, qualityWeights, QUALITY_CLASSES, gearPower, type GearStats, type GearItemDict } from "./gear.js";
import { VERSION, CHANGELOG } from "./changelog.js";
import { CLASS_ABILITIES } from "./character.js";
import { parseAuthHash, getStoredToken, storeToken, clearToken, getLoginUrl, cloudLoad, cloudSave, getOrCreateSessionId } from "./cloud.js";

const CLASS_DESCS: Record<string, string> = {
  fighter: "Highest idle DPS. Each level-up multiplies damage by 1.2×.",
  rogue: "Gains +0.3 click damage every level. Rewards active play.",
  mage: "Gains +5% XP rate every level. Slow start, fast late-game.",
  paladin: "Tank/healer. 25% damage reduction at Lv5, heals party on kill at Lv10.",
  ranger: "Gains +0.2 click damage every level. 30% crit chance at Lv5, +60% DPS at Lv10.",
};

const GUILD_HALL_META: Record<string, { icon: string; name: string; desc: string }> = {
  companion_hall:      { icon: "🏰", name: "Companion Hall",   desc: "Unlock Party Slot IV (stack 1) and Slot V (stack 2) in the Prestige Shop." },
  expanded_armory:     { icon: "🗄", name: "Expanded Armory",  desc: "+2 loot chest capacity per stack (max 14)." },
  class_paladin:       { icon: "🛡", name: "Recruit: Paladin", desc: "Unlock Paladin as a recruitable class for companions." },
  class_ranger:        { icon: "🏹", name: "Recruit: Ranger",  desc: "Unlock Ranger as a recruitable class for companions." },
  skill_battle_cry:    { icon: "📯", name: "Battle Cry",       desc: "Fighter: ×2 party DPS for 15s. 2-min cooldown." },
  skill_shadow_strike: { icon: "🌑", name: "Shadow Strike",    desc: "Rogue: ×5 click damage for 8s. 45s cooldown." },
  skill_arcane_surge:  { icon: "⚡", name: "Arcane Surge",     desc: "Mage: ×3 DPS for 15s. 90s cooldown." },
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
};

const SAVE_KEY = "toddpocalypse-save";
const THEME_KEY = "toddpocalypse-theme";
const THEMES = ["grimdark", "arcane", "tavern"] as const;
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
let hoveredLootSlot: string | null = null;
const flashStartTimes = new Map<string, number>(); // "ci:slot" → ms timestamp when flash began

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
  renderLog(state);
  updatePrestigeButton(state);
  updateVentureButton(state);
  updateLifetimeStats(state);
  updateShopBadge(state);
  updateGuildTabVisibility(state);
  updatePrestigePanelVisibility(state);
}

/** Hides the Prestige panel until the player has reached floor 20 or has prestiged before. */
function updatePrestigePanelVisibility(state: GameStateDict): void {
  const prestigeUnlocked = state.highest_level >= 20 || state.total_prestiges > 0;
  const panel = document.getElementById("prestige-panel");
  if (panel) panel.classList.toggle("prestige-locked", !prestigeUnlocked);
}

/** Hides the Guild Hall tab/panel until floor 40 is reached or any guild upgrade is owned. */
function updateGuildTabVisibility(state: GameStateDict): void {
  const guildUnlocked =
    state.highest_level >= 40 ||
    Object.keys(state.guild_upgrades ?? {}).length > 0;

  // Desktop: hide/show the sidebar tab button
  const guildTab = document.querySelector<HTMLElement>('[data-stab="guild"]');
  if (guildTab) {
    const wasHidden = guildTab.hidden;
    guildTab.hidden = !guildUnlocked;
    if (!wasHidden && !guildUnlocked && guildTab.classList.contains("active")) {
      (document.querySelector<HTMLElement>('[data-stab="upgrades"]') as HTMLElement).click();
    }
  }

  // Mobile: hide/show the panel itself (tab-visible uses !important so we need guild-locked to beat it)
  const guildPanel = document.getElementById("guild-hall-panel");
  if (guildPanel) guildPanel.classList.toggle("guild-locked", !guildUnlocked);
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

/** Renders the vertical depth gauge showing current floor, personal best, and checkpoint markers. */
function renderDepthGauge(state: GameStateDict): void {
  const current = state.dungeon_level;
  const highest = state.highest_level;
  const maxDisplay = Math.max(highest + 3, 10);

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
      const classAbilities = CLASS_ABILITIES[c.character_class] ?? [];
      const abilitiesHtml = classAbilities.map(a => {
        const unlocked = c.abilities.includes(a.id);
        return unlocked
          ? `<span class="ability-badge unlocked" tabindex="0" data-tip="${a.desc}">${a.icon} ${a.name}</span>`
          : `<span class="ability-badge locked" tabindex="0" data-tip="Lv${a.level}: ${a.desc}">${a.icon} Lv${a.level}</span>`;
      }).join("");
      return `
<div class="char-card${leveledUp ? " levelup-flash" : ""}">
  <div class="char-header">
    <div>
      <div class="char-name">${c.name}</div>
      <div class="char-class">${c.character_class}</div>
    </div>
    <div class="char-dps">${c.dps.toFixed(1)} DPS</div>
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
  const newKey = loot.map((i) => i.slot + i.name).join("|") + "|" + JSON.stringify(state.auto_sell_qualities) + "|" + state.highest_level;
  if (newKey !== lootKey) {
    lootKey = newKey;

    const lootEl = $("loot-items");
    $("loot-count").textContent = loot.length ? `(${loot.length}/${state.loot_max})` : "";
    const equipAllBtn = document.querySelector<HTMLButtonElement>(".equip-all-btn");
    if (equipAllBtn) equipAllBtn.disabled = loot.length === 0;

    lootEl.innerHTML = loot.length === 0
      ? `<div class="loot-empty">No drops yet…</div>`
      : loot.map((item, i) => {
          const [tri, triCls] = lootTier(item, state.party);
          const qc = qualityClass(item.quality);
          const itemJson = encodeURIComponent(JSON.stringify(item));
          return `
<div class="loot-item" data-slot="${item.slot}" data-item="${itemJson}">
  <div class="loot-meta">
    <span class="loot-slot-badge">${item.slot_display}</span>
    <span class="loot-name ${qc}">${item.name}</span>
  </div>
  <div class="loot-actions">
    <span class="loot-dmg ${triCls || qc}">${tri}${formatStats(item.stats ?? { dps: item.damage })}</span>
    <button class="equip-btn" data-action="equip" data-idx="${i}">Equip</button>
    <button class="sell-btn"  data-action="sell"  data-idx="${i}">${item.sell_value}g</button>
  </div>
</div>`;
        }).join("");
  }

  const section = document.getElementById("auto-seller-section")!;
  section.hidden = !autoSellOwned;
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

const PRESTIGE_SHOP_META: Record<string, { icon: string; name: string; desc: string; max: number; guildReq?: number }> = {
  auto_seller:   { icon: "🤖", name: "Auto Seller",    desc: "Auto-sells checked quality tiers after each kill.", max: 1 },
  auto_equip:    { icon: "⚔", name: "Auto Equip",     desc: "Automatically equips loot upgrades after each kill.", max: 1 },
  auto_upgrade:  { icon: "📈", name: "Auto Upgrade",   desc: "Automatically buys the cheapest affordable stat upgrade after each kill.", max: 1 },
  party_slot_2:  { icon: "👤", name: "Party Slot II",  desc: "Add a 2nd party member (pick class).", max: 1 },
  party_slot_3:  { icon: "👥", name: "Party Slot III", desc: "Add a 3rd member. Requires Slot II.", max: 1 },
  party_slot_4:  { icon: "👥", name: "Party Slot IV",  desc: "Add a 4th member. Requires Slot III + Companion Hall.", max: 1, guildReq: 1 },
  party_slot_5:  { icon: "👥", name: "Party Slot V",   desc: "Add a 5th member. Requires Slot IV + Companion Hall II.", max: 1, guildReq: 2 },
  starting_gold: { icon: "💰", name: "Starting Gold",  desc: "+250g at the start of each run.", max: Infinity },
  xp_bonus:      { icon: "✨", name: "XP Bonus",       desc: "+10% XP gain for all party members.", max: Infinity },
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
  return `<div class="auto-seller-config">${rows}</div>`;
}

/** Renders the Prestige Shop item list, marking purchased one-time items and unaffordable items. */
function renderPrestigeShop(state: GameStateDict): void {
  const newKey = JSON.stringify(state.prestige_upgrades) + "|" + state.prestige_points + "|" + state.highest_level + "|" + JSON.stringify(state.auto_sell_qualities);
  if (newKey === prestigeKey) return;
  prestigeKey = newKey;

  const pts = state.prestige_points;
  $("prestige-points-display").textContent = pts === 1 ? "(1 pt)" : pts > 0 ? `(${pts} pts)` : "";

  const ups = state.prestige_upgrades as Record<string, number>;
  const guildUpgrades = state.guild_upgrades as Record<string, number>;
  const companionHall = guildUpgrades["companion_hall"] ?? 0;
  const PRESTIGE_COSTS_MAP: Record<string, number> = { auto_seller: 1, auto_equip: 2, auto_upgrade: 2, party_slot_2: 2, party_slot_3: 3, party_slot_4: 4, party_slot_5: 5, starting_gold: 1, xp_bonus: 1 };
  $("prestige-shop-items").innerHTML = Object.entries(PRESTIGE_SHOP_META).map(([type, meta]) => {
    const guildReq = meta.guildReq ?? 0;
    if (guildReq > 0 && companionHall < guildReq) return ""; // hidden until guild unlock
    const owned = ups[type] ?? 0;
    const cost = PRESTIGE_COSTS_MAP[type] ?? 1;
    const atMax = owned >= meta.max;
    const prereqMissing = (type === "party_slot_3" && !(ups["party_slot_2"] > 0))
      || (type === "party_slot_4" && !(ups["party_slot_3"] > 0))
      || (type === "party_slot_5" && !(ups["party_slot_4"] > 0));
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
  }).join("");
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
    btn.textContent = `⚔ Venture (need lv${VENTURE_UNLOCK_LEVEL})`;
  }
}

/** Renders Guild Hall upgrade cards with current stack count, gold cost, and description. */
function renderGuildHall(state: GameStateDict): void {
  const newKey = JSON.stringify(state.guild_upgrades) + "|" + Math.floor(state.gold);
  if (newKey === guildKey) return;
  guildKey = newKey;

  const owned = state.guild_upgrades as Record<string, number>;
  $("guild-hall-items").innerHTML = Object.entries(GUILD_HALL_META).map(([type, meta]) => {
    const stacks = owned[type] ?? 0;
    const costs = GUILD_HALL_COSTS[type];
    const atMax = stacks >= costs.length;
    const nextCost = atMax ? 0 : costs[stacks];
    const canAfford = !atMax && state.gold >= nextCost;
    const disabled = atMax || !canAfford;
    const stackLabel = costs.length > 1 ? (atMax ? ` (${stacks}/${costs.length})` : stacks > 0 ? ` (${stacks}/${costs.length})` : "") : atMax ? " ✓" : "";
    return `<div class="prestige-item">
      <div class="prestige-item-meta">
        <div class="prestige-item-name">${meta.icon} ${meta.name}${stackLabel}</div>
        <div class="prestige-item-desc">${meta.desc}</div>
      </div>
      <button class="guild-buy-btn" data-action="buy-guild" data-type="${type}" ${disabled ? "disabled" : ""}>${atMax ? "Owned" : nextCost.toLocaleString() + "g"}</button>
    </div>`;
  }).join("");
}

const SKILL_NAMES: Record<string, string> = {
  skill_battle_cry: "📯 Battle Cry",
  skill_shadow_strike: "🌑 Shadow Strike",
  skill_arcane_surge: "⚡ Arcane Surge",
};
const SKILL_COOLDOWNS: Record<string, number> = {
  skill_battle_cry: 120_000,
  skill_shadow_strike: 45_000,
  skill_arcane_surge: 90_000,
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
  const now = Date.now();
  const lastUsed = state.skill_cooldowns[skillId] ?? 0;
  const expiry = state.active_effects[skillId] ?? 0;
  const cooldownMs = SKILL_COOLDOWNS[skillId] ?? 60_000;
  const isActive = expiry > now;
  const elapsed = now - lastUsed;
  const onCooldown = lastUsed > 0 && elapsed < cooldownMs && !isActive;

  btn.textContent = SKILL_NAMES[skillId] ?? skillId;
  btn.disabled = onCooldown;
  btn.className = isActive ? "active" : "";

  if (onCooldown) {
    const pct = Math.min(100, (elapsed / cooldownMs) * 100);
    fill.style.width = pct + "%";
    bar.hidden = false;
  } else {
    bar.hidden = true;
  }
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

const PRESTIGE_COSTS: Record<string, number> = {
  auto_seller: 1, auto_equip: 2, auto_upgrade: 2, party_slot_2: 2, party_slot_3: 3, starting_gold: 1, xp_bonus: 1,
};

/** Shows notification badges on sidebar/mobile tabs when a Prestige or Guild item is affordable. */
function updateShopBadge(state: GameStateDict): void {
  const badge = document.getElementById("shop-tab-badge");
  if (!badge) return;
  const canBuyUpgrade = state.party.some(c => {
    const ups = state.upgrades[c.name];
    return ups && Object.values(ups).some(u => state.gold >= u.cost);
  });
  const ups = state.prestige_upgrades as Record<string, number>;
  const canBuyPrestige = Object.entries(PRESTIGE_COSTS).some(([type, cost]) => {
    const owned = ups[type] ?? 0;
    const atMax = owned >= (PRESTIGE_SHOP_META[type]?.max ?? 1);
    const prereqMissing = type === "party_slot_3" && !(ups["party_slot_2"] > 0);
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
function renderLog(state: GameStateDict): void {
  $("combat-log").innerHTML = [...state.log]
    .reverse()
    .map((l) => `<div class="log-line">${l}</div>`)
    .join("");
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
  return `
    <span class="tt-name ${qc}">${item.name}</span>
    <div class="tt-subtitle">${item.slot_display} · Floor ${item.dungeon_level}</div>
    <div class="tt-divider"></div>
    <div class="tt-stats">${statRows || '<div class="tt-stat-row"><span class="tt-stat-label">No stats</span></div>'}</div>
    <div class="tt-divider"></div>
    <div class="tt-sell">Sell: ${item.sell_value}g</div>
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
  settings: ["settings-panel"],
};

const SIDEBAR_TAB_PANELS: Record<string, string[]> = {
  upgrades: ["upgrades-panel"],
  loot:     ["loot-panel"],
  prestige: ["prestige-panel"],
  guild:    ["guild-hall-panel"],
  log:      ["log-panel"],
  settings: ["settings-panel"],
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

function initItemTooltip(): void {
  const tooltip = document.getElementById("item-tooltip")!;
  let currentTarget: HTMLElement | null = null;

  function parseItemData(el: HTMLElement): GearItemDict | null {
    const raw = el.dataset.item;
    if (!raw) return null;
    try { return JSON.parse(decodeURIComponent(raw)) as GearItemDict; }
    catch { return null; }
  }

  function show(el: HTMLElement, item: GearItemDict): void {
    tooltip.innerHTML = buildTooltipHTML(item);
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
    const el = (e.target as HTMLElement).closest<HTMLElement>(".gear-row.filled, .loot-item");
    if (!el || el === currentTarget) return;
    const item = parseItemData(el);
    if (!item) return;
    currentTarget = el;
    show(el, item);
    position(e as MouseEvent);
  });

  document.addEventListener("mouseout", (e) => {
    if (!currentTarget) return;
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && currentTarget.contains(relatedTarget)) return;
    if (relatedTarget?.closest(".gear-row.filled, .loot-item") !== currentTarget) hide();
  });

  document.addEventListener("click", () => hide());
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

  // Try to load from cloud; fall back to localStorage
  const cloudData = await cloudLoad(token);
  if (cloudData) {
    try {
      const dict = JSON.parse(cloudData) as GameStateDict;
      localStorage.setItem(SAVE_KEY, cloudData); // keep local in sync
      return dict;
    } catch {
      return null;
    }
  }
  return null;
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
  render(JSON.parse(game.respond()));
  setInterval(() => { call("tick", 0.1); saveGame(); }, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileTabs();
  initSidebarTabs();
  initItemTooltip();

  document.querySelectorAll<HTMLElement>(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.theme) applyTheme(btn.dataset.theme as Theme);
    });
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
  $("hard-reset-yes").addEventListener("click", () => {
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
    else if (action === "venture") {
      if (confirm("Venture to a new dungeon? Your companions will stay behind and earn gold. You start fresh with just your class.")) {
        call("venture");
      }
    }
    else if (action === "toggle-auto-sell") {
      call("toggleAutoSellQuality", btn.dataset.quality!);
    }
  });
});

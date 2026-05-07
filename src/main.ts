import { GameState, type GameStateDict } from "./engine.js";
import { qualityClass } from "./gear.js";
import { VERSION, CHANGELOG } from "./changelog.js";

const CLASS_DESCS: Record<string, string> = {
  fighter: "Highest idle DPS. Each level-up multiplies damage by 1.2×.",
  rogue: "Gains +0.3 click damage every level. Rewards active play.",
  mage: "Gains +5% XP rate every level. Slow start, fast late-game.",
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

let game: GameState | null = null;
let lootKey: string | null = null;
let upgradeKey: string | null = null;
let partyKey: string | null = null;
let prestigeKey: string | null = null;

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el;
}

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

import { KILLS_PER_LEVEL } from "./engine.js";

function render(state: GameStateDict): void {
  const enemy = state.enemy;
  $("enemy-name").textContent = enemy.name;
  $("enemy-level").textContent = `Level ${enemy.level}`;
  const pct = Math.max(0, (enemy.hp / enemy.max_hp) * 100);
  ($("enemy-hp-bar") as HTMLElement).style.width = pct + "%";
  $("enemy-hp-text").textContent = `${Math.ceil(enemy.hp)} / ${enemy.max_hp}`;

  $("stat-gold").textContent = String(state.gold);
  $("stat-level").textContent = String(state.dungeon_level);
  $("stat-best").textContent = String(state.highest_level);
  $("stat-kills").textContent = String(state.kills);
  $("stat-deaths").textContent = String(state.deaths);

  renderFloorProgress(state);
  renderDepthGauge(state);
  renderParty(state);
  renderLoot(state);
  renderUpgrades(state);
  renderPrestigeShop(state);
  renderLog(state);
  updatePrestigeButton(state);
  updateLifetimeStats(state);
}

function renderFloorProgress(state: GameStateDict): void {
  const isBoss = state.enemy.is_boss;
  const left = state.monsters_left;
  const done = KILLS_PER_LEVEL - left;

  if (isBoss) {
    $("monsters-left-text").textContent = "★ BOSS FIGHT ★";
    $("monsters-left-text").className = "boss-text";
  } else {
    $("monsters-left-text").textContent =
      left === 1 ? "1 monster until boss" : `${left} monsters until boss`;
    $("monsters-left-text").className = "";
  }

  const row = $("floor-pip-row");
  row.innerHTML = Array.from({ length: KILLS_PER_LEVEL }, (_, i) =>
    `<div class="floor-pip${i < done || isBoss ? " done" : ""}"></div>`
  ).join("")
    + (isBoss ? `<div class="floor-pip boss-pip">★</div>` : "");
}

function renderDepthGauge(state: GameStateDict): void {
  const current = state.dungeon_level;
  const highest = state.highest_level;
  const maxDisplay = Math.max(highest + 3, 10);

  $("depth-label-top").textContent = "▲ 1";
  $("depth-label-bottom").textContent = `▼ ${maxDisplay}`;

  const track = $("depth-track");
  const trackH = track.clientHeight || 200;

  const toPercent = (level: number) =>
    ((level - 1) / (maxDisplay - 1)) * (trackH - 12);

  const currentEl = $("depth-current-marker");
  currentEl.style.top = toPercent(current) + "px";
  $("depth-current-label").textContent = `${current}`;

  $("depth-fill").style.height = (toPercent(current) + 10) + "px";

  const highestEl = $("depth-highest-marker");
  highestEl.style.top = toPercent(highest) + "px";
  $("depth-highest-label").textContent = highest > current ? `${highest}` : "";
}

function renderParty(state: GameStateDict): void {
  const prevPartyKey = partyKey;
  const newKey = JSON.stringify(
    state.party.map((c) => [c.dps, c.level, c.xp, c.health, JSON.stringify(c.equipment)]),
  );
  if (newKey === partyKey) return;
  const prevLevels = prevPartyKey
    ? (JSON.parse(prevPartyKey) as [number, number][]).map(([, lvl]) => lvl)
    : state.party.map(() => 0);
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
            return `<div class="gear-row filled">
              <span class="gear-icon">${SLOT_ICONS[slot]}</span>
              <span class="gear-name ${qc}">${item.name}</span>
              <span class="gear-bonus ${qc}">+${item.damage}</span>
            </div>`;
          }
          return `<div class="gear-row empty">
            <span class="gear-icon">${SLOT_ICONS[slot]}</span>
            <span class="gear-slot-label">${slotLabel(slot)}</span>
          </div>`;
        })
        .join("");
      const hpPct = Math.max(0, Math.round((c.health / c.max_health) * 100));
      const hpLow = hpPct <= 25;
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
}

function renderLoot(state: GameStateDict): void {
  const loot = state.loot_pool;
  const newKey = loot.map((i) => i.slot + i.name).join("|");
  if (newKey === lootKey) return;
  lootKey = newKey;

  const lootEl = $("loot-items");
  $("loot-count").textContent = loot.length ? `(${loot.length}/8)` : "";
  const equipAllBtn = document.querySelector<HTMLButtonElement>(".equip-all-btn");
  if (equipAllBtn) equipAllBtn.disabled = loot.length === 0;

  if (loot.length === 0) {
    lootEl.innerHTML = `<div class="loot-empty">No drops yet…</div>`;
    return;
  }
  lootEl.innerHTML = loot
    .map((item, i) => {
      const [tri, triCls] = lootTier(item, state.party);
      const qc = qualityClass(item.quality);
      return `
<div class="loot-item">
  <div class="loot-meta">
    <span class="loot-slot-badge">${item.slot_display}</span>
    <span class="loot-name ${qc}">${item.name}</span>
  </div>
  <div class="loot-actions">
    <span class="loot-dmg ${triCls || qc}">${tri}+${item.damage}</span>
    <button class="equip-btn" data-action="equip" data-idx="${i}">Equip</button>
    <button class="sell-btn"  data-action="sell"  data-idx="${i}">${item.sell_value}g</button>
  </div>
</div>`;
    })
    .join("");
}

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

const PRESTIGE_SHOP_META: Record<string, { icon: string; name: string; desc: string; max: number }> = {
  auto_seller:   { icon: "🤖", name: "Auto Seller",    desc: "Sells lowest-quality loot every 10s.", max: 1 },
  party_slot_2:  { icon: "👤", name: "Party Slot II",  desc: "Add a 2nd party member (pick class).", max: 1 },
  party_slot_3:  { icon: "👥", name: "Party Slot III", desc: "Add a 3rd member. Requires Slot II.", max: 1 },
  starting_gold: { icon: "💰", name: "Starting Gold",  desc: "+250g at the start of each run.", max: Infinity },
  xp_bonus:      { icon: "✨", name: "XP Bonus",       desc: "+10% XP gain for all party members.", max: Infinity },
};

function renderPrestigeShop(state: GameStateDict): void {
  const newKey = JSON.stringify(state.prestige_upgrades) + "|" + state.prestige_points;
  if (newKey === prestigeKey) return;
  prestigeKey = newKey;

  const pts = state.prestige_points;
  $("prestige-points-display").textContent = pts === 1 ? "(1 pt)" : pts > 0 ? `(${pts} pts)` : "";

  const ups = state.prestige_upgrades as Record<string, number>;
  $("prestige-shop-items").innerHTML = Object.entries(PRESTIGE_SHOP_META).map(([type, meta]) => {
    const owned = ups[type] ?? 0;
    const cost = ({ auto_seller: 1, party_slot_2: 2, party_slot_3: 3, starting_gold: 1, xp_bonus: 1 } as Record<string, number>)[type];
    const atMax = owned >= meta.max;
    const prereqMissing = type === "party_slot_3" && !(ups["party_slot_2"] > 0);
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

function updateLifetimeStats(state: GameStateDict): void {
  const ltKills = document.getElementById("lt-kills");
  const ltDeaths = document.getElementById("lt-deaths");
  const ltBest = document.getElementById("lt-best");
  const ltPrestiges = document.getElementById("lt-prestiges");
  if (ltKills) ltKills.textContent = String(state.lifetime_kills);
  if (ltDeaths) ltDeaths.textContent = String(state.lifetime_deaths);
  if (ltBest) ltBest.textContent = String(state.lifetime_best_level);
  if (ltPrestiges) ltPrestiges.textContent = String(state.total_prestiges);
}

function renderLog(state: GameStateDict): void {
  $("combat-log").innerHTML = [...state.log]
    .reverse()
    .map((l) => `<div class="log-line">${l}</div>`)
    .join("");
}

function appendLog(msg: string): void {
  $("combat-log").insertAdjacentHTML(
    "afterbegin",
    `<div class="log-line" style="color:var(--danger)">${msg}</div>`,
  );
}

// ▲ green: beats every party member's equip in this slot
// ▼ red:   loses to the worst equipped item and nobody has an empty slot
function lootTier(
  item: GameStateDict["loot_pool"][number],
  party: GameStateDict["party"],
): [string, string] {
  const damages = party.map((c) => {
    const eq = c.equipment[item.slot as keyof typeof c.equipment];
    return eq ? eq.damage : 0;
  });
  const max = Math.max(...damages);
  const min = Math.min(...damages);
  if (item.damage > max) return ["▲", "ind-up"];
  if (min > 0 && item.damage < min) return ["▼", "ind-down"];
  return ["", ""];
}

function slotLabel(slot: string): string {
  return slot.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const TAB_PANELS: Record<string, string[]> = {
  combat: ["enemy-panel"],
  party:  ["party-panel"],
  shop:   ["upgrades-panel", "loot-panel", "prestige-panel"],
  log:    ["log-panel"],
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

function updateClassDesc(): void {
  const cls = (document.querySelector(".class-btn.selected") as HTMLElement | null)?.dataset.class ?? "fighter";
  $("class-desc").textContent = CLASS_DESCS[cls] ?? "";
}

function openPartyClassModal(slotType: string): void {
  const modal = $("party-class-modal");
  const picker = $("party-class-picker");
  const desc = $("party-class-desc");

  picker.querySelectorAll(".class-btn").forEach((b) => b.classList.remove("selected"));
  (picker.querySelector(".class-btn") as HTMLElement)?.classList.add("selected");
  const firstClass = (picker.querySelector(".class-btn") as HTMLElement)?.dataset.class ?? "fighter";
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

function saveGame(): void {
  if (game) localStorage.setItem(SAVE_KEY, game.respond());
}

function loadSave(): GameStateDict | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameStateDict) : null;
  } catch {
    return null;
  }
}

function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

function startGame(name: string, characterClass: string): void {
  $("creation-overlay").style.display = "none";
  deleteSave();
  game = new GameState(name, characterClass);
  render(JSON.parse(game.respond()));
  setInterval(() => { call("tick", 0.1); saveGame(); }, 100);
}

function continueGame(saved: GameStateDict): void {
  $("creation-overlay").style.display = "none";
  game = GameState.fromDict(saved);
  render(JSON.parse(game.respond()));
  setInterval(() => { call("tick", 0.1); saveGame(); }, 100);
}

document.addEventListener("DOMContentLoaded", () => {
  initMobileTabs();

  $("stats-btn").addEventListener("click", () => { $("stats-modal").classList.add("open"); });
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

  $("version-btn").addEventListener("click", () => {
    $("changelog-modal").classList.add("open");
  });
  $("changelog-close").addEventListener("click", () => {
    $("changelog-modal").classList.remove("open");
  });
  $("changelog-modal").addEventListener("click", (e) => {
    if (e.target === $("changelog-modal")) $("changelog-modal").classList.remove("open");
  });

  const saved = loadSave();

  if (saved) {
    const hero = saved.party[0];
    $("continue-info").textContent =
      `${hero.name} the ${hero.character_class} · Lvl ${hero.level} · Dungeon ${saved.dungeon_level}`;
    $("save-section").style.display = "flex";
    $("new-game-section").style.display = "none";
  } else {
    $("save-section").style.display = "none";
    $("new-game-section").style.display = "flex";
  }

  $("creation-overlay").style.display = "flex";
  updateClassDesc();

  $("continue-btn")?.addEventListener("click", () => {
    if (saved) continueGame(saved);
  });

  $("new-game-btn")?.addEventListener("click", () => {
    $("save-section").style.display = "none";
    $("new-game-section").style.display = "flex";
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
      if (type === "party_slot_2" || type === "party_slot_3") {
        openPartyClassModal(type);
      } else {
        call("buyPrestigeUpgrade", type);
      }
    }
  });
});

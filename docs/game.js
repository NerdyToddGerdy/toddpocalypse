const CLASS_DESCS = {
    fighter: "High base DPS. Hits hard from the start.",
    rogue:   "Balanced DPS. Bonuses from click damage.",
    mage:    "Low base DPS. Excels with XP-rate upgrades.",
};

const PY_FILES = [
    ["Character/__init__.py", "Character"],
    ["Gear/__init__.py", "Gear"],
    ["Inventory/__init__.py", "Inventory"],
    ["Party/__init__.py", "Party"],
    ["game/__init__.py", "game"],
    ["game/dungeon.py", "game"],
    ["game/engine.py", "game"],
];

const SLOT_ICONS = {
    main_hand: "🗡", off_hand: "🛡", helmet: "⛑", chest: "🧥",
    gloves: "🧤", legs: "👖", shoes: "👢", ring1: "💍", ring2: "💍",
};

const UPGRADE_LABELS = {
    dps:   { icon: "⚔", label: "DPS" },
    xp:    { icon: "✨", label: "XP Rate" },
    click: { icon: "👆", label: "Click Dmg" },
};

let pyodide = null;
let gameState = null;

// Cache keys — sections only re-render when their data changes
let _lootKey = null;
let _upgradeKey = null;
let _partyKey = null;

// Call a Python method that returns a JSON string, parse it, render it.
function py(method, ...args) {
    try {
        const jsonStr = gameState[method](...args);
        const state = JSON.parse(jsonStr);
        render(state);
        return state;
    } catch (e) {
        appendLog("⚠ " + (e.message || String(e)));
        console.error(method, e);
    }
}

async function loadPyodide_() {
    setStatus("Loading Python runtime…");
    pyodide = await loadPyodide();
    setStatus("Loading game modules…");

    const dirs = new Set(PY_FILES.map(([, d]) => d));
    for (const dir of dirs) {
        pyodide.runPython(`import os; os.makedirs("${dir}", exist_ok=True)`);
    }

    for (const [filePath] of PY_FILES) {
        const url = filePath;
        const text = await fetch(url, { cache: "no-store" }).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
            return r.text();
        });
        pyodide.FS.writeFile(filePath, text);
    }

    await pyodide.runPythonAsync(`
import sys, os
cwd = os.getcwd()
if cwd not in sys.path:
    sys.path.insert(0, cwd)
from game.engine import GameState
`);

    setStatus(null);
    showCreation();
}

function showCreation() {
    document.getElementById("creation-overlay").style.display = "flex";
    updateClassDesc();
}

function updateClassDesc() {
    const cls = document.querySelector(".class-btn.selected")?.dataset.class || "fighter";
    document.getElementById("class-desc").textContent = CLASS_DESCS[cls] || "";
}

function startGame(name, characterClass) {
    document.getElementById("creation-overlay").style.display = "none";
    const safeName = name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    pyodide.runPython(`gs = GameState("${safeName}", "${characterClass}")`);
    gameState = pyodide.globals.get("gs");
    document.getElementById("attack-btn").disabled = false;
    render(JSON.parse(gameState._respond()));
    setInterval(tick, 100);
}

function tick() {
    py("tick", 0.1);
}

function render(state) {
    // Enemy
    const enemy = state.enemy;
    document.getElementById("enemy-name").textContent = enemy.name;
    document.getElementById("enemy-level").textContent = `Level ${enemy.level}`;
    const pct = Math.max(0, (enemy.hp / enemy.max_hp) * 100);
    document.getElementById("enemy-hp-bar").style.width = pct + "%";
    document.getElementById("enemy-hp-text").textContent =
        `${Math.ceil(enemy.hp)} / ${enemy.max_hp}`;

    // Stats
    document.getElementById("stat-gold").textContent = state.gold;
    document.getElementById("stat-level").textContent = state.dungeon_level;
    document.getElementById("stat-kills").textContent = state.kills;

    // Party cards — only re-render when DPS, level, XP, or gear changes
    const prevPartyKey = _partyKey;
    const partyKey = JSON.stringify(state.party.map(c =>
        [c.dps, c.level, c.xp, JSON.stringify(c.equipment)]));
    if (partyKey !== _partyKey) {
        const prevLevels = prevPartyKey
            ? JSON.parse(prevPartyKey).map(([,lvl]) => lvl)
            : state.party.map(() => 0);
        _partyKey = partyKey;
        const partyEl = document.getElementById("party-cards");
        partyEl.innerHTML = "";
        for (const [ci, c] of state.party.entries()) {
            const xpPct = Math.round((c.xp / c.xp_to_next) * 100);
            const leveledUp = c.level > (prevLevels[ci] ?? 0);
            const gearRows = Object.entries(c.equipment).map(([slot, item]) => {
                if (item) {
                    return `<div class="gear-row filled">
                        <span class="gear-icon">${SLOT_ICONS[slot]}</span>
                        <span class="gear-name">${item.name}</span>
                        <span class="gear-bonus">+${item.damage}</span>
                    </div>`;
                }
                return `<div class="gear-row empty">
                    <span class="gear-icon">${SLOT_ICONS[slot]}</span>
                    <span class="gear-slot-label">${slotLabel(slot)}</span>
                </div>`;
            }).join("");
            partyEl.innerHTML += `
<div class="char-card${leveledUp ? " levelup-flash" : ""}">
  <div class="char-header">
    <div>
      <div class="char-name">${c.name}</div>
      <div class="char-class">${c.character_class}</div>
    </div>
    <div class="char-dps">${c.dps.toFixed(1)} DPS</div>
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
        }
    }

    // Loot pool — only re-render when pool contents change
    const loot = state.loot_pool;
    const lootKey = loot.map(i => i.slot + i.name).join("|");
    if (lootKey !== _lootKey) {
        _lootKey = lootKey;
        const lootEl = document.getElementById("loot-items");
        document.getElementById("loot-count").textContent = loot.length ? `(${loot.length}/8)` : "";
        document.querySelector(".equip-all-btn").disabled = loot.length === 0;
        if (loot.length === 0) {
            lootEl.innerHTML = `<div class="loot-empty">No drops yet…</div>`;
        } else {
            lootEl.innerHTML = loot.map((item, i) => {
                const [tri, triCls] = lootTier(item, state.party);
                return `
<div class="loot-item">
  <div class="loot-meta">
    <span class="loot-slot-badge">${item.slot_display}</span>
    <span class="loot-name">${item.name}</span>
  </div>
  <div class="loot-actions">
    <span class="loot-dmg ${triCls}">${tri}+${item.damage}</span>
    <button class="equip-btn" data-action="equip" data-idx="${i}">Equip</button>
    <button class="sell-btn"  data-action="sell"  data-idx="${i}">${item.sell_value}g</button>
  </div>
</div>`;
            }).join("");
        }
    }

    // Upgrades — only re-render when levels or affordability changes
    const upgradeKey = JSON.stringify(state.upgrades) + "|" + state.gold;
    if (upgradeKey !== _upgradeKey) {
        _upgradeKey = upgradeKey;
        const upgradeEl = document.getElementById("upgrade-cards");
        upgradeEl.innerHTML = state.party.map(c => {
            const ups = state.upgrades[c.name];
            const rows = Object.entries(ups).map(([utype, u]) => {
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
            }).join("");
            return `<div class="upgrade-card">
                <div class="upgrade-char-name">${c.name}</div>
                ${rows}
            </div>`;
        }).join("");
    }

    // Log
    const logEl = document.getElementById("combat-log");
    logEl.innerHTML = [...state.log].reverse()
        .map(l => `<div class="log-line">${l}</div>`).join("");
}

// --- Event delegation: one listener covers all dynamic buttons ---

document.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]");
    if (!btn || !gameState) return;
    const action = btn.dataset.action;
    if (action === "equip")     py("equip_loot",  parseInt(btn.dataset.idx));
    if (action === "sell")      py("sell_loot",   parseInt(btn.dataset.idx));
    if (action === "upgrade")   py("buy_upgrade", btn.dataset.char, btn.dataset.type);
    if (action === "attack")    py("click");
    if (action === "equip-all") py("equip_all");
});

// --- Helpers ---

function appendLog(msg) {
    const logEl = document.getElementById("combat-log");
    if (!logEl) return;
    logEl.insertAdjacentHTML("afterbegin", `<div class="log-line" style="color:var(--danger)">${msg}</div>`);
}

// Returns [triangle symbol, css class] comparing item to all party equipment in that slot.
// ▲ green: beats the best equipped item (upgrade for everyone)
// ▼ red:   loses to the worst equipped item and nobody has an empty slot (junk for all)
function lootTier(item, party) {
    const damages = party.map(c => {
        const eq = c.equipment[item.slot];
        return eq ? eq.damage : 0;
    });
    const max = Math.max(...damages);
    const min = Math.min(...damages);
    if (item.damage > max) return ["▲", "ind-up"];
    if (min > 0 && item.damage < min) return ["▼", "ind-down"];
    return ["", ""];
}

function slotLabel(slot) {
    return slot.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function setStatus(msg) {
    const el = document.getElementById("loading-overlay");
    const txt = document.getElementById("loading-text");
    if (msg) { el.style.display = "flex"; txt.textContent = msg; }
    else { el.style.display = "none"; }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("attack-btn").dataset.action = "attack";

    // Class picker
    document.getElementById("class-picker").addEventListener("click", e => {
        const btn = e.target.closest(".class-btn");
        if (!btn) return;
        document.querySelectorAll(".class-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        updateClassDesc();
    });

    // Start button
    document.getElementById("start-btn").addEventListener("click", () => {
        const raw = document.getElementById("char-name-input").value.trim();
        const name = raw || "Hero";
        const cls  = document.querySelector(".class-btn.selected")?.dataset.class || "fighter";
        startGame(name, cls);
    });

    // Allow Enter to submit from name field
    document.getElementById("char-name-input").addEventListener("keydown", e => {
        if (e.key === "Enter") document.getElementById("start-btn").click();
    });

    loadPyodide_().catch(e => {
        setStatus("Failed to load: " + e.message);
        console.error(e);
    });
});

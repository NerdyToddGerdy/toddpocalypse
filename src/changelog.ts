/** Current game version string, displayed in the footer version button. */
export const VERSION = "v2.6.29";

/** A single version's release notes. */
export interface ChangelogEntry {
  /** Semantic version tag (e.g. "v2.6.0"). */
  version: string;
  /** ISO 8601 release date (YYYY-MM-DD). */
  date: string;
  /** Bullet-point list of changes in this release. */
  changes: string[];
}

/** Full changelog ordered newest-first, rendered in the changelog modal. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v2.6.29",
    date: "2026-05-12",
    changes: [
      "Fix: Sell All button styled to match the game theme (gold outline)",
    ],
  },
  {
    version: "v2.6.28",
    date: "2026-05-12",
    changes: [
      "Sell All button in the Loot panel — sells every item in one click",
    ],
  },
  {
    version: "v2.6.27",
    date: "2026-05-12",
    changes: [
      "Fix: session-conflict banner now actually hides — CSS display:flex was overriding the hidden attribute",
    ],
  },
  {
    version: "v2.6.26",
    date: "2026-05-12",
    changes: [
      "Mobile: depth gauge now shows as a fixed left strip, visible alongside all tabs",
    ],
  },
  {
    version: "v2.6.25",
    date: "2026-05-12",
    changes: [
      "Depth gauge moved to the left of the main content area with a 'Depth' label above it",
    ],
  },
  {
    version: "v2.6.24",
    date: "2026-05-12",
    changes: [
      "Hero stat card: portrait now fills the full width edge-to-edge at the top, above all text",
    ],
  },
  {
    version: "v2.6.23",
    date: "2026-05-12",
    changes: [
      "Fix: hero portraits now show the correct character (switched from sprite sheet to individual files)",
      "Hero portrait now appears in the hero stat card popup",
    ],
  },
  {
    version: "v2.6.22",
    date: "2026-05-12",
    changes: [
      "Hero card redesign: larger portrait on the right, name/class/DPS stacked on the left",
    ],
  },
  {
    version: "v2.6.21",
    date: "2026-05-12",
    changes: [
      "Hero portraits updated to new artwork — all 5 classes in a unified style",
    ],
  },
  {
    version: "v2.6.20",
    date: "2026-05-12",
    changes: [
      "Settings: added About section explaining the AI-assisted development origin of the game",
    ],
  },
  {
    version: "v2.6.19",
    date: "2026-05-12",
    changes: [
      "Paladin and Ranger now have their own pixel-art portraits on hero cards",
    ],
  },
  {
    version: "v2.6.18",
    date: "2026-05-12",
    changes: [
      "Hero cards now display a pixel-art portrait for each class (fighter, rogue, mage; paladin shares fighter, ranger shares rogue)",
    ],
  },
  {
    version: "v2.6.17",
    date: "2026-05-12",
    changes: [
      "Favicon icon now appears next to the Toddpocalypse title in the header",
    ],
  },
  {
    version: "v2.6.16",
    date: "2026-05-12",
    changes: [
      "Desktop: hero cards now display in a 2-column grid instead of a single expanding row",
    ],
  },
  {
    version: "v2.6.15",
    date: "2026-05-12",
    changes: [
      "Added pixel-art favicon (flaming skull warrior) — shows in browser tabs, bookmarks, and on iOS home screen",
    ],
  },
  {
    version: "v2.6.14",
    date: "2026-05-12",
    changes: [
      "Fix: session-conflict banner now dismisses immediately when Set Active Device succeeds — was lingering due to a racing periodic save re-showing it",
    ],
  },
  {
    version: "v2.6.13",
    date: "2026-05-12",
    changes: [
      "Fix: Set Active Device works again — force-claim now uses a query parameter instead of X-Force-Session header, which was blocked by API Gateway CORS",
    ],
  },
  {
    version: "v2.6.12",
    date: "2026-05-12",
    changes: [
      "Fix: Set Active Device now actually bypasses the session lock — previously sent the wrong session ID after reset, causing an immediate 409 conflict",
    ],
  },
  {
    version: "v2.6.11",
    date: "2026-05-12",
    changes: [
      "Fix: Set Active Device no longer fails with a connection error — removes the undeployed X-Force-Session header that blocked the browser CORS preflight",
      "Set Active Device now shows distinct messages: success, 'other device still active (try in 90s)', or actual connection failure",
    ],
  },
  {
    version: "v2.6.10",
    date: "2026-05-12",
    changes: [
      "Mobile: tap any ability badge in a hero's card to open a bottom sheet showing the skill name, unlock status, and description",
    ],
  },
  {
    version: "v2.6.9",
    date: "2026-05-12",
    changes: [
      "Set Active Device button: override a session conflict and claim this device as the primary saver — appears in Settings and in the conflict banner",
      "Load Cloud Save button: pull the latest DynamoDB save to this device without waiting for the next auto-sync",
    ],
  },
  {
    version: "v2.6.8",
    date: "2026-05-11",
    changes: [
      "Hover a hero's name or 'Your Party' to see a stat card — DPS, HP, click damage, defense, crit, gold, lifesteal, haste, XP bonus, and unlocked abilities",
      "Tapping a hero's name on mobile opens the same card as a bottom sheet",
    ],
  },
  {
    version: "v2.6.7",
    date: "2026-05-11",
    changes: [
      "Prestige: Smart Seller (4pt) — automatically checks new quality tiers in the Auto Seller as they unlock while climbing floors. Requires Auto Seller.",
    ],
  },
  {
    version: "v2.6.6",
    date: "2026-05-11",
    changes: [
      "Prestige shop: Starting Gold and XP Bonus now cost 1 more prestige point per stack already owned (1pt, 2pt, 3pt, …)",
    ],
  },
  {
    version: "v2.6.5",
    date: "2026-05-11",
    changes: [
      "Dream drops — the two quality tiers above the current floor maximum can now drop at ~1% and ~0.5% chance respectively",
    ],
  },
  {
    version: "v2.6.4",
    date: "2026-05-11",
    changes: [
      "Item card tooltip — hover any loot drop or equipped item to see a detailed stat breakdown",
      "Sub-common items (broken/worn/crude/poor) now always roll exactly 1 stat; secondary bonuses start at Common quality",
    ],
  },
  {
    version: "v2.6.3",
    date: "2026-05-11",
    changes: [
      "Multi-stat gear system — items now roll 1–3 stats (DPS, HP, Click, Defense, Crit, Gold, Lifesteal, Haste, XP) based on quality tier and slot type",
      "4 new character stats: Crit Chance (per-tick double damage), Gold Find (% more gold from bosses), Lifesteal (heal on damage dealt), Haste (DPS rate multiplier)",
      "Loot display now shows all stat bonuses instead of a single damage number",
      "Gear comparison (▲/▼) uses normalized power score across all stat types",
      "Backward-compatible: old saves with single-damage items migrate automatically",
    ],
  },
  {
    version: "v2.6.2",
    date: "2026-05-11",
    changes: [
      "Mobile: party HP and DPS now shown in the header stats bar",
      "Mobile: Lifetime Stats and Changelog accessible from Settings tab",
      "Mobile: enemy panel compacted — smaller name, HP text overlaid on bar, floor progress in 1-2 rows",
      "Mobile: unified scroll for shop tab (upgrades + prestige scroll as one page)",
    ],
  },
  {
    version: "v2.6.1",
    date: "2026-05-11",
    changes: [
      "Single-session enforcement — only one device can cloud-save at a time",
      "A warning banner appears if your game is already open elsewhere; it clears automatically when the other session expires (90 seconds of inactivity)",
    ],
  },
  {
    version: "v2.6.0",
    date: "2026-05-11",
    changes: [
      "Cloud save — sign in with Google to sync your save across devices",
      "Save writes to AWS DynamoDB on every autosave tick when signed in",
      "Cloud save loads automatically on page load; falls back to localStorage if offline or signed out",
      "Sign in / Sign out available in Settings tab",
    ],
  },
  {
    version: "v2.5.2",
    date: "2026-05-11",
    changes: [
      "Save auto-loads on page refresh — no more 'Continue' button required; upgrades and loot now persist across reloads",
      "Settings panel no longer bleeds into other sidebar tabs on desktop",
    ],
  },
  {
    version: "v2.5.1",
    date: "2026-05-11",
    changes: [
      "Three fantasy themes selectable in Settings: Grimdark, Arcane, Tavern",
      "Grimdark: smoldering charcoal + blood-red + UnifrakturMaguntia font",
      "Arcane: deep indigo + hammered gold + Cinzel Decorative font",
      "Tavern: dark walnut + lantern amber + Philosopher font",
      "All themes add: ornate inner panel borders, decorative flanking lines on section headers, subtle noise texture, gold title glow",
      "Theme persists across page reloads",
    ],
  },
  {
    version: "v2.5.0",
    date: "2026-05-11",
    changes: [
      "Settings tab added to desktop sidebar and mobile nav",
      "Hard Reset option in Settings — two-step confirmation before wiping save data",
      "Mobile: enemy panel fixed to bottom of screen so the attack button is always in thumb reach",
      "Mobile: loot section appears above party section on the combat tab",
      "Mobile: Prestige Shop hidden until floor 20; Guild Hall hidden until floor 40",
      "Guild Hall tab unlock condition corrected to floor 40 (venture floor)",
    ],
  },
  {
    version: "v2.4.9",
    date: "2026-05-08",
    changes: [
      "Guild Hall tab is hidden on a new game — unlocks after your first prestige",
    ],
  },
  {
    version: "v2.4.8",
    date: "2026-05-08",
    changes: [
      "Mythic+ glow intensity now escalates by tier — Mythic is subtle, Ancient/Celestial/Void each add more layers and wider spread",
      "Divine pulses between bright and blinding on a 2s cycle",
    ],
  },
  {
    version: "v2.4.7",
    date: "2026-05-08",
    changes: [
      "Gear slots flash gold for 2 seconds when an item is replaced — blinks 3 times so the swap is easy to spot",
      "Mythic, Ancient, Celestial, Void, and Divine quality names now glow with a tier-colored text-shadow",
    ],
  },
  {
    version: "v2.4.6",
    date: "2026-05-08",
    changes: [
      "Guild Hall split into its own sidebar tab — sidebar now has Upgrades / Loot / Prestige / Guild / Log",
      "Shop tab renamed to Prestige",
      "Prestige and Guild tabs each have their own notification badge",
    ],
  },
  {
    version: "v2.4.5",
    date: "2026-05-08",
    changes: [
      "Auto Seller tier checkboxes moved from the Shop tab to the Loot tab — appears below the loot chest once Auto Seller is purchased",
    ],
  },
  {
    version: "v2.4.4",
    date: "2026-05-08",
    changes: [
      "Desktop sidebar replaced with a 4-tab card: Upgrades / Loot / Shop / Log",
      "Shop tab covers Prestige Shop + Guild Hall; badge appears when either has an affordable item",
      "Mobile layout unchanged — existing bottom tab bar still handles navigation",
    ],
  },
  {
    version: "v2.4.3",
    date: "2026-05-08",
    changes: [
      "Drop rates: weaker tiers never fully disappear — broken has ~15% chance at floor 1, decaying to <0.1% by floor 40",
      "Drop rates now use the highest accessible tier as the focal point; every tier below it decays via the same weight curve",
      "Auto Seller tier thresholds rescaled to match the 15-tier system (divisor 4) — reaches void by floor 45",
      "Drop rate chart shows all 15 quality tiers; unattainable tiers shown greyed-out as 'locked'",
      "Chart entries ordered divine → broken (best to worst) for easier reading",
    ],
  },
  {
    version: "v2.4.2",
    date: "2026-05-08",
    changes: [
      "Lifetime Stats now tracks kills by enemy adjective (Frightening, Vile, Ancient, Dread, etc.) — sorted by kill count",
      "Enemy kill breakdown is scrollable and hidden until you have at least one kill",
      "Boss kills are tracked by their title adjective (Abyssal, Dread, Infernal, etc.) alongside regular enemies",
    ],
  },
  {
    version: "v2.4.1",
    date: "2026-05-08",
    changes: [
      "Five new gear quality tiers above legendary: Mythic (110 dmg) → Ancient (160) → Celestial (230) → Void (335) → Divine (480)",
      "Gear tier curve compressed — all 15 tiers fit within floors 1–44 (divisor 4 instead of 5)",
      "Legendary now unlocks at floor 24 instead of floor 30",
      "Divine (the new peak) unlocks at floor 44",
      "📊 drop rate chart button in the loot section — shows current-floor probability for every available quality tier",
    ],
  },
  {
    version: "v2.4.0",
    date: "2026-05-08",
    changes: [
      "Guild Hall — a permanent gold-funded meta layer that never resets (survives prestige and venture)",
      "Companion Hall upgrade (×2 stackable) — unlocks Party Slot IV and V in the Prestige Shop",
      "Expanded Armory upgrade (×3 stackable) — increases loot chest capacity from 8 up to 14",
      "Recruit: Paladin and Recruit: Ranger guild upgrades — unlock new classes for companion recruitment",
      "Paladin: 25% damage reduction at Lv5, heals party 5 HP on kill at Lv10, +15% party DPS when an ally falls at Lv20",
      "Ranger: 30% click crit (×2) at Lv5, ×1.6 passive DPS at Lv10, enemy takes +20% damage at Lv20",
      "Active combat skills purchasable from Guild Hall — class-specific buttons appear in the combat panel",
      "Battle Cry (Fighter): ×2 party DPS for 15s, 2-min cooldown",
      "Shadow Strike (Rogue): ×5 click damage for 8s, 45s cooldown",
      "Arcane Surge (Mage): ×3 DPS for 15s, 90s cooldown",
      "Skill button shows cooldown drain bar; glows while effect is active",
    ],
  },
  {
    version: "v2.3.2",
    date: "2026-05-08",
    changes: [
      "Venture is repeatable — push any dungeon to floor 40 and venture to the next one",
      "Idle gold accumulates across all previous dungeons — every companion you leave behind keeps earning",
      "Dungeon counter increments each venture; no cap",
    ],
  },
  {
    version: "v2.3.1",
    date: "2026-05-08",
    changes: [
      "Dungeon 2 plays identically to Dungeon 1 — recruit new companions via the Prestige Shop",
      "Venturing resets Party Slot II and III so fresh companions can be recruited in the new dungeon",
      "Original companions remain idle in Dungeon 1, still earning gold for you",
    ],
  },
  {
    version: "v2.3.0",
    date: "2026-05-08",
    changes: [
      "Venture system — at floor 40, venture to a new dungeon with just your class (fresh character, no gear, no gold)",
      "Companions stay behind in Dungeon 1 and idle-earn gold based on their DPS, flowing to you automatically",
      "Prestige still works within each dungeon; venturing resets your prestige point balance to 0",
      "Prestige in Dungeon 2 resets only the lead — companions remain idle in Dungeon 1",
      "Removed Guild Hall / Renown system",
    ],
  },
  {
    version: "v2.2.2",
    date: "2026-05-08",
    changes: [
      "Displaced gear is passed to a companion before being sold — if a replaced item is an upgrade for another party member, they equip it instead",
    ],
  },
  {
    version: "v2.2.1",
    date: "2026-05-08",
    changes: [
      "Guild Hall facilities now auto-unlock at renown milestones — no spending required",
      "Renown accumulates permanently and never resets",
      "Armory unlocks at 2 / 10 / 25 renown; Vault at 4 / 15 / 35; Training Yard at 6 / 20 / 50; Chronicle Room at 10 / 28 / 70",
      "Guild Hall panel shows unlock badge with next threshold for locked facilities",
    ],
  },
  {
    version: "v2.2.0",
    date: "2026-05-08",
    changes: [
      "Guild Hall — a permanent meta-progression layer that never resets",
      "Earn renown each time you prestige (floor / 10, minimum 2 at floor 20)",
      "Armory (2 renown): start each run with +1 loot item already in the pool",
      "Vault (3 renown): carry 10% of your gold per stack into the next run",
      "Training Yard (3 renown): party members begin each run 1 level higher per stack",
      "Chronicle Room (4 renown): earn +1 bonus renown per stack on every future prestige",
    ],
  },
  {
    version: "v2.1.1",
    date: "2026-05-08",
    changes: [
      "Equip priority: lead character always gets first claim on any upgrade — companions only receive items the lead can't use",
    ],
  },
  {
    version: "v2.1.0",
    date: "2026-05-08",
    changes: [
      "Enemy attacks a random living party member each tick — companions share the damage load",
      "Party respawns only after every member's HP reaches 0 — companions act as extra lives",
      "Dead party members deal no DPS until the party respawns",
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-05-08",
    changes: [
      "Auto Equip prestige upgrade (2pts) — automatically equips loot upgrades after each kill",
      "Auto Upgrade prestige upgrade (2pts) — automatically buys the cheapest affordable stat upgrade after each kill",
    ],
  },
  {
    version: "v1.9.6",
    date: "2026-05-08",
    changes: [
      "Checkpoint floor shown as a ⚑ marker on the depth gauge",
    ],
  },
  {
    version: "v1.9.5",
    date: "2026-05-08",
    changes: [
      "Depth gauge grows taller as you descend — 10px per level, minimum 160px, smooth animated transition",
    ],
  },
  {
    version: "v1.9.4",
    date: "2026-05-08",
    changes: [
      "Floor progress bar grows with depth — floor 1 needs 5 kills, floor 5 needs 7, floor 10 needs 9, +2 every 5 floors",
    ],
  },
  {
    version: "v1.9.3",
    date: "2026-05-08",
    changes: [
      "Prestige resets Auto Seller quality checkboxes so the new run starts clean",
    ],
  },
  {
    version: "v1.9.2",
    date: "2026-05-08",
    changes: [
      "Checkpoint floor shown on the floor bar — gold ⚑ label appears once a checkpoint is set",
    ],
  },
  {
    version: "v1.9.1",
    date: "2026-05-08",
    changes: [
      "Rings now replace the weaker equipped ring when both slots are full",
      "Equip All and Auto Seller correctly identify ring upgrades against the weaker slot",
    ],
  },
  {
    version: "v1.9.0",
    date: "2026-05-08",
    changes: [
      "Auto Seller now sweeps after every kill instead of every 10 seconds",
      "Player controls which quality tiers are auto-sold via checkboxes",
      "Available tiers unlock progressively — broken at any level, worn at 5, crude at 10, etc.",
      "Upgrade items (fills empty slot or beats equipped damage) are always protected",
      "Legendary items are never offered for auto-sell",
    ],
  },
  {
    version: "v1.8.0",
    date: "2026-05-08",
    changes: [
      "Checkpoints every 10 floors — die at floor 18, respawn at floor 10 instead of floor 1",
      "Checkpoint message shown in combat log when a new floor-10 boundary is crossed",
      "Prestige resets checkpoint to floor 1 alongside the full run reset",
    ],
  },
  {
    version: "v1.7.0",
    date: "2026-05-08",
    changes: [
      "Gear damage now scales with dungeon depth — +25% per 5 floors (×1.75 at floor 15)",
      "Enemy HP formula softened from 1.4× to 1.3× exponential growth",
      "Boss HP rebalanced: higher base (100×) but softer curve — long tense fights instead of walls",
      "Regular enemy attack DPS reduced (1.0× level); boss attack reduced (1.5× level)",
      "Bosses require active clicking to beat — auto-DPS alone is insufficient at floor 18+",
      "Rings no longer labeled Ring 1 / Ring 2 — any ring fills whichever slot is available",
    ],
  },
  {
    version: "v1.6.1",
    date: "2026-05-07",
    changes: [
      "Mobile: combat tab now shows enemy, party, and loot together",
      "Mobile: Shop tab shows a notification dot when an upgrade or prestige item is affordable",
      "Mobile: panels fill the full screen width on large phones",
    ],
  },
  {
    version: "v1.6.0",
    date: "2026-05-07",
    changes: [
      "Class abilities unlock at levels 5, 10, and 20",
      "Fighter: Iron Skin (dmg reduction), Bloodlust (+60% DPS at low HP), Battle Standard (party +10% DPS)",
      "Rogue: Lucky Strike (25% crit), Blade Mastery (+50% DPS), Expose Weakness (enemy +25% dmg taken)",
      "Mage: Arcane Study (party XP +25%), Mana Surge (auto-burst every 20s), Empower (click dmg ×2)",
      "Ability badges shown in party cards — locked abilities show their unlock level",
    ],
  },
  {
    version: "v1.5.1",
    date: "2026-05-07",
    changes: [
      "Hovering a loot item highlights the matching slot in the hero's equipment panel",
    ],
  },
  {
    version: "v1.5.0",
    date: "2026-05-07",
    changes: [
      "Auto-DPS is disabled until a character has gear equipped — click to deal damage early",
      "Auto Seller now protects items that are upgrades for any party member",
    ],
  },
  {
    version: "v1.4.0",
    date: "2026-05-07",
    changes: [
      "Mobile layout with tab bar navigation (Combat / Party / Shop / Log)",
      "Larger touch targets for all action buttons",
    ],
  },
  {
    version: "v1.3.0",
    date: "2026-05-07",
    changes: [
      "Prestige system — reset your run at dungeon level 20+ to earn prestige points",
      "Points scale with depth: level 20 = 1pt, +1pt per 5 levels past 20",
      "Prestige shop: Auto Seller, Party Slots II & III, Starting Gold, XP Bonus",
      "Auto Seller automatically sells the lowest-quality item every 10 seconds",
      "Party Slots let you add a 2nd and 3rd member — choose their class on purchase",
      "Lifetime Stats modal tracks total kills, deaths, best level, and prestige count",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-05-07",
    changes: [
      "Max HP upgrade available in the upgrades panel — +25 HP per level",
    ],
  },
  {
    version: "v1.1.1",
    date: "2026-05-07",
    changes: [
      "Depth gauge now shows a filled bar that grows downward as you descend",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-05-07",
    changes: [
      "Boss fights: each floor ends with a named boss (4× HP, 2× attack, guaranteed loot drop)",
      "Floor progress text updated to count down to the boss instead of the next floor",
      "Pulsing gold '★ BOSS FIGHT ★' indicator during the encounter",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-05-07",
    changes: [
      "Rebuilt entire game in TypeScript — no more Python runtime in the browser",
      "GitHub Actions deploys to GitHub Pages on every push",
      "Quality tier colors for all gear: broken (grey) → legendary (gold)",
      "Save / load via localStorage — Continue button on startup",
      "Deaths counter and highest dungeon level tracked across runs",
      "Floor progress pips showing monsters remaining until next level",
      "Vertical depth gauge showing current depth vs personal best",
    ],
  },
];

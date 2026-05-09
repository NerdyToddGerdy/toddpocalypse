export const VERSION = "v2.4.7";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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

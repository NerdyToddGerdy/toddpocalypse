export const VERSION = "v1.9.0";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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

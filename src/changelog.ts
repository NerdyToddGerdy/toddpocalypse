export const VERSION = "v1.5.1";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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

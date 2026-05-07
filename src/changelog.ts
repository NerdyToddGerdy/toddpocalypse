export const VERSION = "v1.0.0";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
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

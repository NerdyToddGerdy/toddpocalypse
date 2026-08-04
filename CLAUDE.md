# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install         # one-time setup
npm run build       # bundle src/main.ts → dist/game.js + copy public/*
npm run watch       # esbuild watch mode for local dev
npm test            # run vitest once
npm run test:watch  # vitest watch
npm run typecheck   # tsc --noEmit
```

To play locally after `npm run build`, serve `dist/` with any static file server (e.g. `python3 -m http.server` from inside `dist/`).

## Architecture

**GerdQuest: Idle Depths** is a browser-based idle-clicker RPG written in TypeScript and deployed to GitHub Pages via GitHub Actions.

### Module layout (`src/`)

```
main.ts        DOM glue: render + event delegation, wires GameState into the page
engine.ts      GameState — central tick/click loop, loot/upgrades/log
dungeon.ts     generateEnemy() — random enemy + scaling
party.ts       Party — list of Characters
character.ts   Character — class stats, level-up, equip
inventory.ts   Inventory — slot map, equip/displace
gear.ts        GearItem + getItem() — slots, qualities, drop weights
```

### Public assets (`public/`)

- `index.html` — page chrome, character creation overlay, panels
- `style.css` — all styling

### Build

`scripts/build.mjs` runs esbuild on `src/main.ts` → `dist/game.js` and copies `public/*` to `dist/`. The `dist/` directory is what GitHub Pages serves.

### Tests (`tests/`)

Vitest (`*.test.ts`). Each module has a paired test file. Run with `npm test`.

### Deployment

`.github/workflows/deploy.yml` runs on push to `main`: installs deps, runs tests, typechecks, builds, and uploads `dist/` as a Pages artifact. Pages must be configured in repo settings to deploy from GitHub Actions (one-time UI step).

### Game flow (engine.ts)

- `tick(dt)` — party DPS chips at enemy HP; enemy attack chips at the lead character. Enemy death rewards XP + gold + maybe loot, advances dungeon every 5 kills. Player death resets to dungeon level 1.
- `click()` — burst damage = totalDPS × multiplier × dt + click bonus.
- `equipLoot/sellLoot/equipAll/buyUpgrade` — sidebar actions; each returns the JSON-serialized state which `main.ts` re-renders.

### OLD_CODE/

Minified JavaScript from a prior browser-based version ("clickpocalypse"). Reference only — not part of the build.

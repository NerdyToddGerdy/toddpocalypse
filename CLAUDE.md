# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Franchise bible

This game ships under the **GerdQuest** label, and the shared standard for every title lives in the
flagship repo — not here:

**https://github.com/NerdyToddGerdy/notequest_browser/blob/fix/runid-desync-and-rename/docs/franchise-bible.md**

It is the single source of truth for the IP boundary (§1), naming (§2), visual identity (§3), voice
(§4), design vocabulary (§5) and technical conventions (§6). **Do not vendor a copy into this repo.**
A local copy existed briefly and had already drifted a full section behind the original, which is the
whole argument for referencing it instead.

Two things to know when reading it:

- It is written from *Realm of Depths*, so some conventions (React + Vite) describe that title rather
  than this one.
- The link points at a **branch**. The bible is not on `main` yet, so this URL will need updating once
  `fix/runid-desync-and-rename` merges. §8.3 proposes a shared repo as the long-term home.

### Where this game differs — `docs/franchise-divergences.md`

**[`docs/franchise-divergences.md`](docs/franchise-divergences.md) is the single record of every
place *Idle Depths* departs from the bible**, why, and whether it's permanent. Read it before
"fixing" anything that looks non-conformant — several rows are conformant in a way that looks wrong,
most notably the storage keys that still carry the old `toddpocalypse-` prefix on purpose.

**When you make a decision that diverges from the bible, record it there — not in a docstring.** A
comment explains one file; nobody reconstructs the whole picture from eight of them. Code may carry a
one-line pointer back to that document.

Conformance work is tracked in #49–#64.

## Commands

```bash
npm install         # one-time setup
npm run build       # bundle src/main.ts → dist/game.js + copy public/*
npm run watch       # esbuild watch mode for local dev
npm run changelog   # regenerate CHANGELOG.md from src/changelog.ts — run after every version bump
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

### OLD_CODE/ — gone, and `.gitignore`d

This directory no longer exists. **Do not recreate it, and do not vendor game source into this
repo.** The whole path is ignored so it cannot return.

Two files lived here, both removed under #49:

- `clickpocalypse.js` — a minified copy of Clickpocalypse II. Purged from the repo *and from git
  history* on 2026-08-04.
- `basic.js` — long described as "scratch JS from an earlier browser experiment". Deleted
  2026-08-05 once that description stopped holding up: 2483 lines with zero comments, no author or
  licence, tuned magic constants, and a closing `window["Game"] = Game;` — compiled-and-beautified
  output, not hand-written, and of unknown provenance. It was a building/prestige incremental,
  unrelated to Clickpocalypse and to this game.

*Idle Depths* is original work *inspired by* Clickpocalypse II — a genre, not an adaptation — and
redistributing someone else's source undercuts that standing. See §1.5 of the franchise bible and
the `OLD_CODE/` row in [`docs/franchise-divergences.md`](docs/franchise-divergences.md).

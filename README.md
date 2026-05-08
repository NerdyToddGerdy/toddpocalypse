# Toddpocalypse

A browser-based idle clicker RPG — descend into the dungeon, collect loot, build your party, and prestige your way to the Guild Hall.

**[Play it live](https://nerdytoddgerdy.github.io/toddpocalypse/)**

---

## About

Toddpocalypse is a spiritual successor to [Clickpocalypse](https://github.com/NerdyToddGerdy/toddpocalypse/tree/main/OLD_CODE) — the original browser clicker RPG this project grew out of. The core loop is the same: click to fight, idle to grind, keep going deeper. The codebase is a full rewrite in TypeScript with a proper build pipeline, persistent save state, and a richer progression system.

---

## How to Play

- **Attack** — click the attack button to deal burst damage; your party deals idle DPS automatically once they have gear
- **Loot** — enemies drop gear after kills; equip it to increase DPS, or sell it for gold
- **Upgrades** — spend gold on stat upgrades per party member (DPS, XP rate, click damage, max HP)
- **Bosses** — every floor ends with a named boss (4× HP, guaranteed loot drop); active clicking required at deep floors
- **Checkpoints** — every 10 floors you set a checkpoint; death respawns you there instead of floor 1

### Classes

| Class | Playstyle |
|---|---|
| ⚔ Fighter | Highest idle DPS — best for passive play |
| 🗡 Rogue | Click damage scales with level — rewards active clicking |
| 🔮 Mage | XP rate grows with level — slow start, fast late-game |

Each class unlocks three abilities at levels 5, 10, and 20.

### Progression Layers

**Run** — earn gold and loot during each dungeon run. Buy stat upgrades, equip gear, go deeper.

**Prestige** — at dungeon level 20+, reset the run to earn prestige points. Spend them in the Prestige Shop on permanent automation (Auto Seller, Auto Equip, Auto Upgrade) and party expansion (up to 3 members).

**Guild Hall** — renown accumulates across all prestiges and never resets. As your total renown grows, Guild Hall facilities unlock automatically:

| Facility | Unlocks at | Effect |
|---|---|---|
| Armory | 2 / 10 / 25 renown | Start each run with extra loot already in the pool |
| Vault | 4 / 15 / 35 renown | Carry a portion of your gold into the next run |
| Training Yard | 6 / 20 / 50 renown | Party members begin each run at a higher level |
| Chronicle Room | 10 / 28 / 70 renown | Earn bonus renown from every future prestige |

### Party

Buy Party Slot II and III from the Prestige Shop to bring companions into the dungeon. Enemies attack a random living member each tick — companions act as extra lives. The lead character always gets first pick on any loot upgrade; displaced gear is automatically offered to companions before being sold.

---

## Development

```bash
npm install         # one-time setup
npm run build       # bundle src/main.ts → dist/game.js + copy public/*
npm run watch       # esbuild watch mode for local dev
npm test            # run vitest
npm run typecheck   # tsc --noEmit
```

To play locally after building:

```bash
cd dist && python3 -m http.server
```

Then open `http://localhost:8000`.

### Stack

- **TypeScript** — all game logic in `src/`
- **esbuild** — bundles to a single `dist/game.js`
- **Vitest** — unit tests for every module (`tests/`)
- **GitHub Actions** — runs tests, typechecks, builds, and deploys to GitHub Pages on every push to `main`

### Architecture

```
src/
  main.ts        DOM glue — render loop, event delegation
  engine.ts      GameState — tick/click, loot, upgrades, prestige, guild hall
  dungeon.ts     generateEnemy() — enemy names and scaling
  party.ts       Party — list of Characters
  character.ts   Character — class stats, level-up, abilities
  inventory.ts   Inventory — equipment slot map
  gear.ts        GearItem + getItem() — slots, quality tiers, drop weights
  changelog.ts   VERSION constant + full changelog entries

public/
  index.html     Page structure and modals
  style.css      All styling

OLD_CODE/
  clickpocalypse.js   Original minified Clickpocalypse source (reference only)
```

---

## Changelog

See the in-game changelog (click the version button in the footer) for the full history.

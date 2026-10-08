# Design: d6 resolution and visible tables (#57)

> **Status: proposal, not built.** Nothing here is implemented. This document exists because #57
> asked for "a design doc before code": the change touches every balance number in the game, so the
> decisions in [§9](#9-decisions-for-the-owner) need an owner's call before any of it lands.

Franchise bible §5.1: *"Everything resolves on ordinary dice, and the player can see the table. No
hidden float multipliers."* §5.4: *"Show the roll, show the modifier, show the table row."* For this
title specifically: *"show the die, show the table row, show why that hit landed."*

## 1. What the game does today

Read from the code on 2026-10-08 (v2.45.1), not remembered:

| Thing | How it resolves | Where |
| --- | --- | --- |
| Party damage | Continuous. Every 100 ms tick, `Σ effectiveDps × ~10 stacked multipliers × dt` comes off enemy HP | `engine.ts` `computePartyDps`, tick at `main.ts:3416` |
| Crits | A hidden roll **per hero per tick** (10 per second each): `rng() < critChance` doubles that tick's damage | `engine.ts` `computePartyDps` |
| Class growth | Compounding float per level: fighter ×1.2, rogue ×1.15, mage ×1.1… | `character.ts` `LEVEL_UP` |
| Enemy HP | `10 × 1.3^level` plus a small random spread | `dungeon.ts` `generateEnemy` |
| Enemy damage | Continuous `attack_dps`, power-law in level | `dungeon.ts` |
| Loot drop | Hidden roll: `rng() < 0.45 (+ dungeon, luck, artifacts)`, capped at 0.75 | `engine.ts` ~2213 |
| Loot quality | Weighted pick from `DROP_WEIGHTS = [30, 22, 16, …, 0.02]` shifted by depth, plus two "dream" tiers | `gear.ts` `qualityWeights` |
| Time away | **Gold only.** No combat is simulated, so no rolls exist to report | `engine.ts` `applyOfflineProgress` |

Every roll already goes through the injectable `RNG` seam (#60, `src/rng.ts`), so any change below
can be seeded and tested deterministically.

## 2. The constraint the bible names

> "Visible tables mean the numbers must survive being looked at. Idle progression usually leans on
> curves that are only tolerable *because* they're hidden."

This game's progression is exponential in four places (class growth, enemy HP, upgrade costs at
`2^level`, boss scaling per dungeon). A d6 table cannot express `1.3^50`. Pretending otherwise, for
example by making the die roll the damage itself, would either flatten progression or need
absurd modifiers.

**The proposal separates the two jobs:**

> **Dice decide *what happens*. Numbers decide *how much*.**

Whether a swing misses, hits or crits, whether loot drops and which row of the table it comes
from: those are outcomes, and they go on visible dice. How much a hit deals is a magnitude, and it
stays a number. But that number is printed on the sheet ("24 per hit"), not buried in a multiplier
stack. That keeps the exponential curve the genre needs while making every outcome legible.

## 3. Combat: per-swing, not per-tick

**Recommendation: each hero swings on a cadence, and each swing is one d6 roll on a hit table.**

Per-tick rolling (today's crit model) is 10 rolls per hero per second, which is unreadable and
impossible to show. A swing is one event with one die, which can be logged in a sentence.

### 3.1 The hit table

| d6 (after modifiers) | Result | Damage |
| --- | --- | --- |
| 1 | Miss | 0 |
| 2–5 | Hit | 1× |
| 6 | Crit | 2× |

A natural 1 always misses and a natural 6 always crits, regardless of modifiers.

**Expectation-preserving by construction.** At +0 the mean multiplier is `(0 + 4×1 + 2) / 6 = 1.0`,
so average damage per swing equals today's average with no crit. Balance doesn't move on day one;
only variance does (see §7).

### 3.2 Modifiers replace hidden floats

Crit chance, today a probability (Wrath runes `+0.03 … +0.24`), becomes **crit range**: "crits on
5–6" is +1/6. Existing crit stats round to the nearest whole range step, and the rune tooltip shows
the new range instead of a percentage. Anything still fractional after rounding resolves as flavour
and says so in a comment, per §5.6.

Situational multipliers (Expose Weakness, Mark, Battle Cry…) become **visible modifiers**: a line in
the swing log, "+1 Marked", rather than an invisible ×1.20.

### 3.3 Cadence

One swing per hero per second, so time-to-kill matches today's DPS at the same damage per hit.
Haste, currently a DPS multiplier, becomes swing speed, which players can see as swings per second
on the sheet.

### 3.4 Clicks

A click is an extra swing by the lead hero, at +1 on the die. It stays the "burst" the click
upgrade path is built around, and the player sees it land.

### 3.5 Enemy attacks

The enemy swings on its own cadence against a **defence target** printed on the hero sheet ("hit on
4+"). Defence upgrades raise the target number instead of an invisible damage-reduction float. Its
damage stays a magnitude, as in §2.

## 4. Loot: a table you can read

**Drop:** one d6, drop on **4+** (50%). Today's base is 45%, so this is a +5-point change; the
alternative "drop on 5+" (33%) is a −12-point change. Depth and luck bonuses become −1 to the
target, so "drops on 3+" means 67%.

**Quality:** a **2d6 table per depth band**, shown in the Loot tab:

| 2d6 | Floors 1–4 | Floors 5–8 | … |
| --- | --- | --- | --- |
| 2–6 | Common | Fine | … |
| 7–9 | Fine | Superior | … |
| 10–11 | Superior | Rare | … |
| 12 | Rare → roll again | Epic → roll again | … |

2d6 has 1/36 granularity. Today's `DROP_WEIGHTS` reach 0.02 of ~110, under 1/36, so the rarest
tiers can't be a table row. They become **"on a 12, roll again: on a 6, one tier higher"** (1/216),
chained for dream drops. That is honest about the odds, and the chain is itself the moment worth
showing on screen.

## 5. Time away

Today nothing is simulated offline, so there are no rolls to show. Two options:

- **(a) Simulate the swings** with the seeded RNG on return, capped like gold is today, and report
  a summary: *"While you were away: 3,612 swings — 602 missed, 2,408 hit, 602 crit. 41 kills, 18
  loot rolls; best was a 12 then a 6: Epic."* This is the §5 promise exactly. It needs offline
  combat, which brings new risks: dying while away, and the save-state questions in #58.
- **(b) Keep gold-only offline** and state it plainly in the welcome line: "No fights while you
  were away — only idle gold."

(a) is the GerdQuest answer. (b) is the honest stop-gap until #58 settles death.

## 6. Showing it

- **The swing log.** One line per swing is too many at 1/s/hero, so the log groups by kill: *"Hero:
  5 swings — 4 hits, 1 crit (rolled 6). Ogre falls."* A setting expands to every roll.
- **The Die.** The remaining half of #56: port *Realm of Depths'* CSS cube verbatim, with a
  vanilla-DOM wrapper. It shows the lead hero's latest swing on the enemy panel. Only one die
  animates at a time; under `prefers-reduced-motion` it shows the face without tumbling.
- **The sheet.** Damage per hit, swings per second, crit range and defence target are printed
  on the hero sheet (the parchment card from #56), so every modifier in a log line can be traced
  back to a number on the sheet.

## 7. What changes for balance

Expectation is preserved (§3.1), but **variance rises**: a fight that took ten swings can now take
twelve after two misses. That matters most for **boss enrage timers**, where a bad streak can now
lose a fight that the old continuous model would have won.

**The rebalance check is a Monte Carlo harness, not a guess.** Using `mulberry32`, simulate 10,000
fights per floor, 1–60, under both models with the same party and compare time-to-kill
distributions. Acceptance: median within ±5%, and the 95th-percentile boss time-to-kill stays under
the enrage threshold. Wherever it doesn't, the fix is a visible modifier (+1 vs bosses), not a
hidden float.

## 8. Saves and rollout

**No save migration.** The combat model isn't stored: saves hold party, gear, upgrades and
progress, not damage state. Crit stats are reinterpreted on load (§3.2); nothing is renamed.

Phased, each phase shippable and tested on its own:

1. Swing cadence and the hit table, plus grouped log lines. Behind a setting at first, so both
   models can be compared in play.
2. The Monte Carlo harness and any visible-modifier fixes it calls for.
3. Loot drop and quality tables, plus the readable table in the Loot tab.
4. Enemy swings against the defence target.
5. The Die (the rest of #56).
6. Time away: §5 option (a) or (b).

## 9. Decisions for the owner

1. **Per-swing at 1/s/hero** (§3)? Or per-kill resolution, which is fewer rolls and less texture.
2. **The hit table** (§3.1): 1 miss / 2–5 hit / 6 crit? Or no misses at all (1–5 hit / 6 crit,
   mean 1.17×, a buff that would need damage scaled down by 1/1.17).
3. **Base drop on 4+** (+5 points) or **5+** (−12 points) (§4)?
4. **Time away** (§5): simulate fights (a), or gold-only stated plainly (b)?
5. **Ship phase 1 behind a setting** so both models run side by side for a while, or switch
   outright?

Not in scope here, and tracked separately: permadeath versus prestige, and the depleting resource
(#58). §5's other two instincts interact with time away (§5) but don't block the dice.

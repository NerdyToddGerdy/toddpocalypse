# Where Idle Depths differs from the Franchise Bible

The bible is the shared standard for every GerdQuest title and lives in the flagship repo:

**https://github.com/NerdyToddGerdy/notequest_browser/blob/main/docs/franchise-bible.md**

It is written from *Realm of Depths*, so some of it describes that title rather than this one. This
file is the single record of every place *Idle Depths* differs, why, and whether the difference is
permanent. **Put divergence rationale here, not in code comments** — a docstring explains one file,
and nobody assembles the whole picture from eight of them.

The bible does not say where per-title divergences get recorded. This is that place, until it does.

> Last verified against the codebase: **2026-08-09** (v2.37.0). Facts below were checked, not
> remembered. Re-verify before trusting any row — see the commands at the end.

## Status legend

| | Meaning |
| --- | --- |
| 🟢 **Settled** | Deliberate, decided, not changing. The bible is what should move. |
| 🟡 **Owed** | We intend to conform; it just isn't done. Tracked by an issue. |
| 🔵 **Conformant** | Matches the bible in a way that *looks* wrong. **Do not "fix" these.** |
| ⚪ **Open** | Genuinely undecided. |

---

## Summary

| § | Topic | Status | Issue |
| --- | --- | --- | --- |
| §1.5 | IP standing — inspired-by, not adapted-from | 🔵 Conformant (audited 2026-08-05) | #49, #50 |
| §2 | Name collides with a live idle game | 🟢 Settled (knowingly) | #51 closed |
| §2 | Two-tier wordmark — prefix in mono, not display | 🔵 Conformant | #55 |
| §3 | Nine themes instead of one committed look | 🟢 **Settled** | #53 closed |
| §3 | Palette in `src/ui/theme/tokens.css` — plus six local extensions and the quality ladder | 🔵 Conformant | #52 |
| §3 | Typography — self-hosted franchise faces, shared by all themes | 🔵 Conformant | #54 |
| §3 | Secondary text is `--parchment-dim`, not `--ink-soft` | 🔵 Conformant | — |
| §3 | Stacked sheet, ruled paper, eyebrow+title; no Die (no dice, §5.1) | 🟢 Settled | #56 closed |
| §5.1 | No d6: dice don't suit this idle game's pacing | 🟢 **Settled** | #57 closed |
| §5.4 | Bookkeeping made visible: loot odds, crit odds, the DPS stack | 🔵 Conformant | #74 |
| §5 | Hits three instincts: (4) visible bookkeeping, (5) the world outlives the run, (6) honest simplification | 🔵 Conformant | #58 |
| §5.2 | No depleting resource: supplies are a *Realm of Depths* mechanic | 🟢 **Settled** | #58 |
| §5.3 | Prestige, not permadeath: a wipe returns you to the checkpoint | 🟢 **Settled** | #58 |
| §7 | Party of one to six | 🟢 **Settled** | #58 |
| §7 | Setting and lore | ⚪ Open (deferred) | #58 |
| §6 | Vanilla DOM + esbuild, not React + Vite | 🟢 **Settled** | #63 |
| §6 | Has a backend (bible permits) | 🔵 Conformant | #64 |
| §6 | Accounts + email, not anonymous UUID | ⚪ Open | #64 |
| §6 | Storage keys keep the `toddpocalypse-` prefix | 🔵 **Conformant** | — |
| §6 | No `src/data/` | 🟡 Owed | #61 |
| §6 | Changelog is generated `.md` from a typed `.ts` source | 🔵 Conformant | #62 |
| §6 | No Playwright; failing-test-first rule unadopted | 🟡 Owed | #63 |

---

## 🟢 Settled — the bible is what should move

### §5 — three instincts: (4), (5) and (6)

Decided **2026-10-09** (#58). The bible asks every title to hit at least three of §5's six instincts.
*Idle Depths* declined (1) dice, (2) a depleting resource and (3) permadeath (sections below), and
claims the other three:

- **(4) Bookkeeping made visible** — #74, v2.49.0: loot odds, crit odds and the DPS stack, shown from
  the code that rolls them.
- **(5) The world outlives the character** — what survives a Return to Town is the world: renown and
  its upgrades, the Guild Hall, constellations, the dungeon you've reached, runes, artifacts, the
  stash, and your records. The run's heroes, gear and floor do not. This was always true in code;
  since v2.50.0 the **Return to Town dialog lists it** ("You keep" / "Starts over"), from
  `returnToTownSummary()` (`src/engine.ts`). `tests/return-to-town.test.ts` runs the real
  `prestige()` and checks every line the dialog shows, so it can't promise more than the game does.
- **(6) Honest simplification** — where something is flavour, the code says so. Enemy names — the
  adjective, the creature and a boss's title — have **no effect on stats**; HP, damage and rewards
  come from floor and dungeon alone (`src/dungeon.ts`, held by `tests/dungeon.test.ts`). The words
  that *are* rules: **Elite** (stronger, always drops loot) and **Guardian** (the gate boss before a
  checkpoint). Names do count toward the Bestiary feat, which tracks kinds of enemy killed. Death and
  homecoming lines are flavour too; the rule is the floor or renown shown beneath them. The "dungeon
  shifts while you rest" line is flavour for the reset, and the dialog now states the reset plainly
  beside it.

### §5.2 — no depleting resource

§5.2: "A resource that runs out and kills you." Decided **2026-10-09 by the owner: none.**

**Why:** supplies and torches belong to *Realm of Depths*, where the depleting light *is* the clock
of a solo crawl. They don't fit this game: an idle party fights for hours unattended, and a resource
that runs out while you're away would punish exactly the play the genre is built on.

### §5.3 — prestige, not permadeath

§5.3: "Permadeath, with a record of the dead." §7 leaned toward "runs that genuinely *end*". Decided
**2026-10-09 by the owner: keep it as it is.** A wipe sends the party back to the checkpoint with gear,
gold and levels intact. Return to Town is a chosen soft reset into renown.

**The case for it:** in an idle game, the player's investment is time away. Permadeath would let a
single unattended wipe erase hours of progress the player didn't watch happen, which reads as
unfair rather than tense. The run still ends, by the player's choice, and what survives it is shown
plainly (§5 (5) above). The record of the dead exists, voluntarily: **Retire** ends a hero for good
and writes them into the **Hall of Fame**.

### §7 — party of one to six

Decided **2026-10-09: keep the party.** One hero to start, up to six through renown and the Guild
Hall. The recruitment, companion and party-slot systems stay.

### §5.4 — bookkeeping made visible, without dice

Done in v2.49.0 (#74). §5.4: "Show the roll, show the modifier, show the table row." With no dice
(§5.1), this title shows the numbers it already uses:

- **Loot odds** (the 📊 Odds dialog): the drop chance and each part of it, and every quality's
  chance on this floor, rare ones as "1 in N". The previous chart got this wrong from dungeon 2 on,
  because it rolled quality by floor number rather than the effective level the engine uses.
- **Crit odds** on every hero sheet ("12% crit for ×2"), with their sources in the DPS tooltip.
- **The DPS stack**: the tooltip lists every part and multiplier in the order combat applies them.
  It also says when a hero deals nothing because no gear is equipped, a rule that was invisible
  before.
- **Time away**: the welcome-back line says plainly that the party doesn't fight offline, and
  when the 8-hour idle cap cut earnings short.

**The numbers shown are the numbers rolled.** Combat and the breakdown read the same labelled
helpers (`heroFactors`, `critFor`, `partyFactors`, `dropChanceBreakdown`, `qualityOdds`), and
`tests/odds.test.ts` checks that the breakdown's average equals what combat deals.

**Not done, by the owner's choice (2026-10-09): no log lines** explaining individual hits or drops.

This is one of the three §5 instincts *Idle Depths* claims; see "§5 — three instincts" below.

### §5.1 — no d6: dice don't suit this idle game's pacing

§5.1: "Everything resolves on ordinary dice, and the player can see the table." For *Idle Depths*,
§5 says (1) dice and (4) visible bookkeeping are "where it earns the GerdQuest name". Decided
**2026-10-08 by the owner: no dice.**

**Why:** dice don't suit this idle game's pacing. The party fights continuously, many times a
second and for hours unattended. A roll is a discrete moment you watch land, and the genre's
rhythm has no room for one.

**What's kept:** the half of §5 that never needed dice. §5.4's "show the modifier, show the table
row" is #74: readable loot odds, crit odds and the DPS stack as real numbers.

**What it costs:** the bible asks a title to hit **at least three** of §5's six instincts. With (1),
(2) and (3) all declined (see below), *Idle Depths* claims (4), (5) and (6) instead.

**Knock-on:** §3's Die, "reuse it verbatim in every title", has no roll to show here, so it is not
ported (#56 closed). The design that was proposed is kept for the record at
`docs/design/d6-combat.md`, marked not pursued, so the idea isn't rediscovered from scratch.

### §3 — the hero card is the stacked sheet, in torchlight only

#56. The stacked sheet and ruled paper are the hero card, ported from *Realm of Depths'*
`.screen-sheet`. Eyebrow+title pairs class and level with the hero's name, and the level with the
enemy's name on desktop. In torchlight only, because beige paper would fight the opt-in themes; the
**Ledger** theme carries the paper look across the whole UI instead. No Die, per §5.1 above.

### §3 — nine themes, not one committed lit scene

§3 says "This is one lit scene, not a document that should invert." This title ships **nine**
selectable themes, most of them prestige-unlocked.

**Why:** collectible customisation carries weight in an idle game that a solo dice crawler doesn't
have. Unlocking a look is a progression reward here; in *Realm of Depths* it would be noise.

**How it's reconciled:** the **default** is franchise-constant. `torchlight` is the §3 palette
verbatim (it is the `:root` of `src/ui/theme/tokens.css`, with no override block), free from the first minute, and top of the unlock list — so the game a new player sees,
and every screenshot, is the house look. The other eight are opt-in.

**Ledger** (added v2.47.0, free) is *Realm of Depths'* own look carried across the whole UI:
parchment panels with ruled lines, a stacked-paper edge, ink text and ink-plate buttons on the
dark table. It is not a light mode: the page stays `--bg-0`, and only the sheets are paper, exactly
as on the sister title. It is named for that game's "Adventurer's Ledger" sheet, **never after
NoteQuest** (§1 rule 3). Two values depart from §3 for legibility on paper, and both are tested:

- **`--focus`** is ember `#8a3412`, not `#f2c265`, which is about 1.3:1 on parchment. §3 says the
  ring is "always visible", and visible wins over verbatim.
- **The `--q-*` rarity ladder is deepened** to ink strength (≥ 4.5:1 on `--bg-1`). These colours
  are otherwise constant across themes, but `--q-common` `#e2e0f0` and `--q-divine` `#fff` would
  print as blank paper. The hues are kept; only their strength changes.

> **Owed to the bible:** §3 needs amending to permit per-title cosmetic variants — the *default*
> look is franchise-constant, additional themes are a per-title call. Until that lands this is an
> undocumented divergence, not a settled exception. Requires a change in the flagship repo.

### §6 — vanilla DOM + esbuild, not React + Vite

§6 specifies React + TypeScript + Vite. This is TypeScript + esbuild with direct DOM rendering and
event delegation.

**Why:** it predates the franchise, works, and builds to ~304KB in well under a second. Migrating
buys nothing a player can see.

**What it costs, concretely:** the `Die` component (§3, "reuse it verbatim in every title", "the
single most recognisable asset the franchise owns") **cannot** be reused verbatim — it's a React
component. #56 has to port the CSS cube and reimplement the wrapper. That cost is real and recurring;
it applies to every future shared component. Recorded here so it isn't rediscovered each time.

---

## 🔵 Conformant — do not "fix" these

### §6 — storage keys keep the `toddpocalypse-` prefix

Five keys still carry the pre-rename name: `toddpocalypse-save`, `-theme`, `-token`,
`-token-expiry`, `-session`.

**This is correct and deliberate.** §6: "**Never rename a storage key without a read-old-write-new
migration.**" *Realm of Depths* keeps its historical `notequest:` prefix through two renames for
exactly this reason. These keys hold every player's save, session and auth state; the prefix is
invisible to players, so renaming it is pure risk for zero gain.

Renaming them would log everyone out and orphan every local save. **Leave them alone.**

### §6 — the backend is allowed

Cognito + Lambda + DynamoDB. §6's Backends section explicitly permits this: "static by default …
**This is a starting point, not a franchise constraint**."

The rule that *does* apply — "the game must remain fully playable with the network down, or the
backend gone entirely" — appears satisfied: `localStorage` is authoritative and `cloudLoad` returns a
typed result rather than throwing. **Not yet actually tested**, which is #64.

### §6 — versioning: tags backfilled, `CHANGELOG.md` generated not hand-written

§6 asks for "a version bump, a dated `CHANGELOG.md` section, and a matching `vX.Y.Z` tag" per push.
Settled 2026-08-05 (#62):

**Tags — the gap is closed.** The repo had **zero** tags against 380+ released versions. All 361
release commits are now tagged retroactively, annotated, with the tagger date set to each commit's
own date so they don't all claim to have been cut today. Release subjects follow `vX.Y.Z: subject`;
four early ones used an em dash instead of a colon and were caught separately. Where one version
appears on several commits, the most recent carries the tag.

**Tagging is now automated.** A `tag` job in `deploy.yml` reads `VERSION` out of `src/changelog.ts`
after the build passes and pushes the matching tag. It is a no-op when the tag already exists, so
re-runs and `workflow_dispatch` are safe. This is what stops the gap reopening.

**`src/changelog.ts` stays the source of truth; `CHANGELOG.md` is generated from it.** The typed
form is genuinely better — it is type-checked, unit-tested and rendered in-game, none of which a
Markdown file can do. Rather than maintain two lists, `npm run changelog` renders one into the
other, and `tests/changelog-md.test.ts` fails if they drift. **Do not hand-edit `CHANGELOG.md`.**

**Known and accepted:** 25 of the 383 changelog entries have no tag, because no commit subject
identifies them — historically several versions were folded into one commit. They are unrecoverable
from git and are left untagged rather than guessed at.

### §3 — typography: self-hosted, and shared across every theme

§3: "All self-hosted `woff2`, all OFL, **no CDN**", with a semantic split — display for voice, body
for fiction, mono for anything a player counts. Settled 2026-08-09 (#54).

The page previously pulled five faces (Cinzel, Cinzel Decorative, Crimson Pro, Pirata One,
Philosopher) from the Google Fonts CDN. All five are gone. In their place, twelve `woff2` files
under `public/fonts/` — Metamorphous 400, Spectral 400/400i/600, JetBrains Mono 400/700, latin and
latin-ext subsets only, 189KB total. **The page now makes no third-party resource request at all.**

All three are OFL, confirmed against the `ofl/` directory of `google/fonts` rather than assumed.
The licence requires distribution alongside the fonts, so `OFL-metamorphous.txt`,
`OFL-spectral.txt` and `OFL-jetbrainsmono.txt` ship in `public/fonts/` too. `scripts/build.mjs`
needed no change — it already copies `public/` recursively.

**The one real judgement call: themes no longer carry their own typography.** Each of the eight
themes used to override `--font-display` / `--font-body` with its own pair, so Grimdark read in
Pirata One and Arcane in Cinzel Decorative. Sixteen overrides were removed and five hardcoded
`font-family: 'Cinzel'` rules now point at `var(--font-display)`. **Themes vary colour, not type.**
This is what §3 asks for — one committed type stack is the point of the section — but it is a
visible loss of per-theme character, and it is recorded here so it reads as a decision rather than
an oversight. Reversing it means reintroducing five CDN faces, so it should not be reversed lightly.

Counted values — gold, HP, XP, DPS, depth, kills, deaths, lifetime stats — render in JetBrains Mono
with `font-variant-numeric: tabular-nums`, so digits stop jittering as they tick.

`tests/fonts.test.ts` holds the line: it fails if a CDN reference reappears, if any `@font-face`
points at a remote host, if a retired face returns, or if the three role variables stop resolving
to their franchise faces.

**Note for future test work:** that test reads `style.css` with `readFileSync`, not the `?raw`
import the other source-scanning tests use. Vitest stubs CSS modules to an empty string and `?raw`
does not survive it for `.css` files — the assertions pass vacuously against `""` if you switch it
back. This is why `@types/node` is now a devDependency and `"node"` is in `tsconfig` types, which
in turn is why the four timer handles in `main.ts` are typed `ReturnType<typeof setTimeout>` rather
than `number`.

### §3 — secondary text is `--parchment-dim`, a dimmed parchment, not `--ink-soft`

Until v2.38.0 torchlight mapped `--muted` to §3 `--ink-soft` (`#5a4b38`). The bible defines that
token as **secondary text on parchment** — dark ink on a light sheet. This game has no parchment
sheet yet (#56), so `--muted` lands on `--bg-1` instead, at about 2.2:1. Every header label, upgrade
cost and inactive tab was close to invisible.

`--muted` became `#a8936f` — `--parchment` dimmed — and under #52 was renamed `--parchment-dim`
so the name says what it is, the same role `--ink-soft` plays on paper,
inverted for a dark ground. It clears WCAG AA (≥ 4.5:1) on `--bg-1`, and `tests/style.test.ts`
holds it there. **This is the right reading of §3, not a departure from it.** When #56 brings in a
real parchment surface, text *on that surface* should use `--ink-soft` verbatim.

Changed in the same release: `--focus` (`#f2c265`) is now defined and drawn on `:focus-visible`
for every theme, as §3 requires.

### §3 — the palette, in `src/ui/theme/tokens.css`

Adopted in v2.46.0 (#52). `tokens.css` holds the §3 table verbatim under its own names and sets
`color-scheme: dark`; the build copies it to `dist/` and the page loads it before `style.css`. The
pre-franchise names are retired everywhere — `tests/tokens.test.ts` fails if any comes back:

| Was | Now | |
| --- | --- | --- |
| `--bg` / `--surface` | `--bg-0` / `--bg-1` | §3 |
| `--border` | `--gold` | §3 "borders, labels, interactive affordance" |
| `--accent` | `--torch-mid` | §3 "flame body, glows" |
| `--text` | `--parchment` | §3 |
| `--danger`, `--focus` | unchanged | §3 |
| `--surface2`, `--muted`, `--accent2`, `--hp-green`, `--xp-blue`, `--on-accent` | `--bg-2`, `--parchment-dim`, `--secondary`, `--hp`, `--xp`, `--on-torch` | local |

**The rename changed no pixels.** Verified by diffing the computed colour, background, border,
shadow and outline of all 2,851 body elements against the previous build, in all eight themes. The
only differences are unstyled, hidden controls picking up dark UA defaults from `color-scheme`.

**Local extensions — owed to the bible as proposals, not kept as quiet divergences.** Six roles this
title needs that §3 doesn't name: a second raised surface (`--bg-2`), secondary text on dark
(`--parchment-dim`), a second accent (`--secondary`), resource bars (`--hp`, `--xp`) and ink on a
filled torch surface (`--on-torch`). `--parchment-dim` is the strongest candidate: any title with
text on a dark ground needs it, and §3's only secondary-text token is for paper.

**The 15-step gear-quality ladder (`--q-*`) and the arcane purple are the first tokens a title has
needed that the franchise set has no equivalent for.** They are a genre need — rarity tiers —
that *Realm of Depths* doesn't have. They stay constant across themes, because a colour there names
a rarity rather than setting a mood. Flag to the bible: §3 should say whether titles may add
semantic tokens like these, and where they live.

**Themes.** The seven opt-in themes override §3 names (`--bg-1`, `--torch-mid`, `--parchment`…)
with their own values. Tokens they don't override — `--torch-core`, `--ember`, `--gold-bright`,
`--parchment-2`/`-3`, `--ink`, `--ink-soft` — fall back to the torchlight values.

### §2 — the two-tier wordmark

Adopted in v2.40.0 (#55). The header `<h1>` and the start-screen `<h2>` both read
`<small>GerdQuest</small> Idle Depths`, so each heading's accessible name is the full phrase and no
colon form remains. `tests/fonts.test.ts` holds the markup.

Two details that look like deviations and are not:

- **The prefix is set in JetBrains Mono**, not Metamorphous. §2 asks for "small, uppercase,
  letter-spaced"; §3's eyebrow motif is "a small mono uppercase label" and names the wordmark as one
  of its uses. Mono is the reading that satisfies both.
- **Styles live under `.wordmark small` in `style.css`**, not a `.module.css` — this title has no
  CSS modules (see §6 below).

The page `<title>` keeps `GerdQuest: Idle Depths`. A tab title is one line of plain text with no
second tier to put the prefix in, and the colon is the conventional separator there.

### §1.5 — IP standing

Original work inspired by Clickpocalypse II; not an adaptation, carries no attribution obligation,
and correctly carries **no** NoteQuest credit (§1 rule 3). The vendored copy of the Clickpocalypse
source was purged from the repo and from git history on 2026-08-04 (#49) and is `.gitignore`d.

**Expression audit run 2026-08-05 (#49). Outcome: no expression lifted; nothing renamed.**

The check the bible's not-safe column actually asks for — "copying its class list, item names or
upgrade tree", "reproducing its specific numbers or formulas", "its art, sprites or UI layout":

| Surface | Ours | Verdict |
| --- | --- | --- |
| Quality ladder | `gear.ts:47` — 15 rungs, `broken`…`divine` | 2 words shared, see below |
| Class list | `character.ts:71` — fighter, rogue, mage, paladin, ranger, druid | Clear — the D&D archetype set, older than either game |
| Per-class roles | `character.ts:91` — `dpsMult` / `clickBonus` / `xpMultiplier` triples | Clear — expressed in this game's own click-idle vocabulary |
| Slots | `gear.ts:5` — 9-slot paperdoll, two rings | Clear — standard ARPG paperdoll |
| Item names | `gear.ts:34` + `:74` — "quality itemType of adjective" | Clear — generated from our own two lists |
| Upgrade tree | `engine.ts:46`, `:108`, `:156` — gold upgrades, prestige shop, guild hall | Clear — no counterpart to compare against; three-tier structure is ours |
| Formulas | `dungeon.ts:121`, `gear.ts:132` | Clear — power-law attack, dream-drop weights; independently derived |
| Sprites | `public/*.png` | Clear — 434×724 / ~280×362 painted portraits and silhouettes, not sprite-sheet cells |

**The `Eternal` overlap in #49's premise does not exist.** `eternal` has never been a quality tier
in this game — `git log -S '"eternal"' -- src/gear.ts` returns nothing. The word appears only as a
boss title (`dungeon.ts:17`), a guild upgrade (`Eternal Cycle`) and a player title (`The Eternal`),
none of which is the role it plays in their ladder.

**The real overlaps are `celestial` and `divine`, and both stay.** Two words out of fifteen, at
different ordinal positions, in a ladder whose other thirteen rungs are unshared and whose spine
(`common` → `rare` → `epic` → `legendary` → `mythic`) is generic ARPG vocabulary neither game
invented. A ladder with the same rungs in the same order would be evidence; two generic superlatives
at the top of a differently-shaped ladder is not. Renaming also has a real player cost:
`GearItem.fromDict` (`gear.ts:431`) falls back to `common` for unrecognised qualities, so a rename
without a migration map silently downgrades every celestial item in every existing save.

**Residual risk, accepted:** the item-name and formula comparisons above are reasoned from this
codebase and the notes preserved in #49, not from a line-by-line diff — the reference copy is
deliberately gone and **must not be re-vendored to close that gap**. The exposure is low and it is
recorded here rather than left implicit.

#### `OLD_CODE/` — deleted 2026-08-05, directory `.gitignore`d

The second half of #49 asked whether `OLD_CODE/` stays. It does not. Both files are gone and the
whole path is ignored.

`clickpocalypse.js` went on 2026-08-04, purged from history. `basic.js` stayed, on the reasoning
that it "shares zero identifiers with the Clickpocalypse source (0 hits for Dungeon/Character/
Monster/Party vs. 4–40)". **That test could not have returned anything else** — it compared readable
names against a *minified* file, where every identifier was already mangled. The conclusion was
right; the reasoning did not establish it.

Re-examined 2026-08-05. `basic.js` was indeed unrelated to Clickpocalypse — a building/prestige
incremental (`Settings.building`, `BuildingGenerator`, `numBuildingRows: 11`), with zero hits for
any RPG-domain term or rarity tier. Different genre, not a party dungeon crawler. **§1.5 was never
at risk from it.**

But it was not scratch either: 2483 lines with **zero comment lines**, no author, licence or URL,
tuned magic constants (`ratePower: 4.3`, `basePower: 2.48`, `incModifier: 1.0012`), `Cast.toInt`
using `value | 0`, and a closing `window["Game"] = Game;` — the Closure Compiler export idiom. That
is compiled-and-beautified output. Provenance was unknown and the author could not confirm writing
it, so it was deleted on the same principle as the first file: **this repo does not redistribute
game source whose origin it cannot vouch for.**

**Residual risk, accepted:** `basic.js` was removed from `HEAD` only — it remains in git history and
is fetchable by SHA. Unlike `clickpocalypse.js` it was not purged with `filter-repo`, because that
rewrites every commit SHA and the exposure here is lower: the file is not the work this game claims
inspiration from, and no §1.5 claim depends on its absence. Revisit if provenance turns out to
matter.

---

## 🟡 Owed — we intend to conform

Each is tracked; this section is a pointer, not a duplicate of the issue.

- **§6 `src/data/`** (#61) — tables live inside the modules that consume them.
- **§6 testing** (#63) — Vitest is in place (1349 tests). No Playwright, and the "a regression test
  must be shown to fail against the unfixed code before it is kept" rule isn't formally adopted.

---

## ⚪ Open — undecided

- **§7 setting** (#58) — **deferred by the owner, 2026-10-09.** The world stays generic for now.
  §8.1 still notes this title is the cheapest place to start shared franchise lore, if that happens.
- **§6 identity** (#64) — §6 says *prefer* an anonymous UUID: "no passwords, no email, no personal
  data to protect." We use Cognito with Google sign-in requesting `email+openid+profile`, and
  maintain a `PRIVACY.md` because of it. A considered trade for cross-device sync — but the
  argument isn't on the record, and #46's save-code system is the anonymous alternative already on
  the backlog.
- **§2 name** — `Idle Depths` collides with a live idle game, a registered `idledepths.com`, and a
  Steam subtitle (#51). Knowingly kept on the strength of the `GerdQuest:` prefix as disambiguator.
  **Re-run the §2 check before publishing to any storefront** (#33, #45) — that's the point of no
  return.

---

## Re-verifying this file

Facts rot. To re-check the mechanical rows:

```bash
git tag | wc -l                                  # §6 versioning — expect 361+, one per release
test -f CHANGELOG.md && echo present             # §6 versioning — generated, never hand-edited
npm run changelog && git diff --exit-code CHANGELOG.md  # §6 — expect no drift
test -d src/data && echo present                 # §6 data-driven — #61
test -f src/ui/theme/tokens.css && echo present  # §3 palette — #52
grep -rc "Math.random" src/*.ts                  # §6 RNG — #60 done, expect rng.ts only
grep -n '"eternal"\|"celestial"' src/gear.ts     # §1.5 audit — celestial only, no eternal tier
test -d OLD_CODE && echo present                 # §1.5 — expect absent, and ignored if recreated
grep -rc "fonts.googleapis" public/               # §3 typography — #54 done, expect 0
ls public/fonts/*.woff2 | wc -l                  # §3 typography — expect 12, self-hosted
grep -rn "toddpocalypse-" src/*.ts               # §6 storage keys — expect 5, leave them
grep -rin "notequest" --exclude-dir=node_modules . # §1 rule 3 — only bible URLs should match
```

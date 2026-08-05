# Changelog

<!-- Generated from src/changelog.ts by `npm run changelog`. Do not edit by hand. -->

All notable changes to **GerdQuest: Idle Depths**.

## v2.36.0 — 2026-08-05

- Every release in the game's history now has a matching git tag — 361 of them
- Internal: CHANGELOG.md is generated from the in-game changelog, so the two can't disagree
- Internal: CI now tags each release automatically and runs on current Node

## v2.35.2 — 2026-08-05

- Internal: removed the last of the old reference code — no gameplay change

## v2.35.1 — 2026-08-05

- Internal: recorded the originality audit — no gameplay change

## v2.35.0 — 2026-08-05

- Internal: every roll now flows through one injectable randomness source, making runs reproducible under a seed
- No gameplay change — odds, drops and scaling are identical

## v2.34.1 — 2026-08-04

- Internal: single document recording where this game differs from the franchise standard

## v2.34.0 — 2026-08-04

- New default theme: Torchlight — warm parchment on near-black, the GerdQuest house look
- Tavern is now Torchlight, retuned to the franchise palette and free from the start (was 1 prestige)
- If you had Tavern selected, you keep the same theme under its new name
- The other seven themes are unchanged and stay where they were

## v2.33.2 — 2026-08-04

- About: reworded the Clickpocalypse credit to thank minmaxia for the genre rather than claim descent

## v2.33.1 — 2026-08-04

- Internal: removed the vendored Clickpocalypse source from the repo and its history

## v2.33.0 — 2026-08-04

- The game is now called GerdQuest: Idle Depths — new title in the header, browser tab, and character creation screen
- Exported save files are now named gerdquest-save-<date>.json
- Internal: HTML rendering helpers extracted from main.ts into src/ui/html.ts, with test coverage tooling

## v2.32.68 — 2026-06-12

- Refactor tick() into applyManaSurge/scanParty/computePartyDps/applyLifesteal/applyEnemyDamage/applyCorruption — behavior identical
- Consolidate seven per-tick party scans into one pass; remove intermediate array allocations when counting runes

## v2.32.67 — 2026-06-12

- Add tick() characterization tests (lifesteal targeting, corruption heal reduction, divine wrath, runesmith bonus, berserker keystone, party-size scaling, mana-surge early return)

## v2.32.66 — 2026-06-12

- cloudLoad now distinguishes missing saves from server and network failures (CloudLoadResult)
- Pull Save shows accurate errors: 'No cloud save found' vs 'Could not reach the server' vs 'Server error (code)'

## v2.32.65 — 2026-06-12

- Add tests for cloud token storage, login URL, and cloudLoad/cloudSave fetch paths (cloud.ts now 100% covered)

## v2.32.64 — 2026-06-12

- Type-safe call() dispatcher: new GameAction type restricts dispatch to JSON-returning GameState methods with checked argument types
- Validate slot and auto-action strings from data-* attributes before dispatching

## v2.32.63 — 2026-06-12

- Add Quality union type + isQuality guard in gear.ts; remove `as never` casts in rollStats
- fromDict now falls back to common quality for corrupt saves instead of producing NaN costs

## v2.32.62 — 2026-06-12

- Add GameState.guildLevel() helper, replacing 20+ scattered `guildUpgrades[key] ?? 0` lookups

## v2.32.61 — 2026-06-12

- Extract shared pick/randInt/weightedPick helpers into src/utils.ts, removing duplicates from gear.ts and dungeon.ts

## v2.32.60 — 2026-05-26

- Remove write-only modal state variables (gearSlotModal, gearLootPicker, cdollModalNodeId, rrSelectedId) — actions use data-* attributes

## v2.32.59 — 2026-05-26

- Fix unhandled Promise rejections from saveGame, pullCloudSave, and setActiveDevice (closes #47, #48)

## v2.32.58 — 2026-05-26

- style.css: add explicit sans-serif generic fallback to all font-family var() declarations

## v2.32.57 — 2026-05-26

- main.ts cleanup: rename spr() → getSprite(), sort imports alphabetically, minor HTMLElement variable extractions

## v2.32.56 — 2026-05-25

- Rune inventory: removed character/slot dropdowns and Brand button — socketing is handled entirely through the rune slot modal

## v2.32.55 — 2026-05-25

- Gate boss multipliers increased: HP 1.5× → 2.0×, attack 1.25× → 1.5×

## v2.32.54 — 2026-05-25

- Boss per-dungeon scaling increased: BOSS_DUNGEON_MULT_BASE 1.6 → 1.75 (bosses are now ~9% harder per dungeon at d2, compounding steeply)

## v2.32.53 — 2026-05-25

- Equipment sub-tab now shows a notification dot when the loot bag is full; Loot sidebar tab badge reflects this alongside the Runes/Artifacts dots

## v2.32.52 — 2026-05-25

- Loot sidebar tab now shows a notification dot whenever any sub-tab (Runes or Artifacts) has an active notification

## v2.32.51 — 2026-05-25

- Artifact notification dot now lights up only when an equipped artifact has enough inventory duplicates to be leveled up (was incorrectly triggering on inventory-only duplicates)

## v2.32.50 — 2026-05-25

- Equipment pdoll squares now have a tinted background matching their quality color
- Set-piece items get a colored outline border using the set's accent color (Shadowbane=purple, Iron Bulwark=cyan, Plunderer's Kit=gold, Warlord's Grasp=red)
- Hovering any equipped set piece highlights all other pieces from the same set across the party
- Set badges in loot/stash panels are colored in the set's accent color and trigger the same highlight on hover

## v2.32.49 — 2026-05-25

- Constellation nodes now support 3 levels — each upgrade costs the node's shard cost again and multiplies the node's bonus by level
- Keystones remain binary (maxLevel 1); all other nodes support up to level 3
- Star map shows level badge on each invested node; modal shows current/max level and 'Upgrade to Lv N' button
- Respec now refunds level × cost per node (minus 10-shard fee)
- Backwards compat: old saves with constellation_nodes[] load each as level 1
- Mobile upgrade tab scroll fix: padding-bottom tracks live enemy panel height via ResizeObserver so content is never hidden behind the fixed bottom UI

## v2.32.48 — 2026-05-25

- Mobile upgrade grid: stat name removed from buttons (shown only on the left label); buttons now show cost + numeric bonus only (e.g. '+20%')
- Mobile upgrade grid: splits into groups of 3 characters with stat labels repeated per group, so 4-player parties display cleanly

## v2.32.47 — 2026-05-25

- Enrage progress bar now uses the floor-scaled trigger and step values so it fills correctly and reaches 100% before enrage kicks in; also fixed 'TheEnrage' typo in countdown label

## v2.32.46 — 2026-05-25

- Constellation tooltip fixed: switched to viewport-fixed positioning so it tracks the cursor correctly regardless of scroll
- Rune/artifact char-header now fills full card width (flex: 1 on info column)
- Boss enrage step (time between stacks) also scales down −1s per 5 floors, min 5s — matching the trigger reduction

## v2.32.45 — 2026-05-25

- Boss enrage trigger now scales with floor depth: −1s per 5 floors (15s at floor 1 → 14s at floor 5 → 5s at floor 50+, minimum 5s)

## v2.32.44 — 2026-05-25

- Constellation shard tree now fills the full panel width instead of capping at 600px

## v2.32.43 — 2026-05-25

- Rune and artifact char-headers now include thin HP and XP bars below the DPS line

## v2.32.42 — 2026-05-25

- Rune and artifact character cards now show the char-header (portrait, name, class/level, DPS) instead of a plain text label
- Rune card: stat summary chips moved below the pdoll grid

## v2.32.41 — 2026-05-25

- Auto-skill now only fires when no other skill is currently active — prevents overlapping duration effects

## v2.32.40 — 2026-05-25

- Gate bosses (floors 4, 9, 14… — the floor before each checkpoint) have 1.5× HP and 1.25× attack; their names include 'Guardian'

## v2.32.39 — 2026-05-25

- Bosses gain bonus HP based on party size (×√partySize): solo 1×, 2-member ×1.4, 4-member ×2.0

## v2.32.38 — 2026-05-25

- Gear pdoll grid now spans the full character card width, spacing squares evenly across the card

## v2.32.37 — 2026-05-25

- Character gear panel redesigned: 9 square icon buttons in a paper-doll grid layout (matching rune panel style) with quality-color borders and glow
- Filled gear slots: click opens a detail modal with stats, lock toggle, and remove button
- Empty gear slots with available loot: pulsing dashed border and loot count badge; click opens a loot picker modal sorted by quality
- Gear hide toggle updated to hide the new grid layout

## v2.32.36 — 2026-05-25

- Artifact detail modal (equipped): replaced Unequip button with '↔ Switch' (opens slot picker to swap) and a 🗑 trash icon button to remove back to inventory

## v2.32.35 — 2026-05-25

- Constellation: hover over any node shows a tooltip with name, path, description, and shard cost/unlocked badge
- Constellation: clicking a node now opens a modal instead of an inline card below the SVG
- Constellation: nodes scale up with a golden glow on hover

## v2.32.34 — 2026-05-25

- Party Artifacts tab: artifact slot boxes spread evenly across the card width

## v2.32.33 — 2026-05-25

- Party Artifacts tab: character cards now display 2 per row, matching the rune panel layout

## v2.32.32 — 2026-05-25

- Party Artifacts tab: replaced text-list slots with 3 square icon boxes per character matching the rune panel style; level badge (+N) shown in the top-right corner of each filled slot
- Artifact slot picker modal: clicking an empty artifact slot now opens an artifact picker (like the rune socket picker) instead of an inline dropdown

## v2.32.31 — 2026-05-25

- Customize screen: hovering over avatar or border items now shows a tooltip — 'From: <feat>' for earned items, 'Unlock via: <feat>' for locked ones

## v2.32.30 — 2026-05-25

- Feats: all 26 duplicate rewards replaced — added 10 new avatar cosmetics (Wolf, Pyromancer, Hawk Eye, Explorer, Archaeologist, Decorated, Coin Lord, Spellbinder, Gemcutter, Arbiter) and 16 new border styles (Crimson, Ember, Bronze, Shadow, Emerald, Frost, Twilight, Relic, Celestial, Obsidian, Platinum, Sovereign, Mystic, Storm, Runic, Spellfire); every feat now grants a unique reward

## v2.32.29 — 2026-05-25

- Runes: lesser tier badge now uses neutral gray instead of purple; rune cards get a tier-coloured left border (gray / purple / blue / gold) for at-a-glance distinction

## v2.32.28 — 2026-05-25

- Mobile: bottom nav bar now has 5 tabs — Combat, Upgrade, Prestige, Guild, Settings — with visible labels; Prestige and Guild tabs hidden until unlocked (closes #39)
- Mobile: removed Upgrades/Renown sub-tabs from Shop; Upgrade and Prestige are now top-level tabs

## v2.32.27 — 2026-05-25

- Feats panel: feats for locked features (Guild Hall, Constellations, Runes, Artifacts, Skills, Party slots) are hidden until the related feature is unlocked

## v2.32.26 — 2026-05-25

- Mobile upgrade grid: each button now shows current stat bonus and level number below the cost

## v2.32.25 — 2026-05-25

- Mobile: upgrade panel now shows a compact grid — stat names down, hero names across, one cost button per cell — instead of stacked per-character cards (fixes #43)

## v2.32.24 — 2026-05-25

- Mobile: remove HP display from header stats bar — the bottom HP bar is already shown there (fixes #42)
- Mobile: settings opens full-screen instead of a floating modal; Settings item hidden from profile dropdown since nav tab already provides it (fixes #44)

## v2.32.23 — 2026-05-25

- UI: Feats panel redesigned — card layout with status-colored left borders (purple=active, green=done), reward chips per tier, tier pips with threshold values, progress bar with count text, done badge instead of opacity fade

## v2.32.22 — 2026-05-25

- Feature: Auto Skill button — unlocks next to the skill button after all 6 skills are purchased; cycles through owned skills and fires one per kill, skipping any on cooldown
- Manual skill activation still works normally while Auto Skill is on

## v2.32.21 — 2026-05-25

- Feature: 15 new feats — Constellations (First Light, Stargazer, Constellation Master), Artifacts (Relic Finder, Archaeologist, Ancient Relic), Kill Streak (On a Roll), Party (Full Roster), Skills (Tactician)
- Feature: lifetimeBestKillStreak tracking — highest kill streak ever reached persists across runs

## v2.32.20 — 2026-05-24

- Balance: all Guild Hall costs doubled to slow down auto-gold progression
- Balance: Recruit Paladin and Recruit Ranger now require Dungeon 2+
- Balance: Constellation Chart now requires Dungeon 3+
- Balance: Consecrate, Volley, and Entangle are locked until their class is recruited

## v2.32.19 — 2026-05-24

- Balance: boss HP and attack now scale exponentially per dungeon (×1.6 each venture) instead of linearly (+40%) — later dungeons are meaningfully harder

## v2.32.18 — 2026-05-23

- UI: remove earned title from hero card — it's already shown in the header avatar label

## v2.32.17 — 2026-05-23

- Fix: Auto Upgrade now correctly reflects in serialized state — runAutoUpgrade was modifying internal upgrade levels without clearing the upgrades cache, so the UI stayed stale after each auto-buy

## v2.32.16 — 2026-05-23

- Visual: replace emoji icons with pixel sprites from 16x16.png — gear slots, class buttons, upgrade labels, rune icons, artifact icons, skill badges, and UI buttons now use crisp pixel art

## v2.32.15 — 2026-05-23

- Fix: party panel hidden when constellation is not unlocked — updateTabVisibility now resets left column to party tab whenever constellation access is absent

## v2.32.14 — 2026-05-23

- Fix: party panel hidden after save reset when constellation view was previously active — new hero creation now resets the left column to the party tab

## v2.32.13 — 2026-05-23

- Perf: cache loot pool, gear stash, artifact inventory, upgrades, and achievements list in toDict() — rebuilt only on mutation, not every tick
- Perf: saveGame() reuses the JSON string from the last respond() instead of re-serializing
- Perf: renderParty struct cache key replaced from nested JSON.stringify to a cheap partyVersion integer
- Perf: openPartyClassModal reads guild_upgrades from cached state instead of calling respond()

## v2.32.12 — 2026-05-23

- Memory: toDict() passes live references for log, rune_inventory, pending_achievements, and lifetime_enemy_kills instead of copying them every tick
- Memory: renderFeats cache key was joining 150+ achievement IDs and computing 37 progress buckets every tick before the early-return check — replaced with count + 1s timestamp key

## v2.32.11 — 2026-05-23

- Memory: eliminate JSON.stringify+JSON.parse on every tick — render now reads directly from cached GameStateDict in respond()
- Memory: renderLifetimeStats cache key no longer JSON.stringifies the full enemy kills map every tick
- Memory: renderGuildHall cache key no longer JSON.stringifies full rune inventory and party runes every tick

## v2.32.10 — 2026-05-23

- Fix Hall of Renown items being hard to click during rapid combat: highest_level was spuriously included in the prestige shop cache key, causing a full innerHTML rebuild on every boss kill

## v2.32.9 — 2026-05-23

- Memory optimization: constellation bonuses cached per-tick (was recomputed 7+ times per enemy death); reduced Chrome memory pressure from ~1.6 GB peak
- Bug fix: Last Stand keystone now actually fires — applyLastStandIfActive() was never called in tick()
- Memory optimization: achievement_progress throttled to 1s refresh (was 37 getValue() calls every 100ms)
- Memory optimization: earned_titles cached with dirty flag (was recomputed every tick)

## v2.32.8 — 2026-05-23

- Constellation node layout: reduced to 3 minors per constellation with ±15° angular spread, eliminating overlap between adjacent constellations

## v2.32.7 — 2026-05-23

- Constellation tree redesigned: all 7 paths now stem from a central Nexus node; strict tier progression center → start → minor → notable → keystone; no cross-constellation connections
- Artifact fuel modal: Select All checkbox at the top of the fuel list

## v2.32.6 — 2026-05-23

- Constellations are now account-wide: soul shards, unlocked nodes, and the Constellation Chart access all survive retirement

## v2.32.5 — 2026-05-23

- Soul Shards rate changed to 1 shard per 10 prestiges (floor) per venture — requires at least 10 prestiges to earn any

## v2.32.4 — 2026-05-23

- Fix: constellation panel now takes full width in left column instead of appearing next to the enemy panel

## v2.32.3 — 2026-05-23

- Constellations panel moved to left column as a sibling of the party panel — ⚔ Party / ✦ Stars toggle bar appears above both panels once the Constellation Chart is purchased

## v2.32.2 — 2026-05-23

- Empty rune slots open the socket modal directly instead of showing an intermediate empty-slot detail

## v2.32.1 — 2026-05-23

- Constellations moved to party sub-tab (✦ Stars) — switches with Party, Runes, Artifacts instead of occupying a sidebar tab

## v2.32.0 — 2026-05-23

- Constellations passive skill tree — 56 nodes across 7 themed constellations (Warrior, Guardian, Fortune, Sage, Hunter, Wanderer, Runesmith)
- Soul Shards: new resource earned by venturing to new dungeons (1 per prestige done)
- Unlock the tree via the new Constellation Chart Guild Hall upgrade (dungeon 2+)
- Node effects: DPS, HP, gold, XP, click damage, haste, defense, crit, rune bonus, loot quality; 7 keystones with unique mechanics
- Full respec available for 10 soul shards

## v2.31.39 — 2026-05-21

- Fix Eternal Cycle not appearing in Renown without refresh — guild_upgrades was missing from the prestige shop render cache key

## v2.31.38 — 2026-05-21

- Party Runes tab button hidden until Rune Forge is unlocked

## v2.31.37 — 2026-05-21

- Rune squares always visible on char-cards regardless of gear toggle state

## v2.31.36 — 2026-05-21

- Fix rune squares missing from char-cards — removed erroneous gear-hidden hide rule that suppressed .char-rune-row in both toggle states

## v2.31.35 — 2026-05-21

- Rune doll visual polish — medallion-depth slot circles, warm amber atmosphere card, tier-colored radial backgrounds, glowing stat chips, styled modals

## v2.31.34 — 2026-05-21

- Rune socket modal: tapping a rune immediately equips it — no confirm button needed

## v2.31.33 — 2026-05-21

- Rune doll: equipped slots now show the rune's emoji instead of the slot emoji

## v2.31.32 — 2026-05-21

- Rune paper doll: each slot now shows a slot symbol (helmet/chest/etc.) so equipped runes are identifiable; hover over an equipped rune slot shows a full tooltip

## v2.31.31 — 2026-05-21

- Rune slot detail now opens as a modal instead of an inline card below the doll

## v2.31.30 — 2026-05-21

- Party runes redesigned as paper-doll layout — slots arranged in body shape; tap a slot to see rune details and replace/remove; stats summary bar shows total rune bonuses per hero

## v2.31.29 — 2026-05-21

- Mobile: rune slot rows no longer overflow — select shrinks to fit within the available width

## v2.31.28 — 2026-05-21

- Mobile: party rune panel single-column fix — override now placed after base rule so cascade order is correct

## v2.31.27 — 2026-05-21

- Mobile: party rune panel now single-column so each hero's rune slots are full-width

## v2.31.26 — 2026-05-21

- Mobile shop tab: Upgrades / Renown sub-tab bar — switch panels without scrolling; selection persists across sessions

## v2.31.25 — 2026-05-21

- Mobile combat: Party / Equipment sub-tab bar — switch between hero cards and loot without scrolling; selection persists across sessions

## v2.31.24 — 2026-05-21

- Mobile: all hover-tooltip items now tappable — hero sprite, DPS, rune slots, artifact badges, set bonus badges, passive skill badges

## v2.31.23 — 2026-05-21

- Mobile: checkpoint text hidden from enemy panel — depth gauge on the left already shows it

## v2.31.22 — 2026-05-21

- Mobile: boss/elite portrait sits in the flex row as before — space always reserved so layout never shifts between regular and boss enemies

## v2.31.21 — 2026-05-21

- Mobile: tab bar shows icons only — labels hidden to save space
- Mobile: Guild Hall now correctly appears under the Guild tab instead of the Shop tab
- Mobile: boss/elite portrait no longer steals flex width — absolutely overlaid so enemy content stays full-width

## v2.31.20 — 2026-05-20

- Auto Upgrade toggle added to the loot panel alongside Auto Equip and Auto Sell — appears once the Auto Upgrade prestige upgrade is owned

## v2.31.19 — 2026-05-20

- Internal: type consolidation — removed redundant `inst.id as keyof typeof ARTIFACT_DEFS` casts (ArtifactInstance.id is already ArtifactEffectId) and a `state.retired_heroes as RetiredHero[]` cast

## v2.31.18 — 2026-05-20

- Internal: type consolidation — engine.ts and character.ts now use imported Slot/GearStats types instead of inline import() casts, and legacy artifact loaders use explicit (string | ArtifactInstance) unions

## v2.31.17 — 2026-05-20

- Internal: type consolidation — removed redundant casts on GearItemDict fields (set_name, short_name), state.prestige_upgrades, state.guild_upgrades, state.death_floors, and state.party[0]

## v2.31.16 — 2026-05-20

- Internal: type consolidation — runeInv/party/findCombinePairs/buildRuneTooltipHTML now use Rune and CharDict types instead of any[]

## v2.31.15 — 2026-05-20

- Internal: type consolidation — removed remaining inline artifact slot shapes and `c: any` party-map casts in renderArtifactPanel and renderArtifactModalBody, leveraging CharDict and ArtifactInstance

## v2.31.14 — 2026-05-20

- Internal: type consolidation — removed (state as any) casts in main.ts and replaced inline artifact shapes with the ArtifactInstance type

## v2.31.13 — 2026-05-20

- Internal: type consolidation — removed (c as any) casts in main.ts for CharacterDict fields (artifact_slots, locked_slots, applied_set_bonuses) and Rune fields (tier, type, statKey, value)

## v2.31.12 — 2026-05-19

- Internal: type consolidation — added EnemyDict, aligned CharacterDict.artifact_slots and GameStateDict.artifact_inventory with ArtifactInstance

## v2.31.11 — 2026-05-19

- Internal: DRY refactor — consolidated mirror functions, party-slot loops, and shared helpers (net −95 lines)

## v2.31.10 — 2026-05-19

- Char-cards: passive skill badges now wrap horizontally instead of stacking vertically

## v2.31.9 — 2026-05-19

- Char-cards: hero level now shown inline with class name (e.g. 'mage Lv 12')
- Char-cards: passive skill badges now always visible at the bottom of each card, below gear rows

## v2.31.8 — 2026-05-19

- Fix: boss portrait border sometimes missing on first appearance — all border images now preloaded at startup

## v2.31.7 — 2026-05-19

- Sticky enemy bar: now reliably appears on scroll using getBoundingClientRect rather than IntersectionObserver with a stale rootMargin

## v2.31.6 — 2026-05-19

- Enemy panel: removed redundant 'BOSS FIGHT' / 'ELITE ENEMY' label row — pips already signal this
- Enemy panel: removed 'X monsters until boss' countdown text — pips convey the same information

## v2.31.5 — 2026-05-19

- Sticky enemy bar: when scrolling past the enemy panel, the enemy name and HP bar slide in attached to the bottom of the header

## v2.31.4 — 2026-05-19

- Hovering a set bonus badge now shows the 2pc and 3pc stat bonuses for that set

## v2.31.3 — 2026-05-19

- Hovering the hero sprite now shows the same character stat tooltip as hovering the name

## v2.31.2 — 2026-05-19

- Desktop char-cards now use the same single-row layout as mobile — sprite | info | HP+XP bars in one row, gear full-width below

## v2.31.1 — 2026-05-19

- Renown list: locked Party Members card now sorts just above owned items instead of floating among purchasable ones

## v2.31.0 — 2026-05-19

- Boss titles are now gender-balanced: Lord, Lady, King, Queen, Emperor, Empress, Warlord, Matriarch, Overlord, Sovereign — randomized on each spawn

## v2.30.9 — 2026-05-19

- Mobile char-card redesigned: hero sprite, name/class/DPS, and HP+XP bars now appear in a single compact row with equipment below

## v2.30.8 — 2026-05-19

- Boss portrait borders now glow with their accent color only when enraged — each border has a unique color matched to its artwork (cyan Titan, purple Abyssal, red Dread, gold Eternal, white Forsaken, orange Infernal, grey Shadow, green Undying, bronze Ravager, silver Ancient)

## v2.30.7 — 2026-05-19

- Mobile: enemy panel is now significantly more compact (tighter gaps, smaller text, single-row floor progress)
- Mobile: party panel now appears above the loot section so it's immediately visible on the combat tab

## v2.30.6 — 2026-05-18

- Titan boss border now glows gold with a pulsing amber light instead of rendering as a flat image

## v2.30.5 — 2026-05-18

- Enemy attack damage now scales as level^1.3 instead of linear — high-floor enemies hit significantly harder
- Lifesteal heals at only 25% effectiveness against bosses and elites

## v2.30.4 — 2026-05-18

- DPS upgrade effect further reduced from 2% to 1% per level

## v2.30.3 — 2026-05-18

- Companion names are now class-themed non-binary names (e.g. Vesper the rogue, Rowan the druid)

## v2.30.2 — 2026-05-18

- DPS upgrade effect reduced from 5% to 2% per level to rebalance late-game boss difficulty

## v2.30.1 — 2026-05-18

- Character card and name tooltip now show effective DPS (including upgrade multiplier)
- Party tooltip total DPS also reflects upgrade multipliers

## v2.30.0 — 2026-05-18

- Boss/elite enrage now triggers at 15 seconds (down from 20)

## v2.29.9 — 2026-05-18

- Gear adjective now reflects the primary stat — DPS drops say 'of destruction', HP drops say 'of fortitude', etc.

## v2.29.8 — 2026-05-18

- Enrage bar now stacks layers per level — each layer gets progressively darker red
- Monster portrait border escalates in intensity with each enrage stack
- Enrage pulse animation speeds up with each stack

## v2.29.7 — 2026-05-18

- Click upgrade is now +5%/level multiplier on click damage (scales with DPS and gear)
- HP upgrade is now +5%/level of current max HP instead of flat +15

## v2.29.6 — 2026-05-18

- DPS upgrade is now a +5% multiplier per level instead of flat +0.5 — scales with gear

## v2.29.5 — 2026-05-18

- Upgrade rows now show total bonus next to level (e.g. '+1.5 DPS')
- DPS breakdown tooltip shows upgrade DPS contribution as a number instead of a level

## v2.29.4 — 2026-05-18

- Starting Gold renown now scales exponentially — each level covers all upgrade costs up to that level

## v2.29.3 — 2026-05-18

- Account dropdown: added Best Dungeon count alongside Best Floor

## v2.29.2 — 2026-05-18

- Header stays visible while scrolling (position: sticky)

## v2.29.1 — 2026-05-18

- Fix: Account column in avatar dropdown now shows Best Floor (lifetime high) instead of current dungeon number

## v2.29.0 — 2026-05-18

- Stats moved from Settings into the avatar dropdown — two live columns: Hero (name, class, level, floor, gold, kills, deaths) and Account (dungeon, best floor, returns, total kills, total deaths)
- Kill details modal accessible via 'Kill details →' link at the bottom of the dropdown and the footer button
- Removed Lifetime Stats row from Settings

## v2.28.9 — 2026-05-18

- Fix: selecting an avatar, border, or title in the Customize modal now immediately highlights the active choice

## v2.28.8 — 2026-05-18

- Death toast: a crimson narrative toast appears when your party is defeated — 6 floor-1 'mysterious wakeup' lines and 4 checkpoint 'dragged to safety' lines, drawn at random

## v2.28.7 — 2026-05-18

- Return to Town now shows a homecoming toast — a rotating villager flavor line, renown earned, and a note that the dungeon shifts anew
- Confirm dialog now explains why upgrades reset: the dungeon's passages rearrange while you rest

## v2.28.6 — 2026-05-18

- Renamed prestige to 'Return to Town' — Prestige Shop is now 'Hall of Renown', prestige points are 'renown', and the tab reads 'Renown'

## v2.28.5 — 2026-05-18

- Set piece tooltips: hovering a set item now shows the set name, 2pc/3pc bonuses, and how many pieces are currently equipped — active bonuses are highlighted, inactive ones dimmed

## v2.28.4 — 2026-05-18

- Boss/elite enrage multiplier no longer caps at 5× — it scales unbounded until the player is defeated

## v2.28.3 — 2026-05-18

- Fix: prestige shop badge no longer appears after retirement (stash costs 0pt but requires Dungeon 3; badge now checks dungeon requirement)

## v2.28.2 — 2026-05-18

- Fix: Paladin/Ranger/Druid locked by default in character creation (were missing disabled attribute)
- Class picker now uses a 3-column grid so all 6 classes fit cleanly

## v2.28.1 — 2026-05-18

- Fix: legacy titles (Veteran, Twice-Born, The Eternal) now appear in Customize title picker and can be set via setEarnedTitle
- Fix: locked class buttons in character creation no longer selectable on click

## v2.28.0 — 2026-05-18

- Hero Retirement: retire your hero after reaching Dungeon 2 for a hard reset with legacy rewards
- Hall of Fame: retired heroes are scored and preserved forever in the Hall of Fame
- Legacy unlocks: retirement milestones unlock Paladin, Ranger, and Druid classes plus titles, avatars, and borders
- Locked class picker: Paladin/Ranger/Druid shown as locked in character creation until earned via retirement
- Retire button in avatar dropdown (enabled only when dungeonIndex ≥ 1)
- Retirement confirmation modal with legacy reward preview

## v2.27.7 — 2026-05-18

- Party cards: hero portrait now matches char-header-left height; shrinks to name/class/DPS when gear is visible

## v2.27.6 — 2026-05-18

- Fix: Striking rune icon now renders correctly as ⚔️ emoji instead of a text glyph

## v2.27.5 — 2026-05-17

- New artifact: Phantom Compass 🧭 — +10% XP gain per level
- New artifact: Fortune's Eye 💎 — +5% gear drop chance per level (additive, stacks across party)

## v2.27.4 — 2026-05-17

- Prestige: Party Members card now sorts with the rest of the shop items by cost

## v2.27.3 — 2026-05-17

- Tablet/mobile: party HP bar fixed above the enemy panel, turns red below 30% HP

## v2.27.2 — 2026-05-17

- Tablet: avatar moves to top-right of header row alongside the title, sized to match

## v2.27.1 — 2026-05-17

- Mobile layout now applies on tablets up to 1280px wide (was 768px); Galaxy Tab S6 Lite now uses mobile UI

## v2.27.0 — 2026-05-17

- Avatar button opens a 3-item dropdown menu: Customize, Settings, About
- Customize modal: avatar, border, and title pickers (moved from inline dropdown)
- About modal: game description and credits
- Visual theme picker moved into the Customize modal

## v2.26.3 — 2026-05-17

- Eternal Cycle (auto-prestige) moved from Prestige Shop to Guild Hall — unlock for 8,000g, then toggle and set threshold there

## v2.26.2 — 2026-05-17

- Fixed auto-attack not firing — interval was being cleared every render tick (100ms) before it could fire (1000ms)

## v2.26.1 — 2026-05-17

- Fixed: boss/elite damage now uses total party size, not living count — last survivors are no longer safer than a full party

## v2.26.0 — 2026-05-17

- Auto-Attack: unlock in the Guild Hall (3,000g) then toggle the AUTO button next to Attack
- Auto-Attack fires a full-damage click every second while enabled; persists across reloads

## v2.25.1 — 2026-05-17

- Enemy panel no longer resizes when enrage bar appears — space is always reserved

## v2.25.0 — 2026-05-17

- Boss and elite enemies enrage after 20 seconds — attack multiplies by 1.5× every 10s, capped at 5×
- Enrage progress bar appears below enemy HP during boss/elite fights
- Portrait glows red and pulses when an enemy is enraged

## v2.24.8 — 2026-05-17

- Elite portrait border now shows as a full 5px purple frame instead of corner-only slivers

## v2.24.7 — 2026-05-17

- Boss/elite portrait now disappears correctly when a normal enemy appears
- Portrait reserves a fixed space in the enemy panel — no more layout shifts

## v2.24.6 — 2026-05-17

- Monster portrait no longer stretches when the enemy panel is tall

## v2.24.5 — 2026-05-17

- Monster portrait no longer shifts the enemy panel size when a boss or elite appears

## v2.24.4 — 2026-05-17

- Loot sub-tabs (Equipment / Runes / Artifacts) now sync the party panel view automatically

## v2.24.3 — 2026-05-17

- Loot sidebar now stays on screen while scrolling through character cards

## v2.24.2 — 2026-05-17

- Fixed Entangle skill button showing raw ID instead of name/icon

## v2.24.1 — 2026-05-17

- Corruption rate reduced from 0.3% to 0.15% of max HP per second per depth
- Corruption multiplier capped at 20 so deep floors don't spiral out of control

## v2.24.0 — 2026-05-17

- 6th party slot (Slot VI) — recruit a Chosen companion (requires Companion Hall III)
- New class: Druid — Regrowth (party lifesteal Lv5), Thornwall (+40% DPS Lv10), Wild Growth (heal 2% maxHP per kill Lv20)
- New Druid skill: Entangle — reduces enemy attack by 60% for 8 kills (20-kill cooldown, Dungeon 3+)
- Companion Hall expanded to 3 levels (unlocks Slot IV, V, and VI)
- Party Slots consolidated into a single 'Party Members' card in the Prestige Shop
- Eternal Cycle — auto-prestige toggle with configurable point threshold
- Prestige boosts (XP, DPS, gold, etc.) now reset when venturing to a new dungeon

## v2.23.4 — 2026-05-17

- Fixed elite monster portrait being off-center during the entrance animation

## v2.23.3 — 2026-05-17

- Corruption now only applies in dungeon 2+ and starts at floor 20 (was floor 25 in all dungeons)
- Corruption scales with dungeon number — dungeon 3 is 2x as strong, dungeon 4 is 3x, etc.

## v2.23.2 — 2026-05-17

- Consecrate is now an instant heal — activating it immediately restores 50% max HP to all living party members (was a 25%-per-kill buff over 5 kills)

## v2.23.1 — 2026-05-17

- New dungeons unlock every 5 floors past floor 40 (was every 10)

## v2.23.0 — 2026-05-17

- Dungeon corruption: below floor 25, all party members take passive damage scaling with depth (% of maxHealth/s)
- Corruption reduces lifesteal effectiveness by 6% per floor of depth, capped at 90% — deep floors punish healing-heavy builds
- A pulsing ☠ Corruption indicator in the stat bar shows total damage/s and lifesteal reduction when active

## v2.22.5 — 2026-05-17

- Fixed profile picker tabs (Avatar/Border/Title) closing the dropdown when clicked

## v2.22.4 — 2026-05-17

- Artifact badges on char cards now show a rich hover tooltip with name, level, and current stat effect
- Party cards no longer rebuild the full DOM on every kill — only HP/XP and empty gear slot dropdowns update in-place

## v2.22.3 — 2026-05-17

- Removed skill cooldown progress bar — cooldown status is now shown in the hover tooltip

## v2.22.2 — 2026-05-17

- Skill button tooltips now show live cooldown status: '✓ Ready', '⚡ Active — N kills remaining', or '⏳ Cooldown — N / X kills'

## v2.22.1 — 2026-05-17

- Clicking Maniac feat now counts only Attack button presses — spacebar/Enter deal click damage but don't count toward the achievement

## v2.22.0 — 2026-05-17

- Numbers now use commas below 10,000 (e.g. 9,999) and shorthand above (10k, 1.5m, 2b) — applied to gold, sell values, upgrade costs, prestige points, feat thresholds, and reward text

## v2.21.1 — 2026-05-17

- Fixed Feats panel flickering and hard-to-click filter buttons — filter tabs now live in a stable element separate from the feat list

## v2.21.0 — 2026-05-17

- Title picker moved from the Feats panel into the profile dropdown (Avatar → Border → Title tabs)
- Default title is now 'nobody' — shown on the character card from the start
- Header avatar button label now always reflects the currently selected title

## v2.20.0 — 2026-05-17

- Artifact badges on the character card now show a tooltip with the current computed stat (e.g. '+10% party DPS')
- Cosmetic rewards (avatars/borders) are now backfilled on load for saves predating the cosmetic system
- Removed loot filter (dim non-upgrades) button

## v2.19.0 — 2026-05-17

- Feat progress bars now show real progress toward the next tier milestone
- Feat reward descriptions now show avatar icon+name or border name (all feat rewards are cosmetics)
- Mystery feats now trigger a special 'Mystery Feat Revealed!' notification when completed
- Filter tabs on the Feats panel: All / In Progress / Completed
- Feats sort within categories: active progress first, completed last
- Category headers show completion count (e.g. ⚔ Combat 3/7)
- Fixed missing Runes category label in Feats panel
- Credits: added peeplover23 as tester

## v2.18.0 — 2026-05-17

- Feat rewards are now cosmetic: avatars and borders replace prestige point grants (prestige points come from prestiging, not from feats)
- Player profile widget in the Prestige panel shows your active avatar, border, and title — click Customize to pick from earned unlocks
- 10 avatars and 8 borders unlockable through achievements
- New feat: Clicking Maniac — earn border and avatar rewards for lifetime click milestones (100 / 1,000 / 10,000 clicks)
- Die-hard feat now tracks lifetime deaths across all prestige runs, not just the current run

## v2.17.0 — 2026-05-17

- New artifact: Warlord's Sigil 🔱 — +5% party DPS per level (flat, always-on)
- New prestige upgrade: DPS Bonus — +5% party DPS per stack
- New prestige upgrade: Combine All Runes — auto-combines all matching rune pairs in sequence (Dungeon 3+)
- Artifact fuel progress bar animates a preview when you select fuel — rushes through level-ups, eases to the final position

## v2.16.0 — 2026-05-16

- Artifact leveling now uses a fuel-unit system: higher-level artifacts are worth more (lv0=1, lv1=2, lv2=4, lv3=7)
- Fuel accumulates on the artifact — partial fills are stored and persist across multiple sacrifices
- Overflow cascades: excess fuel automatically triggers additional level-ups in one action
- Equipped artifacts can now be leveled up directly from their slot without unequipping
- Sell button added to equipped artifact modal

## v2.15.3 — 2026-05-16

- Clicking an equipped artifact slot opens the detail modal showing artifact stats and an Unequip button
- Modal notes how many other copies of that artifact are in inventory when viewing an equipped one

## v2.15.2 — 2026-05-16

- Artifact level-up modal now shows a checklist of all copies available as fuel — you choose exactly which ones to sacrifice
- Higher-level artifacts can be used as a single fuel slot (e.g., a +3 bloodstone counts as one of the required copies)
- Level Up button only activates when exactly the right number of fuel copies are checked

## v2.15.1 — 2026-05-16

- Click any artifact in the Artifacts panel to open a detail modal for leveling up, equipping, or selling
- Modal shows fuel count, cost, and a full-width Level Up button; stays open so you can keep leveling
- Artifact rows now show a purple left-border accent when a level-up is ready

## v2.15.0 — 2026-05-16

- Artifacts now have endless levels instead of a single merge: equip N+1 copies of the same artifact to level it up to +N
- Level-up cost scales: going from +N to +N+1 costs N+1 fuel artifacts of the same type
- Leveled artifacts show a '+N' badge in the Artifacts panel and on hero card icon strips
- All artifact effects scale with level: a +2 artifact is 3× as effective as a base copy
- Old upgraded artifacts (Sanguine Bloodstone, Titan's Eye, etc.) automatically migrate to their base counterpart at level +1
- Removed the six separate 'upgraded' artifact definitions; all six base artifacts now level indefinitely

## v2.14.7 — 2026-05-16

- Amber notification dot on Runes tab when a combine or artifact forge is ready
- Amber notification dot on Artifacts tab when a combine (2× same artifact → upgraded) is available

## v2.14.6 — 2026-05-16

- Forge Artifact banner now appears as soon as you have any ancient rune, showing progress (e.g. 3 / 10); button is disabled until 10 are accumulated

## v2.14.5 — 2026-05-16

- Rune sink: trade 10 ancient runes (any mix of types) for a random base artifact — Forge button appears in the Runes panel when you have enough

## v2.14.4 — 2026-05-16

- Hero cards now show equipped artifact icons at the top (below the rune strip); hovering shows artifact name and effect
- Artifact badges hidden in condensed HP+XP view (gear-hidden mode)

## v2.14.3 — 2026-05-16

- Artifact inventory no longer flickers every tick — render cache prevents DOM rewrite when nothing changed, making the equip dropdown selectable
- Party Artifacts panel: empty slots now show an inline artifact dropdown + Equip button (matching the Rune panel UX) instead of static 'equip from Artifacts tab' text

## v2.14.2 — 2026-05-16

- Loot panel split into 3 sub-tabs: Equipment (loot chest + stash), Runes, Artifacts — no more separate top-level Artifacts sidebar tab
- Runes and Artifacts sub-tabs appear only when unlocked/earned; each shows a live item count in the tab button

## v2.14.1 — 2026-05-16

- Artifact equip: moved Equip button + character/slot dropdown into the sidebar Artifacts panel alongside the artifact — no more hunting for it in a separate party tab
- Fixed: #artifact-panel was missing from the sidebar CSS display:none list, causing it to render on top of other panels instead of participating in the tab system

## v2.14.0 — 2026-05-16

- Artifact system: 6 base artifacts drop from dungeon-3+ bosses (10% chance) — Bloodstone, Berserker's Eye, Greed Idol, Soulbrand, Warden's Core, Executioner's Mark
- Artifacts: combine 2 identical base artifacts into 1 upgraded artifact (6 upgraded variants)
- Artifacts: each character has 3 artifact slots; effects apply dynamically during combat
- Artifacts: persist through prestige — separate ✨ Artifacts sidebar tab and party panel tab appear once you earn your first artifact
- Kill streak tracker: increments per kill, resets on party wipe (used by Berserker's Eye / Titan's Eye DPS bonuses)

## v2.13.8 — 2026-05-16

- Gear rows: lock button and unequip button now stay on the same line — grid expanded from 4 to 5 columns
- Gear rows: quality adjective (Rare, Epic, etc.) no longer shown in the item name — color already conveys quality; name now shows 'sword of valor' instead of 'Epic sword of valor'

## v2.13.7 — 2026-05-16

- Memory: game loop interval now stored and cleared before re-init — prevents duplicate loops on re-initialization
- Memory: portrait animation timeouts (750ms/380ms) now cancelled before re-scheduling — prevents stacking on rapid boss/elite transitions
- Memory: feats badge hide-timeout now cancelled before re-scheduling — prevents stacking when multiple achievements unlock in sequence
- Memory: appendLog now trims the combat-log DOM to 50 entries — prevents unbounded node growth from repeated error messages

## v2.13.6 — 2026-05-16

- Idle gold stat now reads 'Idle: X/s' instead of '⚙ X/s'; hover shows tooltip 'Gold earned per second from idle companions'

## v2.13.5 — 2026-05-16

- Fixed: elite enemy portrait no longer shows a broken image icon in Chrome — border <img> is now hidden by default and explicitly re-hidden when an elite (not boss) appears

## v2.13.4 — 2026-05-16

- Credits: added asphaltbuffet to testers

## v2.13.3 — 2026-05-16

- Fixed: Chrome broken-image icon on elite enemy portrait (border `<img>` now uses removeAttribute('src') instead of src='')
- Performance: eliminated redundant game-state serializations — tick saves now throttled to every 5 s (was every 100 ms), cutting localStorage writes from 20/s to 0.2/s and reducing GC pressure that caused high memory usage in long sessions

## v2.13.2 — 2026-05-16

- Fixed: boss portrait no longer overflows panel in Firefox — replaced non-standard `width: stretch` with `width: auto` on the absolutely-positioned portrait and border images, which are already sized by their `inset` property

## v2.13.1 — 2026-05-16

- Gear locking: click the 🔓 button on any gear slot to lock it — auto-equip and Equip All will not replace locked items; manual equip still works as override
- Lock state survives prestige and saves/loads correctly; locked slots show a gold left-border
- Ring slots can be locked independently; both rings locked prevents any auto ring replacement

## v2.13.0 — 2026-05-16

- Named Gear Sets: four sets (Shadowbane, Iron Bulwark, Plunderer's Kit, Warlord's Grasp) each with 2pc and 3pc stat bonuses
- Bosses always drop a set piece; elite enemies have a 15% chance to drop a set piece
- Set pieces are always at least rare quality and display with gold styling throughout the UI
- Active set bonuses shown as badges on each character card (gold = 2pc, bright = 3pc)

## v2.12.3 — 2026-05-16

- Fixed: enemy panel height no longer grows when boss/elite portrait appears — portrait wrap now has a fixed height so the panel stays stable even before the image slides in

## v2.12.2 — 2026-05-16

- Fixed: enemy panel no longer bounces when boss/elite portrait slides in — enemy name is now clipped to one line and panel content is top-anchored so the vertical position never shifts

## v2.12.1 — 2026-05-16

- Fixed: 'Warlord' boss title now reads 'Ravager' to avoid 'Warlord … Lord' repetition
- Fixed: Shop badge no longer shows when guild hall upgrades are locked or unaffordable (checks guild_hall_access + dungeon requirement)
- Fixed: Header gold number now reserves stable width to prevent layout shift as gold grows
- Added: 📦 button on each loot item lets you send it directly to the stash (disabled when stash is full)

## v2.12.0 — 2026-05-16

- Gear Stash: persistent cross-prestige storage unlocked via Prestige Shop in Dungeon 3+ (Lv1: 3 slots free, Lv2: 6 slots 2pt, Lv3: 10 slots 5pt, Lv4: 15 slots 10pt)
- Unequipping gear now goes to stash first (if unlocked and not full), then loot pool
- Stash items can be equipped to any party member or sold from the loot panel
- Stash persists through prestige but clears on venture

## v2.11.5 — 2026-05-16

- Rune achievements now appear in the Feats panel under a 🔮 Runes category
- Fix: elite/boss glow border no longer causes layout jump — shadow fades in smoothly with a transition

## v2.11.4 — 2026-05-16

- Fix: Consecrate now correctly heals on all 5 kills of its duration (was healing only 4 due to decrement-before-check off-by-one)

## v2.11.3 — 2026-05-16

- Lifetime Stats panel now shows current Dungeon number

## v2.11.2 — 2026-05-16

- Fix: massive memory reduction — floor progress pips, combat log, and lifetime stats now skip DOM rebuilds when nothing changed

## v2.11.1 — 2026-05-16

- Fix: gear unequip ✕ button no longer flickers — party card DOM is now stable between ticks (HP/XP update in-place instead of full rebuild)

## v2.11.0 — 2026-05-16

- Toggleable auto actions: Auto Equip and Auto Sell can each be turned ON/OFF from the loot panel; state persists across saves

## v2.10.9 — 2026-05-16

- Empty gear slots now show a dropdown of matching loot + Equip button, just like the rune panel

## v2.10.8 — 2026-05-16

- Fix: gear unequip ✕ button now sits inline after stats; no longer flickers on hover

## v2.10.7 — 2026-05-16

- Fix: add 'runes' to AchievementCategory type (TypeScript error broke CI deploy)

## v2.10.6 — 2026-05-16

- Gear unequipping: hover a gear slot to reveal ✕ button; unequipped item returns to loot chest

## v2.10.5 — 2026-05-16

- 12 new achievements: Not Alone, Band of Heroes, Battle Ready, Arsenal, Arcane Brand, Forge Master, Fully Attuned, Ancient Power, Gem Collector, Rune Trader, Elite Hunter, Upgrade Junkie
- Lifetime tracking counters: elite kills, runes sold, runes combined, skill activations, upgrades bought

## v2.10.4 — 2026-05-16

- Passive skills moved inside header column, alongside the hero image instead of below it

## v2.10.3 — 2026-05-16

- Passive skills moved to hero card above HP bar, next to rune quick-reference row

## v2.10.2 — 2026-05-16

- Move passive skills from hero card to Rune page (below each character's rune slots)

## v2.10.1 — 2026-05-16

- Rune page: passive skills shown below each character's rune slots

## v2.10.0 — 2026-05-16

- Hide header settings button on tablet/mobile (≤768px) — use the ⚙ tab in the bottom nav instead

## v2.9.9 — 2026-05-16

- Stats bar wraps to two rows on laptop-sized screens (769–1280px) to prevent overflow

## v2.9.8 — 2026-05-16

- Fix: changelog modal no longer renders behind the settings modal (duplicate z-index declaration)

## v2.9.7 — 2026-05-16

- Prestige Shop and Guild Hall show current level stats (e.g. Checkpoint shows current respawn floor)

## v2.9.6 — 2026-05-16

- Credits: split Jeremy's Art and Testing into separate entries; added The Spider Knight and Feyla as testers

## v2.9.5 — 2026-05-15

- Companion active skills display in a single row instead of stacked vertically

## v2.9.4 — 2026-05-15

- Rune page: empty slots show a rune dropdown + Brand button to socket directly from the slot
- Rune page: filled slots have an ✕ button to remove the rune back to inventory

## v2.9.3 — 2026-05-15

- Rune inventory sorted by tier (descending) then alphabetically by type

## v2.9.2 — 2026-05-15

- Party rune panel displays hero rune cards in 2-column grid (matches party panel layout)

## v2.9.1 — 2026-05-15

- Rune inventory displays in 2-column grid (matches hero card layout)

## v2.9.0 — 2026-05-15

- Move rune combine UI from Guild Hall to the Loot page (alongside rune inventory)

## v2.8.9 — 2026-05-15

- Fix: rune combine tiers corrected — Forge 2: lesser→greater, Forge 3: greater→flawless, Forge 4: flawless→ancient

## v2.8.8 — 2026-05-15

- Fix: upgrade buttons no longer flicker when idle gold ticks in Dungeon 2+ — affordability now updates in-place without rebuilding the DOM

## v2.8.7 — 2026-05-15

- Loot chest and rune inventory are now fixed height (always 5 items tall) — no more layout bounce

## v2.8.6 — 2026-05-15

- Loot chest: fixed-height scrollable list (~5 items), sorted by quality highest-to-lowest
- Rune inventory: fixed-height scrollable list (~5 runes), sorted by tier highest-to-lowest

## v2.8.5 — 2026-05-15

- Rune inventory: Sell button on each rune, Sell All button at top of rune list
- Sell values: Lesser 10g, Greater 30g, Flawless 90g, Ancient 250g

## v2.8.4 — 2026-05-15

- Party size gold bonus: +20% boss gold per additional party member (2 members = +20%, 5 members = +80%)
- Stats bar shows the active bonus when party size > 1

## v2.8.3 — 2026-05-15

- 4-tier rune system: Lesser → Greater → Flawless → Ancient (each 2× the previous)
- Rune Forge Tier 4 (40k) unlocks: combine 2× Greater → Flawless, 2× Flawless → Ancient
- New rune colors: Flawless (blue), Ancient (gold) on char cards, party panel, and tooltips

## v2.8.2 — 2026-05-15

- Guild Hall price reductions: companion_hall II 15k→8k, paladin/ranger 6k→4k, consecrate/volley 8k→5k, rune_forge 8k/20k/50k→5k/10k/20k

## v2.8.1 — 2026-05-15

- New prestige upgrade: Gold Bonus (+10% gold from kills per stack, 1pt base with scaling cost)

## v2.8.0 — 2026-05-15

- Elite enemies now drop runes at 10% chance (bosses remain at 20%) when Rune Forge is owned
- Rune inventory empty message and Rune Forge description updated to mention both drop sources

## v2.7.9 — 2026-05-15

- Socketed runes now survive prestige — rune stats are re-applied to the fresh party after each reset

## v2.7.8 — 2026-05-15

- Boss encounters now glow red — enemy panel border and name turn red during boss fights (mirrors the purple elite glow)

## v2.7.7 — 2026-05-15

- Defense upgrade re-added to auto-upgrade rotation

## v2.7.6 — 2026-05-15

- Party panel: Party / 🔮 Runes tab switcher — Runes tab shows each character's socketed slots at a glance
- Rune inventory moved to the Loot panel — brand runes directly alongside loot with per-character slot selectors
- Slot selector shows existing rune tier in parentheses (e.g. 'Main Hand (lesser)'); updates when character changes
- Character cards show a row of 9 rune slot squares below DPS — empty outlines, tan for lesser, purple for greater
- Hovering a filled rune square shows a stat tooltip (name, tier, slot, bonus) matching the gear tooltip style
- Rune squares also appear in the hero stat card tooltip; DPS breakdown shows a Runes row when Striking runes are socketed

## v2.7.5 — 2026-05-15

- Gold rewards now scale +1% per dungeon level — floor 20 yields ~20% more gold, easing mid-game slowdown
- Auto-upgrade no longer reserves gold for Guild Hall purchases — spends freely again

## v2.7.4 — 2026-05-15

- Skill tooltip descriptions updated to reflect balanced cooldown/duration values
- Loot header restructured into 2 rows — title/icons on top, Equip All/Sell All buttons below (fixes overlap)
- Elite enemy portrait now shows monster sprite with purple CSS glow frame (no border PNG distortion)
- Boss border art cropped to bounding box — transparent padding removed for correct framing
- Defense upgrade removed from auto-upgrade rotation; base cost raised to 150g (buy manually)
- Auto-upgrade now reserves gold equal to the next available Guild Hall purchase before spending

## v2.7.3 — 2026-05-15

- Skill balance pass — all active skills now contribute ~40-50% average DPS boost
- Battle Cry: CD 30→20, duration 5→8 kills (was the weakest at ~17% avg boost, now 40%)
- Shadow Strike: now boosts tick DPS as well as clicks (was idle-useless); 3× mult, CD 20, dur 5
- Arcane Surge: duration 5→6 kills (slight buff to 48% avg boost)
- Consecrate: CD 20→15 kills (more frequent healing)
- Volley: mult 4×→2.5×, dur 4→6 kills (was strongest at 60% avg, now 50%)

## v2.7.2 — 2026-05-15

- Elite enemies: 15% chance to spawn a rare elite variant with 2.5× HP, 1.5× attack, 2× XP/gold, and a guaranteed loot drop
- Elites display with purple name, glowing border, ⚡ ELITE ENEMY ⚡ floor indicator, and monster portrait with purple CSS frame
- New boss border art for all 10 boss types (cleaner style from Jeremy)

## v2.7.0 — 2026-05-15

- Major update — significant new content and UI overhaul across the board
- Rune Forge: socket runes into gear for flat stat bonuses; 12 rune types (Lesser/Greater); boss drops; Tier 2 rune recovery; Tier 3 combining
- Achievements (Feats): 25 achievements across 6 categories with Bronze/Silver/Gold tiers, rewards, and earned titles
- Prestige-locked visual themes: 8 themes unlocked by prestige count
- Defense upgrade: 5th per-character stat (+1% damage reduction per level)
- Title selector: pick any earned achievement title from the Feats panel
- Loot filter: dim non-upgrade items in the loot chest with one click
- Combat log history: scrollable 200-entry log modal
- Keyboard shortcuts: Space/Enter = Attack, E = Equip All, X = Sell All, S = Skill
- Settings moved to a header gear button (⚙) opening a full-page modal
- Guild Hall sorted by price ascending, owned items at the bottom
- Tooltip item names no longer include quality prefix
- Credits section added to Settings

## v2.6.83 — 2026-05-15

- Rune Forge: Guild Hall upgrade (3 tiers) — socket runes into gear slots for flat stat bonuses
- 12 runes: 6 types × 2 tiers (Lesser/Greater) — Striking (DPS), Warding (HP), Swiftness (Haste), Greed (Gold), Fortune (XP), Wrath (Crit)
- Boss kills (20% chance) drop random lesser runes when Rune Forge is purchased
- Branding: Tier 1 destroys old rune; Tier 2 returns it to inventory
- Combining: Tier 3 lets you combine two matching lesser runes into a greater
- Rune inventory rendered in Guild Hall tab with Brand / Combine controls

## v2.6.82 — 2026-05-15

- Achievements (Feats): 25 achievements across 6 categories (Combat, Explorer, Collector, Wealth, Prestige, Guild) with Bronze/Silver/Gold tiers
- Achievement rewards: gold, prestige points, and cosmetic titles displayed on the lead character card
- Hidden achievements show ??? until unlocked
- Toast notifications on achievement unlock
- Feats sidebar panel with category grouping, tier pip indicators, and locked/unlocked state
- Lifetime stat tracking: gold earned, items looted/sold, boss kills, legendary/divine finds

## v2.6.81 — 2026-05-15

- Prestige-locked themes: 4 new themes (Void Rift, Bloodmoon, Frost Crypt, Necropolis) and existing themes (Tavern, Inferno) now require prestiges to unlock
- Theme picker dynamically renders locked/unlocked buttons with prestige requirements shown on locked themes

## v2.6.80 — 2026-05-15

- Settings: Export Save downloads your save as a JSON file; Import Save restores from a backup

## v2.6.79 — 2026-05-15

- Dead party members now show greyed out with a skull prefix on their DPS
- DPS hover tooltip shows Base / Gear / Upgrade Level breakdown
- Guild Hall cards show a preview of the next purchase's concrete effect

## v2.6.78 — 2026-05-14

- Loot chest: name + slot badge on top row; bonuses left, buttons vertically centered right

## v2.6.77 — 2026-05-14

- Loot chest: item name top-left, slot badge top-right above buttons

## v2.6.76 — 2026-05-14

- Loot chest: item names no longer include quality (shown by color and tooltip instead); names wrap instead of truncating

## v2.6.75 — 2026-05-14

- Loot chest: item bonuses now display in a 2-column grid instead of a single row

## v2.6.74 — 2026-05-14

- Depth gauge: tick marks at every 5 floors on the left side; checkpoint tick highlighted with ⚑

## v2.6.73 — 2026-05-14

- Offline progress: idle gold now accumulates while away, up to 8 hours, shown on return

## v2.6.72 — 2026-05-14

- Mobile: depth gauge top now tracks live header height via ResizeObserver — no longer hidden behind header
- Mobile: prestige and venture buttons locked to a single stable row (no bouncing when HP changes)
- Mobile: Prestige Shop and Guild Hall hidden in shop tab until unlocked

## v2.6.71 — 2026-05-14

- Mobile: depth gauge track no longer hidden behind the header and enemy panel

## v2.6.70 — 2026-05-14

- Depth gauge now shows 💀 skull markers at floors where you died (stacked deaths show ×count)

## v2.6.69 — 2026-05-14

- Venture unlock floor increases by 10 per dungeon (dungeon 2 needs floor 50, dungeon 3 needs floor 60, …)

## v2.6.68 — 2026-05-14

- Venture now resets auto tools (Auto Seller, Auto Equip, Auto Upgrade, Smart Seller) — must re-buy each dungeon
- New dungeon 2+ Guild Hall skills: Consecrate (Paladin, heals party 25% max HP per kill for 5 kills) and Volley (Ranger, ×4 DPS for 4 kills)
- New dungeon 2+ prestige upgrades: Gold Mastery (+20% boss gold per stack) and Gear Luck (+5% drop chance per stack)

## v2.6.67 — 2026-05-14

- Difficulty tuning: enemy attack DPS raised (regular 3.0→4.0, boss 5.0→6.5 per floor)
- Dungeon index attack multiplier increased (25%→40% per dungeon)
- Combat heal per kill reduced (20%→12% of missing HP)

## v2.6.66 — 2026-05-13

- Skill cooldowns are now kill-based instead of time-based — cooldown shows as kills remaining
- Skill tooltip shows cooldown in kills instead of seconds

## v2.6.65 — 2026-05-13

- Smart Seller now clears non-upgrade items from a full loot chest, regardless of quality tier

## v2.6.64 — 2026-05-13

- Party panel: ⚔ toggle button hides/shows gear and abilities for a condensed HP+XP view; preference saved across sessions

## v2.6.63 — 2026-05-13

- Checkpoint: each level unlocks the next floor-5 checkpoint (lv1→floor 5, lv2→floor 10, lv3→floor 15…); buy more to push checkpoints deeper

## v2.6.62 — 2026-05-13

- Checkpoint is now a single 3-level prestige upgrade (lv1: every 15 floors · lv2: every 10 · lv3: every 5); existing saves migrate automatically

## v2.6.61 — 2026-05-13

- Auto Equip now runs before new loot drops — gear sits in the chest for at least one monster before being equipped

## v2.6.60 — 2026-05-13

- Auto Seller now runs before new loot drops — gear sits in the chest for at least one monster

## v2.6.59 — 2026-05-13

- Save conflict resolution: different run IDs prompt you to choose; same run uses the save with more kills

## v2.6.58 — 2026-05-13

- Enemy attack scales by sqrt(living party size) — companions are still strong but danger stays meaningful

## v2.6.57 — 2026-05-13

- Auto Seller shows next quality tier to unlock and the floor required

## v2.6.56 — 2026-05-13

- Prestige shop sorted by price (low to high); purchased items sink to bottom

## v2.6.55 — 2026-05-13

- Starting Gold prestige upgrade now grants gold immediately on purchase

## v2.6.54 — 2026-05-13

- Fix two flaky CI tests: companion auto-equip and gold scaling randomness

## v2.6.53 — 2026-05-13

- Guild Hall now unlocked via 5-point prestige upgrade instead of reaching floor 10

## v2.6.52 — 2026-05-13

- Hover over active skill buttons to see description and cooldown

## v2.6.51 — 2026-05-13

- Hard Reset now clears cloud save when signed in — reloading won't restore the old save

## v2.6.50 — 2026-05-13

- Enemy attack DPS further increased (regular ×3.0/level, boss ×5.0/level)
- HP upgrade bonus reduced from +25 to +15 HP to keep enemy attack pressure relevant

## v2.6.49 — 2026-05-13

- Enemy attack DPS doubled (regular) and more than doubled (boss) to create meaningful HP attrition
- Post-combat heal reduced from 30% to 20% of missing HP

## v2.6.48 — 2026-05-13

- Level-up now restores 50% of missing HP instead of fully healing

## v2.6.47 — 2026-05-13

- Boss kills no longer fully heal the party — same 30% lost-HP heal as regular enemies

## v2.6.46 — 2026-05-13

- Post-combat heal now restores 30% of lost HP (was 30% of max HP)

## v2.6.45 — 2026-05-13

- Guild tab hidden until floor 10; Prestige tab hidden until floor 20 (both unlock permanently via lifetime best level)

## v2.6.44 — 2026-05-13

- Combat healing reworked: regular kills restore 30% HP, boss kills fully heal, leveling up fully heals

## v2.6.43 — 2026-05-12

- Companion active skills now work (any party member with matching class can trigger their skill)
- Skill duration changed from seconds to number of monsters killed (Battle Cry: 5 kills, Arcane Surge: 5 kills, Shadow Strike: 3 kills)
- Checkpoint is now a prestige unlock: floor 15 only (1pt), every 10 floors (2pt), every 5 floors (3pt)

## v2.6.42 — 2026-05-12

- Fix companion skill buttons not firing (TypeScript scope error in click handler)

## v2.6.41 — 2026-05-12

- Companion active skills now appear below the Attack button when purchased from the Guild Hall

## v2.6.40 — 2026-05-12

- Fix: Guild Hall buttons no longer flash or block clicks (DOM was rebuilding every tick due to gold changing)

## v2.6.39 — 2026-05-12

- Balance: idle companion gold rate reduced from 0.5 to 0.01 per DPS per second

## v2.6.38 — 2026-05-12

- Guild Hall tab is now always visible, replacing the Log tab
- Guild Hall added to mobile navigation

## v2.6.37 — 2026-05-12

- Fix: Guild Hall tab now correctly persists after venturing (lifetime best depth was not saved on venture)

## v2.6.36 — 2026-05-12

- Each dungeon beyond the first scales enemies +25% HP and attack per dungeon
- Loot quality improves with dungeon depth (+5 effective levels per dungeon)
- Drop rate increases by 5% per dungeon (capped at 75%)

## v2.6.35 — 2026-05-12

- Fix: Guild Hall tab now stays visible after venturing to a new dungeon (uses lifetime best depth, not current-run depth)

## v2.6.34 — 2026-05-12

- Fix: Inferno theme — fiery attack button, ember depth gauge, warm dark backgrounds, crimson panel glow

## v2.6.33 — 2026-05-12

- New theme: 🔥 Inferno — charred black, ember orange, and cyan sword-glow inspired by the favicon

## v2.6.32 — 2026-05-12

- Mobile: boss portrait now appears inside the enemy panel on the left during boss fights

## v2.6.31 — 2026-05-12

- Fix: boss portrait and border images now fill the portrait frame correctly

## v2.6.30 — 2026-05-12

- Boss fights now show a unique monster portrait + adjective/title border frame
- Portrait animates in from the depth gauge on boss spawn and collapses on defeat
- Pixel-art portraits for all 15 enemy types; decorative borders for all adjectives and boss titles

## v2.6.29 — 2026-05-12

- Fix: Sell All button styled to match the game theme (gold outline)

## v2.6.28 — 2026-05-12

- Sell All button in the Loot panel — sells every item in one click

## v2.6.27 — 2026-05-12

- Fix: session-conflict banner now actually hides — CSS display:flex was overriding the hidden attribute

## v2.6.26 — 2026-05-12

- Mobile: depth gauge now shows as a fixed left strip, visible alongside all tabs

## v2.6.25 — 2026-05-12

- Depth gauge moved to the left of the main content area with a 'Depth' label above it

## v2.6.24 — 2026-05-12

- Hero stat card: portrait now fills the full width edge-to-edge at the top, above all text

## v2.6.23 — 2026-05-12

- Fix: hero portraits now show the correct character (switched from sprite sheet to individual files)
- Hero portrait now appears in the hero stat card popup

## v2.6.22 — 2026-05-12

- Hero card redesign: larger portrait on the right, name/class/DPS stacked on the left

## v2.6.21 — 2026-05-12

- Hero portraits updated to new artwork — all 5 classes in a unified style

## v2.6.20 — 2026-05-12

- Settings: added About section explaining the AI-assisted development origin of the game

## v2.6.19 — 2026-05-12

- Paladin and Ranger now have their own pixel-art portraits on hero cards

## v2.6.18 — 2026-05-12

- Hero cards now display a pixel-art portrait for each class (fighter, rogue, mage; paladin shares fighter, ranger shares rogue)

## v2.6.17 — 2026-05-12

- Favicon icon now appears next to the Toddpocalypse title in the header

## v2.6.16 — 2026-05-12

- Desktop: hero cards now display in a 2-column grid instead of a single expanding row

## v2.6.15 — 2026-05-12

- Added pixel-art favicon (flaming skull warrior) — shows in browser tabs, bookmarks, and on iOS home screen

## v2.6.14 — 2026-05-12

- Fix: session-conflict banner now dismisses immediately when Set Active Device succeeds — was lingering due to a racing periodic save re-showing it

## v2.6.13 — 2026-05-12

- Fix: Set Active Device works again — force-claim now uses a query parameter instead of X-Force-Session header, which was blocked by API Gateway CORS

## v2.6.12 — 2026-05-12

- Fix: Set Active Device now actually bypasses the session lock — previously sent the wrong session ID after reset, causing an immediate 409 conflict

## v2.6.11 — 2026-05-12

- Fix: Set Active Device no longer fails with a connection error — removes the undeployed X-Force-Session header that blocked the browser CORS preflight
- Set Active Device now shows distinct messages: success, 'other device still active (try in 90s)', or actual connection failure

## v2.6.10 — 2026-05-12

- Mobile: tap any ability badge in a hero's card to open a bottom sheet showing the skill name, unlock status, and description

## v2.6.9 — 2026-05-12

- Set Active Device button: override a session conflict and claim this device as the primary saver — appears in Settings and in the conflict banner
- Load Cloud Save button: pull the latest DynamoDB save to this device without waiting for the next auto-sync

## v2.6.8 — 2026-05-11

- Hover a hero's name or 'Your Party' to see a stat card — DPS, HP, click damage, defense, crit, gold, lifesteal, haste, XP bonus, and unlocked abilities
- Tapping a hero's name on mobile opens the same card as a bottom sheet

## v2.6.7 — 2026-05-11

- Prestige: Smart Seller (4pt) — automatically checks new quality tiers in the Auto Seller as they unlock while climbing floors. Requires Auto Seller.

## v2.6.6 — 2026-05-11

- Prestige shop: Starting Gold and XP Bonus now cost 1 more prestige point per stack already owned (1pt, 2pt, 3pt, …)

## v2.6.5 — 2026-05-11

- Dream drops — the two quality tiers above the current floor maximum can now drop at ~1% and ~0.5% chance respectively

## v2.6.4 — 2026-05-11

- Item card tooltip — hover any loot drop or equipped item to see a detailed stat breakdown
- Sub-common items (broken/worn/crude/poor) now always roll exactly 1 stat; secondary bonuses start at Common quality

## v2.6.3 — 2026-05-11

- Multi-stat gear system — items now roll 1–3 stats (DPS, HP, Click, Defense, Crit, Gold, Lifesteal, Haste, XP) based on quality tier and slot type
- 4 new character stats: Crit Chance (per-tick double damage), Gold Find (% more gold from bosses), Lifesteal (heal on damage dealt), Haste (DPS rate multiplier)
- Loot display now shows all stat bonuses instead of a single damage number
- Gear comparison (▲/▼) uses normalized power score across all stat types
- Backward-compatible: old saves with single-damage items migrate automatically

## v2.6.2 — 2026-05-11

- Mobile: party HP and DPS now shown in the header stats bar
- Mobile: Lifetime Stats and Changelog accessible from Settings tab
- Mobile: enemy panel compacted — smaller name, HP text overlaid on bar, floor progress in 1-2 rows
- Mobile: unified scroll for shop tab (upgrades + prestige scroll as one page)

## v2.6.1 — 2026-05-11

- Single-session enforcement — only one device can cloud-save at a time
- A warning banner appears if your game is already open elsewhere; it clears automatically when the other session expires (90 seconds of inactivity)

## v2.6.0 — 2026-05-11

- Cloud save — sign in with Google to sync your save across devices
- Save writes to AWS DynamoDB on every autosave tick when signed in
- Cloud save loads automatically on page load; falls back to localStorage if offline or signed out
- Sign in / Sign out available in Settings tab

## v2.5.2 — 2026-05-11

- Save auto-loads on page refresh — no more 'Continue' button required; upgrades and loot now persist across reloads
- Settings panel no longer bleeds into other sidebar tabs on desktop

## v2.5.1 — 2026-05-11

- Three fantasy themes selectable in Settings: Grimdark, Arcane, Tavern
- Grimdark: smoldering charcoal + blood-red + UnifrakturMaguntia font
- Arcane: deep indigo + hammered gold + Cinzel Decorative font
- Tavern: dark walnut + lantern amber + Philosopher font
- All themes add: ornate inner panel borders, decorative flanking lines on section headers, subtle noise texture, gold title glow
- Theme persists across page reloads

## v2.5.0 — 2026-05-11

- Settings tab added to desktop sidebar and mobile nav
- Hard Reset option in Settings — two-step confirmation before wiping save data
- Mobile: enemy panel fixed to bottom of screen so the attack button is always in thumb reach
- Mobile: loot section appears above party section on the combat tab
- Mobile: Prestige Shop hidden until floor 20; Guild Hall hidden until floor 40
- Guild Hall tab unlock condition corrected to floor 40 (venture floor)

## v2.4.9 — 2026-05-08

- Guild Hall tab is hidden on a new game — unlocks after your first prestige

## v2.4.8 — 2026-05-08

- Mythic+ glow intensity now escalates by tier — Mythic is subtle, Ancient/Celestial/Void each add more layers and wider spread
- Divine pulses between bright and blinding on a 2s cycle

## v2.4.7 — 2026-05-08

- Gear slots flash gold for 2 seconds when an item is replaced — blinks 3 times so the swap is easy to spot
- Mythic, Ancient, Celestial, Void, and Divine quality names now glow with a tier-colored text-shadow

## v2.4.6 — 2026-05-08

- Guild Hall split into its own sidebar tab — sidebar now has Upgrades / Loot / Prestige / Guild / Log
- Shop tab renamed to Prestige
- Prestige and Guild tabs each have their own notification badge

## v2.4.5 — 2026-05-08

- Auto Seller tier checkboxes moved from the Shop tab to the Loot tab — appears below the loot chest once Auto Seller is purchased

## v2.4.4 — 2026-05-08

- Desktop sidebar replaced with a 4-tab card: Upgrades / Loot / Shop / Log
- Shop tab covers Prestige Shop + Guild Hall; badge appears when either has an affordable item
- Mobile layout unchanged — existing bottom tab bar still handles navigation

## v2.4.3 — 2026-05-08

- Drop rates: weaker tiers never fully disappear — broken has ~15% chance at floor 1, decaying to <0.1% by floor 40
- Drop rates now use the highest accessible tier as the focal point; every tier below it decays via the same weight curve
- Auto Seller tier thresholds rescaled to match the 15-tier system (divisor 4) — reaches void by floor 45
- Drop rate chart shows all 15 quality tiers; unattainable tiers shown greyed-out as 'locked'
- Chart entries ordered divine → broken (best to worst) for easier reading

## v2.4.2 — 2026-05-08

- Lifetime Stats now tracks kills by enemy adjective (Frightening, Vile, Ancient, Dread, etc.) — sorted by kill count
- Enemy kill breakdown is scrollable and hidden until you have at least one kill
- Boss kills are tracked by their title adjective (Abyssal, Dread, Infernal, etc.) alongside regular enemies

## v2.4.1 — 2026-05-08

- Five new gear quality tiers above legendary: Mythic (110 dmg) → Ancient (160) → Celestial (230) → Void (335) → Divine (480)
- Gear tier curve compressed — all 15 tiers fit within floors 1–44 (divisor 4 instead of 5)
- Legendary now unlocks at floor 24 instead of floor 30
- Divine (the new peak) unlocks at floor 44
- 📊 drop rate chart button in the loot section — shows current-floor probability for every available quality tier

## v2.4.0 — 2026-05-08

- Guild Hall — a permanent gold-funded meta layer that never resets (survives prestige and venture)
- Companion Hall upgrade (×2 stackable) — unlocks Party Slot IV and V in the Prestige Shop
- Expanded Armory upgrade (×3 stackable) — increases loot chest capacity from 8 up to 14
- Recruit: Paladin and Recruit: Ranger guild upgrades — unlock new classes for companion recruitment
- Paladin: 25% damage reduction at Lv5, heals party 5 HP on kill at Lv10, +15% party DPS when an ally falls at Lv20
- Ranger: 30% click crit (×2) at Lv5, ×1.6 passive DPS at Lv10, enemy takes +20% damage at Lv20
- Active combat skills purchasable from Guild Hall — class-specific buttons appear in the combat panel
- Battle Cry (Fighter): ×2 party DPS for 15s, 2-min cooldown
- Shadow Strike (Rogue): ×5 click damage for 8s, 45s cooldown
- Arcane Surge (Mage): ×3 DPS for 15s, 90s cooldown
- Skill button shows cooldown drain bar; glows while effect is active

## v2.3.2 — 2026-05-08

- Venture is repeatable — push any dungeon to floor 40 and venture to the next one
- Idle gold accumulates across all previous dungeons — every companion you leave behind keeps earning
- Dungeon counter increments each venture; no cap

## v2.3.1 — 2026-05-08

- Dungeon 2 plays identically to Dungeon 1 — recruit new companions via the Prestige Shop
- Venturing resets Party Slot II and III so fresh companions can be recruited in the new dungeon
- Original companions remain idle in Dungeon 1, still earning gold for you

## v2.3.0 — 2026-05-08

- Venture system — at floor 40, venture to a new dungeon with just your class (fresh character, no gear, no gold)
- Companions stay behind in Dungeon 1 and idle-earn gold based on their DPS, flowing to you automatically
- Prestige still works within each dungeon; venturing resets your prestige point balance to 0
- Prestige in Dungeon 2 resets only the lead — companions remain idle in Dungeon 1
- Removed Guild Hall / Renown system

## v2.2.2 — 2026-05-08

- Displaced gear is passed to a companion before being sold — if a replaced item is an upgrade for another party member, they equip it instead

## v2.2.1 — 2026-05-08

- Guild Hall facilities now auto-unlock at renown milestones — no spending required
- Renown accumulates permanently and never resets
- Armory unlocks at 2 / 10 / 25 renown; Vault at 4 / 15 / 35; Training Yard at 6 / 20 / 50; Chronicle Room at 10 / 28 / 70
- Guild Hall panel shows unlock badge with next threshold for locked facilities

## v2.2.0 — 2026-05-08

- Guild Hall — a permanent meta-progression layer that never resets
- Earn renown each time you prestige (floor / 10, minimum 2 at floor 20)
- Armory (2 renown): start each run with +1 loot item already in the pool
- Vault (3 renown): carry 10% of your gold per stack into the next run
- Training Yard (3 renown): party members begin each run 1 level higher per stack
- Chronicle Room (4 renown): earn +1 bonus renown per stack on every future prestige

## v2.1.1 — 2026-05-08

- Equip priority: lead character always gets first claim on any upgrade — companions only receive items the lead can't use

## v2.1.0 — 2026-05-08

- Enemy attacks a random living party member each tick — companions share the damage load
- Party respawns only after every member's HP reaches 0 — companions act as extra lives
- Dead party members deal no DPS until the party respawns

## v2.0.0 — 2026-05-08

- Auto Equip prestige upgrade (2pts) — automatically equips loot upgrades after each kill
- Auto Upgrade prestige upgrade (2pts) — automatically buys the cheapest affordable stat upgrade after each kill

## v1.9.6 — 2026-05-08

- Checkpoint floor shown as a ⚑ marker on the depth gauge

## v1.9.5 — 2026-05-08

- Depth gauge grows taller as you descend — 10px per level, minimum 160px, smooth animated transition

## v1.9.4 — 2026-05-08

- Floor progress bar grows with depth — floor 1 needs 5 kills, floor 5 needs 7, floor 10 needs 9, +2 every 5 floors

## v1.9.3 — 2026-05-08

- Prestige resets Auto Seller quality checkboxes so the new run starts clean

## v1.9.2 — 2026-05-08

- Checkpoint floor shown on the floor bar — gold ⚑ label appears once a checkpoint is set

## v1.9.1 — 2026-05-08

- Rings now replace the weaker equipped ring when both slots are full
- Equip All and Auto Seller correctly identify ring upgrades against the weaker slot

## v1.9.0 — 2026-05-08

- Auto Seller now sweeps after every kill instead of every 10 seconds
- Player controls which quality tiers are auto-sold via checkboxes
- Available tiers unlock progressively — broken at any level, worn at 5, crude at 10, etc.
- Upgrade items (fills empty slot or beats equipped damage) are always protected
- Legendary items are never offered for auto-sell

## v1.8.0 — 2026-05-08

- Checkpoints every 10 floors — die at floor 18, respawn at floor 10 instead of floor 1
- Checkpoint message shown in combat log when a new floor-10 boundary is crossed
- Prestige resets checkpoint to floor 1 alongside the full run reset

## v1.7.0 — 2026-05-08

- Gear damage now scales with dungeon depth — +25% per 5 floors (×1.75 at floor 15)
- Enemy HP formula softened from 1.4× to 1.3× exponential growth
- Boss HP rebalanced: higher base (100×) but softer curve — long tense fights instead of walls
- Regular enemy attack DPS reduced (1.0× level); boss attack reduced (1.5× level)
- Bosses require active clicking to beat — auto-DPS alone is insufficient at floor 18+
- Rings no longer labeled Ring 1 / Ring 2 — any ring fills whichever slot is available

## v1.6.1 — 2026-05-07

- Mobile: combat tab now shows enemy, party, and loot together
- Mobile: Shop tab shows a notification dot when an upgrade or prestige item is affordable
- Mobile: panels fill the full screen width on large phones

## v1.6.0 — 2026-05-07

- Class abilities unlock at levels 5, 10, and 20
- Fighter: Iron Skin (dmg reduction), Bloodlust (+60% DPS at low HP), Battle Standard (party +10% DPS)
- Rogue: Lucky Strike (25% crit), Blade Mastery (+50% DPS), Expose Weakness (enemy +25% dmg taken)
- Mage: Arcane Study (party XP +25%), Mana Surge (auto-burst every 20s), Empower (click dmg ×2)
- Ability badges shown in party cards — locked abilities show their unlock level

## v1.5.1 — 2026-05-07

- Hovering a loot item highlights the matching slot in the hero's equipment panel

## v1.5.0 — 2026-05-07

- Auto-DPS is disabled until a character has gear equipped — click to deal damage early
- Auto Seller now protects items that are upgrades for any party member

## v1.4.0 — 2026-05-07

- Mobile layout with tab bar navigation (Combat / Party / Shop / Log)
- Larger touch targets for all action buttons

## v1.3.0 — 2026-05-07

- Prestige system — reset your run at dungeon level 20+ to earn prestige points
- Points scale with depth: level 20 = 1pt, +1pt per 5 levels past 20
- Prestige shop: Auto Seller, Party Slots II & III, Starting Gold, XP Bonus
- Auto Seller automatically sells the lowest-quality item every 10 seconds
- Party Slots let you add a 2nd and 3rd member — choose their class on purchase
- Lifetime Stats modal tracks total kills, deaths, best level, and prestige count

## v1.2.0 — 2026-05-07

- Max HP upgrade available in the upgrades panel — +25 HP per level

## v1.1.1 — 2026-05-07

- Depth gauge now shows a filled bar that grows downward as you descend

## v1.1.0 — 2026-05-07

- Boss fights: each floor ends with a named boss (4× HP, 2× attack, guaranteed loot drop)
- Floor progress text updated to count down to the boss instead of the next floor
- Pulsing gold '★ BOSS FIGHT ★' indicator during the encounter

## v1.0.0 — 2026-05-07

- Rebuilt entire game in TypeScript — no more Python runtime in the browser
- GitHub Actions deploys to GitHub Pages on every push
- Quality tier colors for all gear: broken (grey) → legendary (gold)
- Save / load via localStorage — Continue button on startup
- Deaths counter and highest dungeon level tracked across runs
- Floor progress pips showing monsters remaining until next level
- Vertical depth gauge showing current depth vs personal best

/** Current game version string, displayed in the footer version button. */
export const VERSION = "v2.30.9";

/** A single version's release notes. */
export interface ChangelogEntry {
  /** Semantic version tag (e.g. "v2.6.0"). */
  version: string;
  /** ISO 8601 release date (YYYY-MM-DD). */
  date: string;
  /** Bullet-point list of changes in this release. */
  changes: string[];
}

/** Full changelog ordered newest-first, rendered in the changelog modal. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v2.30.9",
    date: "2026-05-19",
    changes: [
      "Mobile char-card redesigned: hero sprite, name/class/DPS, and HP+XP bars now appear in a single compact row with equipment below",
    ],
  },
  {
    version: "v2.30.8",
    date: "2026-05-19",
    changes: [
      "Boss portrait borders now glow with their accent color only when enraged — each border has a unique color matched to its artwork (cyan Titan, purple Abyssal, red Dread, gold Eternal, white Forsaken, orange Infernal, grey Shadow, green Undying, bronze Ravager, silver Ancient)",
    ],
  },
  {
    version: "v2.30.7",
    date: "2026-05-19",
    changes: [
      "Mobile: enemy panel is now significantly more compact (tighter gaps, smaller text, single-row floor progress)",
      "Mobile: party panel now appears above the loot section so it's immediately visible on the combat tab",
    ],
  },
  {
    version: "v2.30.6",
    date: "2026-05-18",
    changes: [
      "Titan boss border now glows gold with a pulsing amber light instead of rendering as a flat image",
    ],
  },
  {
    version: "v2.30.5",
    date: "2026-05-18",
    changes: [
      "Enemy attack damage now scales as level^1.3 instead of linear — high-floor enemies hit significantly harder",
      "Lifesteal heals at only 25% effectiveness against bosses and elites",
    ],
  },
  {
    version: "v2.30.4",
    date: "2026-05-18",
    changes: [
      "DPS upgrade effect further reduced from 2% to 1% per level",
    ],
  },
  {
    version: "v2.30.3",
    date: "2026-05-18",
    changes: [
      "Companion names are now class-themed non-binary names (e.g. Vesper the rogue, Rowan the druid)",
    ],
  },
  {
    version: "v2.30.2",
    date: "2026-05-18",
    changes: [
      "DPS upgrade effect reduced from 5% to 2% per level to rebalance late-game boss difficulty",
    ],
  },
  {
    version: "v2.30.1",
    date: "2026-05-18",
    changes: [
      "Character card and name tooltip now show effective DPS (including upgrade multiplier)",
      "Party tooltip total DPS also reflects upgrade multipliers",
    ],
  },
  {
    version: "v2.30.0",
    date: "2026-05-18",
    changes: [
      "Boss/elite enrage now triggers at 15 seconds (down from 20)",
    ],
  },
  {
    version: "v2.29.9",
    date: "2026-05-18",
    changes: [
      "Gear adjective now reflects the primary stat — DPS drops say 'of destruction', HP drops say 'of fortitude', etc.",
    ],
  },
  {
    version: "v2.29.8",
    date: "2026-05-18",
    changes: [
      "Enrage bar now stacks layers per level — each layer gets progressively darker red",
      "Monster portrait border escalates in intensity with each enrage stack",
      "Enrage pulse animation speeds up with each stack",
    ],
  },
  {
    version: "v2.29.7",
    date: "2026-05-18",
    changes: [
      "Click upgrade is now +5%/level multiplier on click damage (scales with DPS and gear)",
      "HP upgrade is now +5%/level of current max HP instead of flat +15",
    ],
  },
  {
    version: "v2.29.6",
    date: "2026-05-18",
    changes: [
      "DPS upgrade is now a +5% multiplier per level instead of flat +0.5 — scales with gear",
    ],
  },
  {
    version: "v2.29.5",
    date: "2026-05-18",
    changes: [
      "Upgrade rows now show total bonus next to level (e.g. '+1.5 DPS')",
      "DPS breakdown tooltip shows upgrade DPS contribution as a number instead of a level",
    ],
  },
  {
    version: "v2.29.4",
    date: "2026-05-18",
    changes: [
      "Starting Gold renown now scales exponentially — each level covers all upgrade costs up to that level",
    ],
  },
  {
    version: "v2.29.3",
    date: "2026-05-18",
    changes: [
      "Account dropdown: added Best Dungeon count alongside Best Floor",
    ],
  },
  {
    version: "v2.29.2",
    date: "2026-05-18",
    changes: [
      "Header stays visible while scrolling (position: sticky)",
    ],
  },
  {
    version: "v2.29.1",
    date: "2026-05-18",
    changes: [
      "Fix: Account column in avatar dropdown now shows Best Floor (lifetime high) instead of current dungeon number",
    ],
  },
  {
    version: "v2.29.0",
    date: "2026-05-18",
    changes: [
      "Stats moved from Settings into the avatar dropdown — two live columns: Hero (name, class, level, floor, gold, kills, deaths) and Account (dungeon, best floor, returns, total kills, total deaths)",
      "Kill details modal accessible via 'Kill details →' link at the bottom of the dropdown and the footer button",
      "Removed Lifetime Stats row from Settings",
    ],
  },
  {
    version: "v2.28.9",
    date: "2026-05-18",
    changes: [
      "Fix: selecting an avatar, border, or title in the Customize modal now immediately highlights the active choice",
    ],
  },
  {
    version: "v2.28.8",
    date: "2026-05-18",
    changes: [
      "Death toast: a crimson narrative toast appears when your party is defeated — 6 floor-1 'mysterious wakeup' lines and 4 checkpoint 'dragged to safety' lines, drawn at random",
    ],
  },
  {
    version: "v2.28.7",
    date: "2026-05-18",
    changes: [
      "Return to Town now shows a homecoming toast — a rotating villager flavor line, renown earned, and a note that the dungeon shifts anew",
      "Confirm dialog now explains why upgrades reset: the dungeon's passages rearrange while you rest",
    ],
  },
  {
    version: "v2.28.6",
    date: "2026-05-18",
    changes: [
      "Renamed prestige to 'Return to Town' — Prestige Shop is now 'Hall of Renown', prestige points are 'renown', and the tab reads 'Renown'",
    ],
  },
  {
    version: "v2.28.5",
    date: "2026-05-18",
    changes: [
      "Set piece tooltips: hovering a set item now shows the set name, 2pc/3pc bonuses, and how many pieces are currently equipped — active bonuses are highlighted, inactive ones dimmed",
    ],
  },
  {
    version: "v2.28.4",
    date: "2026-05-18",
    changes: [
      "Boss/elite enrage multiplier no longer caps at 5× — it scales unbounded until the player is defeated",
    ],
  },
  {
    version: "v2.28.3",
    date: "2026-05-18",
    changes: [
      "Fix: prestige shop badge no longer appears after retirement (stash costs 0pt but requires Dungeon 3; badge now checks dungeon requirement)",
    ],
  },
  {
    version: "v2.28.2",
    date: "2026-05-18",
    changes: [
      "Fix: Paladin/Ranger/Druid locked by default in character creation (were missing disabled attribute)",
      "Class picker now uses a 3-column grid so all 6 classes fit cleanly",
    ],
  },
  {
    version: "v2.28.1",
    date: "2026-05-18",
    changes: [
      "Fix: legacy titles (Veteran, Twice-Born, The Eternal) now appear in Customize title picker and can be set via setEarnedTitle",
      "Fix: locked class buttons in character creation no longer selectable on click",
    ],
  },
  {
    version: "v2.28.0",
    date: "2026-05-18",
    changes: [
      "Hero Retirement: retire your hero after reaching Dungeon 2 for a hard reset with legacy rewards",
      "Hall of Fame: retired heroes are scored and preserved forever in the Hall of Fame",
      "Legacy unlocks: retirement milestones unlock Paladin, Ranger, and Druid classes plus titles, avatars, and borders",
      "Locked class picker: Paladin/Ranger/Druid shown as locked in character creation until earned via retirement",
      "Retire button in avatar dropdown (enabled only when dungeonIndex ≥ 1)",
      "Retirement confirmation modal with legacy reward preview",
    ],
  },
  {
    version: "v2.27.7",
    date: "2026-05-18",
    changes: [
      "Party cards: hero portrait now matches char-header-left height; shrinks to name/class/DPS when gear is visible",
    ],
  },
  {
    version: "v2.27.6",
    date: "2026-05-18",
    changes: [
      "Fix: Striking rune icon now renders correctly as ⚔️ emoji instead of a text glyph",
    ],
  },
  {
    version: "v2.27.5",
    date: "2026-05-17",
    changes: [
      "New artifact: Phantom Compass 🧭 — +10% XP gain per level",
      "New artifact: Fortune's Eye 💎 — +5% gear drop chance per level (additive, stacks across party)",
    ],
  },
  {
    version: "v2.27.4",
    date: "2026-05-17",
    changes: [
      "Prestige: Party Members card now sorts with the rest of the shop items by cost",
    ],
  },
  {
    version: "v2.27.3",
    date: "2026-05-17",
    changes: [
      "Tablet/mobile: party HP bar fixed above the enemy panel, turns red below 30% HP",
    ],
  },
  {
    version: "v2.27.2",
    date: "2026-05-17",
    changes: [
      "Tablet: avatar moves to top-right of header row alongside the title, sized to match",
    ],
  },
  {
    version: "v2.27.1",
    date: "2026-05-17",
    changes: [
      "Mobile layout now applies on tablets up to 1280px wide (was 768px); Galaxy Tab S6 Lite now uses mobile UI",
    ],
  },
  {
    version: "v2.27.0",
    date: "2026-05-17",
    changes: [
      "Avatar button opens a 3-item dropdown menu: Customize, Settings, About",
      "Customize modal: avatar, border, and title pickers (moved from inline dropdown)",
      "About modal: game description and credits",
      "Visual theme picker moved into the Customize modal",
    ],
  },
  {
    version: "v2.26.3",
    date: "2026-05-17",
    changes: [
      "Eternal Cycle (auto-prestige) moved from Prestige Shop to Guild Hall — unlock for 8,000g, then toggle and set threshold there",
    ],
  },
  {
    version: "v2.26.2",
    date: "2026-05-17",
    changes: [
      "Fixed auto-attack not firing — interval was being cleared every render tick (100ms) before it could fire (1000ms)",
    ],
  },
  {
    version: "v2.26.1",
    date: "2026-05-17",
    changes: [
      "Fixed: boss/elite damage now uses total party size, not living count — last survivors are no longer safer than a full party",
    ],
  },
  {
    version: "v2.26.0",
    date: "2026-05-17",
    changes: [
      "Auto-Attack: unlock in the Guild Hall (3,000g) then toggle the AUTO button next to Attack",
      "Auto-Attack fires a full-damage click every second while enabled; persists across reloads",
    ],
  },
  {
    version: "v2.25.1",
    date: "2026-05-17",
    changes: [
      "Enemy panel no longer resizes when enrage bar appears — space is always reserved",
    ],
  },
  {
    version: "v2.25.0",
    date: "2026-05-17",
    changes: [
      "Boss and elite enemies enrage after 20 seconds — attack multiplies by 1.5× every 10s, capped at 5×",
      "Enrage progress bar appears below enemy HP during boss/elite fights",
      "Portrait glows red and pulses when an enemy is enraged",
    ],
  },
  {
    version: "v2.24.8",
    date: "2026-05-17",
    changes: [
      "Elite portrait border now shows as a full 5px purple frame instead of corner-only slivers",
    ],
  },
  {
    version: "v2.24.7",
    date: "2026-05-17",
    changes: [
      "Boss/elite portrait now disappears correctly when a normal enemy appears",
      "Portrait reserves a fixed space in the enemy panel — no more layout shifts",
    ],
  },
  {
    version: "v2.24.6",
    date: "2026-05-17",
    changes: [
      "Monster portrait no longer stretches when the enemy panel is tall",
    ],
  },
  {
    version: "v2.24.5",
    date: "2026-05-17",
    changes: [
      "Monster portrait no longer shifts the enemy panel size when a boss or elite appears",
    ],
  },
  {
    version: "v2.24.4",
    date: "2026-05-17",
    changes: [
      "Loot sub-tabs (Equipment / Runes / Artifacts) now sync the party panel view automatically",
    ],
  },
  {
    version: "v2.24.3",
    date: "2026-05-17",
    changes: [
      "Loot sidebar now stays on screen while scrolling through character cards",
    ],
  },
  {
    version: "v2.24.2",
    date: "2026-05-17",
    changes: [
      "Fixed Entangle skill button showing raw ID instead of name/icon",
    ],
  },
  {
    version: "v2.24.1",
    date: "2026-05-17",
    changes: [
      "Corruption rate reduced from 0.3% to 0.15% of max HP per second per depth",
      "Corruption multiplier capped at 20 so deep floors don't spiral out of control",
    ],
  },
  {
    version: "v2.24.0",
    date: "2026-05-17",
    changes: [
      "6th party slot (Slot VI) — recruit a Chosen companion (requires Companion Hall III)",
      "New class: Druid — Regrowth (party lifesteal Lv5), Thornwall (+40% DPS Lv10), Wild Growth (heal 2% maxHP per kill Lv20)",
      "New Druid skill: Entangle — reduces enemy attack by 60% for 8 kills (20-kill cooldown, Dungeon 3+)",
      "Companion Hall expanded to 3 levels (unlocks Slot IV, V, and VI)",
      "Party Slots consolidated into a single 'Party Members' card in the Prestige Shop",
      "Eternal Cycle — auto-prestige toggle with configurable point threshold",
      "Prestige boosts (XP, DPS, gold, etc.) now reset when venturing to a new dungeon",
    ],
  },
  {
    version: "v2.23.4",
    date: "2026-05-17",
    changes: [
      "Fixed elite monster portrait being off-center during the entrance animation",
    ],
  },
  {
    version: "v2.23.3",
    date: "2026-05-17",
    changes: [
      "Corruption now only applies in dungeon 2+ and starts at floor 20 (was floor 25 in all dungeons)",
      "Corruption scales with dungeon number — dungeon 3 is 2x as strong, dungeon 4 is 3x, etc.",
    ],
  },
  {
    version: "v2.23.2",
    date: "2026-05-17",
    changes: [
      "Consecrate is now an instant heal — activating it immediately restores 50% max HP to all living party members (was a 25%-per-kill buff over 5 kills)",
    ],
  },
  {
    version: "v2.23.1",
    date: "2026-05-17",
    changes: [
      "New dungeons unlock every 5 floors past floor 40 (was every 10)",
    ],
  },
  {
    version: "v2.23.0",
    date: "2026-05-17",
    changes: [
      "Dungeon corruption: below floor 25, all party members take passive damage scaling with depth (% of maxHealth/s)",
      "Corruption reduces lifesteal effectiveness by 6% per floor of depth, capped at 90% — deep floors punish healing-heavy builds",
      "A pulsing ☠ Corruption indicator in the stat bar shows total damage/s and lifesteal reduction when active",
    ],
  },
  {
    version: "v2.22.5",
    date: "2026-05-17",
    changes: [
      "Fixed profile picker tabs (Avatar/Border/Title) closing the dropdown when clicked",
    ],
  },
  {
    version: "v2.22.4",
    date: "2026-05-17",
    changes: [
      "Artifact badges on char cards now show a rich hover tooltip with name, level, and current stat effect",
      "Party cards no longer rebuild the full DOM on every kill — only HP/XP and empty gear slot dropdowns update in-place",
    ],
  },
  {
    version: "v2.22.3",
    date: "2026-05-17",
    changes: [
      "Removed skill cooldown progress bar — cooldown status is now shown in the hover tooltip",
    ],
  },
  {
    version: "v2.22.2",
    date: "2026-05-17",
    changes: [
      "Skill button tooltips now show live cooldown status: '✓ Ready', '⚡ Active — N kills remaining', or '⏳ Cooldown — N / X kills'",
    ],
  },
  {
    version: "v2.22.1",
    date: "2026-05-17",
    changes: [
      "Clicking Maniac feat now counts only Attack button presses — spacebar/Enter deal click damage but don't count toward the achievement",
    ],
  },
  {
    version: "v2.22.0",
    date: "2026-05-17",
    changes: [
      "Numbers now use commas below 10,000 (e.g. 9,999) and shorthand above (10k, 1.5m, 2b) — applied to gold, sell values, upgrade costs, prestige points, feat thresholds, and reward text",
    ],
  },
  {
    version: "v2.21.1",
    date: "2026-05-17",
    changes: [
      "Fixed Feats panel flickering and hard-to-click filter buttons — filter tabs now live in a stable element separate from the feat list",
    ],
  },
  {
    version: "v2.21.0",
    date: "2026-05-17",
    changes: [
      "Title picker moved from the Feats panel into the profile dropdown (Avatar → Border → Title tabs)",
      "Default title is now 'nobody' — shown on the character card from the start",
      "Header avatar button label now always reflects the currently selected title",
    ],
  },
  {
    version: "v2.20.0",
    date: "2026-05-17",
    changes: [
      "Artifact badges on the character card now show a tooltip with the current computed stat (e.g. '+10% party DPS')",
      "Cosmetic rewards (avatars/borders) are now backfilled on load for saves predating the cosmetic system",
      "Removed loot filter (dim non-upgrades) button",
    ],
  },
  {
    version: "v2.19.0",
    date: "2026-05-17",
    changes: [
      "Feat progress bars now show real progress toward the next tier milestone",
      "Feat reward descriptions now show avatar icon+name or border name (all feat rewards are cosmetics)",
      "Mystery feats now trigger a special 'Mystery Feat Revealed!' notification when completed",
      "Filter tabs on the Feats panel: All / In Progress / Completed",
      "Feats sort within categories: active progress first, completed last",
      "Category headers show completion count (e.g. ⚔ Combat 3/7)",
      "Fixed missing Runes category label in Feats panel",
      "Credits: added peeplover23 as tester",
    ],
  },
  {
    version: "v2.18.0",
    date: "2026-05-17",
    changes: [
      "Feat rewards are now cosmetic: avatars and borders replace prestige point grants (prestige points come from prestiging, not from feats)",
      "Player profile widget in the Prestige panel shows your active avatar, border, and title — click Customize to pick from earned unlocks",
      "10 avatars and 8 borders unlockable through achievements",
      "New feat: Clicking Maniac — earn border and avatar rewards for lifetime click milestones (100 / 1,000 / 10,000 clicks)",
      "Die-hard feat now tracks lifetime deaths across all prestige runs, not just the current run",
    ],
  },
  {
    version: "v2.17.0",
    date: "2026-05-17",
    changes: [
      "New artifact: Warlord's Sigil 🔱 — +5% party DPS per level (flat, always-on)",
      "New prestige upgrade: DPS Bonus — +5% party DPS per stack",
      "New prestige upgrade: Combine All Runes — auto-combines all matching rune pairs in sequence (Dungeon 3+)",
      "Artifact fuel progress bar animates a preview when you select fuel — rushes through level-ups, eases to the final position",
    ],
  },
  {
    version: "v2.16.0",
    date: "2026-05-16",
    changes: [
      "Artifact leveling now uses a fuel-unit system: higher-level artifacts are worth more (lv0=1, lv1=2, lv2=4, lv3=7)",
      "Fuel accumulates on the artifact — partial fills are stored and persist across multiple sacrifices",
      "Overflow cascades: excess fuel automatically triggers additional level-ups in one action",
      "Equipped artifacts can now be leveled up directly from their slot without unequipping",
      "Sell button added to equipped artifact modal",
    ],
  },
  {
    version: "v2.15.3",
    date: "2026-05-16",
    changes: [
      "Clicking an equipped artifact slot opens the detail modal showing artifact stats and an Unequip button",
      "Modal notes how many other copies of that artifact are in inventory when viewing an equipped one",
    ],
  },
  {
    version: "v2.15.2",
    date: "2026-05-16",
    changes: [
      "Artifact level-up modal now shows a checklist of all copies available as fuel — you choose exactly which ones to sacrifice",
      "Higher-level artifacts can be used as a single fuel slot (e.g., a +3 bloodstone counts as one of the required copies)",
      "Level Up button only activates when exactly the right number of fuel copies are checked",
    ],
  },
  {
    version: "v2.15.1",
    date: "2026-05-16",
    changes: [
      "Click any artifact in the Artifacts panel to open a detail modal for leveling up, equipping, or selling",
      "Modal shows fuel count, cost, and a full-width Level Up button; stays open so you can keep leveling",
      "Artifact rows now show a purple left-border accent when a level-up is ready",
    ],
  },
  {
    version: "v2.15.0",
    date: "2026-05-16",
    changes: [
      "Artifacts now have endless levels instead of a single merge: equip N+1 copies of the same artifact to level it up to +N",
      "Level-up cost scales: going from +N to +N+1 costs N+1 fuel artifacts of the same type",
      "Leveled artifacts show a '+N' badge in the Artifacts panel and on hero card icon strips",
      "All artifact effects scale with level: a +2 artifact is 3× as effective as a base copy",
      "Old upgraded artifacts (Sanguine Bloodstone, Titan's Eye, etc.) automatically migrate to their base counterpart at level +1",
      "Removed the six separate 'upgraded' artifact definitions; all six base artifacts now level indefinitely",
    ],
  },
  {
    version: "v2.14.7",
    date: "2026-05-16",
    changes: [
      "Amber notification dot on Runes tab when a combine or artifact forge is ready",
      "Amber notification dot on Artifacts tab when a combine (2× same artifact → upgraded) is available",
    ],
  },
  {
    version: "v2.14.6",
    date: "2026-05-16",
    changes: [
      "Forge Artifact banner now appears as soon as you have any ancient rune, showing progress (e.g. 3 / 10); button is disabled until 10 are accumulated",
    ],
  },
  {
    version: "v2.14.5",
    date: "2026-05-16",
    changes: [
      "Rune sink: trade 10 ancient runes (any mix of types) for a random base artifact — Forge button appears in the Runes panel when you have enough",
    ],
  },
  {
    version: "v2.14.4",
    date: "2026-05-16",
    changes: [
      "Hero cards now show equipped artifact icons at the top (below the rune strip); hovering shows artifact name and effect",
      "Artifact badges hidden in condensed HP+XP view (gear-hidden mode)",
    ],
  },
  {
    version: "v2.14.3",
    date: "2026-05-16",
    changes: [
      "Artifact inventory no longer flickers every tick — render cache prevents DOM rewrite when nothing changed, making the equip dropdown selectable",
      "Party Artifacts panel: empty slots now show an inline artifact dropdown + Equip button (matching the Rune panel UX) instead of static 'equip from Artifacts tab' text",
    ],
  },
  {
    version: "v2.14.2",
    date: "2026-05-16",
    changes: [
      "Loot panel split into 3 sub-tabs: Equipment (loot chest + stash), Runes, Artifacts — no more separate top-level Artifacts sidebar tab",
      "Runes and Artifacts sub-tabs appear only when unlocked/earned; each shows a live item count in the tab button",
    ],
  },
  {
    version: "v2.14.1",
    date: "2026-05-16",
    changes: [
      "Artifact equip: moved Equip button + character/slot dropdown into the sidebar Artifacts panel alongside the artifact — no more hunting for it in a separate party tab",
      "Fixed: #artifact-panel was missing from the sidebar CSS display:none list, causing it to render on top of other panels instead of participating in the tab system",
    ],
  },
  {
    version: "v2.14.0",
    date: "2026-05-16",
    changes: [
      "Artifact system: 6 base artifacts drop from dungeon-3+ bosses (10% chance) — Bloodstone, Berserker's Eye, Greed Idol, Soulbrand, Warden's Core, Executioner's Mark",
      "Artifacts: combine 2 identical base artifacts into 1 upgraded artifact (6 upgraded variants)",
      "Artifacts: each character has 3 artifact slots; effects apply dynamically during combat",
      "Artifacts: persist through prestige — separate ✨ Artifacts sidebar tab and party panel tab appear once you earn your first artifact",
      "Kill streak tracker: increments per kill, resets on party wipe (used by Berserker's Eye / Titan's Eye DPS bonuses)",
    ],
  },
  {
    version: "v2.13.8",
    date: "2026-05-16",
    changes: [
      "Gear rows: lock button and unequip button now stay on the same line — grid expanded from 4 to 5 columns",
      "Gear rows: quality adjective (Rare, Epic, etc.) no longer shown in the item name — color already conveys quality; name now shows 'sword of valor' instead of 'Epic sword of valor'",
    ],
  },
  {
    version: "v2.13.7",
    date: "2026-05-16",
    changes: [
      "Memory: game loop interval now stored and cleared before re-init — prevents duplicate loops on re-initialization",
      "Memory: portrait animation timeouts (750ms/380ms) now cancelled before re-scheduling — prevents stacking on rapid boss/elite transitions",
      "Memory: feats badge hide-timeout now cancelled before re-scheduling — prevents stacking when multiple achievements unlock in sequence",
      "Memory: appendLog now trims the combat-log DOM to 50 entries — prevents unbounded node growth from repeated error messages",
    ],
  },
  {
    version: "v2.13.6",
    date: "2026-05-16",
    changes: [
      "Idle gold stat now reads 'Idle: X/s' instead of '⚙ X/s'; hover shows tooltip 'Gold earned per second from idle companions'",
    ],
  },
  {
    version: "v2.13.5",
    date: "2026-05-16",
    changes: [
      "Fixed: elite enemy portrait no longer shows a broken image icon in Chrome — border <img> is now hidden by default and explicitly re-hidden when an elite (not boss) appears",
    ],
  },
  {
    version: "v2.13.4",
    date: "2026-05-16",
    changes: [
      "Credits: added asphaltbuffet to testers",
    ],
  },
  {
    version: "v2.13.3",
    date: "2026-05-16",
    changes: [
      "Fixed: Chrome broken-image icon on elite enemy portrait (border `<img>` now uses removeAttribute('src') instead of src='')",
      "Performance: eliminated redundant game-state serializations — tick saves now throttled to every 5 s (was every 100 ms), cutting localStorage writes from 20/s to 0.2/s and reducing GC pressure that caused high memory usage in long sessions",
    ],
  },
  {
    version: "v2.13.2",
    date: "2026-05-16",
    changes: [
      "Fixed: boss portrait no longer overflows panel in Firefox — replaced non-standard `width: stretch` with `width: auto` on the absolutely-positioned portrait and border images, which are already sized by their `inset` property",
    ],
  },
  {
    version: "v2.13.1",
    date: "2026-05-16",
    changes: [
      "Gear locking: click the 🔓 button on any gear slot to lock it — auto-equip and Equip All will not replace locked items; manual equip still works as override",
      "Lock state survives prestige and saves/loads correctly; locked slots show a gold left-border",
      "Ring slots can be locked independently; both rings locked prevents any auto ring replacement",
    ],
  },
  {
    version: "v2.13.0",
    date: "2026-05-16",
    changes: [
      "Named Gear Sets: four sets (Shadowbane, Iron Bulwark, Plunderer's Kit, Warlord's Grasp) each with 2pc and 3pc stat bonuses",
      "Bosses always drop a set piece; elite enemies have a 15% chance to drop a set piece",
      "Set pieces are always at least rare quality and display with gold styling throughout the UI",
      "Active set bonuses shown as badges on each character card (gold = 2pc, bright = 3pc)",
    ],
  },
  {
    version: "v2.12.3",
    date: "2026-05-16",
    changes: [
      "Fixed: enemy panel height no longer grows when boss/elite portrait appears — portrait wrap now has a fixed height so the panel stays stable even before the image slides in",
    ],
  },
  {
    version: "v2.12.2",
    date: "2026-05-16",
    changes: [
      "Fixed: enemy panel no longer bounces when boss/elite portrait slides in — enemy name is now clipped to one line and panel content is top-anchored so the vertical position never shifts",
    ],
  },
  {
    version: "v2.12.1",
    date: "2026-05-16",
    changes: [
      "Fixed: 'Warlord' boss title now reads 'Ravager' to avoid 'Warlord … Lord' repetition",
      "Fixed: Shop badge no longer shows when guild hall upgrades are locked or unaffordable (checks guild_hall_access + dungeon requirement)",
      "Fixed: Header gold number now reserves stable width to prevent layout shift as gold grows",
      "Added: 📦 button on each loot item lets you send it directly to the stash (disabled when stash is full)",
    ],
  },
  {
    version: "v2.12.0",
    date: "2026-05-16",
    changes: [
      "Gear Stash: persistent cross-prestige storage unlocked via Prestige Shop in Dungeon 3+ (Lv1: 3 slots free, Lv2: 6 slots 2pt, Lv3: 10 slots 5pt, Lv4: 15 slots 10pt)",
      "Unequipping gear now goes to stash first (if unlocked and not full), then loot pool",
      "Stash items can be equipped to any party member or sold from the loot panel",
      "Stash persists through prestige but clears on venture",
    ],
  },
  {
    version: "v2.11.5",
    date: "2026-05-16",
    changes: [
      "Rune achievements now appear in the Feats panel under a 🔮 Runes category",
      "Fix: elite/boss glow border no longer causes layout jump — shadow fades in smoothly with a transition",
    ],
  },
  {
    version: "v2.11.4",
    date: "2026-05-16",
    changes: [
      "Fix: Consecrate now correctly heals on all 5 kills of its duration (was healing only 4 due to decrement-before-check off-by-one)",
    ],
  },
  {
    version: "v2.11.3",
    date: "2026-05-16",
    changes: [
      "Lifetime Stats panel now shows current Dungeon number",
    ],
  },
  {
    version: "v2.11.2",
    date: "2026-05-16",
    changes: [
      "Fix: massive memory reduction — floor progress pips, combat log, and lifetime stats now skip DOM rebuilds when nothing changed",
    ],
  },
  {
    version: "v2.11.1",
    date: "2026-05-16",
    changes: [
      "Fix: gear unequip ✕ button no longer flickers — party card DOM is now stable between ticks (HP/XP update in-place instead of full rebuild)",
    ],
  },
  {
    version: "v2.11.0",
    date: "2026-05-16",
    changes: [
      "Toggleable auto actions: Auto Equip and Auto Sell can each be turned ON/OFF from the loot panel; state persists across saves",
    ],
  },
  {
    version: "v2.10.9",
    date: "2026-05-16",
    changes: [
      "Empty gear slots now show a dropdown of matching loot + Equip button, just like the rune panel",
    ],
  },
  {
    version: "v2.10.8",
    date: "2026-05-16",
    changes: [
      "Fix: gear unequip ✕ button now sits inline after stats; no longer flickers on hover",
    ],
  },
  {
    version: "v2.10.7",
    date: "2026-05-16",
    changes: [
      "Fix: add 'runes' to AchievementCategory type (TypeScript error broke CI deploy)",
    ],
  },
  {
    version: "v2.10.6",
    date: "2026-05-16",
    changes: [
      "Gear unequipping: hover a gear slot to reveal ✕ button; unequipped item returns to loot chest",
    ],
  },
  {
    version: "v2.10.5",
    date: "2026-05-16",
    changes: [
      "12 new achievements: Not Alone, Band of Heroes, Battle Ready, Arsenal, Arcane Brand, Forge Master, Fully Attuned, Ancient Power, Gem Collector, Rune Trader, Elite Hunter, Upgrade Junkie",
      "Lifetime tracking counters: elite kills, runes sold, runes combined, skill activations, upgrades bought",
    ],
  },
  {
    version: "v2.10.4",
    date: "2026-05-16",
    changes: [
      "Passive skills moved inside header column, alongside the hero image instead of below it",
    ],
  },
  {
    version: "v2.10.3",
    date: "2026-05-16",
    changes: [
      "Passive skills moved to hero card above HP bar, next to rune quick-reference row",
    ],
  },
  {
    version: "v2.10.2",
    date: "2026-05-16",
    changes: [
      "Move passive skills from hero card to Rune page (below each character's rune slots)",
    ],
  },
  {
    version: "v2.10.1",
    date: "2026-05-16",
    changes: [
      "Rune page: passive skills shown below each character's rune slots",
    ],
  },
  {
    version: "v2.10.0",
    date: "2026-05-16",
    changes: [
      "Hide header settings button on tablet/mobile (≤768px) — use the ⚙ tab in the bottom nav instead",
    ],
  },
  {
    version: "v2.9.9",
    date: "2026-05-16",
    changes: [
      "Stats bar wraps to two rows on laptop-sized screens (769–1280px) to prevent overflow",
    ],
  },
  {
    version: "v2.9.8",
    date: "2026-05-16",
    changes: [
      "Fix: changelog modal no longer renders behind the settings modal (duplicate z-index declaration)",
    ],
  },
  {
    version: "v2.9.7",
    date: "2026-05-16",
    changes: [
      "Prestige Shop and Guild Hall show current level stats (e.g. Checkpoint shows current respawn floor)",
    ],
  },
  {
    version: "v2.9.6",
    date: "2026-05-16",
    changes: [
      "Credits: split Jeremy's Art and Testing into separate entries; added The Spider Knight and Feyla as testers",
    ],
  },
  {
    version: "v2.9.5",
    date: "2026-05-15",
    changes: [
      "Companion active skills display in a single row instead of stacked vertically",
    ],
  },
  {
    version: "v2.9.4",
    date: "2026-05-15",
    changes: [
      "Rune page: empty slots show a rune dropdown + Brand button to socket directly from the slot",
      "Rune page: filled slots have an ✕ button to remove the rune back to inventory",
    ],
  },
  {
    version: "v2.9.3",
    date: "2026-05-15",
    changes: [
      "Rune inventory sorted by tier (descending) then alphabetically by type",
    ],
  },
  {
    version: "v2.9.2",
    date: "2026-05-15",
    changes: [
      "Party rune panel displays hero rune cards in 2-column grid (matches party panel layout)",
    ],
  },
  {
    version: "v2.9.1",
    date: "2026-05-15",
    changes: [
      "Rune inventory displays in 2-column grid (matches hero card layout)",
    ],
  },
  {
    version: "v2.9.0",
    date: "2026-05-15",
    changes: [
      "Move rune combine UI from Guild Hall to the Loot page (alongside rune inventory)",
    ],
  },
  {
    version: "v2.8.9",
    date: "2026-05-15",
    changes: [
      "Fix: rune combine tiers corrected — Forge 2: lesser→greater, Forge 3: greater→flawless, Forge 4: flawless→ancient",
    ],
  },
  {
    version: "v2.8.8",
    date: "2026-05-15",
    changes: [
      "Fix: upgrade buttons no longer flicker when idle gold ticks in Dungeon 2+ — affordability now updates in-place without rebuilding the DOM",
    ],
  },
  {
    version: "v2.8.7",
    date: "2026-05-15",
    changes: [
      "Loot chest and rune inventory are now fixed height (always 5 items tall) — no more layout bounce",
    ],
  },
  {
    version: "v2.8.6",
    date: "2026-05-15",
    changes: [
      "Loot chest: fixed-height scrollable list (~5 items), sorted by quality highest-to-lowest",
      "Rune inventory: fixed-height scrollable list (~5 runes), sorted by tier highest-to-lowest",
    ],
  },
  {
    version: "v2.8.5",
    date: "2026-05-15",
    changes: [
      "Rune inventory: Sell button on each rune, Sell All button at top of rune list",
      "Sell values: Lesser 10g, Greater 30g, Flawless 90g, Ancient 250g",
    ],
  },
  {
    version: "v2.8.4",
    date: "2026-05-15",
    changes: [
      "Party size gold bonus: +20% boss gold per additional party member (2 members = +20%, 5 members = +80%)",
      "Stats bar shows the active bonus when party size > 1",
    ],
  },
  {
    version: "v2.8.3",
    date: "2026-05-15",
    changes: [
      "4-tier rune system: Lesser → Greater → Flawless → Ancient (each 2× the previous)",
      "Rune Forge Tier 4 (40k) unlocks: combine 2× Greater → Flawless, 2× Flawless → Ancient",
      "New rune colors: Flawless (blue), Ancient (gold) on char cards, party panel, and tooltips",
    ],
  },
  {
    version: "v2.8.2",
    date: "2026-05-15",
    changes: [
      "Guild Hall price reductions: companion_hall II 15k→8k, paladin/ranger 6k→4k, consecrate/volley 8k→5k, rune_forge 8k/20k/50k→5k/10k/20k",
    ],
  },
  {
    version: "v2.8.1",
    date: "2026-05-15",
    changes: [
      "New prestige upgrade: Gold Bonus (+10% gold from kills per stack, 1pt base with scaling cost)",
    ],
  },
  {
    version: "v2.8.0",
    date: "2026-05-15",
    changes: [
      "Elite enemies now drop runes at 10% chance (bosses remain at 20%) when Rune Forge is owned",
      "Rune inventory empty message and Rune Forge description updated to mention both drop sources",
    ],
  },
  {
    version: "v2.7.9",
    date: "2026-05-15",
    changes: [
      "Socketed runes now survive prestige — rune stats are re-applied to the fresh party after each reset",
    ],
  },
  {
    version: "v2.7.8",
    date: "2026-05-15",
    changes: [
      "Boss encounters now glow red — enemy panel border and name turn red during boss fights (mirrors the purple elite glow)",
    ],
  },
  {
    version: "v2.7.7",
    date: "2026-05-15",
    changes: [
      "Defense upgrade re-added to auto-upgrade rotation",
    ],
  },
  {
    version: "v2.7.6",
    date: "2026-05-15",
    changes: [
      "Party panel: Party / 🔮 Runes tab switcher — Runes tab shows each character's socketed slots at a glance",
      "Rune inventory moved to the Loot panel — brand runes directly alongside loot with per-character slot selectors",
      "Slot selector shows existing rune tier in parentheses (e.g. 'Main Hand (lesser)'); updates when character changes",
      "Character cards show a row of 9 rune slot squares below DPS — empty outlines, tan for lesser, purple for greater",
      "Hovering a filled rune square shows a stat tooltip (name, tier, slot, bonus) matching the gear tooltip style",
      "Rune squares also appear in the hero stat card tooltip; DPS breakdown shows a Runes row when Striking runes are socketed",
    ],
  },
  {
    version: "v2.7.5",
    date: "2026-05-15",
    changes: [
      "Gold rewards now scale +1% per dungeon level — floor 20 yields ~20% more gold, easing mid-game slowdown",
      "Auto-upgrade no longer reserves gold for Guild Hall purchases — spends freely again",
    ],
  },
  {
    version: "v2.7.4",
    date: "2026-05-15",
    changes: [
      "Skill tooltip descriptions updated to reflect balanced cooldown/duration values",
      "Loot header restructured into 2 rows — title/icons on top, Equip All/Sell All buttons below (fixes overlap)",
      "Elite enemy portrait now shows monster sprite with purple CSS glow frame (no border PNG distortion)",
      "Boss border art cropped to bounding box — transparent padding removed for correct framing",
      "Defense upgrade removed from auto-upgrade rotation; base cost raised to 150g (buy manually)",
      "Auto-upgrade now reserves gold equal to the next available Guild Hall purchase before spending",
    ],
  },
  {
    version: "v2.7.3",
    date: "2026-05-15",
    changes: [
      "Skill balance pass — all active skills now contribute ~40-50% average DPS boost",
      "Battle Cry: CD 30→20, duration 5→8 kills (was the weakest at ~17% avg boost, now 40%)",
      "Shadow Strike: now boosts tick DPS as well as clicks (was idle-useless); 3× mult, CD 20, dur 5",
      "Arcane Surge: duration 5→6 kills (slight buff to 48% avg boost)",
      "Consecrate: CD 20→15 kills (more frequent healing)",
      "Volley: mult 4×→2.5×, dur 4→6 kills (was strongest at 60% avg, now 50%)",
    ],
  },
  {
    version: "v2.7.2",
    date: "2026-05-15",
    changes: [
      "Elite enemies: 15% chance to spawn a rare elite variant with 2.5× HP, 1.5× attack, 2× XP/gold, and a guaranteed loot drop",
      "Elites display with purple name, glowing border, ⚡ ELITE ENEMY ⚡ floor indicator, and monster portrait with purple CSS frame",
      "New boss border art for all 10 boss types (cleaner style from Jeremy)",
    ],
  },
  {
    version: "v2.7.0",
    date: "2026-05-15",
    changes: [
      "Major update — significant new content and UI overhaul across the board",
      "Rune Forge: socket runes into gear for flat stat bonuses; 12 rune types (Lesser/Greater); boss drops; Tier 2 rune recovery; Tier 3 combining",
      "Achievements (Feats): 25 achievements across 6 categories with Bronze/Silver/Gold tiers, rewards, and earned titles",
      "Prestige-locked visual themes: 8 themes unlocked by prestige count",
      "Defense upgrade: 5th per-character stat (+1% damage reduction per level)",
      "Title selector: pick any earned achievement title from the Feats panel",
      "Loot filter: dim non-upgrade items in the loot chest with one click",
      "Combat log history: scrollable 200-entry log modal",
      "Keyboard shortcuts: Space/Enter = Attack, E = Equip All, X = Sell All, S = Skill",
      "Settings moved to a header gear button (⚙) opening a full-page modal",
      "Guild Hall sorted by price ascending, owned items at the bottom",
      "Tooltip item names no longer include quality prefix",
      "Credits section added to Settings",
    ],
  },
  {
    version: "v2.6.83",
    date: "2026-05-15",
    changes: [
      "Rune Forge: Guild Hall upgrade (3 tiers) — socket runes into gear slots for flat stat bonuses",
      "12 runes: 6 types × 2 tiers (Lesser/Greater) — Striking (DPS), Warding (HP), Swiftness (Haste), Greed (Gold), Fortune (XP), Wrath (Crit)",
      "Boss kills (20% chance) drop random lesser runes when Rune Forge is purchased",
      "Branding: Tier 1 destroys old rune; Tier 2 returns it to inventory",
      "Combining: Tier 3 lets you combine two matching lesser runes into a greater",
      "Rune inventory rendered in Guild Hall tab with Brand / Combine controls",
    ],
  },
  {
    version: "v2.6.82",
    date: "2026-05-15",
    changes: [
      "Achievements (Feats): 25 achievements across 6 categories (Combat, Explorer, Collector, Wealth, Prestige, Guild) with Bronze/Silver/Gold tiers",
      "Achievement rewards: gold, prestige points, and cosmetic titles displayed on the lead character card",
      "Hidden achievements show ??? until unlocked",
      "Toast notifications on achievement unlock",
      "Feats sidebar panel with category grouping, tier pip indicators, and locked/unlocked state",
      "Lifetime stat tracking: gold earned, items looted/sold, boss kills, legendary/divine finds",
    ],
  },
  {
    version: "v2.6.81",
    date: "2026-05-15",
    changes: [
      "Prestige-locked themes: 4 new themes (Void Rift, Bloodmoon, Frost Crypt, Necropolis) and existing themes (Tavern, Inferno) now require prestiges to unlock",
      "Theme picker dynamically renders locked/unlocked buttons with prestige requirements shown on locked themes",
    ],
  },
  {
    version: "v2.6.80",
    date: "2026-05-15",
    changes: [
      "Settings: Export Save downloads your save as a JSON file; Import Save restores from a backup",
    ],
  },
  {
    version: "v2.6.79",
    date: "2026-05-15",
    changes: [
      "Dead party members now show greyed out with a skull prefix on their DPS",
      "DPS hover tooltip shows Base / Gear / Upgrade Level breakdown",
      "Guild Hall cards show a preview of the next purchase's concrete effect",
    ],
  },
  {
    version: "v2.6.78",
    date: "2026-05-14",
    changes: [
      "Loot chest: name + slot badge on top row; bonuses left, buttons vertically centered right",
    ],
  },
  {
    version: "v2.6.77",
    date: "2026-05-14",
    changes: [
      "Loot chest: item name top-left, slot badge top-right above buttons",
    ],
  },
  {
    version: "v2.6.76",
    date: "2026-05-14",
    changes: [
      "Loot chest: item names no longer include quality (shown by color and tooltip instead); names wrap instead of truncating",
    ],
  },
  {
    version: "v2.6.75",
    date: "2026-05-14",
    changes: [
      "Loot chest: item bonuses now display in a 2-column grid instead of a single row",
    ],
  },
  {
    version: "v2.6.74",
    date: "2026-05-14",
    changes: [
      "Depth gauge: tick marks at every 5 floors on the left side; checkpoint tick highlighted with ⚑",
    ],
  },
  {
    version: "v2.6.73",
    date: "2026-05-14",
    changes: [
      "Offline progress: idle gold now accumulates while away, up to 8 hours, shown on return",
    ],
  },
  {
    version: "v2.6.72",
    date: "2026-05-14",
    changes: [
      "Mobile: depth gauge top now tracks live header height via ResizeObserver — no longer hidden behind header",
      "Mobile: prestige and venture buttons locked to a single stable row (no bouncing when HP changes)",
      "Mobile: Prestige Shop and Guild Hall hidden in shop tab until unlocked",
    ],
  },
  {
    version: "v2.6.71",
    date: "2026-05-14",
    changes: [
      "Mobile: depth gauge track no longer hidden behind the header and enemy panel",
    ],
  },
  {
    version: "v2.6.70",
    date: "2026-05-14",
    changes: [
      "Depth gauge now shows 💀 skull markers at floors where you died (stacked deaths show ×count)",
    ],
  },
  {
    version: "v2.6.69",
    date: "2026-05-14",
    changes: [
      "Venture unlock floor increases by 10 per dungeon (dungeon 2 needs floor 50, dungeon 3 needs floor 60, …)",
    ],
  },
  {
    version: "v2.6.68",
    date: "2026-05-14",
    changes: [
      "Venture now resets auto tools (Auto Seller, Auto Equip, Auto Upgrade, Smart Seller) — must re-buy each dungeon",
      "New dungeon 2+ Guild Hall skills: Consecrate (Paladin, heals party 25% max HP per kill for 5 kills) and Volley (Ranger, ×4 DPS for 4 kills)",
      "New dungeon 2+ prestige upgrades: Gold Mastery (+20% boss gold per stack) and Gear Luck (+5% drop chance per stack)",
    ],
  },
  {
    version: "v2.6.67",
    date: "2026-05-14",
    changes: [
      "Difficulty tuning: enemy attack DPS raised (regular 3.0→4.0, boss 5.0→6.5 per floor)",
      "Dungeon index attack multiplier increased (25%→40% per dungeon)",
      "Combat heal per kill reduced (20%→12% of missing HP)",
    ],
  },
  {
    version: "v2.6.66",
    date: "2026-05-13",
    changes: [
      "Skill cooldowns are now kill-based instead of time-based — cooldown shows as kills remaining",
      "Skill tooltip shows cooldown in kills instead of seconds",
    ],
  },
  {
    version: "v2.6.65",
    date: "2026-05-13",
    changes: [
      "Smart Seller now clears non-upgrade items from a full loot chest, regardless of quality tier",
    ],
  },
  {
    version: "v2.6.64",
    date: "2026-05-13",
    changes: [
      "Party panel: ⚔ toggle button hides/shows gear and abilities for a condensed HP+XP view; preference saved across sessions",
    ],
  },
  {
    version: "v2.6.63",
    date: "2026-05-13",
    changes: [
      "Checkpoint: each level unlocks the next floor-5 checkpoint (lv1→floor 5, lv2→floor 10, lv3→floor 15…); buy more to push checkpoints deeper",
    ],
  },
  {
    version: "v2.6.62",
    date: "2026-05-13",
    changes: [
      "Checkpoint is now a single 3-level prestige upgrade (lv1: every 15 floors · lv2: every 10 · lv3: every 5); existing saves migrate automatically",
    ],
  },
  {
    version: "v2.6.61",
    date: "2026-05-13",
    changes: [
      "Auto Equip now runs before new loot drops — gear sits in the chest for at least one monster before being equipped",
    ],
  },
  {
    version: "v2.6.60",
    date: "2026-05-13",
    changes: [
      "Auto Seller now runs before new loot drops — gear sits in the chest for at least one monster",
    ],
  },
  {
    version: "v2.6.59",
    date: "2026-05-13",
    changes: [
      "Save conflict resolution: different run IDs prompt you to choose; same run uses the save with more kills",
    ],
  },
  {
    version: "v2.6.58",
    date: "2026-05-13",
    changes: [
      "Enemy attack scales by sqrt(living party size) — companions are still strong but danger stays meaningful",
    ],
  },
  {
    version: "v2.6.57",
    date: "2026-05-13",
    changes: [
      "Auto Seller shows next quality tier to unlock and the floor required",
    ],
  },
  {
    version: "v2.6.56",
    date: "2026-05-13",
    changes: [
      "Prestige shop sorted by price (low to high); purchased items sink to bottom",
    ],
  },
  {
    version: "v2.6.55",
    date: "2026-05-13",
    changes: [
      "Starting Gold prestige upgrade now grants gold immediately on purchase",
    ],
  },
  {
    version: "v2.6.54",
    date: "2026-05-13",
    changes: [
      "Fix two flaky CI tests: companion auto-equip and gold scaling randomness",
    ],
  },
  {
    version: "v2.6.53",
    date: "2026-05-13",
    changes: [
      "Guild Hall now unlocked via 5-point prestige upgrade instead of reaching floor 10",
    ],
  },
  {
    version: "v2.6.52",
    date: "2026-05-13",
    changes: [
      "Hover over active skill buttons to see description and cooldown",
    ],
  },
  {
    version: "v2.6.51",
    date: "2026-05-13",
    changes: [
      "Hard Reset now clears cloud save when signed in — reloading won't restore the old save",
    ],
  },
  {
    version: "v2.6.50",
    date: "2026-05-13",
    changes: [
      "Enemy attack DPS further increased (regular ×3.0/level, boss ×5.0/level)",
      "HP upgrade bonus reduced from +25 to +15 HP to keep enemy attack pressure relevant",
    ],
  },
  {
    version: "v2.6.49",
    date: "2026-05-13",
    changes: [
      "Enemy attack DPS doubled (regular) and more than doubled (boss) to create meaningful HP attrition",
      "Post-combat heal reduced from 30% to 20% of missing HP",
    ],
  },
  {
    version: "v2.6.48",
    date: "2026-05-13",
    changes: [
      "Level-up now restores 50% of missing HP instead of fully healing",
    ],
  },
  {
    version: "v2.6.47",
    date: "2026-05-13",
    changes: [
      "Boss kills no longer fully heal the party — same 30% lost-HP heal as regular enemies",
    ],
  },
  {
    version: "v2.6.46",
    date: "2026-05-13",
    changes: [
      "Post-combat heal now restores 30% of lost HP (was 30% of max HP)",
    ],
  },
  {
    version: "v2.6.45",
    date: "2026-05-13",
    changes: [
      "Guild tab hidden until floor 10; Prestige tab hidden until floor 20 (both unlock permanently via lifetime best level)",
    ],
  },
  {
    version: "v2.6.44",
    date: "2026-05-13",
    changes: [
      "Combat healing reworked: regular kills restore 30% HP, boss kills fully heal, leveling up fully heals",
    ],
  },
  {
    version: "v2.6.43",
    date: "2026-05-12",
    changes: [
      "Companion active skills now work (any party member with matching class can trigger their skill)",
      "Skill duration changed from seconds to number of monsters killed (Battle Cry: 5 kills, Arcane Surge: 5 kills, Shadow Strike: 3 kills)",
      "Checkpoint is now a prestige unlock: floor 15 only (1pt), every 10 floors (2pt), every 5 floors (3pt)",
    ],
  },
  {
    version: "v2.6.42",
    date: "2026-05-12",
    changes: [
      "Fix companion skill buttons not firing (TypeScript scope error in click handler)",
    ],
  },
  {
    version: "v2.6.41",
    date: "2026-05-12",
    changes: [
      "Companion active skills now appear below the Attack button when purchased from the Guild Hall",
    ],
  },
  {
    version: "v2.6.40",
    date: "2026-05-12",
    changes: [
      "Fix: Guild Hall buttons no longer flash or block clicks (DOM was rebuilding every tick due to gold changing)",
    ],
  },
  {
    version: "v2.6.39",
    date: "2026-05-12",
    changes: [
      "Balance: idle companion gold rate reduced from 0.5 to 0.01 per DPS per second",
    ],
  },
  {
    version: "v2.6.38",
    date: "2026-05-12",
    changes: [
      "Guild Hall tab is now always visible, replacing the Log tab",
      "Guild Hall added to mobile navigation",
    ],
  },
  {
    version: "v2.6.37",
    date: "2026-05-12",
    changes: [
      "Fix: Guild Hall tab now correctly persists after venturing (lifetime best depth was not saved on venture)",
    ],
  },
  {
    version: "v2.6.36",
    date: "2026-05-12",
    changes: [
      "Each dungeon beyond the first scales enemies +25% HP and attack per dungeon",
      "Loot quality improves with dungeon depth (+5 effective levels per dungeon)",
      "Drop rate increases by 5% per dungeon (capped at 75%)",
    ],
  },
  {
    version: "v2.6.35",
    date: "2026-05-12",
    changes: [
      "Fix: Guild Hall tab now stays visible after venturing to a new dungeon (uses lifetime best depth, not current-run depth)",
    ],
  },
  {
    version: "v2.6.34",
    date: "2026-05-12",
    changes: [
      "Fix: Inferno theme — fiery attack button, ember depth gauge, warm dark backgrounds, crimson panel glow",
    ],
  },
  {
    version: "v2.6.33",
    date: "2026-05-12",
    changes: [
      "New theme: 🔥 Inferno — charred black, ember orange, and cyan sword-glow inspired by the favicon",
    ],
  },
  {
    version: "v2.6.32",
    date: "2026-05-12",
    changes: [
      "Mobile: boss portrait now appears inside the enemy panel on the left during boss fights",
    ],
  },
  {
    version: "v2.6.31",
    date: "2026-05-12",
    changes: [
      "Fix: boss portrait and border images now fill the portrait frame correctly",
    ],
  },
  {
    version: "v2.6.30",
    date: "2026-05-12",
    changes: [
      "Boss fights now show a unique monster portrait + adjective/title border frame",
      "Portrait animates in from the depth gauge on boss spawn and collapses on defeat",
      "Pixel-art portraits for all 15 enemy types; decorative borders for all adjectives and boss titles",
    ],
  },
  {
    version: "v2.6.29",
    date: "2026-05-12",
    changes: [
      "Fix: Sell All button styled to match the game theme (gold outline)",
    ],
  },
  {
    version: "v2.6.28",
    date: "2026-05-12",
    changes: [
      "Sell All button in the Loot panel — sells every item in one click",
    ],
  },
  {
    version: "v2.6.27",
    date: "2026-05-12",
    changes: [
      "Fix: session-conflict banner now actually hides — CSS display:flex was overriding the hidden attribute",
    ],
  },
  {
    version: "v2.6.26",
    date: "2026-05-12",
    changes: [
      "Mobile: depth gauge now shows as a fixed left strip, visible alongside all tabs",
    ],
  },
  {
    version: "v2.6.25",
    date: "2026-05-12",
    changes: [
      "Depth gauge moved to the left of the main content area with a 'Depth' label above it",
    ],
  },
  {
    version: "v2.6.24",
    date: "2026-05-12",
    changes: [
      "Hero stat card: portrait now fills the full width edge-to-edge at the top, above all text",
    ],
  },
  {
    version: "v2.6.23",
    date: "2026-05-12",
    changes: [
      "Fix: hero portraits now show the correct character (switched from sprite sheet to individual files)",
      "Hero portrait now appears in the hero stat card popup",
    ],
  },
  {
    version: "v2.6.22",
    date: "2026-05-12",
    changes: [
      "Hero card redesign: larger portrait on the right, name/class/DPS stacked on the left",
    ],
  },
  {
    version: "v2.6.21",
    date: "2026-05-12",
    changes: [
      "Hero portraits updated to new artwork — all 5 classes in a unified style",
    ],
  },
  {
    version: "v2.6.20",
    date: "2026-05-12",
    changes: [
      "Settings: added About section explaining the AI-assisted development origin of the game",
    ],
  },
  {
    version: "v2.6.19",
    date: "2026-05-12",
    changes: [
      "Paladin and Ranger now have their own pixel-art portraits on hero cards",
    ],
  },
  {
    version: "v2.6.18",
    date: "2026-05-12",
    changes: [
      "Hero cards now display a pixel-art portrait for each class (fighter, rogue, mage; paladin shares fighter, ranger shares rogue)",
    ],
  },
  {
    version: "v2.6.17",
    date: "2026-05-12",
    changes: [
      "Favicon icon now appears next to the Toddpocalypse title in the header",
    ],
  },
  {
    version: "v2.6.16",
    date: "2026-05-12",
    changes: [
      "Desktop: hero cards now display in a 2-column grid instead of a single expanding row",
    ],
  },
  {
    version: "v2.6.15",
    date: "2026-05-12",
    changes: [
      "Added pixel-art favicon (flaming skull warrior) — shows in browser tabs, bookmarks, and on iOS home screen",
    ],
  },
  {
    version: "v2.6.14",
    date: "2026-05-12",
    changes: [
      "Fix: session-conflict banner now dismisses immediately when Set Active Device succeeds — was lingering due to a racing periodic save re-showing it",
    ],
  },
  {
    version: "v2.6.13",
    date: "2026-05-12",
    changes: [
      "Fix: Set Active Device works again — force-claim now uses a query parameter instead of X-Force-Session header, which was blocked by API Gateway CORS",
    ],
  },
  {
    version: "v2.6.12",
    date: "2026-05-12",
    changes: [
      "Fix: Set Active Device now actually bypasses the session lock — previously sent the wrong session ID after reset, causing an immediate 409 conflict",
    ],
  },
  {
    version: "v2.6.11",
    date: "2026-05-12",
    changes: [
      "Fix: Set Active Device no longer fails with a connection error — removes the undeployed X-Force-Session header that blocked the browser CORS preflight",
      "Set Active Device now shows distinct messages: success, 'other device still active (try in 90s)', or actual connection failure",
    ],
  },
  {
    version: "v2.6.10",
    date: "2026-05-12",
    changes: [
      "Mobile: tap any ability badge in a hero's card to open a bottom sheet showing the skill name, unlock status, and description",
    ],
  },
  {
    version: "v2.6.9",
    date: "2026-05-12",
    changes: [
      "Set Active Device button: override a session conflict and claim this device as the primary saver — appears in Settings and in the conflict banner",
      "Load Cloud Save button: pull the latest DynamoDB save to this device without waiting for the next auto-sync",
    ],
  },
  {
    version: "v2.6.8",
    date: "2026-05-11",
    changes: [
      "Hover a hero's name or 'Your Party' to see a stat card — DPS, HP, click damage, defense, crit, gold, lifesteal, haste, XP bonus, and unlocked abilities",
      "Tapping a hero's name on mobile opens the same card as a bottom sheet",
    ],
  },
  {
    version: "v2.6.7",
    date: "2026-05-11",
    changes: [
      "Prestige: Smart Seller (4pt) — automatically checks new quality tiers in the Auto Seller as they unlock while climbing floors. Requires Auto Seller.",
    ],
  },
  {
    version: "v2.6.6",
    date: "2026-05-11",
    changes: [
      "Prestige shop: Starting Gold and XP Bonus now cost 1 more prestige point per stack already owned (1pt, 2pt, 3pt, …)",
    ],
  },
  {
    version: "v2.6.5",
    date: "2026-05-11",
    changes: [
      "Dream drops — the two quality tiers above the current floor maximum can now drop at ~1% and ~0.5% chance respectively",
    ],
  },
  {
    version: "v2.6.4",
    date: "2026-05-11",
    changes: [
      "Item card tooltip — hover any loot drop or equipped item to see a detailed stat breakdown",
      "Sub-common items (broken/worn/crude/poor) now always roll exactly 1 stat; secondary bonuses start at Common quality",
    ],
  },
  {
    version: "v2.6.3",
    date: "2026-05-11",
    changes: [
      "Multi-stat gear system — items now roll 1–3 stats (DPS, HP, Click, Defense, Crit, Gold, Lifesteal, Haste, XP) based on quality tier and slot type",
      "4 new character stats: Crit Chance (per-tick double damage), Gold Find (% more gold from bosses), Lifesteal (heal on damage dealt), Haste (DPS rate multiplier)",
      "Loot display now shows all stat bonuses instead of a single damage number",
      "Gear comparison (▲/▼) uses normalized power score across all stat types",
      "Backward-compatible: old saves with single-damage items migrate automatically",
    ],
  },
  {
    version: "v2.6.2",
    date: "2026-05-11",
    changes: [
      "Mobile: party HP and DPS now shown in the header stats bar",
      "Mobile: Lifetime Stats and Changelog accessible from Settings tab",
      "Mobile: enemy panel compacted — smaller name, HP text overlaid on bar, floor progress in 1-2 rows",
      "Mobile: unified scroll for shop tab (upgrades + prestige scroll as one page)",
    ],
  },
  {
    version: "v2.6.1",
    date: "2026-05-11",
    changes: [
      "Single-session enforcement — only one device can cloud-save at a time",
      "A warning banner appears if your game is already open elsewhere; it clears automatically when the other session expires (90 seconds of inactivity)",
    ],
  },
  {
    version: "v2.6.0",
    date: "2026-05-11",
    changes: [
      "Cloud save — sign in with Google to sync your save across devices",
      "Save writes to AWS DynamoDB on every autosave tick when signed in",
      "Cloud save loads automatically on page load; falls back to localStorage if offline or signed out",
      "Sign in / Sign out available in Settings tab",
    ],
  },
  {
    version: "v2.5.2",
    date: "2026-05-11",
    changes: [
      "Save auto-loads on page refresh — no more 'Continue' button required; upgrades and loot now persist across reloads",
      "Settings panel no longer bleeds into other sidebar tabs on desktop",
    ],
  },
  {
    version: "v2.5.1",
    date: "2026-05-11",
    changes: [
      "Three fantasy themes selectable in Settings: Grimdark, Arcane, Tavern",
      "Grimdark: smoldering charcoal + blood-red + UnifrakturMaguntia font",
      "Arcane: deep indigo + hammered gold + Cinzel Decorative font",
      "Tavern: dark walnut + lantern amber + Philosopher font",
      "All themes add: ornate inner panel borders, decorative flanking lines on section headers, subtle noise texture, gold title glow",
      "Theme persists across page reloads",
    ],
  },
  {
    version: "v2.5.0",
    date: "2026-05-11",
    changes: [
      "Settings tab added to desktop sidebar and mobile nav",
      "Hard Reset option in Settings — two-step confirmation before wiping save data",
      "Mobile: enemy panel fixed to bottom of screen so the attack button is always in thumb reach",
      "Mobile: loot section appears above party section on the combat tab",
      "Mobile: Prestige Shop hidden until floor 20; Guild Hall hidden until floor 40",
      "Guild Hall tab unlock condition corrected to floor 40 (venture floor)",
    ],
  },
  {
    version: "v2.4.9",
    date: "2026-05-08",
    changes: [
      "Guild Hall tab is hidden on a new game — unlocks after your first prestige",
    ],
  },
  {
    version: "v2.4.8",
    date: "2026-05-08",
    changes: [
      "Mythic+ glow intensity now escalates by tier — Mythic is subtle, Ancient/Celestial/Void each add more layers and wider spread",
      "Divine pulses between bright and blinding on a 2s cycle",
    ],
  },
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

import { describe, expect, it } from "vitest";
import {
  getSprite,
  enrageColor,
  enrageBarGradient,
  ENRAGE_COLORS,
  getUpgradeBonusLabel,
  getMobileUpgradeValue,
  statRow,
  formatStats,
  formatLootStats,
  buildTooltipHTML,
  buildDpsTooltipHTML,
  buildArtifactTooltipHTML,
  prestigeCurrentStat,
  guildCurrentStat,
  guildUpgradePreview,
  runeStatSummary,
  renderAutoSellerConfig,
  featRewardText,
  featTierList,
  upgradeGridColumns,
  mobileUpgradeButton,
  formatOdds,
  buildLootOddsHTML,
  welcomeBackLine,
  buildReturnToTownHTML,
} from "../src/ui/html.js";
import { GearItem } from "../src/gear.js";
import type { GameStateDict } from "../src/engine.js";

type CharDict = GameStateDict["party"][number];

describe("getSprite", () => {
  it("returns a sprite span for a mapped emoji", () => {
    expect(getSprite("⚔")).toBe('<span class="spr spr-sword" aria-hidden="true"></span>');
  });

  it("returns the raw emoji for an unmapped one", () => {
    expect(getSprite("🦄")).toBe("🦄");
  });
});

describe("enrage colors", () => {
  it("returns the indexed color for in-range stacks", () => {
    expect(enrageColor(0)).toBe(ENRAGE_COLORS[0]);
    expect(enrageColor(2)).toBe(ENRAGE_COLORS[2]);
  });

  it("clamps past the end of the palette", () => {
    expect(enrageColor(999)).toBe(ENRAGE_COLORS[ENRAGE_COLORS.length - 1]);
    expect(enrageBarGradient(999)).toContain("linear-gradient");
  });
});

describe("upgrade labels", () => {
  it("returns empty string at level 0", () => {
    expect(getUpgradeBonusLabel("dps", 0)).toBe("");
  });

  it("formats the dps bonus percentage", () => {
    expect(getUpgradeBonusLabel("dps", 2)).toMatch(/^\+\d+% DPS$/);
  });

  it("returns empty string for unknown types", () => {
    expect(getUpgradeBonusLabel("nope", 3)).toBe("");
  });

  it("mobile value strips the trailing stat name", () => {
    const full = getUpgradeBonusLabel("dps", 2);
    expect(getMobileUpgradeValue("dps", 2)).toBe(full.replace(/\s+\S+$/, ""));
  });
});

describe("statRow", () => {
  it("renders label and value", () => {
    const html = statRow("DPS", "42.0", "tt-dps");
    expect(html).toContain('<span class="tt-stat-label">DPS</span>');
    expect(html).toContain('<span class="tt-stat-val tt-dps">42.0</span>');
  });

  it("omits the class suffix when none given", () => {
    expect(statRow("HP", "10")).toContain('<span class="tt-stat-val">10</span>');
  });
});

describe("formatStats", () => {
  it("joins multiple stats", () => {
    const s = formatStats({ dps: 10, defense: 0.05 });
    expect(s).toContain("+10.0 DPS");
    expect(s).toContain("+5% Def");
  });

  it("returns +0 for an empty stats object", () => {
    expect(formatStats({})).toBe("+0");
  });

  it("formatLootStats puts the tri indicator on the first stat only", () => {
    const html = formatLootStats("▲", { dps: 10, maxHp: 20 });
    const spans = html.match(/<span class="loot-stat">/g) ?? [];
    expect(spans.length).toBe(2);
    expect(html.indexOf("▲")).toBeLessThan(html.indexOf("+20 HP"));
    expect(html.match(/▲/g)?.length).toBe(1);
  });
});

describe("buildTooltipHTML", () => {
  it("renders name, quality class, slot, and sell value", () => {
    const item = new GearItem("main_hand", "sword", "rare", "valor", { dps: 12.5 }, 3).toDict();
    const html = buildTooltipHTML(item);
    expect(html).toContain("q-rare");
    expect(html).toContain("Rare");
    expect(html).toContain("Main Hand · Floor 3");
    expect(html).toContain("+12.5");
    expect(html).toContain("Sell:");
  });

  it("includes the set bonus block for set pieces", () => {
    const item = new GearItem("helmet", "helm", "rare", "valor", {}, 1, "Shadowbane").toDict();
    expect(buildTooltipHTML(item, 2)).toContain("Shadowbane");
  });
});

// #74: every multiplier, in order, so the parts shown make the total shown.
describe("buildDpsTooltipHTML", () => {
  const hero = {
    name: "Aldric",
    parts: [{ label: "Class & level", value: 10 }, { label: "Gear", value: 5 }],
    factors: [{ label: "DPS upgrades", value: 1.2 }, { label: "Bloodlust", value: 1.6 }],
    crit: { chance: 0.12, multiplier: 2, sources: [{ label: "Gear", value: 0.08 }, { label: "Runes", value: 0.04 }] },
    average: 15 * 1.2 * 1.6 * 1.12,
  };
  const party = { factors: [{ label: "Battle Cry", value: 2 }], runesmith: 0, average: 64.5, heroCount: 1 };
  const html = buildDpsTooltipHTML({ hero, party });

  it("adds up the base parts", () => {
    expect(html).toContain("Class &amp; level");
    expect(html).toContain("15.0");
  });

  it("shows every multiplier with its label, as ×", () => {
    expect(html).toContain("DPS upgrades");
    expect(html).toContain("×1.2");
    expect(html).toContain("Bloodlust");
    expect(html).toContain("×1.6");
    expect(html).toContain("Battle Cry");
    expect(html).toContain("×2");
  });

  it("states the crit odds and where they come from", () => {
    expect(html).toMatch(/12% chance/);
    expect(html).toMatch(/×2 damage/);
    expect(html).toContain("Runes");
  });

  it("ends on the party's average", () => {
    expect(html).toContain("64.5");
  });

  it("explains a hero who deals nothing", () => {
    const idle = buildDpsTooltipHTML({ hero: { ...hero, average: 0, inactive: "No gear equipped — a hero needs at least one item to fight" }, party });
    expect(idle).toContain("No gear equipped");
  });
});

describe("formatOdds", () => {
  it.each([
    [0.45, "45%"],
    [0.123, "12.3%"],
    [0.01, "1%"],
    [0.004, "1 in 250"],
    [0.000714, "1 in 1,401"],
    [0, "—"],
  ])("%s → %s", (p, want) => {
    expect(formatOdds(p)).toBe(want);
  });
});

describe("buildLootOddsHTML", () => {
  const odds = {
    drop: { parts: [{ label: "Base", value: 0.45 }, { label: "Dungeon 2", value: 0.05 }], cap: 0.75, total: 0.5, capped: false },
    effective_level: 8,
    quality_boost_chance: 0,
    quality: { common: 0.6, fine: 0.3, rare: 0.004, epic: 0 } as Record<string, number>,
  };
  const html = buildLootOddsHTML(odds, 3);

  it("leads with the chance an enemy drops anything, and its sources", () => {
    expect(html).toContain("50%");
    expect(html).toContain("Base");
    expect(html).toContain("Dungeon 2");
  });

  it("says when quality rolls deeper than the floor shown", () => {
    expect(html).toMatch(/floor 8/i);
  });

  it("lists each quality that can drop, rare ones as 1 in N", () => {
    expect(html).toContain("60%");
    expect(html).toContain("1 in 250");
    expect(html).not.toMatch(/>epic</i);
  });

  it("notes elite and boss drops, which skip the roll", () => {
    expect(html).toMatch(/elites always drop/i);
    expect(html).toMatch(/bosses always drop a set piece/i);
  });

  it("says when the cap is reached", () => {
    expect(buildLootOddsHTML({ ...odds, drop: { ...odds.drop, total: 0.75, capped: true } }, 3)).toMatch(/capped at 75%/i);
  });
});

describe("welcomeBackLine", () => {
  it("says what was earned, and that the party didn't fight", () => {
    const line = welcomeBackLine(4210, 3 * 3600_000 + 12 * 60_000);
    expect(line).toContain("4,210 gold");
    expect(line).toContain("3h 12m");
    expect(line).toMatch(/doesn't fight while you're away/);
  });

  it("says when the idle cap cut earnings short", () => {
    expect(welcomeBackLine(100, 10 * 3600_000)).toMatch(/stops after 8h/);
  });

  it("is honest when nothing was earned", () => {
    expect(welcomeBackLine(0, 45 * 60_000)).toMatch(/no idle gold/i);
  });

  it("says nothing after a short absence with nothing earned", () => {
    expect(welcomeBackLine(0, 20_000)).toBe("");
  });
});

describe("buildArtifactTooltipHTML", () => {
  it("appends +level only when leveled", () => {
    const base = { id: "x", name: "Sigil", icon: "🦄", stat: "+5% DPS" };
    expect(buildArtifactTooltipHTML({ ...base, level: 0 })).not.toContain("+0");
    expect(buildArtifactTooltipHTML({ ...base, level: 2 })).toContain("Sigil +2");
  });
});

describe("prestige/guild stat labels", () => {
  it("prestigeCurrentStat is empty when unowned", () => {
    expect(prestigeCurrentStat("xp_bonus", 0)).toBe("");
  });

  it("prestigeCurrentStat formats owned tiers", () => {
    expect(prestigeCurrentStat("xp_bonus", 3)).toBe("Current: +30% XP");
  });

  it("guildCurrentStat reports loot slots for expanded_armory", () => {
    expect(guildCurrentStat("expanded_armory", 1, 10)).toBe("Current: 10 loot slots");
  });

  it("guildUpgradePreview previews the next armory tier", () => {
    expect(guildUpgradePreview("expanded_armory", 0, 8)).toBe("Loot chest: 8 → 10 slots");
  });
});

describe("runeStatSummary", () => {
  it("renders an empty placeholder without runes", () => {
    const c = { runes: {} } as unknown as CharDict;
    expect(runeStatSummary(c)).toContain("No runes socketed");
  });

  it("totals rune values per stat", () => {
    const c = {
      runes: {
        main_hand: { id: "a", name: "A", type: "striking", tier: "lesser", statKey: "dps", value: 8 },
        helmet:    { id: "b", name: "B", type: "striking", tier: "lesser", statKey: "dps", value: 16 },
      },
    } as unknown as CharDict;
    expect(runeStatSummary(c)).toContain("+24 DPS");
  });
});

describe("renderAutoSellerConfig", () => {
  it("lists checkable tiers up to the floor threshold and marks selected ones", () => {
    const state = { highest_level: 9, auto_sell_qualities: ["broken"] } as unknown as GameStateDict;
    const html = renderAutoSellerConfig(state);
    expect(html).toContain('data-quality="broken" checked');
    expect(html).toContain('data-quality="worn"');
    expect(html).not.toContain('data-quality="divine"');
  });
});


// #70: feat tiers used to be a letter (B/S/G) over a number, with rewards in a
// separate row of letter-prefixed chips; the meaning lived only in a tooltip.
describe("featRewardText", () => {
  it("names gold in words, not the g suffix that collides with Gold tier", () => {
    expect(featRewardText({ type: "gold", value: 500 })).toBe("+500 gold");
  });

  it("labels a title as a title", () => {
    expect(featRewardText({ type: "title", title: "Slayer" })).toBe("Title “Slayer”");
  });

  it("resolves an avatar to its icon and name", () => {
    expect(featRewardText({ type: "avatar", cosmetic: "dragon" })).toMatch(/Dragon Slayer avatar$/);
  });

  it("resolves a border to its name", () => {
    expect(featRewardText({ type: "border", cosmetic: "iron" })).toBe("Iron border");
  });

  it("returns empty for a reward it cannot describe", () => {
    expect(featRewardText({ type: "prestige_points", value: 1 })).toBe("");
  });
});

describe("featTierList", () => {
  const tiers = [
    { label: "bronze" as const, threshold: 100, reward: { type: "gold" as const, value: 500 }, done: true },
    { label: "silver" as const, threshold: 1000, reward: { type: "border" as const, cosmetic: "iron" }, done: false },
    { label: "gold" as const, threshold: 10000, done: false },
  ];
  const html = featTierList(tiers);
  const rows = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];

  it("is an ordered list, one row per tier", () => {
    expect(html.startsWith("<ol")).toBe(true);
    expect(rows).toHaveLength(3);
  });

  it("spells out each medal", () => {
    expect(rows[0][1]).toContain("Bronze");
    expect(rows[1][1]).toContain("Silver");
    expect(rows[2][1]).toContain("Gold");
    expect(html).not.toMatch(/>[BSG]:? </);
  });

  it("puts each tier's goal and reward on the same row", () => {
    expect(rows[0][1]).toContain("100");
    expect(rows[0][1]).toContain("+500 gold");
    expect(rows[1][1]).toContain("1,000");
    expect(rows[1][1]).toContain("Iron border");
  });

  it("marks earned tiers done and the first unearned one as next", () => {
    expect(rows[0][0]).toContain("is-done");
    expect(rows[1][0]).toContain("is-next");
    expect(rows[2][0]).not.toMatch(/is-done|is-next/);
  });

  it("needs no tooltip to be understood", () => {
    expect(html).not.toContain("title=");
  });
});

// Mobile/tablet audit #4: the upgrade grid always drew three hero columns, so a
// lone hero sat beside two empty ones, and its upgrade levels weren't shown.
describe("upgradeGridColumns", () => {
  it.each([[1, 1], [2, 2], [3, 3], [4, 3], [6, 3]])("party of %i → %i columns", (n, cols) => {
    expect(upgradeGridColumns(n)).toBe(cols);
  });
});

describe("mobileUpgradeButton", () => {
  const html = mobileUpgradeButton({ charName: "Hero", utype: "dps", label: "DPS", level: 2, cost: 1500, bonus: "+20%" });

  it("keeps the upgrade action and its data", () => {
    expect(html).toContain('data-action="upgrade"');
    expect(html).toContain('data-char="Hero"');
    expect(html).toContain('data-type="dps"');
    expect(html).toContain('data-cost="1500"');
  });

  it("shows the price and the current level", () => {
    expect(html).toContain("1,500g");
    expect(html).toMatch(/Lv 2/);
    expect(html).toContain("+20%");
  });

  it("still shows the level when there is no bonus yet", () => {
    expect(mobileUpgradeButton({ charName: "Hero", utype: "dps", label: "DPS", level: 0, cost: 50, bonus: "" })).toMatch(/Lv 0/);
  });
});

// #58 / §5.5: Return to Town says plainly what outlives the run.
describe("buildReturnToTownHTML", () => {
  const html = buildReturnToTownHTML({
    renown: 7,
    keep: [{ key: "renown", label: "Renown, and every upgrade bought with it" }, { key: "guild", label: "The Guild Hall and its upgrades" }],
    reset: [{ key: "floor", label: "Floor progress: you start at floor 1" }],
  });

  it("leads with the renown earned", () => {
    expect(html).toMatch(/7 renown/);
  });

  it("lists what you keep and what starts over, under those headings", () => {
    expect(html).toContain("You keep");
    expect(html).toContain("The Guild Hall and its upgrades");
    expect(html).toContain("Starts over");
    expect(html).toContain("Floor progress: you start at floor 1");
  });

  it("keeps the flavour line, after the plain lists", () => {
    expect(html.indexOf("The dungeon shifts")).toBeGreaterThan(html.indexOf("Starts over"));
  });
});

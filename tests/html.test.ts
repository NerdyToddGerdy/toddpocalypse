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

describe("buildDpsTooltipHTML", () => {
  it("shows base and total, hiding zero rows", () => {
    const html = buildDpsTooltipHTML({ total: 15, base: 10, gear: 5, upgDps: 0 });
    expect(html).toContain("DPS Breakdown");
    expect(html).toContain("15.0");
    expect(html).toContain("+5.0");
    expect(html).not.toContain("Upgrades");
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

import { describe, expect, it } from "vitest";
import {
  COST_BY_QUALITY,
  DAMAGE_BY_QUALITY,
  GearItem,
  QUAL,
  SLOTS,
  getItem,
  getWeapon,
  qualityWeights,
  qualityClass,
  gearLevelScale,
  autoSellThreshold,
  gearPower,
  SET_DEFS,
  getSetItem,
  buildSetBonusHTML,
} from "../src/gear.js";

describe("autoSellThreshold", () => {
  it("returns 0 at level 1 (broken only)", () => {
    expect(autoSellThreshold(1)).toBe(0);
    expect(QUAL[0]).toBe("broken");
  });

  it("returns 0 at level 4", () => {
    expect(autoSellThreshold(4)).toBe(0);
  });

  it("returns 1 at level 5 (worn unlocked)", () => {
    expect(autoSellThreshold(5)).toBe(1);
  });

  it("returns 2 at level 10", () => {
    expect(autoSellThreshold(10)).toBe(2);
  });

  it("caps at QUAL.length - 2 — divine (index QUAL.length-1) is never included", () => {
    expect(autoSellThreshold(1000)).toBe(QUAL.length - 2);
    expect(autoSellThreshold(1000)).not.toBe(QUAL.length - 1);
  });

  it("threshold quality at cap is never divine", () => {
    expect(QUAL[autoSellThreshold(1000)]).not.toBe("divine");
  });
});

describe("gearLevelScale", () => {
  it("returns 1.0 at floors 1–4 (no bonus in early game)", () => {
    expect(gearLevelScale(1)).toBe(1.0);
    expect(gearLevelScale(4)).toBe(1.0);
  });

  it("returns 1.25 at floors 5–9", () => {
    expect(gearLevelScale(5)).toBe(1.25);
    expect(gearLevelScale(9)).toBe(1.25);
  });

  it("returns 1.5 at floors 10–14", () => {
    expect(gearLevelScale(10)).toBe(1.5);
  });

  it("returns 1.75 at floors 15–19", () => {
    expect(gearLevelScale(15)).toBe(1.75);
    expect(gearLevelScale(18)).toBe(1.75);
  });

  it("returns 2.0 at floors 20–24", () => {
    expect(gearLevelScale(20)).toBe(2.0);
  });

  it("strictly increases every 5 floors", () => {
    for (let lvl = 5; lvl <= 30; lvl += 5) {
      expect(gearLevelScale(lvl)).toBeGreaterThan(gearLevelScale(lvl - 1));
    }
  });
});

describe("quality tiers", () => {
  it("has at least ten quality tiers", () => {
    expect(QUAL.length).toBeGreaterThanOrEqual(10);
  });

  it("lowest quality is 'broken'", () => {
    expect(QUAL[0]).toBe("broken");
  });

  it("has at least fifteen quality tiers", () => {
    expect(QUAL.length).toBeGreaterThanOrEqual(15);
  });

  it("highest quality is 'divine'", () => {
    expect(QUAL[QUAL.length - 1]).toBe("divine");
  });

  it("divine is at index 14", () => {
    expect(QUAL[14]).toBe("divine");
  });

  it("legendary is still present at index 9", () => {
    expect(QUAL[9]).toBe("legendary");
  });

  it("damage and cost defined for every quality", () => {
    for (const q of QUAL) {
      expect(DAMAGE_BY_QUALITY[q]).toBeTypeOf("number");
      expect(COST_BY_QUALITY[q]).toBeTypeOf("number");
    }
  });

  it("damage strictly increases with quality", () => {
    const damages = QUAL.map((q) => DAMAGE_BY_QUALITY[q]);
    for (let i = 0; i < damages.length - 1; i++) {
      expect(damages[i + 1]).toBeGreaterThan(damages[i]);
    }
  });
});

describe("qualityWeights", () => {
  it("length matches QUAL", () => {
    expect(qualityWeights(1)).toHaveLength(QUAL.length);
    expect(qualityWeights(30)).toHaveLength(QUAL.length);
  });

  it("level 1: broken available, legendary locked", () => {
    expect(qualityWeights(1)[0]).toBeGreaterThan(0);
    expect(qualityWeights(1)[9]).toBe(0);
  });

  it("broken always has non-zero weight at every accessible floor", () => {
    for (const floor of [1, 5, 9, 15, 20, 30, 40, 44]) {
      expect(qualityWeights(floor)[0]).toBeGreaterThan(0);
    }
  });

  it("broken weight strictly decreases as floor increases", () => {
    const w1 = qualityWeights(1)[0];
    const w10 = qualityWeights(10)[0];
    const w30 = qualityWeights(30)[0];
    expect(w10).toBeLessThan(w1);
    expect(w30).toBeLessThan(w10);
  });

  it("worn always has non-zero weight above floor 1", () => {
    for (const floor of [5, 10, 20, 40]) {
      expect(qualityWeights(floor)[1]).toBeGreaterThan(0);
    }
  });

  it("all tiers at or below maxTier have positive weight", () => {
    for (const floor of [1, 10, 24, 44]) {
      const w = qualityWeights(floor);
      const firstZero = w.indexOf(0);
      const positiveCount = firstZero === -1 ? w.length : firstZero;
      for (let i = 0; i < positiveCount; i++) {
        expect(w[i]).toBeGreaterThan(0);
      }
    }
  });

  it("legendary is a tiny dream-drop before level 24 (not fully locked)", () => {
    // floor 23: maxTier=8 (epic), legendary=9 is maxTier+1 → dream weight 1.0
    expect(qualityWeights(23)[9]).toBe(1.0);
  });

  it("legendary full-odds unlock at level 24 gives it much higher weight", () => {
    // floor 24: maxTier=9 (legendary), DROP_WEIGHTS[0]=30 >> dream weight 1.0
    expect(qualityWeights(24)[9]).toBeGreaterThan(qualityWeights(23)[9] * 10);
  });

  it("divine is a tiny dream-drop before level 44 (not fully locked)", () => {
    // floor 43: maxTier=13 (void), divine=14 is maxTier+1 → dream weight 1.0
    expect(qualityWeights(43)[14]).toBe(1.0);
  });

  it("divine full-odds unlock at level 44 gives it much higher weight", () => {
    expect(qualityWeights(44)[14]).toBeGreaterThan(qualityWeights(43)[14] * 10);
  });

  it("dream-drop tier is capped: no weight above divine", () => {
    // divine is the last tier; nothing above it should get non-zero weight
    const w = qualityWeights(44);
    expect(w).toHaveLength(QUAL.length);
    // All weights at or below divine should be accounted for; array shouldn't grow
    expect(w.every((v, i) => i < QUAL.length)).toBe(true);
  });

  it("two-tiers-above gets the smaller dream weight", () => {
    // floor 1: maxTier=3 (poor), fine=5 is maxTier+2 → dream weight 0.5
    expect(qualityWeights(1)[5]).toBe(0.5);
  });

  it("three+ tiers above max still get weight 0", () => {
    // floor 1: maxTier=3, superior=6 is maxTier+3 → should be 0
    expect(qualityWeights(1)[6]).toBe(0);
  });
});

describe("GearItem", () => {
  it("damage matches quality table at level 1 (no scaling)", () => {
    for (const [quality, expected] of Object.entries(DAMAGE_BY_QUALITY)) {
      const item = new GearItem("main_hand", "sword", quality, "valor", 1);
      expect(item.damage).toBe(expected);
    }
  });

  it("cost matches quality table at level 1 (no scaling)", () => {
    for (const [quality, expected] of Object.entries(COST_BY_QUALITY)) {
      const item = new GearItem("main_hand", "sword", quality, "valor", 1);
      expect(item.cost).toBe(expected);
    }
  });

  it("damage is scaled at dungeonLevel 10", () => {
    const base = DAMAGE_BY_QUALITY["common"];
    const scaled = new GearItem("main_hand", "sword", "common", "valor", 10);
    expect(scaled.damage).toBe(Math.ceil(base * gearLevelScale(10)));
    expect(scaled.damage).toBeGreaterThan(base);
  });

  it("damage at level 18 is 1.75× base", () => {
    const base = DAMAGE_BY_QUALITY["rare"];
    const item = new GearItem("main_hand", "sword", "rare", "valor", 18);
    expect(item.damage).toBe(Math.ceil(base * 1.75));
  });

  it("sell value is a third of cost (min 1)", () => {
    const item = new GearItem("chest", "plate", "common", "cunning");
    expect(item.sellValue).toBe(Math.max(1, Math.floor(item.cost / 3)));
  });

  it("sell value at least 1 even for cheapest", () => {
    const item = new GearItem("ring1", "ring", "broken", "shyness");
    expect(item.sellValue).toBeGreaterThanOrEqual(1);
  });

  it("getName format: '{quality} {item_type} of {adjective}'", () => {
    const item = new GearItem("helmet", "helm", "legendary", "hilarity");
    expect(item.getName()).toBe("legendary helm of hilarity");
  });

  it("toDict has the expected keys including dungeon_level and stats", () => {
    const item = new GearItem("legs", "greaves", "fine", "gentleness");
    expect(new Set(Object.keys(item.toDict()))).toEqual(
      new Set(["slot", "slot_display", "name", "short_name", "quality", "item_type", "adjective", "stats", "damage", "cost", "sell_value", "dungeon_level"]),
    );
  });

  it("toDict values match the item", () => {
    const item = new GearItem("shoes", "boots", "common", "valor", 15);
    const d = item.toDict();
    expect(d.slot).toBe("shoes");
    expect(d.damage).toBe(item.damage);
    expect(d.sell_value).toBe(item.sellValue);
    expect(d.dungeon_level).toBe(15);
  });

  it("fromDict round-trips preserving scaled damage", () => {
    const original = new GearItem("main_hand", "sword", "epic", "valor", 18);
    const restored = GearItem.fromDict(original.toDict());
    expect(restored.damage).toBe(original.damage);
    expect(restored.cost).toBe(original.cost);
    expect(restored.slot).toBe(original.slot);
  });
});

describe("getItem", () => {
  it("returns a GearItem", () => {
    expect(getItem()).toBeInstanceOf(GearItem);
  });

  it("slot is always valid", () => {
    for (let i = 0; i < 20; i++) {
      expect(SLOTS).toContain(getItem().slot);
    }
  });

  it("respects an explicit slot (ring2 redirects to ring1)", () => {
    for (const slot of SLOTS) {
      const expected = slot === "ring2" ? "ring1" : slot;
      expect(getItem(slot).slot).toBe(expected);
    }
  });

  it("getWeapon returns main_hand", () => {
    for (let i = 0; i < 10; i++) {
      expect(getWeapon().slot).toBe("main_hand");
    }
  });

  it("random drops never produce ring2 items — rings always drop as ring1", () => {
    for (let i = 0; i < 100; i++) {
      expect(getItem().slot).not.toBe("ring2");
    }
  });

  it("accepts a dungeon_level argument", () => {
    const item = getItem(undefined, 10);
    expect(item).toBeInstanceOf(GearItem);
    expect(QUAL).toContain(item.quality);
  });

  it("items dropped at higher levels have higher damage than level-1 items of same quality", () => {
    const base = new GearItem("main_hand", "sword", "common", "valor", 1);
    const scaled = new GearItem("main_hand", "sword", "common", "valor", 10);
    expect(scaled.damage).toBeGreaterThan(base.damage);
  });
});

describe("qualityClass", () => {
  it("returns a non-empty string for every quality", () => {
    for (const q of QUAL) {
      expect(qualityClass(q).length).toBeGreaterThan(0);
    }
  });

  it("legendary gets its class", () => {
    expect(qualityClass("legendary")).toBe("q-legendary");
  });

  it("divine gets the highest-tier class", () => {
    expect(qualityClass("divine")).toBe("q-divine");
  });

  it("each quality including new tiers maps to a distinct CSS class", () => {
    const classes = QUAL.map(qualityClass);
    expect(new Set(classes).size).toBe(QUAL.length);
  });

  it("common gets the common class", () => {
    expect(qualityClass("common")).toBe("q-common");
  });

  it("toDict includes quality field", () => {
    const item = new GearItem("helmet", "helm", "rare", "valor");
    expect(item.toDict()).toHaveProperty("quality", "rare");
  });
});

describe("multi-stat rolling", () => {
  it("getItem produces an item with at least one stat", () => {
    for (let i = 0; i < 20; i++) {
      const item = getItem();
      expect(Object.keys(item.stats).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("sub-common qualities (broken/worn/crude/poor) always roll exactly 1 stat", () => {
    const subCommon = new Set(["broken", "worn", "crude", "poor"]);
    let violations = 0;
    for (let i = 0; i < 400; i++) {
      const item = getItem("main_hand", 1);
      if (subCommon.has(item.quality) && Object.keys(item.stats).length > 1) {
        violations++;
      }
    }
    expect(violations).toBe(0);
  });

  it("mythic+ quality rolls exactly 3 stats", () => {
    const item = new GearItem("main_hand", "sword", "mythic", "valor", { dps: 10, critChance: 0.05, haste: 0.03 }, 1);
    expect(Object.keys(item.stats)).toHaveLength(3);
  });

  it("stat values are positive numbers", () => {
    for (let i = 0; i < 30; i++) {
      const item = getItem();
      for (const v of Object.values(item.stats)) {
        expect(v).toBeGreaterThan(0);
      }
    }
  });

  it("dps stat scales with dungeon level for numeric stats", () => {
    const low  = new GearItem("main_hand", "sword", "common", "valor", { dps: 11 }, 1);
    const high = new GearItem("main_hand", "sword", "common", "valor", { dps: Math.ceil(11 * 1.5) }, 10);
    expect(high.stats.dps!).toBeGreaterThan(low.stats.dps!);
  });
});

describe("backward compatibility — fromDict with legacy damage field", () => {
  it("fromDict migrates damage → stats.dps when no stats field present", () => {
    const legacy = {
      slot: "main_hand" as const,
      slot_display: "Main Hand",
      name: "common sword of valor",
      quality: "common",
      item_type: "sword",
      adjective: "valor",
      damage: 11,
      cost: 60,
      sell_value: 20,
      dungeon_level: 1,
    };
    const item = GearItem.fromDict(legacy as any);
    expect(item.stats.dps).toBe(11);
  });

  it("fromDict round-trips a new multi-stat item", () => {
    const original = getItem("main_hand", 10);
    const restored = GearItem.fromDict(original.toDict());
    expect(restored.stats).toEqual(original.stats);
    expect(restored.slot).toBe(original.slot);
    expect(restored.quality).toBe(original.quality);
  });
});

describe("gearPower", () => {
  it("pure DPS item has power equal to its dps value", () => {
    expect(gearPower({ dps: 25 })).toBe(25);
  });

  it("empty stats has power 0", () => {
    expect(gearPower({})).toBe(0);
  });

  it("higher quality main_hand has higher power", () => {
    const low  = new GearItem("main_hand", "sword", "common",    "valor", 1);
    const high = new GearItem("main_hand", "sword", "legendary", "valor", 1);
    expect(gearPower(high.stats)).toBeGreaterThan(gearPower(low.stats));
  });

  it("combines multiple stats into a single score", () => {
    const p = gearPower({ dps: 10, critChance: 0.05 });
    expect(p).toBeCloseTo(10 + 0.05 * 150);
  });
});

describe("SET_DEFS", () => {
  it("exports exactly 4 gear sets", () => {
    expect(SET_DEFS).toHaveLength(4);
  });

  it("every set has id, name, slots, bonus2pc, bonus3pc", () => {
    for (const s of SET_DEFS) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
      expect(Array.isArray(s.slots)).toBe(true);
      expect(s.slots).toHaveLength(3);
      expect(s).toHaveProperty("bonus2pc");
      expect(s).toHaveProperty("bonus3pc");
    }
  });

  it("Shadowbane slots are helmet, gloves, shoes", () => {
    const s = SET_DEFS.find(d => d.id === "shadowbane")!;
    expect(s).toBeDefined();
    expect(s.slots).toEqual(expect.arrayContaining(["helmet", "gloves", "shoes"]));
  });

  it("Iron Bulwark slots are chest, legs, off_hand", () => {
    const s = SET_DEFS.find(d => d.id === "iron_bulwark")!;
    expect(s).toBeDefined();
    expect(s.slots).toEqual(expect.arrayContaining(["chest", "legs", "off_hand"]));
  });

  it("Plunderer's Kit slots are main_hand, ring1, ring2", () => {
    const s = SET_DEFS.find(d => d.id === "plunderers_kit")!;
    expect(s).toBeDefined();
    expect(s.slots).toEqual(expect.arrayContaining(["main_hand", "ring1", "ring2"]));
  });

  it("Warlord's Grasp slots are main_hand, chest, helmet", () => {
    const s = SET_DEFS.find(d => d.id === "warlords_grasp")!;
    expect(s).toBeDefined();
    expect(s.slots).toEqual(expect.arrayContaining(["main_hand", "chest", "helmet"]));
  });

  it("Shadowbane 2pc bonus is critChance", () => {
    const s = SET_DEFS.find(d => d.id === "shadowbane")!;
    expect(s.bonus2pc.critChance).toBeGreaterThan(0);
  });

  it("Iron Bulwark 2pc bonus is maxHp", () => {
    const s = SET_DEFS.find(d => d.id === "iron_bulwark")!;
    expect(s.bonus2pc.maxHp).toBeGreaterThan(0);
  });

  it("Plunderer's Kit 2pc bonus is goldBonus", () => {
    const s = SET_DEFS.find(d => d.id === "plunderers_kit")!;
    expect(s.bonus2pc.goldBonus).toBeGreaterThan(0);
  });

  it("Warlord's Grasp 2pc bonus is haste", () => {
    const s = SET_DEFS.find(d => d.id === "warlords_grasp")!;
    expect(s.bonus2pc.haste).toBeGreaterThan(0);
  });

  it("all set ids are unique", () => {
    const ids = SET_DEFS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all slot lists reference valid SLOTS entries", () => {
    const validSlots = new Set(SLOTS);
    for (const s of SET_DEFS) {
      for (const slot of s.slots) {
        expect(validSlots.has(slot as any)).toBe(true);
      }
    }
  });
});

describe("GearItem set fields", () => {
  it("setName is undefined by default", () => {
    const item = getItem("main_hand", 5);
    expect(item.setName).toBeUndefined();
  });

  it("getName returns normal format when no setName", () => {
    const item = new GearItem("helmet", "helm", "rare", "valor", {}, 1);
    expect(item.getName()).toBe("rare helm of valor");
  });

  it("getName returns set format when setName is set", () => {
    const item = new GearItem("helmet", "helm", "rare", "valor", {}, 1, "Shadowbane");
    expect(item.getName()).toContain("Shadowbane");
    expect(item.getName()).toContain("helm");
  });

  it("toDict includes set_name when setName is set", () => {
    const item = new GearItem("helmet", "helm", "rare", "valor", {}, 1, "Shadowbane");
    expect(item.toDict().set_name).toBe("Shadowbane");
  });

  it("toDict omits set_name when setName is undefined", () => {
    const item = new GearItem("helmet", "helm", "rare", "valor", {}, 1);
    expect(item.toDict().set_name).toBeUndefined();
  });

  it("fromDict round-trips set_name", () => {
    const item = new GearItem("gloves", "gauntlets", "epic", "valor", {}, 5, "Shadowbane");
    const restored = GearItem.fromDict(item.toDict());
    expect(restored.setName).toBe("Shadowbane");
  });

  it("fromDict with no set_name produces undefined setName", () => {
    const item = getItem("shoes", 3);
    const restored = GearItem.fromDict(item.toDict());
    expect(restored.setName).toBeUndefined();
  });
});

describe("getSetItem", () => {
  it("returns a GearItem", () => {
    expect(getSetItem("shadowbane", "helmet", 5)).toBeInstanceOf(GearItem);
  });

  it("returns item in requested slot", () => {
    const item = getSetItem("shadowbane", "helmet", 5);
    expect(item.slot).toBe("helmet");
  });

  it("sets setName to the set's name", () => {
    const def = SET_DEFS.find(d => d.id === "shadowbane")!;
    const item = getSetItem("shadowbane", "helmet", 5);
    expect(item.setName).toBe(def.name);
  });

  it("quality is at least rare", () => {
    for (let i = 0; i < 20; i++) {
      const item = getSetItem("iron_bulwark", "chest", 1);
      const qIdx = QUAL.indexOf(item.quality as typeof QUAL[number]);
      expect(qIdx).toBeGreaterThanOrEqual(QUAL.indexOf("rare"));
    }
  });

  it("scales with dungeon level", () => {
    const low  = getSetItem("plunderers_kit", "main_hand", 1);
    const high = getSetItem("plunderers_kit", "main_hand", 20);
    expect(high.dungeonLevel).toBe(20);
    expect(low.dungeonLevel).toBe(1);
  });

  it("ring2 slot falls back to ring1 slot item", () => {
    const item = getSetItem("plunderers_kit", "ring2", 5);
    expect(item.slot).toBe("ring1");
  });
});

describe("buildSetBonusHTML", () => {
  it("returns empty string for unknown set name", () => {
    expect(buildSetBonusHTML("Unknown Set", 0)).toBe("");
  });

  it("shows piece count capped at 3", () => {
    expect(buildSetBonusHTML("Shadowbane", 1)).toContain("1 / 3");
    expect(buildSetBonusHTML("Shadowbane", 5)).toContain("3 / 3");
  });

  it("2pc bonus is inactive below threshold", () => {
    const html = buildSetBonusHTML("Shadowbane", 1);
    expect(html).toMatch(/tt-set-bonus inactive.*2pc/s);
  });

  it("2pc bonus is active at threshold", () => {
    const html = buildSetBonusHTML("Shadowbane", 2);
    expect(html).toMatch(/tt-set-bonus active.*2pc/s);
  });

  it("3pc bonus becomes active at 3 pieces", () => {
    const html = buildSetBonusHTML("Shadowbane", 3);
    const activeMatches = [...html.matchAll(/tt-set-bonus active/g)];
    expect(activeMatches.length).toBe(2);
  });

  it("shows stat label and value for 2pc bonus", () => {
    const html = buildSetBonusHTML("Shadowbane", 2);
    expect(html).toContain("Crit Chance");
    expect(html).toContain("+15%");
  });

  it("shows effect3pc label for Plunderer's Kit", () => {
    expect(buildSetBonusHTML("Plunderer's Kit", 3)).toContain("Elite Rune");
  });

  it("shows effect3pc label for Warlord's Grasp", () => {
    expect(buildSetBonusHTML("Warlord's Grasp", 3)).toContain("cooldown");
  });

  it("shows set name in header", () => {
    expect(buildSetBonusHTML("Iron Bulwark", 0)).toContain("Iron Bulwark");
  });
});

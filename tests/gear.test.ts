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

  it("caps at QUAL.length - 2 — legendary (index QUAL.length-1) is never included", () => {
    expect(autoSellThreshold(1000)).toBe(QUAL.length - 2);
    expect(autoSellThreshold(1000)).not.toBe(QUAL.length - 1);
  });

  it("threshold quality at cap is never legendary", () => {
    expect(QUAL[autoSellThreshold(1000)]).not.toBe("legendary");
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

  it("highest quality is 'legendary'", () => {
    expect(QUAL[QUAL.length - 1]).toBe("legendary");
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

  it("level 6 locks out broken", () => {
    const w = qualityWeights(6);
    expect(w[0]).toBe(0);
    expect(w[1]).toBeGreaterThan(0);
  });

  it("level 11 locks out worn", () => {
    const w = qualityWeights(11);
    expect(w[1]).toBe(0);
    expect(w[2]).toBeGreaterThan(0);
  });

  it("legendary locked before level 30", () => {
    expect(qualityWeights(29)[9]).toBe(0);
  });

  it("legendary unlocks at level 30", () => {
    expect(qualityWeights(30)[9]).toBeGreaterThan(0);
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

  it("toDict has the expected keys including dungeon_level", () => {
    const item = new GearItem("legs", "greaves", "fine", "gentleness");
    expect(new Set(Object.keys(item.toDict()))).toEqual(
      new Set(["slot", "slot_display", "name", "quality", "item_type", "adjective", "damage", "cost", "sell_value", "dungeon_level"]),
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

  it("each quality maps to a distinct CSS class", () => {
    const classes = QUAL.map(qualityClass);
    expect(new Set(classes).size).toBe(QUAL.length);
  });

  it("legendary gets the highest-tier class", () => {
    expect(qualityClass("legendary")).toBe("q-legendary");
  });

  it("common gets the common class", () => {
    expect(qualityClass("common")).toBe("q-common");
  });

  it("toDict includes quality field", () => {
    const item = new GearItem("helmet", "helm", "rare", "valor");
    expect(item.toDict()).toHaveProperty("quality", "rare");
  });
});

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
} from "../src/gear.js";

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
  it("damage matches quality table", () => {
    for (const [quality, expected] of Object.entries(DAMAGE_BY_QUALITY)) {
      const item = new GearItem("main_hand", "sword", quality, "valor");
      expect(item.damage).toBe(expected);
    }
  });

  it("cost matches quality table", () => {
    for (const [quality, expected] of Object.entries(COST_BY_QUALITY)) {
      const item = new GearItem("main_hand", "sword", quality, "valor");
      expect(item.cost).toBe(expected);
    }
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

  it("toDict has the expected keys", () => {
    const item = new GearItem("legs", "greaves", "fine", "gentleness");
    expect(new Set(Object.keys(item.toDict()))).toEqual(
      new Set(["slot", "slot_display", "name", "quality", "item_type", "adjective", "damage", "cost", "sell_value"]),
    );
  });

  it("toDict values match the item", () => {
    const item = new GearItem("shoes", "boots", "common", "valor");
    const d = item.toDict();
    expect(d.slot).toBe("shoes");
    expect(d.damage).toBe(item.damage);
    expect(d.sell_value).toBe(item.sellValue);
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

  it("respects an explicit slot", () => {
    for (const slot of SLOTS) {
      expect(getItem(slot).slot).toBe(slot);
    }
  });

  it("getWeapon returns main_hand", () => {
    for (let i = 0; i < 10; i++) {
      expect(getWeapon().slot).toBe("main_hand");
    }
  });

  it("accepts a dungeon_level argument", () => {
    const item = getItem(undefined, 10);
    expect(item).toBeInstanceOf(GearItem);
    expect(QUAL).toContain(item.quality);
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

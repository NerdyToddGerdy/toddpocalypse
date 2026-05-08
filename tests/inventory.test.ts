import { describe, expect, it } from "vitest";
import { Inventory } from "../src/inventory.js";
import { GearItem, SLOTS, type Slot } from "../src/gear.js";

function makeItem(slot: Slot = "main_hand", quality = "common"): GearItem {
  return new GearItem(slot, "sword", quality, "valor");
}

describe("Inventory", () => {
  it("all slots start empty", () => {
    const inv = new Inventory();
    for (const slot of SLOTS) {
      expect(inv.slots[slot]).toBeNull();
    }
  });

  it("all nine slots present", () => {
    const inv = new Inventory();
    expect(new Set(Object.keys(inv.slots))).toEqual(new Set(SLOTS));
  });

  it("equip places item in its slot", () => {
    const inv = new Inventory();
    const item = makeItem("helmet");
    inv.equip(item);
    expect(inv.slots.helmet).toBe(item);
  });

  it("equip returns null when slot was empty", () => {
    const inv = new Inventory();
    expect(inv.equip(makeItem("chest"))).toBeNull();
  });

  it("equip returns the displaced item", () => {
    const inv = new Inventory();
    const first = makeItem("gloves", "broken");
    const second = makeItem("gloves", "legendary");
    inv.equip(first);
    const old = inv.equip(second);
    expect(old).toBe(first);
    expect(inv.slots.gloves).toBe(second);
  });

  it("equippedItems excludes empty slots", () => {
    const inv = new Inventory();
    inv.equip(makeItem("ring1"));
    inv.equip(makeItem("ring1")); // second ring spills to ring2
    expect(inv.equippedItems()).toHaveLength(2);
  });

  it("first ring equips to ring1", () => {
    const inv = new Inventory();
    const ring = makeItem("ring1");
    inv.equip(ring);
    expect(inv.slots.ring1).toBe(ring);
    expect(inv.slots.ring2).toBeNull();
  });

  it("second ring spills to ring2 when ring1 is occupied", () => {
    const inv = new Inventory();
    const first = makeItem("ring1", "broken");
    const second = makeItem("ring1", "common");
    inv.equip(first);
    const displaced = inv.equip(second);
    expect(inv.slots.ring1).toBe(first);   // ring1 untouched
    expect(inv.slots.ring2).toBe(second);  // second ring landed in ring2
    expect(displaced).toBeNull();           // nothing displaced
  });

  it("third ring replaces the weaker ring (ring1 weaker)", () => {
    const inv = new Inventory();
    const first  = makeItem("ring1", "broken");    // damage 1  → ring1
    const second = makeItem("ring1", "common");    // damage 11 → ring2
    const third  = makeItem("ring1", "legendary"); // new
    inv.equip(first);
    inv.equip(second);
    const displaced = inv.equip(third);
    expect(inv.slots.ring1).toBe(third);   // ring1 replaced (was weaker)
    expect(inv.slots.ring2).toBe(second);  // ring2 untouched
    expect(displaced).toBe(first);
  });

  it("third ring replaces the weaker ring (ring2 weaker)", () => {
    const inv = new Inventory();
    const first  = makeItem("ring1", "legendary"); // damage 75 → ring1
    const second = makeItem("ring1", "broken");    // damage 1  → ring2
    const third  = makeItem("ring1", "epic");      // new
    inv.equip(first);
    inv.equip(second);
    const displaced = inv.equip(third);
    expect(inv.slots.ring2).toBe(third);   // ring2 replaced (was weaker)
    expect(inv.slots.ring1).toBe(first);   // ring1 untouched
    expect(displaced).toBe(second);
  });

  it("equippedItems is empty when nothing equipped", () => {
    expect(new Inventory().equippedItems()).toEqual([]);
  });

  it("toDict has all slots as keys", () => {
    expect(new Set(Object.keys(new Inventory().toDict()))).toEqual(new Set(SLOTS));
  });

  it("toDict filled slot serializes to item dict", () => {
    const inv = new Inventory();
    const item = makeItem("off_hand");
    inv.equip(item);
    const d = inv.toDict();
    expect(d.off_hand).not.toBeNull();
    expect(d.off_hand?.name).toBe(item.getName());
  });

  it("toDict empty slot serializes to null", () => {
    expect(new Inventory().toDict().main_hand).toBeNull();
  });
});

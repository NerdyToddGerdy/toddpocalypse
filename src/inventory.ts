import { GearItem, SLOTS, type GearItemDict, type Slot } from "./gear.js";

export type InventoryDict = Record<Slot, GearItemDict | null>;

export class Inventory {
  slots: Record<Slot, GearItem | null>;

  constructor() {
    this.slots = Object.fromEntries(SLOTS.map((s) => [s, null])) as Record<
      Slot,
      GearItem | null
    >;
  }

  equip(item: GearItem): GearItem | null {
    if (item.slot !== "ring1") {
      const old = this.slots[item.slot];
      this.slots[item.slot] = item;
      return old;
    }
    // Ring logic: fill empty slot first, then replace the weaker ring
    if (this.slots.ring1 === null) { this.slots.ring1 = item; return null; }
    if (this.slots.ring2 === null) { this.slots.ring2 = item; return null; }
    const replaceRing2 = this.slots.ring2.damage <= this.slots.ring1.damage;
    if (replaceRing2) {
      const old = this.slots.ring2; this.slots.ring2 = item; return old;
    } else {
      const old = this.slots.ring1; this.slots.ring1 = item; return old;
    }
  }

  equippedItems(): GearItem[] {
    return Object.values(this.slots).filter((i): i is GearItem => i !== null);
  }

  toDict(): InventoryDict {
    return Object.fromEntries(
      SLOTS.map((slot) => [slot, this.slots[slot] ? this.slots[slot]!.toDict() : null]),
    ) as InventoryDict;
  }
}

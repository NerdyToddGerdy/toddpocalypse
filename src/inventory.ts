import { GearItem, SLOTS, gearPower, type GearItemDict, type Slot } from "./gear.js";

/** Serialized, plain-object form of an {@link Inventory}. */
export type InventoryDict = Record<Slot, GearItemDict | null>;

/** Slot-keyed map of equipped gear for a single character. */
export class Inventory {
  /** Current item in each equipment slot, or null if empty. */
  slots: Record<Slot, GearItem | null>;

  constructor() {
    this.slots = Object.fromEntries(SLOTS.map((s) => [s, null])) as Record<
      Slot,
      GearItem | null
    >;
  }

  /**
   * Equips an item and returns the displaced item, or null if the slot was empty.
   * Rings fill the first empty ring slot; if both are occupied the weaker ring is replaced.
   */
  equip(item: GearItem): GearItem | null {
    if (item.slot !== "ring1") {
      const old = this.slots[item.slot];
      this.slots[item.slot] = item;
      return old;
    }
    // Ring logic: fill empty slot first, then replace the weaker ring
    if (this.slots.ring1 === null) { this.slots.ring1 = item; return null; }
    if (this.slots.ring2 === null) { this.slots.ring2 = item; return null; }
    const replaceRing2 = gearPower(this.slots.ring2.stats) <= gearPower(this.slots.ring1.stats);
    if (replaceRing2) {
      const old = this.slots.ring2; this.slots.ring2 = item; return old;
    } else {
      const old = this.slots.ring1; this.slots.ring1 = item; return old;
    }
  }

  /** Removes and returns the item in the given slot, or null if the slot was empty. */
  remove(slot: Slot): GearItem | null {
    const item = this.slots[slot];
    this.slots[slot] = null;
    return item;
  }

  /** Returns all non-null equipped items across all slots. */
  equippedItems(): GearItem[] {
    return Object.values(this.slots).filter((i): i is GearItem => i !== null);
  }

  /** Serializes to a plain object safe for JSON. */
  toDict(): InventoryDict {
    return Object.fromEntries(
      SLOTS.map((slot) => [slot, this.slots[slot] ? this.slots[slot]!.toDict() : null]),
    ) as InventoryDict;
  }
}
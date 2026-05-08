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
    let targetSlot = item.slot;
    if (item.slot === "ring1" && this.slots.ring1 !== null && this.slots.ring2 === null) {
      targetSlot = "ring2";
    }
    const old = this.slots[targetSlot];
    this.slots[targetSlot] = item;
    return old;
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

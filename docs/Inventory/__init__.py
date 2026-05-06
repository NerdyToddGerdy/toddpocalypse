from Gear import GearItem, SLOTS, SLOT_DISPLAY


class Inventory:
    slots: dict  # slot -> GearItem | None

    def __init__(self):
        self.slots = {slot: None for slot in SLOTS}

    def equip(self, item: GearItem) -> "GearItem | None":
        old = self.slots[item.slot]
        self.slots[item.slot] = item
        return old

    def equipped_items(self) -> list:
        return [item for item in self.slots.values() if item is not None]

    def to_dict(self) -> dict:
        return {
            slot: (item.to_dict() if item else None)
            for slot, item in self.slots.items()
        }

    # kept for legacy callers
    def add_weapon(self, weapon: GearItem):
        self.equip(weapon)

    def view_weapons(self):
        for item in self.equipped_items():
            print(item.get_name())

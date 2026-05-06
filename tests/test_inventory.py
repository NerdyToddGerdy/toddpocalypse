import pytest
from Inventory import Inventory
from Gear import GearItem, SLOTS


def make_item(slot="main_hand", quality="common"):
    return GearItem(slot, "sword", quality, "valor")


class TestInventory:
    def test_all_slots_start_empty(self):
        inv = Inventory()
        assert all(v is None for v in inv.slots.values())

    def test_all_nine_slots_present(self):
        inv = Inventory()
        assert set(inv.slots.keys()) == set(SLOTS)

    def test_equip_places_item_in_slot(self):
        inv = Inventory()
        item = make_item("helmet")
        inv.equip(item)
        assert inv.slots["helmet"] is item

    def test_equip_returns_none_for_empty_slot(self):
        inv = Inventory()
        old = inv.equip(make_item("chest"))
        assert old is None

    def test_equip_returns_displaced_item(self):
        inv = Inventory()
        first = make_item("gloves", "broken")
        second = make_item("gloves", "legendary")
        inv.equip(first)
        old = inv.equip(second)
        assert old is first
        assert inv.slots["gloves"] is second

    def test_equipped_items_excludes_empty_slots(self):
        inv = Inventory()
        inv.equip(make_item("ring1"))
        inv.equip(make_item("ring2"))
        items = inv.equipped_items()
        assert len(items) == 2

    def test_equipped_items_empty_when_nothing_equipped(self):
        inv = Inventory()
        assert inv.equipped_items() == []

    def test_to_dict_has_all_slots(self):
        inv = Inventory()
        d = inv.to_dict()
        assert set(d.keys()) == set(SLOTS)

    def test_to_dict_filled_slot_has_item_dict(self):
        inv = Inventory()
        item = make_item("off_hand")
        inv.equip(item)
        d = inv.to_dict()
        assert d["off_hand"] is not None
        assert d["off_hand"]["name"] == item.get_name()

    def test_to_dict_empty_slot_is_none(self):
        inv = Inventory()
        d = inv.to_dict()
        assert d["main_hand"] is None

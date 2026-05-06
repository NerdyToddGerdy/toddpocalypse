import pytest
from Character import Character, switch
from Gear import GearItem


def make_char(cls="fighter"):
    return Character("Hero", cls, level=1)

def make_item(slot="main_hand", quality="common"):
    return GearItem(slot, "sword", quality, "valor")


class TestSwitch:
    def test_fighter(self):
        assert switch(1) == "fighter"

    def test_rogue(self):
        assert switch(2) == "rogue"

    def test_mage(self):
        assert switch(3) == "mage"

    def test_invalid_returns_none(self):
        assert switch(99) is None


class TestCharacterInit:
    def test_base_dps_fighter(self):
        assert make_char("fighter").dps == 2.0

    def test_base_dps_rogue(self):
        assert make_char("rogue").dps == 1.5

    def test_base_dps_mage(self):
        assert make_char("mage").dps == 1.0

    def test_starts_at_level_1(self):
        assert make_char().level == 1

    def test_starts_with_zero_xp(self):
        assert make_char().xp == 0

    def test_xp_multiplier_starts_at_one(self):
        assert make_char().xp_multiplier == 1.0

    def test_click_bonus_starts_at_zero(self):
        assert make_char().click_bonus == 0.0


class TestEquipItem:
    def test_equip_adds_damage_to_dps(self):
        c = make_char()
        base = c.dps
        item = make_item(quality="common")  # damage=11
        c.equip_item(item)
        assert c.dps == pytest.approx(base + 11)

    def test_equip_replaces_removes_old_damage(self):
        c = make_char()
        weak = make_item("main_hand", "broken")    # damage=1
        strong = make_item("main_hand", "poor")    # damage=7
        c.equip_item(weak)
        dps_after_weak = c.dps
        c.equip_item(strong)
        assert c.dps == pytest.approx(dps_after_weak - 1 + 7)

    def test_equip_different_slots_stack(self):
        c = make_char()
        base = c.dps
        c.equip_item(GearItem("main_hand", "sword",   "common", "x"))   # +11
        c.equip_item(GearItem("off_hand",  "dagger",  "common", "x"))   # +11
        assert c.dps == pytest.approx(base + 22)


class TestXpAndLeveling:
    def test_gain_xp_accumulates(self):
        c = make_char()
        c.gain_xp(5)
        assert c.xp == 5

    def test_gain_xp_triggers_level_up(self):
        c = make_char()
        c.gain_xp(10)
        assert c.level == 2

    def test_level_up_scales_dps(self):
        c = make_char("fighter")
        base = c.dps
        c.gain_xp(10)
        assert c.dps == pytest.approx(base * 1.2)

    def test_xp_resets_after_level_up(self):
        c = make_char()
        c.gain_xp(10)
        assert c.xp == 0

    def test_xp_multiplier_increases_gain(self):
        c = make_char()
        c.xp_multiplier = 2.0
        c.gain_xp(3)
        assert c.xp == 6

    def test_multiple_level_ups(self):
        c = make_char()
        c.gain_xp(100)
        assert c.level > 2


class TestToDict:
    def test_contains_required_keys(self):
        d = make_char().to_dict()
        for key in ("name", "character_class", "level", "dps", "xp", "xp_to_next",
                    "click_bonus", "equipment"):
            assert key in d

    def test_equipment_has_all_slots(self):
        from Gear import SLOTS
        d = make_char().to_dict()
        assert set(d["equipment"].keys()) == set(SLOTS)

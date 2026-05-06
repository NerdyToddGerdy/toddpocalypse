import pytest
from Gear import GearItem, get_item, get_weapon, SLOTS, QUAL, DAMAGE_BY_QUALITY, COST_BY_QUALITY, quality_weights


class TestQualityTiers:
    def test_ten_quality_tiers(self):
        assert len(QUAL) >= 10

    def test_lowest_quality_name(self):
        assert QUAL[0] == "broken"

    def test_highest_quality_name(self):
        assert QUAL[-1] == "legendary"

    def test_all_qualities_have_damage(self):
        for q in QUAL:
            assert q in DAMAGE_BY_QUALITY

    def test_all_qualities_have_cost(self):
        for q in QUAL:
            assert q in COST_BY_QUALITY

    def test_damage_strictly_increases(self):
        damages = [DAMAGE_BY_QUALITY[q] for q in QUAL]
        assert all(damages[i] < damages[i + 1] for i in range(len(damages) - 1))


class TestQualityWeights:
    def test_weights_length_matches_qual(self):
        assert len(quality_weights(1)) == len(QUAL)
        assert len(quality_weights(30)) == len(QUAL)

    def test_level1_broken_available(self):
        assert quality_weights(1)[0] > 0

    def test_level1_legendary_locked(self):
        assert quality_weights(1)[9] == 0

    def test_level6_locks_out_broken(self):
        w = quality_weights(6)
        assert w[0] == 0
        assert w[1] > 0

    def test_level11_locks_out_worn(self):
        w = quality_weights(11)
        assert w[1] == 0
        assert w[2] > 0

    def test_legendary_locked_before_level_30(self):
        assert quality_weights(29)[9] == 0

    def test_legendary_available_at_level_30(self):
        assert quality_weights(30)[9] > 0

    def test_get_item_accepts_dungeon_level(self):
        item = get_item(dungeon_level=10)
        assert isinstance(item, GearItem)
        assert item.quality in QUAL


class TestGearItem:
    def test_damage_matches_quality(self):
        for quality, expected in DAMAGE_BY_QUALITY.items():
            item = GearItem("main_hand", "sword", quality, "valor")
            assert item.damage == expected

    def test_cost_matches_quality(self):
        for quality, expected in COST_BY_QUALITY.items():
            item = GearItem("main_hand", "sword", quality, "valor")
            assert item.cost == expected

    def test_sell_value_is_fraction_of_cost(self):
        item = GearItem("chest", "plate", "common", "cunning")
        assert item.sell_value == max(1, item.cost // 3)

    def test_sell_value_at_least_one(self):
        item = GearItem("ring1", "ring", "broken", "shyness")
        assert item.sell_value >= 1

    def test_get_name_format(self):
        item = GearItem("helmet", "helm", "legendary", "hilarity")
        assert item.get_name() == "legendary helm of hilarity"

    def test_to_dict_keys(self):
        item = GearItem("legs", "greaves", "fine", "gentleness")
        d = item.to_dict()
        assert set(d.keys()) == {"slot", "slot_display", "name", "damage", "cost", "sell_value"}

    def test_to_dict_values_match(self):
        item = GearItem("shoes", "boots", "common", "valor")
        d = item.to_dict()
        assert d["slot"] == "shoes"
        assert d["damage"] == item.damage
        assert d["sell_value"] == item.sell_value


class TestGetItem:
    def test_returns_gear_item(self):
        assert isinstance(get_item(), GearItem)

    def test_slot_is_valid(self):
        for _ in range(20):
            item = get_item()
            assert item.slot in SLOTS

    def test_specific_slot_respected(self):
        for slot in SLOTS:
            item = get_item(slot)
            assert item.slot == slot

    def test_get_weapon_returns_main_hand(self):
        for _ in range(10):
            w = get_weapon()
            assert w.slot == "main_hand"

import json
import pytest
from game.engine import GameState, LOOT_MAX, DROP_CHANCE, UPGRADE_BASES, UPGRADE_EFFECTS


@pytest.fixture
def gs():
    return GameState()


@pytest.fixture
def gs_with_loot(gs):
    """GameState with guaranteed loot by simulating enough kills."""
    gs.loot_pool = []
    from Gear import get_item
    for _ in range(3):
        gs.loot_pool.append(get_item())
    return gs


@pytest.fixture
def gs_with_gold(gs):
    gs.gold = 10_000
    return gs


class TestInit:
    def test_one_party_member(self, gs):
        assert len(gs.party.team) == 1

    def test_character_has_custom_name(self):
        gs = GameState(name="Zara")
        assert gs.party.team[0].name == "Zara"

    def test_character_has_custom_class(self):
        gs = GameState(character_class="mage")
        assert gs.party.team[0].character_class == "mage"

    def test_default_name_and_class(self, gs):
        c = gs.party.team[0]
        assert c.name == "Hero"
        assert c.character_class == "fighter"

    def test_starts_at_dungeon_level_1(self, gs):
        assert gs.dungeon_level == 1

    def test_starts_with_zero_gold(self, gs):
        assert gs.gold == 0

    def test_loot_pool_starts_empty(self, gs):
        assert gs.loot_pool == []

    def test_upgrades_initialized_for_all_characters(self, gs):
        for c in gs.party.team:
            assert c.name in gs.upgrades
            assert set(gs.upgrades[c.name].keys()) == {"dps", "xp", "click"}


class TestTick:
    def test_tick_returns_valid_json(self, gs):
        result = json.loads(gs.tick(0.1))
        assert "enemy" in result

    def test_tick_reduces_enemy_hp(self, gs):
        start_hp = gs.enemy["hp"]
        gs.tick(1.0)
        assert gs.enemy["hp"] < start_hp

    def test_tick_kills_enemy_when_hp_depleted(self, gs):
        gs.enemy["hp"] = 0.1
        gs.tick(1.0)
        assert gs.kills == 1

    def test_dungeon_level_increases_after_kills(self, gs):
        gs.enemy["hp"] = 0
        for _ in range(5):
            gs._on_enemy_death()
        assert gs.dungeon_level == 2


class TestClick:
    def test_click_returns_valid_json(self, gs):
        result = json.loads(gs.click())
        assert "enemy" in result

    def test_click_reduces_enemy_hp(self, gs):
        start_hp = gs.enemy["hp"]
        gs.click()
        assert gs.enemy["hp"] < start_hp

    def test_click_damage_includes_party_click_bonus(self, gs):
        gs.party.team[0].click_bonus = 100.0
        gs.enemy["hp"] = gs.enemy["max_hp"] = 10_000  # won't die in one click
        before = gs.enemy["hp"]
        gs.click()
        damage = before - gs.enemy["hp"]
        assert damage > 10  # click_bonus of 100 should dominate


class TestLoot:
    def test_loot_pool_capped_at_max(self, gs):
        for _ in range(200):
            gs.enemy["hp"] = 0
            gs._on_enemy_death()
        assert len(gs.loot_pool) <= LOOT_MAX

    def test_equip_loot_removes_from_pool(self, gs_with_loot):
        count_before = len(gs_with_loot.loot_pool)
        gs_with_loot.equip_loot(0)
        assert len(gs_with_loot.loot_pool) == count_before - 1

    def test_equip_loot_item_appears_in_character_equipment(self, gs_with_loot):
        item = gs_with_loot.loot_pool[0]
        gs_with_loot.equip_loot(0)
        equipped_slots = [
            c.inventory.slots.get(item.slot)
            for c in gs_with_loot.party.team
        ]
        assert any(s is not None for s in equipped_slots)

    def test_equip_loot_out_of_range_is_no_op(self, gs_with_loot):
        before = len(gs_with_loot.loot_pool)
        gs_with_loot.equip_loot(999)
        assert len(gs_with_loot.loot_pool) == before

    def test_sell_loot_removes_from_pool(self, gs_with_loot):
        count_before = len(gs_with_loot.loot_pool)
        gs_with_loot.sell_loot(0)
        assert len(gs_with_loot.loot_pool) == count_before - 1

    def test_sell_loot_adds_gold(self, gs_with_loot):
        item = gs_with_loot.loot_pool[0]
        gs_with_loot.sell_loot(0)
        assert gs_with_loot.gold == item.sell_value

    def test_sell_loot_out_of_range_is_no_op(self, gs_with_loot):
        gs_with_loot.sell_loot(999)
        assert gs_with_loot.gold == 0

    def test_equip_loot_returns_valid_json(self, gs_with_loot):
        result = json.loads(gs_with_loot.equip_loot(0))
        assert "loot_pool" in result

    def test_sell_loot_returns_valid_json(self, gs_with_loot):
        result = json.loads(gs_with_loot.sell_loot(0))
        assert "gold" in result

    def test_equip_loot_sells_displaced_item(self, gs):
        from Gear import GearItem
        weak = GearItem("main_hand", "sword", "broken", "rusty")
        strong = GearItem("main_hand", "sword", "legendary", "legendary")
        # Give all characters the weak item so the strong one must displace it
        for c in gs.party.team:
            c.inventory.slots["main_hand"] = weak
            c.dps += weak.damage
        gs.loot_pool = [strong]
        gs.equip_loot(0)
        assert gs.gold == weak.sell_value

    def test_equip_all_clears_pool(self, gs_with_loot):
        gs_with_loot.equip_all()
        assert gs_with_loot.loot_pool == []

    def test_equip_all_upgrades_are_equipped(self, gs):
        from Gear import GearItem
        item = GearItem("helmet", "helm", "legendary", "shiny")
        gs.loot_pool = [item]
        gs.equip_all()
        equipped = [c.inventory.slots.get("helmet") for c in gs.party.team]
        assert any(e is not None for e in equipped)

    def test_equip_all_junk_is_sold(self, gs):
        from Gear import GearItem
        # First equip a legendary item manually so any future item of lower quality is junk
        strong = GearItem("main_hand", "sword", "legendary", "legendary")
        for c in gs.party.team:
            c.inventory.slots["main_hand"] = strong
            c.dps += strong.damage
        weak = GearItem("main_hand", "sword", "broken", "rusty")
        gs.loot_pool = [weak]
        gs.equip_all()
        assert gs.gold == weak.sell_value
        assert gs.loot_pool == []

    def test_equip_all_returns_valid_json(self, gs_with_loot):
        result = json.loads(gs_with_loot.equip_all())
        assert "loot_pool" in result


class TestUpgrades:
    def test_buy_upgrade_dps_increases_character_dps(self, gs_with_gold):
        char = gs_with_gold.party.team[0]
        before = char.dps
        gs_with_gold.buy_upgrade(char.name, "dps")
        assert char.dps == pytest.approx(before + UPGRADE_EFFECTS["dps"])

    def test_buy_upgrade_xp_increases_multiplier(self, gs_with_gold):
        char = gs_with_gold.party.team[0]
        before = char.xp_multiplier
        gs_with_gold.buy_upgrade(char.name, "xp")
        assert char.xp_multiplier == pytest.approx(before + UPGRADE_EFFECTS["xp"])

    def test_buy_upgrade_click_increases_click_bonus(self, gs_with_gold):
        char = gs_with_gold.party.team[0]
        gs_with_gold.buy_upgrade(char.name, "click")
        assert char.click_bonus == pytest.approx(UPGRADE_EFFECTS["click"])

    def test_buy_upgrade_deducts_gold(self, gs_with_gold):
        char = gs_with_gold.party.team[0]
        cost = gs_with_gold._upgrade_cost(char.name, "dps")
        gs_with_gold.buy_upgrade(char.name, "dps")
        assert gs_with_gold.gold == 10_000 - cost

    def test_buy_upgrade_cost_doubles_each_level(self, gs_with_gold):
        char = gs_with_gold.party.team[0]
        base_cost = UPGRADE_BASES["dps"]
        for expected_cost in (base_cost, base_cost * 2, base_cost * 4):
            assert gs_with_gold._upgrade_cost(char.name, "dps") == expected_cost
            gs_with_gold.buy_upgrade(char.name, "dps")

    def test_buy_upgrade_fails_without_gold(self, gs):
        char = gs.party.team[0]
        before = char.dps
        gs.buy_upgrade(char.name, "dps")
        assert char.dps == before  # unchanged

    def test_buy_upgrade_returns_valid_json(self, gs_with_gold):
        char = gs_with_gold.party.team[0]
        result = json.loads(gs_with_gold.buy_upgrade(char.name, "dps"))
        assert "upgrades" in result

    def test_invalid_upgrade_type_is_no_op(self, gs_with_gold):
        char = gs_with_gold.party.team[0]
        gold_before = gs_with_gold.gold
        gs_with_gold.buy_upgrade(char.name, "invalid")
        assert gs_with_gold.gold == gold_before


class TestToDict:
    def test_respond_is_valid_json(self, gs):
        parsed = json.loads(gs._respond())
        assert isinstance(parsed, dict)

    def test_to_dict_has_required_keys(self, gs):
        d = gs.to_dict()
        for key in ("dungeon_level", "gold", "kills", "enemy", "party",
                    "loot_pool", "upgrades", "log"):
            assert key in d

    def test_loot_pool_in_to_dict(self, gs_with_loot):
        d = gs_with_loot.to_dict()
        assert len(d["loot_pool"]) == 3

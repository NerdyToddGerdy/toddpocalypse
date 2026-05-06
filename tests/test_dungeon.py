import pytest
from game.dungeon import generate_enemy


class TestGenerateEnemy:
    def test_returns_required_keys(self):
        e = generate_enemy(1)
        for key in ("name", "level", "max_hp", "hp", "xp_reward"):
            assert key in e

    def test_hp_equals_max_hp_on_spawn(self):
        e = generate_enemy(1)
        assert e["hp"] == e["max_hp"]

    def test_hp_is_positive(self):
        for level in range(1, 10):
            e = generate_enemy(level)
            assert e["max_hp"] > 0

    def test_hp_scales_with_level(self):
        low  = generate_enemy(1)["max_hp"]
        high = generate_enemy(10)["max_hp"]
        assert high > low

    def test_level_matches_input(self):
        for lvl in (1, 5, 20):
            assert generate_enemy(lvl)["level"] == lvl

    def test_name_is_nonempty_string(self):
        e = generate_enemy(1)
        assert isinstance(e["name"], str) and len(e["name"]) > 0

    def test_xp_reward_positive(self):
        for level in range(1, 10):
            assert generate_enemy(level)["xp_reward"] > 0

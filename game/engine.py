import sys
import os
import json
import random
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import List
from Character import Character, switch
from Gear import get_item
from Party import Party
from game.dungeon import generate_enemy

KILLS_PER_LEVEL = 5
CLICK_DAMAGE_MULTIPLIER = 2.0
MAX_LOG = 6
LOOT_MAX = 8
DROP_CHANCE = 0.45

UPGRADE_BASES   = {"dps": 50,  "xp": 75,  "click": 40}
UPGRADE_EFFECTS = {"dps": 0.5, "xp": 0.1, "click": 0.5}


class GameState:
    def __init__(self, name: str = "Hero", character_class: str = "fighter"):
        self.party = Party()
        self.party.add_player(Character(name, character_class, level=1))

        self.dungeon_level: int = 1
        self.gold: int = 0
        self.kills: int = 0
        self.log: List[str] = []
        self.loot_pool: List = []
        self.enemy: dict = generate_enemy(self.dungeon_level)
        self.upgrades: dict = {
            c.name: {"dps": 0, "xp": 0, "click": 0}
            for c in self.party.team
        }

    # ------------------------------------------------------------------
    # Public API called from JS
    # ------------------------------------------------------------------

    def tick(self, dt: float) -> str:
        total_dps = sum(c.dps for c in self.party.team)
        self.enemy["hp"] -= total_dps * dt
        if self.enemy["hp"] <= 0:
            self._on_enemy_death()
        return self._respond()

    def click(self) -> str:
        total_dps = sum(c.dps for c in self.party.team)
        click_bonus = sum(c.click_bonus for c in self.party.team)
        damage = max(1.0, total_dps * CLICK_DAMAGE_MULTIPLIER * 0.1 + click_bonus)
        self.enemy["hp"] -= damage
        self._add_log(f"You strike for {damage:.1f}!")
        if self.enemy["hp"] <= 0:
            self._on_enemy_death()
        return self._respond()

    def equip_loot(self, idx: int) -> str:
        idx = int(idx)
        if idx < 0 or idx >= len(self.loot_pool):
            return self._respond()
        item = self.loot_pool.pop(idx)
        target = self._best_recipient(item)
        old = target.equip_item(item)
        if old:
            self.gold += old.sell_value
            self._add_log(f"Sold {old.get_name()} for {old.sell_value}g.")
        self._add_log(f"{target.name} equips {item.get_name()}!")
        return self._respond()

    def equip_all(self) -> str:
        remaining = []
        for item in self.loot_pool:
            target = self._best_recipient(item)
            current = target.inventory.slots.get(item.slot)
            net_gain = item.damage - (current.damage if current else 0)
            if net_gain > 0:
                old = target.equip_item(item)
                if old:
                    self.gold += old.sell_value
                    self._add_log(f"Sold {old.get_name()} for {old.sell_value}g.")
                self._add_log(f"{target.name} equips {item.get_name()}!")
            else:
                self.gold += item.sell_value
                self._add_log(f"Sold {item.get_name()} for {item.sell_value}g.")
        self.loot_pool = remaining
        return self._respond()

    def sell_loot(self, idx: int) -> str:
        idx = int(idx)
        if idx < 0 or idx >= len(self.loot_pool):
            return self._respond()
        item = self.loot_pool.pop(idx)
        self.gold += item.sell_value
        self._add_log(f"Sold {item.get_name()} for {item.sell_value}g.")
        return self._respond()

    def buy_upgrade(self, char_name: str, upgrade_type: str) -> str:
        char_name = str(char_name)
        upgrade_type = str(upgrade_type)
        if upgrade_type not in UPGRADE_BASES:
            return self._respond()
        cost = self._upgrade_cost(char_name, upgrade_type)
        if self.gold < cost:
            self._add_log("Not enough gold!")
            return self._respond()
        self.gold -= cost
        self.upgrades[char_name][upgrade_type] += 1
        char = next(c for c in self.party.team if c.name == char_name)
        effect = UPGRADE_EFFECTS[upgrade_type]
        if upgrade_type == "dps":
            char.dps += effect
        elif upgrade_type == "xp":
            char.xp_multiplier += effect
        elif upgrade_type == "click":
            char.click_bonus += effect
        self._add_log(f"{char_name}: {upgrade_type} upgraded!")
        return self._respond()

    def _respond(self) -> str:
        return json.dumps(self.to_dict())

    def to_dict(self) -> dict:
        return {
            "dungeon_level": self.dungeon_level,
            "gold":          self.gold,
            "kills":         self.kills,
            "enemy": {
                "name":   self.enemy["name"],
                "level":  self.enemy["level"],
                "hp":     max(0.0, self.enemy["hp"]),
                "max_hp": self.enemy["max_hp"],
            },
            "party":     [c.to_dict() for c in self.party.team],
            "loot_pool": [i.to_dict() for i in self.loot_pool],
            "upgrades":  {
                name: {
                    utype: {
                        "level":  lvl,
                        "cost":   self._upgrade_cost(name, utype),
                        "effect": UPGRADE_EFFECTS[utype],
                    }
                    for utype, lvl in utypes.items()
                }
                for name, utypes in self.upgrades.items()
            },
            "log": list(self.log),
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _upgrade_cost(self, char_name: str, upgrade_type: str) -> int:
        level = self.upgrades[char_name][upgrade_type]
        return int(UPGRADE_BASES[upgrade_type] * (2 ** level))

    def _best_recipient(self, item):
        def key(c):
            current = c.inventory.slots.get(item.slot)
            net_gain = item.damage - (current.damage if current else 0)
            return (net_gain, -c.dps)
        return max(self.party.team, key=key)

    def _on_enemy_death(self):
        name = self.enemy["name"]
        xp   = self.enemy["xp_reward"]
        self.kills += 1
        self._add_log(f"{name} defeated! +{xp}xp")
        for c in self.party.team:
            c.gain_xp(xp)
        if random.random() < DROP_CHANCE and len(self.loot_pool) < LOOT_MAX:
            drop = get_item(dungeon_level=self.dungeon_level)
            self.loot_pool.append(drop)
            self._add_log(f"Dropped: {drop.get_name()}!")
        if self.kills % KILLS_PER_LEVEL == 0:
            self.dungeon_level += 1
            self._add_log(f"Descending to level {self.dungeon_level}!")
        self.enemy = generate_enemy(self.dungeon_level)

    def _add_log(self, message: str):
        self.log.append(message)
        if len(self.log) > MAX_LOG:
            self.log.pop(0)

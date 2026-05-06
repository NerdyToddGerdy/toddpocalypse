from typing import List

from Character import Character


class Party:
    team: List[Character] = []
    gold: int = 0

    def __init__(self):
        self.team = []
        self.gold = 0

    def get_gold_count(self) -> int:
        return self.gold

    def get_character_names(self) -> List[str]:
        names: list = []
        for c in self.team:
            names.append(c.get_name())
        return names

    def add_player(self, character: Character):
        self.team.append(character)

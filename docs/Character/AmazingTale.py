from typing import List


class Skill:
    name: str
    die_number: int

    def __init__(self, name: str, die_number: int):
        self.name = name
        self.die_number = die_number

    def get_skill_from_die(self, dicts: List[dict], die_number=int) -> str:
        return next(item['name'] for item in dicts if item["die_number"] == die_number)

class Hero:
    name: str
    skills: []

    def __init__(
            self,
            name: str,
            d_12_skill: str,
            d_10_skill: str,
            d_8_skill: str,
            d_6_skill: str):
        self.name = name
        self.skills = []
        self.skills.append(Skill(d_12_skill, 12))
        self.skills.append(Skill(d_10_skill, 10))
        self.skills.append(Skill(d_8_skill, 8))
        self.skills.append(Skill(d_6_skill, 6))

    def get_hero_name(self) -> str:
        return self.name

    def list_skills(self):
        for skill in self.skills:
            print(skill.name)

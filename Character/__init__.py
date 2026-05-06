from Inventory import Inventory

SWITCHER: dict = {
    1: "fighter",
    2: "rogue",
    3: "mage"
}

BASE_DPS: dict = {
    "fighter": 2.0,
    "rogue": 1.5,
    "mage": 1.0,
}


def switch(job_number: int):
    return SWITCHER.get(job_number)


class Character:
    name: str
    character_class: str
    level: int
    inventory: Inventory = []
    health: int = 10
    total_damage: int = 1
    job: str
    xp: int
    xp_to_next: int
    dps: float

    def __init__(self, name, character_class, level=1):
        self.name = name
        self.character_class = character_class
        self.level = level
        self.inventory: Inventory = Inventory()
        self.xp = 0
        self.xp_to_next = 10
        self.dps = BASE_DPS.get(character_class, 1.0)
        self.xp_multiplier: float = 1.0
        self.click_bonus: float = 0.0

    def get_name(self) -> str:
        return self.name

    def get_weapon_inventory(self):
        self.inventory.view_weapons()

    def get_health(self) -> int:
        return self.health

    def is_alive(self) -> bool:
        if self.health > 0:
            return True
        return False

    def attack(self, target_enemy):
        target_enemy.character.health -= self.total_damage
        print(f'{self.name} attacked {target_enemy.character.name}')

    def equip_item(self, item):
        old = self.inventory.equip(item)
        if old:
            self.dps -= old.damage
        self.dps += item.damage
        return old

    def equip_weapon(self, weapon):
        self.equip_item(weapon)

    def gain_xp(self, amount: int):
        self.xp += int(amount * self.xp_multiplier)
        while self.xp >= self.xp_to_next:
            self.level_up()

    def level_up(self):
        self.level += 1
        self.xp -= self.xp_to_next
        self.xp_to_next = int(self.xp_to_next * 1.5)
        self.dps *= 1.2

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "character_class": self.character_class,
            "level": self.level,
            "dps": round(self.dps, 2),
            "xp": self.xp,
            "xp_to_next": self.xp_to_next,
            "click_bonus": round(self.click_bonus, 2),
            "equipment": self.inventory.to_dict(),
        }


class AttackCharacter:
    roll: int
    character: Character
    team: str

    def __init__(self, roll_int: int, character, team: str):
        self.roll = roll_int
        self.character = character
        self.team = team

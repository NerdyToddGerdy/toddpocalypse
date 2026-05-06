import random

ENEMY_ADJECTIVES = [
    "Frightening", "Hideous", "Vile", "Monstrous", "Wretched",
    "Savage", "Cursed", "Ancient", "Rotting", "Terrible",
    "Foul", "Decrepit", "Shadowy", "Twisted", "Venomous",
]

ENEMY_NOUNS = [
    "Goblin", "Troll", "Skeleton", "Ogre", "Wraith",
    "Behemoth", "Demon", "Spider", "Bandit", "Zombie",
    "Slime", "Dragon", "Vampire", "Werewolf", "Witch",
]


def generate_enemy(dungeon_level: int) -> dict:
    name = f"{random.choice(ENEMY_ADJECTIVES)} {random.choice(ENEMY_NOUNS)}"
    hp = int(10 * (1.4 ** dungeon_level) + random.randint(0, dungeon_level * 2))
    xp_reward = max(1, dungeon_level * 3 + random.randint(1, 4))
    gold_reward = max(1, dungeon_level * 5 + random.randint(0, dungeon_level * 3))
    return {
        "name": name,
        "level": dungeon_level,
        "max_hp": hp,
        "hp": hp,
        "xp_reward": xp_reward,
        "gold_reward": gold_reward,
    }

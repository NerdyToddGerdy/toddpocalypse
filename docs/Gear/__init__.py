import random

SLOTS = ["main_hand", "off_hand", "helmet", "chest", "gloves", "legs", "shoes", "ring1", "ring2"]

SLOT_DISPLAY = {
    "main_hand": "Main Hand",
    "off_hand":  "Off Hand",
    "helmet":    "Helmet",
    "chest":     "Chest",
    "gloves":    "Gloves",
    "legs":      "Legs",
    "shoes":     "Shoes",
    "ring1":     "Ring 1",
    "ring2":     "Ring 2",
}

SLOT_ITEM_TYPES = {
    "main_hand": ["sword", "axe", "staff", "bow"],
    "off_hand":  ["dagger", "shield", "tome", "quiver"],
    "helmet":    ["helm", "cap", "crown", "hood"],
    "chest":     ["plate", "robe", "tunic", "mail"],
    "gloves":    ["gauntlets", "gloves", "wraps", "mitts"],
    "legs":      ["greaves", "leggings", "trousers", "chaps"],
    "shoes":     ["boots", "slippers", "sandals", "sabatons"],
    "ring1":     ["ring", "band", "signet", "loop"],
    "ring2":     ["ring", "band", "signet", "loop"],
}

QUAL = ["broken", "worn", "crude", "poor", "common", "fine", "superior", "rare", "epic", "legendary"]
ADJ  = ["awesomeness", "gentleness", "hilarity", "shyness", "destruction", "valor", "cunning"]

DROP_WEIGHTS = [30, 22, 16, 12, 8, 5, 4, 2, 1, 0.5]

DAMAGE_BY_QUALITY = {
    "broken": 1, "worn": 2, "crude": 4, "poor": 7, "common": 11,
    "fine": 17, "superior": 25, "rare": 36, "epic": 52, "legendary": 75,
}
COST_BY_QUALITY = {
    "broken": 3, "worn": 8, "crude": 18, "poor": 35, "common": 60,
    "fine": 100, "superior": 160, "rare": 260, "epic": 420, "legendary": 680,
}


def quality_weights(dungeon_level: int) -> list:
    """Sliding window of ~5 tiers advances every 5 dungeon levels.
    Low tiers lock out, high tiers unlock; legendary requires level 30."""
    min_tier = min((dungeon_level - 1) // 5, len(QUAL) - 1)
    max_tier = min(3 + dungeon_level // 5, len(QUAL) - 1)
    return [
        (DROP_WEIGHTS[i - min_tier] if min_tier <= i <= max_tier else 0)
        for i in range(len(QUAL))
    ]


class GearItem:
    slot: str
    item_type: str
    quality: str
    adjective: str
    damage: int
    cost: int

    def __init__(self, slot: str, item_type: str, quality: str, adjective: str):
        self.slot      = slot
        self.item_type = item_type
        self.quality   = quality
        self.adjective = adjective
        self.damage     = DAMAGE_BY_QUALITY[quality]
        self.cost       = COST_BY_QUALITY[quality]
        self.sell_value = max(1, self.cost // 3)

    def get_name(self) -> str:
        return f"{self.quality} {self.item_type} of {self.adjective}"

    def to_dict(self) -> dict:
        return {
            "slot":         self.slot,
            "slot_display": SLOT_DISPLAY[self.slot],
            "name":         self.get_name(),
            "damage":       self.damage,
            "cost":         self.cost,
            "sell_value":   self.sell_value,
        }


def get_item(slot: str = None, dungeon_level: int = 1) -> GearItem:
    if slot is None:
        slot = random.choice(SLOTS)
    item_type = random.choice(SLOT_ITEM_TYPES[slot])
    quality   = random.choices(QUAL, weights=quality_weights(dungeon_level), k=1)[0]
    adjective = random.choice(ADJ)
    return GearItem(slot, item_type, quality, adjective)


# backward compat for main.py
Weapon = GearItem
def get_weapon() -> GearItem:
    return get_item("main_hand")

// Enemy name tables (#61). Flavour only: names never change stats (§5.6). Data only;
// dungeon.ts holds the rules.

/** Noun suffixes for boss names — equal counts of male and female titles. Flavour only: no effect on stats (bible §5.6; tests/dungeon.test.ts holds it). */
export const BOSS_NOUNS = [
  "Lord",    "Lady",
  "King",    "Queen",
  "Emperor", "Empress",
  "Warlord", "Matriarch",
  "Overlord", "Sovereign",
];

/** Title adjectives for boss enemies. Flavour only: no effect on stats (bible §5.6; tests/dungeon.test.ts holds it). */
export const BOSS_TITLES = [
  "Abyssal",
  "Dread",
  "Eternal",
  "Forsaken",
  "Infernal",
  "Shadow",
  "Titan",
  "Undying",
  "Ravager",
  "Ancient",
];

/** Adjectives prepended to regular enemy names. Flavour only: no effect on stats (bible §5.6; tests/dungeon.test.ts holds it). */
export const ENEMY_ADJECTIVES = [
  "Frightening",
  "Hideous",
  "Vile",
  "Monstrous",
  "Wretched",
  "Savage",
  "Cursed",
  "Ancient",
  "Rotting",
  "Terrible",
  "Foul",
  "Decrepit",
  "Shadowy",
  "Twisted",
  "Venomous",
];

/** Nouns used as enemy creature type names. Flavour only: no effect on stats (bible §5.6; tests/dungeon.test.ts holds it). */
export const ENEMY_NOUNS = [
  "Goblin",
  "Troll",
  "Skeleton",
  "Ogre",
  "Wraith",
  "Behemoth",
  "Demon",
  "Spider",
  "Bandit",
  "Zombie",
  "Slime",
  "Dragon",
  "Vampire",
  "Werewolf",
  "Witch",
];

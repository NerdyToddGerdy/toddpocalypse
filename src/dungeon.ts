const BOSS_TITLES = [
  "Abyssal",
  "Dread",
  "Eternal",
  "Forsaken",
  "Infernal",
  "Shadow",
  "Titan",
  "Undying",
  "Warlord",
  "Ancient",
];

const ENEMY_ADJECTIVES = [
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

const ENEMY_NOUNS = [
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

export interface Enemy {
  name: string;
  level: number;
  max_hp: number;
  hp: number;
  xp_reward: number;
  gold_reward: number;
  attack_dps: number;
  isBoss: boolean;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function generateEnemy(dungeonLevel: number): Enemy {
  const name = `${pick(ENEMY_ADJECTIVES)} ${pick(ENEMY_NOUNS)}`;
  const hp = Math.floor(10 * Math.pow(1.3, dungeonLevel) + randInt(0, dungeonLevel * 2));
  const xpReward = Math.max(1, dungeonLevel * 3 + randInt(1, 4));
  const goldReward = Math.max(1, dungeonLevel * 5 + randInt(0, dungeonLevel * 3));
  const attackDps = Math.round(dungeonLevel * 1.0 * 10) / 10;
  return {
    name,
    level: dungeonLevel,
    max_hp: hp,
    hp,
    xp_reward: xpReward,
    gold_reward: goldReward,
    attack_dps: attackDps,
    isBoss: false,
  };
}

export function generateBoss(dungeonLevel: number): Enemy {
  const name = `The ${pick(BOSS_TITLES)} ${pick(ENEMY_NOUNS)} Lord`;
  const hp = Math.floor(100 * Math.pow(1.3, dungeonLevel));
  const xpReward = Math.max(5, dungeonLevel * 9 + 5);
  const goldReward = Math.max(5, dungeonLevel * 15);
  const attackDps = Math.round(dungeonLevel * 1.5 * 10) / 10;
  return {
    name,
    level: dungeonLevel,
    max_hp: hp,
    hp,
    xp_reward: xpReward,
    gold_reward: goldReward,
    attack_dps: attackDps,
    isBoss: true,
  };
}

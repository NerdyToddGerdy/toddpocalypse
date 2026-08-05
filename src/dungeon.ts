import { pick, randInt } from "./utils.js";
import { defaultRng, type RNG } from "./rng.js";

/** Noun suffixes for boss names — equal counts of male and female titles. */
export const BOSS_NOUNS = [
  "Lord",    "Lady",
  "King",    "Queen",
  "Emperor", "Empress",
  "Warlord", "Matriarch",
  "Overlord", "Sovereign",
];

/** Title adjectives for boss enemies. */
const BOSS_TITLES = [
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

/** Adjectives prepended to regular enemy names. */
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

/** Nouns used as enemy creature type names. */
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

export const ELITE_HP_MULT = 2.5;
export const ELITE_ATTACK_MULT = 1.5;
export const ELITE_REWARD_MULT = 2.0;

/** Gold reward multiplier applied per dungeon level: gold *= (1 + level * GOLD_LEVEL_MULT). */
export const GOLD_LEVEL_MULT = 0.01;

/** Exponent for power-law enemy attack scaling — makes high-floor enemies hit disproportionately harder. */
export const ENEMY_ATTACK_EXPONENT = 1.3;

/** Exponential base for boss stat scaling per dungeon — boss HP and attack multiply by this each venture. */
export const BOSS_DUNGEON_MULT_BASE = 1.75;

/** HP multiplier for the floor-before-checkpoint gate boss. */
export const GATE_BOSS_HP_MULT = 2.0;
/** Attack multiplier for the floor-before-checkpoint gate boss. */
export const GATE_BOSS_ATTACK_MULT = 1.5;

/** Live state of an enemy currently being fought. */
export interface Enemy {
  /** Display name shown in the enemy panel. */
  name: string;
  /** Dungeon floor level used to derive HP and attack. */
  level: number;
  /** Maximum HP for this spawn. */
  max_hp: number;
  /** Current HP; reaches 0 on death. */
  hp: number;
  /** XP awarded to each party member on defeat. */
  xp_reward: number;
  /** Gold awarded to the party on defeat. */
  gold_reward: number;
  /** Damage per second dealt to a random living party member. */
  attack_dps: number;
  /** True for floor bosses; false for regular enemies. */
  isBoss: boolean;
  /** True for rare elite variants with boosted stats and guaranteed loot. */
  isElite?: boolean;
}

/** Serialized, plain-object form of an {@link Enemy}.
 *  Differs from Enemy only in the boss/elite flag naming (snake_case in saves). */
export interface EnemyDict {
  name: string;
  level: number;
  max_hp: number;
  hp: number;
  xp_reward: number;
  gold_reward: number;
  attack_dps: number;
  is_boss: boolean;
  is_elite?: boolean;
}

/** Generates a scaled regular enemy for the given dungeon floor and dungeon index.
 *  Each dungeon beyond the first adds 25% to HP/attack and 15% to gold. */
export function generateEnemy(dungeonLevel: number, dungeonIndex = 0, rng: RNG = defaultRng): Enemy {
  const mult = 1 + dungeonIndex * 0.40;
  const name = `${pick(ENEMY_ADJECTIVES, rng)} ${pick(ENEMY_NOUNS, rng)}`;
  const baseHp = Math.floor(10 * Math.pow(1.3, dungeonLevel) + randInt(0, dungeonLevel * 2, rng));
  const hp = Math.floor(baseHp * mult);
  const xpReward = Math.max(1, dungeonLevel * 3 + randInt(1, 4, rng));
  const goldReward = Math.max(1, Math.floor((dungeonLevel * 5 + randInt(0, dungeonLevel * 3, rng)) * (1 + dungeonIndex * 0.15) * (1 + dungeonLevel * GOLD_LEVEL_MULT)));
  const attackDps = Math.round(Math.pow(dungeonLevel, ENEMY_ATTACK_EXPONENT) * 4.0 * mult * 10) / 10;
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

/** Generates a scaled floor boss with higher HP and attack than regular enemies.
 *  Boss stats scale exponentially with dungeonIndex (×BOSS_DUNGEON_MULT_BASE per dungeon).
 *  HP also scales by √partySize so larger parties face a tankier boss.
 *  Gate bosses (the floor before a checkpoint) gain extra HP and attack. */
export function generateBoss(dungeonLevel: number, dungeonIndex = 0, partySize = 1, isGateBoss = false, rng: RNG = defaultRng): Enemy {
  const mult = Math.pow(BOSS_DUNGEON_MULT_BASE, dungeonIndex);
  const gateMult = isGateBoss ? GATE_BOSS_HP_MULT : 1;
  const gateAttackMult = isGateBoss ? GATE_BOSS_ATTACK_MULT : 1;
  const name = isGateBoss
    ? `The ${pick(BOSS_TITLES, rng)} ${pick(ENEMY_NOUNS, rng)} ${pick(BOSS_NOUNS, rng)} Guardian`
    : `The ${pick(BOSS_TITLES, rng)} ${pick(ENEMY_NOUNS, rng)} ${pick(BOSS_NOUNS, rng)}`;
  const hp = Math.floor(100 * Math.pow(1.3, dungeonLevel) * mult * Math.sqrt(partySize) * gateMult);
  const xpReward = Math.max(5, dungeonLevel * 9 + 5);
  const goldReward = Math.max(5, Math.floor(dungeonLevel * 15 * (1 + dungeonIndex * 0.15) * (1 + dungeonLevel * GOLD_LEVEL_MULT)));
  const attackDps = Math.round(Math.pow(dungeonLevel, ENEMY_ATTACK_EXPONENT) * 6.5 * mult * gateAttackMult * 10) / 10;
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

/** Generates a rare elite variant of a regular enemy with boosted stats and guaranteed loot. */
export function generateEliteEnemy(dungeonLevel: number, dungeonIndex = 0, rng: RNG = defaultRng): Enemy {
  const base = generateEnemy(dungeonLevel, dungeonIndex);
  const hp = Math.floor(base.max_hp * ELITE_HP_MULT);
  return {
    ...base,
    name: `Elite ${base.name}`,
    max_hp: hp,
    hp,
    xp_reward: Math.floor(base.xp_reward * ELITE_REWARD_MULT),
    gold_reward: Math.floor(base.gold_reward * ELITE_REWARD_MULT),
    attack_dps: Math.round(base.attack_dps * ELITE_ATTACK_MULT * 10) / 10,
    isElite: true,
  };
}

import { Character } from "./character.js";
import { Party } from "./party.js";
import { GearItem, getItem, type GearItemDict } from "./gear.js";
import { generateEnemy, generateBoss, type Enemy } from "./dungeon.js";

export const KILLS_PER_LEVEL = 5;
export const CLICK_DAMAGE_MULTIPLIER = 2.0;
export const MAX_LOG = 6;
export const LOOT_MAX = 8;
export const DROP_CHANCE = 0.45;

export const UPGRADE_BASES: Record<string, number> = {
  dps: 50,
  xp: 75,
  click: 40,
};

export const UPGRADE_EFFECTS: Record<string, number> = {
  dps: 0.5,
  xp: 0.1,
  click: 0.5,
};

type UpgradeType = "dps" | "xp" | "click";
type UpgradeLevels = Record<UpgradeType, number>;

export interface GameStateDict {
  dungeon_level: number;
  gold: number;
  kills: number;
  deaths: number;
  highest_level: number;
  monsters_left: number;
  enemy: { name: string; level: number; hp: number; max_hp: number; xp_reward: number; gold_reward: number; attack_dps: number; is_boss: boolean };
  party: ReturnType<Character["toDict"]>[];
  loot_pool: GearItemDict[];
  upgrades: Record<string, Record<UpgradeType, { level: number; cost: number; effect: number }>>;
  log: string[];
}

export class GameState {
  party: Party;
  dungeonLevel = 1;
  gold = 0;
  kills = 0;
  deaths = 0;
  highestLevel = 1;
  log: string[] = [];
  lootPool: GearItem[] = [];
  enemy: Enemy;
  upgrades: Record<string, UpgradeLevels> = {};

  constructor(name = "Hero", characterClass = "fighter") {
    this.party = new Party();
    this.party.addPlayer(new Character(name, characterClass, 1));
    this.enemy = generateEnemy(this.dungeonLevel);
    for (const c of this.party.team) {
      this.upgrades[c.name] = { dps: 0, xp: 0, click: 0 };
    }
  }

  tick(dt: number): string {
    const totalDps = this.party.team.reduce((s, c) => s + c.dps, 0);
    this.enemy.hp -= totalDps * dt;
    if (this.enemy.hp <= 0) {
      this.onEnemyDeath();
      return this.respond();
    }
    const player = this.party.team[0];
    player.health -= this.enemy.attack_dps * dt;
    if (player.health <= 0) {
      this.onPlayerDeath();
    }
    return this.respond();
  }

  click(): string {
    const totalDps = this.party.team.reduce((s, c) => s + c.dps, 0);
    const clickBonus = this.party.team.reduce((s, c) => s + c.clickBonus, 0);
    const damage = Math.max(1.0, totalDps * CLICK_DAMAGE_MULTIPLIER * 0.1 + clickBonus);
    this.enemy.hp -= damage;
    this.addLog(`You strike for ${damage.toFixed(1)}!`);
    if (this.enemy.hp <= 0) this.onEnemyDeath();
    return this.respond();
  }

  equipLoot(idx: number): string {
    if (idx < 0 || idx >= this.lootPool.length) return this.respond();
    const item = this.lootPool.splice(idx, 1)[0];
    const target = this.bestRecipient(item);
    const old = target.equipItem(item);
    if (old) {
      this.gold += old.sellValue;
      this.addLog(`Sold ${old.getName()} for ${old.sellValue}g.`);
    }
    this.addLog(`${target.name} equips ${item.getName()}!`);
    return this.respond();
  }

  equipAll(): string {
    for (const item of this.lootPool) {
      const target = this.bestRecipient(item);
      const current = target.inventory.slots[item.slot];
      const netGain = item.damage - (current ? current.damage : 0);
      if (netGain > 0) {
        const old = target.equipItem(item);
        if (old) {
          this.gold += old.sellValue;
          this.addLog(`Sold ${old.getName()} for ${old.sellValue}g.`);
        }
        this.addLog(`${target.name} equips ${item.getName()}!`);
      } else {
        this.gold += item.sellValue;
        this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
      }
    }
    this.lootPool = [];
    return this.respond();
  }

  sellLoot(idx: number): string {
    if (idx < 0 || idx >= this.lootPool.length) return this.respond();
    const item = this.lootPool.splice(idx, 1)[0];
    this.gold += item.sellValue;
    this.addLog(`Sold ${item.getName()} for ${item.sellValue}g.`);
    return this.respond();
  }

  buyUpgrade(charName: string, upgradeType: string): string {
    if (!(upgradeType in UPGRADE_BASES)) return this.respond();
    const ut = upgradeType as UpgradeType;
    const cost = this.upgradeCost(charName, ut);
    if (this.gold < cost) {
      this.addLog("Not enough gold!");
      return this.respond();
    }
    this.gold -= cost;
    this.upgrades[charName][ut] += 1;
    const char = this.party.team.find((c) => c.name === charName);
    if (!char) return this.respond();
    const effect = UPGRADE_EFFECTS[ut];
    if (ut === "dps") char.dps += effect;
    else if (ut === "xp") char.xpMultiplier += effect;
    else if (ut === "click") char.clickBonus += effect;
    this.addLog(`${charName}: ${ut} upgraded!`);
    return this.respond();
  }

  respond(): string {
    return JSON.stringify(this.toDict());
  }

  toDict(): GameStateDict {
    return {
      dungeon_level: this.dungeonLevel,
      gold: this.gold,
      kills: this.kills,
      deaths: this.deaths,
      highest_level: this.highestLevel,
      monsters_left: this.enemy.isBoss ? 0 : KILLS_PER_LEVEL - (this.kills % KILLS_PER_LEVEL),
      enemy: {
        name: this.enemy.name,
        level: this.enemy.level,
        hp: Math.max(0.0, this.enemy.hp),
        max_hp: this.enemy.max_hp,
        xp_reward: this.enemy.xp_reward,
        gold_reward: this.enemy.gold_reward,
        attack_dps: this.enemy.attack_dps,
        is_boss: this.enemy.isBoss,
      },
      party: this.party.team.map((c) => c.toDict()),
      loot_pool: this.lootPool.map((i) => i.toDict()),
      upgrades: Object.fromEntries(
        Object.entries(this.upgrades).map(([name, utypes]) => [
          name,
          Object.fromEntries(
            (Object.entries(utypes) as [UpgradeType, number][]).map(([utype, lvl]) => [
              utype,
              {
                level: lvl,
                cost: this.upgradeCost(name, utype),
                effect: UPGRADE_EFFECTS[utype],
              },
            ]),
          ) as Record<UpgradeType, { level: number; cost: number; effect: number }>,
        ]),
      ),
      log: [...this.log],
    };
  }

  upgradeCost(charName: string, upgradeType: UpgradeType): number {
    const level = this.upgrades[charName][upgradeType];
    return Math.floor(UPGRADE_BASES[upgradeType] * Math.pow(2, level));
  }

  bestRecipient(item: GearItem): Character {
    return this.party.team.reduce((best, c) => {
      const bestCurrent = best.inventory.slots[item.slot];
      const cCurrent = c.inventory.slots[item.slot];
      const bestGain = item.damage - (bestCurrent ? bestCurrent.damage : 0);
      const cGain = item.damage - (cCurrent ? cCurrent.damage : 0);
      if (cGain > bestGain) return c;
      if (cGain === bestGain && c.dps > best.dps) return c;
      return best;
    });
  }

  onEnemyDeath(): void {
    const name = this.enemy.name;
    const xp = this.enemy.xp_reward;
    this.addLog(`${name} defeated! +${xp}xp`);
    for (const c of this.party.team) {
      c.gainXp(xp);
      c.health = c.maxHealth;
    }

    if (this.enemy.isBoss) {
      if (this.lootPool.length < LOOT_MAX) {
        const drop = getItem(undefined, this.dungeonLevel);
        this.lootPool.push(drop);
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      this.dungeonLevel += 1;
      if (this.dungeonLevel > this.highestLevel) this.highestLevel = this.dungeonLevel;
      this.addLog(`Descending to level ${this.dungeonLevel}!`);
      this.enemy = generateEnemy(this.dungeonLevel);
    } else {
      if (Math.random() < DROP_CHANCE && this.lootPool.length < LOOT_MAX) {
        const drop = getItem(undefined, this.dungeonLevel);
        this.lootPool.push(drop);
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      this.kills += 1;
      if (this.kills % KILLS_PER_LEVEL === 0) {
        this.addLog(`Floor ${this.dungeonLevel} cleared! Boss incoming!`);
        this.enemy = generateBoss(this.dungeonLevel);
      } else {
        this.enemy = generateEnemy(this.dungeonLevel);
      }
    }
  }

  onPlayerDeath(): void {
    const player = this.party.team[0];
    this.deaths += 1;
    this.addLog(`${player.name} was defeated! Returning to level 1...`);
    this.dungeonLevel = 1;
    this.kills = 0;
    player.health = player.maxHealth;
    this.enemy = generateEnemy(1);
  }

  private addLog(message: string): void {
    this.log.push(message);
    if (this.log.length > MAX_LOG) this.log.shift();
  }

  static fromDict(d: GameStateDict): GameState {
    const gs = new GameState();
    gs.party.team = [];
    gs.upgrades = {};

    gs.dungeonLevel = d.dungeon_level;
    gs.gold = d.gold;
    gs.kills = d.kills;
    gs.deaths = d.deaths ?? 0;
    gs.highestLevel = d.highest_level ?? d.dungeon_level;
    gs.log = [...d.log];

    for (const cd of d.party) {
      const c = Character.fromDict(cd);
      gs.party.addPlayer(c);
      gs.upgrades[c.name] = {
        dps: d.upgrades[c.name]?.dps?.level ?? 0,
        xp: d.upgrades[c.name]?.xp?.level ?? 0,
        click: d.upgrades[c.name]?.click?.level ?? 0,
      };
    }

    gs.lootPool = d.loot_pool.map((item) => GearItem.fromDict(item));

    gs.enemy = {
      name: d.enemy.name,
      level: d.enemy.level,
      hp: d.enemy.hp,
      max_hp: d.enemy.max_hp,
      xp_reward: d.enemy.xp_reward,
      gold_reward: d.enemy.gold_reward,
      attack_dps: d.enemy.attack_dps,
      isBoss: d.enemy.is_boss ?? false,
    };

    return gs;
  }
}

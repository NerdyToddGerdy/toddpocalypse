import { Character } from "./character.js";
import { Party } from "./party.js";
import { GearItem, getItem, QUAL, autoSellThreshold, type GearItemDict } from "./gear.js";
import { generateEnemy, generateBoss, type Enemy } from "./dungeon.js";

export const KILLS_PER_LEVEL = 5;

export function killsForFloor(dungeonLevel: number): number {
  return KILLS_PER_LEVEL + Math.floor(dungeonLevel / 5) * 2;
}
export const CLICK_DAMAGE_MULTIPLIER = 2.0;
export const MAX_LOG = 6;
export const LOOT_MAX = 8;
export const DROP_CHANCE = 0.45;

export const UPGRADE_BASES: Record<string, number> = {
  dps: 50,
  xp: 75,
  click: 40,
  hp: 60,
};

export const UPGRADE_EFFECTS: Record<string, number> = {
  dps: 0.5,
  xp: 0.1,
  click: 0.5,
};

export const HP_UPGRADE_EFFECT = 25;

export const BLOODLUST_MULTIPLIER = 1.6;
export const EXPOSE_WEAKNESS_MULT = 1.25;
export const MANA_SURGE_INTERVAL = 20;
export const MANA_SURGE_MULTIPLIER = 5;
export const LUCKY_STRIKE_CHANCE = 0.25;
export const LUCKY_STRIKE_MULTIPLIER = 3;
export const EMPOWER_MULTIPLIER = 2;

export const PRESTIGE_UNLOCK_LEVEL = 20;
export const PRESTIGE_SHOP_COSTS: Record<string, number> = {
  auto_seller: 1,
  auto_equip: 2,
  auto_upgrade: 2,
  party_slot_2: 2,
  party_slot_3: 3,
  starting_gold: 1,
  xp_bonus: 1,
};
export const STARTING_GOLD_PER_LEVEL = 250;
export const XP_BONUS_PER_LEVEL = 0.10;

type UpgradeType = "dps" | "xp" | "click" | "hp";
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
  prestige_points: number;
  lifetime_kills: number;
  lifetime_deaths: number;
  lifetime_best_level: number;
  total_prestiges: number;
  prestige_upgrades: Record<string, number>;
  prestige_party_classes: Record<string, string>;
  prestige_available: boolean;
  prestige_points_preview: number;
  checkpoint_level: number;
  auto_sell_qualities: string[];
  floor_kills: number;
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
  prestigePoints = 0;
  lifetimeKills = 0;
  lifetimeDeaths = 0;
  lifetimeBestLevel = 1;
  totalPrestiges = 0;
  prestigeUpgrades: Record<string, number> = {};
  prestigePartyClasses: Record<string, string> = {};
  autoSellQualities: string[] = [];
  checkpointLevel = 1;
  floorKills = 0;

  constructor(name = "Hero", characterClass = "fighter") {
    this.party = new Party();
    this.party.addPlayer(new Character(name, characterClass, 1));
    this.enemy = generateEnemy(this.dungeonLevel);
    for (const c of this.party.team) {
      this.upgrades[c.name] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }
  }

  tick(dt: number): string {
    // Mana Surge — fires before regular DPS so we can early-return if enemy dies
    for (const c of this.party.team) {
      if (c.abilities.includes("mana_surge") && c.inventory.equippedItems().length > 0) {
        c.surgeTimer += dt;
        if (c.surgeTimer >= MANA_SURGE_INTERVAL) {
          c.surgeTimer -= MANA_SURGE_INTERVAL;
          const surgeDmg = c.dps * MANA_SURGE_MULTIPLIER;
          this.enemy.hp -= surgeDmg;
          this.addLog(`${c.name} Mana Surge! (${surgeDmg.toFixed(1)} dmg)`);
          if (this.enemy.hp <= 0) { this.onEnemyDeath(); return this.respond(); }
        }
      }
    }

    const hasExpose = this.party.team.some(c => c.abilities.includes("expose_weakness"));
    const totalDps = this.party.team.reduce((s, c) => {
      if (c.inventory.equippedItems().length === 0) return s;
      let dps = c.dps;
      if (c.abilities.includes("bloodlust") && c.health <= c.maxHealth * 0.5) dps *= BLOODLUST_MULTIPLIER;
      return s + dps;
    }, 0);
    this.enemy.hp -= totalDps * (hasExpose ? EXPOSE_WEAKNESS_MULT : 1.0) * dt;
    if (this.enemy.hp <= 0) {
      this.onEnemyDeath();
      return this.respond();
    }
    const player = this.party.team[0];
    player.health -= this.enemy.attack_dps * dt * (1 - player.damageReduction);
    if (player.health <= 0) {
      this.onPlayerDeath();
    }
    return this.respond();
  }

  click(): string {
    const totalDps = this.party.team.reduce((s, c) => s + c.dps, 0);
    const clickBonus = this.party.team.reduce((s, c) => s + c.clickBonus, 0);
    let damage = Math.max(1.0, totalDps * CLICK_DAMAGE_MULTIPLIER * 0.1 + clickBonus);
    if (this.party.team.some(c => c.abilities.includes("empower"))) damage *= EMPOWER_MULTIPLIER;
    if (this.party.team.some(c => c.abilities.includes("lucky_strike")) && Math.random() < LUCKY_STRIKE_CHANCE) {
      damage *= LUCKY_STRIKE_MULTIPLIER;
      this.addLog(`Lucky Strike! ${damage.toFixed(1)} dmg!`);
    } else {
      this.addLog(`You strike for ${damage.toFixed(1)}!`);
    }
    this.enemy.hp -= damage;
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
      const current = this.slotToCompare(target, item);
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
    if (ut === "dps") char.dps += UPGRADE_EFFECTS.dps;
    else if (ut === "xp") char.xpMultiplier += UPGRADE_EFFECTS.xp;
    else if (ut === "click") char.clickBonus += UPGRADE_EFFECTS.click;
    else if (ut === "hp") {
      char.maxHealth += HP_UPGRADE_EFFECT;
      char.health += HP_UPGRADE_EFFECT;
    }
    this.addLog(`${charName}: ${ut} upgraded!`);
    return this.respond();
  }

  prestigePointsPreview(): number {
    return 1 + Math.floor(Math.max(0, this.highestLevel - PRESTIGE_UNLOCK_LEVEL) / 5);
  }

  prestige(): string {
    if (this.highestLevel < PRESTIGE_UNLOCK_LEVEL) return this.respond();
    const earned = this.prestigePointsPreview();
    this.lifetimeKills += this.kills;
    this.lifetimeDeaths += this.deaths;
    this.lifetimeBestLevel = Math.max(this.lifetimeBestLevel, this.highestLevel);
    this.totalPrestiges += 1;
    this.prestigePoints += earned;

    const leadName = this.party.team[0].name;
    const leadClass = this.party.team[0].characterClass;

    this.dungeonLevel = 1;
    this.kills = 0;
    this.floorKills = 0;
    this.deaths = 0;
    this.highestLevel = 1;
    this.checkpointLevel = 1;
    this.autoSellQualities = [];
    this.lootPool = [];
    this.log = [];
    this.enemy = generateEnemy(1);

    this.party.team = [];
    this.upgrades = {};
    const lead = new Character(leadName, leadClass, 1);
    this.party.addPlayer(lead);
    this.upgrades[leadName] = { dps: 0, xp: 0, click: 0, hp: 0 };

    if ((this.prestigeUpgrades["party_slot_2"] ?? 0) > 0) {
      const cls2 = this.prestigePartyClasses["slot_2"] ?? "fighter";
      const comp = new Character("Companion", cls2, 1);
      this.party.addPlayer(comp);
      this.upgrades["Companion"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }
    if ((this.prestigeUpgrades["party_slot_3"] ?? 0) > 0) {
      const cls3 = this.prestigePartyClasses["slot_3"] ?? "fighter";
      const ally = new Character("Ally", cls3, 1);
      this.party.addPlayer(ally);
      this.upgrades["Ally"] = { dps: 0, xp: 0, click: 0, hp: 0 };
    }

    const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
    for (const c of this.party.team) {
      c.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    }

    this.gold = (this.prestigeUpgrades["starting_gold"] ?? 0) * STARTING_GOLD_PER_LEVEL;

    this.addLog(`Prestige ${this.totalPrestiges}! Earned ${earned}pt. Total: ${this.prestigePoints}pts.`);
    return this.respond();
  }

  buyPrestigeUpgrade(type: string, characterClass?: string): string {
    if (!(type in PRESTIGE_SHOP_COSTS)) return this.respond();
    if (type === "party_slot_3" && !(this.prestigeUpgrades["party_slot_2"] > 0)) return this.respond();
    const oneTime = ["auto_seller", "auto_equip", "auto_upgrade", "party_slot_2", "party_slot_3"];
    if (oneTime.includes(type) && (this.prestigeUpgrades[type] ?? 0) >= 1) return this.respond();
    const cost = PRESTIGE_SHOP_COSTS[type];
    if (this.prestigePoints < cost) {
      this.addLog("Not enough prestige points!");
      return this.respond();
    }
    this.prestigePoints -= cost;
    this.prestigeUpgrades[type] = (this.prestigeUpgrades[type] ?? 0) + 1;

    if (type === "party_slot_2") {
      const cls = characterClass ?? "fighter";
      this.prestigePartyClasses["slot_2"] = cls;
      const comp = new Character("Companion", cls, 1);
      this.party.addPlayer(comp);
      this.upgrades["Companion"] = { dps: 0, xp: 0, click: 0, hp: 0 };
      const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
      comp.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    } else if (type === "party_slot_3") {
      const cls = characterClass ?? "fighter";
      this.prestigePartyClasses["slot_3"] = cls;
      const ally = new Character("Ally", cls, 1);
      this.party.addPlayer(ally);
      this.upgrades["Ally"] = { dps: 0, xp: 0, click: 0, hp: 0 };
      const xpStacks = this.prestigeUpgrades["xp_bonus"] ?? 0;
      ally.xpMultiplier += XP_BONUS_PER_LEVEL * xpStacks;
    } else if (type === "xp_bonus") {
      for (const c of this.party.team) {
        c.xpMultiplier += XP_BONUS_PER_LEVEL;
      }
    }

    this.addLog(`Prestige upgrade: ${type} purchased!`);
    if (type === "auto_seller") this.runAutoSeller();
    if (type === "auto_equip") this.runAutoEquip();
    if (type === "auto_upgrade") this.runAutoUpgrade();
    return this.respond();
  }

  toggleAutoSellQuality(quality: string): string {
    const idx = this.autoSellQualities.indexOf(quality);
    if (idx === -1) {
      this.autoSellQualities.push(quality);
    } else {
      this.autoSellQualities.splice(idx, 1);
    }
    this.runAutoSeller();
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
      monsters_left: this.enemy.isBoss ? 0 : killsForFloor(this.dungeonLevel) - this.floorKills,
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
      prestige_points: this.prestigePoints,
      lifetime_kills: this.lifetimeKills + this.kills,
      lifetime_deaths: this.lifetimeDeaths + this.deaths,
      lifetime_best_level: Math.max(this.lifetimeBestLevel, this.highestLevel),
      total_prestiges: this.totalPrestiges,
      prestige_upgrades: { ...this.prestigeUpgrades },
      prestige_party_classes: { ...this.prestigePartyClasses },
      prestige_available: this.highestLevel >= PRESTIGE_UNLOCK_LEVEL,
      prestige_points_preview: this.highestLevel >= PRESTIGE_UNLOCK_LEVEL
        ? this.prestigePointsPreview()
        : 0,
      checkpoint_level: this.checkpointLevel,
      auto_sell_qualities: [...this.autoSellQualities],
      floor_kills: this.floorKills,
    };
  }

  upgradeCost(charName: string, upgradeType: UpgradeType): number {
    const level = this.upgrades[charName][upgradeType];
    return Math.floor(UPGRADE_BASES[upgradeType] * Math.pow(2, level));
  }

  bestRecipient(item: GearItem): Character {
    return this.party.team.reduce((best, c) => {
      const bestCurrent = this.slotToCompare(best, item);
      const cCurrent = this.slotToCompare(c, item);
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
      while (c.pendingPartyAbilities.length > 0) {
        const ability = c.pendingPartyAbilities.shift()!;
        if (ability === "battle_standard") {
          for (const other of this.party.team) {
            if (other !== c) other.dps *= 1.1;
          }
          this.addLog(`${c.name} raises Battle Standard! Party DPS +10%.`);
        } else if (ability === "arcane_study") {
          for (const other of this.party.team) {
            other.xpMultiplier *= 1.25;
          }
          this.addLog(`${c.name} unlocks Arcane Study! Party XP +25%.`);
        }
      }
    }

    if (this.enemy.isBoss) {
      this.gold += this.enemy.gold_reward;
      if (this.lootPool.length < LOOT_MAX) {
        const drop = getItem(undefined, this.dungeonLevel);
        this.lootPool.push(drop);
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      this.dungeonLevel += 1;
      this.floorKills = 0;
      if (this.dungeonLevel > this.highestLevel) this.highestLevel = this.dungeonLevel;
      if (this.dungeonLevel % 10 === 0) {
        this.checkpointLevel = this.dungeonLevel;
        this.addLog(`⚑ Checkpoint! Respawn set to floor ${this.checkpointLevel}.`);
      }
      this.addLog(`Descending to level ${this.dungeonLevel}!`);
      this.enemy = generateEnemy(this.dungeonLevel);
    } else {
      if (Math.random() < DROP_CHANCE && this.lootPool.length < LOOT_MAX) {
        const drop = getItem(undefined, this.dungeonLevel);
        this.lootPool.push(drop);
        this.addLog(`Dropped: ${drop.getName()}!`);
      }
      this.kills += 1;
      this.floorKills += 1;
      if (this.floorKills >= killsForFloor(this.dungeonLevel)) {
        this.floorKills = 0;
        this.addLog(`Floor ${this.dungeonLevel} cleared! Boss incoming!`);
        this.enemy = generateBoss(this.dungeonLevel);
      } else {
        this.enemy = generateEnemy(this.dungeonLevel);
      }
    }
    this.runAutoEquip();
    this.runAutoSeller();
    this.runAutoUpgrade();
  }

  onPlayerDeath(): void {
    const player = this.party.team[0];
    this.deaths += 1;
    const msg = this.checkpointLevel > 1
      ? `${player.name} was defeated! Respawning at floor ${this.checkpointLevel}...`
      : `${player.name} was defeated! Returning to level 1...`;
    this.addLog(msg);
    this.dungeonLevel = this.checkpointLevel;
    this.kills = 0;
    this.floorKills = 0;
    player.health = player.maxHealth;
    this.enemy = generateEnemy(this.checkpointLevel);
  }

  private slotToCompare(c: Character, item: GearItem): GearItem | null {
    if (item.slot !== "ring1") return c.inventory.slots[item.slot];
    const r1 = c.inventory.slots.ring1;
    const r2 = c.inventory.slots.ring2;
    if (!r1 || !r2) return null; // fills empty ring slot
    return r1.damage <= r2.damage ? r1 : r2; // weaker ring will be displaced
  }

  private runAutoSeller(): void {
    if (!(this.prestigeUpgrades["auto_seller"] > 0) || this.autoSellQualities.length === 0) return;
    const toSell = this.lootPool.filter(
      item => this.autoSellQualities.includes(item.quality) && !this.isUpgradeForAnyMember(item)
    );
    if (toSell.length === 0) return;
    const gold = toSell.reduce((sum, item) => sum + item.sellValue, 0);
    this.gold += gold;
    this.lootPool = this.lootPool.filter(item => !toSell.includes(item));
    this.addLog(`Auto Seller: sold ${toSell.length} item(s) for ${gold}g`);
  }

  private runAutoEquip(): void {
    if (!(this.prestigeUpgrades["auto_equip"] > 0)) return;
    let found = true;
    while (found) {
      found = false;
      for (let i = 0; i < this.lootPool.length; i++) {
        const item = this.lootPool[i];
        if (this.isUpgradeForAnyMember(item)) {
          this.lootPool.splice(i, 1);
          const target = this.bestRecipient(item);
          const old = target.equipItem(item);
          if (old) {
            this.gold += old.sellValue;
            this.addLog(`Auto Equip: ${target.name} equips ${item.getName()}, sold ${old.getName()} for ${old.sellValue}g`);
          } else {
            this.addLog(`Auto Equip: ${target.name} equips ${item.getName()}!`);
          }
          found = true;
          break;
        }
      }
    }
  }

  private runAutoUpgrade(): void {
    if (!(this.prestigeUpgrades["auto_upgrade"] > 0)) return;
    const upgradeTypes: UpgradeType[] = ["dps", "xp", "click", "hp"];
    let bought = true;
    while (bought) {
      bought = false;
      let cheapest: { char: Character; type: UpgradeType; cost: number } | null = null;
      for (const c of this.party.team) {
        for (const type of upgradeTypes) {
          const cost = this.upgradeCost(c.name, type);
          if (this.gold >= cost && (!cheapest || cost < cheapest.cost)) {
            cheapest = { char: c, type, cost };
          }
        }
      }
      if (cheapest) {
        const { char, type } = cheapest;
        this.gold -= cheapest.cost;
        this.upgrades[char.name][type] += 1;
        if (type === "dps") char.dps += UPGRADE_EFFECTS.dps;
        else if (type === "xp") char.xpMultiplier += UPGRADE_EFFECTS.xp;
        else if (type === "click") char.clickBonus += UPGRADE_EFFECTS.click;
        else if (type === "hp") {
          char.maxHealth += HP_UPGRADE_EFFECT;
          char.health += HP_UPGRADE_EFFECT;
        }
        this.addLog(`Auto Upgrade: ${char.name} ${type} → Lv${this.upgrades[char.name][type]}`);
        bought = true;
      }
    }
  }

  private isUpgradeForAnyMember(item: GearItem): boolean {
    return this.party.team.some(c => {
      const equipped = this.slotToCompare(c, item);
      return !equipped || item.damage > equipped.damage;
    });
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
        hp: d.upgrades[c.name]?.hp?.level ?? 0,
      };
    }

    gs.lootPool = d.loot_pool.map((item) => GearItem.fromDict(item));

    gs.prestigePoints = d.prestige_points ?? 0;
    gs.lifetimeKills = d.lifetime_kills ?? 0;
    gs.lifetimeDeaths = d.lifetime_deaths ?? 0;
    gs.lifetimeBestLevel = d.lifetime_best_level ?? d.highest_level ?? 1;
    gs.totalPrestiges = d.total_prestiges ?? 0;
    gs.prestigeUpgrades = { ...(d.prestige_upgrades ?? {}) };
    gs.prestigePartyClasses = { ...(d.prestige_party_classes ?? {}) };
    gs.autoSellQualities = [...(d.auto_sell_qualities ?? [])];
    gs.checkpointLevel = d.checkpoint_level ?? 1;
    gs.floorKills = d.floor_kills ?? 0;

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

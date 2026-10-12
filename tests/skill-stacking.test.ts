import { describe, expect, it } from "vitest";
import { Character } from "../src/character";
import {
  GameState, SKILL_DEFS, BATTLE_CRY_MULT, SHADOW_STRIKE_MULT, ENTANGLE_REDUCTION, CONSECRATE_HEAL,
  SKILL_STACK_MAX_EXTRA, skillExtraHeroes, stackedCooldown, stackedMult, stackedHeal, stackedEntangle,
} from "../src/engine";
import { buildActiveSkillTooltipHTML } from "../src/ui/html";

/**
 * Two or more heroes of the same class make that class's skill stronger: each
 * extra hero cuts the cooldown by 15% and adds half the skill's bonus again,
 * counting up to three extra heroes.
 */

function partyOf(...classes: string[]): GameState {
  const gs = new GameState();
  gs.party.team.length = 0;
  classes.forEach((cls, i) => {
    const name = `Hero${i}`;
    gs.party.team.push(new Character(name, cls, 1));
    gs.upgrades[name] = { dps: 0, xp: 0, click: 0, hp: 0, defense: 0 };
  });
  for (const id of Object.keys(SKILL_DEFS)) gs.guildUpgrades[id] = 1;
  return gs;
}

describe("stacking rules", () => {
  it("counts extra heroes beyond the first, up to the cap", () => {
    expect(skillExtraHeroes(0)).toBe(0);
    expect(skillExtraHeroes(1)).toBe(0);
    expect(skillExtraHeroes(2)).toBe(1);
    expect(skillExtraHeroes(4)).toBe(3);
    expect(skillExtraHeroes(6)).toBe(SKILL_STACK_MAX_EXTRA);
  });

  it("each extra hero cuts the cooldown by 15%", () => {
    expect(stackedCooldown(20, 1)).toBe(20);
    expect(stackedCooldown(20, 2)).toBe(17);
    expect(stackedCooldown(20, 3)).toBe(14);
    expect(stackedCooldown(20, 4)).toBe(11);
    expect(stackedCooldown(20, 6)).toBe(11);
  });

  it("each extra hero adds half the skill's bonus again", () => {
    expect(stackedMult(BATTLE_CRY_MULT, 1)).toBe(2);
    expect(stackedMult(BATTLE_CRY_MULT, 2)).toBe(2.5);
    expect(stackedMult(SHADOW_STRIKE_MULT, 3)).toBe(5);
    expect(stackedMult(BATTLE_CRY_MULT, 6)).toBe(3.5);
  });

  it("Consecrate heals more, never past full", () => {
    expect(stackedHeal(1)).toBe(CONSECRATE_HEAL);
    expect(stackedHeal(2)).toBeCloseTo(0.75);
    expect(stackedHeal(4)).toBe(1);
  });

  it("Entangle weakens the enemy further", () => {
    expect(stackedEntangle(1)).toBe(ENTANGLE_REDUCTION);
    expect(stackedEntangle(2)).toBeGreaterThan(ENTANGLE_REDUCTION);
    expect(stackedEntangle(2)).toBeLessThan(1);
    expect(stackedEntangle(3)).toBeGreaterThan(stackedEntangle(2));
  });

  it("a stacked skill never lasts longer than its cooldown", () => {
    for (const def of Object.values(SKILL_DEFS)) {
      expect(stackedCooldown(def.cooldownKills, 6)).toBeGreaterThan(def.durationKills);
    }
  });
});

describe("in play", () => {
  it("one fighter keeps the normal cooldown", () => {
    const gs = partyOf("fighter", "mage");
    gs.activateSkill("skill_battle_cry");
    expect(gs.skillCooldowns["skill_battle_cry"]).toBe(SKILL_DEFS["skill_battle_cry"].cooldownKills);
  });

  it("two fighters put Battle Cry on a shorter cooldown", () => {
    const gs = partyOf("fighter", "fighter");
    gs.activateSkill("skill_battle_cry");
    expect(gs.skillCooldowns["skill_battle_cry"]).toBe(17);
  });

  it("two fighters make Battle Cry hit harder", () => {
    const gs = partyOf("fighter", "fighter");
    gs.activateSkill("skill_battle_cry");
    const factor = gs.partyDpsBreakdown().factors.find((f) => f.label === "Battle Cry");
    expect(factor?.value).toBe(2.5);
  });

  it("two rogues make Shadow Strike's clicks hit harder too", () => {
    const one = partyOf("rogue", "mage");
    const two = partyOf("rogue", "rogue");
    for (const gs of [one, two]) {
      gs.activeEffects["skill_shadow_strike"] = 3;
      gs.enemy.hp = 1e12;
    }
    one.click();
    two.click();
    const dealt = (gs: GameState) => 1e12 - gs.enemy.hp;
    expect(dealt(two) / dealt(one)).toBeCloseTo(stackedMult(SHADOW_STRIKE_MULT, 2) / SHADOW_STRIKE_MULT, 1);
  });

  it("two paladins' Consecrate heals 75%", () => {
    const gs = partyOf("paladin", "paladin");
    for (const c of gs.party.team) { c.maxHealth = 100; c.health = 10; }
    gs.activateSkill("skill_consecrate");
    expect(gs.party.team[0].health).toBeCloseTo(85);
  });

  it("the state reports each skill's stacked cooldown and hero count", () => {
    const s = partyOf("fighter", "fighter", "fighter", "mage").toDict();
    expect(s.skill_cooldown_totals["skill_battle_cry"]).toBe(14);
    expect(s.skill_cooldown_totals["skill_arcane_surge"]).toBe(25);
    expect(s.skill_class_counts["skill_battle_cry"]).toBe(3);
    expect(s.skill_class_counts["skill_arcane_surge"]).toBe(1);
  });
});

describe("tooltip", () => {
  it("says what the extra heroes add", () => {
    const html = buildActiveSkillTooltipHTML("skill_battle_cry", {
      remaining: 0, expiry: 0, totalCooldown: 17, isActive: false, onCooldown: false, heroes: 2,
    });
    expect(html).toContain("Cooldown: 17 kills");
    expect(html).toMatch(/2 fighters: 15% shorter cooldown, 50% stronger/);
  });

  it("says nothing extra for a single hero", () => {
    const html = buildActiveSkillTooltipHTML("skill_battle_cry", {
      remaining: 0, expiry: 0, totalCooldown: 20, isActive: false, onCooldown: false, heroes: 1,
    });
    expect(html).not.toContain("stronger");
  });
});

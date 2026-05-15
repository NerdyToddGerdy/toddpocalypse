import { describe, expect, it } from "vitest";
import { generateEnemy, generateBoss, generateEliteEnemy, ELITE_HP_MULT, ELITE_ATTACK_MULT, ELITE_REWARD_MULT, GOLD_LEVEL_MULT } from "../src/dungeon.js";

describe("GOLD_LEVEL_MULT", () => {
  it("is 0.01", () => {
    expect(GOLD_LEVEL_MULT).toBe(0.01);
  });

  it("gold_reward at level 20 reflects the level multiplier vs level 10", () => {
    // avg gold at lv20 = 20*5 + 20*1.5 = 130, * (1 + 20*0.01) = 130 * 1.2 = 156
    // avg gold at lv10 = 10*5 + 10*1.5 = 65,  * (1 + 10*0.01) = 65  * 1.1 = 71.5
    // ratio should be > 2.0 (pure level scaling alone would give exactly 2.0)
    let sum10 = 0, sum20 = 0;
    for (let i = 0; i < 200; i++) {
      sum10 += generateEnemy(10, 0).gold_reward;
      sum20 += generateEnemy(20, 0).gold_reward;
    }
    expect(sum20 / sum10).toBeGreaterThan(2.0);
  });

  it("boss gold_reward at level 20 is higher than without multiplier would predict", () => {
    // boss gold = dungeonLevel * 15 * (1 + level*0.01)
    // at lv20: 20*15*1.2 = 360; at lv10: 10*15*1.1 = 165; ratio > 2.0
    const boss10 = generateBoss(10).gold_reward;
    const boss20 = generateBoss(20).gold_reward;
    expect(boss20 / boss10).toBeGreaterThan(2.0);
  });
});

describe("generateEnemy", () => {
  it("returns required keys", () => {
    const e = generateEnemy(1);
    for (const key of ["name", "level", "max_hp", "hp", "xp_reward"]) {
      expect(e).toHaveProperty(key);
    }
  });

  it("hp == max_hp on spawn", () => {
    const e = generateEnemy(1);
    expect(e.hp).toBe(e.max_hp);
  });

  it("max_hp is positive across many levels", () => {
    for (let level = 1; level < 10; level++) {
      expect(generateEnemy(level).max_hp).toBeGreaterThan(0);
    }
  });

  it("hp scales with dungeon level", () => {
    const low = generateEnemy(1).max_hp;
    const high = generateEnemy(10).max_hp;
    expect(high).toBeGreaterThan(low);
  });

  it("level matches input", () => {
    for (const lvl of [1, 5, 20]) {
      expect(generateEnemy(lvl).level).toBe(lvl);
    }
  });

  it("name is a non-empty string", () => {
    const e = generateEnemy(1);
    expect(typeof e.name).toBe("string");
    expect(e.name.length).toBeGreaterThan(0);
  });

  it("xp reward is positive", () => {
    for (let level = 1; level < 10; level++) {
      expect(generateEnemy(level).xp_reward).toBeGreaterThan(0);
    }
  });

  it("attack_dps present and positive", () => {
    expect(generateEnemy(1)).toHaveProperty("attack_dps");
    for (let level = 1; level < 10; level++) {
      expect(generateEnemy(level).attack_dps).toBeGreaterThan(0);
    }
  });

  it("attack_dps scales with level", () => {
    expect(generateEnemy(10).attack_dps).toBeGreaterThan(generateEnemy(1).attack_dps);
  });

  it("isBoss is false", () => {
    expect(generateEnemy(1).isBoss).toBe(false);
  });

  it("dungeonIndex=0 behaves identically to no second arg", () => {
    // attack_dps is deterministic — safe to compare
    expect(generateEnemy(5, 0).attack_dps).toBe(generateEnemy(5).attack_dps);
  });

  it("dungeonIndex increases attack_dps by 40% per index", () => {
    const base = generateEnemy(10, 0).attack_dps;
    expect(generateEnemy(10, 1).attack_dps).toBeCloseTo(base * 1.40, 5);
    expect(generateEnemy(10, 2).attack_dps).toBeCloseTo(base * 1.80, 5);
  });

  it("base attack_dps coefficient is 4.0 per dungeon level", () => {
    expect(generateEnemy(10, 0).attack_dps).toBeCloseTo(40.0, 5);
    expect(generateEnemy(20, 0).attack_dps).toBeCloseTo(80.0, 5);
  });

  it("dungeonIndex=1 produces higher attack_dps than dungeonIndex=0 at same level", () => {
    // attack_dps is deterministic — no random variance
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(generateEnemy(lvl, 1).attack_dps).toBeGreaterThan(generateEnemy(lvl, 0).attack_dps);
    }
  });

  it("dungeonIndex=1 produces higher max_hp at levels where ranges cannot overlap", () => {
    // At level 8+, the 25% multiplier exceeds the randInt(0, level*2) variance
    for (let lvl = 8; lvl <= 15; lvl++) {
      expect(generateEnemy(lvl, 1).max_hp).toBeGreaterThan(generateEnemy(lvl, 0).max_hp);
    }
  });

  it("dungeonIndex scales gold_reward upward", () => {
    // single-call comparison can overlap due to randInt; average 100 samples to be reliable
    let sum0 = 0, sum2 = 0;
    for (let i = 0; i < 100; i++) {
      sum0 += generateEnemy(15, 0).gold_reward;
      sum2 += generateEnemy(15, 2).gold_reward;
    }
    expect(sum2).toBeGreaterThan(sum0);
  });
});

describe("generateBoss", () => {
  it("isBoss is true", () => {
    expect(generateBoss(1).isBoss).toBe(true);
  });

  it("level matches dungeon level", () => {
    for (const lvl of [1, 5, 10]) {
      expect(generateBoss(lvl).level).toBe(lvl);
    }
  });

  it("name is a non-empty string", () => {
    const b = generateBoss(1);
    expect(typeof b.name).toBe("string");
    expect(b.name.length).toBeGreaterThan(0);
  });

  it("hp == max_hp on spawn", () => {
    const b = generateBoss(1);
    expect(b.hp).toBe(b.max_hp);
  });

  it("has more HP than a regular enemy at the same level", () => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(generateBoss(lvl).max_hp).toBeGreaterThan(generateEnemy(lvl).max_hp);
    }
  });

  it("has higher xp_reward than a regular enemy at the same level", () => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(generateBoss(lvl).xp_reward).toBeGreaterThan(generateEnemy(lvl).xp_reward);
    }
  });

  it("has higher attack_dps than a regular enemy at the same level", () => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(generateBoss(lvl).attack_dps).toBeGreaterThan(generateEnemy(lvl).attack_dps);
    }
  });

  it("scales with dungeon level", () => {
    expect(generateBoss(10).max_hp).toBeGreaterThan(generateBoss(1).max_hp);
  });

  it("dungeonIndex increases boss HP with each successive dungeon", () => {
    const [h0, h1, h2] = [0, 1, 2].map(i => generateBoss(5, i).max_hp);
    expect(h1).toBeGreaterThan(h0);
    expect(h2).toBeGreaterThan(h1);
  });

  it("dungeonIndex increases boss attack_dps with each successive dungeon", () => {
    const [a0, a1, a2] = [0, 1, 2].map(i => generateBoss(5, i).attack_dps);
    expect(a1).toBeGreaterThan(a0);
    expect(a2).toBeGreaterThan(a1);
  });

  it("base boss attack_dps coefficient is 6.5 per dungeon level", () => {
    expect(generateBoss(10, 0).attack_dps).toBeCloseTo(65.0, 5);
    expect(generateBoss(20, 0).attack_dps).toBeCloseTo(130.0, 5);
  });

  it("dungeonIndex=0 is backward compatible", () => {
    expect(generateBoss(5, 0).max_hp).toBe(generateBoss(5).max_hp);
  });
});

describe("generateEliteEnemy", () => {
  it("isElite is true", () => {
    expect(generateEliteEnemy(5).isElite).toBe(true);
  });

  it("isBoss is false", () => {
    expect(generateEliteEnemy(5).isBoss).toBe(false);
  });

  it("level matches input", () => {
    for (const lvl of [1, 5, 10]) {
      expect(generateEliteEnemy(lvl).level).toBe(lvl);
    }
  });

  it("name contains 'Elite'", () => {
    expect(generateEliteEnemy(5).name).toContain("Elite");
  });

  it("attack_dps is ELITE_ATTACK_MULT × base (deterministic)", () => {
    const base = generateEnemy(10, 0).attack_dps;
    const elite = generateEliteEnemy(10, 0).attack_dps;
    expect(elite).toBeCloseTo(base * ELITE_ATTACK_MULT, 5);
  });

  it("max_hp is greater than base at same level", () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(generateEliteEnemy(lvl).max_hp).toBeGreaterThan(generateEnemy(lvl).max_hp);
    }
  });

  it("xp_reward is at least ELITE_REWARD_MULT × minimum base xp_reward", () => {
    // base xp = max(1, level*3 + randInt(1,4)); min at level 10 = 31
    const minBase = 10 * 3 + 1;
    expect(generateEliteEnemy(10, 0).xp_reward).toBeGreaterThanOrEqual(Math.floor(minBase * ELITE_REWARD_MULT));
  });

  it("gold_reward is greater than base gold_reward", () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(generateEliteEnemy(lvl, 0).gold_reward).toBeGreaterThan(generateEnemy(lvl, 0).gold_reward);
    }
  });

  it("hp == max_hp on spawn", () => {
    const e = generateEliteEnemy(5);
    expect(e.hp).toBe(e.max_hp);
  });

  it("dungeonIndex scales elite the same as regular enemies", () => {
    const a0 = generateEliteEnemy(10, 0).attack_dps;
    const a1 = generateEliteEnemy(10, 1).attack_dps;
    expect(a1).toBeCloseTo(a0 * (1.4 / 1.0), 4);
  });

  it("ELITE_HP_MULT, ELITE_ATTACK_MULT, ELITE_REWARD_MULT are exported and > 1", () => {
    expect(ELITE_HP_MULT).toBeGreaterThan(1);
    expect(ELITE_ATTACK_MULT).toBeGreaterThan(1);
    expect(ELITE_REWARD_MULT).toBeGreaterThan(1);
  });
});


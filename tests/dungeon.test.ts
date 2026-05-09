import { describe, expect, it } from "vitest";
import { generateEnemy, generateBoss } from "../src/dungeon.js";

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
});


import { describe, expect, it } from "vitest";
import { generateEnemy } from "../src/dungeon.js";

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
});

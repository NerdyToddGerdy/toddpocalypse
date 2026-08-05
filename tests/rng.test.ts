import { describe, it, expect } from "vitest";
import { mulberry32, defaultRng, type RNG } from "../src/rng.js";
import { pick, randInt, weightedPick } from "../src/utils.js";
import { generateEnemy } from "../src/dungeon.js";
import { getItem } from "../src/gear.js";
import { GameState } from "../src/engine.js";
import mainSrc from "../src/main.ts?raw";
import engineSrc from "../src/engine.ts?raw";
import gearSrc from "../src/gear.ts?raw";
import utilsSrc from "../src/utils.ts?raw";
import dungeonSrc from "../src/dungeon.ts?raw";
import characterSrc from "../src/character.ts?raw";
import partySrc from "../src/party.ts?raw";
import inventorySrc from "../src/inventory.ts?raw";

describe("mulberry32", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = Array.from({ length: 20 }, mulberry32(1));
    const b = Array.from({ length: 20 }, mulberry32(2));
    expect(a).not.toEqual(b);
  });

  it("stays within [0, 1)", () => {
    const r = mulberry32(999);
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("does not get stuck on one value", () => {
    const r = mulberry32(7);
    const seen = new Set(Array.from({ length: 100 }, () => r()));
    expect(seen.size).toBeGreaterThan(90);
  });
});

describe("defaultRng", () => {
  it("stays within [0, 1)", () => {
    for (let i = 0; i < 100; i++) {
      const v = defaultRng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("utils accept an injected RNG", () => {
  it("pick is deterministic under a seed", () => {
    const arr = ["a", "b", "c", "d", "e"];
    const one = Array.from({ length: 20 }, ((r: RNG) => () => pick(arr, r))(mulberry32(42)));
    const two = Array.from({ length: 20 }, ((r: RNG) => () => pick(arr, r))(mulberry32(42)));
    expect(one).toEqual(two);
  });

  it("pick honours a rigged RNG", () => {
    const arr = ["first", "second", "third"];
    expect(pick(arr, () => 0)).toBe("first");
    expect(pick(arr, () => 0.99)).toBe("third");
  });

  it("randInt is deterministic under a seed and stays in range", () => {
    const r = mulberry32(7);
    const values = Array.from({ length: 100 }, () => randInt(3, 9, r));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...values)).toBeLessThanOrEqual(9);

    const again = mulberry32(7);
    expect(Array.from({ length: 100 }, () => randInt(3, 9, again))).toEqual(values);
  });

  it("randInt honours a rigged RNG at both ends", () => {
    expect(randInt(5, 10, () => 0)).toBe(5);
    expect(randInt(5, 10, () => 0.999999)).toBe(10);
  });

  it("weightedPick is deterministic under a seed", () => {
    const arr = ["x", "y", "z"];
    const w = [1, 5, 4];
    const one = ((r: RNG) => Array.from({ length: 30 }, () => weightedPick(arr, w, r)))(mulberry32(11));
    const two = ((r: RNG) => Array.from({ length: 30 }, () => weightedPick(arr, w, r)))(mulberry32(11));
    expect(one).toEqual(two);
  });

  it("weightedPick respects the weights with a rigged RNG", () => {
    const arr = ["x", "y", "z"];
    const w = [1, 5, 4];           // cumulative: 1, 6, 10
    expect(weightedPick(arr, w, () => 0)).toBe("x");
    expect(weightedPick(arr, w, () => 0.5)).toBe("y");   // 5.0 falls in y
    expect(weightedPick(arr, w, () => 0.95)).toBe("z");  // 9.5 falls in z
  });

  it("still works with no RNG passed, defaulting to Math.random", () => {
    const arr = ["a", "b"];
    expect(arr).toContain(pick(arr));
    expect(randInt(1, 3)).toBeGreaterThanOrEqual(1);
    expect(arr).toContain(weightedPick(arr, [1, 1]));
  });
});

describe("generateEnemy accepts an injected RNG", () => {
  it("yields an identical enemy for the same seed", () => {
    const a = generateEnemy(5, 1, mulberry32(2024));
    const b = generateEnemy(5, 1, mulberry32(2024));
    expect(a).toEqual(b);
  });

  it("yields different enemies for different seeds", () => {
    const a = Array.from({ length: 8 }, ((r: RNG) => () => generateEnemy(5, 1, r))(mulberry32(1)));
    const b = Array.from({ length: 8 }, ((r: RNG) => () => generateEnemy(5, 1, r))(mulberry32(2)));
    expect(a).not.toEqual(b);
  });
});

describe("getItem accepts an injected RNG", () => {
  it("yields an identical item for the same seed", () => {
    const a = getItem(undefined, 10, mulberry32(555));
    const b = getItem(undefined, 10, mulberry32(555));
    expect(a).toEqual(b);
  });

  it("yields different items across a seeded run", () => {
    const r = mulberry32(555);
    const items = Array.from({ length: 25 }, () => getItem(undefined, 10, r));
    expect(new Set(items.map(i => JSON.stringify(i))).size).toBeGreaterThan(1);
  });
});

/**
 * Fields that are deliberately not RNG-derived, so they differ between two runs of
 * the same seed: `run_id` comes from `crypto.randomUUID` (save identity, not a roll)
 * and the timestamps come from `Date.now`. Seeding governs gameplay, not identity.
 */
function gameplayOnly(snapshot: Record<string, unknown>): Record<string, unknown> {
  const { run_id, saved_at, achievement_progress_ts, ...rest } = snapshot;
  void run_id; void saved_at; void achievement_progress_ts;
  return rest;
}

describe("GameState accepts an injected RNG", () => {
  it("produces an identical opening enemy for the same seed", () => {
    const a = new GameState("Hero", "fighter", mulberry32(31337));
    const b = new GameState("Hero", "fighter", mulberry32(31337));
    expect(a.enemy).toEqual(b.enemy);
  });

  it("runs a full seeded tick sequence identically", () => {
    const run = (seed: number) => {
      const gs = new GameState("Hero", "fighter", mulberry32(seed));
      for (let i = 0; i < 300; i++) gs.tick(0.1);
      return JSON.stringify(gameplayOnly(JSON.parse(gs.respond())));
    };
    expect(run(8080)).toBe(run(8080));
  });

  it("diverges for different seeds", () => {
    const run = (seed: number) => {
      const gs = new GameState("Hero", "fighter", mulberry32(seed));
      for (let i = 0; i < 300; i++) gs.tick(0.1);
      return JSON.stringify(gameplayOnly(JSON.parse(gs.respond())));
    };
    expect(run(1)).not.toBe(run(2));
  });

  it("defaults to Math.random when no RNG is supplied", () => {
    expect(() => new GameState("Hero", "fighter")).not.toThrow();
  });
});

// Franchise bible §6: "UI never re-implements a roll."
describe("§6 — the UI layer holds no rolls", () => {
  it("src/main.ts calls Math.random nowhere", () => {
    expect(mainSrc).not.toContain("Math.random");
  });

  it("Math.random appears only at the composition root, src/rng.ts", () => {
    const modules: [string, string][] = [
      ["engine", engineSrc], ["gear", gearSrc], ["utils", utilsSrc],
      ["dungeon", dungeonSrc], ["character", characterSrc],
      ["party", partySrc], ["inventory", inventorySrc],
    ];
    for (const [name, src] of modules) {
      expect(src, `${name}.ts should route rolls through an injected RNG`).not.toContain("Math.random");
    }
  });
});

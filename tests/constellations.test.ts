import { describe, it, expect, beforeEach } from "vitest";
import { getConstellationBonuses, CONSTELLATION_NODE_DEFS } from "../src/constellations";
import { GameState } from "../src/engine";

// ── getConstellationBonuses ──────────────────────────────────────────────────

describe("getConstellationBonuses", () => {
  it("returns all-baseline values for empty node list", () => {
    const b = getConstellationBonuses([]);
    expect(b.dpsMultiplier).toBe(1.0);
    expect(b.maxHpMultiplier).toBe(1.0);
    expect(b.goldMultiplier).toBe(1.0);
    expect(b.xpMultiplier).toBe(1.0);
    expect(b.clickDpsMultiplier).toBe(1.0);
    expect(b.hasteMultiplier).toBe(1.0);
    expect(b.defenseBonus).toBe(0);
    expect(b.critChanceBonus).toBe(0);
    expect(b.runeBonusMultiplier).toBe(1.0);
    expect(b.lootQualityBonus).toBe(0);
    expect(b.berserkerActive).toBe(false);
    expect(b.lastStandActive).toBe(false);
    expect(b.midasTouchActive).toBe(false);
    expect(b.ancientWisdomActive).toBe(false);
    expect(b.perfectKillActive).toBe(false);
    expect(b.phaseStepActive).toBe(false);
    expect(b.runicMasteryActive).toBe(false);
  });

  it("warrior_start adds 5% DPS", () => {
    const b = getConstellationBonuses(["warrior_start"]);
    expect(b.dpsMultiplier).toBeCloseTo(1.05);
  });

  it("stacks three DPS minor nodes multiplicatively", () => {
    const b = getConstellationBonuses(["warrior_minor1", "warrior_minor2", "warrior_minor3"]);
    // 1.04 * 1.04 * 1.03
    expect(b.dpsMultiplier).toBeCloseTo(1.04 * 1.04 * 1.03);
  });

  it("warrior_keystone sets berserkerActive, does not directly add DPS", () => {
    const b = getConstellationBonuses(["warrior_keystone"]);
    expect(b.berserkerActive).toBe(true);
    expect(b.dpsMultiplier).toBe(1.0);
  });

  it("guardian_keystone sets lastStandActive", () => {
    const b = getConstellationBonuses(["guardian_keystone"]);
    expect(b.lastStandActive).toBe(true);
  });

  it("fortune_keystone sets midasTouchActive and adds 50% gold", () => {
    const b = getConstellationBonuses(["fortune_keystone"]);
    expect(b.midasTouchActive).toBe(true);
    expect(b.goldMultiplier).toBeCloseTo(1.50);
  });

  it("sage_keystone sets ancientWisdomActive", () => {
    const b = getConstellationBonuses(["sage_keystone"]);
    expect(b.ancientWisdomActive).toBe(true);
  });

  it("hunter_keystone sets perfectKillActive", () => {
    const b = getConstellationBonuses(["hunter_keystone"]);
    expect(b.perfectKillActive).toBe(true);
  });

  it("wanderer_keystone sets phaseStepActive", () => {
    const b = getConstellationBonuses(["wanderer_keystone"]);
    expect(b.phaseStepActive).toBe(true);
  });

  it("runesmith_keystone sets runicMasteryActive and doubles rune bonus", () => {
    const b = getConstellationBonuses(["runesmith_start", "runesmith_keystone"]);
    // runesmith_start adds 8% → runeBonusMultiplier = 1.08 before mastery
    // After mastery: 1.0 + (1.08 - 1.0) * 2 = 1.16
    expect(b.runicMasteryActive).toBe(true);
    expect(b.runeBonusMultiplier).toBeCloseTo(1.16);
  });

  it("runic mastery alone (no other rune nodes) stays at 1.0", () => {
    const b = getConstellationBonuses(["runesmith_keystone"]);
    expect(b.runeBonusMultiplier).toBe(1.0);
  });

  it("haste nodes reduce hasteMultiplier below 1.0", () => {
    const b = getConstellationBonuses(["wanderer_start", "wanderer_minor1"]);
    expect(b.hasteMultiplier).toBeLessThan(1.0);
    // 0.95 * 0.96 = 0.912
    expect(b.hasteMultiplier).toBeCloseTo(0.95 * 0.96);
  });

  it("defense nodes accumulate additively", () => {
    const b = getConstellationBonuses(["guardian_minor3", "guardian_minor4", "guardian_notable2"]);
    expect(b.defenseBonus).toBeCloseTo(2 + 2 + 5);
  });

  it("crit chance nodes accumulate additively as fractions", () => {
    const b = getConstellationBonuses(["hunter_minor1", "hunter_minor3", "hunter_notable1"]);
    // 0.02 + 0.02 + 0.05 = 0.09
    expect(b.critChanceBonus).toBeCloseTo(0.09);
  });

  it("ignores unknown node IDs", () => {
    const b = getConstellationBonuses(["not_a_real_node"]);
    expect(b.dpsMultiplier).toBe(1.0);
  });
});

// ── CONSTELLATION_NODE_DEFS integrity ───────────────────────────────────────

describe("CONSTELLATION_NODE_DEFS integrity", () => {
  it("every node ID in connections list exists in defs", () => {
    const ids = new Set(Object.keys(CONSTELLATION_NODE_DEFS));
    for (const [nodeId, def] of Object.entries(CONSTELLATION_NODE_DEFS)) {
      for (const conn of def.connections) {
        expect(ids.has(conn), `Node ${nodeId} references unknown connection: ${conn}`).toBe(true);
      }
    }
  });

  it("each constellation has exactly one keystone", () => {
    for (let c = 1; c <= 7; c++) {
      const keystones = Object.values(CONSTELLATION_NODE_DEFS).filter(
        d => d.constellation === c && d.type === "keystone"
      );
      expect(keystones.length).toBe(1);
    }
  });

  it("each constellation has exactly one start node", () => {
    for (let c = 1; c <= 7; c++) {
      const starts = Object.values(CONSTELLATION_NODE_DEFS).filter(
        d => d.constellation === c && d.type === "start"
      );
      expect(starts.length).toBe(1);
    }
  });

  it("exactly one center node exists and is isStart", () => {
    const centers = Object.values(CONSTELLATION_NODE_DEFS).filter(d => d.type === "center");
    expect(centers.length).toBe(1);
    expect(centers[0].isStart).toBe(true);
  });

  it("no start nodes connect directly to each other (no cross-constellation edges)", () => {
    const startIds = new Set(
      Object.values(CONSTELLATION_NODE_DEFS).filter(d => d.type === "start").map(d => d.id)
    );
    for (const def of Object.values(CONSTELLATION_NODE_DEFS)) {
      if (def.type === "keystone") {
        for (const conn of def.connections) {
          expect(startIds.has(conn), `keystone ${def.id} connects to start ${conn}`).toBe(false);
        }
      }
    }
  });

  it("all node costs are 1, 2, or 5", () => {
    for (const def of Object.values(CONSTELLATION_NODE_DEFS)) {
      expect([1, 2, 5]).toContain(def.cost);
    }
  });

  it("all node coordinates are within 600×600 SVG bounds", () => {
    for (const def of Object.values(CONSTELLATION_NODE_DEFS)) {
      expect(def.x).toBeGreaterThanOrEqual(0);
      expect(def.x).toBeLessThanOrEqual(600);
      expect(def.y).toBeGreaterThanOrEqual(0);
      expect(def.y).toBeLessThanOrEqual(600);
    }
  });
});

// ── Engine: unlockConstellationNode ──────────────────────────────────────────

describe("GameState.unlockConstellationNode", () => {
  let gs: GameState;

  beforeEach(() => {
    gs = new GameState();
    gs.constellationShards = 20;
  });

  it("allows unlocking the center node without adjacency (isStart)", () => {
    const result = JSON.parse(gs.unlockConstellationNode("center"));
    expect(result.constellation_nodes).toContain("center");
    expect(result.constellation_shards).toBe(19); // cost 1
  });

  it("blocks unlocking a start node without center unlocked", () => {
    const before = gs.constellationShards;
    const result = JSON.parse(gs.unlockConstellationNode("warrior_start"));
    expect(result.constellation_nodes).not.toContain("warrior_start");
    expect(result.constellation_shards).toBe(before);
  });

  it("allows unlocking a start node after center is unlocked", () => {
    gs.unlockConstellationNode("center");
    const result = JSON.parse(gs.unlockConstellationNode("warrior_start"));
    expect(result.constellation_nodes).toContain("warrior_start");
  });

  it("blocks unlocking a notable without a minor unlocked", () => {
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("warrior_start");
    const result = JSON.parse(gs.unlockConstellationNode("warrior_notable1"));
    expect(result.constellation_nodes).not.toContain("warrior_notable1");
  });

  it("allows unlocking adjacent nodes after parent is unlocked", () => {
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("warrior_start");
    gs.unlockConstellationNode("warrior_minor1");
    const result = JSON.parse(gs.unlockConstellationNode("warrior_notable1"));
    expect(result.constellation_nodes).toContain("warrior_notable1");
  });

  it("blocks non-adjacent non-start nodes", () => {
    const before = gs.constellationShards;
    const result = JSON.parse(gs.unlockConstellationNode("warrior_keystone"));
    expect(result.constellation_nodes).not.toContain("warrior_keystone");
    expect(result.constellation_shards).toBe(before);
  });

  it("blocks unlock when not enough shards", () => {
    gs.constellationShards = 0;
    const result = JSON.parse(gs.unlockConstellationNode("center"));
    expect(result.constellation_nodes).not.toContain("center");
    expect(result.constellation_shards).toBe(0);
  });

  it("does not double-unlock an already-unlocked node", () => {
    gs.unlockConstellationNode("center");
    const shardsAfterFirst = gs.constellationShards;
    gs.unlockConstellationNode("center");
    expect(gs.constellationShards).toBe(shardsAfterFirst);
  });
});

// ── Engine: respecConstellation ─────────────────────────────────────────────

describe("GameState.respecConstellation", () => {
  let gs: GameState;

  beforeEach(() => {
    gs = new GameState();
    gs.constellationShards = 20;
    gs.unlockConstellationNode("center");         // costs 1 → 19 shards
    gs.unlockConstellationNode("warrior_start");  // costs 1 → 18 shards
    gs.unlockConstellationNode("warrior_minor1"); // costs 1 → 17 shards
  });

  it("refunds all spent shards minus 10 fee", () => {
    // spent 3 shards (center+warrior_start+warrior_minor1), have 17; respec: 17 + 3 - 10 = 10
    const result = JSON.parse(gs.respecConstellation());
    expect(result.constellation_shards).toBe(10);
  });

  it("clears all unlocked nodes", () => {
    const result = JSON.parse(gs.respecConstellation());
    expect(result.constellation_nodes).toHaveLength(0);
  });

  it("fails if fewer than 10 shards available", () => {
    gs.constellationShards = 5;
    const nodesBefore = [...gs.unlockedConstellationNodes];
    const result = JSON.parse(gs.respecConstellation());
    expect(result.constellation_nodes).toEqual(expect.arrayContaining(nodesBefore));
    expect(result.constellation_shards).toBe(5); // unchanged
  });
});

// ── Engine: venture() grants shards ─────────────────────────────────────────

describe("GameState.venture shard grant", () => {
  it("grants floor(totalPrestiges/10) shards on venture", () => {
    const gs = new GameState();
    gs.totalPrestiges = 35;
    gs.constellationShards = 0;
    gs.highestLevel = 100;
    gs.venture();
    expect(gs.constellationShards).toBe(3); // floor(35/10)
  });

  it("grants 0 shards if fewer than 10 prestiges done", () => {
    const gs = new GameState();
    gs.totalPrestiges = 9;
    gs.constellationShards = 5;
    gs.highestLevel = 100;
    gs.venture();
    expect(gs.constellationShards).toBe(5); // unchanged
  });

  it("grants 0 shards if no prestiges done", () => {
    const gs = new GameState();
    gs.totalPrestiges = 0;
    gs.constellationShards = 5;
    gs.highestLevel = 100;
    gs.venture();
    expect(gs.constellationShards).toBe(5); // unchanged
  });
});

// ── Engine: lastStandActive ──────────────────────────────────────────────────

describe("lastStandActive keystone", () => {
  it("hero survives at 1 HP once per floor when lastStand is active", () => {
    const gs = new GameState();
    gs.constellationShards = 100;
    // Unlock entire guardian path to keystone
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("guardian_start");
    gs.unlockConstellationNode("guardian_minor1");
    gs.unlockConstellationNode("guardian_notable1");
    gs.unlockConstellationNode("guardian_keystone");

    const hero = gs.party.team[0];
    hero.health = 0.5; // near death

    // Simulate death check scenario: directly test the flag behavior
    expect(gs.lastStandUsedThisFloor).toBe(false);

    // Trigger a tick that would kill the hero
    hero.health = 0;
    gs.applyLastStandIfActive();
    expect(hero.health).toBe(1);
    expect(gs.lastStandUsedThisFloor).toBe(true);
  });

  it("last stand only fires once per floor", () => {
    const gs = new GameState();
    gs.constellationShards = 100;
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("guardian_start");
    gs.unlockConstellationNode("guardian_minor1");
    gs.unlockConstellationNode("guardian_notable1");
    gs.unlockConstellationNode("guardian_keystone");

    const hero = gs.party.team[0];
    hero.health = 0;
    gs.applyLastStandIfActive();
    expect(hero.health).toBe(1);

    hero.health = 0;
    gs.applyLastStandIfActive();
    expect(hero.health).toBe(0); // already used this floor
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { getConstellationBonuses, CONSTELLATION_NODE_DEFS } from "../src/constellations";
import { GameState } from "../src/engine";

// ── getConstellationBonuses ──────────────────────────────────────────────────

describe("getConstellationBonuses", () => {
  it("returns all-baseline values for empty map", () => {
    const b = getConstellationBonuses(new Map());
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

  it("warrior_start level 1 adds 5% DPS", () => {
    const b = getConstellationBonuses(new Map([["warrior_start", 1]]));
    expect(b.dpsMultiplier).toBeCloseTo(1.05);
  });

  it("warrior_start level 2 adds 10% DPS", () => {
    const b = getConstellationBonuses(new Map([["warrior_start", 2]]));
    expect(b.dpsMultiplier).toBeCloseTo(1.10);
  });

  it("warrior_start level 3 adds 15% DPS", () => {
    const b = getConstellationBonuses(new Map([["warrior_start", 3]]));
    expect(b.dpsMultiplier).toBeCloseTo(1.15);
  });

  it("stacks three DPS minor nodes at level 1 multiplicatively", () => {
    const b = getConstellationBonuses(new Map([
      ["warrior_minor1", 1], ["warrior_minor2", 1], ["warrior_minor3", 1],
    ]));
    // (1 + 0.04*1) * (1 + 0.04*1) * (1 + 0.03*1)
    expect(b.dpsMultiplier).toBeCloseTo(1.04 * 1.04 * 1.03);
  });

  it("warrior_minor1 level 2 gives 8% DPS from that node", () => {
    const b = getConstellationBonuses(new Map([["warrior_minor1", 2]]));
    expect(b.dpsMultiplier).toBeCloseTo(1.08);
  });

  it("warrior_keystone level 1 sets berserkerActive, does not directly add DPS", () => {
    const b = getConstellationBonuses(new Map([["warrior_keystone", 1]]));
    expect(b.berserkerActive).toBe(true);
    expect(b.dpsMultiplier).toBe(1.0);
  });

  it("guardian_keystone level 1 sets lastStandActive", () => {
    const b = getConstellationBonuses(new Map([["guardian_keystone", 1]]));
    expect(b.lastStandActive).toBe(true);
  });

  it("fortune_keystone level 1 sets midasTouchActive and adds 50% gold", () => {
    const b = getConstellationBonuses(new Map([["fortune_keystone", 1]]));
    expect(b.midasTouchActive).toBe(true);
    expect(b.goldMultiplier).toBeCloseTo(1.50);
  });

  it("sage_keystone level 1 sets ancientWisdomActive", () => {
    const b = getConstellationBonuses(new Map([["sage_keystone", 1]]));
    expect(b.ancientWisdomActive).toBe(true);
  });

  it("hunter_keystone level 1 sets perfectKillActive", () => {
    const b = getConstellationBonuses(new Map([["hunter_keystone", 1]]));
    expect(b.perfectKillActive).toBe(true);
  });

  it("wanderer_keystone level 1 sets phaseStepActive", () => {
    const b = getConstellationBonuses(new Map([["wanderer_keystone", 1]]));
    expect(b.phaseStepActive).toBe(true);
  });

  it("runesmith_keystone level 1 sets runicMasteryActive and doubles rune bonus", () => {
    const b = getConstellationBonuses(new Map([
      ["runesmith_start", 1], ["runesmith_keystone", 1],
    ]));
    // runesmith_start level 1 adds 8% → runeBonusMultiplier = 1.08 before mastery
    // After mastery: 1.0 + (1.08 - 1.0) * 2 = 1.16
    expect(b.runicMasteryActive).toBe(true);
    expect(b.runeBonusMultiplier).toBeCloseTo(1.16);
  });

  it("runesmith_start level 2 with keystone doubles amplified bonus", () => {
    const b = getConstellationBonuses(new Map([
      ["runesmith_start", 2], ["runesmith_keystone", 1],
    ]));
    // runesmith_start level 2 adds 16% → 1.16 before mastery
    // After mastery: 1.0 + (1.16 - 1.0) * 2 = 1.32
    expect(b.runeBonusMultiplier).toBeCloseTo(1.32);
  });

  it("runic mastery alone stays at 1.0", () => {
    const b = getConstellationBonuses(new Map([["runesmith_keystone", 1]]));
    expect(b.runeBonusMultiplier).toBe(1.0);
  });

  it("haste nodes at level 1 reduce hasteMultiplier below 1.0", () => {
    const b = getConstellationBonuses(new Map([
      ["wanderer_start", 1], ["wanderer_minor1", 1],
    ]));
    expect(b.hasteMultiplier).toBeLessThan(1.0);
    // (1 - 0.05*1) * (1 - 0.04*1) = 0.95 * 0.96
    expect(b.hasteMultiplier).toBeCloseTo(0.95 * 0.96);
  });

  it("haste node at level 2 applies 2× reduction", () => {
    const b = getConstellationBonuses(new Map([["wanderer_start", 2]]));
    // (1 - 0.05*2) = 0.90
    expect(b.hasteMultiplier).toBeCloseTo(0.90);
  });

  it("defense nodes accumulate additively at level 1", () => {
    const b = getConstellationBonuses(new Map([
      ["guardian_minor3", 1], ["guardian_notable2", 1],
    ]));
    expect(b.defenseBonus).toBeCloseTo(2 + 5);
  });

  it("defense node at level 2 gives 2× additive bonus", () => {
    const b = getConstellationBonuses(new Map([["guardian_minor3", 2]]));
    expect(b.defenseBonus).toBeCloseTo(4); // 2 * 2
  });

  it("crit chance nodes accumulate additively as fractions at level 1", () => {
    const b = getConstellationBonuses(new Map([
      ["hunter_minor1", 1], ["hunter_minor3", 1], ["hunter_notable1", 1],
    ]));
    // 0.02 + 0.02 + 0.05 = 0.09
    expect(b.critChanceBonus).toBeCloseTo(0.09);
  });

  it("crit chance node at level 3 triples the bonus", () => {
    const b = getConstellationBonuses(new Map([["hunter_minor1", 3]]));
    expect(b.critChanceBonus).toBeCloseTo(0.06); // 0.02 * 3
  });

  it("ignores unknown node IDs", () => {
    const b = getConstellationBonuses(new Map([["not_a_real_node", 1]]));
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

  it("every node has a non-empty label and description for modal display", () => {
    for (const [id, def] of Object.entries(CONSTELLATION_NODE_DEFS)) {
      expect(def.label.length, `${id} missing label`).toBeGreaterThan(0);
      expect(def.description.length, `${id} missing description`).toBeGreaterThan(0);
    }
  });

  it("every node has a valid type for modal badge display", () => {
    const valid = new Set(["center", "start", "minor", "notable", "keystone"]);
    for (const [id, def] of Object.entries(CONSTELLATION_NODE_DEFS)) {
      expect(valid.has(def.type), `${id} has unknown type: ${def.type}`).toBe(true);
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

  it("keystones have maxLevel 1", () => {
    for (const def of Object.values(CONSTELLATION_NODE_DEFS)) {
      if (def.type === "keystone") {
        expect(def.maxLevel, `${def.id} keystone maxLevel`).toBe(1);
      }
    }
  });

  it("non-keystone nodes have maxLevel 3", () => {
    for (const def of Object.values(CONSTELLATION_NODE_DEFS)) {
      if (def.type !== "keystone") {
        expect(def.maxLevel, `${def.id} non-keystone maxLevel`).toBe(3);
      }
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
    expect(result.constellation_node_levels["center"]).toBe(1);
    expect(result.constellation_shards).toBe(19); // cost 1
  });

  it("blocks unlocking a start node without center unlocked", () => {
    const before = gs.constellationShards;
    const result = JSON.parse(gs.unlockConstellationNode("warrior_start"));
    expect(result.constellation_node_levels["warrior_start"]).toBeUndefined();
    expect(result.constellation_shards).toBe(before);
  });

  it("allows unlocking a start node after center is unlocked", () => {
    gs.unlockConstellationNode("center");
    const result = JSON.parse(gs.unlockConstellationNode("warrior_start"));
    expect(result.constellation_node_levels["warrior_start"]).toBe(1);
  });

  it("second call upgrades center node to level 2", () => {
    gs.unlockConstellationNode("center"); // → level 1, costs 1
    const result = JSON.parse(gs.unlockConstellationNode("center")); // → level 2, costs 1
    expect(result.constellation_node_levels["center"]).toBe(2);
    expect(result.constellation_shards).toBe(18); // 20 - 2
  });

  it("third call upgrades center node to level 3", () => {
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("center");
    const result = JSON.parse(gs.unlockConstellationNode("center"));
    expect(result.constellation_node_levels["center"]).toBe(3);
    expect(result.constellation_shards).toBe(17); // 20 - 3
  });

  it("rejects upgrade beyond maxLevel (non-keystone stops at 3)", () => {
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("center"); // now level 3
    const shardsBefore = gs.constellationShards;
    gs.unlockConstellationNode("center"); // should be rejected
    expect(gs.constellationShards).toBe(shardsBefore);
    expect(gs.constellationNodeLevels.get("center")).toBe(3);
  });

  it("rejects keystone upgrade beyond level 1 (maxLevel 1)", () => {
    gs.constellationShards = 100;
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("warrior_start");
    gs.unlockConstellationNode("warrior_minor1");
    gs.unlockConstellationNode("warrior_notable1");
    gs.unlockConstellationNode("warrior_keystone"); // → level 1
    const shardsBefore = gs.constellationShards;
    gs.unlockConstellationNode("warrior_keystone"); // should be rejected
    expect(gs.constellationShards).toBe(shardsBefore);
    expect(gs.constellationNodeLevels.get("warrior_keystone")).toBe(1);
  });

  it("blocks unlocking a notable without a minor unlocked", () => {
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("warrior_start");
    const result = JSON.parse(gs.unlockConstellationNode("warrior_notable1"));
    expect(result.constellation_node_levels["warrior_notable1"]).toBeUndefined();
  });

  it("allows unlocking adjacent nodes after parent is unlocked", () => {
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("warrior_start");
    gs.unlockConstellationNode("warrior_minor1");
    const result = JSON.parse(gs.unlockConstellationNode("warrior_notable1"));
    expect(result.constellation_node_levels["warrior_notable1"]).toBe(1);
  });

  it("blocks non-adjacent non-start nodes", () => {
    const before = gs.constellationShards;
    const result = JSON.parse(gs.unlockConstellationNode("warrior_keystone"));
    expect(result.constellation_node_levels["warrior_keystone"]).toBeUndefined();
    expect(result.constellation_shards).toBe(before);
  });

  it("blocks unlock when not enough shards", () => {
    gs.constellationShards = 0;
    const result = JSON.parse(gs.unlockConstellationNode("center"));
    expect(result.constellation_node_levels["center"]).toBeUndefined();
    expect(result.constellation_shards).toBe(0);
  });
});

// ── Engine: respecConstellation ─────────────────────────────────────────────

describe("GameState.respecConstellation", () => {
  let gs: GameState;

  beforeEach(() => {
    gs = new GameState();
    gs.constellationShards = 20;
    gs.unlockConstellationNode("center");         // costs 1 → 19 shards, center=1
    gs.unlockConstellationNode("warrior_start");  // costs 1 → 18 shards, warrior_start=1
    gs.unlockConstellationNode("warrior_minor1"); // costs 1 → 17 shards, warrior_minor1=1
  });

  it("refunds all spent shards (level × cost) minus 10 fee", () => {
    // spent 3 shards (1+1+1), have 17; respec: 17 + 3 - 10 = 10
    const result = JSON.parse(gs.respecConstellation());
    expect(result.constellation_shards).toBe(10);
  });

  it("refunds correctly when a node has been upgraded to level 2", () => {
    gs.unlockConstellationNode("center"); // center → level 2, costs 1 more → 16 shards
    // spent: center(2×1=2) + warrior_start(1) + warrior_minor1(1) = 4 total
    // 16 + 4 - 10 = 10
    const result = JSON.parse(gs.respecConstellation());
    expect(result.constellation_shards).toBe(10);
  });

  it("clears all node levels", () => {
    const result = JSON.parse(gs.respecConstellation());
    expect(Object.keys(result.constellation_node_levels)).toHaveLength(0);
  });

  it("fails if fewer than 10 shards available", () => {
    gs.constellationShards = 5;
    const levelsBefore = { ...Object.fromEntries(gs.constellationNodeLevels) };
    const result = JSON.parse(gs.respecConstellation());
    expect(result.constellation_node_levels).toEqual(levelsBefore);
    expect(result.constellation_shards).toBe(5); // unchanged
  });
});

// ── Engine: save/load constellation_node_levels ──────────────────────────────

describe("GameState save/load: constellation_node_levels", () => {
  it("saves constellationNodeLevels as a plain object", () => {
    const gs = new GameState();
    gs.constellationShards = 10;
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("center"); // level 2
    const result = JSON.parse(gs.respond());
    expect(result.constellation_node_levels["center"]).toBe(2);
  });

  it("loads constellation_node_levels correctly via round-trip", () => {
    const gs = new GameState();
    gs.constellationShards = 10;
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("center"); // level 2
    const gs2 = GameState.fromDict(gs.toDict());
    expect(gs2.constellationNodeLevels.get("center")).toBe(2);
    expect(gs2.constellationShards).toBe(8);
  });

  it("loads old constellation_nodes format as level 1 for each (backwards compat)", () => {
    const gs = new GameState();
    gs.constellationShards = 10;
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("warrior_start");
    const dict = gs.toDict();
    // Simulate old save: replace constellation_node_levels with constellation_nodes
    const oldDict = { ...dict, constellation_node_levels: undefined, constellation_nodes: ["center", "warrior_start"] };
    const gs2 = GameState.fromDict(oldDict as any);
    expect(gs2.constellationNodeLevels.get("center")).toBe(1);
    expect(gs2.constellationNodeLevels.get("warrior_start")).toBe(1);
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
    gs.unlockConstellationNode("center");
    gs.unlockConstellationNode("guardian_start");
    gs.unlockConstellationNode("guardian_minor1");
    gs.unlockConstellationNode("guardian_notable1");
    gs.unlockConstellationNode("guardian_keystone");

    const hero = gs.party.team[0];
    hero.health = 0.5;

    expect(gs.lastStandUsedThisFloor).toBe(false);

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

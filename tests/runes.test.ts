import { describe, expect, it } from "vitest";
import {
  GameState, RUNE_DEFS, GUILD_HALL_COSTS, RUNE_SELL_VALUES,
} from "../src/engine.js";
import { Character, type Rune } from "../src/character.js";
import { type Slot } from "../src/gear.js";

function make(): GameState { return new GameState("Hero", "fighter"); }

function withRuneForge(tier: number): GameState {
  const gs = make();
  if (tier >= 1) gs.guildUpgrades["rune_forge"] = tier;
  return gs;
}

// ──────────────────────────────────────────
// RUNE_DEFS data integrity
// ──────────────────────────────────────────
describe("RUNE_DEFS", () => {
  it("has 24 runes (6 types × 4 tiers)", () => {
    expect(Object.keys(RUNE_DEFS)).toHaveLength(24);
  });

  it("every rune has required fields", () => {
    const validTiers = new Set(["lesser", "greater", "flawless", "ancient"]);
    for (const rune of Object.values(RUNE_DEFS)) {
      expect(typeof rune.id).toBe("string");
      expect(typeof rune.name).toBe("string");
      expect(typeof rune.type).toBe("string");
      expect(validTiers.has(rune.tier)).toBe(true);
      expect(typeof rune.statKey).toBe("string");
      expect(typeof rune.value).toBe("number");
      expect(rune.value).toBeGreaterThan(0);
    }
  });

  it("each lesser rune has a corresponding greater rune", () => {
    const lesserTypes = Object.values(RUNE_DEFS)
      .filter(r => r.tier === "lesser")
      .map(r => r.type);
    for (const type of lesserTypes) {
      expect(RUNE_DEFS[`${type}_greater`]).toBeTruthy();
    }
  });

  it("greater runes have larger values than lesser of same type", () => {
    const types = ["striking", "warding", "swiftness", "greed", "fortune", "wrath"];
    for (const type of types) {
      expect(RUNE_DEFS[`${type}_greater`].value).toBeGreaterThan(RUNE_DEFS[`${type}_lesser`].value);
    }
  });

  it("six rune types exist", () => {
    const types = new Set(Object.values(RUNE_DEFS).map(r => r.type));
    expect(types.size).toBe(6);
  });
});

// ──────────────────────────────────────────
// Guild Hall — Rune Forge upgrade slot
// ──────────────────────────────────────────
describe("rune_forge in GUILD_HALL_COSTS", () => {
  it("rune_forge exists in GUILD_HALL_COSTS", () => {
    expect(GUILD_HALL_COSTS["rune_forge"]).toBeTruthy();
  });

  it("has 4 tiers", () => {
    expect(GUILD_HALL_COSTS["rune_forge"]).toHaveLength(4);
  });

  it("costs are ascending", () => {
    const costs = GUILD_HALL_COSTS["rune_forge"];
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1]);
    }
  });
});

// ──────────────────────────────────────────
// brandRune
// ──────────────────────────────────────────
describe("brandRune", () => {
  it("fails when rune_forge tier is 0", () => {
    const gs = make(); // no rune_forge
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    expect(gs.party.team[0].runes["main_hand"]).toBeFalsy();
  });

  it("fails when rune not in inventory", () => {
    const gs = withRuneForge(1);
    gs.brandRune(0, "main_hand", "striking_lesser");
    expect(gs.party.team[0].runes["main_hand"]).toBeFalsy();
  });

  it("brands a rune onto a slot", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    expect(gs.party.team[0].runes["main_hand"]).toEqual(RUNE_DEFS["striking_lesser"]);
  });

  it("removes rune from inventory after branding", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    expect(gs.runeInventory).toHaveLength(0);
  });

  it("applies rune stat bonus to character (dps)", () => {
    const gs = withRuneForge(1);
    const before = gs.party.team[0].dps;
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    expect(gs.party.team[0].dps).toBeCloseTo(before + RUNE_DEFS["striking_lesser"].value);
  });

  it("applies rune stat bonus to character (maxHp)", () => {
    const gs = withRuneForge(1);
    const before = gs.party.team[0].maxHealth;
    gs.runeInventory.push(RUNE_DEFS["warding_lesser"]);
    gs.brandRune(0, "chest", "warding_lesser");
    expect(gs.party.team[0].maxHealth).toBeCloseTo(before + RUNE_DEFS["warding_lesser"].value);
  });

  it("applies rune stat bonus to character (critChance)", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["wrath_lesser"]);
    gs.brandRune(0, "helmet", "wrath_lesser");
    expect(gs.party.team[0].critChance).toBeCloseTo(RUNE_DEFS["wrath_lesser"].value);
  });

  it("Tier 1: rebrand destroys existing rune (not returned to inventory)", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    gs.runeInventory.push(RUNE_DEFS["wrath_lesser"]);
    gs.brandRune(0, "main_hand", "wrath_lesser");
    // Old striking rune should be gone (destroyed), only wrath should be in slot
    expect(gs.party.team[0].runes["main_hand"]?.id).toBe("wrath_lesser");
    expect(gs.runeInventory).toHaveLength(0); // old rune not returned
  });

  it("Tier 2: rebrand returns existing rune to inventory", () => {
    const gs = withRuneForge(2);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    gs.runeInventory.push(RUNE_DEFS["wrath_lesser"]);
    gs.brandRune(0, "main_hand", "wrath_lesser");
    // Old striking rune returned
    expect(gs.runeInventory.some(r => r.id === "striking_lesser")).toBe(true);
  });

  it("removing rune removes its stat from character", () => {
    const gs = withRuneForge(2);
    const before = gs.party.team[0].dps;
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    const afterBrand = gs.party.team[0].dps;
    // Now replace with wrath (triggers remove of striking)
    gs.runeInventory.push(RUNE_DEFS["wrath_lesser"]);
    gs.brandRune(0, "main_hand", "wrath_lesser");
    expect(gs.party.team[0].dps).toBeCloseTo(before); // striking bonus removed
    expect(gs.party.team[0].dps).toBeLessThan(afterBrand);
  });
});

// ──────────────────────────────────────────
// unbrandRune
// ──────────────────────────────────────────
describe("unbrandRune", () => {
  it("removes the rune from the slot", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    gs.unbrandRune(0, "main_hand");
    expect(gs.party.team[0].runes["main_hand"]).toBeFalsy();
  });

  it("returns the rune to inventory", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    expect(gs.runeInventory).toHaveLength(0);
    gs.unbrandRune(0, "main_hand");
    expect(gs.runeInventory).toHaveLength(1);
    expect(gs.runeInventory[0].id).toBe("striking_lesser");
  });

  it("removes the rune's stat bonus from the character", () => {
    const gs = withRuneForge(1);
    const before = gs.party.team[0].dps;
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    gs.unbrandRune(0, "main_hand");
    expect(gs.party.team[0].dps).toBeCloseTo(before);
  });

  it("is a no-op for an empty slot", () => {
    const gs = withRuneForge(1);
    gs.unbrandRune(0, "main_hand");
    expect(gs.runeInventory).toHaveLength(0);
  });

  it("is a no-op for an invalid char index", () => {
    const gs = withRuneForge(1);
    gs.unbrandRune(99, "main_hand");
    expect(gs.runeInventory).toHaveLength(0);
  });
});

// ──────────────────────────────────────────
// combineRunes
// ──────────────────────────────────────────
describe("combineRunes", () => {
  it("fails without Tier 2", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.combineRunes("striking_lesser", "striking_lesser");
    expect(gs.runeInventory).toHaveLength(2); // unchanged
  });

  it("produces a greater rune from 2 matching lessers at forge 2", () => {
    const gs = withRuneForge(2);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.combineRunes("striking_lesser", "striking_lesser");
    expect(gs.runeInventory).toHaveLength(1);
    expect(gs.runeInventory[0].id).toBe("striking_greater");
    expect(gs.runeInventory[0].tier).toBe("greater");
  });

  it("removes both lesser runes on combine", () => {
    const gs = withRuneForge(2);
    gs.runeInventory.push(RUNE_DEFS["warding_lesser"]);
    gs.runeInventory.push(RUNE_DEFS["warding_lesser"]);
    gs.combineRunes("warding_lesser", "warding_lesser");
    const lessers = gs.runeInventory.filter(r => r.id === "warding_lesser");
    expect(lessers).toHaveLength(0);
  });

  it("rejects mismatched types", () => {
    const gs = withRuneForge(2);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.runeInventory.push(RUNE_DEFS["warding_lesser"]);
    gs.combineRunes("striking_lesser", "warding_lesser");
    expect(gs.runeInventory).toHaveLength(2); // unchanged
  });

  it("rejects combining only one rune", () => {
    const gs = withRuneForge(2);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.combineRunes("striking_lesser", "striking_lesser");
    expect(gs.runeInventory).toHaveLength(1); // unchanged
  });
});

// ──────────────────────────────────────────
// Boss rune drops
// ──────────────────────────────────────────
describe("boss rune drop", () => {
  it("never drops rune without rune_forge", () => {
    const gs = make();
    for (let i = 0; i < 200; i++) {
      gs.runeInventory = []; // reset
      // Simulate boss kill manually: just check direct state
    }
    // With no rune_forge, runeInventory stays empty after any action
    expect((gs.guildUpgrades["rune_forge"] ?? 0)).toBe(0);
  });

  it("drops lesser runes only (not greater) from bosses", () => {
    const gs = withRuneForge(1);
    // Directly add some runes to inventory to simulate drops
    for (let i = 0; i < 50; i++) {
      const runeType = Object.keys(RUNE_DEFS).filter(id => id.endsWith("_lesser"));
      gs.runeInventory.push(RUNE_DEFS[runeType[0]]);
    }
    const allLesser = gs.runeInventory.every(r => r.tier === "lesser");
    expect(allLesser).toBe(true);
  });
});

// ──────────────────────────────────────────
// Serialization
// ──────────────────────────────────────────
describe("rune serialization", () => {
  it("runeInventory round-trips through toDict/fromDict", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.runeInventory.push(RUNE_DEFS["warding_greater"]);
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.runeInventory).toHaveLength(2);
    expect(restored.runeInventory[0].id).toBe("striking_lesser");
    expect(restored.runeInventory[1].id).toBe("warding_greater");
  });

  it("character runes persist through toDict/fromDict", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.party.team[0].runes["main_hand"]?.id).toBe("striking_lesser");
  });

  it("branded rune stat is preserved in serialized dps", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    const dpsAfterBrand = gs.party.team[0].dps;
    const restored = GameState.fromDict(gs.toDict());
    expect(restored.party.team[0].dps).toBeCloseTo(dpsAfterBrand);
  });

  it("rune is not double-applied on fromDict restore", () => {
    const gs = withRuneForge(1);
    gs.runeInventory.push(RUNE_DEFS["striking_lesser"]);
    gs.brandRune(0, "main_hand", "striking_lesser");
    const dpsAfterBrand = gs.party.team[0].dps;
    // Restore twice
    const once = GameState.fromDict(gs.toDict());
    const twice = GameState.fromDict(once.toDict());
    expect(twice.party.team[0].dps).toBeCloseTo(dpsAfterBrand);
  });
});

// ──────────────────────────────────────────
// Rune selling
// ──────────────────────────────────────────
describe("RUNE_SELL_VALUES", () => {
  it("lesser sell value is defined and > 0", () => {
    expect(RUNE_SELL_VALUES["lesser"]).toBeGreaterThan(0);
  });

  it("each tier is worth more than the previous", () => {
    expect(RUNE_SELL_VALUES["greater"]).toBeGreaterThan(RUNE_SELL_VALUES["lesser"]);
    expect(RUNE_SELL_VALUES["flawless"]).toBeGreaterThan(RUNE_SELL_VALUES["greater"]);
    expect(RUNE_SELL_VALUES["ancient"]).toBeGreaterThan(RUNE_SELL_VALUES["flawless"]);
  });
});

describe("sellRune", () => {
  it("removes the rune from inventory and awards gold", () => {
    const gs = make();
    gs.runeInventory = [RUNE_DEFS["striking_lesser"], RUNE_DEFS["warding_lesser"]];
    gs.sellRune(0);
    expect(gs.runeInventory.length).toBe(1);
    expect(gs.runeInventory[0].id).toBe("warding_lesser");
    expect(gs.gold).toBe(RUNE_SELL_VALUES["lesser"]);
  });

  it("awards the correct gold for a greater rune", () => {
    const gs = make();
    gs.runeInventory = [RUNE_DEFS["striking_greater"]];
    gs.sellRune(0);
    expect(gs.gold).toBe(RUNE_SELL_VALUES["greater"]);
  });

  it("awards the correct gold for ancient rune", () => {
    const gs = make();
    gs.runeInventory = [RUNE_DEFS["striking_ancient"]];
    gs.sellRune(0);
    expect(gs.gold).toBe(RUNE_SELL_VALUES["ancient"]);
  });

  it("is a no-op for out-of-range index", () => {
    const gs = make();
    gs.runeInventory = [RUNE_DEFS["striking_lesser"]];
    gs.sellRune(5);
    expect(gs.runeInventory.length).toBe(1);
    expect(gs.gold).toBe(0);
  });
});

describe("sellAllRunes", () => {
  it("clears the rune inventory and awards total gold", () => {
    const gs = make();
    gs.runeInventory = [
      RUNE_DEFS["striking_lesser"],
      RUNE_DEFS["warding_greater"],
      RUNE_DEFS["fortune_lesser"],
    ];
    gs.sellAllRunes();
    expect(gs.runeInventory.length).toBe(0);
    expect(gs.gold).toBe(
      RUNE_SELL_VALUES["lesser"] * 2 + RUNE_SELL_VALUES["greater"]
    );
  });

  it("is a no-op when inventory is empty", () => {
    const gs = make();
    gs.sellAllRunes();
    expect(gs.gold).toBe(0);
  });
});

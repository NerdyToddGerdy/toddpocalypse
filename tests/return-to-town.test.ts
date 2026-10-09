import { describe, expect, it } from "vitest";
import { GameState, RUNE_DEFS, startingGoldForLevel } from "../src/engine.js";
import { getItem } from "../src/gear.js";
import { mulberry32 } from "../src/rng.js";

/**
 * #58 / bible §5.5 "the world outlives the character". The Return to Town
 * dialog lists what you keep and what starts over; each claim is checked here
 * against what prestige() actually does, so the dialog can't promise more.
 */

/** A mid-game state with something in every kept system. */
function midGame(): GameState {
  const gs = new GameState("Aldric", "fighter", mulberry32(3));
  gs.highestLevel = 25;
  gs.dungeonLevel = 25;
  gs.dungeonIndex = 1;
  gs.prestigePoints = 40;
  gs.prestigeUpgrades = { guild_hall_access: 1, party_slot_2: 1 };
  gs.prestigePartyClasses = { slot_2: "rogue" };
  gs.buyPrestigeUpgrade("party_slot_2", "rogue");
  gs.guildUpgrades = { rune_forge: 1 };
  gs.constellationNodeLevels = new Map([["nexus", 1]]);
  const lead = gs.party.team[0];
  lead.equipItem(getItem("main_hand", 10, mulberry32(4)));
  lead.applyRune("main_hand", RUNE_DEFS.striking_lesser);
  lead.level = 12;
  gs.runeInventory = [RUNE_DEFS.warding_lesser];
  gs.artifactInventory = [{ id: "bloodstone", level: 1, fuel: 0 }];
  gs.gearStash = [getItem("helmet", 10, mulberry32(5))];
  gs.autoSellQualities = ["broken"];
  gs.upgrades.Aldric.dps = 3;
  gs.gold = 5000;
  gs.lifetimeKills = 900;
  gs.consumableCharges = { whetstone: 4 };
  return gs;
}

type Check = (before: GameState, after: GameState, beforeSnapshot: Snapshot) => void;
interface Snapshot { prestigePoints: number; renown: number; leadRune?: string; runeInv: number; artifacts: string; stash: number; dungeonIndex: number; guild: string; stars: string; lifetimeKills: number }

function snapshot(gs: GameState): Snapshot {
  return {
    prestigePoints: gs.prestigePoints,
    renown: gs.prestigePointsPreview(),
    leadRune: gs.party.team[0].runes.main_hand?.id,
    runeInv: gs.runeInventory.length,
    artifacts: JSON.stringify(gs.artifactInventory),
    stash: gs.gearStash.length,
    dungeonIndex: gs.dungeonIndex,
    guild: JSON.stringify(gs.guildUpgrades),
    stars: JSON.stringify([...gs.constellationNodeLevels]),
    lifetimeKills: gs.lifetimeKills,
  };
}

const KEEP_CHECKS: Record<string, Check> = {
  renown: (_b, a, s) => expect(a.prestigePoints).toBe(s.prestigePoints + s.renown),
  guild: (_b, a, s) => expect(JSON.stringify(a.guildUpgrades)).toBe(s.guild),
  constellations: (_b, a, s) => expect(JSON.stringify([...a.constellationNodeLevels])).toBe(s.stars),
  dungeon: (_b, a, s) => expect(a.dungeonIndex).toBe(s.dungeonIndex),
  runes: (_b, a, s) => {
    expect(a.party.team[0].runes.main_hand?.id).toBe(s.leadRune);
    expect(a.runeInventory.length).toBe(s.runeInv);
  },
  artifacts: (_b, a, s) => expect(JSON.stringify(a.artifactInventory)).toBe(s.artifacts),
  stash: (_b, a, s) => expect(a.gearStash.length).toBe(s.stash),
  records: (_b, a, s) => expect(a.lifetimeKills).toBeGreaterThanOrEqual(s.lifetimeKills),
  companions: (_b, a) => expect(a.party.team[1]?.characterClass).toBe("rogue"),
};

const RESET_CHECKS: Record<string, Check> = {
  floor: (_b, a) => expect(a.dungeonLevel).toBe(1),
  levels: (_b, a) => a.party.team.forEach((c) => expect(c.level).toBe(1)),
  gear: (_b, a) => {
    a.party.team.forEach((c) => expect(c.inventory.equippedItems()).toHaveLength(0));
    expect(a.lootPool).toHaveLength(0);
  },
  upgrades: (_b, a) => expect(a.upgrades[a.party.team[0].name].dps).toBe(0),
  // Feat rewards paid on arrival can top this up, so it's a floor, not an exact sum.
  gold: (_b, a) => {
    expect(a.gold).toBeGreaterThanOrEqual(startingGoldForLevel(a.prestigeUpgrades["starting_gold"] ?? 0));
    expect(a.gold).toBeLessThan(5000);
  },
  autosell: (_b, a) => expect(a.autoSellQualities).toHaveLength(0),
  consumables: (_b, a) => expect(Object.values(a.consumableCharges).every((n) => !n)).toBe(true),
};

describe("returnToTownSummary", () => {
  it("states the renown you'd earn, matching prestige()", () => {
    const gs = midGame();
    expect(gs.returnToTownSummary().renown).toBe(gs.prestigePointsPreview());
  });

  it("every 'you keep' claim holds after prestige()", () => {
    const gs = midGame();
    const summary = gs.returnToTownSummary();
    const s = snapshot(gs);
    gs.prestige();
    for (const item of summary.keep) {
      expect(KEEP_CHECKS[item.key], `no check for keep claim "${item.key}"`).toBeDefined();
      KEEP_CHECKS[item.key](gs, gs, s);
    }
  });

  it("every 'starts over' claim holds after prestige()", () => {
    const gs = midGame();
    const summary = gs.returnToTownSummary();
    const s = snapshot(gs);
    gs.prestige();
    for (const item of summary.reset) {
      expect(RESET_CHECKS[item.key], `no check for reset claim "${item.key}"`).toBeDefined();
      RESET_CHECKS[item.key](gs, gs, s);
    }
  });

  it("a mid-game state lists every system it has", () => {
    const keys = midGame().returnToTownSummary().keep.map((k) => k.key);
    expect(keys).toEqual(expect.arrayContaining(Object.keys(KEEP_CHECKS)));
  });

  it("only mentions systems you actually have", () => {
    const fresh = new GameState("Hero", "fighter", mulberry32(1));
    const keys = fresh.returnToTownSummary().keep.map((k) => k.key);
    for (const k of ["guild", "constellations", "dungeon", "runes", "artifacts", "stash", "companions"]) {
      expect(keys).not.toContain(k);
    }
    expect(keys).toContain("renown");
  });

  it("names the starting gold", () => {
    const gold = midGame().returnToTownSummary().reset.find((r) => r.key === "gold")!;
    expect(gold.label).toContain(startingGoldForLevel(0).toLocaleString("en-US"));
  });
});

describe("Return to Town dialog wiring", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
  const mainTs = read("../src/main.ts");
  const html = read("../public/index.html");

  it("replaces the browser confirm() with an in-game dialog", () => {
    expect(mainTs).not.toMatch(/confirm\(`Return to Town\?/);
    expect(mainTs).toMatch(/buildReturnToTownHTML\(game\.returnToTownSummary\(\)\)/);
  });

  it("opens on Cancel, since leaving resets the run", () => {
    expect(html).toMatch(/<button id="return-town-cancel"[^>]*data-autofocus/);
  });
});

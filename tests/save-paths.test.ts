import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deviceClaimError } from "../src/ui/html.js";

const mainTs = readFileSync(fileURLToPath(new URL("../src/main.ts", import.meta.url)), "utf8");

// v2.49.0 split the live snapshot (respond(), with derived breakdowns) from the
// save format (saveJson()). Every path that persists state must use the latter.
describe("saves use the save format", () => {
  it("claiming the active device saves state, not the live snapshot", () => {
    const fn = mainTs.slice(mainTs.indexOf("async function setActiveDevice"), mainTs.indexOf("/** Pulls the latest save"));
    expect(fn).toContain("game.saveJson()");
    expect(fn).not.toContain("game.respond()");
  });

  it("retiring stores the save format", () => {
    const handler = mainTs.slice(mainTs.indexOf('$("retire-confirm-yes")'));
    expect(handler.slice(0, 600)).toMatch(/localStorage\.setItem\(SAVE_KEY, game\.saveJson\(\)\)/);
  });

  it("a hard reset sends a fresh save, not a fresh snapshot, to the cloud", () => {
    expect(mainTs).not.toContain("new GameState().respond()");
    expect(mainTs).toContain("new GameState().saveJson()");
  });
});

// #48: a failed device claim must reach the player, not only the console.
describe("device claim failures are shown", () => {
  it("both buttons go through one handler that reports errors", () => {
    expect(mainTs.match(/setActiveDevice\(\)\.catch/g) ?? []).toHaveLength(1);
    expect(mainTs).toMatch(/showCloudStatus\(deviceClaimError\(e\), true\)/);
  });

  it("the message says what failed and what to do", () => {
    const msg = deviceClaimError(new Error("QuotaExceededError"));
    expect(msg).toMatch(/couldn't make this the active device/i);
    expect(msg).toContain("QuotaExceededError");
    expect(msg).toMatch(/try again/i);
  });

  it("copes with a thrown non-Error", () => {
    expect(deviceClaimError("boom")).toContain("boom");
  });
});

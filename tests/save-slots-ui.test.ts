import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { saveSlotsHTML } from "../src/ui/html.js";

/** Settings → Cloud Save: the five slots, what's in each, and what you can do with it. */
const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");

const slots = [
  { slot: 1, name: "Main <run>", updatedAt: "2026-10-03T12:00:00Z", summary: { hero: "Aldric", cls: "fighter", level: 29, best: 44 } },
  { slot: 2, empty: true as const },
  { slot: 3, name: "Backup", updatedAt: "2026-10-01T12:00:00Z", summary: null },
  { slot: 4, empty: true as const },
  { slot: 5, empty: true as const },
];
const html = saveSlotsHTML(slots, 1);
const row = (n: number) => html.match(new RegExp(`<li class="save-slot[^"]*" data-slot="${n}">[\\s\\S]*?</li>`))![0];

describe("saveSlotsHTML", () => {
  it("lists five slots in order", () => {
    expect([...html.matchAll(/<li[^>]*data-slot="(\d)"/g)].map((m) => m[1])).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("names each slot, escaped, and describes what's in it", () => {
    expect(row(1)).toContain("Main &lt;run&gt;");
    expect(row(1)).toContain("Aldric, level 29 fighter");
    expect(row(1)).toContain("best floor 44");
  });

  it("marks the slot you're playing; it can be renamed but not played, copied over or deleted", () => {
    expect(row(1)).toMatch(/class="save-slot playing"/);
    expect(row(1)).toContain("Playing");
    expect(row(1)).toContain('data-action="slot-rename"');
    expect(row(1)).not.toContain('data-action="slot-play"');
    expect(row(1)).not.toContain('data-action="slot-delete"');
  });

  it("another filled slot can be played, renamed or deleted", () => {
    for (const a of ["slot-play", "slot-rename", "slot-delete"]) expect(row(3)).toContain(`data-action="${a}"`);
  });

  it("an empty slot offers a new game or a copy of this one", () => {
    expect(row(2)).toMatch(/class="save-slot empty"/);
    expect(row(2)).toContain("Empty slot");
    expect(row(2)).toContain('data-action="slot-new"');
    expect(row(2)).toContain('data-action="slot-copy"');
    expect(row(2)).not.toContain('data-action="slot-delete"');
  });

  it("every button names its slot for screen readers", () => {
    for (const m of html.matchAll(/<button[^>]*>/g)) expect(m[0]).toMatch(/aria-label="[^"]+"/);
  });
});

describe("wiring", () => {
  const indexHtml = read("../public/index.html");
  const mainTs = read("../src/main.ts");

  it("has a slot list in the signed-in cloud settings", () => {
    const signedIn = indexHtml.slice(indexHtml.indexOf('id="cloud-signout-row"'), indexHtml.indexOf('id="cloud-status-msg"'));
    expect(signedIn).toContain('<ul id="save-slots"');
  });

  it("renders the list from the API and handles each action", () => {
    expect(mainTs).toMatch(/saveSlotsHTML\(/);
    expect(mainTs).toMatch(/cloudListSlots\(/);
    for (const a of ["slot-play", "slot-new", "slot-copy", "slot-rename", "slot-delete"]) expect(mainTs).toContain(`"${a}"`);
  });

  it("explains, rather than redirecting, when this address can't sign in", () => {
    expect(mainTs).toMatch(/const url = getLoginUrl\(\);\s*if \(url\) window\.location\.href = url;\s*else showSignInUnavailable\(btn\);/);
  });

  it("doesn't let a pending autosave overwrite the slot being switched to", () => {
    expect(mainTs).toMatch(/if \(!game \|\| switchingSlot\) return;/);
  });
});

// Sign-in sits in the header dropdown, not two levels down in Settings.
describe("account in the header dropdown", () => {
  const indexHtml = read("../public/index.html");
  const mainTs = read("../src/main.ts");
  const dropdown = indexHtml.slice(indexHtml.indexOf('<div id="profile-picker-dropdown"'), indexHtml.indexOf('<div class="pdd-divider">'));

  it("is the first thing in the menu", () => {
    expect(dropdown.indexOf('data-action="cloud-sign-in"')).toBeGreaterThan(-1);
    expect(dropdown.indexOf('data-action="cloud-sign-in"')).toBeLessThan(dropdown.indexOf('data-action="open-customize-modal"'));
  });

  it("offers Save slots and Sign out once signed in", () => {
    expect(dropdown).toMatch(/<button[^>]*id="pdd-slots-btn"[^>]*data-action="open-save-slots"[^>]*hidden/);
    expect(dropdown).toMatch(/<button[^>]*id="pdd-signout-btn"[^>]*data-action="cloud-sign-out"[^>]*hidden/);
  });

  it("swaps sign-in for the signed-in items", () => {
    expect(mainTs).toMatch(/\$\("pdd-signin-btn"\)\.hidden = signedIn;/);
    expect(mainTs).toMatch(/\$\("pdd-slots-btn"\)\.hidden = !signedIn;/);
    expect(mainTs).toMatch(/\$\("pdd-signout-btn"\)\.hidden = !signedIn;/);
  });

  it("Save slots opens Settings at the slot list", () => {
    expect(mainTs).toMatch(/action === "open-save-slots"[\s\S]{0,300}openSettings\(\);[\s\S]{0,200}save-slots[\s\S]{0,80}scrollIntoView/);
  });

  it("every sign-in button goes through one function", () => {
    expect(mainTs).toMatch(/function startSignIn\(btn: HTMLElement\): void/);
    expect(mainTs).toMatch(/action === "cloud-sign-in"[\s\S]{0,200}startSignIn\(btn\)/);
  });
});

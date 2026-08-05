import { describe, it, expect } from "vitest";
import { THEMES, DEFAULT_THEME, LEGACY_THEME_ALIASES, resolveTheme, isTheme } from "../src/theme.js";
import { THEME_UNLOCKS } from "../src/engine.js";

describe("THEMES", () => {
  it("contains torchlight, the canonical franchise look", () => {
    expect(THEMES).toContain("torchlight");
  });

  it("no longer exposes the pre-rename tavern id", () => {
    expect(THEMES).not.toContain("tavern");
  });

  it("still offers all eight looks", () => {
    expect(THEMES).toHaveLength(8);
  });
});

describe("DEFAULT_THEME", () => {
  it("is torchlight, not the old arcane default", () => {
    expect(DEFAULT_THEME).toBe("torchlight");
  });

  it("is itself a valid theme", () => {
    expect(THEMES).toContain(DEFAULT_THEME);
  });
});

describe("resolveTheme", () => {
  it("defaults when nothing is stored", () => {
    expect(resolveTheme(null)).toBe("torchlight");
  });

  it("defaults on an empty string", () => {
    expect(resolveTheme("")).toBe("torchlight");
  });

  it("defaults on an unrecognised value", () => {
    expect(resolveTheme("not-a-theme")).toBe("torchlight");
  });

  // §6: never drop stored player state on a rename — read-old-write-new.
  it("migrates the legacy tavern id to torchlight", () => {
    expect(resolveTheme("tavern")).toBe("torchlight");
  });

  it("preserves every other saved theme untouched", () => {
    for (const theme of THEMES) {
      expect(resolveTheme(theme)).toBe(theme);
    }
  });

  it("does not silently rewrite a player off a cold theme", () => {
    expect(resolveTheme("frost-crypt")).toBe("frost-crypt");
    expect(resolveTheme("arcane")).toBe("arcane");
  });
});

describe("LEGACY_THEME_ALIASES", () => {
  it("maps every alias onto a real theme", () => {
    for (const target of Object.values(LEGACY_THEME_ALIASES)) {
      expect(THEMES).toContain(target);
    }
  });

  it("never aliases an id that is still live", () => {
    for (const alias of Object.keys(LEGACY_THEME_ALIASES)) {
      expect(THEMES).not.toContain(alias);
    }
  });
});

describe("isTheme", () => {
  it("accepts live themes", () => {
    expect(isTheme("torchlight")).toBe(true);
    expect(isTheme("necropolis")).toBe(true);
  });

  it("rejects retired ids and junk", () => {
    expect(isTheme("tavern")).toBe(false);
    expect(isTheme("")).toBe(false);
    expect(isTheme("light")).toBe(false);
  });
});

describe("THEME_UNLOCKS agrees with the theme module", () => {
  it("offers torchlight to brand-new players, since it is the default", () => {
    const torchlight = THEME_UNLOCKS.find(t => t.theme === "torchlight");
    expect(torchlight).toBeDefined();
    expect(torchlight!.prestiges).toBe(0);
  });

  it("lists the default first", () => {
    expect(THEME_UNLOCKS[0].theme).toBe(DEFAULT_THEME);
  });

  it("has an unlock row for every theme, and no orphans", () => {
    expect(THEME_UNLOCKS.map(t => t.theme).sort()).toEqual([...THEMES].sort());
  });
});

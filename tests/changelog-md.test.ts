import { describe, expect, it } from "vitest";
import onDisk from "../CHANGELOG.md?raw";
import { renderChangelogMarkdown, GENERATED_NOTICE } from "../src/changelog-md.js";
import { CHANGELOG, VERSION } from "../src/changelog.js";
import type { ChangelogEntry } from "../src/changelog.js";

const fixture: ChangelogEntry[] = [
  { version: "v2.0.0", date: "2026-01-02", changes: ["Second thing", "Third thing"] },
  { version: "v1.0.0", date: "2026-01-01", changes: ["First thing"] },
];

describe("renderChangelogMarkdown", () => {
  it("writes one dated section per entry, newest first", () => {
    const md = renderChangelogMarkdown(fixture);
    expect(md).toContain("## v2.0.0 — 2026-01-02");
    expect(md).toContain("## v1.0.0 — 2026-01-01");
    expect(md.indexOf("v2.0.0")).toBeLessThan(md.indexOf("v1.0.0"));
  });

  it("renders each change as a bullet", () => {
    const md = renderChangelogMarkdown(fixture);
    expect(md).toContain("- Second thing\n- Third thing");
  });

  it("marks the file as generated so nobody hand-edits it", () => {
    expect(renderChangelogMarkdown(fixture)).toContain(GENERATED_NOTICE);
  });

  it("ends with exactly one trailing newline", () => {
    const md = renderChangelogMarkdown(fixture);
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
  });

  it("escapes nothing but keeps entries verbatim", () => {
    const md = renderChangelogMarkdown([
      { version: "v1.0.0", date: "2026-01-01", changes: ["Fixed `tick()` — 50% faster"] },
    ]);
    expect(md).toContain("- Fixed `tick()` — 50% faster");
  });
});

describe("CHANGELOG.md", () => {
  it("is in sync with src/changelog.ts — run `npm run changelog` if this fails", () => {
    expect(onDisk).toBe(renderChangelogMarkdown(CHANGELOG));
  });

  it("leads with the current VERSION", () => {
    expect(onDisk).toContain(`## ${VERSION} — `);
    expect(CHANGELOG[0].version).toBe(VERSION);
  });
});

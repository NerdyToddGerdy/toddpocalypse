import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// #63, franchise bible §6: "Never rename a storage key without a read-old-write-new
// migration … Both keys carry a comment." These keep the pre-rename prefix on
// purpose, and the comment beside each says so, so nobody "fixes" one.
const srcDir = new URL("../src/", import.meta.url);
const sources = readdirSync(srcDir)
  .filter((f) => f.endsWith(".ts") && f !== "changelog.ts")
  .map((f) => ({ file: f, text: readFileSync(fileURLToPath(new URL(f, srcDir)), "utf8") }));

/** Each storage-key declaration (not URLs like the Cognito domain), with the comment above it. */
const keys = sources.flatMap(({ file, text }) => {
  const lines = text.split("\n");
  return lines.flatMap((line, i) => {
    if (!/["`]toddpocalypse-[a-z-]*(\$\{|["`])/.test(line) || line.includes("https://")) return [];
    let j = i - 1;
    while (j >= 0 && /^\s*(\/\*\*|\*|\/\/|function |export function )/.test(lines[j])) j--;
    return [{ where: `${file}:${i + 1}`, comment: lines.slice(j + 1, i).join("\n") }];
  });
});

describe("storage keys keep the old prefix, and say why", () => {
  it("finds every key", () => {
    expect(keys.length).toBe(7);
  });

  it.each(keys)("$where points at the divergences doc", ({ comment }) => {
    expect(comment).toContain("franchise-divergences.md");
  });
});

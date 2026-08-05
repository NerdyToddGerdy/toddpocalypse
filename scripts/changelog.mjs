// Regenerates CHANGELOG.md from src/changelog.ts, the typed source of truth.
// Run via `npm run changelog`. tests/changelog-md.test.ts fails if the two drift.
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// The changelog lives in TypeScript, so transpile it before importing.
const bundled = await build({
  stdin: {
    contents: `
      export { renderChangelogMarkdown } from "./src/changelog-md.js";
      export { CHANGELOG } from "./src/changelog.js";
    `,
    resolveDir: root,
    sourcefile: "changelog-entry.js",
  },
  bundle: true,
  format: "esm",
  target: "es2022",
  write: false,
});

const module = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);

const outfile = resolve(root, "CHANGELOG.md");
await writeFile(outfile, module.renderChangelogMarkdown(module.CHANGELOG), "utf8");
console.log(`wrote ${outfile} — ${module.CHANGELOG.length} releases`);

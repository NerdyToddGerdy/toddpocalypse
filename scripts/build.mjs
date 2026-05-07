import { build, context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
const watch = process.argv.includes("--watch");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, "public"), dist, { recursive: true });

const options = {
  entryPoints: [resolve(root, "src/main.ts")],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: resolve(dist, "game.js"),
  sourcemap: watch ? "inline" : false,
  minify: !watch,
  logLevel: "info",
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("watching for changes…");
} else {
  await build(options);
}

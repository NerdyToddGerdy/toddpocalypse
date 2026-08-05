import type { ChangelogEntry } from "./changelog.js";

/**
 * Banner stamped into the generated CHANGELOG.md.
 *
 * The bible (§6) asks for a dated `CHANGELOG.md`; this game keeps the typed
 * `src/changelog.ts` as the source of truth and generates the Markdown from it,
 * so there is only ever one list to maintain. See docs/franchise-divergences.md.
 */
export const GENERATED_NOTICE =
  "<!-- Generated from src/changelog.ts by `npm run changelog`. Do not edit by hand. -->";

/** Renders the changelog entries as Markdown, newest first. */
export function renderChangelogMarkdown(entries: ChangelogEntry[]): string {
  const sections = entries.map(
    (entry) =>
      `## ${entry.version} — ${entry.date}\n\n` +
      entry.changes.map((change) => `- ${change}`).join("\n"),
  );

  return (
    `# Changelog\n\n` +
    `${GENERATED_NOTICE}\n\n` +
    `All notable changes to **GerdQuest: Idle Depths**.\n\n` +
    `${sections.join("\n\n")}\n`
  );
}

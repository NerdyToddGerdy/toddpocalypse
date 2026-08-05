# Where Idle Depths differs from the Franchise Bible

The bible is the shared standard for every GerdQuest title and lives in the flagship repo:

**https://github.com/NerdyToddGerdy/notequest_browser/blob/fix/runid-desync-and-rename/docs/franchise-bible.md**

It is written from *Realm of Depths*, so some of it describes that title rather than this one. This
file is the single record of every place *Idle Depths* differs, why, and whether the difference is
permanent. **Put divergence rationale here, not in code comments** — a docstring explains one file,
and nobody assembles the whole picture from eight of them.

The bible does not say where per-title divergences get recorded. This is that place, until it does.

> Last verified against the codebase: **2026-08-04** (v2.34.0). Facts below were checked, not
> remembered. Re-verify before trusting any row — see the commands at the end.

## Status legend

| | Meaning |
| --- | --- |
| 🟢 **Settled** | Deliberate, decided, not changing. The bible is what should move. |
| 🟡 **Owed** | We intend to conform; it just isn't done. Tracked by an issue. |
| 🔵 **Conformant** | Matches the bible in a way that *looks* wrong. **Do not "fix" these.** |
| ⚪ **Open** | Genuinely undecided. |

---

## Summary

| § | Topic | Status | Issue |
| --- | --- | --- | --- |
| §1.5 | IP standing — inspired-by, not adapted-from | 🔵 Conformant | #49, #50 |
| §2 | Name collides with a live idle game | 🟢 Settled (knowingly) | #51 closed |
| §2 | Wordmark is flat, not two-tier | 🟡 Owed | #55 |
| §3 | Eight themes instead of one committed look | 🟢 **Settled** | #53 closed |
| §3 | Palette token *names* not adopted | 🟡 Owed | #52 |
| §3 | Fonts are CDN, and the wrong three | 🟡 Owed | #54 |
| §3 | No Die, stacked sheet, ruled paper | 🟡 Owed | #56 |
| §5 | Hidden float multipliers, no visible tables | 🟡 Owed | #57 |
| §5 | No depleting resource; prestige not permadeath | ⚪ Open | #58 |
| §6 | Vanilla DOM + esbuild, not React + Vite | 🟢 **Settled** | #63 |
| §6 | Has a backend (bible permits) | 🔵 Conformant | #64 |
| §6 | Accounts + email, not anonymous UUID | ⚪ Open | #64 |
| §6 | Storage keys keep the `toddpocalypse-` prefix | 🔵 **Conformant** | — |
| §6 | No injectable RNG | 🟡 Owed | #60 |
| §6 | No `src/data/` | 🟡 Owed | #61 |
| §6 | No git tags; changelog is `.ts`, not `.md` | 🟡 Owed | #62 |
| §6 | No Playwright; failing-test-first rule unadopted | 🟡 Owed | #63 |

---

## 🟢 Settled — the bible is what should move

### §3 — eight themes, not one committed lit scene

§3 says "This is one lit scene, not a document that should invert." This title ships **eight**
selectable themes, prestige-unlocked.

**Why:** collectible customisation carries weight in an idle game that a solo dice crawler doesn't
have. Unlocking a look is a progression reward here; in *Realm of Depths* it would be noise.

**How it's reconciled:** the **default** is franchise-constant. `torchlight` is the §3 palette
verbatim, free from the first minute, and top of the unlock list — so the game a new player sees,
and every screenshot, is the house look. The other seven are opt-in.

> **Owed to the bible:** §3 needs amending to permit per-title cosmetic variants — the *default*
> look is franchise-constant, additional themes are a per-title call. Until that lands this is an
> undocumented divergence, not a settled exception. Requires a change in the flagship repo.

### §6 — vanilla DOM + esbuild, not React + Vite

§6 specifies React + TypeScript + Vite. This is TypeScript + esbuild with direct DOM rendering and
event delegation.

**Why:** it predates the franchise, works, and builds to ~304KB in well under a second. Migrating
buys nothing a player can see.

**What it costs, concretely:** the `Die` component (§3, "reuse it verbatim in every title", "the
single most recognisable asset the franchise owns") **cannot** be reused verbatim — it's a React
component. #56 has to port the CSS cube and reimplement the wrapper. That cost is real and recurring;
it applies to every future shared component. Recorded here so it isn't rediscovered each time.

---

## 🔵 Conformant — do not "fix" these

### §6 — storage keys keep the `toddpocalypse-` prefix

Five keys still carry the pre-rename name: `toddpocalypse-save`, `-theme`, `-token`,
`-token-expiry`, `-session`.

**This is correct and deliberate.** §6: "**Never rename a storage key without a read-old-write-new
migration.**" *Realm of Depths* keeps its historical `notequest:` prefix through two renames for
exactly this reason. These keys hold every player's save, session and auth state; the prefix is
invisible to players, so renaming it is pure risk for zero gain.

Renaming them would log everyone out and orphan every local save. **Leave them alone.**

### §6 — the backend is allowed

Cognito + Lambda + DynamoDB. §6's Backends section explicitly permits this: "static by default …
**This is a starting point, not a franchise constraint**."

The rule that *does* apply — "the game must remain fully playable with the network down, or the
backend gone entirely" — appears satisfied: `localStorage` is authoritative and `cloudLoad` returns a
typed result rather than throwing. **Not yet actually tested**, which is #64.

### §1.5 — IP standing

Original work inspired by Clickpocalypse II; not an adaptation, carries no attribution obligation,
and correctly carries **no** NoteQuest credit (§1 rule 3). The vendored copy of the Clickpocalypse
source was purged from the repo and from git history on 2026-08-04 (#49) and is `.gitignore`d.

Unresolved: our gear quality ladder shares `Celestial` and `Eternal` with theirs (#49).

---

## 🟡 Owed — we intend to conform

Each is tracked; this section is a pointer, not a duplicate of the issue.

- **§2 wordmark** (#55) — flat `<h1>` with a colon instead of the two-tier `<small>GerdQuest</small>`
  form. Matters for looking like a sibling title on a shared landing page.
- **§3 palette** (#52) — the §3 *values* are live in `torchlight`, but the token *names*
  (`--bg-0`, `--parchment`, `--ink`…) and a real `src/ui/theme/tokens.css` are not. Currently
  `--bg` / `--surface` / `--accent` / `--text`.
- **§3 typography** (#54) — five faces from the Google Fonts CDN (Cinzel, Crimson Pro, Pirata One,
  Philosopher, Cinzel Decorative). §3 wants three self-hosted woff2: Metamorphous, Spectral,
  JetBrains Mono. The CDN link is itself the violation — "no CDN".
- **§3 motifs** (#56) — no Die, no stacked sheet, no eyebrow+title, no ruled paper.
- **§5 visible maths** (#57) — the big one. §5 says visible dice and readable tables are what earn
  the GerdQuest name; this game resolves everything on hidden floats and 23 unsurfaced
  `Math.random()` calls. A combat-model rewrite, not a UI change.
- **§6 injectable RNG** (#60) — no `RNG = () => number` seam, and two rolls live in `main.ts`, which
  §6 forbids outright. Prerequisite for #57.
- **§6 `src/data/`** (#61) — tables live inside the modules that consume them.
- **§6 versioning** (#62) — **zero git tags** despite 200+ released versions, and the changelog is
  `src/changelog.ts` rather than `CHANGELOG.md`. The `.ts` form is arguably better (typed, tested,
  rendered in-game); the missing tags are a straight gap.
- **§6 testing** (#63) — Vitest is in place (1349 tests). No Playwright, and the "a regression test
  must be shown to fail against the unfixed code before it is kept" rule isn't formally adopted.

---

## ⚪ Open — undecided

- **§5.2 / §5.3 / §7** (#58) — the depleting resource, permadeath vs prestige, party size, setting.
  Note the game has *already* answered prestige-vs-permadeath by accident: it ships a prestige
  button and a renown system, which is the option §5.3 leans against. Either argue it or change it.
- **§6 identity** (#64) — §6 says *prefer* an anonymous UUID: "no passwords, no email, no personal
  data to protect." We use Cognito with Google sign-in requesting `email+openid+profile`, and
  maintain a `PRIVACY.md` because of it. A considered trade for cross-device sync — but the
  argument isn't on the record, and #46's save-code system is the anonymous alternative already on
  the backlog.
- **§2 name** — `Idle Depths` collides with a live idle game, a registered `idledepths.com`, and a
  Steam subtitle (#51). Knowingly kept on the strength of the `GerdQuest:` prefix as disambiguator.
  **Re-run the §2 check before publishing to any storefront** (#33, #45) — that's the point of no
  return.

---

## Re-verifying this file

Facts rot. To re-check the mechanical rows:

```bash
git tag | wc -l                                  # §6 versioning — expect 0 until #62
test -f CHANGELOG.md && echo present             # §6 versioning
test -d src/data && echo present                 # §6 data-driven — #61
test -f src/ui/theme/tokens.css && echo present  # §3 palette — #52
grep -rc "Math.random" src/*.ts                  # §6 RNG — #60, expect 23 calls
grep -c "fonts.googleapis" public/index.html     # §3 typography — #54, expect 2
grep -rn "toddpocalypse-" src/*.ts               # §6 storage keys — expect 5, leave them
grep -rin "notequest" --exclude-dir=node_modules . # §1 rule 3 — only bible URLs should match
```

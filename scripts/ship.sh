#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# ── 1. Commit message ────────────────────────────────────────────────────────
echo ""
read -rp "Commit message: " COMMIT_MSG
if [[ -z "$COMMIT_MSG" ]]; then
  echo "Commit message cannot be empty." >&2
  exit 1
fi

# ── 2. Link to a GH issue? ───────────────────────────────────────────────────
echo ""
echo "Fetching open issues..."
ISSUES=$(gh issue list --state open --json number,title --jq '.[] | "\(.number)\t\(.title)"' 2>/dev/null || true)

ISSUE_NUM=""
CLOSE_ISSUE=false

if [[ -z "$ISSUES" ]]; then
  echo "No open issues found."
else
  echo ""
  echo "Open issues:"
  echo "  0) None"
  while IFS=$'\t' read -r num title; do
    echo "  $num) $title"
  done <<< "$ISSUES"
  echo ""
  read -rp "Link to issue # (0 for none): " ISSUE_CHOICE
  if [[ "$ISSUE_CHOICE" =~ ^[1-9][0-9]*$ ]]; then
    ISSUE_NUM="$ISSUE_CHOICE"
    read -rp "Close issue #$ISSUE_NUM after push? [y/N] " CLOSE_ANS
    [[ "$CLOSE_ANS" =~ ^[Yy]$ ]] && CLOSE_ISSUE=true
  fi
fi

# ── 3. Build + test + typecheck ───────────────────────────────────────────────
echo ""
echo "Running tests..."
npm test

echo ""
echo "Typechecking..."
npm run typecheck

echo ""
echo "Building..."
npm run build

# ── 4. Commit ─────────────────────────────────────────────────────────────────
FULL_MSG="$COMMIT_MSG"
if [[ -n "$ISSUE_NUM" ]]; then
  if $CLOSE_ISSUE; then
    FULL_MSG="$FULL_MSG

Closes #$ISSUE_NUM"
  else
    FULL_MSG="$FULL_MSG

Refs #$ISSUE_NUM"
  fi
fi

FULL_MSG="$FULL_MSG

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

echo ""
git add -p --patch 2>/dev/null || git add src/ tests/ public/
git status

echo ""
read -rp "Stage all modified tracked files and commit? [Y/n] " STAGE_ANS
if [[ "$STAGE_ANS" =~ ^[Nn]$ ]]; then
  echo "Aborted — stage files manually then commit."
  exit 0
fi

git add -u
git commit -m "$FULL_MSG"

# ── 5. Push ───────────────────────────────────────────────────────────────────
echo ""
git push

# ── 6. Close issue if requested ───────────────────────────────────────────────
if $CLOSE_ISSUE && [[ -n "$ISSUE_NUM" ]]; then
  echo ""
  gh issue close "$ISSUE_NUM" --comment "Resolved in this push."
  echo "Issue #$ISSUE_NUM closed."
fi

echo ""
echo "Done! CI deploying to GitHub Pages."

#!/usr/bin/env bash
# Rebuild the public SmokedMeats/umbrella-skills snapshot as ONE new commit on
# top of the public repo's main (non-force). Never pushes private history.
#
# Run from a clean checkout of the private pack (this repo). Requires:
#   - gh auth, git, node, gitleaks
#   - PUBLIC_SAFE_DENYLIST or a sibling */public-safe/denylist.txt
#   - push access to SmokedMeats/umbrella-skills (public)
set -euo pipefail

AUTHOR_NAME="${PUBLISH_AUTHOR_NAME:-SmokedMeats}"
AUTHOR_EMAIL="${PUBLISH_AUTHOR_EMAIL:-78776686+SmokedMeats@users.noreply.github.com}"
PUBLIC_REPO="${PUBLISH_PUBLIC_REPO:-SmokedMeats/umbrella-skills}"
PRIVATE_TOP="$(git rev-parse --show-toplevel)"
SRC_SHA="$(git rev-parse HEAD)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/umbrella-publish.XXXXXX")"
cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

echo "Source (private): $PRIVATE_TOP @$SRC_SHA"
echo "Target (public):  $PUBLIC_REPO"

# 1. Export tracked tree only
mkdir -p "$WORK/tree"
git archive --format=tar HEAD | tar -x -C "$WORK/tree"

# 2. Orphan commit in a throwaway repo
mkdir -p "$WORK/repo"
cp -a "$WORK/tree/." "$WORK/repo/"
cd "$WORK/repo"
git init -b main >/dev/null
git config user.name "$AUTHOR_NAME"
git config user.email "$AUTHOR_EMAIL"
if [[ -d .githooks ]]; then
  git config core.hooksPath .githooks
fi
if [[ -n "${PUBLIC_SAFE_DENYLIST:-}" ]]; then
  git config publicsafe.denylist "$PUBLIC_SAFE_DENYLIST"
fi
git add -A
GIT_AUTHOR_NAME="$AUTHOR_NAME" GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL" \
GIT_COMMITTER_NAME="$AUTHOR_NAME" GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL" \
  git commit -m "Public snapshot from private ${SRC_SHA:0:7}

Rebuilt as a fresh tree. No private history."
NEW_SHA="$(git rev-parse HEAD)"
echo "New orphan commit: $NEW_SHA"

# 3. Safety gate (must be 0)
PASS_LINE="$(node scripts/check-public-safe.mjs --tree)"
echo "$PASS_LINE"
if [[ "$PASS_LINE" != check:public-safe\ PASS* ]]; then
  echo "check:public-safe failed; aborting publish" >&2
  exit 1
fi

# 4. Fetch public main and create one NEW commit on top (same tree, non-force)
git remote add public "https://github.com/${PUBLIC_REPO}.git"
git fetch public main
PUBLIC_TIP="$(git rev-parse public/main)"
# Replace orphan with a child of public/main that has the new tree
TREE="$(git rev-parse HEAD^{tree})"
PUBLISH_SHA="$(GIT_AUTHOR_NAME="$AUTHOR_NAME" GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL" \
  GIT_COMMITTER_NAME="$AUTHOR_NAME" GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL" \
  git commit-tree "$TREE" -p "$PUBLIC_TIP" -m "Public snapshot from private ${SRC_SHA:0:7}

Rebuilt as a fresh tree. No private history.")"
git checkout -B publish "$PUBLISH_SHA" >/dev/null
echo "Publish commit (on top of public main): $PUBLISH_SHA"
echo "$PASS_LINE"

# 5. Push (pre-push hook must pass; never --no-verify)
git push public publish:main
echo "Published $PUBLISH_SHA -> https://github.com/${PUBLIC_REPO}"

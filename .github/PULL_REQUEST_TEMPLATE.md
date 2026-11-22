## Why

## What changed

## Scope

## Verification

`pr-ready: PASS <HEAD sha>` from `node scripts/check-pr-ready.mjs` on this head. On the public snapshot, pass `--public`. That line is `pr-ready: PASS (public) <HEAD sha>`.

A docs-only pull request merges on that line. The exact-head build-verifier plus `## Evidence` stand-in is retired.

## Public snapshot pull requests

Title and commit subject: `Public snapshot refresh: <topic>`. Describe the change itself. Evidence may contain only hashes and check output lines from this repository (`check:public-safe PASS` and `pr-ready: PASS (public) <sha>`). Do not include issue links, pack names from another repository, or machine or host labels. Do not add a Refs line.

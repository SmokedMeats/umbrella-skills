## Why

## What changed

## Scope

## Verification

`pr-ready: PASS <HEAD sha>` from `node scripts/check-pr-ready.mjs` on this head. On the public snapshot, pass `--public`. That line is `pr-ready: PASS (public) <HEAD sha>`.

A docs-only pull request merges on that line. The exact-head build-verifier plus `## Evidence` stand-in is retired.

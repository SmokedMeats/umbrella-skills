---
name: tech-lead-review
description: "Judgment review on a high-risk diff that touches money, auth, permissions, entitlements, paid tiers, XP/economy/tokens, migrations, or write routes, after check:pr-ready step 1 and before merge. Returns a GATE: TL line. Not a style pass. Not the risk classifier. Use when the land gate calls for it, or when asked for a tech-lead review of those paths. Deps, config, native, and locking stay build-verifier only."
---

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

# Tech Lead review

Strict, short, evidence first. Stop the land on hope. Review the actual diff against the claim.

This skill does not decide `risk:`. [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Land gate** does, via that script.

## When it runs

Run only when the land gate is high (or the step-1 output has no `risk:` field) and the diff touches money, auth, permissions, entitlements, paid tiers, XP/economy/tokens, migrations, or write routes. Deps, config, native, and locking stay `/build-verifier` only. `risk: low` does not run this review. Anything else on the high path is the one `/build-verifier`, not this review. A `check:pr-ready WAIT` that only waits on review is enough to start; do not require a merge PASS first. This review runs before `/build-verifier`. The reviewer is a different agent than the author (the same model is fine), not a subagent of the author, and not inline in the writer's session. Only this review posts the TL verdict.

## Steps

1. **Fix the point.** Diff since the merge-base with `<dev-branch>` (`git diff $(git merge-base HEAD <dev-branch>)`). Read the ticket, spec, and grill lock it claims to implement.
2. **Claim vs diff.** List what the ticket promised. Mark each: done in the diff, missing, or extra (invented scope).
3. **Scary-diff pass.** For each in-scope hunk (money, auth, permissions, entitlements, paid tiers, XP/economy/tokens, migrations, or write routes) ask:
   - What breaks if this runs twice, concurrently, partially, or out of order? (double grant, double charge, lost update)
   - Is the money or auth path idempotent and server-authoritative? Can a client forge or replay it?
   - Migration: expand/contract for a drop or rename, finalize steps in one transaction, reversible or explicitly forward-only, safe on existing rows, no long table lock, deploy order with code is safe. A new migration still stops before `commands.db_migrate` (founder gate), except the in-loop run for a new SQL file already in this change. A migration does not inherit a previous pass. Keyset cursors keep full DB precision.
   - Schema change on that path: every reader and writer updated; old clients still parse.
4. **Evidence.** Tests that actually exercise the risky path exist and passed. No test for an in-scope path → FAIL.
   - Any new effect, invalidate, or refetch driven by query data needs a fetch-count and render-count probe before pr-ready. The probe uses a real QueryClient whose fetcher returns a new Date on every answer (superjson-style). Both counts must settle at a small bound. (#2633: raw `useMutation()` object as an effect dep, 302 renders; Date-unequal refetch, 139 fetches/s. #2658: unbounded invalidate on superjson Date data, 8,501 fetches in 1 s.)
   - Any day, week, or month bucketing must be tested in several zones, including at least one east of UTC (for example Asia/Tokyo) plus America/Chicago, on both DST-start and DST-end days. (#2639→#2644, #2647→#2648, #2649→#2653.)
   Optional: if the repo's graph freshness check passes, query affected symbols for reverse impact; skip silently if stale. Never build the graph.
5. **Verdict.** Output exactly one:

```text
GATE: TL PASS <40-sha> agent: <your-agent-name>
residual: <one line>

## Evidence
<commands or checks run, and pass/fail counts>
files or areas reviewed: <paths>
SHA <same 40-char sha as the GATE line>
```

```text
GATE: TL FAIL <40-sha> agent: <your-agent-name>
1. <file:line> — <what breaks> — <concrete fix>
2. ...
missing tests: <list or none>

## Evidence
<commands or checks run, and pass/fail counts>
files or areas reviewed: <paths>
findings: as listed above
SHA <same 40-char sha as the GATE line>
```

A PASS with no shaped Evidence block (non-empty, same 40-char SHA) does not count. A FAIL still wins with no evidence. `check:pr-ready` only checks that the block exists and is shaped right; it cannot verify the evidence is true.

## On FAIL

Fix every item in the same session, re-run full preflight, then re-run this review on the new diff. Repeat until PASS. Do not push on FAIL. If a fix needs a product decision, a new migration run, or is unfixable, stop at the founder gate with the FAIL list.

## Never

- Bless without reading the diff and seeing tests pass.
- Turn this into style or naming nits; that is `/code-review`.
- Merge, OTA, promote, or open a PR because of this review.

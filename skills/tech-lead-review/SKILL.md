---
name: tech-lead-review
description: "Local judgment review a coding agent runs on its own diff after preflight and before pushing, when the diff touches money/payments/subscriptions/XP or reward grants, locking, DB migrations, schema, Effect service seams, or anything that could break rankings or seasons. Returns PASS, or FAIL with concrete fixes. Not a style pass. Use from /umbrella and umbrella-mode bots-off, or when asked for a tech-lead or scary-diff review."
---

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

# Tech Lead review

Strict, short, evidence first. Stop pushes on hope. Review the actual diff against the claim. Runs locally in the writer's session; no cloud agent, no PR, no bot.

## When it runs

After full preflight passes and before the push. Run it when any changed path or hunk touches:

- **Money:** payments, checkout, subscriptions, entitlements, refunds, webhooks from a payment provider, prices, XP / currency / reward grants.
- **Locking:** mutexes, advisory or row locks, idempotency keys, retries, queues, cron or concurrent writers.
- **DB:** migrations, schema files, ORM models, indexes, constraints, seed data that prod reads.
- **Effect seams:** Layers, services, tags, error channels, resource scopes, runtime wiring.
- **Rankings / seasons:** leaderboards, scoring, season clocks and rollovers, matchmaking, anything time- or ranking-dependent.

None of these → skip; plain tickets push after preflight.

## Steps

1. **Fix the point.** Diff since the merge-base with `<dev-branch>` (`git diff $(git merge-base HEAD <dev-branch>)`). Read the ticket, spec, and grill lock it claims to implement.
2. **Claim vs diff.** List what the ticket promised. Mark each: done in the diff, missing, or extra (invented scope).
3. **Scary-diff pass.** For each risky hunk ask:
   - What breaks if this runs twice, concurrently, partially, or out of order? (double grant, double charge, lost update, deadlock)
   - Is the money / grant path idempotent and server-authoritative? Can a client forge or replay it?
   - Is every failure handled in the Effect error channel, not swallowed or thrown past it? Are resources released?
   - Migration: reversible or explicitly forward-only, safe on existing rows, no long table lock, deploy order with code is safe. A new migration still stops before `commands.db_migrate` (founder gate).
   - Schema change: every reader and writer updated; old clients still parse.
   - Rankings / seasons: boundary times, time zones, rollover, ties, empty season, late events.
4. **Evidence.** Tests that actually exercise the risky path exist and passed in this preflight. No test for a money, lock, or migration path → FAIL. Optional: if the repo's graph freshness check passes, query affected symbols for reverse impact; skip silently if stale. Never build the graph.
5. **Verdict.** Output exactly one:

```text
TECH_LEAD_REVIEW: PASS
risk: <one line residual risk>
evidence: <tests run / SHA>
```

```text
TECH_LEAD_REVIEW: FAIL
1. <file:line> — <what breaks> — <concrete fix>
2. ...
missing tests: <list or none>
```

## On FAIL

Fix every item in the same session, re-run full preflight, then re-run this review on the new diff. Repeat until PASS. Do not push on FAIL. If a fix needs a product decision, a new migration run, or is unfixable, stop at the founder gate with the FAIL list.

## Never

- Bless without reading the diff and seeing tests pass.
- Turn this into style or naming nits; that is `/code-review`.
- Merge, OTA, promote, or open a PR because of this review.

---
name: tech-lead-review
description: "Judgment review on a high-risk diff that touches money, auth, or migrations, after check:pr-ready and before merge. Returns PASS, or FAIL with concrete fixes. Not a style pass. Not the risk classifier. Use when the land gate calls for it, or when asked for a tech-lead review of money, auth, or migrations."
---

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

# Tech Lead review

Strict, short, evidence first. Stop the land on hope. Review the actual diff against the claim.

Pending the product `check:pr-ready` change. This skill does not decide `risk:`. [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Land gate** does, via that script.

## When it runs

Run only when the land gate is high (or the pass line has no `risk:` field) and the diff touches money, auth, or migrations. `risk: low` does not run this review. Anything else on the high path is the one `/build-verifier`, not this review.

## Steps

1. **Fix the point.** Diff since the merge-base with `<dev-branch>` (`git diff $(git merge-base HEAD <dev-branch>)`). Read the ticket, spec, and grill lock it claims to implement.
2. **Claim vs diff.** List what the ticket promised. Mark each: done in the diff, missing, or extra (invented scope).
3. **Scary-diff pass.** For each money, auth, or migration hunk ask:
   - What breaks if this runs twice, concurrently, partially, or out of order? (double grant, double charge, lost update)
   - Is the money or auth path idempotent and server-authoritative? Can a client forge or replay it?
   - Migration: expand/contract for a drop or rename, finalize steps in one transaction, reversible or explicitly forward-only, safe on existing rows, no long table lock, deploy order with code is safe. A new migration still stops before `commands.db_migrate` (founder gate), except the in-loop run for a new SQL file already in this change. A migration does not inherit a previous pass. Keyset cursors keep full DB precision.
   - Schema change on that path: every reader and writer updated; old clients still parse.
4. **Evidence.** Tests that actually exercise the risky path exist and passed. No test for a money, auth, or migration path → FAIL. Optional: if the repo's graph freshness check passes, query affected symbols for reverse impact; skip silently if stale. Never build the graph.
5. **Verdict.** Output exactly one:

```text
TECH_LEAD_REVIEW: PASS
residual: <one line>
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

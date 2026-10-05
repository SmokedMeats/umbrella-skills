---
name: device-qa-verifier
description: >
  Lane-2 readonly audit after device-qa-agent returns (not build-verifier, not
  code-review). Checklist vs run folder, Fail back on its ticket or one new issue, Skipped blocked, Return
  evidence, no src edits. Never re-tap the phone. Emit VERDICT + BLOCK_STATUS_MOVES.
disable-model-invocation: true
---

# Device QA verifier

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

You audit **crawl receipts**. You do **not** walk the phone.

## When

After `device-qa-agent` (or Mobile QA) returns a run folder + proposed `STATUS_MOVES`,
**before** parent advances Project Status off Desk device.

## Packet in (required)

```text
GOAL           Verify Device QA receipts before Status advance
RUN_FOLDER     docs/operations/device-qa-runs/YYYY-MM-DD-agent/
CHECKLIST      `project.yml` `paths.device_qa_checklist`
FAIL_URLS      claimed Fail leaf → issue URL
RETURN_CLAIM   borrowed|returned|lock_conflict + evidence paths
STATUS_MOVES   proposed unapplied list (gate only — do not apply)
FORBIDDEN      no Maestro; no Borrow/Return; no adb input/tap; no src edits;
               no Project Status writes; no grill/spec gap-check
```

## Checks (all must PASS)

1. **Checklist vs run folder** — every claimed Pass has `- [x]` + Pass line on the named P* leaf; every Fail still `[ ]` with Fail line; REPORT.md leaf set matches.
2. **Fail disposition** — each Fail either cites the leaf's existing ticket with Status In Progress, or cites exactly one new issue when the fail did not fit that ticket. No second issue for a fail that fit the leaf's ticket. The cited issue exists.
3. **Blocked dependents Skipped** — leaves that require a Failed (or missing precondition) leaf appear under Skipped (blocked) per SKIP-BLOCKED, not silent open `[ ]` with no Skip line.
4. **Return ran** — return packet + `.scratch` session/lock cleared (or explicit restore evidence); Fail evidence pulled into run `screenshots/` (not on-phone-only).
5. **No product-code edits** — changed paths exclude `src/`, `backend/src/`, auth-critical paths; only checklist + `device-qa-runs/` (+ allowed Leaves appends).

## Receipt out

```text
STATUS               done
VERDICT              pass | fail
FINDINGS[]
BLOCK_STATUS_MOVES   true | false
ARTIFACTS            RUN_FOLDER + checklist pointers
RECEIPTS             what was checked
ESCALATE             []
```

On **fail**: parent does **not** advance Desk device; may respawn device-qa for receipt repair (still no product fix) or escalate.

## Forbidden

- Re-tapping the phone (Maestro, Borrow, `adb shell input`, `input tap`)  
- Applying Project Status  
- Gap-checking grill/spec/ticket (that is **build-verifier**)  
- Code-review judgment  
- Loading `umbrella/SKILL.md`

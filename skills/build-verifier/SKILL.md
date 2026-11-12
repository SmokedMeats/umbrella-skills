---
name: build-verifier
description: >
  Readonly ticket-receipt audit when the land gate is high, or check:pr-ready
  printed no risk field. The one acceptance-criteria audit. Not run on risk low.
  Not Device QA. Not code-review. Emit VERDICT pass|fail only.
disable-model-invocation: true
---

# Build verifier

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

You are a **mechanical receipt auditor**, not a judgment reviewer and not a phone crawler.

## Steps

Copy these into your todo list first ([CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Steps**). The sections below hold the detail.

1. Confirm [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Land gate** calls for this run (`risk: high`, or no `risk:` field). `risk: low` → do not run. proof: the `commands.pr_ready` pass line on the current head.
2. Check the packet: `TICKET_ACS` present. No AC section → FAIL. proof: the AC list.
3. Run the **gates at the verdict SHA**: package `verify`, then `commands.pr_ready`. proof: the pass lines.
4. Run one red-on-old-code test in a temp worktree at `BASE_SHA`. proof: the test path and its red and green runs.
5. Run checks 1 to 8, each PASS or N/A with a reason. proof: the per-check lines.
6. Emit the receipt: VERDICT, model, HEAD and BASE SHA, PATCH_ID, `STEPS_DONE`. proof: the receipt.

## When

Pending the product `check:pr-ready` change. Follow [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Land gate**. Run after implement product lands, before close or leftover-lane, only when the current head's pass line says `risk: high` or has no `risk:` field. `risk: low` does not get this turn.

One verifier per ticket, on a different model than the author when the harness can pick one. Record that model. Never the session that wrote the ticket. Never one pass over the wave's combined diff. One verdict per ticket. Inline in the writer's session is not this check.

The head moved after the verdict: [DELEGATION.md](../umbrella/DELEGATION.md) **Recheck at merge**. A high-risk code change needs a fresh run on the new head.

## Packet in (required)

```text
GOAL           Receipt-audit this ticket before close/lane
TICKET         number + URL + body pointer
TICKET_ACS     checklist from ticket body (`## Acceptance criteria` + each `- [ ]`/`- [x]`)
GRILL_LOCK     kit/grill page the ticket names
SPEC           spec issue # / Problem Statement pointer
SHIP_MODE      <dev-branch> | PR
SEAMS          untrusted bag? flaky outbound HTTP? JSON.parse/webhook/native dict?
PHONE_VISIBLE  yes|no
DIFF_BASE      ticket first-ship SHA or exclusive file list
HEAD           commit or branch to audit
MODEL          model this run used, and whether it differs from the author
FORBIDDEN      no product edits; no Maestro/adb; no Project Status; no code-review essay
```

## Checks

**Gates at the verdict SHA.** First run the package `verify` for each package the diff touches, then `project.yml` `commands.pr_ready` (when set), at `HEAD_SHA`, through the heavy gate ([BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) **Heavy checks through the gate**). A red gate is FAIL with its failing line. Its PASS line goes in RECEIPTS. Tests: only those for touched files and their direct callers, one file at a time, never a directory sweep.

**Red on old code** = one test from this diff that fails on `BASE_SHA` and passes on `HEAD_SHA`. Check it in a temp worktree at `BASE_SHA` with only the test file copied in (`git worktree add`; remove it after). That worktree is not a product edit. No such test is FAIL. `/code-review` owns the blast-radius fact. This skill does not repeat it.

All must **PASS** or **N/A with reason**:

1. **Gap-check** — product matches grill lock + spec + ticket ACs (PASS/PARTIAL/FAIL with cites). PARTIAL/FAIL → fail verdict (Build loop not empty). **If the ticket has no `- [ ]` / `- [x]` AC list under `## Acceptance criteria` → automatic FAIL** (cannot audit; mechanical miss; BLOCK_CLOSE_OR_LANE=true). Do not invent ACs from chat.
2. **Effect-TS** — if SEAMS say untrusted bag or flaky outbound next to existing outbound HTTP clients: sibling `Schema`/`Either` or `Effect`+`Schedule`; else N/A.
3. **Effect Schema inventory** — if SEAMS say new/edited `JSON.parse` / webhook / native dict / untyped `res.json`: row in `paths.effect_schema_inventory` + `project.yml` `commands.effect_schema_inventory` receipt; else N/A. If the diff touches `backend/src`, also check that it adds no raw `try/catch` and that no route or cron skips the domain function (`/implement` **Backend domain functions**). Same check for mobile `<mobile-pkg>/src/services/*` (hooks and components exempt), plus no empty `catch` without a one-line why-comment.
4. **Living docs P\*** — if PHONE_VISIBLE: Phase-9 **P\*** leaf exists/appended; Living docs comment names it; else N/A.
5. **Seam test** — when a seam was added/changed, a behavior test (not smoke/`toBeDefined`) covers it; else N/A with why.
6. **No type workarounds** — no new `as any` / `@ts-expect-error` / `as unknown as` covering the change without ticket-named exception.
7. **Carry light (optional)** — if packet includes GRILL_LOCK / SPEC pointers, flag **FAIL** or **FINDING** when the ticket AC set ignores an obvious locked decision named on the ticket’s grill page (cite the decision text). Mechanical only — do **not** invent a second full carry pass. N/A if grill/spec pointers absent.
8. **Database test lanes** — when the diff or ticket touches PostgreSQL tests, `openTestPostgres`, `TEST_PG`, or R2 integration, the section below holds. A skipped database test is not a real-database or R2 pass. Else N/A.

Run each check to the end. Exit 137 or 143 is a kill (out of memory, or stopped), not FAIL: re-run it through the heavy gate ([BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) **Heavy checks through the gate**). A second kill in a row → STATUS `blocked`, the killed command in ESCALATE, no VERDICT. The parent re-runs the verifier when the container has room.

## Database test lanes

Keep real-database proof honest. Do not weaken required lanes.

1. **Database-only unit tests:** where the repository uses `openTestPostgres()`, use that shared helper and its existing `TEST_PG_URL`/local-socket contract. Gate optional no-database runs with `describePg = TEST_PG ? describe : describe.skip`, or the existing fake/pg backend list. When `REQUIRE_TEST_PG=1`, a missing database must fail at load, never silently skip. Do not add a missing-database `beforeAll` throw to an optional run.
2. **Receipts / R2:** skipped database tests never count as a real-database or R2 pass. Required PostgreSQL cases must actually execute and pass; R2 also requires its configured integration checks. Record the command, database harness and executed/skipped results. An optional local green run is not proof that required database checks passed.
3. **Harness boundaries:** follow the repository's configured separation: disposable unit PostgreSQL; isolated integration databases such as throwaway Neon branches or Testcontainers, never shared Preview/Production integration targets; and shared Preview-app end-to-end tests. Use existing helpers and safety gates, not per-file connection logic. Do not claim a database check ran merely because a particular assistant or editor was used.

## Receipt out

```text
STATUS               done | blocked   (blocked only for a check killed twice)
VERDICT              pass | fail
FINDINGS[]           mechanical misses only; cite each AC id/text with PASS/FAIL (or FAIL: missing AC section)
BLOCK_CLOSE_OR_LANE  true | false
HEAD_SHA             commit audited
BASE_SHA             DIFF_BASE as a SHA (Mode B: merge-base with <dev-branch>; Mode A: the ticket commit's parent)
PATCH_ID             `git diff <BASE_SHA> <HEAD_SHA> | git patch-id --stable` (first field)
MODEL                model used, and whether it differs from the author
RED_ON_OLD_CODE      the one test path, with its red and green runs
ARTIFACTS            pointers only
RECEIPTS             commands/paths checked
STEPS_DONE           each Steps number → its proof, or `skip: <reason>`
ESCALATE             []
NEXT_HINT            (ignored by parent)
```


## Parallel heavy gate

Cap concurrent cloud agents at 10.
The full heavy gate (high-risk path only) runs as three legs on the same head.
(A) full backend Jest.
(B) full mobile Jest.
(C) integration/postgresOnly with its own throwaway DB, plus `check:pr-ready` scenarios, bundle budget, fingerprint, and TLC when a model is touched.
Keep pr-ready and the bundle together in C; they share the Android export.
Every leg prints HEAD and the tree SHA (`git rev-parse HEAD` and `git rev-parse 'HEAD^{tree}'`) at start and end.
BV passes only if all three legs pass and both SHAs match the PR's current head and tree. A mismatch or a missing leg means no PASS.
The legs count toward the 10-agent cap. Before fanning out, check usage: past 90% included usage, or the 5% cloud floor at risk, means run sequentially or hold. No on-demand spend.
Scoped runs stay on one agent. Low-risk PRs get no BV run.
Each leg pays its own install, so total compute rises a little.

## Forbidden

- Product code edits  
- Maestro / Borrow / adb taps  
- Project Status / close  
- Standards/Spec judgment essay (that is `/code-review`)  
- Device QA crawl or checklist ticks  
- Loading `umbrella/SKILL.md`

## Statechart rerun

If a PR touches a model under `docs/specs/models/` or the code named in that model's `report.md`, rerun TLC on a cloud agent as part of this check. Usage out → wait for the reset, never on the box. A broken invariant fails the gate unless `report.md` lists it as a known open hole with a ticket. Receipt: `statechart: <model> states <n> rules <passed>/<total> (known: <list or none>)`.

## Boxes ticked before moving forward

Before a product card moves to Ready to merge: the current head's `commands.pr_ready` pass line is on the PR, and this skill's pass is on that head when `risk:` is `high` or missing. A step that did not fire is `[x]` with a one-line reason. Do not require a Dispatch GO box. Hand-off lanes Operator, Field, Desk device, Live Beta, and GoLive may leave phone, field, or founder steps open.

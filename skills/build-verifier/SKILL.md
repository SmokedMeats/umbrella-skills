---
name: build-verifier
description: >
  Readonly ticket-receipt audit after implement, before close or leftover-lane.
  Gap-check vs grill+spec+ticket; Effect-TS/schema inventory when seams touched;
  living-docs P* leaf when phone-visible; seam test present; no type workarounds.
  Not Device QA. Not code-review. Emit VERDICT pass|fail only.
disable-model-invocation: true
---

# Build verifier

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

You are a **mechanical receipt auditor**, not a judgment reviewer and not a phone crawler.

## Steps

Copy these into your todo list first ([CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Steps**). The sections below hold the detail.

1. Check the packet: `TICKET_ACS` present, `DEPTH` set (empty → `full`). No AC section → FAIL. proof: the AC list.
2. Run the **gates at the verdict SHA**: package `verify`, then `commands.pr_ready`. proof: the pass lines.
3. **Depth by risk**: red-on-old-code test(s) in a temp worktree at `BASE_SHA`, plus `/blast-radius` when `full`. proof: the test paths and their red and green runs.
4. Run checks 1 to 7, each PASS or N/A with a reason. proof: the per-check lines.
5. Emit the receipt: VERDICT, HEAD and BASE SHA, PATCH_ID, `STEPS_DONE`. proof: the receipt.

## When

After implement product lands on a ticket, **before** parent closes or sets leftover lane.
May run as: (1) an inline receipt in a session that did not write the ticket (the conductor for a child's ticket), or (2) separate
readonly Task / Grok **Build Verifier**. Never the session that wrote the ticket. One verifier per ticket, never one pass over the wave's combined diff. One truth per ticket — do not run both and pick the softer verdict.

**Which of the two.** When the ticket's whole check is one cheap command (docs-only, config, a copy change), use (1): the conductor runs it and audits the receipt inline. A separate agent whose whole job is re-running one command is ceremony. Anything with behavior to judge gets (2). When the harness lets you pick the model, run (2) on a different model family from the writer; a verifier on the writer's model shares its blind spots (pstack `orchestrate.md` **Verification**).

Again at merge: if the branch was merged or rebased onto a newer `<dev-branch>` since this verdict, the parent applies the patch-id rule ([DELEGATION.md](../umbrella/DELEGATION.md) **Recheck at merge**): the verdict holds unless the code changed.

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
DEPTH          full | light   (see Depth by risk)
FORBIDDEN      no product edits; no Maestro/adb; no Project Status; no code-review essay
```

## Checks

**Gates at the verdict SHA.** First run the package `verify` for each package the diff touches, then `project.yml` `commands.pr_ready` (when set), at `HEAD_SHA`, through the heavy gate ([BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) **Heavy checks through the gate**). A red gate is FAIL with its failing line. Its PASS line goes in RECEIPTS; the conductor pastes the `commands.pr_ready_pass` line in the PR body. Tests: only those for touched files and their direct callers, one file at a time, never a directory sweep.

**Depth by risk.** The packet names `DEPTH`; empty → `full`.

| Depth | When the parent picks it | Adds to the gates and checks below |
| --- | --- | --- |
| **full** | The diff touches an area `standing-product-rules.md` locks, or writes grants, entitlements, or money | A `/blast-radius` probe (the one fact it is safe because of, proven by running code) and **2+ red-on-old-code** tests |
| **light** | Every other ticket | **1 red-on-old-code** test; the ticket's own `/code-review` covers the rest |

**Red on old code** = a test from this diff that fails on `BASE_SHA` and passes on `HEAD_SHA`. Check it in a temp worktree at `BASE_SHA` with only the test file copied in (`git worktree add`; remove it after). That worktree is not a product edit. Fewer red-on-old-code tests than the depth needs is FAIL.

All must **PASS** or **N/A with reason**:

1. **Gap-check** — product matches grill lock + spec + ticket ACs (PASS/PARTIAL/FAIL with cites). PARTIAL/FAIL → fail verdict (Build loop not empty). **If the ticket has no `- [ ]` / `- [x]` AC list under `## Acceptance criteria` → automatic FAIL** (cannot audit; mechanical miss; BLOCK_CLOSE_OR_LANE=true). Do not invent ACs from chat.
2. **Effect-TS** — if SEAMS say untrusted bag or flaky outbound next to existing outbound HTTP clients: sibling `Schema`/`Either` or `Effect`+`Schedule`; else N/A.
3. **Effect Schema inventory** — if SEAMS say new/edited `JSON.parse` / webhook / native dict / untyped `res.json`: row in `paths.effect_schema_inventory` + `project.yml` `commands.effect_schema_inventory` receipt; else N/A. If the diff touches `backend/src`, also check that it adds no raw `try/catch` and that no route or cron skips the domain function (`/implement` **Backend domain functions**). Same check for mobile `<mobile-pkg>/src/services/*` (hooks and components exempt), plus no empty `catch` without a one-line why-comment.
4. **Living docs P\*** — if PHONE_VISIBLE: Phase-9 **P\*** leaf exists/appended; Living docs comment names it; else N/A.
5. **Seam test** — when a seam was added/changed, a behavior test (not smoke/`toBeDefined`) covers it; else N/A with why.
6. **No type workarounds** — no new `as any` / `@ts-expect-error` / `as unknown as` covering the change without ticket-named exception.
7. **Carry light (optional)** — if packet includes GRILL_LOCK / SPEC pointers, flag **FAIL** or **FINDING** when the ticket AC set ignores an obvious locked decision named on the ticket’s grill page (cite the decision text). Mechanical only — do **not** invent a second full carry pass. N/A if grill/spec pointers absent.

Run each check to the end. Exit 137 or 143 is a kill (out of memory, or stopped), not FAIL: re-run it through the heavy gate ([BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) **Heavy checks through the gate**). A second kill in a row → STATUS `blocked`, the killed command in ESCALATE, no VERDICT. The parent re-runs the verifier when the container has room.

## Receipt out

```text
STATUS               done | blocked   (blocked only for a check killed twice)
VERDICT              pass | fail
FINDINGS[]           mechanical misses only; cite each AC id/text with PASS/FAIL (or FAIL: missing AC section)
BLOCK_CLOSE_OR_LANE  true | false
HEAD_SHA             commit audited
BASE_SHA             DIFF_BASE as a SHA (Mode B: merge-base with <dev-branch>; Mode A: the ticket commit's parent)
PATCH_ID             `git diff <BASE_SHA> <HEAD_SHA> | git patch-id --stable` (first field)
DEPTH                full | light, with red-on-old-code test paths (and the blast-radius fact when full)
ARTIFACTS            pointers only
RECEIPTS             commands/paths checked
STEPS_DONE           each Steps number → its proof, or `skip: <reason>`
ESCALATE             []
NEXT_HINT            (ignored by parent)
```

## Forbidden

- Product code edits  
- Maestro / Borrow / adb taps  
- Project Status / close  
- Standards/Spec judgment essay (that is `/code-review`)  
- Device QA crawl or checklist ticks  
- Loading `umbrella/SKILL.md`

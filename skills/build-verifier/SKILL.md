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
4. Run checks 1 to 8, each PASS or N/A with a reason. proof: the per-check lines.
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
DEPTH                full | light, with red-on-old-code test paths (and the blast-radius fact when full)
ARTIFACTS            pointers only
RECEIPTS             commands/paths checked
STEPS_DONE           each Steps number → its proof, or `skip: <reason>`
ESCALATE             []
NEXT_HINT            (ignored by parent)
```


## Parallel scoped Jest / type-check (Jacob 1:20–1:25 CT)

1. BV may run up to **4** parallel cloud agents for scoped Jest/type-check on **exact PR heads**. Stop at **90%** included usage or when launches fail.
2. When a BV gate finishes, immediately pull the next ready PR into a free cloud slot (cap 4).
3. After each successful run, BV ticks the Pipeline **Scoped Jest + type-check** step itself.

## Forbidden

- Product code edits  
- Maestro / Borrow / adb taps  
- Project Status / close  
- Standards/Spec judgment essay (that is `/code-review`)  
- Device QA crawl or checklist ticks  
- Loading `umbrella/SKILL.md`

## Gate by patch, not commit (Jacob 2:16 CT 2026-10-15)

- BV runs full scoped Jest + type-check once per PR patch (git patch-id of the PR diff vs merge-base), up to 4 parallel cloud agents, stop at 90% usage.
- Record the PASS with its patch-id on the PR (PASS line: head SHA + patch-id).
- On resync: if patch-id unchanged AND rebase was clean, reuse that PASS; run only fast `check:pr-ready` (~80s) on the new head, then Dispatch GO.
- Full rerun only when ANY of: patch-id changed; rebase had conflicts; PR overlaps files with a commit merged since the PASS; or merged-since commits touch shared surfaces (package.json/lockfile, tsconfig/jest config, DB schema/migrations, shared types/barrel exports).
- If unsure, rerun full.

## Merge-queue carry-over (Jacob 11:57 + 12:02 CT 2026-10-23, adjusted 12:07)

Applies only to one-at-a-time queues (dependency bumps, or PRs that share files). PRs that can merge in any order use the patch rule above.

1. **The key is the merged tree.** A check carries over in full only when the resync's merged tree SHA (`git rev-parse HEAD^{tree}`) equals the tree the pre-warm rehearsed. If only the patch-id matches, carry over just lint, type-check and unit tests for files the base diff didn't touch, and rerun anything that overlaps the base diff.
2. **Full rerun list.** Rerun everything when the PR or the base diff touches package.json, any lock file, tsconfig, jest/babel/metro config, app.json/app.config/eas.json (Expo fingerprint), `.github/workflows`, or migrations. A migration run never carries over if the base added a migration.
3. **Bot gates only.** Carry-over skips BV's own cloud-agent gates. GitHub required CI always runs on the pushed head, and branch protection is never bypassed.
4. **Stale rehearsal.** If a PR ahead is amended, dropped or reordered, every rehearsal behind it is stale. Treat it as no rehearsal.
5. **Receipt.** Accept a carry-over only when the pr-ready note lists the rehearsed tree SHA, the actual tree SHA, and each check as `carried` or `reran`. If a field is missing or the SHAs differ outside rule 1, FAIL the carry-over and rerun. BV accepts or rejects each carried check by name.

**Check split (Jacob 12:53 CT 2026-10-23):**
1. **IW pre-warm runs the light set only:** merge rehearsal, deps install, lint, tsc, and Jest on the changed files. It finds breakage early, but it isn't a certification. IW does not run full Jest, the fingerprint check or the bundle budget.
2. **BV runs the heavy set once, on IW's rehearsed merge, as soon as it's ready** (while the PR ahead is still landing): full Jest, fingerprint, bundle budget, prebuild and migrations, on BV's cloud agents. On resync, a tree SHA match carries BV's pass over and GO is instant. A deps or config change means BV reruns once, on the new rehearsal.
3. **BV never adopts IW's results** as its own pass. That keeps the check independent.
4. **Bundle-budget jitter:** Metro temp-path jitter must not fail the gate. The root fix (a deterministic measurement that normalizes or strips temp paths) folds into the current PR or a related ticket, not a new ticket. Until it lands, a budget miss under 64 bytes gets one rerun, not a FAIL.

## Behind-GO post-land check (Jacob 2:23 + 2:24 PM CT 2026-10-23)

Dispatch may GO a PR that's behind Dev only because of landed lane squashes on disjoint files (1-hop import check clean, merge-tree clean, no deps/locks/config/migrations in between, 3 squashes behind at most, none of the don't-use cases in the Dispatch persona). The GO comment carries `behind-GO: N squashes, disjoint+1hop clean`. GitHub required CI always runs.

1. **Post-land check.** When a PR with a behind-GO tag lands, BV runs tsc plus Jest for the touched areas on the Dev merge commit, on a cloud agent. If GitHub CI on that merge commit already ran full tsc and Jest green, cite it and skip.
2. **Red means revert first.** If it's red, tell CoS to revert the land now. The root-cause fix comes after, in the same ticket.
3. **No stacking.** Report green or red to Dispatch and CoS. Dispatch gives no other behind-GO until this one's check is green.
4. **Auto-off.** One red behind-GO turns the rule off. Every PR goes 0-behind until the cause is found and CoS says it's back on.
5. **Receipt.** `behind-GO post-land: <PR> <merge sha> tsc <pass/fail> jest <pass/fail> (<scope>)`.

## Batch land (Jacob 3:21 PM CT 2026-10-23)

Dispatch may batch 3–4 ready disjoint PRs. Each one needs its own TL pass (or a low-risk TL skip, Jacob 1:39 PM CT 2026-11-02: no money, auth, locking, migrations, deps/locks, config, native, hot lease, Preview or master, plus a `## Evidence` block), the light set green, Dispatch GO, and has to qualify for behind-GO on its own. Shared-file PRs and migrations never batch. The tag is `batch-GO: #a,#b,#c on <tree sha>`.

1. **One heavy run.** BV runs the heavy set once, on cloud agents, on the stacked branch off the current Dev tip. GitHub required CI runs on it too. Record the combined tree SHA.
2. **Land.** CoS lands each PR as its own squash in Dispatch's order, only if Dev hasn't moved since the batch base. If it moved, the batch is stale: rebuild and rerun. The combined green counts as each PR's post-land check.
3. **Red, bisect.** If the failure clearly points at one PR's files, drop that PR and rerun the rest once. Otherwise split in half, run both halves in parallel on cloud agents, report the green half as landable, and split the red half again (2 rounds max for 4). A PR red on its own goes back to IW. If each PR is green alone but the set is red, mark them coupled; they land one at a time. Never pass part of a red batch without that subset's own green run.
4. **Auto-off.** Two red batches in a day turns batching off until the cause is found and CoS turns it back on.
5. **Receipt.** `batch: #a,#b,#c base <dev sha> tree <sha> heavy <pass/fail> CI <pass/fail>`, plus the result of each bisect round.

## Statechart rerun (Jacob 8:29 AM CT 2026-10-30)

If a PR touches a model under `docs/specs/models/` or the code it covers (named in that model's `report.md`), rerun TLC on that model as part of the heavy set, on a cloud agent. If usage is out, it waits for the reset, never on the box. A broken invariant fails the gate, unless the rule is a known open hole listed in `report.md` with a ticket; in that case it reports as known. Not run in GitHub CI. Receipt: `statechart: <model> states <n> rules <passed>/<total> (known: <list or none>)`.

## Boxes ticked before moving forward (Jacob 2:39 CT 2026-10-15)

- Before a product card moves to Ready to merge: every AC line plus Pipeline boxes Spec/grill through Dispatch GO must be ticked.
- Before Done: every AC and every Pipeline box must be ticked.
- A step fitted out counts as cleared only when it's marked N/A with a one-line reason (or struck through).
- If anything is unticked, the card goes back with a comment listing the unticked boxes and AC lines by name.
- Exempt: hand-off lanes Operator, Field, Desk device, Live Beta, GoLive (phone, field or founder steps may stay open there).
- Whoever moves the card (area coordinator, Board, Dispatch) checks this first.

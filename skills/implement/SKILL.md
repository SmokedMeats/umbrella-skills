---
name: implement
description: "Build work from a spec or from tickets filed after a locked grill. Use when those tickets exist, the /umbrella house crawl is in progress, or a build-loop remainder is still open. Count the frontier, house each ticket, spawn extras, crawl newly unblocked tickets. When a Build loop is empty, set the lane from what is left. Before a terminal lane: living-doc verify, /code-review including blast-radius, and the land gate (check:pr-ready on the current head)."
---

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `implement`. Matt `/implement-spec` is a separate standalone skill (worktree frontier); do not route it from here unless the founder asks for worktrees.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

**Seam test — create if missing.** When the ticket changes behavior, name the smallest seam you touched (`*.pure` / helper / service / guard / mapper). If that seam has no honest behavior test, **write one in this change**. Do not close the ticket without it. Follow the repo's test rules when they exist (`testing-avoid-mocks`, delete-on-sight). Types-only, rename, and comment-only skip.

This is not an `/audit` crawl. Do not inventory the neighborhood. Do not grind line-%. Do not add a smoke, snapshot, or “mock was called” suite to fill the gap. Do not mock the module under test.

Run typechecking regularly, single test files regularly, and the full test suite once at the end. In a conducted wave, a child runs only the tests for its touched files and their direct callers, one file at a time, never a directory sweep ([BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) **Tests**).

**Finish the errors.** A type error, a warning, or an error you hit while building is fixed in this change. Do not file it as a leftover. At the end of the user reply, summarize what you fixed, in plain language.

**Talk like a runner.** Chat explains what the person sees on a run. Do not say "judgement." A code-shape note is not a product choice. If nothing is waiting on the user, say that in one line. Ticket comments may name files. Ship notes in the user reply follow `/simple-english` when that skill is installed. Follow [Build standing law](../umbrella/BUILD-STANDING.md).

**DESIGN-IT-TWICE.** When a prototype ticket is in this wave, or `/prototype` is loaded for a non-trivial UI or flow, or the user asked: read `/prototype` for that artifact, and write two short competing sketches before locking one. Do not do this for every feature. See umbrella [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **DESIGN-IT-TWICE**.

**Orient (optional, non-blocking).** Before reading code for a ticket. Only when `commands.graph_freshness` is set: run it from the repo root. Exit 0 means the local code graph is fresh; then run `graphify query "<ticket area>" --budget 1500` (or `path` / `explain`) to find the files, then read them. Key unset, non-zero exit, or no `graphify` CLI → skip silently and use `rg` / Read. Never build or rebuild the graph inside a task.

**Before a new module or seam.** Read [/codebase-design](../codebase-design/SKILL.md) and apply its deletion test and its adapter rule (one adapter is a hypothetical seam, two is a real one) before writing it. Fails either → fold it into the caller or the existing module. Do not copy that skill here.

**Per ticket, before close or a terminal lane:** **Comment cleanup**, then `/code-review` **to completion** for **that** ticket (two-axis report on the ticket **and** the **build loop**), then the land gate. Do not defer review until siblings land. In-scope findings return here on the same ticket. The empty loop then sets Operator, Desk device, Field, Ready to merge, Live Beta, GoLive, or Done from what is left.


## Steps

Copy these into your todo list first ([CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Steps**). The sections below hold the detail.

1. **Count first**: post the unblocked table of coding-eligible tickets and pick the session shape (1 → build here, 2+ → conductor). proof: the table in the reply, with each ticket's live Project Status.
2. **House** and claim each wave ticket (Parent, labels, map child, milestone, Project **In Progress**), then rewrite the cursor. proof: the assignees and the cursor rewrite.
3. **Spawn gate**: every extra ticket has a live child, or is queued past the cap. proof: the child ids, or `skip: count 1`.
4. **Acceptance criteria gate**: the ticket has real `## Acceptance criteria`; empty → `needs_parent`. proof: the AC count.
5. Build to the **Rule card** with `/tdd` at the seams: seam test, errors fixed, migrate for a new SQL file, database tests per [build-verifier](../build-verifier/SKILL.md) **Database test lanes**, harness run. Stack or split per **Small PRs**. proof: the commits, the test file, the harness line, and the database-lane receipt when a database test ran.
6. **Comment cleanup**, then `/code-review` to completion. In-scope findings → back to step 5 (two rounds per ticket). proof: the review comment URL.
7. **Living docs** comment (and the **P\*** leaf when phone-visible). proof: the Living docs URL.
8. **Land gate** on the current head, then the **Close gate** line, the lane or close, and **Crawl** (recount). proof: the `commands.pr_ready` pass line, the BV verdict when `risk:` is high or missing, and the Close gate line.

## Shared full-flow entry (no new skill)

**Entry:** If `/start-work` is installed, use it to route. If it is not, enter this skill when product discovery, the house crawl, or an explicit ticket Start already selected the work. You still run **Acceptance criteria gate**, **House** claim, and **Coding-spawn gate**. A missing `/start-work` does not waive those guards. Do not add a skill folder for this entry. The conditional trigger table is [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Shared full-flow entry**.

**Obligatory Build-loop chain (existing sections of this skill — the owner ticks a gate only when it clears, with evidence):** **Acceptance criteria gate** → **Rule card and harness** (seam test when behavior changes) → product code → **Living docs** (including **Effect-TS check**, **Effect Schema inventory** when configured, and **Backend domain functions** when standing-product-rules are present) → **Comment cleanup** (`/deslop` on this ticket's diff) → `/code-review` two-axis Standards and Spec, including blast-radius and cycles when that skill's rules say to run them → same-ticket **Build loop** for in-scope findings (two rounds; a missing Rule card rule is one grill question) → **Repeat failure** when the same check fails twice → **Land gate** ([CONVENTIONS.md](../umbrella/CONVENTIONS.md), pending the product `check:pr-ready` change). `risk: low` merges on that pass line. `risk: high`, or a pass line with no `risk:` field, adds one independent `/build-verifier` (the writer does not mark it N/A) which posts PASS / PARTIAL / FAIL on that ticket, and `/tech-lead-review` only when the diff touches money, auth, or migrations → **Close gate** → leftover lane or Done per **Count first**. **Small PRs** applies before the PR opens. Owner Pipeline ticks live in **Your Pipeline ticks**. A required skill that is not installed is BLOCKED or a capability handoff, not writer N/A.

**Capability handoff:** post the receipt defined in CONVENTIONS **Capability-limited handoff**. A missing `/start-work` or `/area-coordinator` procedure file does not waive the receipt.

## Acceptance criteria gate (before product code)

On each **live** ticket this session will build: if the body lacks `## Acceptance criteria` with **≥1** real `- [ ]` / `- [x]` checkbox (not placeholder “Criterion 1” / TBD), **stop**. Repair the body (edit issue) or escalate to parent / `/to-tickets`. **Do not invent ACs from chat.** Empty AC is `needs_parent`, not a cue to freestyle done-looks-like.

## Rule card and harness

Build to the spec's **Rule card** (`/to-spec`). It is the SSOT for this change. Long design docs and knob tables are for lookup, not for re-reading to find the rule. A rule the build needs that is not on the card is a grill question (`needs_parent`), not a guess. The card is amended on the answer.

When the card names a harness (a fixed-seed sweep, shared fixtures, contract tests), run it **before handoff** and put its summary line in the receipt and in the PR `## Verification`. A new failing row is remaining work, not a handoff. When the card has **The bar**, report each number against it. Above a cost cap → stop and bring a grill question.

## Gap check

`/build-verifier` check 1 is the only acceptance-criteria audit. It posts PASS / PARTIAL / FAIL on that ticket when the land gate calls for BV. The writer does not post a second table. A missing `## Acceptance criteria` section is still remaining work: repair or escalate before close or a leftover lane.

A spec that said “behind the flag” holds when the wire is flag-gated even if the flag is off. Behavior the grill, the spec, and the tickets did not ask for is invented scope. Park it as new fog (`Later:` or a wayfinder line) and re-grill that slice. Do not close the ticket as if that scope shipped.

Commit your work to the current branch.

**Migrate.** When this change adds `backend/drizzle/0xxx_*.sql`, run `project.yml` `commands.db_migrate` (the command carries its own `cd`) in the same session after the file is on disk. A migrate run before that file exists will not include it. Do not edit a file that has already been applied. Do not run migrate again when this change added no new SQL file. A missed migrate stays on this ticket. It is not a leftover.

## Comment cleanup

One pass on this ticket before `/code-review`. Strip comments added in this change that narrate the next line, or that are leftover noise. Keep a comment that documents an intentional API or a non-obvious constraint. Do not spawn a comment-cleanup subagent. A leftover narrative comment is an in-scope `/code-review` **Standards** finding.

Run it as `/deslop` scoped to **this ticket's diff only** (comments, `any` casts, odd try/catch, deep nesting; no behavior change). Always keep: why-comments, constraint notes (money, locking, auth, migrations, security pins, platform workarounds with a link), license headers, and lint/type directives (`eslint-disable*`, `@ts-expect-error`). While working a ticket you may also run `/no-comments` on that ticket's files and do its in-scope fixes (root-cause a workaround, encode a do-not-remove rule as a type/test/lint) as part of the ticket. The one batched cleanup PR is different: `/no-comments` **deletions only** there, no code fixes or encodings, keep money/locking/auth/migration guards, and list anything it wanted to fix for Jacob to ticket (Jacob 2026-10-22; run when the merge queue is near empty, never a whole-repo sweep that clashes with open PRs).

## Build loop

**Comment cleanup** and `/code-review` feed the **same** tickets until they are empty. The acceptance-criteria audit is `/build-verifier` check 1 when the land gate calls for it.

Do this **per ticket** as that ticket’s product lands. Do not wait for the rest of the wave.

1. Keep building **this** ticket until its ACs hold in current code. A fact the code cannot see, and that you cannot invent, is its own leftover ticket. Invented scope stays parked (**Gap check**).
2. When the ACs hold: **Living docs** (update/verify docs this change touched, not a second pre-grill survey), then **Migrate** if this ticket added a new `backend/drizzle/0xxx_*.sql`, then **Comment cleanup**, then `/code-review` to the two-axis report (`## Standards` / `## Spec`, including `/blast-radius`) **on this ticket**. Fixed point = this ticket’s first ship SHA (parent of that commit). Do not ask the user.
3. In-scope review findings become the new remaining-AC list on **this** ticket. Return to step 1 in this session. **Two review rounds per ticket.** If round 2 still has a hard Spec or Standards finding, do not start round 3: the card is missing a rule. Write one grill question (`/grilling` shape) for it. A child puts it in ESCALATE and the parent asks it. Amend the card on the answer, and build to that. A round with no hard finding ends the loop. Nits and code-shape notes go to a follow-up ticket, not another round. Each fix round and each review round is a fresh child with a short brief ([BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) §10).
4. When this ticket’s list is empty, write **Close gate** for this ticket into `project.yml` `paths.umbrella_cursor` (refuse if incomplete), then set Project Status from what is actually left ([PROJECTS.md](../umbrella/PROJECTS.md)): **Operator**, **Desk device**, **Field**, **Ready to merge**, **Live Beta**, **GoLive**, or **Done**. Ready to merge is one of those lanes. Filing a leftover issue is the same step. Phone-visible work sits on **Desk device** when `adb devices` is not exactly one, when this runner cannot see that USB, or when another actor owns the phone ([DEVICE-QA.md](../umbrella/DEVICE-QA.md)). Do not close that ticket. Then **Crawl in this session** — the next unblocked coding ticket. Do not end the turn on the leftover.
5. Leftover lanes (**Operator**, **Desk device**, **Field**) do not hold the next coding wave. A `blocked_by` on **Live Beta**, **GoLive**, or **Ready to merge** still holds. **Ready to merge** holds until the founder merges.
6. Stop **this house's** coding crawl when no unblocked coding ticket remains (live tickets on their real lanes, or held by a **Live Beta**, **GoLive**, or **Ready to merge** blocker in this house), **Window full**, a Founder pause that blocks the session (Preview fast-forward, migrate, OTA, master promote, irreversible), or the user stops. **Ready to merge** holds dependents in this house until the founder merges. It does not block the next house when `/umbrella` **House queue** has one — finish **End of house**, then return to `/umbrella` and start that house. Do not interleave tickets across houses. A Device QA ownership conflict pauses the phone and the crawl continues on other unblocked coding tickets in this house. Filing tickets is not a stop. Never merge, Preview fast-forward, migrate, OTA, or master promote unattended.

**Repeat failure.** When the **same** test, check or gate fails on two fix attempts in a row on this ticket, stop editing. Spawn a fresh read-only reviewer child (never the writer) with the failing output, the two diffs that tried to fix it, and one question: is this the root cause or a rabbit hole, and what should the next attempt change? The next fix attempt starts only with that verdict in hand. A third failure on the same check goes to `/diagnosing-bugs`. The fix child that ran with the verdict reports `ESCALATED_AFTER_REPEAT_FAIL: yes` ([DELEGATION.md](../umbrella/DELEGATION.md) **implement-ticket**), and the parent copies that line into the ticket's close comment so a retro can count it on GitHub. When no fix child ran (the parent built the ticket itself, or went straight to `/diagnosing-bugs`), the parent writes `ESCALATED_AFTER_REPEAT_FAIL: yes` there itself. The reviewer child's `SKILL_PATH` is this file, **Build loop** **Repeat failure**.

A leftover lane is **not** Window full. Keep crawling.

`Later:` is grill / spec **not this pack** only ([PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md)). Remainder that still belongs to this ship stays on the live tickets.

Completion: no in-scope remainder on the wave tickets, or Window full with that remainder on the spec.


## Self-prove and receipts

Pilot area only: do not spawn `/verify-own-work` as a default extra verifier when `/build-verifier` will rerun the same checks. Receipts go on the PR (a ticket comment before a PR exists). When a scan or ratchet gate changes, add fixtures for the spellings it should catch and prove the gate fails on a real past violation. Repeated misses for this product are on the private binding.

## Close gate

Before GitHub **close** or a **leftover-lane** move on a ticket, rewrite that ticket’s **Close gate** line into `project.yml` `paths.umbrella_cursor` (and optionally the conductor comment). Shape:

```text
Close gate (#N): land-gate <sha> risk=<low|high|missing> | BV pass|n/a | code-review empty | Living docs | migrate N/A|done | lane=<lane>
```

`BV n/a` only when `risk=low`. **Refuse** close and leftover-lane when the land-gate line is missing, when `risk` is `high` or `missing` and BV is not `pass`, when code-review or Living docs is incomplete, or when migrate is neither `N/A` nor `done` and this ticket added a new `backend/drizzle/0xxx_*.sql`. Parent alone closes or lanes after that line is complete ([CURSOR.md](../umbrella/CURSOR.md), [BUILD-STANDING.md](../umbrella/BUILD-STANDING.md)).

## Count first

Count open implement tickets whose **product** blockers are done, that are not already in-flight, and that wear **`umbrella:<slug>`** (not `parked:<slug>`, not `Later:` / `Leftover:`).

**Do not pull** a handoff lane for routine new implementation. **Handoff** is **Operator**, **Desk device**, **Field**, **Live Beta**, and **GoLive** — plus **Done** / closed are out. **Leftover** is the subset **Operator**, **Desk device**, and **Field** ([PROJECTS.md](../umbrella/PROJECTS.md) **Leftover lanes**). Those three are leftover and handoff. **Live Beta** and **GoLive** are handoff and are not leftover. None of the five is a coding spawn. **Ready to merge** stays the merge wait (holds dependents), not a handoff lane; do not spawn a new coding worker for it. **Parked** stays the pre-launch shelf (not coding). **Unclaimed** and **In Progress** remain pullable when the **Coding-spawn gate** passes.

**Coding-spawn gate:** readable live Project Status required (missing/unreadable/conflicting → do not pull). `ready-for-agent`/open alone never sufficient. Skip when relevant merged implementation evidence covers this ticket's ACs; skip duplicate when an active PR/worker owns it. Verification-only (BV/QA) on a handoff/code lane remains allowed; an unrelated merged PR is not proof all ACs shipped.

Treat leftover-lane cards as **satisfied** blockers. An open GitHub `blocked_by` already on a leftover lane does **not** hold the next coding wave. Do not write “still blocked until this ticket closes.” That unlock is only the leftover subset (**Operator**, **Desk device**, **Field**). A `blocked_by` on **Live Beta**, **GoLive**, or **Ready to merge** still holds.

**First reply.** Before House, `/tdd`, or any product-file edit, post this table in the user-visible reply:

| Unblocked | Role | Ticket | Status |
| --- | --- | --- | --- |
| *N* | conductor / child / this session | #n · title | live Project Status |

Then pick the session shape:

| Count | This session |
| --- | --- |
| **1** | Build that ticket here. |
| **2+** | This session is the **conductor**. Draft exclusives, spawn one child per extra ticket, then write only the conductor ticket. |

A named ticket (`/umbrella t5`, `/implement #243`) is the conductor's exclusive **for that wave**. The rest of that wave still gets children.

Shared overlap (one View, one controller, one board) goes on the **conductor exclusive** list. New or disjoint files stay on the other wave tickets. That split is the draft.

**Spawn gate.** No product-code spawn without a live coding-eligible Project Status for that ticket (**Count first**). Product-code edits start after one of:

- Count **1** — the table is posted.
- Count **2+** — every extra ticket has a **live child**, or is queued past the child cap or the memory check ([DELEGATION.md](../umbrella/DELEGATION.md) **Child shape by runtime**).
- The posted exclusive table left every extra ticket with an empty exclusive list — then write one-by-one, and say that in one line.

Completion: the first reply contains the count table, and the spawn gate is met.

Rewrite `project.yml` `paths.umbrella_cursor` after the count table / claim, **before** each close or leftover-lane (**Close gate** line), after each close, after each leftover-lane move, and on Window full ([CURSOR.md](../umbrella/CURSOR.md)). Do not rely on the spec comment alone as the step cursor.

After any leftover-lane move: **post the count table again in the same session** and start the next wave. Do not wait for the user.

## Window full

When this session **cannot** take the next wave (context/window actually full, or `/umbrella` stops before loading implement). Moving a ticket to a leftover lane is **not** this. Crawl the next unblocked tickets.

1. Post or update the **conductor comment on the spec** with remaining frontier (ticket numbers, unblocked vs held, exclusive globs if a parallel wave, frozen shared).
2. This house still has an unblocked coding ticket → print `Next: /implement #<n>`. If that frontier is **2+** tickets, add: this next session is **conductor** and must spawn extras before product code.
3. This house's coding crawl is already done and **House queue** has a next house → do not start that house. Keep the queue in `project.yml` `paths.umbrella_cursor`. The last line names that next house.
4. **Resume brief** (recall — do not add a `/recall` skill). Put it on the conductor comment and in `project.yml` `paths.umbrella_cursor`: **House queue** (keep later houses), ship mode, now-on tickets, decisions trail path, blockers, corrections this session (none, or each one encoded as `<lint|test|skill line>`). If `handoff/SKILL.md` exists in the parent skills directory, read it and follow `/handoff`, and include this brief. The brief does not start the next house.
5. Stop. Tickets plus that comment are the resume.
6. **OVERFLOW_LOCAL (local mid-stop).** On every local mid-stop (Window full, handoff, Stop, crash, or a cloud park that continues locally), comment on each in-flight ticket, and on the swarm area brief when the area is Active: `OVERFLOW_LOCAL` · timestamp · branch tip / WIP paths · open PR if any · AC / Build-loop remainder · blockers · next concrete step · host (`<local-dev-host>`). Keep the assignee, Project Status **In Progress**, and the `overflow:local` label until the Build loop is empty or the founder reclaims. GitHub is the resume record, not chat memory. When `paths.agent_rules` carries this receipt, that file is the canonical wording.

Completion: the spec comment matches the remaining tree, the resume brief is on that comment, and the user-visible last line is `Next: /implement #<n>` or the next queued house.

## House

Before product code, every ticket in this wave is on the house. `/to-tickets` should have done this. If it did not, **you** do it now.

- **Map** — the `wayfinder:map` for this pack.
- **Parent** — the spec `/to-spec` published. If there is no spec, the map is the parent.

On each wave ticket (and the spec, if it is missing this too):

1. Body `## Parent` names the spec **and** the map (title + link, not a bare number).
2. Apply the house `domain:*` and `umbrella:*` with `--add-label`. Create `umbrella:*` if the pack is real and the label is missing.
3. Link the ticket as a **child of the map** (tracker sub-issue). If the tracker has no sub-issues, put `Part of #<map>` at the top of the body.

4. **Claim** — `gh issue edit <n> --add-assignee "@me"` on every ticket this session will write (quote `"@me"` on PowerShell). Same for a one-ticket build. A comment is not a claim.
5. **Milestone** — every wave ticket (and the spec/map if missing) wears the house GitHub milestone. Create it if the pack has none. See `/umbrella` **Milestones**.
6. **Project** — each wave ticket is on **this repo’s** Project ([PROJECTS.md](../umbrella/PROJECTS.md)). `item-add` if missing. Set Status **In Progress** on claim. If product is done and something outside the repo remains, move to a **leftover lane** and do not close. **Done** only when the issue closes.

Completion: every wave ticket names spec + map, wears the house labels, is a child of the map, has a milestone, is on the Project, and is assigned to `@me`.

On close **or** a terminal lane: **Living docs** comment must already be on the ticket. Set the lane from what is left (phone this pass cannot run → **Desk device** via [DEVICE-QA.md](../umbrella/DEVICE-QA.md); console → **Operator**; outdoor → **Field**; green PR waiting on the founder → **Ready to merge**; beta queue → **Live Beta**; production switch → **GoLive**; nothing left → **Done**). A Desk device move does not close the ticket. Then **Crawl** the next unblocked coding ticket. If you do close (nothing left): remove `ready-for-agent` and any `parked:<slug>`. Append one named line to the map's Decisions-so-far. Close **this child** (Status **Done**, keep the milestone). Do **not** archive that card yet. Then [CLOSE-PARENTS.md](../umbrella/CLOSE-PARENTS.md). Then [PROJECTS.md](../umbrella/PROJECTS.md) **Archive Done**. Then **Crawl**. Leftover cards still open → do not Hit the milestone.

## Living docs

Hard gate. After the ticket's ACs hold in current code, **before** GitHub close **or** a leftover-lane move. Same change as the ticket (conductor commits it). Children name the hits; they do not edit `docs/`. Update and verify docs this change touched. Do not re-survey every GLOSSARY and ADR.

1. Grep `docs/` (including `docs/trackers/`) for **this ticket number**, the spec number, and `umbrella:<slug>`. Also grep house encyclopedias the ticket names (house boards in `paths.house_boards`, admin guides, `paths.wayfinder_now`, `paths.wayfinder_maps`, module-intent).
2. For each hit that still reads as open / **Do now** / unchecked work: mark it shipped (strikethrough, SHA, or leftover-lane). Point a now-list at the next **open product** child, not this leftover card.
3. Architecture-map fragment if the ship is node-worthy — same change.
4. Post a **Living docs** comment on **this ticket**: one row per hit (`path` · updated / already historical). Zero rows is only valid if grep returned none — say that.
5. A hit still saying **Do now** / open work → **do not** close and **do not** move to a leftover lane. That is remaining AC.

Typical misses: `paths.wayfinder_now`, `paths.wayfinder_maps`, the house board, admin guide, Device QA **P\*** leaf.

**Effect-TS check** (when standing-product-rules present). Distinct from the census listing below. **Skip unless this change is the same shape as an existing Effect seam.** After product code, ask whether a sibling already uses `Schema`/`Either` or `Effect`+`Schedule` for this shape. If no — UI, tRPC Zod, Wear, a service with no untrusted bag — do nothing. Do not invent a third style. Do not wrap a service in `Effect.gen` because `effect` is a dependency.

| Already in the repo | Use it only when the new code is that shape |
| --- | --- |
| `Schema` + `Either` decode/encode | Untrusted `JSON.parse`, webhook `data`, native dict, untyped `res.json`, cache/file JSON. Do **not** dual-schema tRPC Zod inputs. |
| `Effect` + `Schedule` retry | Flaky outbound HTTP through an existing outbound HTTP client that already retries this way (the concrete client files are listed in `standing-product-rules.md` **Effect-TS seams**). Do not write a one-off retry loop next to those clients. |

**Do not** pull Effect into Wear OS / watch Kotlin. A UI ticket with no JSON bag and no map/HTTP client of that shape skips this check. If a sibling already uses Schema/Either or Effect+Schedule for this shape and this change did not, fix it in the same change or comment on the ticket why not.

**Effect Schema inventory** (when configured). If this change adds or edits a production `JSON.parse`, webhook `data` bag, native dict, or untyped `res.json`, add or update a row in `project.yml` `paths.effect_schema_inventory` in the **same change** (P0/P1/P2). Then run `project.yml` `commands.effect_schema_inventory`. Listing is required even if Schema is later. The **Effect-TS check** still runs: a listed bag that is still hand-parsed is a remaining AC. Auth-adjacent bags still need the auth checklist before code.

**Backend domain functions** (when standing-product-rules present; concrete example and scope in its **Effect domain functions** section). New backend logic in `backend/src` lands as one narrow, app-shaped domain function with typed errors on the **installed** `effect` package (read that version from the product `package.json` and lockfile — this skill does not pin a major or minor and does not assume an upgrade). **Positive conformity:** read the product's canonical Effect patterns doc when that doc is present (for example `docs/engineering/EFFECT_PATTERNS.md`, or the standing-rules Effect section) and open one actual closest sibling module in the tree; new code matches that sibling's shape. Example shape: `claimThing(actor, resource)` does lookup, clock check, write, and notify in one fixed path. Routes, crons, and agents call that function, never the raw repository pieces. No new raw `try/catch` in `backend/src`. Run the `/codebase-design` deletion test on each new function. This lock is the exception to "do not wrap a service in `Effect.gen`" above. (Matt Pocock, 2026-10-03, "Effect, but even more restrictive".) The same lock covers mobile `<mobile-pkg>/src/services/*`: narrow Effect functions with typed errors, no new raw `try/catch`. React hooks and components are exempt for now. Every empty `catch` anywhere carries a one-line comment saying why the fallback is fine. Product-only version pins and the definition of done live in standing-product-rules, not in this pack.

**Cycles** (when configured). Package `verify` does not run `check-cycles`. That check is master-bar (`commands.preflight_cycles`). `/code-review` runs it when the ticket touched `backend/src` or mobile `src`. A new cycle is a Standards hard violation and a remaining AC.

`/code-review` Standards also pins (hard, same-ticket remaining ACs) whatever `standing-product-rules.md` **Code-review hard pins** lists for this product (map fragment, thin router, auth-glob, low-value tests, entitlement helpers, OTA-safe overlays, domain functions).

**Device QA leaf.** When this repo has `project.yml` `paths.device_qa_checklist` and the ship is **phone-visible**, append a **P\*** leaf in the same change — Process **When a feature ships** in that file. Conductor writes it. Children name phone-visible tickets in their report. If a later `/device-qa-agent` run finds a missed ship, **Leaves** (before Probe) appends it — catch-up, not a replacement for writing it here.

The conductor writes these files (and commits them with the ticket). Children leave them alone.

Completion: the Living docs comment is on the ticket, and every grep hit is done/historical or leftover-labeled. Do not create a new tracker file. Missing comment → Build loop not empty.

`/code-review` is required **on this ticket** before close or leftover-lane. In-scope findings return to **Build loop** on the same ticket. Do not reopen a closed ticket to flip checkboxes — keep it open, or post remaining ACs on it, and keep building.

## Crawl

The house is a tree, not one wave. After each ticket **closes**, **moves to a leftover lane** (product ACs PASS), **or you file a leftover issue**, recount **in this session**. Post the count table. Spawn the next wave. Do not stop because the last card stayed open on a leftover column. Do not end the turn by explaining the leftover.

- Unblocked and not in-flight → join the live wave. Draft exclusives if missing. Spawn a child for each extra (and for every new ticket if the conductor is already writing one).
- Open **product** blocker remains (still In Progress / Unclaimed, ACs not PASS) → **hold**. Name the blocker.
- Blocker is already on a leftover lane → **not a hold**. Unlock dependents now. A `blocked_by` on **Live Beta**, **GoLive**, or **Ready to merge** still holds.
- Phone-visible and this pass cannot run Device QA (`adb devices` is not exactly one, this runner cannot see USB, or another actor owns the phone) → **Desk device**, do not close, crawl the next unblocked coding ticket.
- Exclusive glob still owned by an in-flight child → hold until that commit.

Example: T1 product-done → leftover lane unlocks T2/T3/T4 even though T1 is still open. T3 later leftover-lanes and unlocks T5/T6. Spawn T5 and T6 in this session.

**Decision trail.** A multi-ticket crawl, or a **House queue**, keeps a trail as it goes: `decisions.tsv` in the house notes, or short bullets in `project.yml` `paths.umbrella_cursor`. Default on. Do not wait on the founder. One house at a time still holds. **Window full** points at the path. See umbrella [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Decision trail**.

This session stays conductor across waves of **this** house. Completion of this house: no unblocked implement tickets remain (leftover-lane cards do not count; a `blocked_by` on **Live Beta**, **GoLive**, or **Ready to merge** still holds), a Founder pause blocks the session, the user stops, or **Window full**. When `/umbrella` **House queue** has a next house, that house starts after **End of house**. Do not pull its tickets from here. Filing tickets is not completion.


## Ship mode (sticky — read the pin)

Read `Ship mode: <dev-branch>` or `Ship mode: PR` from `project.yml` `paths.umbrella_cursor` (or the conductor comment). **Do not re-pick.** Actor force already locked it for this run (Grok Bot / Cursor cloud -> PR; local Grok Build / Cursor IDE on <local-dev-host> -> <dev-branch>). Wrong pin for this actor -> correct once, note it, stay sticky.

Also: Device QA runs only when this runner can see the USB phone (local <local-dev-host>, or a private worker on that machine). A Cursor cloud VM cannot. Cloud **Mode B** leaves phone-visible leftover on **Desk device** and crawls the next coding ticket. One Ship mode pin. No second worktree on the same `adb` device. If another actor owns the phone this pass, stand down and leave **Desk device** ([DEVICE-QA.md](../umbrella/DEVICE-QA.md)).

### Mode A — `Ship mode: <dev-branch>`

- Stay in the **same worktree** on **`<dev-branch>`**. Isolated git worktrees only if the founder asks.
- Conductor commits on `<dev-branch>` and **pushes to `origin/<dev-branch>`** when implementing (cloud save). No PR.
- Parallel waves OK in one worktree. Children never run git (see Child rules). Conductor serializes commits.
- Close -> **Done** only when applicable checks and QA are done (or a leftover lane when something is still left). A push is not Done. Never **Ready to merge** in Mode A. Phone-visible QA still open is **Desk device**. Outdoor, GPS, or on-wrist proof still open is **Field**. Backend, SQL, CI, Railway, types, website-only, reports, pure math, research, and deps/runtime stay on the non-device check. Never those lanes. See [PROJECTS.md](../umbrella/PROJECTS.md) **Lane fit**.

### Mode B — `Ship mode: PR`

#### Small PRs

Stack or split above ~800 real added lines. Generated snapshots, such as drizzle meta, do not count. A backfill or data script ships as its own PR with its dry-run output.

- **One ticket -> one branch -> one PR** into `<dev-branch>`, or **serialize**. Do not parallel-commit multiple tickets into one PR / one worktree tip.
- Push **only** to the PR branch. Never push to `<dev-branch>` tip, Preview, or `master`. Never merge, Preview fast-forward, migrate, OTA, or master promote unattended. The founder does those. `project.yml` `commands.db_migrate` for a new drizzle file in this change stays in the Build loop.
- After each verifiable unit, push that PR branch with hooks on. A WIP commit on that branch is allowed. Do not force-push a shared branch. The body follows [BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) **PR briefing** (`##` sections, open ready, not draft).
- When PR is open, checks green, waiting on the founder: Status **Ready to merge** ([PROJECTS.md](../umbrella/PROJECTS.md)). Dependents **WAIT** while it is Ready to merge. After the founder merges, set the lane from what is left. **Done** only when applicable checks and QA are done. A leftover lane after that merge does not hold dependents. Ready to merge is **not** a leftover lane. Parked is not a verification hold.
- Before **Ready to merge** (Mode B, when `commands.pr_ready` is set): bring current `origin/<dev-branch>` into the PR branch, then follow [CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Land gate** (pending the product `check:pr-ready` change). Paste the pass line for the current head in the PR body. No pass line, not Ready. The head moved before merge → [DELEGATION.md](../umbrella/DELEGATION.md) **Recheck at merge**.
- A docs-only pull request to this pack pastes `pr-ready: PASS <sha>` from `node scripts/check-pr-ready.mjs` ([CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Pack pull requests**). On the public snapshot, pass `--public`. That line is `pr-ready: PASS (public) <sha>`. The exact-head build-verifier plus `## Evidence` stand-in is retired.
- PR into a **public** repo (or one slated to go public): run `node scripts/check-public-safe.mjs` (`--base <ref>` for a stacked PR) on the branch tip and paste its `check:public-safe PASS <repo>@<sha> (gitleaks 0, denylist 0)` line in the PR body. Tip moved since → run it again. A FAIL is fixed in content, never bypassed. No pass line, not Ready.
- If the ticket waits on another, set the GitHub blocked-by link in that same session. Do not leave the wait only in the body. Do not pull the dependent while the blocker is open, unless the blocker is on a leftover lane.
- A later production switch (class, weapon, flag) is **GoLive**, not Parked. GoLive stays held while its blocker is open.
- Children still do not run git unless the spawn explicitly says Mode B solo (one ticket, one agent, one branch). Default: conductor owns git; children report file lists.

## Parallel wave

A **wave** is two or more tickets whose blockers are all done. `/to-tickets` should have named exclusive paths. If it did not, **you** draft them now.

Obey **Ship mode** above. Mode A: same worktree on <dev-branch>. Mode B: one ticket one branch/PR or serialize -- not a shared <dev-branch> tip.

### Conductor steps

1. **Draft.** Load exclusive globs and frozen shared from the ticket bodies or the parent spec's conductor comment. If those lists are missing, draft them and post them. Wait for a one-line confirm **only** when two tickets still claim the same path after the draft.
2. **House.** Wire parent + map on every wave ticket (see **House**). Then **claim** — `gh issue edit <n> --add-assignee "@me"` on each wave ticket (quote `"@me"` on PowerShell) so a second terminal does not grab it. Do not use a comment instead.
3. **Separate before serializing.** Name the existing shared helpers for this wave's kind of change (retry, decode, client, fixture) in every packet as `SHARED_HELPERS`. If two or more wave tickets need a new shared helper, the conductor writes it once, first, as frozen shared, then spawns. Children never each write their own copy.
4. **Dispatch.** Spawn one implement subagent per extra ticket **before** this session writes product code. Do not skip the spawn and write the extras yourself. Each prompt includes: ticket URL + body, exclusive globs, frozen shared, `SHARED_HELPERS`, this repo's standing rules (branch, verify, no type workarounds), and the child rules below. Pick each child's shape (in-process, sibling session, or Cursor Task / cloud) and stay under the one child cap per [DELEGATION.md](../umbrella/DELEGATION.md) **Child shape by runtime**; a ticket past the cap or the memory check queues. A ticket whose blocker is still open is not spawned. Completion: the **spawn gate** is met. Then this session may edit the conductor exclusive.
5. **Own shared.** Only the conductor edits frozen shared files (append-only barrels, re-exports, defaults). Children consume them.
6. **Serialize git.** Children never run git (a sibling session pushes only its own ticket branch; fetch it). When a child reports done, scan its new files under shared folders (`utils/`, `lib/`, `helpers/`, `services/`, test fixtures) against `SHARED_HELPERS` and the other children's new files. A second copy goes back to that child before review. Then the conductor stages **only** that ticket's exclusive files and commits. Then the next child. Completion: one commit per ticket, exclusive files only.
7. **Review (per ticket).** As each child’s product lands, run the **Build loop** on **that** ticket (**Comment cleanup** → `/code-review` two-axis on the ticket → remainder back here → **Land gate**). When the land gate calls for `/build-verifier`, that child did not write the ticket, one per ticket. When **its** loop is empty, set the lane from what is left. Do not batch one review for the whole wave, and do not run one combined pre-merge check over the wave's diff. **Living docs**. On a leftover lane or Done, remove `ready-for-agent` and leave the other labels. Keep `ready-for-agent` on Live Beta and GoLive. Append a named line to the map.
8. **Recount.** Return to **Count first** **immediately** (close **or** leftover lane). Newly unblocked tickets are the next wave of **this** house. Repeat until **Crawl** says this house is done. A **House queue** with a next house returns to `/umbrella` after **End of house**. Do not pull that house's tickets here.

### Child rules

One copy, here. Every spawn carries them by reference: name this section and [BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) by path in the packet's `CHILD_RULES`; a local child (in-process, or a Cursor Task on this checkout) reads them. Paste the list verbatim only for a child that cannot read installed skills (a sibling or cloud session; [DELEGATION.md](../umbrella/DELEGATION.md) **Sibling contract**).


- Edit only your exclusive globs. Leave every other untracked file on disk.
- Frozen shared files are consume-only. Ask the conductor if you need an append.
- If you changed behavior and the seam has no colocated behavior test, add one. Report that test path.
- Do not add comments that narrate the change. An intentional API or constraint comment may stay. The conductor strips the rest in **Comment cleanup** before `/code-review`.
- Leave living docs (`docs/`, trackers, architecture map, Device QA **P\*** leaf) to the conductor. If a grep hit still lists this ticket as open, name the path. If the ticket is phone-visible, say so in the report.
- Do not run `git add`, `git commit`, `git checkout`, `git restore`, or `git clean` unless the conductor spawn explicitly allows Mode B solo (one ticket / one branch). Default: report a file list + test output when done.
- Mode A: same branch, same worktree. Mode B: conductor owns the PR branch; no extra checkout unless spawn says solo.
- Prove your own ticket: run the package `verify` for each package you touched, and the tests for your touched files and their direct callers, one file at a time. No directory or whole-suite sweep. Database tests follow [build-verifier](../build-verifier/SKILL.md) **Database test lanes**. Do not run `commands.pr_ready`; the land gate does.
- Type check, `verify`, and multi-test runs go through the heavy gate: `. /tmp/umbrella-heavy.sh && heavy <command>` ([BUILD-STANDING.md](../umbrella/BUILD-STANDING.md) **Heavy checks through the gate**).
- The same test or check red on two fix attempts in a row → stop and report `needs_parent` with the failing output and both diffs (**Build loop** **Repeat failure**). Do not try a third fix. A fix child sent with a repeat-failure verdict stops at its first red on that check and reports `needs_parent`; it does not try again.
- Run each check in the foreground to its exit. Do not end your turn waiting on one. Exit 137 or 143 is a kill, not a red gate: re-run it through the gate. Never report it as a failed AC.
- Use the helpers in `SHARED_HELPERS`. Do not write a second retry, decode, client, or fixture helper. Need a new shared one → ask the conductor.

### Hard git rules (conductor)

Stage named exclusive paths only. Leave other agents' untracked files on disk. One commit, then the next.

Mode A: commit + push to `<dev-branch>`. Mode B: commit + push to the PR branch only; set **Ready to merge** when green and waiting on the founder. Never master. Never merge, Preview fast-forward, migrate, OTA, or master promote until the user says so in that turn.

## End of house

When **Crawl** says no unblocked implement tickets remain, do this before you stop, or before `/umbrella` starts the next house in **House queue**. Each empty Build loop already set its own lane. This walk corrects any card still on the wrong Status. Window full skips it and names the tickets still on the wrong lane. Do not start the next house's tickets in this walk.

1. **Every open ticket in the house.** Live, parked, leftover, Ready to merge, Live Beta, and GoLive. Not a sample.
2. **Set each Status from what is actually left** ([PROJECTS.md](../umbrella/PROJECTS.md)):

| What is left | Lane |
| --- | --- |
| Code still to write, unblocked | In Progress if claimed, otherwise Unclaimed (unassigned until this session pulls it) |
| Pull request open, checks green, waiting on merge | Ready to merge |
| Phone-visible, and this pass cannot run Device QA | Desk device |
| Outdoor, GPS, or on-wrist proof still required | Field |
| Store, console, signing, auth-provider dashboard | Operator |
| Switch that waits for production | GoLive |
| Must finish before public beta | Live Beta |
| Shelved before launch | Parked |
| Merged or pushed, applicable checks and QA done, nothing else left | Done |

Backend, SQL, CI, Railway, types, website-only, reports, pure math, research, and deps/runtime use the non-device check that already applies. Do not put them on **Desk device** or **Field**. Do not invent a **Verify** column. **Parked** is the pre-launch shelf, not a verification hold. A merge is not **Done** while a check or applicable QA is still open. Order with the native parent / sub-issue link and blocked-by. Status moves follow [PROJECTS.md](../umbrella/PROJECTS.md) **Lane fit**. The gate owner ticks with that gate's evidence.

A desk check whose real remainder is "turn this on at production" moves to **GoLive** after the desk check, not to Done. Do not park a GoLive switch to keep the build from pulling it.

3. **Labels match the lane.** Drop `ready-for-agent` on Parked, a leftover lane, and Done. Keep it on Unclaimed, In Progress, Live Beta, and GoLive. A `parked:*` label belongs on Parked or a leftover lane, not on GoLive.
4. **Blocked-by links match the bodies.** Set any wait that is still only a sentence.
5. **Database migrate.** If this house added a new `backend/drizzle/0xxx_*.sql`, `project.yml` `commands.db_migrate` has already been run after that file existed. If it has not, run it now. Do not edit a migration that has already been applied. No new SQL file means do not run it again.
6. **Merge prompt (Ship mode PR only).** Name hot-file conflicts first: Ready-to-merge pull requests in this house that share a path with each other or with an earlier house still open. Dispatch orders the land. It does not GO a PR. Do not merge, rebase, or resolve that overlap until the founder says so in that turn. The check does not hold the next house's coding crawl. Then one message lists every Ready-to-merge pull request and asks to merge them. When they say merge, land one at a time per [DELEGATION.md](../umbrella/DELEGATION.md) **Recheck at merge**. Do not list a pull request whose living-doc verify, code-review, or land gate is still open. A **House queue** with a next house does not wait on that answer — return to `/umbrella` and start that house. After they merge, set those tickets to the lane that is actually left and walk the list again.

## Lessons

- **Native deps.** Flag a native package add or drop in the PR body when it opens. It needs a new binary, not OTA. Try a Linux or cloud `expo prebuild` before saying it needs a Mac.
- **Stall alarm.** A cloud fixup with no push in 30 minutes (15 for security work) gets an ETA or a kill-and-relaunch.
- **Migrations.** Drops and renames use expand/contract. Finalize steps run in one transaction. Real-Postgres tests run in CI or `/build-verifier`, never local-only. Keyset cursors keep full DB precision. A migration does not inherit a previous pass.
- **Tech Lead optional ideas** wait until after the land. Parity tables are a `/code-review` Spec line, not a second review.

## Your Pipeline ticks

Tick a box when the receipt that clears it exists (the `commands.pr_ready` pass line, the BV verdict when the land gate calls for it, Living docs, a P* leaf). N/A is `[x]` with a one-line reason. Do not batch-tick at the end. Other owners: area-coordinator `## Tick owners`.

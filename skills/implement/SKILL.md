---
name: implement
description: "Build work from a spec or tickets. Count the frontier, house each ticket on its spec and map, spawn extras, crawl newly unblocked tickets."
disable-model-invocation: true
---

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `implement`.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

**Seam test — create if missing.** When the ticket changes behavior, name the smallest seam you touched (`*.pure` / helper / service / guard / mapper). If that seam has no honest behavior test, **write one in this change**. Do not close the ticket without it. Follow the repo's test rules when they exist (`testing-avoid-mocks`, delete-on-sight). Types-only, rename, and comment-only skip.

This is not an `/audit` crawl. Do not inventory the neighborhood. Do not grind line-%. Do not add a smoke, snapshot, or “mock was called” suite to fill the gap. Do not mock the module under test.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

**Per ticket, before close or leftover-lane:** gap check on **that** ticket, then `/code-review` **to completion** for **that** ticket (two-axis report on the ticket **and** the **build loop**). Do not defer review until siblings land. In-scope findings return here on the same ticket.

## Gap check

After product code is in the tree, **before** you close a ticket, move it to a leftover lane, or say ACs hold. Run this **on each ticket**, not once for the wave.

1. Load remaining ACs from **that ticket’s body** (and any Done vs remaining comment). Chat memory is not the list.
2. For each AC, grep/read **current code** in the folder the editor is watching. Mark PASS / PARTIAL / FAIL with a path.
3. FAIL, or PARTIAL the ticket still requires → **do not close** and **do not** Desk-device it. Post Done vs remaining on the ticket. Stay on **that** ticket and keep building. Then run this gap check again.
4. A spec that said “behind the flag” is PASS when the wire is flag-gated even if the flag is off.
5. Post the PASS / PARTIAL / FAIL table on **that** ticket.

Completion: that ticket is PASS in current code, or **Window full** with the remaining ACs written on the spec. No close or leftover-lane on chat memory.

Commit your work to the current branch.

**Migrate.** When this change adds `backend/drizzle/0xxx_*.sql`, run `cd backend ; npm run db:migrate:all` in the same session after the file is on disk. A migrate run before that file exists will not include it.

## Build loop

Gap check and `/code-review` feed the **same** tickets until they are empty.

Do this **per ticket** as that ticket’s product lands. Do not wait for the rest of the wave.

1. Gap check on **this** ticket. PARTIAL or FAIL → keep building it → gap check again.
2. When every AC is PASS: **Living docs**, then `/code-review` to the two-axis report (`## Standards` / `## Spec`) **on this ticket**. Fixed point = this ticket’s first ship SHA (parent of that commit). Do not ask the user.
3. In-scope review findings become the new remaining-AC list on **this** ticket. Return to step 1 in this session.
4. When this ticket’s list is empty: close **or** move to a **leftover lane** ([PROJECTS.md](../umbrella/PROJECTS.md) — any Status that is not Parked / Unclaimed / Live Beta / GoLive / Ready to merge / In Progress / Done). Then **Crawl** — do not stop the session.
5. Stop the house only when no unblocked implement tickets remain, **Window full**, or the user stops.

A leftover lane is **not** Window full. Keep crawling.

`Later:` is grill / spec **not this pack** only ([PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md)). Remainder that still belongs to this ship stays on the live tickets.

Completion: no in-scope remainder on the wave tickets, or Window full with that remainder on the spec.

## Count first

Count open implement tickets whose **product** blockers are done, that are not already in-flight, and that wear **`umbrella:<slug>`** (not `parked:<slug>`, not `Later:` / `Leftover:`).

**Do not pull** a ticket already on a **leftover lane** (not Parked / Unclaimed / Live Beta / GoLive / Ready to merge / In Progress / Done) — that card is leftover, not frontier. **Live Beta** and **GoLive** are pullable (beta / pre-prod queues).

Treat leftover-lane cards as **satisfied** blockers. An open GitHub `blocked_by` already on a leftover lane does **not** hold the next wave. Do not write “still blocked until this ticket closes.”

**First reply.** Before House, `/tdd`, or any product-file edit, post this table in the user-visible reply:

| Unblocked | Role | Ticket |
| --- | --- | --- |
| *N* | conductor / child / this session | #n · title |

Then pick the session shape:

| Count | This session |
| --- | --- |
| **1** | Build that ticket here. |
| **2+** | This session is the **conductor**. Draft exclusives, spawn one child per extra ticket, then write only the conductor ticket. |

A named ticket (`/umbrella t5`, `/implement #243`) is the conductor's exclusive **for that wave**. The rest of that wave still gets children.

Shared overlap (one View, one controller, one board) goes on the **conductor exclusive** list. New or disjoint files stay on the other wave tickets. That split is the draft.

**Spawn gate.** Product-code edits start after one of:

- Count **1** — the table is posted.
- Count **2+** — every extra ticket has a **live child**.
- The posted exclusive table left every extra ticket with an empty exclusive list — then write one-by-one, and say that in one line.

Completion: the first reply contains the count table, and the spawn gate is met.

Rewrite `docs/agents/UMBRELLA_CURSOR.md` after the count table / claim, after each close, after each leftover-lane move, and on Window full ([CURSOR.md](../umbrella/CURSOR.md)). Do not rely on the spec comment alone as the step cursor.

After any leftover-lane move: **post the count table again in the same session** and start the next wave. Do not wait for the user.

## Window full

When this session **cannot** take the next wave (context/window actually full, or `/umbrella` stops before loading implement). Moving a ticket to a leftover lane is **not** this. Crawl the next unblocked tickets.

1. Post or update the **conductor comment on the spec** with remaining frontier (ticket numbers, unblocked vs held, exclusive globs if a parallel wave, frozen shared).
2. Print `Next: /implement #<n>` for the unblocked frontier. If that frontier is **2+** tickets, add: this next session is **conductor** and must spawn extras before product code.
3. Stop. Tickets plus that comment are the resume.

Completion: the spec comment matches the remaining tree, and the user-visible last line is `Next: /implement #<n>`.

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

On close **or** leftover-lane: **Living docs** comment must already be on the ticket. Pick the leftover Status that matches the wait (phone → Desk device via [DEVICE-QA.md](../umbrella/DEVICE-QA.md); console → Operator; outdoor → Field; or a later leftover column). Do not close. Then **Crawl**. If you do close (no leftover): remove `ready-for-agent` and any `parked:<slug>`. Append one named line to the map's Decisions-so-far. Close **this child** (Status **Done**, keep the milestone). Do **not** archive that card yet. Then [CLOSE-PARENTS.md](../umbrella/CLOSE-PARENTS.md). Then [PROJECTS.md](../umbrella/PROJECTS.md) **Archive Done**. Then **Crawl**. Leftover cards still open → do not Hit the milestone.

## Living docs

Hard gate. After gap check PASS, **before** GitHub close **or** a leftover-lane move. Same change as the ticket (conductor commits it). Children name the hits; they do not edit `docs/`.

1. Grep `docs/` (including `docs/trackers/`) for **this ticket number**, the spec number, and `umbrella:<slug>`. Also grep house encyclopedias the ticket names (`ADVENTURE_CONTRACTS_BOARD`, admin guides, `WAYFINDER_NOW`, `WAYFINDER_MAPS`, module-intent).
2. For each hit that still reads as open / **Do now** / unchecked work: mark it shipped (strikethrough, SHA, or leftover-lane). Point a now-list at the next **open product** child, not this leftover card.
3. Architecture-map fragment if the ship is node-worthy — same change.
4. Post a **Living docs** comment on **this ticket**: one row per hit (`path` · updated / already historical). Zero rows is only valid if grep returned none — say that.
5. A hit still saying **Do now** / open work → **do not** close and **do not** move to a leftover lane. That is remaining AC.

Typical misses: `docs/trackers/WAYFINDER_NOW.md`, `docs/trackers/WAYFINDER_MAPS.md`, the house board, admin guide, Device QA **P\*** leaf.

**Effect-TS check (XyberRun).** Distinct from the census listing below. **Skip unless this change is the same shape as an existing Effect seam.** After product code, ask whether a sibling already uses `Schema`/`Either` or `Effect`+`Schedule` for this shape. If no — UI, tRPC Zod, Wear, a service with no untrusted bag — do nothing. Do not invent a third style. Do not wrap a service in `Effect.gen` because `effect` is a dependency.

| Already in the repo | Use it only when the new code is that shape |
| --- | --- |
| `Schema` + `Either` decode/encode | Untrusted `JSON.parse`, webhook `data`, native dict, untyped `res.json`, cache/file JSON. Do **not** dual-schema tRPC Zod inputs. |
| `Effect` + `Schedule` retry | Flaky outbound HTTP like `walkingWayOverpassClient.ts` / `walkingWayGeofabrikClient.ts`. Do not write a one-off retry loop next to those clients. |

**Do not** pull Effect into Wear OS / watch Kotlin. A UI ticket with no JSON bag and no Overpass-style client skips this check. If a sibling already uses Schema/Either or Effect+Schedule for this shape and this change did not, fix it in the same change or comment on the ticket why not.

**Effect Schema inventory (XyberRun).** If this change adds or edits a production `JSON.parse`, webhook `data` bag, native dict, or untyped `res.json`, add or update a row in `docs/engineering/EFFECT_SCHEMA_TRUST_BOUNDARIES.md` in the **same change** (P0/P1/P2). Then run `npm run check:effect-schema-inventory`. Listing is required even if Schema is later. The **Effect-TS check** still runs: a listed bag that is still hand-parsed is a remaining AC. Auth-adjacent bags still need the auth checklist before code.

**Cycles (XyberRun).** Package `verify` does not run `check-cycles`. That check is master-bar (`preflight:governance:cycles`). `/code-review` runs it when the ticket touched `backend/src` or mobile `src`. A new cycle is a Standards hard violation and a remaining AC.

`/code-review` Standards also pins (hard, same-ticket remaining ACs): node-worthy map fragment missing; fat tRPC router; auth-glob drive-by; new low-value test; raw `subscriptionTier ===` in product code; raw RN `Modal` without OTA ui-busy.

**Device QA leaf.** When this repo has `docs/operations/DEVICE_QA_PHASED_CHECKLIST.md` and the ship is **phone-visible**, append a **P\*** leaf in the same change — Process **When a feature ships** in that file. Conductor writes it. Children name phone-visible tickets in their report. If a later `/device-qa-agent` run finds a missed ship, **Leaves** (before Probe) appends it — catch-up, not a replacement for writing it here.

The conductor writes these files (and commits them with the ticket). Children leave them alone.

Completion: the Living docs comment is on the ticket, and every grep hit is done/historical or leftover-labeled. Do not create a new tracker file. Missing comment → Build loop not empty.

`/code-review` is required **on this ticket** before close or leftover-lane. In-scope findings return to **Build loop** on the same ticket. Do not reopen a closed ticket to flip checkboxes — keep it open, or post remaining ACs on it, and keep building.

## Crawl

The house is a tree, not one wave. After each ticket **closes** **or** moves to a **leftover lane** (product ACs PASS), recount **in this session**. Post the count table. Spawn the next wave. Do not stop because the last card stayed open on a leftover column.

- Unblocked and not in-flight → join the live wave. Draft exclusives if missing. Spawn a child for each extra (and for every new ticket if the conductor is already writing one).
- Open **product** blocker remains (still In Progress / Unclaimed, ACs not PASS) → **hold**. Name the blocker.
- Blocker is already on a leftover lane → **not a hold**. Unlock dependents now.
- Exclusive glob still owned by an in-flight child → hold until that commit.

Example: T1 product-done → leftover lane unlocks T2/T3/T4 even though T1 is still open. T3 later leftover-lanes and unlocks T5/T6. Spawn T5 and T6 in this session.

This session stays conductor across waves. Completion: no unblocked implement tickets remain (leftover-lane cards do not count), the user stops, or **Window full**.


## Ship mode (sticky — read the pin)

Read `Ship mode: Development` or `Ship mode: PR` from `docs/agents/UMBRELLA_CURSOR.md` (or the conductor comment). **Do not re-pick.** Actor force already locked it for this run (Grok Bot / Cursor cloud -> PR; local Grok Build / Cursor IDE on AlphaTerminal -> Development). Wrong pin for this actor -> correct once, note it, stay sticky.

Also: cloud **Mode B** always parks phone hardware on **Desk device**; Maestro crawl only on AlphaTerminal ([DEVICE-QA.md](../umbrella/DEVICE-QA.md)).

### Mode A — `Ship mode: Development`

- Stay in the **same worktree** on **`Development`**. Isolated git worktrees only if Jacob asks.
- Conductor commits on `Development` and **pushes to `origin/Development`** when implementing (cloud save). No PR.
- Parallel waves OK in one worktree. Children never run git (see Child rules). Conductor serializes commits.
- Close -> **Done** (or a leftover lane). Never **Ready to merge** in Mode A.

### Mode B — `Ship mode: PR`

- **One ticket -> one branch -> one PR** into `Development`, or **serialize**. Do not parallel-commit multiple tickets into one PR / one worktree tip.
- Push **only** to the PR branch. Never push to `Development` tip, Preview, or `master`. Never merge without Jacob.
- When PR is open, checks green, waiting on Jacob: Status **Ready to merge** ([PROJECTS.md](../umbrella/PROJECTS.md)). Dependents **WAIT** until Done (merged) or parked -- Ready to merge is **not** a leftover lane.
- Children still do not run git unless the spawn explicitly says Mode B solo (one ticket, one agent, one branch). Default: conductor owns git; children report file lists.

## Parallel wave

A **wave** is two or more tickets whose blockers are all done. `/to-tickets` should have named exclusive paths. If it did not, **you** draft them now.

Obey **Ship mode** above. Mode A: same worktree on Development. Mode B: one ticket one branch/PR or serialize -- not a shared Development tip.

### Conductor steps

1. **Draft.** Load exclusive globs and frozen shared from the ticket bodies or the parent spec's conductor comment. If those lists are missing, draft them and post them. Wait for a one-line confirm **only** when two tickets still claim the same path after the draft.
2. **House.** Wire parent + map on every wave ticket (see **House**). Then **claim** — `gh issue edit <n> --add-assignee "@me"` on each wave ticket (quote `"@me"` on PowerShell) so a second terminal does not grab it. Do not use a comment instead.
3. **Dispatch.** Spawn one implement subagent per extra ticket. Each prompt includes: ticket URL + body, exclusive globs, frozen shared, this repo's standing rules (branch, verify, no type workarounds), and the child rules below. Completion: the **spawn gate** is met. Then this session may edit the conductor exclusive.
4. **Own shared.** Only the conductor edits frozen shared files (append-only barrels, re-exports, defaults). Children consume them.
5. **Serialize git.** Children never run git. When a child reports done, the conductor stages **only** that ticket's exclusive files and commits. Then the next child. Completion: one commit per ticket, exclusive files only.
6. **Review (per ticket).** As each child’s product lands, run the **Build loop** on **that** ticket (gap check → `/code-review` two-axis on the ticket → remainder back here). Close or leftover-park that ticket only when **its** loop is empty. Do not batch one review for the whole wave. **Living docs**, then remove `ready-for-agent` only. Append a named line to the map.
7. **Recount.** Return to **Count first** **immediately** (close **or** leftover lane). Newly unblocked tickets are the next wave. Repeat until **Crawl** says this session is done.

### Child rules (paste into every spawn)

- Edit only your exclusive globs. Leave every other untracked file on disk.
- Frozen shared files are consume-only. Ask the conductor if you need an append.
- If you changed behavior and the seam has no colocated behavior test, add one. Report that test path.
- Leave living docs (`docs/`, trackers, architecture map, Device QA **P\*** leaf) to the conductor. If a grep hit still lists this ticket as open, name the path. If the ticket is phone-visible, say so in the report.
- Do not run `git add`, `git commit`, `git checkout`, `git restore`, or `git clean` unless the conductor spawn explicitly allows Mode B solo (one ticket / one branch). Default: report a file list + test output when done.
- Mode A: same branch, same worktree. Mode B: conductor owns the PR branch; no extra checkout unless spawn says solo.

### Hard git rules (conductor)

Stage named exclusive paths only. Leave other agents' untracked files on disk. One commit, then the next.

Mode A: commit + push to `Development`. Mode B: commit + push to the PR branch only; set **Ready to merge** when green and waiting on Jacob. Never master. Never merge without Jacob.

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

Once done, run `/code-review` **to completion** (two-axis report **and** the **build loop**). In-scope review findings return here on the same tickets.

## Gap check

After product code is in the tree, **before** you close a ticket or say ACs hold:

1. Load remaining ACs from the **ticket body** (and any Done vs remaining comment). Chat memory is not the list.
2. For each AC, grep/read **current code** in the folder the editor is watching. Mark PASS / PARTIAL / FAIL with a path.
3. FAIL, or PARTIAL the ticket still requires → **do not close**. Post Done vs remaining on the ticket. Stay on these tickets and keep building. Then run this gap check again.
4. A spec that said “behind the flag” is PASS when the wire is flag-gated even if the flag is off.

Completion: every wave ticket is PASS in current code, or **Window full** with the remaining ACs written on the spec. No close on chat memory.

Commit your work to the current branch.

**Migrate.** When this change adds `backend/drizzle/0xxx_*.sql`, run `cd backend ; npm run db:migrate:all` in the same session after the file is on disk. A migrate run before that file exists will not include it.

## Build loop

Gap check and `/code-review` feed the **same** tickets until they are empty.

1. Gap check. PARTIAL or FAIL → keep building on those tickets → gap check again.
2. When every AC is PASS: **Living docs**, then `/code-review` to the two-axis report.
3. In-scope review findings (standards **hard** violations, spec missing / partial / wrong) become the new remaining-AC list on those tickets. Return to step 1 in this session.
4. Stop when that list is empty, **Window full**, or the user stops.

`Later:` is grill / spec **not this pack** only ([PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md)). Remainder that still belongs to this ship stays on the live tickets.

Completion: no in-scope remainder on the wave tickets, or Window full with that remainder on the spec.

## Count first

Count open implement tickets whose blockers are all done, that are not already in-flight, and that wear **`umbrella:<slug>`** (not `parked:<slug>`, not `Later:` / `Leftover:`).

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

## Window full

When this session cannot take the next wave (window full, or `/umbrella` stops before loading implement):

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
6. **Project** — each wave ticket is on the XyberRun Project. `item-add` if missing. Set Status **In Progress** on claim, **Done** on close. See `/umbrella` [PROJECTS.md](../umbrella/PROJECTS.md).

Completion: every wave ticket names spec + map, wears the house labels, is a child of the map, has a milestone, is on the Project, and is assigned to `@me`.

On close: **Living docs**, then remove `ready-for-agent` only. Append one named line to the map's Decisions-so-far. Leave the map open. **Keep the milestone** on the closed ticket. If this was the last open issue in that house (no parked leftovers), close the milestone and set `due_on` to today — `/umbrella` **Milestones** §9.

## Living docs

After gap check PASS, before the GitHub close, bring every **living doc** that still treats this ticket as open work in line with what shipped.

Find them: grep `docs/` (including `docs/trackers/` when that folder exists) for the ticket number, the spec number, and the house `umbrella:<slug>`. Typical hits: a daily now-list, a house encyclopedia, a plans file, a go-live checklist. If this repo's agent rules require an architecture-map update for node-worthy wiring, do that in the same change.

**Effect-TS check (XyberRun).** Distinct from the census listing below. **Skip unless this change is the same shape as an existing Effect seam.** After product code, ask whether a sibling already uses `Schema`/`Either` or `Effect`+`Schedule` for this shape. If no — UI, tRPC Zod, Wear, a service with no untrusted bag — do nothing. Do not invent a third style. Do not wrap a service in `Effect.gen` because `effect` is a dependency.

| Already in the repo | Use it only when the new code is that shape |
| --- | --- |
| `Schema` + `Either` decode/encode | Untrusted `JSON.parse`, webhook `data`, native dict, untyped `res.json`, cache/file JSON. Do **not** dual-schema tRPC Zod inputs. |
| `Effect` + `Schedule` retry | Flaky outbound HTTP like `walkingWayOverpassClient.ts` / `walkingWayGeofabrikClient.ts`. Do not write a one-off retry loop next to those clients. |

**Do not** pull Effect into Wear OS / watch Kotlin. A UI ticket with no JSON bag and no Overpass-style client skips this check. If a sibling already uses Schema/Either or Effect+Schedule for this shape and this change did not, fix it in the same change or comment on the ticket why not.

**Effect Schema inventory (XyberRun).** If this change adds or edits a production `JSON.parse`, webhook `data` bag, native dict, or untyped `res.json`, add or update a row in `docs/engineering/EFFECT_SCHEMA_TRUST_BOUNDARIES.md` in the **same change** (P0/P1/P2). Then run `npm run check:effect-schema-inventory`. Listing is required even if Schema is later. The **Effect-TS check** still runs: a listed bag that is still hand-parsed is a remaining AC. Auth-adjacent bags still need the auth checklist before code.

**Device QA leaf.** When this repo has `docs/operations/DEVICE_QA_PHASED_CHECKLIST.md` and the ship is **phone-visible**, append a **P\*** leaf in the same change — Process **When a feature ships** in that file. Conductor writes it. Children name phone-visible tickets in their report. If a later `/device-qa-agent` run finds a missed ship, **Leaves** (before Probe) appends it — catch-up, not a replacement for writing it here.

For each hit: mark this ticket done (strikethrough, closed, or shipped SHA), and point the frontier at the next open child when the doc is a now-list.

The conductor writes these files (and commits them with the ticket). Children leave them alone.

Completion: every grep hit in `docs/` either already reads as done/historical, or you updated it in this change. Do not create a new tracker file.

`/code-review` is required. In-scope findings return to **Build loop** on the same tickets. Do not reopen a closed ticket to flip checkboxes — keep it open, or post remaining ACs on it, and keep building.

## Crawl

The house is a tree, not one wave. After each ticket **closes**, recount.

- Unblocked and not in-flight → join the live wave. Draft exclusives if missing. Spawn a child for each extra (and for every new ticket if the conductor is already writing one).
- Open blocker remains → **hold**. Name the blocker.
- Exclusive glob still owned by an in-flight child → hold until that commit.

Example: T1 closes and unlocks T2/T3/T4; T3 later closes and unlocks T5/T6. Spawn T5 and T6 as soon as T3 is closed, even if T2 and T4 are still running.

This session stays conductor across waves. Completion: no unblocked implement tickets remain, the user stops, or **Window full**.

## Parallel wave

A **wave** is two or more tickets whose blockers are all done. `/to-tickets` should have named exclusive paths. If it did not, **you** draft them now.

Stay in the **same worktree**. Isolated git worktrees only if the user asks.

### Conductor steps

1. **Draft.** Load exclusive globs and frozen shared from the ticket bodies or the parent spec's conductor comment. If those lists are missing, draft them and post them. Wait for a one-line confirm **only** when two tickets still claim the same path after the draft.
2. **House.** Wire parent + map on every wave ticket (see **House**). Then **claim** — `gh issue edit <n> --add-assignee "@me"` on each wave ticket (quote `"@me"` on PowerShell) so a second terminal does not grab it. Do not use a comment instead.
3. **Dispatch.** Spawn one implement subagent per extra ticket. Each prompt includes: ticket URL + body, exclusive globs, frozen shared, this repo's standing rules (branch, verify, no type workarounds), and the child rules below. Completion: the **spawn gate** is met. Then this session may edit the conductor exclusive.
4. **Own shared.** Only the conductor edits frozen shared files (append-only barrels, re-exports, defaults). Children consume them.
5. **Serialize git.** Children never run git. When a child reports done, the conductor stages **only** that ticket's exclusive files and commits. Then the next child. Completion: one commit per ticket, exclusive files only.
6. **Review.** Run the **Build loop** (gap check → `/code-review` → remainder back here). Close tickets only when the loop is empty. **Living docs**, then remove `ready-for-agent` only. Append a named line to the map.
7. **Recount.** Return to **Count first** for this house. Newly unblocked tickets are the next wave. Repeat until **Crawl** says this session is done.

### Child rules (paste into every spawn)

- Edit only your exclusive globs. Leave every other untracked file on disk.
- Frozen shared files are consume-only. Ask the conductor if you need an append.
- If you changed behavior and the seam has no colocated behavior test, add one. Report that test path.
- Leave living docs (`docs/`, trackers, architecture map, Device QA **P\*** leaf) to the conductor. If a grep hit still lists this ticket as open, name the path. If the ticket is phone-visible, say so in the report.
- Do not run `git add`, `git commit`, `git checkout`, `git restore`, or `git clean`. Report a file list + test output when done.
- Same branch, same worktree. No extra checkout.

### Hard git rules (conductor)

Stage named exclusive paths only. Leave other agents' untracked files on disk. One commit, then the next.

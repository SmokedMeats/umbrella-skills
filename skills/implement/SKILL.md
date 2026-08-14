---
name: implement
description: "Build work from a spec or tickets. Count the frontier, house each ticket on its spec and map, spawn extras, crawl newly unblocked tickets."
disable-model-invocation: true
---

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `implement`.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.

## Count first

Count open implement tickets whose blockers are all done and that are not already in-flight.

| Count | This session |
| --- | --- |
| **1** | Build that ticket here. |
| **2+** | This session is the **conductor**. Draft exclusives, spawn one child per extra ticket, then write only the conductor ticket. |

A named ticket (`/umbrella t5`, `/implement #243`) is the conductor's exclusive **for that wave**. The rest of that wave still gets children.

Shared overlap (one View, one controller, one board) goes on the **conductor exclusive** list. New or disjoint files stay on the leftover tickets. That split is the draft.

Product-code edits start after every extra ticket has a **live child**.

Write one-by-one only when the posted exclusive table leaves every extra ticket with an empty exclusive list. Say that in one line.

## House

Before product code, every ticket in this wave is on the house. `/to-tickets` should have done this. If it did not, **you** do it now.

- **Map** — the `wayfinder:map` for this pack.
- **Parent** — the spec `/to-spec` published. If there is no spec, the map is the parent.

On each wave ticket (and the spec, if it is missing this too):

1. Body `## Parent` names the spec **and** the map (title + link, not a bare number).
2. Apply the house `domain:*` and `umbrella:*` with `--add-label`. Create `umbrella:*` if the pack is real and the label is missing.
3. Link the ticket as a **child of the map** (tracker sub-issue). If the tracker has no sub-issues, put `Part of #<map>` at the top of the body.

Completion: every wave ticket names spec + map, wears the house labels, and is a child of the map.

On close: remove `ready-for-agent` only. Append one named line to the map's Decisions-so-far. Leave the map open.

## Crawl

The house is a tree, not one wave. After each ticket **closes**, recount.

- Unblocked and not in-flight → join the live wave. Draft exclusives if missing. Spawn a child for each extra (and for every new ticket if the conductor is already writing one).
- Open blocker remains → **hold**. Name the blocker.
- Exclusive glob still owned by an in-flight child → hold until that commit.

Example: T1 closes and unlocks T2/T3/T4; T3 later closes and unlocks T5/T6. Spawn T5 and T6 as soon as T3 is closed, even if T2 and T4 are still running.

This session stays conductor across waves. Completion: no unblocked implement tickets remain, or the user stops, or the window is full (then hand the next frontier URLs).

## Parallel wave

A **wave** is two or more tickets whose blockers are all done. `/to-tickets` should have named exclusive paths. If it did not, **you** draft them now.

Stay in the **same worktree**. Isolated git worktrees only if the user asks.

### Conductor steps

1. **Draft.** Load exclusive globs and frozen shared from the ticket bodies or the parent spec's conductor comment. If those lists are missing, draft them and post them. Wait for a one-line confirm **only** when two tickets still claim the same path after the draft.
2. **House.** Wire parent + map on every wave ticket (see **House**). Then **claim** — assign each wave ticket (or comment "in progress") so a second terminal does not grab it.
3. **Dispatch.** Spawn one implement subagent per extra ticket. Each prompt includes: ticket URL + body, exclusive globs, frozen shared, this repo's standing rules (branch, verify, no type workarounds), and the child rules below. Completion: every extra ticket has a live child. Then this session may edit the conductor exclusive.
4. **Own shared.** Only the conductor edits frozen shared files (append-only barrels, re-exports, defaults). Children consume them.
5. **Serialize git.** Children never run git. When a child reports done, the conductor stages **only** that ticket's exclusive files and commits. Then the next child. Completion: one commit per ticket, exclusive files only.
6. **Review.** `/code-review` on the wave commits. Close tickets only when their acceptance criteria hold. Remove `ready-for-agent` only. Append a named line to the map.
7. **Recount.** Return to **Count first** for this house. Newly unblocked tickets are the next wave. Repeat until **Crawl** says this session is done.

### Child rules (paste into every spawn)

- Edit only your exclusive globs. Leave every other untracked file on disk.
- Frozen shared files are consume-only. Ask the conductor if you need an append.
- Do not run `git add`, `git commit`, `git checkout`, `git restore`, or `git clean`. Report a file list + test output when done.
- Same branch, same worktree. No extra checkout.

### Hard git rules (conductor)

Stage named exclusive paths only. Leave other agents' untracked files on disk. One commit, then the next.

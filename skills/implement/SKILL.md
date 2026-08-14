---
name: implement
description: "Build work from a spec or tickets. Count unblocked tickets first: one ticket in this session; two or more is a wave — spawn children, then this session writes the conductor ticket."
disable-model-invocation: true
---

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `implement`.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.

## Count first

Count open implement tickets whose blockers are all done.

| Count | This session |
| --- | --- |
| **1** | Build that ticket here. |
| **2+** | This session is the **conductor**. Draft exclusives, spawn one child per extra ticket, then write only the conductor ticket. |

A named ticket (`/umbrella t5`, `/implement #243`) is the conductor's exclusive. The rest of the wave still gets children.

Shared overlap (one View, one controller, one board) goes on the **conductor exclusive** list. New or disjoint files stay on the leftover tickets. That split is the draft.

Product-code edits start after every extra ticket has a **live child**.

Write one-by-one only when the posted exclusive table leaves every extra ticket with an empty exclusive list. Say that in one line.

## Parallel wave

A **wave** is two or more tickets whose blockers are all done. `/to-tickets` should have named exclusive paths. If it did not, **you** draft them now.

Stay in the **same worktree**. Isolated git worktrees only if the user asks.

### Conductor steps

1. **Draft.** Load exclusive globs and frozen shared from the ticket bodies or the parent spec's conductor comment. If those lists are missing, draft them and post them. Wait for a one-line confirm **only** when two tickets still claim the same path after the draft.
2. **Claim.** Assign each wave ticket (or comment "in progress") so a second terminal does not grab it.
3. **Dispatch.** Spawn one implement subagent per extra ticket. Each prompt includes: ticket URL + body, exclusive globs, frozen shared, this repo's standing rules (branch, verify, no type workarounds), and the child rules below. Completion: every extra ticket has a live child. Then this session may edit the conductor exclusive.
4. **Own shared.** Only the conductor edits frozen shared files (append-only barrels, re-exports, defaults). Children consume them.
5. **Serialize git.** Children never run git. When a child reports done, the conductor stages **only** that ticket's exclusive files and commits. Then the next child. Completion: one commit per ticket, exclusive files only.
6. **Review.** `/code-review` on the wave commits. Close tickets only when their acceptance criteria hold.

### Child rules (paste into every spawn)

- Edit only your exclusive globs. Leave every other untracked file on disk.
- Frozen shared files are consume-only. Ask the conductor if you need an append.
- Do not run `git add`, `git commit`, `git checkout`, `git restore`, or `git clean`. Report a file list + test output when done.
- Same branch, same worktree. No extra checkout.

### Hard git rules (conductor)

Stage named exclusive paths only. Leave other agents' untracked files on disk. One commit, then the next.

---
name: implement
description: "Build work from a spec or tickets. One ticket in this session; a parallel wave is dispatched to same-worktree subagents under this session as conductor."
disable-model-invocation: true
---

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `implement`.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.

## One ticket

`/implement` with a single ticket, or a linear frontier of one: do the work in this session. That is the default.

## Parallel wave

A **wave** is two or more tickets whose blockers are all done. `/to-tickets` names the wave and each ticket's **exclusive** paths. The user should not open extra terminals.

This session is the **conductor**. Stay in the **same worktree**. Spawn a subagent per extra ticket; this session may keep one exclusive ticket (usually the one that touches shared files). Isolated git worktrees only if the user asks.

### Conductor steps

1. **Read the wave.** Load exclusive globs and frozen shared from the ticket bodies or the parent spec's conductor comment. If those lists are missing, draft them, post them, and wait for a one-line confirm only when ownership is ambiguous.
2. **Claim.** Assign each wave ticket (or comment "in progress") so a second terminal does not grab it.
3. **Dispatch.** Spawn one implement subagent per extra ticket. Each prompt includes: ticket URL + body, exclusive globs, frozen shared, this repo's standing agent rules, and the child rules below. Completion: every extra ticket has a live child.
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

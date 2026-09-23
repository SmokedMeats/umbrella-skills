---
name: grill-me
description: "A relentless interview to sharpen a plan or design. Use when a wayfinder grilling batch is open, the user wants a plan stress-tested, or /umbrella finished the pre-grill gap list. On a wayfinder ticket, pull the whole umbrella into this session, announce which ticket is live, and advance siblings yourself. The user only answers questions. Refuse the lock while any pre-grill gap is open."
---

# Grill Me

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `grill-me`.

Load the umbrella (parent `wayfinder:map`, or the map they named). Collect sibling `wayfinder:grilling` tickets that wear **`umbrella:<slug>`**. Skip `parked:<slug>` and `Later:` / `Leftover:` titles. **Claim the live batch first** — `gh issue edit <n> --add-assignee "@me"` on those live siblings only (quote `"@me"` on PowerShell). Set Project Status **In Progress** per `/umbrella` [PROJECTS.md](../umbrella/PROJECTS.md). Show the batch once, by name. Then run `/grilling` — that skill owns the rounds, the **Now on** line, recording, and advancing.

You pick the next ticket. The user never has to remember which issue is open or say "next grill."

No umbrella → `/grilling` as a single tree. The pre-grill gap list is still required.

## Pre-grill gate

`/umbrella` **Pre-grill** must hand you a written gap list before the first question. If this session has no gap list, do not start the interview. Read that section and do the doc pass, or return to `/umbrella`.

Refuse the lock while any gap is open or vague. A gap is closed only when it is **answered**, **deferred** (owner + ticket), or **cut** (reason). `later` and `TBD` are open.

When the live batch is locked (the user confirms shared understanding, and every gap is closed), **next is `/to-spec` immediately**. Do not wait for a second approval. Not `/implement` yet. If `/umbrella` is driving, continue into `/to-spec` in this session.

Rewrite `docs/agents/UMBRELLA_CURSOR.md` after claim and after each grill round ([CURSOR.md](../umbrella/CURSOR.md)).

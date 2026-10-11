---
name: grill-me
description: "A relentless interview to sharpen a plan or design. Use when a wayfinder grilling batch is open, the user wants a plan stress-tested, or /umbrella finished the pre-grill gap list. On a wayfinder ticket, pull the whole umbrella into this session, announce which ticket is live, and advance siblings yourself. The user only answers questions. Refuse the lock while any pre-grill gap is open."
---

# Grill Me

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `grill-me`.

Load the umbrella (parent `wayfinder:map`, or the map they named). Collect sibling `wayfinder:grilling` tickets that wear **`umbrella:<slug>`**. Skip `parked:<slug>` and `Later:` / `Leftover:` titles. **Claim the live batch first** — `gh issue edit <n> --add-assignee "@me"` on those live siblings only (quote `"@me"` on PowerShell). Set Project Status **In Progress** per `/umbrella` [PROJECTS.md](../umbrella/PROJECTS.md). Show the batch once, by name. Then run `/grilling` — that skill owns the rounds, the **Now on** line, recording, and advancing. Question shape is locked there: Context (plain terms), Choices, and Recommend. Do not ask a shorter form from this file.

You pick the next ticket. The user never has to remember which issue is open or say "next grill."

No umbrella → `/grilling` as a single tree. The pre-grill gap list is still required.

## Steps

Copy these into your todo list first ([CONVENTIONS.md](../umbrella/CONVENTIONS.md) **Steps**). The sections below hold the detail.

1. Have the written gap list from [PRE-GRILL.md](../umbrella/PRE-GRILL.md). proof: the list, on the map or the live grilling ticket.
2. Load the umbrella and collect the live `wayfinder:grilling` siblings. proof: the batch, shown once by name.
3. Claim the live batch, set Status **In Progress**, rewrite the cursor. proof: the assignees and the cursor rewrite.
4. Run `/grilling` rounds (Context, Choices, Recommend), writing each lock to its owning ticket. proof: the lock comments.
5. Rewrite the cursor after each round. proof: the cursor names the live ticket.
6. Lock only when every gap is answered, deferred or cut, and the user confirms. proof: the closed gap list and the user's confirm.
7. Next is `/to-spec`, now. proof: `Next: /to-spec`.

## Pre-grill gate

umbrella [PRE-GRILL.md](../umbrella/PRE-GRILL.md) must hand you a written gap list before the first question. If this session has no gap list, do not start the interview. Read that section and do the doc pass, or return to `/umbrella`.

Refuse the lock while any gap is open or vague. A gap is closed only when it is **answered**, **deferred** (owner + ticket), or **cut** (reason). `later` and `TBD` are open.

When the live batch is locked (the user confirms shared understanding, and every gap is closed), **next is `/to-spec` immediately**. Do not wait for a second approval. Not `/implement` yet. If `/umbrella` is driving, continue into `/to-spec` in this session.

Rewrite `project.yml` `paths.umbrella_cursor` after claim and after each grill round ([CURSOR.md](../umbrella/CURSOR.md)).

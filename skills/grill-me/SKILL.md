---
name: grill-me
description: A relentless interview to sharpen a plan or design. On a wayfinder ticket, pull the whole umbrella into this session, announce which ticket is live, and advance siblings yourself — the user only answers questions.
disable-model-invocation: true
---

# Grill Me

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `grill-me`.

Load the umbrella (parent `wayfinder:map`, or the map they named). Collect sibling `wayfinder:grilling` tickets that wear **`umbrella:<slug>`**. Skip `parked:<slug>` and `Later:` / `Leftover:` titles. **Claim the live batch first** — `gh issue edit <n> --add-assignee "@me"` on those live siblings only (quote `"@me"` on PowerShell). Show the batch once, by name. Then run `/grilling` — that skill owns the rounds, the **Now on** line, recording, and advancing.

You pick the next ticket. The user never has to remember which issue is open or say "next grill."

No umbrella → `/grilling` as a single tree.

When the live batch is locked, **next is `/to-spec`** (or `/umbrella` if you need the house picker). Not `/implement`.

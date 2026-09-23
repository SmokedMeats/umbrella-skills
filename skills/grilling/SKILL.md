---
name: grilling
description: "Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any grill trigger phrases. On a wayfinder ticket or map, load the umbrella, grill every sibling in the same session, and announce which ticket is live. The user only answers questions. Every question is locked to Context (plain terms), Choices, and a Recommend line. Refuse the lock while a pre-grill gap is open."
---

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `grilling`.

Read `/domain-modeling` from the parent skills directory and follow it with this interview. Do not reimplement it. Do not copy that skill into this overlay.

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round. Every question uses **Question shape (locked)** below, including your recommended answer. Then wait for the user's answers before the next round.

## Question shape (locked)

Mandatory. Context and Recommend are always required. Choices are required too, except the rare free-form case in the rules below. A question that skips this shape is not a grill question.

- Never ask a bare technical or architecture question without the **Context (plain terms)** block.
- Multiple choices are required unless the answer is truly free-form (rare). Even then, still give Context and a recommended default.
- Context must include all context around the question in plain terms — settled prerequisites, product meaning, and the tradeoffs of the options — so the founder is not hunting docs or prior messages.
- For XyberRun product houses, plain terms means what a runner sees, does, or feels. For non-product houses, plain terms means what the affected user (developer, operator, reader) experiences.
- Restate the relevant settled bits inside Context. Do not assume the founder remembers prior rounds.
- Include a Park / Later choice when cutting is real.

Each question is structured like this:

```
❓ **Q1** - **<short title>**

**Context (plain terms):** <2–6 sentences. From a user/runner (or affected user) perspective: what this part of the product does, what is already locked that this hangs off, why this is the open decision now, and what each choice would feel like in the product. No jargon without a plain gloss. Do not assume the founder remembers prior rounds — restate the relevant settled bits here.>

**Choices:**
- A) …
- B) …
- C) … (include a Park / Later option when cutting is real)

➡️ **Recommend:** <letter + one-line why>
```

Quick example (shape only):

```
❓ **Q1** - **When the receipt says refunded**

**Context (plain terms):** A runner who paid for a race asks for their money back from the receipt. We already locked that the request is one tap, and that the organizer still sees it. What is open is when the receipt says the money is refunded: right after the tap, or only after the organizer accepts. Immediate means the runner treats the money as on its way. Waiting means the receipt stays "requested" until the organizer says yes.

**Choices:**
- A) Say "refunded" as soon as the runner taps
- B) Stay on "requested" until the organizer accepts
- C) Park / Later — ship the request, and decide the receipt wording in a later pack

➡️ **Recommend:** B — the runner should not see the money as returned before the organizer accepts.
```

Entries that point at this skill (`/grill-me`, and `/grill-with-docs` when that interview hands off here) use this shape. Do not switch to a shorter form.

Each round the user answers reshapes the tree — settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report — ask the rest of the frontier now. The _decisions_ are the user's — put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## Umbrella — seamless

If this grill is a wayfinder **ticket**, a **map**, or a named concept on a map, load the parent `wayfinder:map` and every sibling `wayfinder:grilling` ticket that wears **`umbrella:<slug>`** **before the first question**. Closed siblings are settled context. Open live siblings are the live batch. `parked:<slug>` / `Later:` / `Leftover:` stay out — do not assign them, do not ask them.

This is **one conversation**. The user answers questions. You own which ticket those answers belong to.

After each round (before you wait), rewrite `docs/agents/UMBRELLA_CURSOR.md` with **Now on**, Q numbers, and settled ([CURSOR.md](../umbrella/CURSOR.md)).

Every round starts with one orientation line, then the questions:

```
**Now on:** [Refund policy](link) · next: Dunning copy
```

Prefer questions for the **now-on** ticket until its frontier is empty, then move **now on** to the next live sibling and ask that round in the same message. The user never picks the next ticket and is never asked whether to continue.

When the now-on ticket's branches are empty: record the resolution, close it, update the map's Decisions-so-far, then immediately ask the next ticket's frontier. No "ready for the next grill?" beat.

When a branch is **not this pack** (v1 shipped without it, still wanted): file `Later: …` on the map **before** you close the grill. Label `parked:<slug>` — **not** live `umbrella:<slug>`. No `ready-for-agent`. Do not assign. Body **When to do this** per `/umbrella` [PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md) — name the grill that locked v1, what that v1 shipped, why this branch was not in it, and the unpark gate. Do not leave “we’ll do avatars later” as a comment on the closed grill.

## Gaps

The gap list from `/umbrella` **Pre-grill** is part of the design tree. Every gap is a frontier item until it is **answered**, **deferred** (owner + ticket), or **cut** (reason). Do not confirm the lock while one is open or vague (`later`, `TBD`, no owner). If the list was never written, stop and run the pre-grill doc pass before the first question.

The session ends only when the **whole live batch** is empty, every gap is closed, and the user confirms the shared understanding. That confirm is the lock. Then **next is `/to-spec` immediately**. Do not wait for them to ask. Do not implement yet. `/umbrella` continues into `/to-spec` in this session. Do not start `/to-tickets` or `/implement` until `/to-spec` has published.

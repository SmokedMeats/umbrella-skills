---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases. On a wayfinder ticket or map, load the umbrella, grill every sibling in the same session, and announce which ticket is live — the user only answers questions.
---

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `grilling`.

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled — the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Each question should be formatted like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree — settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report — ask the rest of the frontier now. The _decisions_ are the user's — put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## Umbrella — seamless

If this grill is a wayfinder **ticket**, a **map**, or a named concept on a map, load the parent `wayfinder:map` and every sibling `wayfinder:grilling` ticket **before the first question**. Closed siblings are settled context. Open siblings are the live batch. Parked / later stay out.

This is **one conversation**. The user answers questions. You own which ticket those answers belong to.

Every round starts with one orientation line, then the questions:

```
**Now on:** [Refund policy](link) · next: Dunning copy
```

Prefer questions for the **now-on** ticket until its frontier is empty, then move **now on** to the next live sibling and ask that round in the same message. The user never picks the next ticket and is never asked whether to continue.

When the now-on ticket's branches are empty: record the resolution, close it, update the map's Decisions-so-far, then immediately ask the next ticket's frontier. No "ready for the next grill?" beat.

The session ends only when the **whole live batch** is empty and the user confirms. Then say: the umbrella is locked; **next is `/to-spec`**. Do not implement. Do not start `/to-tickets` or `/implement`. Do not run `/to-spec` until they ask — unless `/umbrella` is driving this session, in which case continue into `/to-spec` after that confirm.

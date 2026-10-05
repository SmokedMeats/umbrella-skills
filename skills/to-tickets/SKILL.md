---
name: to-tickets
description: "Break a spec published from a locked grill into tracer-bullet tickets, each declaring its blocking edges. Use when that spec exists and implement tickets do not. Map 1:1 to the spec. No ticket-approval wait. When several tickets can start together, publish a wave plus exclusive file ownership so /implement can dispatch same-worktree subagents. Next is /implement."
---

# To Tickets

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

Break a plan, spec, or conversation into a set of **tickets** — tracer-bullet vertical slices, each declaring the tickets that **block** it.

The issue tracker and triage label vocabulary should have been provided to you — run `/setup-matt-pocock-skills` if not.

Rewrite `project.yml` `paths.umbrella_cursor` when you start and after tickets are published ([CURSOR.md](../umbrella/CURSOR.md)).

## Process

### 1. Gather context

Work from whatever is already in the conversation context. If the user passes a reference (a spec path, an issue number or URL) as an argument, fetch it and read its full body and comments.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code. Ticket titles and descriptions should use the project's domain glossary vocabulary, and respect ADRs in the area you're touching.

Look for opportunities to prefactor the code to make the implementation easier. "Make the change easy, then make the easy change."

### 3. Draft vertical slices

Break the work into **tracer bullet** tickets.

<vertical-slice-rules>

- Each slice cuts a narrow but COMPLETE path through every layer (schema, API, UI, tests) — vertical, NOT a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Each slice is sized to fit in a single fresh context window
- Any prefactoring should be done first

</vertical-slice-rules>

Give each ticket its **blocking edges** — the other tickets that must complete before it can start. A ticket with no blockers can start immediately.

If a ticket owns a new or existing trust-boundary bag, its exclusive list includes `project.yml` `paths.effect_schema_inventory` (or the conductor appends that file). Acceptance: `project.yml` `commands.effect_schema_inventory` stays green, **and** the implement **Effect-TS check** passes (`Schema`/`Either` or `Effect`+`Schedule` only where a sibling already does that shape — see `/implement`). Tickets with no bag and no flaky outbound HTTP skip the Effect-TS check.

Group tickets into **waves**: one wave is every ticket whose blockers are the same (or none). A wave of two or more is a **parallel wave** — they share one worktree under `/implement`. For that wave, also draft **exclusive** ownership (path globs each ticket may edit) and **frozen shared** files (consume only; conductor may append). Exclusive lists must be disjoint. Shared barrels and defaults stay frozen or append-only.

**Wide refactors are the exception to vertical slicing.** A **wide refactor** is one mechanical change — rename a column, retype a shared symbol — whose **blast radius** fans across the whole codebase, so a single edit breaks thousands of call sites at once and no vertical slice can land green. Don't force it into a tracer bullet; sequence it as **expand–contract**. First expand: add the new form beside the old so nothing breaks. Then migrate the call sites over in batches sized by blast radius (per package, per directory), each batch its own ticket blocked by the expand, keeping CI green batch to batch because the old form still exists. Finally contract: delete the old form once no caller remains, in a ticket blocked by every migrate batch. When even the batches can't stay green alone, keep the sequence but let them share an integration branch that all block a final integrate-and-verify ticket — green is promised only there.

### 4. Map 1:1

When the spec was published from a locked grill, do not quiz and do not wait for approval.

Each user story, and each implementation decision that changes behavior, becomes a tracer bullet, or is grouped with a reason written on the ticket. Blocking edges are only real gates. A product choice the lock did not settle is an open gap. Refuse to publish. Return to `/grill-me`.

Show the breakdown in the reply (title, blocked by, wave, exclusive, what it delivers) as the record of what you published. It is not a question.

If there is no spec, stop and name `/to-spec`. Do not invent tickets from a foggy chat.

### 4b. Carry checklist (spec → tickets)

Before publish, every **spec user-story** / **locked decision** that is **in-scope for this pack** must map to **≥1 live ticket AC** **or** an explicit `Later:` / parked line with **When to do this**.

**Refuse to publish** if a locked in-scope decision has neither an AC nor a parked/deferred pointer. Do not drop locks into the void between spec and tickets.

**Receipt Out:** `CARRY_FROM_SPEC` — each in-scope decision → `ticket#(s)+AC` or `parked#` (+ When). Parent refuses next spawn if this field is empty.

Keep the existing **≥2 AC hard rule** on every live `ready-for-agent` ticket (see below).

### 5. Publish the tickets to the configured tracker

Publish those tickets. **How** depends on the tracker `/setup-matt-pocock-skills` configured — the tickets are the same either way, only the shape of the blocking edges changes:

- **Local files** → write one file per ticket under `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` in dependency order (blockers first). Each file's "Blocked by" lists the numbers/titles it depends on. Use the per-ticket file template below — one ticket per file, never a single combined file.
- **A real issue tracker (GitHub, Linear, …)** → publish one issue per ticket in dependency order (blockers first) so each ticket's blocking edges can reference real identifiers. Use the platform's native blocking / sub-issue relationship where it has one; otherwise set each ticket's "Blocked by" to the blocking issues. **Label on create** — this is not `/triage`. Apply `ready-for-agent` plus the parent house's `domain:*` and `umbrella:*` (create `umbrella:*` if the pack is real and the label is missing). **Milestone on create** — find or create the house GitHub milestone and assign every published ticket (parked too). See `/umbrella` **Milestones**. **Project on create** — `item-add` every published ticket per `/umbrella` [PROJECTS.md](../umbrella/PROJECTS.md). **Parked slices** the user left out of this wave: title `Later: …`, `parked:<slug>` + `domain:*` — **no** `umbrella:<slug>`, **no** `ready-for-agent`, **no** assignee. Body **When to do this** per `/umbrella` [PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md) (why this slice missed the rest of the breakdown, unpark gate). Do **not** apply `needs-triage` and do **not** run `/triage` on tickets you just published. Inbound leftovers stay on `/umbrella`’s `/triage` catch. **Parent + map on create** — `## Parent` names the spec **and** the `wayfinder:map` (title + link). Link each ticket as a **child of the map** (sub-issue, or `Part of #<map>` at the top). The spec itself is a child of the map if it is not already. You may add house labels and child links on the map/spec; do not close them.

Work the **frontier**: any ticket whose blockers are all done. For a purely linear chain that means top to bottom. For a parallel wave, write exclusive + frozen shared onto each ticket body and post one **conductor** comment on the parent spec listing the wave, exclusive globs, and frozen files. `/implement` reads that comment and **crawls** later waves as blockers close — it does not stop after the first wave.

Do NOT close or modify any parent issue.

Do not wait after publish. **Next is `/implement`** — the skill, not ad-hoc coding (`/tdd`, `/code-review` including `/blast-radius`, conductor waves). If `/umbrella` is driving this session, load `/implement` in this session. Do not ask the user to approve the breakdown.


<acceptance-criteria-hard-rule>

**Acceptance criteria are mandatory on every live implement ticket** (any ticket with `ready-for-agent`, not titled `Later:` / parked).

- Every **live** ticket body MUST include a `## Acceptance criteria` section with **≥2** checkable `- [ ]` boxes.
- Each box is a **done-looks-like** criterion a Build Verifier / agent can PASS/FAIL against **product behavior** (user-observable outcome or receipt-backed fact). Not chat memory.
- **Refuse to publish** (or fix the body before create) when ACs are: missing; placeholder-only (“Criterion 1”, “TBD”, “as discussed”); or only implementation tasks (“add file X”, “wire Y”) with no done-behavior.
- Each AC must be **independently checkable** without prior chat context (cite the observable / receipt).
- **Optional but recommended** when the slice touches UI: one bullet naming **phone-visible** vs **desk-only** so Device QA / Desk-device routing is clear. Do **not** paste the Device QA phased checklist onto the ticket — that stays on `DEVICE_QA_PHASED_CHECKLIST.md`. Optionally one AC may say a **P\*** leaf is named / Living docs updated when phone-visible.
- **Parked** `Later:` tickets may omit AC or keep thin AC. Live `ready-for-agent` tickets may not.
- **Receipt out / completion:** confirm every published live ticket has a real `## Acceptance criteria` section (≥2 checkboxes). Missing → STATUS=needs_parent / fix before claiming publish done. Also emit `CARRY_FROM_SPEC` (every in-scope locked decision → ticket AC(s) or parked#); empty carry → STATUS=needs_parent.

</acceptance-criteria-hard-rule>

<local-ticket-template>

# <NN> — <Ticket title>

**What to build:** the end-to-end behaviour this ticket makes work, from the user's perspective — not a layer-by-layer implementation list.

**Blocked by:** the numbers/titles of the tickets that gate this one, or "None — can start immediately".

**Wave:** this ticket alone, or the sibling titles that start with it.

**Exclusive:** path globs this ticket may edit (omit on a one-ticket wave).

**Frozen shared:** files this wave consumes but does not rewrite (omit if none).

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Runner sees <observable outcome> after <trigger> (PASS/FAIL from product, not chat)
- [ ] Receipt/command evidence: <named check or path> stays green / present
- [ ] (UI slices) Phone-visible on device | desk-only — Device QA **P\*** leaf named if phone-visible

</local-ticket-template>

<issue-template>

## Parent

- Spec: [spec title](url)
- Map: [map title](url)

`Part of #<map>` at the top if the tracker has no sub-issues.

## What to build

The end-to-end behaviour this ticket makes work, from the user's perspective — not layer-by-layer implementation.

## Acceptance criteria

- [ ] Runner sees <observable outcome> after <trigger> (PASS/FAIL from product, not chat)
- [ ] Receipt/command evidence: <named check or path> stays green / present
- [ ] (UI slices) Phone-visible on device | desk-only — Device QA **P\*** leaf named if phone-visible

## Blocked by

- A reference to each blocking ticket, or "None — can start immediately".

## Wave

This ticket alone, or the sibling issues that start with it.

## Exclusive

Path globs this ticket may edit. Required on a parallel wave. Disjoint from siblings.

## Frozen shared

Files this wave consumes but does not rewrite. Conductor may append (barrels, re-exports).

Parked (`Later:`) tickets omit Exclusive / Wave / `ready-for-agent`. They include **When to do this** from `/umbrella` [PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md) instead. Parked tickets may omit or thin `## Acceptance criteria`; live `ready-for-agent` tickets must not.

</issue-template>

In either form, avoid specific file paths or code snippets — they go stale fast. Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

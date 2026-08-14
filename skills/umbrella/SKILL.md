---
name: umbrella
description: Conduct a pack of related issues through triage → wayfinder → grill-me → to-spec → to-tickets → implement, in that order. Use when the user runs /umbrella, names a house, or a multi-ticket grill just locked and the next step is unclear.
disable-model-invocation: true
argument-hint: "issue numbers, an umbrella slug, or nothing to scan the inbox"
---

# Umbrella

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills). Router. One house at a time.

Name the next Matt skill, **read its SKILL.md, and follow it**. Do not reimplement those skills. Do not write product code until `/implement` is the current phase.

## Order

```
inbound /triage  →  /wayfinder  →  /grill-me  →  /to-spec  →  /to-tickets  →  /implement
```

A **loose idea** or a house with no map starts at **`/wayfinder`**. That is how you figure out the destination. `/triage` is only for inbound issues you did not just create.

Hard gates:

- **Every run** — including each return here — check **inbound** unlabeled + `needs-triage`. Skip anything that already has `wayfinder:*`, or that `/to-tickets` published (`What to build`). If inbound hits remain, **`/triage` those**. Do not skip the check because you already ran it earlier.
- No map yet → **`/wayfinder`** (chart). A map with fog or leftover research / prototype / task → `/wayfinder` (work the map).
- Open grilling siblings → `/grill-me`.
- A locked grill is **not** a build. Next is `/to-spec`.
- A published spec is not tickets until the user **approves** it. Then `/to-tickets`.
- Approved tickets are not "just start coding." Next is the **`/implement` skill** (`/tdd`, `/code-review`, conductor waves).
- Never skip a phase. Never run two phases in one reply.

Stay in this session through `/to-tickets`. After tickets are approved, load `/implement` here if the window is healthy; otherwise stop and give the ticket URLs for a fresh `/implement` session.

## 1. Gather

Read `docs/agents/triage-labels.md` and `docs/agents/issue-tracker.md` (run `/setup-matt-pocock-skills` if missing).

Inputs: numbered issues, an `umbrella:*` slug, a `wayfinder:map`, or nothing.

Nothing → list open issues: unlabeled, `needs-triage`, plus anything already carrying `domain:*` / `umbrella:*` / `wayfinder:*`.

Completion: you have the pile and current labels.

## 2. Inbound `/triage` check — every time

Query unlabeled and `needs-triage` **now**. Drop `wayfinder:*` issues and `/to-tickets` children — those are ours; they get labels at create, not a second `/triage`.

Any **inbound** hits left → read `/triage` and run it on those. Wait for the maintainer before applying.

If the only work is a loose idea or a house with no map, the check is clean: say so in one line and go to `/wayfinder`.

Completion: the inbound check ran. Either the inbound pile is labeled, or you said it was clean.

## 3. Name the houses

Group by `umbrella:*`. Domain is the neighborhood, not the house — do not treat a coarse `domain:*` as one umbrella.

Unhoused issues that share a named pack → propose a new `umbrella:<slug>` (create the label if they pick it). One-off bugs stay domain-only.

For each house show: slug, domains, issue names (not bare numbers), whether a `wayfinder:map` exists, **current phase**, **next skill**.

Completion: a numbered list. Wait for which house to work. One house per session.

## 4. Phase loop

Re-run the `/triage` check. Then detect the chosen house's phase. Say **`Next: /<skill>`**. Read that skill. Follow it to its own completion. Then wait for any approval the table requires. Recompute. Repeat.

| Phase | Evidence | Next | Approval before leaving |
| --- | --- | --- | --- |
| triage | inbound unlabeled or `needs-triage` (not `wayfinder:*`, not implement tickets) | `/triage` | maintainer confirms labels |
| chart | no `wayfinder:map` | `/wayfinder` (chart) | — |
| grill | open `wayfinder:grilling` siblings | `/grill-me` | user confirms the live batch is locked |
| spec | grill locked (or no grilling tickets) and no spec | `/to-spec` | user approves the spec (seams + published body) |
| tickets | spec approved, no implement tickets | `/to-tickets` | user approves the breakdown |
| build | frontier `ready-for-agent` implement tickets | `/implement` | — |
| fog | map still has research / prototype / task | `/wayfinder` (work the map) | — |

A **spec** is the issue `/to-spec` published (Problem Statement / User Stories). Implement tickets are `/to-tickets` children (`What to build`), not grilling tickets.

If they ask to implement, code, or "just build it" while the phase is grill or spec: **stop**. Name the missing skill. Do not write product code.

## Load a skill

Read `SKILL.md` from the same parent skills directory as this file (`triage`, `wayfinder`, `grill-me`, `to-spec`, `to-tickets`, `implement`). Follow it until *that* skill says it is done. Then return here and name the next phase.

## Done

The frontier for this house shipped under `/implement`, or the user stops, or the window is too full — then hand them `Next: /<skill>` plus the issue names and URLs.

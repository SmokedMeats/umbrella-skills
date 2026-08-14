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
/umbrella  →  /triage (inbox catch)  →  /wayfinder  →  /grill-me  →  /to-spec  →  /to-tickets  →  /implement
```

Keep the **`/triage` pass**. `/umbrella` does not label inbound issues itself. It **catches** them and **runs `/triage`**.

Three different jobs — do not collapse them:

| Who | What | When |
| --- | --- | --- |
| **`/triage`** | Labels **inbound** (category, state, every `domain:*`, creatable `umbrella:*`) | An issue already exists and is unlabeled or `needs-triage` |
| **`/wayfinder`** (and `/to-tickets`) | Labels **on create** (`wayfinder:*` or `ready-for-agent`, plus the house `domain:*` / `umbrella:*`) | This session is filing the map or a child. No `needs-triage`. Do not invoke `/triage` |
| **`/umbrella`** | **Catch.** Every run, if inbound unlabeled / `needs-triage` remains, load **`/triage`** and let it label | Router. Does not stamp labels itself |

A **loose idea** or a house with no map still goes to **`/wayfinder`** after the inbox catch. That is how you figure out the destination.

Hard gates:

- **Every run** — start with the **prerequisite**. If Matt's pack or the repo mapping is missing, install / run setup **before** the `/triage` catch.
- **Every run** — including each return here — run the **`/triage` catch**. Query unlabeled + `needs-triage`. Skip `wayfinder:*` and `/to-tickets` children (`What to build`). If inbound hits remain, **read `/triage` and run it**. Do not skip the catch because you already ran it earlier. Do not invent labels here.
- No map yet → **`/wayfinder`** (chart). A map with fog or leftover research / prototype / task → `/wayfinder` (work the map).
- Open grilling siblings → `/grill-me`.
- A locked grill is **not** a build. Next is `/to-spec`.
- A published spec is not tickets until the user **approves** it. Then `/to-tickets`.
- Approved tickets are not "just start coding." Next is the **`/implement` skill** (`/tdd`, `/code-review`, conductor waves).
- If the house has **two or more** unblocked implement tickets, load `/implement` as a **wave**. Product-code edits start after every extra ticket has a live child. `/implement` **crawls**: after each close, recount and spawn whatever just unlocked; hold tickets that still have an open blocker.
- Never skip a phase. Never run two phases in one reply.

Stay in this session through `/to-tickets`. After tickets are approved, load `/implement` here if the window is healthy; otherwise stop and give the ticket URLs for a fresh `/implement` session.

## 0. Prerequisite

Two probes. Both must pass before Gather.

**Matt's pack.** In the same parent directory as this file, look for `setup-matt-pocock-skills/SKILL.md`. This overlay does not ship that skill. Missing → Matt's pack is not installed here.

Install Matt, then re-apply **this** overlay (Matt first, or Matt overwrites the overlay):

```bash
npx skills@latest add mattpocock/skills
npx skills@latest add SmokedMeats/umbrella-skills
```

If this file lives under `$HOME/.grok/skills`, copy both packs into that same parent after `npx` so this session still reads these files.

**Repo mapping.** In the current repo, look for `docs/agents/issue-tracker.md`. Missing → read `/setup-matt-pocock-skills` and follow it until that skill says it is done. Then return here. Do not invent tracker files.

If both probes already pass, say so in one line.

Completion: `setup-matt-pocock-skills/SKILL.md` exists next to this skill, and `docs/agents/issue-tracker.md` exists in the repo (or setup is waiting on the user).

## 1. Gather

Read `docs/agents/triage-labels.md` and `docs/agents/issue-tracker.md`.

Inputs: numbered issues, an `umbrella:*` slug, a `wayfinder:map`, or nothing.

Nothing → list open issues: unlabeled, `needs-triage`, plus anything already carrying `domain:*` / `umbrella:*` / `wayfinder:*`.

Completion: you have the pile and current labels.

## 2. `/triage` catch — every time

This is `/umbrella`’s inbox pass. Query unlabeled and `needs-triage` **now**. Drop `wayfinder:*` and `/to-tickets` children — `/wayfinder` already labeled those on create.

Any **inbound** hits left → **run `/triage`** (read its SKILL.md). `/triage` owns the labels. Wait for the maintainer before it applies.

If the catch is clean, say so in one line. A loose idea or a house with no map then goes to `/wayfinder`.

Completion: the catch ran. Either `/triage` finished the inbound pile, or you said the inbox was clean.

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
| build | one unblocked implement ticket | `/implement` (this session) | — |
| build | **two or more** unblocked implement tickets | `/implement` **wave** — spawn extras, write the conductor ticket, then crawl the next unlocked wave | — |
| fog | map still has research / prototype / task | `/wayfinder` (work the map) | — |

A **spec** is the issue `/to-spec` published (Problem Statement / User Stories). Implement tickets are `/to-tickets` children (`What to build`), not grilling tickets.

If they ask to implement, code, or "just build it" while the phase is grill or spec: **stop**. Name the missing skill. Do not write product code.

When the user names one ticket in a wave (e.g. T5), start there as the **conductor's** ticket. Still spawn the rest of the unblocked wave. Shared files stay on this session.

## Load a skill

Read `SKILL.md` from the same parent skills directory as this file (`setup-matt-pocock-skills`, `triage`, `wayfinder`, `grill-me`, `to-spec`, `to-tickets`, `implement`). Follow it until *that* skill says it is done. Then return here and name the next phase.

## Done

The frontier for this house shipped under `/implement`, or the user stops, or the window is too full — then hand them `Next: /<skill>` plus the issue names and URLs.

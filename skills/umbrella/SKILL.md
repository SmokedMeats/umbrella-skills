---
name: umbrella
description: Conduct a pack of related issues through triage → wayfinder → grill-me → to-spec → to-tickets → implement, in that order. Use when the user runs /umbrella, names a house, or a multi-ticket grill just locked and the next step is unclear.
disable-model-invocation: true
argument-hint: "issue numbers, an umbrella slug, or nothing to scan the inbox"
---

# Umbrella

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills). Router. One house at a time.

Name the next Matt skill, **read its SKILL.md, and follow it**. Do not reimplement those skills. Do not write product code until `/implement` is the current phase.

After any of those skills **creates** issues, check parked children (`Later:` / `Leftover:`). Each must have **When to do this** — why it missed the rest of the pack, and the unpark gate. Template: [PARKED-TICKETS.md](PARKED-TICKETS.md). Missing block → write it before naming the next phase. Every new issue also gets a **GitHub milestone** in the same create (see **Milestones**) and is **added to the XyberRun Project** (see [PROJECTS.md](PROJECTS.md)). After any of those skills **closes** an issue, [CLOSE-PARENTS.md](CLOSE-PARENTS.md). After product-done Device QA, [DEVICE-QA.md](DEVICE-QA.md).

**Cursor file** (step, not phase): read and rewrite `docs/agents/UMBRELLA_CURSOR.md` per [CURSOR.md](CURSOR.md). After the catch, if that file names a house and the user did not name another, resume it — do not wait on the picker. GitHub labels win when the file’s phase is stale.

## Claim (first write)

When this session **pulls** a ticket — house picked, grill starts, fog ticket chosen, implement wave starts — **assign it on GitHub to the driving user** before any other write. That assignee *is* the claim. Do not leave it unassigned. Do not substitute a comment for the assignee. Set Project Status to **In Progress** ([PROJECTS.md](PROJECTS.md)).

```text
gh issue edit <n> --add-assignee "@me"
```

Quote `"@me"` on PowerShell. Assign every **live** ticket this session will work (`umbrella:<slug>` grilling siblings or implement wave). Tickets that wear `parked:<slug>` stay unassigned. Unpark first ([PARKED-TICKETS.md](PARKED-TICKETS.md)) if the user asked to pull one.

## Order

```
/umbrella  →  /triage (inbox catch)  →  /wayfinder  →  /grill-me  →  /to-spec  →  /to-tickets  →  /implement
```

Keep the **`/triage` pass**. `/umbrella` does not invent house names. It **catches** the inbox and **runs `/triage`**. `/triage` names the house.

Three different jobs — do not collapse them:

| Who | What | When |
| --- | --- | --- |
| **`/triage`** | Labels **inbound** (category, state, every `domain:*`, creatable `umbrella:*`). House-name pass: a `wayfinder:map`, or **two or more like issues** in the same pack, get an `umbrella:<slug>` | Unlabeled, `needs-triage`, or already-labeled but **unhoused** (no `umbrella:*`) |
| **`/wayfinder`** (and `/to-tickets`) | Labels **on create** (`wayfinder:*` or `ready-for-agent`, plus the house `domain:*` / `umbrella:*`) | This session is filing the map or a child. No `needs-triage`. Do not invoke `/triage` |
| **`/umbrella`** | **Catch.** Every run, feed the inbox to **`/triage`** and let it label | Router. Does not stamp `umbrella:*` itself |

A **loose idea** or a house with no map still goes to **`/wayfinder`** after the inbox catch. That is how you figure out the destination.

Hard gates:

- **Every run** — start with the **prerequisite**. If Matt's pack or the repo mapping is missing, install / run setup **before** the `/triage` catch.
- **Every run** — including each return here — run the **`/triage` catch**. Query unlabeled + `needs-triage` + **unhoused maps and their children** (`wayfinder:map` / children with no `umbrella:*`). Skip housed `wayfinder:*` and `/to-tickets` children that already wear `umbrella:*`. If hits remain, **read `/triage` and run it** (house-name pass for unhoused maps). Do not skip the catch because you already ran it earlier. Do not invent `umbrella:*` here.
- No map yet → **`/wayfinder`** (chart). A map with fog or leftover research / prototype / task → `/wayfinder` (work the map).
- Open **live** grilling siblings (`umbrella:<slug>` + `wayfinder:grilling`, not `parked:<slug>`) → `/grill-me`. Parked tickets do not start a grill.
- A locked grill is **not** a build. Next is `/to-spec`.
- A published spec is not tickets until the user **approves** it. Then `/to-tickets`.
- Approved tickets are not "just start coding." Next is the **`/implement` skill** (`/tdd`, `/code-review`, conductor waves). `/implement` is not done until the **Build loop** is empty: gap-check PASS, `/code-review` two-axis report, every in-scope finding built on the **same** tickets, **Living docs** (including a **P\*** leaf in `docs/operations/DEVICE_QA_PHASED_CHECKLIST.md` when the ship is phone-visible), **Effect-TS check** (skip unless this change is an untrusted bag or flaky outbound HTTP next to walking-way clients — then match sibling `Schema`/`Either` or `Effect`+`Schedule`; not a census row and not `Effect.gen` on every service), **Effect Schema inventory** (`docs/engineering/EFFECT_SCHEMA_TRUST_BOUNDARIES.md` + `npm run check:effect-schema-inventory`) when the ship adds a `JSON.parse` / webhook / native dict bag, and **`npm run db:migrate:all`** when the change added a `backend/drizzle/0xxx_*.sql`. Then [DEVICE-QA.md](DEVICE-QA.md): `adb devices` — exactly one phone → `/device-qa-agent`; else if the crawl is the last leftover → Kanban **Desk device** + Waiting comment (do not close, do not silent-skip).
- If the house has **two or more** unblocked implement tickets, load `/implement` as a **wave**. Product-code edits start after every extra ticket has a live child. `/implement` **crawls**: after each close, recount and spawn whatever just unlocked; hold tickets that still have an open blocker.
- Gap-check remainder and in-scope `/code-review` findings re-enter `/implement` in **this session** (Build loop). Grill / spec / tickets still wait for approval. Name one skill, finish it, then the next.
- Never skip a phase.

Stay in this session through `/to-tickets`. After tickets are approved, load `/implement` here if the window is healthy; otherwise **Window full** in `/implement` (conductor comment on the spec + `Next: /implement #<n>`).

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

Read `docs/agents/UMBRELLA_CURSOR.md` if it exists ([CURSOR.md](CURSOR.md)). Then `docs/agents/triage-labels.md` and `docs/agents/issue-tracker.md`.

Inputs: numbered issues, an `umbrella:*` slug, a `wayfinder:map`, or nothing.

Nothing → list open issues: unlabeled, `needs-triage`, plus anything already carrying `domain:*` / `umbrella:*` / `wayfinder:*`.

Completion: you have the pile and current labels.

## 2. `/triage` catch — every time

This is `/umbrella`’s inbox pass. Query **now**:

1. Unlabeled.
2. `needs-triage`.
3. Open `wayfinder:map` with **no** `umbrella:*`.
4. Open **live** children of those maps (sub-issue, `Part of #<map>`, or `wayfinder:grilling` / `research` / `prototype` / `task` that names the map) with **no** `umbrella:*` and **no** `parked:*`.
5. Open live children of an **already-housed** map that are themselves missing `umbrella:*` (skip `Later:` / `Leftover:` / `parked:*`).
6. Open issues with **no milestone** — assign the house milestone (create it if missing). Do not invent a house to fill this; use `umbrella:*` / `parked:<same-slug>` / existing named pack. Unhoused one-offs get their own milestone (ticket title), not a dump into another house.
7. Open issues **missing from the XyberRun Project** — `gh project item-add` ([PROJECTS.md](PROJECTS.md)). Do not invent a house to fill the board.

Do **not** drop `wayfinder:*` just because the type label exists. Drop a wayfinder issue or a `/to-tickets` child when it **already** has `umbrella:*` **or** `parked:*`. One-off `domain:qa` and parked tickets are not catch hits. Two `parked:*` issues do not create a live umbrella.

Any hits left → **run `/triage`** (read its SKILL.md). For buckets 3–5 that is the **house-name pass** — `/triage` creates/applies `umbrella:<slug>` only; it does not flip category or state on already-labeled wayfinder issues. `/triage` owns the names. Wait for the maintainer only when `/triage` says the cluster is ambiguous.

If the catch is clean, say so in one line. A loose idea or a house with no map then goes to `/wayfinder`.

Completion: the catch ran. Either `/triage` finished the inbound pile (including house names), or you said the inbox was clean.

## 3. Name the houses

Group **live** work by `umbrella:*`. Group parked work by `parked:<same-slug>` and show it **under that house**, not as its own house. Domain is the neighborhood, not the house.

Do not propose slugs in this list. If a **live** pack is still unhoused, the catch in §2 is not done — go back to `/triage`. One-off bugs stay domain-only. `parked:*` never becomes a picker row of its own.

For each house show: slug, domains, live issue names, parked issue names (if any), whether a `wayfinder:map` exists, **current phase** (from **live** tickets only), **next skill**. If the only open children are `parked:*`, phase is **parked** — do not load `/grill-me` or `/implement`.

Completion: a numbered list. Wait for which house to work. One house per session. Picking a house does **not** pull its parked tickets.

## 4. Phase loop

Re-run the `/triage` check. Then detect the chosen house's phase. **Claim** the tickets that skill will work (`--add-assignee "@me"`) before loading it. Say **`Next: /<skill>`**. Rewrite `docs/agents/UMBRELLA_CURSOR.md` ([CURSOR.md](CURSOR.md)). Read that skill. Follow it to its own completion. Then wait for any approval the table requires. Recompute. Repeat.

| Phase | Evidence | Next | Approval before leaving |
| --- | --- | --- | --- |
| triage | inbound unlabeled, `needs-triage`, or unhoused map/children (no `umbrella:*`) | `/triage` | maintainer confirms only when `/triage` flags an ambiguous cluster |
| chart | no `wayfinder:map` | `/wayfinder` (chart) | — |
| parked | open children are only `parked:<slug>` / `Later:` / `Leftover:` | stay — do not pull | user explicitly unparks (see [PARKED-TICKETS.md](PARKED-TICKETS.md)) |
| grill | open **live** `wayfinder:grilling` siblings (have `umbrella:*`, not `parked:*`) | `/grill-me` | user confirms the live batch is locked |
| spec | grill locked (or no grilling tickets) and no spec | `/to-spec` | user approves the spec (seams + published body) |
| tickets | spec approved, no implement tickets | `/to-tickets` | user approves the breakdown |
| build | one unblocked implement ticket | `/implement` (this session) | — |
| build | **two or more** unblocked implement tickets | `/implement` **wave** — spawn extras, write the conductor ticket, then crawl the next unlocked wave | — |
| build loop | gap check PARTIAL/FAIL, or `/code-review` still has in-scope findings | `/implement` on the **same** tickets, then `/code-review` again | — |
| fog | map still has **live** research / prototype / task (not `parked:*`) | `/wayfinder` (work the map) | — |
| device-qa | product-done, phone-visible, crawl not done | [DEVICE-QA.md](DEVICE-QA.md) — 1 `adb` device → `/device-qa-agent`; else **Desk device** + notes if that is the last leftover | — |

A **spec** is the issue `/to-spec` published (Problem Statement / User Stories). Implement tickets are `/to-tickets` children (`What to build`), not grilling tickets.

If they ask to implement, code, or "just build it" while the phase is grill or spec: **stop**. Name the missing skill. Do not write product code.

When the user names one ticket in a wave (e.g. T5), start there as the **conductor's** ticket. Still spawn the rest of the unblocked wave. Shared files stay on this session.

## Load a skill

Read `SKILL.md` from the same parent skills directory as this file (`setup-matt-pocock-skills`, `triage`, `wayfinder`, `grill-me`, `to-spec`, `to-tickets`, `implement`, `code-review`). Follow it until *that* skill says it is done. `/code-review` is not done at the report — it still **closes the loop** (in-scope findings back through `/implement` **Build loop**).

Then **parked-ticket check** (read [PARKED-TICKETS.md](PARKED-TICKETS.md) if any new issue is `Later:` / `Leftover:` or says shelved). Every such issue wears `parked:<slug>` **not** `umbrella:<slug>`, is unassigned, has a **house milestone**, is on the XyberRun Project, and has **When to do this**. If any of that is wrong, fix the issue now. Grill / spec **not this pack** is the only new park from build.

If that skill **closed** an issue, run [CLOSE-PARENTS.md](CLOSE-PARENTS.md). If it reached Device QA, run [DEVICE-QA.md](DEVICE-QA.md) (probe phone; last leftover without a phone → **Desk device**, do not close).

Then return here and name the next phase.

## Milestones

Every open issue wears a **GitHub milestone**. Always. Labels (`umbrella:*` / `parked:*`) name the house; the milestone is the same pack in the Issues sidebar. This is not a GitHub Project and not a saved view.

**On create** (`/wayfinder`, `/to-spec`, `/to-tickets`, `/triage` when it files, any `Later:`):

1. Resolve the house slug (`umbrella:<slug>` or `parked:<same-slug>`).
2. Find or create one open milestone for that house. Title is the human pack name (`Ghost racing`, `Play quality`) — not `umbrella:ghost-racing`. Description is one line: what the pack is.
3. `gh issue edit <n> --milestone "<title>"` in the same create as labels. That flag only finds **open** milestones. A **closed** (hit) house uses `gh api repos/:owner/:repo/issues/<n> -X PATCH -F milestone=<number>` — see [PROJECTS.md](PROJECTS.md).
4. A **named slice** inside a house may keep its own milestone when the founder already named it (e.g. Live catalog under Surfaces). Do not dump the whole map onto that slice.
5. Unhoused on purpose (no `umbrella:*`, not a 2+ pack) → one milestone named after the ticket, not a sibling house.
6. `locked` stays on the **same house milestone** as the pack that locked it. Do not create a Locked dump. A house with only locked leftovers stays **open** — do not Hit it.
7. Parked tickets use the **same** house milestone as the live pack. Do not create `Parked: <slug>`.
8. **Closed tickets stay on the milestone.** When you close a ticket, do not clear the milestone. That is how the bar shows partial completion.
9. **When the pack hits.** If the house has **no open issues left** (live or parked), close the milestone and set `due_on` to the day the last ticket closed. Description gets a `Hit YYYY-MM-DD` line. A house that still has parked `Later:` stays **open** — the bar is partial on purpose. A house whose map and children are already all closed gets a **new** milestone just so that hit date exists.
10. **Continuous** (milestone title exact). Living hygiene after a pack hits — Schema-when-edit, inventory gates. Close the house map, move it here, then Hit the house. **Do not pull** Continuous tickets. **Do not Hit** the Continuous milestone. Not a product house. Do not invent `umbrella:continuous`.

```text
gh api repos/:owner/:repo/milestones/<n> -X PATCH -f state=closed -f due_on="<ISO last-closed>"
```

**Catch (every `/umbrella` run):** open issues with no milestone are inbox hits. Create/assign; do not invent `umbrella:*` here — `/triage` still owns house names. Closed issues that belong to a house and have no milestone → assign them too (progress).

```text
gh api repos/:owner/:repo/milestones -f title="<Pack name>" -f description="<one line>"
gh issue edit <n> --milestone "<Pack name>"
```

Completion: `gh issue list --state open --json number,milestone` has no `milestone: null`.

## Project board

One user-owned GitHub Project (**XyberRun**) is the Kanban + Roadmap over the same issues. It is not a house and not a substitute for milestones. Full rules, views, Status, and `gh` commands: [PROJECTS.md](PROJECTS.md).

On create: `item-add` after the milestone. On claim: Status **In Progress** (**Now** is a view, not a column). Leftover outside the repo: **Operator** / **Desk device** / **Field** — do not close. On close: Status **Done**, drop `ready-for-agent` and any `parked:<slug>` ([PARKED-TICKETS.md](PARKED-TICKETS.md) **Close**), then [CLOSE-PARENTS.md](CLOSE-PARENTS.md). Device QA wait (no phone, last leftover) is **Desk device**, not Done — [DEVICE-QA.md](DEVICE-QA.md). Catch missing items every `/umbrella` run (bucket 7). Do not invent Start / Target dates — **Houses** (group by milestone) is the undated pack timeline.

## Done

The frontier for this house shipped under `/implement` **after the Build loop is empty** and **Living docs** (phone-visible ships include a Device QA **P\*** leaf), or the user stops, or the window is too full — then `/implement` **Window full**. Do not call a ticket shipped from chat memory. Parked `Later:` children stay listed **under** the house; they do not start a new `/implement` wave.

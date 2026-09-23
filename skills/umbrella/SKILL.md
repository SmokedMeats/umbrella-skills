---
name: umbrella
description: "Auto-conductor for a pack of related issues. Use when the user runs /umbrella, for multi-ticket work, when the next phase is unclear, to keep the house crawl going after tickets are filed, or when the user names several houses to work through. Routes triage → wayfinder → pre-grill doc review and gap list → grill-me (lock only when every gap is closed) → to-spec → to-tickets → implement Build loop crawl. One house at a time. A named queue starts the next house when this house's coding crawl is done. Spec approval and ticket approval are not gates. The crawl is default /umbrella behavior, not a separate overnight arm. The only front door. Not a second conductor."
argument-hint: "issue numbers, umbrella slugs in order, or nothing to scan the inbox"
---

# Umbrella

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills). Router. **One house at a time.** A named **House queue** runs the next house after this house's coding crawl. Never interleave tickets across houses.

Name the next skill, **read its SKILL.md, and follow it**. Do not reimplement those skills. Do not copy Matt skill bodies into this overlay. Do not write product code until `/implement` is the current phase. The invoke list is the spine plus `/how`, `/why`, `/teach`, `/teach-me`, `/principles`, and `/blast-radius`, and these when the playbook says so: `/domain-modeling` with `/grilling`; `/prototype` for fog or a cheap artifact (see **DESIGN-IT-TWICE**); `/codebase-design` for structure and module boundaries; `/improve-codebase-architecture` for architecture debt when asked, or when the build loop is idle and that work is in scope; `/zero-tech-debt` and `/pit-of-success` only when installed; `/diagnosing-bugs` and `/tdd`; `/simple-english` for user-facing copy and runner language (grill leftover questions, ship notes, Device QA wait comments); `/wait-what` when the user is confused or rejects jargon; `/writing-for-agents` when writing or editing agent-facing docs or skill-ish notes in-repo; `/handoff` at session end, Window full, or the next agent (include the **Recall** brief). `/umbrella` is the only front door. Do not start a second conductor.

After any of those skills **creates** issues, check parked children (`Later:` / `Leftover:`). Each must have **When to do this** — why it missed the rest of the pack, and the unpark gate. Template: [PARKED-TICKETS.md](PARKED-TICKETS.md). Missing block → write it before naming the next phase. Every new issue also gets a **GitHub milestone** in the same create (see **Milestones**) and is **added to this repo’s Project** (see [PROJECTS.md](PROJECTS.md)). After any of those skills **closes** an issue, [CLOSE-PARENTS.md](CLOSE-PARENTS.md). After product-done Device QA, [DEVICE-QA.md](DEVICE-QA.md).

**Cursor file** (step, not phase): read and rewrite `docs/agents/UMBRELLA_CURSOR.md` per [CURSOR.md](CURSOR.md). After the catch, if that file names a house and the user did not name another, resume it — do not wait on the picker. Keep its **House queue**. If this house's coding crawl is already done and that queue has a next house, start that house. GitHub labels win when the file’s phase is stale.

## Ship mode (pin at start — sticky + actor force)

Before Gather finishes (and before any `/implement` product commits), ensure `docs/agents/UMBRELLA_CURSOR.md` or the conductor comment carries exactly one pin:

- `Ship mode: Development` — Mode A
- `Ship mode: PR` — Mode B

**Sticky.** Once set for this umbrella run, every later skill (`/implement`, `/code-review`, Device QA, crawl, ...) and every later house in a **House queue** reads the **same** pin. Do **not** re-pick mid-run, or when the queue advances.

**Actor force** (overrides user whim and heuristics):

| Actor | Forced pin |
| --- | --- |
| Grok Bot teammates or Cursor cloud coding agents | always `Ship mode: PR` (never Development-direct) |
| Local Grok Build or Cursor IDE on AlphaTerminal | always `Ship mode: Development` (never PR) |

Write the pin so every skill sees it. If the written pin disagrees with the actor, **correct it** to the forced mode and note the correction in one line. Heuristics (AlphaTerminal+adb -> Development; cloud/no USB -> PR) are backup only when discovering the actor.

How to set: rewrite `docs/agents/UMBRELLA_CURSOR.md` with a **Ship mode** field (see [CURSOR.md](CURSOR.md)), or put the same line on the conductor comment.

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

A **loose idea** or a house with no map still goes to **`/wayfinder`** after the inbox catch. That is how you figure out the destination. **figure-it-out** is only when that map shape does not fit. One competing-planner pass, then back to this spine. Do not start a second conductor.

Hard gates:

- **Every run** — start with the **prerequisite**. If Matt's pack or the repo mapping is missing, install / run setup **before** the `/triage` catch.
- **Every run** — including each return here — run the **`/triage` catch**. Query unlabeled + `needs-triage` + **unhoused maps and their children** (`wayfinder:map` / children with no `umbrella:*`). Skip housed `wayfinder:*` and `/to-tickets` children that already wear `umbrella:*`. If hits remain, **read `/triage` and run it** (house-name pass for unhoused maps). Do not skip the catch because you already ran it earlier. Do not invent `umbrella:*` here.
- No map yet → **`/wayfinder`** (chart). A map with fog or leftover research / prototype / task → `/wayfinder` (work the map).
- Open **live** grilling siblings (`umbrella:<slug>` + `wayfinder:grilling`, not `parked:<slug>`) → **pre-grill**, then `/grill-me`. Parked tickets do not start a grill. No grill lock while a gap is open or vague.
- A locked grill is **not** a build. Next is `/to-spec` immediately, then `/to-tickets`, then `/implement`. Do not wait for spec approval or ticket approval.
- Filed tickets are not "just start coding," and filing them is not the end of the run. Next is the **`/implement` skill** (`/tdd`, `/code-review` including `/blast-radius`, conductor waves). Keep the **Build loop** crawling in this session. `/implement` is not done on a ticket until that ticket’s **Build loop** is empty: gap-check PASS against the grill lock, the spec, and the tickets, `/code-review` two-axis report including blast-radius, every in-scope finding built on the **same** tickets, **Living docs** update/verify for docs this change touched (including a **P\*** leaf in `docs/operations/DEVICE_QA_PHASED_CHECKLIST.md` when the ship is phone-visible), **Effect-TS check** (skip unless this change is an untrusted bag or flaky outbound HTTP next to walking-way clients — then match sibling `Schema`/`Either` or `Effect`+`Schedule`; not a census row and not `Effect.gen` on every service), **Effect Schema inventory** (`docs/engineering/EFFECT_SCHEMA_TRUST_BOUNDARIES.md` + `npm run check:effect-schema-inventory`) when the ship adds a `JSON.parse` / webhook / native dict bag, and **`npm run db:migrate:all`** when the change added a `backend/drizzle/0xxx_*.sql`. Then set that ticket’s lane from what is left, and [DEVICE-QA.md](DEVICE-QA.md): phone-visible Device QA only when `adb devices` is exactly one **and** this runner can see that USB **and** no other actor owns the phone. Otherwise **Desk device** + Waiting comment (do not close), then crawl the next unblocked coding ticket.
- If the house has **two or more** unblocked implement tickets, load `/implement` as a **wave**. Product-code edits start after every extra ticket has a live child. `/implement` **crawls**: after each close, recount and spawn whatever just unlocked; hold tickets that still have an open blocker.
- Gap-check remainder and in-scope `/code-review` findings re-enter `/implement` in **this session** (Build loop). Do not pause for another spec or ticket approval. Name one skill, finish it, then the next.
- Never skip a phase. The only planning pause is the grill lock.
- If the grill skipped the doc/gap pass or left a gap open, **refuse auto-advance**. Finish the gaps or return to `/grill-me`.

Stay in this session through `/to-tickets` and into the `/implement` house crawl after a successful lock. Do not stop when the tickets are filed. If the window is unhealthy, **Window full** in `/implement` (conductor comment on the spec + `Next: /implement #<n>` or the next queued house, plus the **Recall** brief). That brief does not start the next house.

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
7. Open issues **missing from this repo’s Project** — `gh project item-add` ([PROJECTS.md](PROJECTS.md)). Do not invent a house to fill the board.
8. **Done-lane trim** ([PROJECTS.md](PROJECTS.md) **Archive Done**). Count unarchived Done and other lanes. Archive the **oldest** Done only if Done **> 200** or (Done + other) **> 200**. Not a `/triage` hit. Do not archive a card you just closed unless this trim says a cap is over.

Do **not** drop `wayfinder:*` just because the type label exists. Drop a wayfinder issue or a `/to-tickets` child when it **already** has `umbrella:*` **or** `parked:*`. One-off `domain:qa` and parked tickets are not catch hits. Two `parked:*` issues do not create a live umbrella.

Any hits left → **run `/triage`** (read its SKILL.md). For buckets 3–5 that is the **house-name pass** — `/triage` creates/applies `umbrella:<slug>` only; it does not flip category or state on already-labeled wayfinder issues. `/triage` owns the names. Wait for the maintainer only when `/triage` says the cluster is ambiguous.

If the catch is clean, say so in one line. A loose idea or a house with no map then goes to `/wayfinder`.

Completion: the catch ran. Either `/triage` finished the inbound pile (including house names), or you said the inbox was clean.

## 3. Name the houses

Group **live** work by `umbrella:*`. Group parked work by `parked:<same-slug>` and show it **under that house**, not as its own house. Domain is the neighborhood, not the house.

Do not propose slugs in this list. If a **live** pack is still unhoused, the catch in §2 is not done — go back to `/triage`. One-off bugs stay domain-only. `parked:*` never becomes a picker row of its own.

For each house show: slug, domains, live issue names, parked issue names (if any), whether a `wayfinder:map` exists, **current phase** (from **live** tickets only), **next skill**. If the only open children are `parked:*`, phase is **parked** — do not load `/grill-me` or `/implement`.

Completion: a numbered list when the user has not named the work. Wait for which house to work.

**One house at a time.** Never interleave tickets across houses. Finish this house's phase and coding crawl for this session, then the next house.

**One house named.** Work that house. Write it as **House** and set **House queue** to that slug only ([CURSOR.md](CURSOR.md)). When its coding crawl is done, there is no next house. No auto-hop.

**Several houses.** The user names an ordered list of houses, slugs, or issues that map to more than one `umbrella:*`, or says to work through these. Write that order into **House queue**. The queue is houses, in the order each house is first named. A later issue from a house already queued stays in that house's slot. Start the first house now. Do not wait on the picker between houses.

Picking a house does **not** pull its parked tickets.

## 4. Phase loop

Re-run the `/triage` check. Then detect the chosen house's phase. **Claim** the tickets that skill will work (`--add-assignee "@me"`) before loading it. Say **`Next: /<skill>`**. Rewrite `docs/agents/UMBRELLA_CURSOR.md` ([CURSOR.md](CURSOR.md)). Keep **Ship mode** and **House queue** on that rewrite. Read that skill. Follow it to its own completion. Wait only for a gate in **Founder intervention** or the table. Recompute. Repeat.

**Next house.** When this house's coding crawl is done (**House crawl**) and **House queue** has another house, claim that house, detect its phase, and say **`Next: /<skill>`**. Do not wait on the picker. Do not wait for Jacob to merge. Grill lock on the new house is still that house's planning gate.

| Phase | Evidence | Next | Approval before leaving |
| --- | --- | --- | --- |
| triage | inbound unlabeled, `needs-triage`, or unhoused map/children (no `umbrella:*`) | `/triage` | maintainer confirms only when `/triage` flags an ambiguous cluster |
| chart | no `wayfinder:map` | `/wayfinder` (chart) | — |
| parked | open children are only `parked:<slug>` / `Later:` / `Leftover:` | stay — do not pull | user explicitly unparks (see [PARKED-TICKETS.md](PARKED-TICKETS.md)) |
| grill | open **live** `wayfinder:grilling` siblings (have `umbrella:*`, not `parked:*`) | pre-grill, then `/grill-me` | user confirms the lock only after every gap is closed |
| spec | grill locked (gaps closed) and no spec | `/to-spec` | — (no spec approval) |
| tickets | spec published from that lock, no implement tickets | `/to-tickets` | — (no ticket approval) |
| build | one unblocked implement ticket | `/implement` (this session) | — |
| build | **two or more** unblocked implement tickets | `/implement` **wave** — spawn extras, write the conductor ticket, then crawl the next unlocked wave | — |
| build loop | gap check PARTIAL/FAIL, or `/code-review` still has in-scope findings | `/implement` on the **same** tickets, then `/code-review` again | — |
| fog | map still has **live** research / prototype / task (not `parked:*`) | `/wayfinder` (work the map) | — |
| device-qa | product-done, phone-visible, crawl not done | [DEVICE-QA.md](DEVICE-QA.md) — exactly one `adb` device, this runner can see that USB, and no other actor owns the phone → `/device-qa-agent`; else **Desk device**, do not close, then **stay on `/implement`** and crawl the next unblocked coding ticket | ownership conflict pauses Device QA only |

A **spec** is the issue `/to-spec` published (Problem Statement / User Stories). Implement tickets are `/to-tickets` children (`What to build`), not grilling tickets.

If they ask to implement, code, or "just build it" while the phase is grill and the lock is not confirmed: **stop**. Name `/grill-me`. Do not write product code. If the grill is already locked, do not stop for a spec or ticket approval. Load `/to-spec`.

When the user names one ticket in a wave (e.g. T5), start there as the **conductor's** ticket. Still spawn the rest of the unblocked wave. Shared files stay on this session.

## Playbook routing

`/umbrella` is the only front door.

| Work | Route |
| --- | --- |
| Feature or fog | Spine: `/triage` → `/wayfinder` → pre-grill → `/grill-me` → `/to-spec` → `/to-tickets` → `/implement` |
| Bug or flake | `/diagnosing-bugs` (Matt) when the repro is the work, then `/implement` |
| Explain a subsystem or a change | `/how`, `/why`, or `/teach`. A multi-session course is `/teach-me` |
| Tickets already filed from a locked grill | Default house crawl: `/implement` in this session. Set each empty Build loop to the lane that matches what is left. Stop only as **House crawl** says |
| Architecture debt | Matt `/improve-codebase-architecture` when asked, or when the build loop is idle and that work is in scope. Read `/zero-tech-debt` or `/pit-of-success` only when that skill is installed |
| User-facing prose, leftover questions, ship notes, Device QA wait comments | `/simple-english` |
| User says the reply is unclear or too jargony | `/wait-what` |
| Writing or editing agent-facing docs or skill-ish notes in the repo | `/writing-for-agents` |
| Structure or module boundaries | `/codebase-design` |
| Cheap artifact, or prove a fold | `/prototype`. **DESIGN-IT-TWICE** when the user asks, or when the artifact is a non-trivial UI or flow |
| Off-map, and `/wayfinder` does not fit | **figure-it-out** below. One competing-planner pass, then this spine. Do not invent a second conductor |
| Window full, end of session, or the next agent | `/handoff` when that skill is installed, with the **Recall** brief |

Never-block on reversible work (a lookup, a test, a rename, a local commit in the pinned ship mode). Founder gates still pause.

## Thin conventions

House rules. Not new skill folders. Not a second conductor. Matt skills stay Matt installs. Read `SKILL.md` from the parent skills directory. Do not copy those bodies here. Missing file → do not invent the body. Swarm and arena are not standing slashes. `/automate-me` stays maintainer-only. Do not add a `typescript-best-practices` overlay.

### DESIGN-IT-TWICE

Only when the user asks, or when `/prototype` is loaded for a non-trivial UI or flow. Write two short competing sketches, then lock one. A trivial stub skips it. Do not require this for every feature. `/implement` uses the same rule when a prototype ticket is in the wave.

### Decision trail

On a long house crawl — multi-ticket, or a **House queue** — keep a decision trail. Default on. Do not wait on the founder to start it. One house at a time still holds. The trail does not hop houses.

- `decisions.tsv` in the house notes (columns `when`, `ticket`, `decision`, `why`), or
- short bullets in `docs/agents/UMBRELLA_CURSOR.md`

**Window full** and `/handoff` point at that path. A one-ticket session with no real fork may skip the file.

### figure-it-out

Use only when `/wayfinder` does not fit: no destination to chart, no map shape, off-map rigor. One competing-planner pass: two short plans, pick one, write the choice on the decision trail when a trail is already in use. Then return to this spine. Fog with a destination is still `/wayfinder`. Not a slash. Not a standing front door.

### Comment cleanup

Before `/code-review` closes a ticket, strip narrative and noise comments added in this change. Keep intentional API and docs comments. `/implement` **Build loop** runs that pass. `/code-review` **Standards** flags a leftover as in-scope. Do not spawn a comment-cleanup subagent.

### Recall

Do not add a `/recall` skill. **Window full**, end of session, and the next agent get a resume brief:

- **House queue** (current house first; keep later houses)
- ship mode
- now-on tickets
- decisions trail path
- blockers

If `handoff/SKILL.md` exists in the parent skills directory, read it and follow `/handoff`, and include that brief. The brief is still required when `/handoff` is not installed. The brief does not start the next house. **House queue** still decides when that house starts.

## Founder intervention

PAUSE and wait:

- Grill lock (the shared-understanding confirm, and only after every gap is closed). This is a **per-house** planning gate. Wait on this house. Do not start the next queued house during the lock. Once that lock is in, this house's crawl does not pause for it again.
- Ready-to-merge waiting on Jacob. Do not merge. This ends the current house's coding crawl. It does **not** block the next house in a **House queue**. Soft-queue overlap checks still run before the merge prompt.
- Preview fast-forward, migrate, OTA, or master promote. These block the **session**.
- Phone Device QA ownership conflicts. Stand down on the phone, leave **Desk device**, and keep coding this house's other unblocked tickets. When this house's coding crawl is done, a **House queue** still advances.
- Irreversible actions (force-push to a shared branch, data deletion, customer messages, merging). These block the **session**.

**Session stops** are **Window full**, the user stops, or a Founder pause that blocks the session (Preview fast-forward, migrate, OTA, master promote, irreversible). Grill lock is not a session stop. A phone ownership conflict is not a session stop. Ready-to-merge is not a session stop when a next house is queued.

Never merge, Preview fast-forward, migrate, OTA, or master promote unattended. The crawl waits on those. `npm run db:migrate:all` for a new `backend/drizzle/0xxx_*.sql` in this change stays inside the Build loop. That run is not a Preview or master promote.

Do not pause for spec → tickets, or tickets → implement, after a successful grill lock with gaps closed.

If the grill skipped the doc/gap pass or left a gap open, refuse that auto-advance. Finish the gaps or return to grill.

## Pre-grill

Before `/grill-me`, this pass is mandatory. Do not open the interview without it.

1. Review the docs that bear on this house: `CONTEXT.md`, ADRs, living docs the map names, related tickets, and prior locks.
2. Write an explicit gap list. One line per gap: source, what is missing, status `open`.
3. Open `/grill-me` with that list. Every gap is in the design tree.
4. Address every gap before lock: **answered**, **deferred** (owner + ticket), or **cut** (reason). No lock while any gap is open or vague (`later`, `TBD`, no owner).

Record the list on the map or the live grilling ticket, and in `docs/agents/UMBRELLA_CURSOR.md` ([CURSOR.md](CURSOR.md)).

## After grill lock

The user's lock confirm is the only planning gate. Immediately:

1. `/to-spec`. Cite each gap resolution in the spec.
2. `/to-tickets`. 1:1 with the spec. Group a story only with the reason written on the ticket.
3. `/implement`, and keep the house crawl in this session.

Do not ask the user to approve the spec. Do not ask the user to approve the tickets. Do not stop after the tickets are filed.

## Post-implement

`/implement` still runs its Build loop before a ticket leaves In Progress. When that loop is empty, set Project Status from what is left. In addition:

- Gap check against the grill lock, the spec, and the tickets. This is not a second pre-grill survey.
- Living-doc update/verify for docs this change touched.
- `/code-review`, which includes `/blast-radius`.
- The lane that matches what is left, and Device QA, as [DEVICE-QA.md](DEVICE-QA.md) and [PROJECTS.md](PROJECTS.md) already say.

Behavior the lock did not ask for is invented scope. Park it as new fog (`Later:` or a wayfinder line) and re-grill that slice. Do not merge it as done.

## House crawl (default)

This is how `/umbrella` runs a house. It is the session after a locked grill. It is not a separate overnight automation to arm.

After a locked grill with every gap closed: `/to-spec` → `/to-tickets` → keep the `/implement` **Build loop** crawling in this session. Do not stop after filing tickets. `/loop` is optional. The crawl continues in this session without it.

When a ticket’s Build loop is empty, set Project Status from what is actually left ([PROJECTS.md](PROJECTS.md)): **Operator**, **Desk device**, **Field**, **Ready to merge**, **Live Beta**, **GoLive**, or **Done**. Ready to merge is one of those lanes. Leftover lanes do not hold the next coding wave. **Ready to merge** holds dependents until Jacob merges.

Phone / Device QA ([DEVICE-QA.md](DEVICE-QA.md)):

- `adb devices` is not exactly one → leave the phone-visible leftover on **Desk device**, do not close, crawl the next unblocked coding ticket.
- A phone is on the desk → run Device QA only when **this** runner can see that USB (local AlphaTerminal, or a private worker on that machine). A Cursor cloud VM cannot. One Ship mode pin. Do not open a second worktree on the same `adb` device.
- Another actor owns the phone this pass (Grok Build, for example) → stand down on Device QA, leave **Desk device**, and crawl the next unblocked coding ticket. That ownership conflict pauses the phone. It does not close the ticket. When this house's coding crawl is done, a **House queue** still advances.

**One house at a time.** Never interleave tickets across houses. Finish this house's phase and coding crawl, then the next.

**Coding crawl done (this house).** Every live ticket is on its real lane — **Operator**, **Desk device**, **Field**, **Ready to merge**, **Live Beta**, **GoLive**, or **Done** — and no unblocked coding ticket is left. A **Live Beta** or **GoLive** card whose code is still to write is still a coding ticket. Claim it on this house before the hop. A ticket held by a **Ready to merge** blocker in this house is not unblocked coding. Parked `Later:` / `Leftover:` stay listed and are not pulled. **Ready to merge** still holds dependents inside this house until Jacob merges. A house whose open children are only `parked:*` is not pulled. If **House queue** has another house, advance. If it does not, stay.

**Next house.** If **House queue** has another house, start it immediately: claim, phase detect, **`Next: /<skill>`**. Do not wait on the picker. Do not wait for Jacob to merge this house. **Ship mode** stays the pin already set for this run. **Ready to merge** on this house does not block that start. Merge still waits on Jacob. Soft-queue overlap checks still apply before any merge prompt (**Merge prompt** below).

One named house has no next entry. No auto-hop. When its coding crawl is done, stop the session. **Ready to merge** waiting on Jacob is that stop when that lane is the frontier.

Stop the **session** only when:

- this house's coding crawl is done and **House queue** has no next house
- **Window full**
- the user stops
- a Founder pause blocks the session (Preview fast-forward, migrate, OTA, or master promote; an irreversible action)

Grill lock is the per-house planning gate. It waits on this house and does not open the next house. A phone ownership conflict leaves **Desk device** and the crawl continues on this house's other coding tickets.

Never merge, Preview fast-forward, migrate, OTA, or master promote unattended.

On a long crawl (multi-ticket, or a **House queue**), keep the **Decision trail**. Default on. Do not wait on the founder to start it.

## Load a skill

Read `SKILL.md` from the same parent skills directory as this file (`setup-matt-pocock-skills`, `triage`, `wayfinder`, `grill-me`, `grilling`, `domain-modeling`, `to-spec`, `to-tickets`, `implement`, `code-review`, `how`, `why`, `teach`, `teach-me`, `principles`, `blast-radius`, `diagnosing-bugs`, `tdd`, `prototype`, `codebase-design`, `improve-codebase-architecture`, `simple-english`, `wait-what`, `writing-for-agents`, `handoff`). `/zero-tech-debt` and `/pit-of-success` only when that file exists. `/handoff` only when that file exists. Do not invent a missing Matt body. Follow it until *that* skill says it is done. `/code-review` is not done at the report — it still **closes the loop** (in-scope findings back through `/implement` **Build loop**), and the Spec axis includes `/blast-radius`.

Then **parked-ticket check** (read [PARKED-TICKETS.md](PARKED-TICKETS.md) if any new issue is `Later:` / `Leftover:` or says shelved). Every such issue wears `parked:<slug>` **not** `umbrella:<slug>`, is unassigned, has a **house milestone**, is on the XyberRun Project, and has **When to do this**. If any of that is wrong, fix the issue now. Grill / spec **not this pack** is the only new park from build.

If that skill **closed** an issue, run [CLOSE-PARENTS.md](CLOSE-PARENTS.md) (**child first**, then parent only when open children = 0). Then [PROJECTS.md](PROJECTS.md) **Archive Done**. If it reached Device QA, run [DEVICE-QA.md](DEVICE-QA.md) (probe phone; not exactly one `adb` device, this runner cannot see USB, or another actor owns the phone → **Desk device**, do not close, then `/implement` **Crawl** the next unblocked coding ticket).

If `/implement` still has unblocked product tickets on **this** house, **do not** return here to wait on a picker. Stay on `/implement`. A leftover-lane card does not end the session. When this house's coding crawl is done and **House queue** has a next house, return here and start that house. Do not wait on the picker. Stop only when the crawl is done and no next house is queued, or a session stop fires.

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

One user-owned GitHub Project **per repo** is the Kanban + Roadmap over that repo’s issues. It is not a house and not a substitute for milestones. Resolve the board from `git remote`: [PROJECTS.md](PROJECTS.md).

On create: `item-add` after the milestone. On claim: Status **In Progress** (**Now** is a view, not a column). Leftover outside the repo: **Operator** / **Desk device** / **Field** — do not close. On close: Status **Done**, drop `ready-for-agent` and any `parked:<slug>` ([PARKED-TICKETS.md](PARKED-TICKETS.md) **Close**), then [CLOSE-PARENTS.md](CLOSE-PARENTS.md) (child first). Do **not** archive that card unless [PROJECTS.md](PROJECTS.md) **Archive Done** says a cap is over. Device QA wait (no phone, last leftover) is **Desk device**, not Done — [DEVICE-QA.md](DEVICE-QA.md). Catch missing items (bucket 7) and the Done-lane trim (bucket 8) every `/umbrella` run. Do not invent Start / Target dates — **Houses** (group by milestone) is the undated pack timeline.

## Build standing law

`/implement` and `/code-review` follow this on every house. Chat to the user is what a runner sees on a run. A ticket comment may name files.

**The locked page wins.** The gap check and the Spec review read the kit or grill page the ticket names, not only the ticket bullets. If the code disagrees with that page, the check fails and the build loop continues. Do not invent a softer reading of a line that is already decided.

**Finish what you can.** Type errors, warnings, and errors hit while building are fixed in this change. Summarize them at the end of the user reply in plain language. Do not leave them as a leftover.

**Database migrate.** When this change adds a new `backend/drizzle/0xxx_*.sql`, run `npm run db:migrate:all` from `backend/` in that same session, after the file is on disk. Do not run it before the file exists. Do not edit a migration that has already been applied. Do not run it again when no new file was added. A missed migrate is not a leftover.

**A leftover is only an unknown.** File one when the code cannot see a fact and you cannot invent the store, the clock, or the amount. If you can finish it without the user, finish it. Do not file a leftover for a decision already written, or for a typecheck, a lint, or a warning. Any question that leftover still needs is written on that ticket in runner language. Filing it is inside the loop. Same session, crawl the next unblocked ticket. Do not end the turn on the leftover.

**A half-done card stays in progress.** "Keep going" does not move a partial ticket to Desk device or any leftover lane. The parent ticket says which part is the phone and which part is the leftover.

**Words.** Do not say "judgement" to the user. A code-shape note is not a product choice. If nothing is waiting on the user, say that in one line. Leave those notes off the chat summary. User-facing copy, grill leftover questions, ship notes, and Device QA wait comments are runner language: read `/simple-english` when that skill is installed. If the user says the reply is unclear or too jargony, read `/wait-what`. Do not reimplement those skills.

**Subagents.** Two or more unblocked tickets is a wave. Spawn one implement subagent per extra ticket before the conductor writes product code. The conductor does not write those extras. Shared files stay with the conductor. A ticket whose blocker is still open is not in the wave.

**Dependencies.** If a ticket waits on another, set the GitHub blocked-by link in that same session. Do not leave the wait only in the body. Do not pull it while the blocker is open, unless that blocker is on a leftover lane. Ready to merge still holds dependents. A later production switch stays on **GoLive**. Do not park it to keep the build from pulling it.

**Lanes when a Build loop empties.** Set that ticket’s Project Status from what is actually left ([PROJECTS.md](PROJECTS.md)): **Operator**, **Desk device**, **Field**, **Ready to merge**, **Live Beta**, **GoLive**, or **Done**. Ready to merge is one of those lanes. A production switch is GoLive. A desk check stays Desk device, and moves to GoLive when that check is done if the switch is still off. The lane and the labels must agree. Leftover lanes do not hold the next coding wave. **Ready to merge** holds dependents until Jacob merges. Phone-visible work this pass cannot run (`adb devices` is not exactly one, this runner cannot see USB, or another actor owns the phone) stays **Desk device** ([DEVICE-QA.md](DEVICE-QA.md)). Then crawl the next unblocked coding ticket. At the end of the house, walk every open ticket and correct any lane that still disagrees.

**Merge prompt.** Ship mode PR, after that lane walk: run the **soft-queue overlap** check first. Compare Ready-to-merge pull requests in this house with each other and with any Ready-to-merge pull request still open from an earlier house in this run. If two diffs share a path, name those paths in the merge message. Do not merge, rebase, or resolve that overlap until Jacob says so in that turn. The check does not hold the next house's coding crawl. Then one message lists every Ready-to-merge pull request in the house and asks to merge them. Several pull requests go in that one message. Do not merge until the user says so in that turn. A **House queue** with a next house does not wait on that answer.

## Done

The house crawl is this session, **one house at a time**. It stops this house as **House crawl** says, then starts the next queued house. The session stops only on **Window full** (with the **Recall** brief), the user stops, or a Founder pause that blocks the session. The frontier for this house shipped under `/implement` **after the Build loop is empty**, **a new database migration from this house has been applied**, **every open house ticket is on the lane that matches what is left**, and **Living docs** (phone-visible ships include a Device QA **P\*** leaf). In Ship mode PR, the merge prompt is the last step for **this** house, not a silent stop, and not a merge. **Ready to merge** on this house does not block the next house. Do not call a ticket shipped from chat memory. Parked `Later:` children stay listed **under** the house; they do not start a new `/implement` wave.

# umbrella-skills

This pack adds **`/umbrella`** on top of [Matt Pocock's skills](https://github.com/mattpocock/skills).

Matt's skills do the work: `/wayfinder`, `/grill-me`, `/to-spec`, `/to-tickets`, `/implement`. `/umbrella` names the pack of issues (the **house**) and names the **next** Matt skill. A locked grill goes to `/to-spec`. It does not jump to a build.

## Why this is not a fork

A fork copies Matt's whole repo. Then every upstream change needs a merge. Then this pack looks like a replacement.

This repo is an **overlay**:

1. Install Matt's pack first. That is the skillset.
2. Install this pack second. It overwrites a few of those skills and adds `/umbrella`.
3. Unedited skills stay Matt's (`/tdd`, `/research`, `/prototype`, `/ask-matt`, `/setup-matt-pocock-skills`).

Keep both. Update Matt's pack on its own schedule.

## Why this exists

Matt's flow:

```
/wayfinder  →  /grill-me  →  /to-spec  →  /to-tickets  →  /implement
```

On a cluster of related grilling tickets, three gaps showed up for our pack:

1. Each grill ended the session. The human had to remember which child was next. `/to-spec` then wrote a spec for the last ticket, not the whole pack.
2. A locked grill felt like "we decided, now code." Agents started a build and skipped `/to-spec` and `/to-tickets`.
3. `/triage` applied only category and state. The pack never got a house label, so `/grill-me` could not find siblings.

`/umbrella` is the conductor. It does not reimplement those skills.

## Install

Preferred order (you can skip this if you go straight to `/umbrella` — it runs the same check):

1. Install [mattpocock/skills](https://github.com/mattpocock/skills). Then run `/setup-matt-pocock-skills` once in each repo.
2. Add this overlay. It overwrites the skills in the table below and adds `/umbrella`:

```bash
npx skills@latest add SmokedMeats/umbrella-skills
```

Grok / user-global, or a XyberRun workspace with this clone next to the product repos:

```powershell
git clone https://github.com/SmokedMeats/umbrella-skills.git
cd umbrella-skills
node scripts/sync-workspace.mjs
```

That copies the overlay into `~/.grok`, `~/.cursor`, `~/.claude`, `~/.agents`, and each sibling repo’s `.cursor/skills` (`XyberRun`, `XyberRun.IO`, both watch repos). From the phone monorepo you can run the same thing as `npm run sync:umbrella-skills`.

3. In **your** repo, keep `docs/agents/triage-labels.md`. That file lists **your** label names. This pack does not ship product words.

`/umbrella` probes both of those on every run. If `setup-matt-pocock-skills` is missing next to it, it installs Matt's pack and then re-applies this overlay (Matt first, or Matt overwrites the overlay). If `docs/agents/issue-tracker.md` is missing, it runs `/setup-matt-pocock-skills` and waits — it does not invent tracker files.

## Two labels: domain and umbrella

`/triage` still applies one **category** (`bug` / `enhancement`) and one **state** (`ready-for-agent`, and the other state roles). Packs need two extra labels. You choose the words. You write them in `docs/agents/triage-labels.md`.

| Label | What it means | How many on one issue |
| --- | --- | --- |
| `domain:…` | The **area** of the product | One or more |
| `umbrella:…` | The **live** named pack | Zero or one |
| `parked:…` | Same slug, **not live** — Later / Leftover | Zero or one; never with `umbrella:…` |

**Example.** Many tickets sit in billing. Only some of them are the refunds pack.

| Issue | `domain:` | Live / parked |
| --- | --- | --- |
| Invoice PDF is blank | `billing` | none — one-off bug |
| Refunds: restock window | `billing` | `umbrella:refunds` |
| Later: refunds web board | `billing` | `parked:refunds` — not live |
| Dunning: day-3 email | `billing` | `umbrella:dunning` |

`domain:billing` is the neighborhood. `umbrella:refunds` is the **live** house `/grill-me` loads. `parked:refunds` is the same pack, shelved — listed under the house, never pulled, never assigned, never a second picker row.

If the pack is real and the `umbrella:…` label does not exist yet, create the label. Then apply it. That only creates a tracker label. It does **not** create a wayfinder map. The map is a separate issue with the `wayfinder:map` label.

Do not create an umbrella label for a one-off bug. Do not invent a new `domain:…` during triage. The domain list is the catalog in your mapping file.

## Order of use

Unedited skills stay in Matt's pack. Overlays in this repo are marked.

| When | Skill | This pack? |
| --- | --- | --- |
| Matt's pack or repo mapping missing | `/umbrella` prerequisite (install Matt, then setup) | **new** |
| Once per repo | `/setup-matt-pocock-skills` | no — Matt |
| Inbox is dirty | `/triage` | **overlay** |
| Which house / which phase | **`/umbrella`** | **new** |
| Foggy effort, no map yet | `/wayfinder` (chart) | **overlay** |
| Open grilling siblings | `/grill-me` → `/grilling` + `/domain-modeling` | grill-me + grilling **overlay**; domain-modeling **Matt** |
| Fact a decision waits on | `/research` | no — Matt |
| Need a cheap artifact | `/prototype` | no — Matt |
| Grill locked | **`/to-spec`** | **overlay** |
| Spec approved | **`/to-tickets`** | **overlay** |
| Tickets approved | **`/implement`** → `/tdd` → **Build loop** (gap-check → living docs including a phone **P\*** Device QA leaf → `/code-review` → remainder back on the same tickets) | implement + code-review **overlay**; tdd **Matt** |
| Two or more unblocked implement tickets | `/implement` **wave**: count table first, spawn children (spawn gate), then crawl later waves as they unlock | same overlay |
| Gap-check remainder or in-scope review findings | `/implement` **Build loop** in this session, then `/code-review` again | same overlay |
| "Which skill do I type?" | `/ask-matt` | no — Matt |

### Who applies labels

Three jobs. Do not merge them.

| Who | Job |
| --- | --- |
| **`/triage`** | Labels **inbound** (category, state, every fitting `domain:…`). **Names the house:** a `wayfinder:map`, or two or more like issues in the same pack, get a creatable `umbrella:…`. Same `domain:…` is not a pack. |
| **`/wayfinder`** (and `/to-tickets`) | Labels **on create** when this session files a map or a child. No `needs-triage`. Does not call `/triage`. |
| **`/umbrella`** | **Catch.** Every run, feed unlabeled, `needs-triage`, **and unhoused maps/children** to **`/triage`**. Does not invent `umbrella:…` itself. |

### Order (do not skip)

```
every /umbrella run       →  prerequisite (Matt pack + repo mapping), then /triage catch
loose idea / no map       →  /wayfinder
open grilling siblings    →  /grill-me
locked grill              →  /to-spec
approved spec             →  /to-tickets
approved tickets          →  /implement
two+ unblocked tickets    →  /implement wave (count table, spawn gate, crawl)
gap-check / review remainder →  /implement Build loop (same tickets), then /code-review again
window full during build  →  /implement Window full (spec comment + Next: /implement #<n>)
```

A locked grill is not a build. Keep the `/triage` catch every time.

`/grill-with-docs` is still Matt's interview when you are not on a wayfinder map. `/umbrella` does not replace it.

## Ship mode

Pin once at `/umbrella` start. Sticky for the whole house (`/implement`, `/code-review`, Device QA, crawl). Do **not** re-pick mid-run. Write it on `docs/agents/UMBRELLA_CURSOR.md` ([CURSOR.md](skills/umbrella/CURSOR.md)) or the conductor comment.

| Actor | Forced pin |
| --- | --- |
| Grok Bot teammates or Cursor cloud | `Ship mode: PR` — never `Development` tip |
| Local Grok Build or Cursor IDE on AlphaTerminal | `Ship mode: Development` — never a PR branch |

Wrong pin for this actor → correct once, note it, stay sticky. Mode A pushes `origin/Development`. Mode B is one ticket → one branch → one PR; green + waiting on Jacob is Kanban **Ready to merge** (not leftover; dependents wait). Cloud Mode B parks phone leftover on **Desk device**.

## What this pack changes

Short index first. Detail for the fat overlays is under the headings.

| Skill | What changed |
| --- | --- |
| `umbrella` | New conductor. Ship mode, cursor file, inbox catch, one board per repo. |
| `grilling` | Sibling batch + `Now on`. After lock: `/to-spec`, not implement. |
| `grill-me` | Load the map's grilling siblings. Do not ask "next grill?" |
| `wayfinder` | Pack-grill exception to one-ticket-per-session. Off-map work is `Later:`. |
| `to-spec` | Spec the whole locked batch. Stop. Next is `/to-tickets`. |
| `to-tickets` | Waves + exclusive paths. House labels. Parked slices are `Later:`. |
| `implement` | Count table, spawn gate, crawl, Build loop. Reads sticky Ship mode. |
| `code-review` | Two-axis report, then remaining ACs on the same tickets. |
| `triage` | Every fitting `domain:…`. Names `umbrella:…` for a map or two+ like issues. |

Matt's default stays **one ticket per session**. The umbrella grill is the exception. Tracker setup stays `/setup-matt-pocock-skills`.

### `/umbrella`

- Pin **Ship mode** first (table above).
- Read and rewrite `docs/agents/UMBRELLA_CURSOR.md` ([CURSOR.md](skills/umbrella/CURSOR.md)). That file is the **step**. GitHub labels win for **phase**.
- Every run: if Matt's pack or the repo mapping is missing, install / run setup first.
- Inbox catch → `/triage`: unlabeled, `needs-triage`, unhoused maps/children, open issues with no milestone, open issues missing from **this clone’s** Project.
- After create: `Later:` / `Leftover:` need **When to do this** ([PARKED-TICKETS.md](skills/umbrella/PARKED-TICKETS.md)).
- After close: [CLOSE-PARENTS.md](skills/umbrella/CLOSE-PARENTS.md) (child first; parent only when open children = 0, including parked).
- Claim: assign `@me`, Status **In Progress**.
- Two or more unblocked tickets → `/implement` wave. Later waves crawl as they unlock.
- After product-done Device QA: [DEVICE-QA.md](skills/umbrella/DEVICE-QA.md). No phone + last leftover → **Desk device**, do not close.
- Done cards stay on the board until [PROJECTS.md](skills/umbrella/PROJECTS.md) **Archive Done** (Done > 200, or other lanes need the page).
- **One board per repo:** phone **1**, IO **2**, AppleWatch **3**, AndroidWatch **4**. File on this clone. Never put watch or website cards on the phone board.
- Status right edge: leftover lanes → **Ready to merge** → **Live Beta** → **GoLive** → **Done**. Live Beta / GoLive are pullable. Resolve a card via `issue.projectItems` — do not `item-list` the first 200.

### `/grilling` · `/grill-me` · `/wayfinder`

- **grilling** — sibling batch + `Now on`. After lock: `/to-spec`. A “not this pack” branch files `Later:` with **When to do this**.
- **grill-me** — load the map's grilling siblings. Advance without asking "next grill?"
- **wayfinder** — umbrella-grill exception to one-ticket-per-session. Wanted-but-not-this-map work files `Later:` with **When to do this**. Forever-out stays map Out of scope.

### `/to-spec` · `/to-tickets`

- **to-spec** — spec the whole locked batch, then stop. Next is `/to-tickets`. Later work in Out of Scope must already be a `Later:` ticket with **When to do this**. Name Effect seams only when a spec owns an untrusted bag or walking-way HTTP.
- **to-tickets** — waves + exclusive paths. Each ticket names spec + map, wears house labels, and is a child of the map. Parked slices are `Later:` (no `ready-for-agent`) with **When to do this**. Effect-TS acceptance only on tickets that own a bag or walking-way HTTP.

### `/implement`

- Read the sticky **Ship mode** pin. Do not re-pick.
- Count first: **table in the first reply**. **Spawn gate** before any product-file edit. Then **crawl**.
- Window full → conductor comment on the spec + `Next: /implement #<n>` (2+ frontier = next session is conductor).
- Before product code, backfill parent + map + house labels if create missed them.
- **Build loop:** gap-check remaining ACs vs current code. PARTIAL/FAIL stays on the same tickets. Living docs when PASS (phone-visible ships append a **P\*** leaf on `DEVICE_QA_PHASED_CHECKLIST.md`). `/code-review` in-scope findings return here.
- New `backend/drizzle/0xxx_*.sql` → `npm run db:migrate:all` in the same session.
- **Effect-TS (XyberRun pin):** skip unless the change matches an existing Effect seam (`Schema`/`Either` on an untrusted bag, or `Effect`+`Schedule` next to walking-way HTTP). Do not wrap services in `Effect.gen`. A new `JSON.parse` / webhook / native dict still gets a census row.
- Per ticket before close or leftover-lane: gap check + `/code-review` two-axis + **Living docs** comment (grep `docs/`).
- Leftover lanes (Operator / Desk / Field) **Crawl** the next wave. They do not hold dependents. **Live Beta** / **GoLive** are pullable, not leftover. Mode B **Ready to merge** holds dependents until Jacob merges.
- On close: drop `ready-for-agent`, child first, CLOSE-PARENTS. Do not archive Done unless the 200-card trim says so.

### `/code-review`

- After the two-axis report, **Close the loop**: each Standards hard violation and Spec missing/partial/wrong becomes remaining ACs on the **same** tickets, then `/implement` again.
- `Later:` only for grill/spec not-this-pack. A report without that remaining-AC verdict is unfinished.
- Flag a hand-parsed bag or one-off retry only next to an existing Effect sibling — not `Effect.gen` for its own sake.
- On XyberRun: `check-cycles` when the diff touches backend or mobile `src`. Also hard-pin missing map fragment, fat router, auth-glob drive-by, new low-value test, raw tier check, raw RN `Modal`.

### `/triage`

- Apply every fitting `domain:…`.
- Create `umbrella:…` for a map, or for two or more like issues in the same pack.
- House-name pass does not flip state.

## Credit

Built to sit on [Matt Pocock's skills](https://github.com/mattpocock/skills). Overlay files start from those skills. `/umbrella` is original to this repo. This pack is the SSOT — we do not keep a field-notes issue on Matt's repo.

Maintainer notes: [MAINTAINING.md](./MAINTAINING.md).

## License

MIT. See [LICENSE](./LICENSE).

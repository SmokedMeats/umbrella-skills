# umbrella-skills

This pack adds **`/umbrella`** on top of [Matt Pocock's skills](https://github.com/mattpocock/skills) (**v1.3.1**). Install Matt's pack first. Install this overlay second. `/umbrella` is the only front door.

It also pulls methods from [Lauren Tan (poteto)](https://github.com/poteto). The skills stack is [pstack](https://github.com/cursor/plugins/tree/main/pstack) in [cursor/plugins](https://github.com/cursor/plugins): `/how`, `/why`, `/teach` (explain), `/principles` (one index), and `/blast-radius`. Agents auto-invoke them when the work needs them. A slash menu is not required. This overlay does not install poteto-mode or the full pstack plugin.

Matt's skills do the work: `/wayfinder`, `/grill-me`, `/to-spec`, `/to-tickets`, `/implement`. `/umbrella` names the pack of issues (the **house**) and the **next** skill. Optional sticky **`/umbrella-mode`** keeps the parent thin and runs phase work as Task/bot kids with packets ([DELEGATION.md](skills/umbrella/DELEGATION.md)). After implement, **`/build-verifier`** mechanically audits ticket ACs before close; after Device QA, **`/device-qa-verifier`** audits the run folder (never the phone). Agents may auto-invoke these skills. A locked grill, with every gap closed, auto-runs `/to-spec` → `/to-tickets` → `/implement`. Spec approval and ticket approval are not gates. The founder still locks the grill. A locked grill does not jump straight to a build.

After a locked grill, the house crawl is default `/umbrella` behavior in that session, not a separate overnight arm, and `/loop` is optional. A named **House queue** ("work through these") runs one house at a time, then the next; Ready to merge on house A does not block house B. Phase B: `/umbrella` auto-routes installed Matt skills (`/simple-english`, `/wait-what`, `/writing-for-agents`, `/handoff`, `/domain-modeling`, `/prototype`, `/codebase-design`, `/diagnosing-bugs`, `/tdd`, `/retro`, `/pr`, …) without copying their bodies into this overlay. `/implement-spec` stays Matt standalone. See [Thin conventions](#thin-conventions).

## Why this is not a fork

A fork copies Matt's whole repo. Then every upstream change needs a merge. Then this pack looks like a replacement.

This repo is an **overlay**:

1. Install Matt's pack first. That is the skillset.
2. Install this pack second. It overwrites a few of those skills, adds `/umbrella` (with DELEGATION / BUILD-STANDING / CURSOR companions), optional `/umbrella-mode`, `/build-verifier`, `/device-qa-verifier`, and `/how`, `/why`, `/teach`, `/teach-me`, `/principles`, and `/blast-radius`. Planning-spine overlays stay Matt-based. `/how`, `/why`, `/teach`, `/principles`, and `/blast-radius` are adapted from [poteto](https://github.com/poteto) / [pstack](https://github.com/cursor/plugins/tree/main/pstack), with house unslop. `/teach-me` is Matt's former `/teach`.
3. Unedited skills stay Matt's (`/tdd`, `/research`, `/prototype`, `/domain-modeling`, `/codebase-design`, `/improve-codebase-architecture`, `/diagnosing-bugs`, `/retro`, `/pr`, `/implement-spec`, `/simple-english`, `/wait-what`, `/writing-for-agents`, `/handoff`, `/ask-matt`, `/setup-matt-pocock-skills`). `/umbrella` auto-routes them (except `/implement-spec`, which stays standalone). It does not copy their bodies. `/zero-tech-debt` and `/pit-of-success` only when installed. Matt **v1.3.1** dropped `/resolving-merge-conflicts`.

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

1. Install [mattpocock/skills](https://github.com/mattpocock/skills) at **v1.3.1** (`npx skills@latest add mattpocock/skills`). Then run `/setup-matt-pocock-skills` once in each repo.
2. Add this overlay. It overwrites the skills in the table below, adds `/umbrella` (plus companions), optional `/umbrella-mode`, `/build-verifier`, `/device-qa-verifier`, and `/how`, `/why`, `/teach`, `/teach-me`, `/principles`, and `/blast-radius`. Planning-spine overlays stay Matt-based. `/how`, `/why`, `/teach`, `/principles`, and `/blast-radius` are adapted from [poteto](https://github.com/poteto) / [pstack](https://github.com/cursor/plugins/tree/main/pstack), with house unslop. `/teach-me` is Matt's former `/teach`.

```bash
npx skills@latest add SmokedMeats/umbrella-skills
```

Grok / user-global, or a workspace with this clone next to your product repos:

```bash
git clone https://github.com/SmokedMeats/umbrella-skills.git
cd umbrella-skills
# optional private overlay (project.yml + standing rules):
# git clone <private-overlay-url> ../<overlay_pack>
node scripts/sync-workspace.mjs
```

That copies the overlay into `~/.grok`, `~/.cursor`, `~/.claude`, `~/.agents`, `~/.copilot` (each `<root>/skills`, created when missing), and each sibling product repo listed in `project.yml` `workspace.skill_targets` (defaults to none until you add a config). When a private overlay sibling is present, sync also layers `project.yml`, `skills-overlay/**`, and standing product rules.

Every skills root sync writes ends up with the same three config files: `project.yml` and `standing-product-rules.md` at the root (from the private overlay) and `umbrella/PROJECT-CONFIG.md` (ships in this pack). Product repos also get `docs/agents/project.yml` + `docs/agents/standing-product-rules.md`; commit the product repo's `.cursor/skills` + `docs/agents` so cloud clones get them too.

| Target | How |
| --- | --- |
| User skill roots `~/.grok/skills`, `~/.cursor/skills`, `~/.claude/skills`, `~/.agents/skills`, `~/.copilot/skills` | always (Windows: `%USERPROFILE%\.copilot\skills`) |
| Each product repo's `.cursor/skills` + `docs/agents/` | `project.yml` `workspace.skill_targets` (sibling clones only) |
| Grok Bot box skills root `/home/box/agent-data/workflows` | `--box` (skipped when that folder's parent is missing; override with `UMBRELLA_BOX_SKILLS_ROOT`) |
| Any other skills root | `--dest <dir>` (repeatable) |

`sync-workspace.mjs` (project.yml) and `check-public-safe.mjs` (denylist, allowlist, git output) normalize CRLF to LF on read, so Windows clones checked out with CRLF (`core.autocrlf=true`) sync every `skill_targets` repo, not just the first. This pack's `.gitattributes` also pins LF on checkout.

Sync also turns on the local `check:public-safe` pre-push gate in every sibling clone that ships `.githooks/pre-push` + `scripts/check-public-safe.mjs` (`git config core.hooksPath .githooks`, and `publicsafe.denylist` pointing at the overlay's `public-safe/denylist.txt`). The gate needs [gitleaks](https://github.com/gitleaks/gitleaks) on PATH: `brew install gitleaks` (macOS), `winget install gitleaks` or `scoop install gitleaks` (Windows), or a [release binary](https://github.com/gitleaks/gitleaks/releases) (Linux). Without gitleaks or the denylist, pushes from those clones fail closed. See [Before pushing](#before-pushing).



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

**Phase B.** Matt skills stay Matt installs (**v1.3.1**). This overlay does not copy their bodies. `/umbrella` auto-routes them when the playbook says so: `/domain-modeling` (with `/grilling`), `/prototype`, `/codebase-design`, `/improve-codebase-architecture`, `/diagnosing-bugs`, `/tdd`, `/retro` (after `/code-review` or a bug fix), `/pr` (PR body shape), `/simple-english`, `/wait-what`, `/writing-for-agents`, and `/handoff`. `/implement-spec` is Matt standalone (not a second conductor; umbrella `/implement` stays same-worktree waves unless the founder asks for worktrees). `/zero-tech-debt` and `/pit-of-success` only when installed. Thin conventions, not new skills: **DESIGN-IT-TWICE** (explicit ask, or a non-trivial prototype UI), a default-on **decision trail** on a long crawl (`decisions.tsv` or cursor bullets), **figure-it-out** (only when `/wayfinder` does not fit; one pass, then the spine), **comment cleanup** before review, and a **recall brief** on handoff (house queue, ship mode, now-on tickets, decisions trail path, blockers). Swarm and arena are not standing. `/automate-me` is maintainer-only. There is no `typescript-best-practices` always-on overlay.

| When | Skill | This pack? |
| --- | --- | --- |
| Matt's pack or repo mapping missing | `/umbrella` prerequisite (install Matt, then setup) | **new** |
| Once per repo | `/setup-matt-pocock-skills` | no — Matt |
| Inbox is dirty | `/triage` | **overlay** |
| Which house / which phase / keep the house crawl | **`/umbrella`** (auto-invoked). One house at a time | **new** |
| Several houses named, or "work through these" | **`/umbrella`** runs that queue one house at a time. Ready to merge on the current house does not block the next | **new** |
| Foggy effort, no map yet | `/wayfinder` (chart) | **overlay** |
| Before grill | Doc review + explicit gap list | **`/umbrella` pre-grill** |
| Open grilling siblings | `/grill-me` → `/grilling` + `/domain-modeling` | grill-me + grilling **overlay**; domain-modeling **Matt** |
| Fact a decision waits on | `/research` | no — Matt |
| Need a cheap artifact, or prove a fold | `/prototype`. **DESIGN-IT-TWICE** when asked, or for a non-trivial UI or flow | no — Matt; convention in `/umbrella` |
| Grill locked, every gap closed | **`/to-spec`** immediately (no spec approval) | **overlay** |
| Spec published from that lock | **`/to-tickets`** immediately (no ticket approval) | **overlay** |
| Tickets filed from that lock | **`/implement`** house crawl (default under `/umbrella`) → `/tdd` → **Build loop** (gap-check vs the lock → living docs for touched docs, including a phone **P\*** Device QA leaf → comment cleanup → `/code-review` including `/blast-radius` → remainder back on the same tickets). The pull is not ready until the ticket has the **ready comment** (`## Gap check`, `## Living docs`, `## Standards`, `## Spec`, `## Cycles`, `## Effect-TS check`). Silence is not an Effect-TS skip. Do not stop after filing | implement + code-review **overlay**; tdd **Matt** |
| Two or more unblocked implement tickets | `/implement` **wave**: count table first, spawn children (spawn gate), then crawl later waves as they unlock | same overlay |
| Long house crawl / thin parent context | **`/umbrella-mode`** (sticky). Parent keeps grill, claim, CURSOR, Founder gates; kids get one phase skill + companions only | **new** |
| After implement product lands, before close/lane | **`/build-verifier`** (or inline receipt). Fail-closed if ticket ACs missing. Not Device QA, not `/code-review` | **new** |
| After Device QA returns | **`/device-qa-verifier`**. Checklist vs run folder; never re-tap. Parent alone advances Status off Desk device | **new** |
| Build loop empty on a ticket | Set the lane from what is left: Operator / Desk device / Field / Ready to merge / Live Beta / GoLive / Done. Leftover lanes do not hold the next wave. Ready to merge holds dependents until merge | same overlay |
| Phone-visible, and this pass cannot run Device QA | **Desk device**, do not close, crawl the next unblocked coding ticket. Device QA only when this runner sees exactly one USB phone and no other actor owns it | same overlay |
| Gap-check remainder or in-scope review findings | `/implement` **Build loop** in this session, then `/code-review` again | same overlay |
| Hard or flaky bug | `/diagnosing-bugs`, then `/implement`; then `/retro` | diagnosing-bugs + retro **Matt** |
| After `/code-review`, or after a bug fix | `/retro` (environment retrospective; feeds `/correct`; not the recall brief) | no — Matt |
| Writing a PR body | `/pr` (model-invoked). Mode B still needs the `commands.pr_ready_pass` line naming the current `<dev-branch>` tip | no — Matt |
| Whole-spec worktree frontier build | `/implement-spec` (standalone Matt). Not routed inside umbrella `/implement` | no — Matt |
| How does this work / where should it live | `/how` | **new** |
| Why is it shaped this way | `/why` (git and PRs first; widen only when needed) | **new** |
| Explain this code or change | `/teach` (weaves `/how` and `/why`) | **new** |
| Learn a topic over multiple sessions | `/teach-me` (former Matt `/teach`) | **new** |
| Mid-task principle redirect | `/principles` (one index) | **new** |
| What else could this break | `/blast-radius` (also from `/code-review`) | **new** |
| User-facing prose, leftover questions, ship notes, Device QA wait comments | `/simple-english` | no — Matt |
| User says unclear or too jargony | `/wait-what` | no — Matt |
| Editing agent-facing docs in the repo | `/writing-for-agents` | no — Matt |
| Structure or module boundaries | `/codebase-design` | no — Matt |
| Architecture debt, asked or idle and in scope | `/improve-codebase-architecture`. `/zero-tech-debt` and `/pit-of-success` only if installed | no — Matt |
| Off-map, and `/wayfinder` does not fit | figure-it-out (one competing-planner pass, then the spine) | convention — not a skill |
| Long crawl (multi-ticket or a house queue) | decision trail: `decisions.tsv` or cursor bullets. Default on | convention |
| Window full / end of session / next agent | `/handoff` when installed, plus the recall brief. The brief keeps **House queue** | handoff **Matt** when installed; brief is this pack |
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
open grilling siblings    →  pre-grill doc + gap list, then /grill-me
grill lock (gaps closed)  →  /to-spec → /to-tickets → /implement house crawl
tickets filed             →  keep /implement crawling in this session (/loop is optional)
two+ unblocked tickets    →  /implement wave (count table, spawn gate, crawl)
gap-check / review remainder →  /implement Build loop (same tickets), then /code-review again
empty Build loop          →  lane from what is left, then the next unblocked coding ticket
named houses, in order    →  one house at a time; coding crawl done → next house (Ready to merge does not block)
no phone / cannot see USB →  Desk device, do not close, keep coding elsewhere
before a terminal lane    →  lock gap check, living-doc verify, comment cleanup, blast-radius
window full during build  →  /implement Window full (spec comment + recall brief + Next: /implement #<n>)
off-map, no map shape     →  figure-it-out once, then the spine
user-facing copy          →  /simple-english
unclear / too jargony     →  /wait-what
hard or flaky bug         →  /diagnosing-bugs, then /implement
explain                   →  /how, /why, or /teach
course over sessions      →  /teach-me
```

A locked grill is not a build. It is the only planning pause. After that confirm, do not wait for spec approval or ticket approval. Keep the `/triage` catch every time.

PAUSE for the grill lock (per house), Ready-to-merge waiting on the founder, Preview fast-forward / migrate / OTA / master promote, phone Device QA ownership conflicts, and irreversible actions. Never merge, Preview fast-forward, migrate, OTA, or master promote unattended. An ownership conflict pauses the phone and the crawl continues on this house's other coding tickets. Do not pause between spec and tickets, or tickets and implement, after a lock with every gap closed. If the grill skipped the doc/gap pass or left a gap open, refuse that auto-advance. One named house stops at Ready-to-merge waiting on the founder. A house queue starts the next house instead. The session stops on Window full, a Founder pause that blocks the session, or when the user stops.

`/grill-with-docs` is still Matt's interview when you are not on a wayfinder map. `/umbrella` does not replace it.

## Thin conventions

House rules in `/umbrella`. Not new skill folders.

- **DESIGN-IT-TWICE.** Only when asked, or when `/prototype` is a non-trivial UI or flow. Two short sketches, then lock one. A trivial stub skips it.
- **Decision trail.** Default on a long crawl (multi-ticket or a **House queue**). `decisions.tsv` (`when`, `ticket`, `decision`, `why`) or short bullets in the cursor file. One house at a time.
- **figure-it-out.** Only when `/wayfinder` does not fit. One competing-planner pass, then the spine. Not a slash.
- **Comment cleanup.** Before `/code-review` closes a ticket, strip narrative and noise comments from this change. Keep intentional API and docs comments. No cleanup subagent.
- **Recall** brief (handoff). On Window full, end of session, or the next agent: house queue, ship mode, now-on tickets, decisions trail path, blockers, corrections this session. Follow `/handoff` when that skill is installed. The brief does not start the next house.
- **Agent-shaped design.** On `/codebase-design`, architecture debt, or DESIGN-IT-TWICE: reject split ownership, two ways, importable internals, and a hand-synced list. Do not install `/architect`.
- **Repeated corrections.** `/correct` is this alias. The second correction of the same kind in a session stops the run until it is encoded. Second time the same mistake shows up, fix it in structure, then types, then a lint that names the fix, then a behavior test. Docs last. Not a new skill.
- **Measured slowness.** Mantra order, then **explain-the-number**, before a measured number is trusted or reported. Not a hillclimb slash.
- **Asks outside the grill.** Plain words. No one-word token. Grill shape (Context, Choices, Recommend) stays.
- **Overnight `/loop`.** Optional. If armed, `/loop 1h`. No `/goal`. The tick does not merge or promote.

Swarm and arena are not standing. `/automate-me` is maintainer-only. There is no `typescript-best-practices` always-on overlay.

## Ship mode

Pin once at `/umbrella` start. Sticky for the whole multi-house run (`/implement`, `/code-review`, Device QA, crawl, every house in the queue). Do **not** re-pick mid-run. Write it on `project.yml` `paths.umbrella_cursor` ([CURSOR.md](skills/umbrella/CURSOR.md)) or the conductor comment.

| Actor | Forced pin |
| --- | --- |
| Grok Bot teammates or Cursor cloud | `Ship mode: PR` — never `<dev-branch>` tip |
| Local Grok Build or Cursor IDE on <local-dev-host> | `Ship mode: <dev-branch>` — never a PR branch |

Wrong pin for this actor → correct once, note it, stay sticky. Mode A pushes `origin/<dev-branch>`. Mode B is one ticket → one branch → one PR; green + waiting on the founder is Kanban **Ready to merge** (dependents wait). Cloud Mode B leaves phone leftover on **Desk device** and keeps the coding crawl. One pin. No second worktree on the same `adb` device.

## What this pack changes

Short index first. Detail for the fat overlays is under the headings.

| Skill | What changed |
| --- | --- |
| `umbrella` | Only conductor. Auto-invoked. One house at a time. A named queue starts the next house after this coding crawl. Auto-routes Matt playbook skills. Thin conventions: DESIGN-IT-TWICE, agent-shaped design, repeated corrections (`/correct` alias), measured slowness, asks outside the grill, decision trail, figure-it-out, comment cleanup, recall brief. Optional overnight `/loop 1h` (no `/goal`). Pre-grill gaps. Grill lock is the only planning gate. Then spec → tickets → the house crawl. Companions: [DELEGATION.md](skills/umbrella/DELEGATION.md), [BUILD-STANDING.md](skills/umbrella/BUILD-STANDING.md), [CURSOR.md](skills/umbrella/CURSOR.md) (**Close gate** before close/lane). |
| `umbrella-mode` | Sticky conductor mode. Parent owns grill, phase detect, claim, CURSOR, Founder gates, Close gate + close/lane. Fresh child by default. Respawn a thin receipt once. Kids never load `umbrella/SKILL.md`. No poteto install. |
| `build-verifier` | Readonly receipt audit after implement. Gap-check grill+spec+ticket ACs; fail-closed if AC checklist missing. Not Device QA. Not `/code-review`. |
| `device-qa-verifier` | Readonly audit after Device QA. Checklist vs run folder; Fail→one issue; never re-tap the phone. |
| `grilling` | Sibling batch + `Now on`. Every question is Context (plain terms) + Choices + Recommend. Loads `/domain-modeling` with the interview. Gap list required. Lock only when every gap is closed. Then `/to-spec` immediately. |
| `grill-me` | Load the map's grilling siblings. Question shape stays in `/grilling`. Refuse a lock with open gaps. Do not ask "next grill?" |
| `wayfinder` | Pack-grill exception to one-ticket-per-session. Off-map work is `Later:`. Prototype tickets read Matt `/prototype`. Non-trivial UI uses DESIGN-IT-TWICE. Auto-invoked. |
| `to-spec` | Spec the whole locked batch. Cite gap resolutions. **Carry checklist** (`CARRY_FROM_GRILL`): every locked decision answered, deferred, or cut; refuse publish if missing. Label it `spec`. No approval wait. Next is `/to-tickets`. |
| `to-tickets` | 1:1 with the spec. Waves + exclusive paths. Live tickets need **≥2** checkable Acceptance criteria. **Carry** (`CARRY_FROM_SPEC`): each in-scope decision → ticket AC(s) or parked#. No approval wait. Next is `/implement`. |
| `implement` | Count table, spawn gate, crawl, Build loop. Follow [BUILD-STANDING.md](skills/umbrella/BUILD-STANDING.md) (not full umbrella). Pre-code AC gate. Ship mode PR: push the PR branch after each verifiable unit and use the `##` PR briefing. Before Ready to merge: rebase or merge current <dev-branch>, run `commands.pr_ready`, paste its PASS line (`commands.pr_ready_pass`) in the PR body. Before close/lane: write **Close gate** on `paths.umbrella_cursor` and refuse if incomplete. Comment cleanup before review. Empty loop sets the lane from what is left. |
| `code-review` | Two-axis report, Spec-axis blast-radius, optional adversarial notes, narrative comments in-scope on Standards, then remaining ACs on the same tickets. |
| `triage` | Every fitting `domain:…`. Names `umbrella:…` for a map or two+ like issues. Hard bugs name `/diagnosing-bugs`. |
| `how` | Subsystem walkthrough. Auto-invoked. |
| `why` | Why the code is shaped that way. Git and PRs first. Widen only when the question needs it. |
| `teach` | One-sitting explanation. Weaves `/how` and `/why`. Not a course. |
| `teach-me` | Multi-session learning workspace. Former Matt `/teach`. |
| `principles` | One index of mid-task redirects, including **explain-the-number** and **resist-agent-mistakes**. Not a folder per principle. Not a second conductor. |
| `blast-radius` | What else a change breaks. Prove the one safety fact by running code. |

Matt's default stays **one ticket per session**. The umbrella grill is the exception. Tracker setup stays `/setup-matt-pocock-skills`.

**Phase B wiring.** The Matt skills this pack does not overlay stay Matt installs. `/umbrella` auto-routes them. Thin conventions are DESIGN-IT-TWICE, agent-shaped design, repeated corrections, measured slowness, asks outside the grill, the decision trail, figure-it-out, comment cleanup, and the recall brief. Swarm and arena are not standing slashes and not an always-on fan-out. `/automate-me` is maintainer-only, not an always-on pack writer. There is no `typescript-best-practices` always-on overlay.

### `/umbrella`

- Pin **Ship mode** first (table above). The same pin covers every house in the queue.
- Read and rewrite `project.yml` `paths.umbrella_cursor` ([CURSOR.md](skills/umbrella/CURSOR.md)). That file is the **step**, plus a **House queue** when the user names several houses. GitHub labels win for **phase**.
- **One house at a time.** An ordered list of houses, slugs, or issues that map to more than one `umbrella:*`, or "work through these", is that queue. Finish this house's coding crawl, then claim the next house and detect its phase. Do not interleave tickets. One named house does not auto-hop. Ready to merge waits on the founder and does not block the next house. Soft-queue overlap still runs before any merge prompt.
- Every run: if Matt's pack or the repo mapping is missing, install / run setup first.
- Inbox catch → `/triage`: unlabeled, `needs-triage`, unhoused maps/children, open issues with no milestone, open issues missing from **this clone’s** Project.
- After create: `Later:` / `Leftover:` need **When to do this** ([PARKED-TICKETS.md](skills/umbrella/PARKED-TICKETS.md)).
- After close: [CLOSE-PARENTS.md](skills/umbrella/CLOSE-PARENTS.md) (child first; parent only when open children = 0, including parked).
- Claim: assign `@me`, Status **In Progress**.
- Pre-grill before `/grill-me`: review GLOSSARY, ADRs, living docs, related tickets, and prior locks. Write the gap list. No lock while a gap is open or vague.
- After the lock confirm: `/to-spec` (cite gap resolutions) → `/to-tickets` (1:1) → `/implement` house crawl. Do not wait for spec or ticket approval. Do not stop after filing tickets.
- When a Build loop is empty: set the lane from what is left (Operator / Desk device / Field / Ready to merge / Live Beta / GoLive / Done). Gap check vs the lock, living-doc verify for touched docs, `/code-review` including `/blast-radius` still run first. Invented scope is new fog, and it is not a silent merge.
- Playbooks: feature/fog stays on the spine. Bug or flake → `/diagnosing-bugs`, then `/implement`, then `/retro`. After `/code-review` → `/retro`. PR body → Matt `/pr` (Mode B still needs the `commands.pr_ready_pass` line). `/implement-spec` is standalone Matt, not inside umbrella `/implement`. Explain → `/how` / `/why` / `/teach`. Course → `/teach-me`. User-facing copy → `/simple-english`. Unclear or too jargony → `/wait-what`. Agent docs in the repo → `/writing-for-agents`. Structure or module boundaries → `/codebase-design`. Cheap artifact → `/prototype` (DESIGN-IT-TWICE when asked, or for a non-trivial UI or flow). Off-map when `/wayfinder` does not fit → figure-it-out once, then the spine. Window full or the next agent → `/handoff` when installed, with the recall brief. Architecture debt → Matt `/improve-codebase-architecture` when asked or when that work is in scope (`/zero-tech-debt` and `/pit-of-success` only if installed).
- House crawl is default `/umbrella` behavior. `/loop` is optional. The crawl continues in this session without it. One house stops at Ready-to-merge waiting on the founder. A queue starts the next house. The session stops on Window full, a Founder pause that blocks the session, or when the user stops. A long crawl (multi-ticket or a house queue) keeps a decision trail: `decisions.tsv` in the house notes, or short bullets in the cursor file. Default on. Do not wait on the founder to start it. Handoff points at that path. Never merge, Preview fast-forward, migrate, OTA, or master promote unattended.
- Two or more unblocked tickets → `/implement` wave. Later waves crawl as they unlock. Leftover lanes do not hold that wave. Ready to merge holds dependents until merge.
- Device QA: [DEVICE-QA.md](skills/umbrella/DEVICE-QA.md). `adb devices` is not exactly one, this runner cannot see USB, or another actor owns the phone → **Desk device**, do not close, crawl the next unblocked coding ticket. Cursor cloud cannot see the phone. One Ship mode pin. No second worktree on the same `adb` device.
- Done cards stay on the board until [PROJECTS.md](skills/umbrella/PROJECTS.md) **Archive Done** (Done > 200, or other lanes need the page).
- **One board per repo** (see `project.yml` `repos[]`). File on this clone. Never put satellite-repo cards on the primary board.
- Status right edge: leftover lanes → **Ready to merge** → **Live Beta** → **GoLive** → **Done**. Live Beta / GoLive are pullable. Resolve a card via `issue.projectItems` — do not `item-list` the first 200.

### `/grilling` · `/grill-me` · `/wayfinder`

- **grilling** — sibling batch + `Now on`. Every question is Context (plain terms) + Choices + Recommend. Read `/domain-modeling` with the interview. The pre-grill gap list is in the tree. Refuse the lock while a gap is open. After the confirm: `/to-spec` immediately. A “not this pack” branch files `Later:` with **When to do this**.
- **grill-me** — load the map's grilling siblings. Question shape stays in `/grilling`. No gap list → do not start. Advance without asking "next grill?"
- **wayfinder** — umbrella-grill exception to one-ticket-per-session. Wanted-but-not-this-map work files `Later:` with **When to do this**. Forever-out stays map Out of scope. A prototype ticket reads Matt `/prototype`. A non-trivial UI or flow follows DESIGN-IT-TWICE.

### `/to-spec` · `/to-tickets`

- **to-spec** — spec the whole locked batch and cite every gap resolution. Emit **`CARRY_FROM_GRILL`** (locked decisions covered / deferred / cut; `missing=none`). Refuse publish if a locked decision is missing from the cite list. The spec issue wears the `spec` label. Do not wait for approval. Next is `/to-tickets`. Later work in Out of Scope must already be a `Later:` ticket with **When to do this**. Name Effect seams only when a spec owns an untrusted bag or flaky outbound HTTP. Open gaps → back to grill. Do not publish.
- **to-tickets** — 1:1 with that spec. No approval quiz. Waves + exclusive paths. Every **live** ticket needs `## Acceptance criteria` with **≥2** checkable done-looks-like boxes (refuse placeholder/task-only). Emit **`CARRY_FROM_SPEC`**: each in-scope locked decision → ticket AC(s) or an explicit parked ticket. Each ticket names spec + map, wears house labels, and is a child of the map. Parked slices are `Later:` (no `ready-for-agent`) with **When to do this**. Effect-TS acceptance only on tickets that own a bag or flaky outbound HTTP. Next is `/implement`.

### `/implement`

- Follow [BUILD-STANDING.md](skills/umbrella/BUILD-STANDING.md). Do not load full `umbrella/SKILL.md` as a kid.
- Read the sticky **Ship mode** pin. Do not re-pick.
- Before product code: live tickets need a real Acceptance criteria checklist (≥1 checkbox). Empty AC → repair or escalate; do not invent from chat.
- Before close or leftover-lane: rewrite **Close gate** on `project.yml` `paths.umbrella_cursor` ([CURSOR.md](skills/umbrella/CURSOR.md)). Shape: `Close gate (#N): AC all PASS | BV pass | code-review empty | Living docs | migrate N/A|done | lane=<lane>`. Refuse if incomplete. Prefer **`/build-verifier`** Pass before that lane.
- Count first: **table in the first reply**. **Spawn gate** before any product-file edit. Then **crawl**.
- Window full → conductor comment on the spec + recall brief (house queue, ship mode, now-on tickets, decisions trail path, blockers) + `Next: /implement #<n>` (2+ frontier = next session is conductor). If this house's coding crawl is already done, the last line names the next queued house and does not start it. Follow `/handoff` when that skill is installed.
- Before product code, backfill parent + map + house labels if create missed them.
- **Build loop:** gap-check remaining ACs vs the grill lock, the spec, and current code. PARTIAL/FAIL stays on the same tickets. Invented scope is parked as new fog and re-grilled. Living docs when PASS: update/verify docs this change touched (phone-visible ships append a **P\*** leaf on `DEVICE_QA_PHASED_CHECKLIST.md`). Not a second pre-grill survey. **Comment cleanup** strips narrative comments added in this change, then `/code-review` (including blast-radius). In-scope findings, including leftover narrative comments, return here. A prototype ticket in the wave, or an explicit ask, uses DESIGN-IT-TWICE. Do not require that for every feature.
- New `backend/drizzle/0xxx_*.sql` → `project.yml` `commands.db_migrate` in the same session.
- **Effect-TS (when standing-product-rules present):** skip unless the change matches an existing Effect seam (`Schema`/`Either` on an untrusted bag, or `Effect`+`Schedule` next to flaky outbound HTTP). Do not wrap services in `Effect.gen`. A new `JSON.parse` / webhook / native dict still gets a census row.
- Per ticket before close or leftover-lane: gap check, **Living docs** comment (grep `docs/`), **Comment cleanup**, then `/code-review` two-axis.
- When the Build loop is empty, set the lane from what is left: Operator / Desk device / Field / Ready to merge / Live Beta / GoLive / Done. Leftover lanes **Crawl** the next wave. They do not hold dependents. **Live Beta** / **GoLive** are pullable. Mode B **Ready to merge** holds dependents until the founder merges. It does not block the next house in a **House queue**. After **End of house**, return to `/umbrella` for that house.
- No phone, this runner cannot see USB, or another actor owns the phone → **Desk device**, do not close, crawl the next unblocked coding ticket. Never merge, Preview fast-forward, migrate, OTA, or master promote unattended.
- On close: drop `ready-for-agent`, child first, CLOSE-PARENTS. Do not archive Done unless the 200-card trim says so.

### `/code-review`

- Spec axis includes **blast-radius**: prove the one safety fact by running code, or mark it unproven. Optional adversarial notes are a short annex. No multi-model product.
- Standards flags leftover narrative or noise comments from this change as in-scope. Keep intentional API and docs comments. Do not require a comment-cleanup subagent.
- After the two-axis report, **Close the loop**: each Standards hard violation and Spec missing/partial/wrong (including an unproven safety fact the ship depends on) becomes remaining ACs on the **same** tickets, then `/implement` again.
- `Later:` only for grill/spec not-this-pack. A report without that remaining-AC verdict is unfinished.
- Flag a hand-parsed bag or one-off retry only next to an existing Effect sibling — not `Effect.gen` for its own sake.
- When product hard pins are configured: `check-cycles` when the diff touches backend or mobile `src`. Also hard-pin missing map fragment, fat router, auth-glob drive-by, new low-value test, raw tier check, raw RN `Modal`.

### `/triage`

- Apply every fitting `domain:…`.
- Create `umbrella:…` for a map, or for two or more like issues in the same pack.
- House-name pass does not flip state.
- A hard or flaky bug names next skill `/diagnosing-bugs`, then `/implement`. The brief does not stop at "reproduce."

### `/how` · `/why` · `/teach` · `/teach-me`

- **how** — how a subsystem works, and where a change should live.
- **why** — why it is shaped that way. Git history and pull requests first. Add issues, docs, chat, observability, errors, or analytics only when the question needs them and a tool exists.
- **teach** — one plain explanation that weaves how and why. Not a course.
- **teach-me** — former Matt `/teach`. Multi-session workspace: `MISSION.md`, `RESOURCES.md`, `lessons/`, learning records. Do not use it to explain a diff.

### `/principles` · `/blast-radius`

- **principles** — one index. Redirect mid-task by name. Each line is a short rule and, where the house already has the move, a pointer at `/umbrella`, `/implement`, `/to-tickets`, `/blast-radius`, `/tdd`, `/diagnosing-bugs`, or `/domain-modeling`. **explain-the-number** gates a measured speedup, regression, or eval. **resist-agent-mistakes** screens a module shape. **encode-lessons-in-structure** is the `/correct` ladder. DESIGN-IT-TWICE is the two-sketch form for a non-trivial prototype UI or an explicit ask. Never-block applies to reversible work only. Outside the grill, say the alternative in plain words.
- **blast-radius** — what else the change breaks. Prove the one safety fact by running code. `/code-review` runs this before Ready-to-merge.

### `/umbrella-mode` · `/build-verifier` · `/device-qa-verifier`

- **umbrella-mode** — sticky mode on top of `/umbrella` (not a second conductor). Parent keeps grill, phase detect, claim, CURSOR, Founder gates, Close gate, and Status off Desk device. New work is a fresh child. Resume only when checkout, uncommitted edits, or a live process must stay. A thin verifier receipt is respawned once. Phase kids get one `SKILL.md` + named companions via [DELEGATION.md](skills/umbrella/DELEGATION.md). Kids must not read `umbrella/SKILL.md`. Build standing is [BUILD-STANDING.md](skills/umbrella/BUILD-STANDING.md). No poteto-mode install. No Plan Mode front door.
- **build-verifier** — mechanical receipt auditor after implement product lands. Packet includes ticket ACs. Missing AC checklist → automatic FAIL + block close/lane. Light carry check vs grill/spec when pointers are present. Not Device QA. Not `/code-review`.
- **device-qa-verifier** — readonly after Device QA returns. Checklist vs run folder; Fail → one issue; never re-tap the phone. Parent alone advances Project Status off Desk device after verifier Pass.

Packet law and role schemas: [DELEGATION.md](skills/umbrella/DELEGATION.md).

## Credit

Planning spine: [Matt Pocock's skills](https://github.com/mattpocock/skills). Overlay files for that spine start from those skills. `/umbrella` is original to this repo.

Understand and rigor: [Lauren Tan (poteto)](https://github.com/poteto). Skills stack: [pstack](https://github.com/cursor/plugins/tree/main/pstack) in [cursor/plugins](https://github.com/cursor/plugins) (integrated through pstack 0.15.9, 2026-10-03). `/how`, `/why`, `/teach`, the `/principles` index, and `/blast-radius` are adapted from pstack, with house unslop. Later pstack deltas land as thin conventions on `/umbrella`, not as poteto-mode.

This pack is the SSOT — we do not keep a field-notes issue on Matt's repo.

Maintainer notes: [MAINTAINING.md](./MAINTAINING.md).


## Project config

This public pack ships **no product board ids, branch names, npm command names, or machine hosts**.

1. Copy [`project.example.yml`](project.example.yml) to `project.yml` next to this pack, **or** keep the real file in a private overlay repo (recommended) and clone it as a sibling.
2. Skills read `docs/agents/project.yml` in the product repo when present, else `project.yml` in the installed skills root (sync writes both). Resolution rules: [PROJECT-CONFIG.md](skills/umbrella/PROJECT-CONFIG.md).
3. Optional `standing-product-rules.md` (from the private overlay; sync writes it to the same two places) adds product-specific locks by named section (**Grill Context**, **Code-review facts**, **Code-review hard pins**, **Effect domain functions**, **Repeated corrections**, **Boards**, …). Public skills keep the generic form of each rule.
4. `node scripts/sync-workspace.mjs` copies the public overlay, then layers the private overlay from the sibling folder whose `project.yml` sets `workspace.overlay_pack` to its own folder name (or `UMBRELLA_OVERLAY=<folder>`). The public pack never names that repo. `--box` / `--dest <dir>` add more skills roots (see **Install** above).

Role names **Board**, **Dispatch**, and **Chief of Staff** are generic process roles. Bind the founder display name and GitHub Project option ids only in `project.yml`.

## Before pushing

This repo is (or will be) public. Every push runs a local `check:public-safe` gate (no CI minutes): [gitleaks](https://github.com/gitleaks/gitleaks) over the commits being pushed, then a private denylist over every added line, new file path, and commit message in those commits.

One-time setup per clone:

```bash
git config core.hooksPath .githooks
# gitleaks: brew install gitleaks | winget install gitleaks | scoop install gitleaks | release binary on Linux
# The private denylist is found via $PUBLIC_SAFE_DENYLIST, `git config publicsafe.denylist`,
# or a sibling clone carrying public-safe/denylist.txt. Missing denylist = push blocked.
```

Run it by hand (needs Node 18+; works in bash, Git Bash, and PowerShell):

```bash
node scripts/check-public-safe.mjs              # origin default branch..HEAD
node scripts/check-public-safe.mjs --base <ref> # <ref>..HEAD, e.g. a stacked PR
node scripts/check-public-safe.mjs --tree       # whole tracked tree at HEAD (audit)
```

A clean run prints one line, e.g. `check:public-safe PASS <repo>@<sha> (gitleaks 0, denylist 0)`. Paste that line in the PR body.

## License

MIT. See [LICENSE](./LICENSE).

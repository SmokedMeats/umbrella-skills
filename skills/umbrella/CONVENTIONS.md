# Umbrella conventions

Companion to [SKILL.md](SKILL.md). Thin house rules any agent may read: the `/umbrella` conductor, an implement child, a swarm area coordinator (which never loads `umbrella/SKILL.md`). One copy; `SKILL.md` and other skills point here by section name.

## Thin conventions

House rules. Not new skill folders. Not a second conductor. Matt skills stay Matt installs. Read `SKILL.md` from the parent skills directory. Do not copy those bodies here. Missing file → do not invent the body. Swarm and arena are not standing slashes. `/automate-me` stays maintainer-only. Do not add a `typescript-best-practices` overlay.

### Shared full-flow entry

One canonical companion section (this file). No new skill folder. Packs carry reusable full-flow routing and handoff shape only. Product standing rules, discovery adapters, and version pins stay in the product repo.

**Coding entry (standalone umbrella-skills is valid):** If `/start-work` is installed, use it to pick and route work. If it is not installed, enter `/implement` when product discovery, the house crawl, or an explicit ticket Start already cleared readiness. Still obey `/implement` **Acceptance criteria gate**, **House** claim, **Coding-spawn gate**, and live Project Status rules. A missing `/start-work` does not waive those guards. Swarm `/area-coordinator` is optional and is not required for a standalone skills-pack install.

**Pipeline / task boxes:** the configured gate owner ticks with evidence when that gate clears. Do not batch-tick at the end. Do not tick a conditional gate that did not fire. Independent `/build-verifier` is never unilaterally marked N/A by the writer.

**Land gate (pending the product `check:pr-ready` change).** `commands.pr_ready` is that product script. After the product change merges, the script prints `risk: low` or `risk: high` and a pass line naming the head SHA. Do not restate its path list in a skill. A pass line with no `risk:` field is not low. A `risk: low` skip is not a blanket full BV skip.

- **low.** The pass line is on the current head and says `risk: low`. Merge on that line. No `/build-verifier` turn, no `/tech-lead-review` turn, no Dispatch turn.
- **high.** The pass line says `risk: high`, or it has no `risk:` field. Add one independent `/build-verifier` on a different model than the author. Record the model. When the harness cannot pick a model, the receipt says so and this is still the one check. Then merge. `/tech-lead-review` runs only when that diff touches money, auth, or migrations.
- **Dispatch** keeps land order and names hot-file conflicts. It does not GO a PR.
- The head moved: rerun `commands.pr_ready` on the new head and push that recheck with `HUSKY=0`. A high-risk code change after the BV verdict needs a fresh BV ([DELEGATION.md](DELEGATION.md) **Recheck at merge**). Squash SHA need not equal review SHA. Red required CI on a merge commit: revert that land before the next one.
- Never push Preview or `master`. Never merge, Preview fast-forward, migrate, OTA, or master promote unattended. Spend stays a founder gate. A new migration still stops before `commands.db_migrate`, except the in-loop run [BUILD-STANDING.md](BUILD-STANDING.md) **Database migrate** already allows for a new SQL file in this change.

**Pack pull requests.** In this repo run `node scripts/check-pr-ready.mjs` (no root `package.json`). Paste `pr-ready: PASS <sha>` for that head. A dirty working tree or index fails, and so does a HEAD that does not contain origin/main. A docs-only pull request merges on that line. The exact-head build-verifier plus `## Evidence` stand-in is retired.

**New-code positive conformity (when standing-product-rules or Effect seams apply):** read the product's canonical patterns doc when that doc is present, and open one actual closest sibling module in the tree. Resolve the installed `effect` package from the product lockfile. This pack does not hardcode a product Effect major and does not assume an upgrade.

**Capability-limited handoff:** when the runtime cannot move Project Status or Kanban, or cannot delete a merged branch, post a GitHub `CAPABILITY_HANDOFF` receipt (the action, the error or limit, ticket, PR, and branch ids, the desired end state, and the suggested owner). Escalate to the configured **Chief of Staff** role, or the configured parent conductor, then the owner. Do not invent access. Do not ask the user to perform the board or branch action. Do not delete a WIP branch. Do not name private agent ids in pack text. `/start-work` and `/area-coordinator` hold the procedure when those files are present. A missing procedure file does not waive the receipt.

**Required skill missing:** a required owner for a fired row, when that skill is not installed, is BLOCKED or a capability handoff. The writer does not mark that row N/A.

#### Conditional skill trigger table

Symptom, then the existing owner, then the proof. Conditional N/A is valid only when that skill's own skip rule applies, with the reason written down. Do not invent a mandate. A locked small bug stays on its existing path.

| Symptom / need | Owner (existing) | Required proof (or justified N/A) |
| --- | --- | --- |
| Pick / route next coding work; cloud vs local | `/start-work` if that file is installed; otherwise product discovery plus `/implement` readiness. Standalone does not require swarm. | Start outcome line. Coding-spawn gate and live Project Status stay required. |
| Locked grill gaps; house map fog | `/grill-me`, `/grilling`, and `/wayfinder` as already configured | Grill lock or map decisions. |
| Spec and Rule card from a locked grill | `/to-spec` | `RULE_CARD`, `CARRY_FROM_GRILL` |
| Money, entitlements, locking, or 2+ actor races, or a product Statechart standing rule | `/to-spec` **Statechart** (scoped trigger). `/statechart` produces the model. | `STATECHART` path and rules, or `n/a` with the reason the trigger did not fire. Fired trigger with the skill missing is BLOCKED or a capability handoff. |
| Ticket graph and ACs from a spec | `/to-tickets` | Tickets with real AC checkboxes |
| Product code on a coding-eligible ticket | `/implement` **Build loop** and the sections named from `/implement` **Shared full-flow entry** | Living docs. Seam harness. Close gate. Owner lane ticks with evidence. The acceptance-criteria table is the build-verifier row below. |
| Untrusted JSON, webhook, or native bag added or edited | `/implement` **Effect Schema inventory** when that inventory is configured | Inventory row plus the configured command. The skill's own skip applies only when the inventory is not configured, with the reason. |
| Effect or domain seam of the same shape as a sibling | `/implement` **Effect-TS check** and **Backend domain functions** when standing-product-rules are present | Sibling-shape match. Canonical doc read. Closest module read. Installed version read from the lockfile. |
| Diff cleanup before review | `/implement` **Comment cleanup** (`/deslop` on this ticket's diff) | Cleanup done before `/code-review` |
| Standards and Spec review, including blast-radius and cycles when configured | `/code-review` | Two-axis report on this ticket. In-scope findings return to the same-ticket Build loop. |
| The same test or gate fails on two fix attempts | `/implement` **Build loop** **Repeat failure**, then `/diagnosing-bugs` | Escalation receipt. Not a new grill. |
| Independent mechanical verify, when **Land gate** is high or the pass line has no `risk:` field | `/build-verifier`. The writer does not mark this N/A. `risk: low` does not run this row. | PASS / PARTIAL / FAIL table. BV pass on that head. When the land gate calls for `/build-verifier` and the skill is missing, the row is BLOCKED or a capability handoff. |
| Money, auth, or migrations on a high land-gate path | `/tech-lead-review` | TL pass. `risk: low`, or high with none of those three, does not run it. This pack does not add skip reasons. When the land gate requires the review and the skill is missing, the row is BLOCKED or a capability handoff. |
| Phone-visible leftover or Device QA | `/device-qa-agent` and [DEVICE-QA.md](DEVICE-QA.md) | Probe and run receipts when the product configures Device QA. When that skill is required and missing, the row is BLOCKED or a capability handoff. |
| Board or branch action blocked by this runtime | CONVENTIONS **Capability-limited handoff** | `CAPABILITY_HANDOFF` GitHub comment. Procedure files add detail when present. The receipt still posts. |

### Steps

Every phase skill opens with a `## Steps` list: at most 8 numbered lines, each ending in **proof:**, the evidence that step is done. The sections below the list hold the detail. The list holds the order.

1. When a phase starts (yours, or a child's), copy that skill's Steps into your todo list word for word, before any other todo. The parent also copies them into the child packet as `STEPS` ([DELEGATION.md](DELEGATION.md)).
2. A step you do not do stays on the list as `skip: <reason>`. Never delete it.
3. Mark a step done only when its proof exists (a URL, a SHA, a command's pass line, a posted table). The model saying it finished is not proof.
4. The receipt carries `STEPS_DONE`: each step number with its proof or its skip reason. A missing step makes the receipt `partial`.
5. On every phase change, replace the todo list with the new skill's Steps. Reload them after a compaction or a resume.

The Steps never reorder the spine. Phase detection, claim, grill, and the Founder gates stay with the parent.

### DESIGN-IT-TWICE

Only when the user asks, or when `/prototype` is loaded for a non-trivial UI or flow. Write two short competing sketches, then lock one. A trivial stub skips it. Do not require this for every feature. `/implement` uses the same rule when a prototype ticket is in the wave. Screen both sketches with **Agent-shaped design** before the lock.

### Agent-shaped design

When `/codebase-design`, `/improve-codebase-architecture`, or **DESIGN-IT-TWICE** screens a candidate, also reject split ownership (two writers of one state), two ways to do one task, importable internals, and a hand-synced list. Assume the next editor sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Prefer the design where a change that looks right from one file is right for the whole repo. Matt's deep-module words stay in `/codebase-design`. Do not install `/architect` or poteto-mode. The named redirect is **resist-agent-mistakes** in `/principles`. Prefer one deep, lint-guarded abstraction over repeated raw code when it narrows what an agent can get wrong (Matt Pocock / poteto, "be braver, design abstractions", 2026-10-03), if it passes the `/codebase-design` deletion test.

### Repeated corrections

`/correct` is this section. Not a skill folder. Not a second front door. When the operator corrects the same class twice, or says `/correct`: group the class from recent commits, reverts, and review comments. A class counts once it has happened twice. Fix it with **encode-lessons-in-structure** in `/principles`: architecture, then types, then a lint whose error names the fix and that blocks the raw path (an error, not a warning; seam fix per `/pit-of-success`), then a behavior test, docs last. Matt `/retro` feeds this same order (mechanical → lint/CI first; lint > test > skill stays). One commit per class. Prove the check fails on a real past mistake. Run that check the same way locally and in CI. In the repo's existing agent instructions, keep a short table that pairs each rule with what enforces it. If the rule was already there and nothing enforces it, raise the level in the same change. Drop a rule once the mistake cannot happen. Do not add a bot. When standing-product-rules are present: the lint for raw backend `try/catch` and routes or crons that skip the domain function is the `backend/src` try/catch baseline in `check:governance` (PR and baseline named in `standing-product-rules.md` **Repeated corrections**). The mobile `<mobile-pkg>/src/services/*` ceiling lives in that same baseline. Both only ratchet down.

### Measured slowness

When the work is a measured slowdown, a speedup claim, or a choice between options on a number:

1. Read `/how` for the path. Do not claim a ceiling from the source.
2. Try fixes in this order, cheapest first. Stop when an earlier one meets the target: don't do that work; do it, but don't do it again; do it less; do it later; do it when they are not looking; do it concurrently; do it cheaper.
3. Before you trust, report, or act on the number, apply **explain-the-number** in `/principles`. The verdict is faster, slower, no measurable difference, or inconclusive. Inconclusive if you cannot name the limiter, a side ran untuned, or you did not check errors and that the work ran. Say which gap. One primary number in a PR body (`before → after`, with the unit). Runs, range, and limiter evidence go in a linked note, not the body.

Hillclimb and a separate perf playbook are not standing slashes. Do not install `benchmark-checklist` as its own skill.

### Agent cost

"Review, fix, review again" means the spec was loose. Tighten the spec; do not add rounds. The **Rule card** (`/to-spec`) is the build and review SSOT, and its harness runs before handoff. Each fix or review round is a fresh child with a brief near 2 KB ([BUILD-STANDING.md](BUILD-STANDING.md) §10). Do not resume a long child. Each ticket gets two review rounds; a hard finding after round 2 is a grill question. PR bodies stay under 8 KB; the verification receipt stays in the body, review history does not.

### Asks outside the grill

Grill questions stay on the locked Context, Choices, and Recommend shape in `/grilling`. Any other question to the user says the alternative in plain words. Do not offer a one-word token to type back.

### Decision trail

On a long house crawl — multi-ticket, or a **House queue** — keep a decision trail. Default on. Do not wait on the founder to start it. One house at a time still holds. The trail does not hop houses.

- `decisions.tsv` in the house notes (columns `when`, `ticket`, `decision`, `why`), or
- short bullets in `project.yml` `paths.umbrella_cursor`

**Window full** and `/handoff` point at that path. A one-ticket session with no real fork may skip the file.

### figure-it-out

Use only when `/wayfinder` does not fit: no destination to chart, no map shape, off-map rigor. One competing-planner pass: two short plans, pick one, write the choice on the decision trail when a trail is already in use. Then return to this spine. Fog with a destination is still `/wayfinder`. Not a slash. Not a standing front door.

### Comment cleanup

Before `/code-review` closes a ticket, strip narrative and noise comments added in this change. Keep intentional API and docs comments. `/implement` **Build loop** runs that pass. `/code-review` **Standards** flags a leftover as in-scope. Do not spawn a comment-cleanup subagent.

### Recall

Do not add a `/recall` skill. Do not confuse this brief with Matt `/retro` (environment retrospective after `/code-review` or a bug fix). **Window full**, end of session, and the next agent get a resume brief:

- **House queue** (current house first; keep later houses)
- ship mode
- now-on tickets
- decisions trail path
- blockers
- corrections this session: none, or each one encoded as `<lint|test|skill line>`

If `handoff/SKILL.md` exists in the parent skills directory, read it and follow `/handoff`, and include that brief. The brief is still required when `/handoff` is not installed. The brief does not start the next house. **House queue** still decides when that house starts.

### OVERFLOW_LOCAL (local mid-stop)

When this session stops mid-ticket on `<local-dev-host>` (Window full, handoff, Stop, crash, or a cloud park that continues locally), every in-flight ticket gets the `OVERFLOW_LOCAL` receipt (`/implement` **Window full** step 6; canonical wording in `paths.agent_rules` when present), plus the swarm area brief when the area is Active. Keep In Progress + `overflow:local`. During a coding crawl `/implement` owns the ticket comment; the conductor still makes sure it lands before going quiet.

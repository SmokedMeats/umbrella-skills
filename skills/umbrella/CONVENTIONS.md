# Umbrella conventions

Companion to [SKILL.md](SKILL.md). Thin house rules any agent may read: the `/umbrella` conductor, an implement child, a swarm area coordinator (which never loads `umbrella/SKILL.md`). One copy; `SKILL.md` and other skills point here by section name.

## Thin conventions

House rules. Not new skill folders. Not a second conductor. Matt skills stay Matt installs. Read `SKILL.md` from the parent skills directory. Do not copy those bodies here. Missing file → do not invent the body. Swarm and arena are not standing slashes. `/automate-me` stays maintainer-only. Do not add a `typescript-best-practices` overlay.

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

---
name: code-review
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes. Standards: does the code follow this repo's documented coding standards? Spec: does the code match the originating issue, spec, and grill lock? The Spec axis includes blast-radius (prove the one safety fact by running code). Runs both reviews in parallel sub-agents, reports them side by side, then returns in-scope findings to the implement build loop on the same tickets. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to review since X."
---

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

Overlay on [mattpocock/skills](https://github.com/mattpocock/skills) `code-review`. Adds **Close the loop** after the two-axis report.

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings. The review is **not done** at the report — **Close the loop** still runs.

The issue tracker should have been provided to you — run `/setup-matt-pocock-skills` if `docs/agents/issue-tracker.md` is missing.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc.

**Loaded from `/implement`:** do not ask. Fixed point is **this ticket’s first ship SHA** (parent of that commit), or `HEAD~n` covering only this ticket’s commits. Post `## Standards` and `## Spec` **on that ticket**. Then Close the loop on **that** ticket before the next ticket.

If the user invoked `/code-review` alone and did not name a point, ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

**Narrative comments (in scope).** Separate from the smell baseline. A comment added in this diff that narrates what the code does, or noise left from the change, is an in-scope Standards finding. Keep intentional API and docs comments. `/implement` **Comment cleanup** should already have stripped them. A leftover still returns to the build loop. Do not treat it as a judgement-only smell. Do not require a comment-cleanup subagent.

**Pit-of-success check (in scope).** Also separate from the smell baseline. For each changed exported function, hook, setter, component prop, route body, or schema, ask: "If someone makes the obvious call without knowing the hidden helper, does behavior break?" A yes is an in-scope Standards finding, not a comment. Use [pit-of-success](../pit-of-success/SKILL.md) for the test and the fix order. Do not copy that skill into the prompt.

### 4. Cycles probe (when configured)

`<dev-branch>` `verify` does **not** run circular-import checks. `commands.preflight_master` / `commands.preflight_cycles` do (`backend` and `<mobile-pkg>` `check-cycles`, madge). Run the matching package check **before** Standards when the diff touches that tree:

| Diff touches | Command |
| --- | --- |
| `backend/src` | `project.yml` `commands.cycles_backend` |
| `<mobile-pkg>/src` | `project.yml` `commands.cycles_mobile` |

Paste the stdout/stderr into the Standards prompt. Skip this step if neither tree is in the diff, or `commands.cycles_*` are unset in project.yml. Do not invent a cycle from the import list when the check is green. Madge already skips type-only imports.

Also note for Standards (do not invent; just state facts):

- **Product facts** — when `standing-product-rules.md` has a **Code-review facts** section, state each fact it asks for (for example: does the diff add a node-worthy path and is the map fragment in the same diff; which auth-glob files it touches). Skip when the doc is absent.

### 5. Spawn both sub-agents in parallel

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it. Also paste the **Narrative comments** rule and the **Pit-of-success check** from step 3.
- The `check-cycles` output from step 4 (or “not run — no backend/mobile src in this diff”).
- The map / auth-glob notes from step 4.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip lint/tsc/`verify` noise. **Product hard pins** (paste the **Code-review hard pins** section of `standing-product-rules.md` here verbatim when present; cite the rule; skip the row if the note says not in this diff). Typical pins: cycles, architecture-map, thin-router, auth-glob, low-value tests, entitlement helpers, OTA-safe overlays, and domain-function / Effect seams. **Comment cleanup (in scope):** a comment added in this diff that narrates the change or is noise is in-scope, not a judgement-only smell. Keep intentional API and docs comments. Do not require a comment-cleanup subagent. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Also read the kit or grill page the ticket names. If the code disagrees with that locked page, that is a Spec miss even when the ticket bullets are thinner. Do not invent a softer reading of a decided line. Quote the spec or locked-page line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 6. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

### Blast radius (Spec axis)

Before Close the loop, read [blast-radius](../blast-radius/SKILL.md) and follow it on this diff. Put the result under `## Spec` as `### Blast radius`. The one safety fact is proven by running code, or marked **unproven**. A review without that subsection is unfinished.

If that skill cannot be loaded, inline the rule here. Find the one fact the change is safe because of. Prove it by running the real code. Saying so is not proof.

### Adversarial notes (optional annex)

Under `## Spec`, add `### Adversarial notes` when a hostile reading would change the verdict. Three short questions, each answered from the diff or marked unknown. One pass in this session. Do not require a second model or an interrogate product.

Then **Close the loop**. A report without a remaining-AC verdict is an unfinished review. An unproven safety fact that the ship depends on is a Spec miss and returns to `/implement`.

### 7. Close the loop

Findings that are still true in **current code** and still belong to **this ship** go back through `/implement` **Build loop** on the **same** tickets. One seam at a time. Keep those tickets open (or post remaining ACs on them) and keep building.

**Build now** (post as remaining ACs, then load `/implement` in this session)

- Standards **hard violations** (documented-standard breaches, not judgement-only smells)
- Narrative or noise comments added in this diff (keep intentional API and docs comments)
- Pit-of-success check yes: the obvious call on a changed seam breaks behavior. Fix the seam per `/pit-of-success`
- Spec **missing / partial / wrong**

**Skip** (do not ask the user; do not say "judgement" in chat)

- Founder locks and approved grill answers
- Code-shape notes (the smell baseline). They are not a product choice. Leave them off the user summary. If nothing is waiting on the user, say that in one line.
- Findings that already have an open ticket (link that URL; if it is live `umbrella:*`, include it in the loop)

A type error, a warning, or an error in this diff is **Build now**, not a skip and not a leftover. A leftover is only a fact the code cannot see and you cannot invent. The question goes on that ticket in runner language. Read `/simple-english` when that skill is installed.

**Park** only a grill / spec **not this pack** lock — `Later:` per [PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md).

After the implement pass: gap-check, then this skill again on the new commits.

Completion: every in-scope finding is PASS in current code, or **Window full** with remaining ACs on the same tickets.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.

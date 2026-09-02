---
name: code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes — Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents, reports them side by side, then returns in-scope findings to the implement build loop on the same tickets. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".
---

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

### 4. Cycles probe (XyberRun)

Development `verify` does **not** run circular-import checks. `preflight:master` / `preflight:governance:cycles` do (`backend` and `mobile/xyberrun-mobile` `check-cycles`, madge). Run the matching package check **before** Standards when the diff touches that tree:

| Diff touches | Command |
| --- | --- |
| `backend/src` | `cd backend && npm run check-cycles` |
| `mobile/xyberrun-mobile/src` | `cd mobile/xyberrun-mobile && npm run check-cycles` |

Paste the stdout/stderr into the Standards prompt. Skip this step if neither tree is in the diff, or this is not the XyberRun monorepo. Do not invent a cycle from the import list when the check is green. Madge already skips type-only imports.

Also note for Standards (do not invent; just state facts):

- **Map:** whether the diff adds/renames a node-worthy path (`trpc/routers`, `app/api|webhooks|cron`, `screens`, `features/*/presentation|screens`, new write-path schema) **and** whether `XyberRun.IO/map-build/` is in the same diff.
- **Auth glob:** list any touched `LoginScreen`, `OnboardingScreen`, `features/auth/**`, `clerk*OAuth*`, `clerkSession*`, `Clerk*Bridge`, `ClerkTwitterOAuth*`, `OTAUpdateProgressBar`, `trpc.ts`.

### 5. Spawn both sub-agents in parallel

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The `check-cycles` output from step 4 (or “not run — no backend/mobile src in this diff”).
- The map / auth-glob notes from step 4.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip lint/tsc/`verify` noise. **XyberRun hard pins** (cite the rule; skip the row if the note says not in this diff): (1) **Cycles** — non-empty `check-cycles` is hard; do not invent a cycle if the check is green or was not run. (2) **Map** — new/renamed router, screen, service, write path, webhook, cron, or integration with no `map-build` fragment in this change is hard (`architecture-map-maintenance`). Typo/rename of an existing node is label-only, not a new node. (3) **Thin router** — `backend/src/trpc/routers/*` that queries DB or orchestrates instead of Zod + procedure + feature-service call is hard (`trpc-router-auth`). (4) **Auth glob** — those files in the diff on a ticket that is not auth/session/OTA is hard; do not 'fix for consistency'. (5) **Low-value tests** — *new* `*.smoke.test`, `toMatchSnapshot`, `toBeDefined`/module-exists, or `jest.mock` of the module under test / `use*Controller` is hard (`TEST_DELETE_ON_SIGHT`). Skip edits to an existing allowed test. (6) **Tier** — new `subscriptionTier === 'pro'|'plus'` (Founders-blind) in product UI/service is hard; use `hasPlusEntitlement` / `hasProEntitlement` / effective-tier helpers. Skip `subscriptionEntitlements.ts` and tests that assert stored raw. (7) **OTA modal** — new `import { Modal } from 'react-native'` for a product overlay without `OtaAwareModal` / `useOtaUiBusy` is hard. Skip the OTA Restart prompt. **Effect-TS:** flag new hand-narrowed `JSON.parse` / webhook / native dict / untyped `res.json` when a sibling uses `Schema`+`Either`, and new one-off HTTP retry next to walking-way `Effect`+`Schedule`. Do not flag tRPC Zod, Wear Kotlin, or `Effect.gen` for its own sake. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 6. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings — the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes — that's the reranking the separation exists to prevent.

Then **Close the loop**. A report without a remaining-AC verdict is an unfinished review.

### 7. Close the loop

Findings that are still true in **current code** and still belong to **this ship** go back through `/implement` **Build loop** on the **same** tickets. One seam at a time. Keep those tickets open (or post remaining ACs on them) and keep building.

**Build now** (post as remaining ACs, then load `/implement` in this session)

- Standards **hard violations** (documented-standard breaches, not judgement-only smells)
- Spec **missing / partial / wrong**

**Skip**

- Founder locks and approved grill answers
- Judgement-only smells
- Findings that already have an open ticket (link that URL; if it is live `umbrella:*`, include it in the loop)

**Park** only a grill / spec **not this pack** lock — `Later:` per [PARKED-TICKETS.md](../umbrella/PARKED-TICKETS.md).

After the implement pass: gap-check, then this skill again on the new commits.

Completion: every in-scope finding is PASS in current code, or **Window full** with remaining ACs on the same tickets.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.

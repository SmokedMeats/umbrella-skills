---
name: principles
description: "Mid-task redirect index for a named principle. Use when a choice should prove it works, sequence verifiable units, not block on reversible work, encode a lesson in structure, keep boundary or type discipline, stay idempotent, migrate callers then delete, separate shared state, fix the root cause, test behavior, subtract before adding, or guard the context window. Also the rest of this index. Not a conductor. /umbrella stays the only front door."
---

# Principles

One index. Not 23 skill folders. Not a second conductor. `/umbrella` still routes the house.

When a mid-task choice matches a name below, follow that line. If it points at a skill, read that `SKILL.md` and follow it. Name the principle only when it changed a real decision.

House gates still win where they conflict. Reversible work proceeds. Grill lock, Ready-to-merge, Preview / migrate / OTA / master promote, phone Device QA ownership conflicts, and irreversible actions still pause. See `/umbrella` **Founder intervention**.

## Core

- **attack-the-premise.** Two fixes that share one premise have failed the same gate. Census who holds the imbalance, then question the premise. Grill that fork with `/grilling` instead of writing a third patch.
- **build-the-lever.** Non-trivial work gets the smallest script, codemod, or check a reviewer can rerun. `/blast-radius` proves its one fact this way. Do not build a framework.
- **encode-lessons-in-structure.** The second time you write the same instruction, put it in a lint, a test, a schema row, or a living doc. `/implement` **Living docs** and the Effect Schema inventory are the house form.
- **exhaust-the-design-space.** A novel interaction or architecture with no precedent gets two or three real alternatives before you commit. `/wayfinder` charts them. `/prototype` (Matt) makes a cheap one to react to.
- **experience-first.** Product and UX tradeoffs pick the person's outcome over implementation convenience. Settle it in `/grill-me`, not in the builder's convenience.
- **foundational-thinking.** Before logic, name the core types and what concurrent actors share. `/to-spec` seams and `/domain-modeling` (Matt) are the house form.
- **laziness-protocol.** Prefer deletion and the smallest change that solves the problem. Pair with **subtract-before-you-add**.
- **minimize-reader-load.** Collapse one-caller wrappers and shrink hidden state a reader must hold. `/code-review` smell baseline flags the shape. It does not by itself reopen a locked product decision.
- **outcome-oriented-execution.** Planned rewrites converge on the target. Do not keep throwaway compatibility as the design. Temporary breakage is allowed only inside a sequenced unit you can verify.
- **redesign-from-first-principles.** A new requirement integrated into an old design is redesigned as if it had been there from day one. `/wayfinder` when the route is fog. Do not bolt the requirement onto a shape that cannot hold it.
- **subtract-before-you-add.** Remove dead weight before adding or rewriting. Architecture debt, when asked or when the build loop is idle and that work is in scope: Matt `/improve-codebase-architecture`. Read `/zero-tech-debt` or `/pit-of-success` only when that skill is installed. Do not invent them.

## Architecture

- **boundary-discipline.** Validate at the boundary. Trust internal types. Keep business logic pure. Untrusted bags are Effect `Schema` / `Either` seams in `/to-spec` and `/implement`, not a second parser style.
- **make-operations-idempotent.** Commands, lifecycle steps, and retries converge to the same end state. Re-running migrate, sync, or a create must be safe.
- **migrate-callers-then-delete-legacy-apis.** Move callers, then delete the old API in that wave. `/to-tickets` expand–contract is the wide form. Do not leave two ways. Do not delete before the callers move.
- **model-the-domain.** Encode repeated rules in a structure (state machine, typed model, table, reducer), not scattered conditionals. `/domain-modeling` (Matt) with `/grilling`.
- **separate-before-serializing-shared-state.** If two actors might write the same file, branch, key, or object, remove the sharing first. `/implement` frozen-shared and the conductor are the house form. Do not add a lock as a substitute for two writers.
- **type-system-discipline.** Illegal states should not compile. Brand primitives. Parse external data at the boundary. Exhaustive `switch` on unions. No cast to silence a bag that should be a schema.

## Verification

- **fix-root-causes.** Trace the symptom to the cause. Reproduce first. A hard or flaky bug goes to `/diagnosing-bugs` (Matt), then `/implement`. Do not patch the symptom and call it done.
- **prove-it-works.** Before done, check the real artifact. "It compiles" is not proof. `/tdd` (Matt), the `/implement` seam test, and `/blast-radius` (run the one safety fact).
- **sequence-verifiable-units.** Multi-step work is small units that each end in a check. Verify one before the next. `/to-tickets` tracer bullets and `/implement` crawl are the house form.
- **test-behavior-not-implementation.** Call the code the way its users do. Assert the result. If the test would pass when every import returned nothing, rewrite or delete it. `/tdd` and `/to-spec` Testing Decisions. `/implement` refuses smoke, snapshot, and "mock was called" fillers.

## Delegation

- **guard-the-context-window.** Large outputs, long files, and fan-out stay out of the main thread. Subagents return summaries. `/implement` **Window full** is the house stop when the window is actually full.
- **never-block-on-the-human.** On reversible work, do it and show the result. Ask only for a real preference, authority, or an irreversible act. Founder gates in `/umbrella` still pause. This principle does not skip grill lock, Ready-to-merge, promote, Device QA ownership conflicts, or data deletion.

---
name: how
description: "Explain how a subsystem works: architecture, runtime flow, ownership, and layering. Use for \"how does X work\", a walkthrough before changing code, or \"where should this live\" / \"which package owns this\" / \"is this the right layer\". Use why for motivation. Use teach when the person wants how and why woven into one explanation."
---

# How

Explore the codebase to answer "how does X work?" Produce an architectural explanation at the level of a senior engineer onboarding onto a subsystem. Enough to build a working mental model. Not annotated source.

This skill runs in Cursor and in Grok Bot. When the harness can spawn read-only explorers, use them for a complex question. When it cannot, do the same reads in this session. Do not require a named model, a Task tool, or a loop harness.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (one module, a small utility, a narrow question such as "how does function X work"): one pass. Go to step 2.
- **Complex** (a subsystem across files or services, a cross-cutting feature, a full architectural overview): split into 2 to 4 angles, explore them, then synthesize. Go to step 3.

When in doubt, take the simple path.

## 2. Direct explain

Read the code. Trace the runtime path from the entry the question names to the state it changes. Then write the explanation in the output format below.

## 3. Explore, then synthesize

Decompose the question into 2 to 4 angles. Each angle is a distinct slice (entry path, state, callers, failure path). Explore every angle before writing.

Each angle answers:

- What the slice is responsible for
- The runtime sequence, with file paths and symbol names
- Who calls it and what it calls
- Invariants and failure behavior
- Open questions for the synthesizer

Then write one explanation. Do not paste the angle notes as the answer.

## 4. Present

Lead with the explanation. Light edits for conversation context are fine. Do not turn it into a file-by-file tour.

## Output format

Drop any section that does not apply.

- **Overview.** What it is and the job it does, in a few sentences.
- **Key concepts.** Names a newcomer must hold, each in one or two sentences.
- **How it works.** The runtime sequence. Concrete paths and symbols. Not a restatement of every branch.
- **Where things live.** Packages, modules, and the layer that should own a change like this.
- **Gotchas.** Invariants, ordering, and the mistake a newcomer will make.

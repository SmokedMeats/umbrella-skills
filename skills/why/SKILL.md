---
name: why
description: "Explain why code is shaped this way, from evidence. Use for \"why does X work this way\", \"why we picked Y\", design rationale, regressions, postmortems, or data-backed thresholds. Default narrow: git history and pull requests, plus only the evidence categories the question needs (issues, docs, chat, observability, errors, analytics). Use how for runtime behavior. Use teach to weave how and why into one explanation."
---

# Why

Investigate the motivation and intent behind code.

Companion to `how`. `how` answers what the code does. `why` answers what forces led to its shape.

Works in Cursor and in Grok Bot. Git and `gh` are always available. Other evidence categories are used only when this session actually has a tool for them (MCP, issue tracker, docs, chat, dashboards). Do not require a Cursor `mcps/` directory, a named model, or a mode that strips tools. Investigators may read. They do not write product code.

## Operating posture

Be careful about what you know and what you are inferring.

- **Observed.** You read the line, the commit, the PR, the ticket, or the tool output. Cite it.
- **Inferred.** A reasonable reading of that evidence. Say it is a reading.
- **Unknown.** Not in the sources you checked. Say that. Do not fill the hole.

Do not upgrade an inference to an observation. Do not invent a PR, a ticket, or a metric. A search that finds nothing is a finding. Record it.

## 1. Understand the question

The **target** is a chunk of code, a pattern, a feature, or a named decision. The **question** is rationale, a tradeoff, an edge case, an external constraint, dead code, or a history sweep.

If the target is vague, take the best guess from the conversation (open files, recent edits, what was just discussed). State that guess in one line, then proceed.

## 2. Anchor in code

Before any wider search, collect:

- File paths and line ranges
- Key symbols
- The last commits that touched the target (`git blame`, `git log --follow`, `git log --oneline`)
- PR numbers from merge subjects (`(#1234)`) and, for substantive commits, `gh pr view`

Pass that anchor to every source you open.

## 3. Evidence, default narrow

**Default is narrow.** Always search source control (git and `gh`). Add another category only when the question needs what that category uniquely holds. A full sweep of every category is for a history or postmortem question, or when the caller (including `/teach`) explicitly widens the ask. Say which categories you skipped and why.

| Category | Use it when | Examples of tools |
| --- | --- | --- |
| Source control | Always | git, `gh` |
| Issue tracker | The force is a product or business request | GitHub issues, Linear, Jira |
| Long-form docs | The rationale was written before the code | `CONTEXT.md`, ADRs, Notion, docs |
| Team chat | The paper trail is thin and a decision was argued live | Slack and similar, if a tool exists |
| Observability | The code reacts to timeouts, retries, rate limits, saturation | Datadog, Grafana, and similar, if a tool exists |
| Error tracking | Defensive code (null guards, catch, retries, flags) | Sentry and similar, if a tool exists |
| Product analytics | A number, a flag, an experiment, or a migration threshold | Warehouse tools, if a tool exists |

Skip a category for only two reasons, both written in Sources Consulted:

- No tool for it in this session. That is a gap, not a choice.
- The source is provably irrelevant (a build-time script has no runtime error tracker). "Probably irrelevant" is not enough.

If the PR body already answers a one-commit question, you may answer inline after saying the wider categories would be redundant. That case is rare.

When several categories are in scope and the harness can run them concurrently, do that. Do not pretend a missing tool was searched.

Defensive code (null checks, retries, timeouts, rate limits, feature flags, egress guards) also gets the incident question: what broke, and which guard exists because of it.

## 4. Synthesize

Write the answer yourself from the evidence. Spot-check citations against the commit, the PR, or the tool output you actually retrieved.

## 5. Present

Light edits for clarity are fine. Do not rewrite the confidence language into something smoother than the evidence.

## Output format

- **The question.**
- **The code in question.** Paths, symbols, commits.
- **What we found.** Observed facts, each cited.
- **What we can reasonably infer.** Labeled as inference.
- **Competing hypotheses.** Only when more than one reading survives.
- **What we don't know.**
- **Sources consulted.** One line per category you considered, including empty results and skips with the reason.
- **Confidence.** One line: what is observed, what is inferred, what is open.

If this `why` is a precursor to changing the code, add a short constraint set: **Preserve / Change / Avoid / Risk**.

## Failure to avoid

Recency bias. The newest commit is often accretion. Trace back far enough to see the decision that set the shape.

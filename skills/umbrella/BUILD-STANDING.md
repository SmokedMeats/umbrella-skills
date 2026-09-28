# Build standing law

`/implement` and `/code-review` follow this on every house. Chat to the user is what a runner sees on a run. A ticket comment may name files.

This file is the **authoritative** Build standing companion. Kids load it as a named companion — they must **not** load `umbrella/SKILL.md`. Packet / role-packet details live in the sibling [DELEGATION.md](DELEGATION.md).

**The locked page wins.** The gap check and the Spec review read the kit or grill page the ticket names, not only the ticket bullets. If the code disagrees with that page, the check fails and the build loop continues. Do not invent a softer reading of a line that is already decided.

**Finish what you can.** Type errors, warnings, and errors hit while building are fixed in this change. Summarize them at the end of the user reply in plain language. Do not leave them as a leftover.

**Database migrate.** When this change adds a new `backend/drizzle/0xxx_*.sql`, run `npm run db:migrate:all` from `backend/` in that same session, after the file is on disk. Do not run it before the file exists. Do not edit a migration that has already been applied. Do not run it again when no new file was added. A missed migrate is not a leftover.

**A leftover is only an unknown.** File one when the code cannot see a fact and you cannot invent the store, the clock, or the amount. If you can finish it without the user, finish it. Do not file a leftover for a decision already written, or for a typecheck, a lint, or a warning. Any question that leftover still needs is written on that ticket in runner language. Filing it is inside the loop. Same session, crawl the next unblocked ticket. Do not end the turn on the leftover.

**A half-done card stays in progress.** "Keep going" does not move a partial ticket to Desk device or any leftover lane. The parent ticket says which part is the phone and which part is the leftover.

**Words.** Do not say "judgement" to the user. A code-shape note is not a product choice. If nothing is waiting on the user, say that in one line. Leave those notes off the chat summary. User-facing copy, grill leftover questions, ship notes, and Device QA wait comments are runner language: read `/simple-english` when that skill is installed. If the user says the reply is unclear or too jargony, read `/wait-what`. Do not reimplement those skills.

**Subagents (umbrella-mode tighten).** Parent remains the only front door and conductor. Phase and specialized work may run as Task / bot children with a **context packet in** and **receipt out** — see [DELEGATION.md](DELEGATION.md) for packet shapes and role extras.

1. **Kids must NOT load full umbrella.** Child prompts name `SKILL_PATH` for **one** phase skill (+ that skill’s normal companions, including this file when the role is implement or code-review). Never paste or instruct the child to read `umbrella/SKILL.md`. Child must not re-run phase detect, rewrite House queue, Claim, or Ship mode.
2. **Implement wave (unchanged shape).** Two or more unblocked tickets → spawn one implement subagent per **extra** ticket before the conductor writes product code. Conductor does not write those extras. Shared files + git stay with the conductor. Blocked tickets stay out of the wave.
3. **Phase delegates (optional under mode).** After `Next: /<skill>` for wayfinder, to-spec, to-tickets, how/why research, etc.: write UMBRELLA_CURSOR, build the packet ([DELEGATION.md](DELEGATION.md)), spawn child, verify receipts, then parent re-detects. **Grill-me stays parent** (never a child).
4. **build-verifier.** After implement product lands on a ticket, before close or leftover-lane: inline receipt **or** separate readonly Task/bot. Mechanical Build-loop receipts only. **Not** Device QA. **Not** `/code-review`.
5. **code-review.** Own judgment kid (Standards + Spec incl. blast-radius). Do not merge into either verifier. In-scope findings re-enter `/implement` on the same tickets.
6. **device-qa-agent.** Specialized loop only after **parent** Probe PASS ([DEVICE-QA.md](DEVICE-QA.md)). Child proposes `STATUS_MOVES` unapplied. Never cloud.
7. **device-qa-verifier.** Readonly after device-qa returns. Checklist vs run folder; Fail→one issue; Skipped blocked; Return evidence; no `src/` edits. **Never re-tap the phone.**
8. **Status off Desk device.** Parent alone advances Project Status off **Desk device**, and **only after device-qa-verifier Pass** (or explicit CoS skip-verify for that run). Default verify-on. Do not advance from chat memory without RUN_FOLDER receipts.
9. **Close / lane.** Parent/conductor closes or sets leftover lane only when **build-verifier** Pass **and** the Build loop’s `/code-review` findings are empty, **and** the **Close gate** line for that ticket is complete in `docs/agents/UMBRELLA_CURSOR.md` ([CURSOR.md](CURSOR.md)).

Nesting: phase child may spawn explore/bash; it must not spawn another umbrella conductor. device-qa must not spawn device-qa-verifier (parent does). One build-verifier truth per ticket return.

**Dependencies.** If a ticket waits on another, set the GitHub blocked-by link in that same session. Do not leave the wait only in the body. Do not pull it while the blocker is open, unless that blocker is on a leftover lane. Ready to merge still holds dependents. A later production switch stays on **GoLive**. Do not park it to keep the build from pulling it.

**Lanes when a Build loop empties.** Set that ticket’s Project Status from what is actually left ([PROJECTS.md](PROJECTS.md)): **Operator**, **Desk device**, **Field**, **Ready to merge**, **Live Beta**, **GoLive**, or **Done**. Before setting a terminal or leftover lane from an emptied Build loop, require a **build-verifier** Pass (inline or Task) for that ticket. `/code-review` in-scope findings still mean the loop is not empty. Phone-visible leftover still follows [DEVICE-QA.md](DEVICE-QA.md); Desk-device advance after a crawl follows Subagents §8 (verifier Pass), not the device-qa child’s own Project write. Ready to merge is one of those lanes. A production switch is GoLive. A desk check stays Desk device, and moves to GoLive when that check is done if the switch is still off. The lane and the labels must agree. Leftover lanes do not hold the next coding wave. **Ready to merge** holds dependents until Jacob merges. Phone-visible work this pass cannot run (`adb devices` is not exactly one, this runner cannot see USB, or another actor owns the phone) stays **Desk device** ([DEVICE-QA.md](DEVICE-QA.md)). Then crawl the next unblocked coding ticket. At the end of the house, walk every open ticket and correct any lane that still disagrees.

**Merge prompt.** Ship mode PR, after that lane walk: run the **soft-queue overlap** check first. Compare Ready-to-merge pull requests in this house with each other and with any Ready-to-merge pull request still open from an earlier house in this run. If two diffs share a path, name those paths in the merge message. Do not merge, rebase, or resolve that overlap until Jacob says so in that turn. The check does not hold the next house's coding crawl. Then one message lists every Ready-to-merge pull request in the house and asks to merge them. Several pull requests go in that one message. Do not merge until the user says so in that turn. A **House queue** with a next house does not wait on that answer.

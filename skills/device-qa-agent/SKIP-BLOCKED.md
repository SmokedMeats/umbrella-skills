# Skip blocked leaves

After a **Fail** and its disposition (ticket back to In Progress, or one new issue), or when a required precondition is already absent, mark every later open `Owner: manual agent` leaf whose Do cannot be done honestly. Continue at the next **independent** leaf.

Completion: every later open agent leaf that names the missing result is marked Skip, listed under **Skipped (blocked)** in `REPORT.md` and the chat summary, before the next independent Do starts.

## Mark

Leave `[ ]`. Keep the Owner tag. Append exactly one:

- After a Fail: ` **Skip YYYY-MM-DD agent: blocked by P… (#ticket-or-issue).**`
- Precondition absent, no Fail (no extra issue): ` **Skip YYYY-MM-DD agent: <missing precondition> (P… empty).**`

Each **Skipped (blocked)** row: leaf id, blocked-by leaf, issue URL (or the precondition note).

A prior Skip stays `[ ]`. This run: if the precondition is now present, do the leaf; if still absent, keep Skip and continue.

## Infer

Read the later leaf's title + Do. Skip when that text names a thing the failed (or missing) leaf was supposed to produce: "that goal", "the item you just saved", "while recording", "from that card", "after the toggle is ON", "still attached".

Do a later leaf that stands on its own.

## Examples (teach infer; not a matrix)

| Missing / Fail | Skip | Still do |
| --- | --- | --- |
| Create-a-goal leaf failed | That goal's detail leaf | A different goal type |
| Today card empty | Start / complete from that card | Week strip, streak |
| Attach failed | Reopen / replace / clear that attachment | Later independent clusters |
| Offline mode failed | Offline save / retry | Later clusters |

Product-specific examples, when any: `PRODUCT.md` next to SKILL.md.

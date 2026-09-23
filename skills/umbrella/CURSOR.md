# Umbrella cursor (write protocol)

**Repo file (commit with the work):** `docs/agents/UMBRELLA_CURSOR.md`  
**Agent rule (synced to every IDE):** `docs/engineering/agent-rules/umbrella-cursor.md` → `npm run sync:agent-rules`

This is the **step** pointer. GitHub labels still win for **phase**.

## Fields

| Field | What |
| --- | --- |
| **House** | Current `umbrella:<slug>` |
| **House queue** | Ordered slugs for this run, current house first. One slug means one house. No auto-hop. |
| **Ship mode** | `Development` or `PR`. Sticky for the whole run, including every house in the queue |
| **Phase** | Step label. GitHub labels win when this is stale |
| **Ticket** / **Now on** | Live ticket numbers, or Qs on hold |
| **Step** / **Next** | Current skill and why |

**House queue** is a short ordered list:

```text
House: umbrella:refunds
House queue:
1. umbrella:refunds
2. umbrella:dunning
```

The head is the current house. A later issue from a house already listed does not add a second slot.

## Read

After `/umbrella` prerequisite (or any session start in XyberRun):

1. If `docs/agents/UMBRELLA_CURSOR.md` exists, read it.
2. Still run the `/triage` catch.
3. If the file names a house and the user did not name a different one, **resume that house** — do not wait on the full picker. Keep **House queue**. If this house's coding crawl is already done and the queue has a next house, start that house.
4. The user names one house only → set **House** to that slug and replace **House queue** with that slug only. No auto-hop.
5. The user names an ordered list that maps to more than one `umbrella:*`, or says to work through these → replace **House queue** with that house order. Start the first house.
6. If the file’s phase disagrees with live labels, trust GitHub and rewrite the file. Keep **Ship mode** and **House queue**.

No file → idle. Run `/umbrella` as usual.

## Write (automatic — not a human ritual)

Overwrite the file when any of these happen. Same change as the work when you are already committing. Every rewrite keeps **Ship mode** and **House queue** unless the event below changes the queue.

| Event | What to put in **Step** / **Next** |
| --- | --- |
| User names several houses, or says work through these | **House queue** in that order. **House** is the first slug |
| User names one house | **House** is that slug. **House queue** is that slug only |
| House claimed / grill starts | Skill + live ticket numbers |
| Each grill round (before you wait) | `Now on` ticket · Q numbers asked · settled in one short list |
| Grill held (user reading) | Which Qs are on hold and why |
| `Next: /<skill>` | That skill and why |
| `/to-spec` published | Spec issue number |
| `/to-tickets` published | Wave ticket numbers |
| `/implement` claim | Conductor + child tickets · exclusive files |
| This house's coding crawl is done, and the queue has a next house | Drop the finished slug. **House** is the new head. **Next** is that house's skill. Do not clear **Ship mode** |
| Ticket close / Window full | Remaining tickets on **this** house, or the next queued house if this house's coding crawl is done. `idle` only when the queue has no next house and nothing is in flight |
| Long unattended implement | Optional decision note, or a pointer at `decisions.tsv` |

Keep it short. No chat dump. No secrets.

**Ship mode (sticky + actor force).** On first write this run, set **Ship mode** to `Development` or `PR` per actor force: Grok Bot / Cursor cloud -> always PR; local Grok Build / Cursor IDE on AlphaTerminal -> always Development. Every later skill, and every later house in **House queue**, reads that pin -- do not re-pick. If the file pin disagrees with the actor, correct it and note the correction.

## Idle

When the current house Hits, or the user stops with nothing in flight, **and House queue has no next house**, set **Phase** to `idle` and clear **Ticket** / **Step**. Leave the file in git so the next session still finds the path.

A queue that still has a next house is not idle. Start that house.

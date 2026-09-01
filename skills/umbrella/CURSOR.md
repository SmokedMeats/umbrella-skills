# Umbrella cursor (write protocol)

**Repo file (commit with the work):** `docs/agents/UMBRELLA_CURSOR.md`  
**Agent rule (synced to every IDE):** `docs/engineering/agent-rules/umbrella-cursor.md` → `npm run sync:agent-rules`

This is the **step** pointer. GitHub labels still win for **phase**.

## Read

After `/umbrella` prerequisite (or any session start in XyberRun):

1. If `docs/agents/UMBRELLA_CURSOR.md` exists, read it.
2. Still run the `/triage` catch.
3. If the file names a house and the user did not name a different one, **resume that house** — do not wait on the full picker.
4. If the file’s phase disagrees with live labels, trust GitHub and rewrite the file.

No file → idle. Run `/umbrella` as usual.

## Write (automatic — not a human ritual)

Overwrite the file when any of these happen. Same change as the work when you are already committing.

| Event | What to put in **Step** / **Next** |
| --- | --- |
| House claimed / grill starts | Skill + live ticket numbers |
| Each grill round (before you wait) | `Now on` ticket · Q numbers asked · settled in one short list |
| Grill held (user reading) | Which Qs are on hold and why |
| `Next: /<skill>` | That skill and why |
| `/to-spec` published | Spec issue number |
| `/to-tickets` published | Wave ticket numbers |
| `/implement` claim | Conductor + child tickets · exclusive files |
| Ticket close / Window full | Remaining tickets or `idle` if the house Hit |

Keep it short. No chat dump. No secrets.

## Idle

When the house Hits or the user stops with nothing in flight, set **Phase** to `idle` and clear **Ticket** / **Step**. Leave the file in git so the next session still finds the path.

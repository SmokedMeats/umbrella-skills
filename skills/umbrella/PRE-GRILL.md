# Pre-grill

Companion to [SKILL.md](SKILL.md). Read by the `/umbrella` conductor and by a swarm area coordinator preparing a gap list for the parent's grill.

## Gap list before `/grill-me`

Before `/grill-me`, this pass is mandatory. Do not open the interview without it.

1. Review the docs that bear on this house: `GLOSSARY.md`, ADRs, living docs the map names, related tickets, and prior locks.
2. Write an explicit gap list. One line per gap: source, what is missing, status `open`.
3. Open `/grill-me` with that list. Every gap is in the design tree.
4. Address every gap before lock: **answered**, **deferred** (owner + ticket), or **cut** (reason). No lock while any gap is open or vague (`later`, `TBD`, no owner).

Record the list on the map or the live grilling ticket, and in `project.yml` `paths.umbrella_cursor` ([CURSOR.md](CURSOR.md)).

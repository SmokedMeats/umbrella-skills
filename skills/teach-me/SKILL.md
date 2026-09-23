---
name: teach-me
description: "Multi-session learning workspace for a skill or concept the user wants to learn over time. Use when they want a course, lessons, a mission, or to pick up learning next session. Former Matt /teach. Owns MISSION.md, RESOURCES.md, lessons, and learning records. Do not use for explaining a codebase, a diff, or a subsystem. That is /teach."
---

# Teach me

Former Matt `/teach` is this skill. The name is `/teach-me` so it does not collide with `/teach`.

| Ask | Skill |
| --- | --- |
| Explain this code, this change, or how a subsystem works | `/teach` (and `/how` / `/why`) |
| Learn a topic over multiple sessions, with lessons | `/teach-me` |

## Workspace

The current directory is the learning workspace. State lives in files. The next session resumes from those files, not from chat memory.

One mission per directory. Keep the workspace out of the product repo. A dedicated folder or repo is the home.

| Path | Holds |
| --- | --- |
| `MISSION.md` | Why they are learning. Everything else hangs off it. |
| `RESOURCES.md` | Sources you fetched and trust. Knowledge, then communities. |
| `lessons/NNNN-*.html` | One self-contained HTML lesson. The unit of teaching. |
| `learning-records/NNNN-*.md` | What they have demonstrated. Decides the next lesson. |
| `reference/*.html` | Cheat sheets they return to. |
| `assets/*` | Shared stylesheet and reusable bits. |
| `NOTES.md` | Preferences they stated. |

`MISSION.md` shape:

```markdown
# Mission: {Topic}

## Why
{Concrete outcome. What changes in their work when they have this.}

## Success looks like
- {Observable thing they can do}

## Constraints
- {Time, prior knowledge, preferences}

## Out of scope
- {Adjacent topics they do not want right now}
```

If Why is abstract ("understand X"), interview until the outcome is concrete. Confirm with them before you change an existing mission. When the mission moves, update the file and add a learning record.

## Session

1. Read the workspace files. Missing or vague `MISSION.md` means the interview is the whole first session. Do not write a lesson yet.
2. If `RESOURCES.md` is empty or the next lesson needs a source you have not recorded, find sources and cite them. Do not teach a lesson from memory alone.
3. Teach one tight lesson tied to the mission, just past what the learning records already show. Save it under `lessons/`. Write a learning record for what they showed they can do.
4. Stop after that lesson unless they ask for another in the same sitting.

A later session starts at step 1 again.

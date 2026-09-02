# Parked tickets (Later / Leftover)

SSOT for any skill that **creates** or **pulls** a parked issue under `/umbrella`.

Parked work stays in the pack. It must **not** wear the live house label. That is how it stays out of grill, spec, tickets, and implement.

## Live vs parked

| | Live | Parked |
| --- | --- | --- |
| Label | `umbrella:<slug>` | `parked:<slug>` (same slug) |
| Title | normal / implement | `Later: …` or `Leftover: …` |
| `ready-for-agent` | yes when it is a build ticket | **never** |
| Assignee | `@me` when this session pulls it | **none** until unpark |
| `/grill-me` / `/implement` / phase | in | **out** |

Do **not** create `umbrella:<slug>-parked`. That would be a second house and would steal the picker.

```text
gh label create "parked:<slug>" --color "6A737D" --description "Parked: <plain name> (not live umbrella:<slug>)"
```

A **reject forever** is `.out-of-scope/` + close (`wontfix`). A parked ticket stays **open**.

## Which title

| Title | When |
| --- | --- |
| `Later: …` | Product we **chose not to ship** with the rest of this pack (grill or spec). Still wanted someday. |
| `Leftover: …` | Already-open parked hygiene titles. Remainder that still belongs to this ship stays on the live tickets and the `/implement` **Build loop**. |

Keep `enhancement` + `domain:*` + **`parked:<slug>`**. Child of the same `wayfinder:map`. **Remove** `umbrella:<slug>` if it was copied from the house. Do not reopen a closed implement ticket to flip checkboxes.

## After every create

If the new issue is `Later:` or `Leftover:` (or the body says shelved / parked / not this pack):

1. `--add-label "parked:<slug>"` — create the label if missing.
2. `--remove-label "umbrella:<slug>"` if present.
3. Do not `--add-assignee`.
4. Assign the **same house milestone** as the live pack (`gh issue edit <n> --milestone "<Pack name>"`). Create the milestone if the house has none. Do not invent a `Parked:` milestone.
5. `item-add` to the XyberRun Project. Status **Parked** if code/grill is still needed. If the leftover is already console / desk / a run, use **Operator** / **Desk device** / **Field** and keep `parked:*`. See [PROJECTS.md](PROJECTS.md).
6. Body **must** include **When to do this** with all four lines.

```markdown
## When to do this

**Status:** Shelved. Open on purpose. Not `ready-for-agent`. Wears `parked:<slug>`, not live `umbrella:<slug>`.

**Why it was shelved:**
- **When:** grill / spec / `/code-review` / wave that shipped the rest (name the ticket + date if you have it).
- **What the rest did:** the slice that *did* ship (one line).
- **Why this was not in that ship:** the real reason — no shell yet, honesty already shipped, copies are process boundaries, hardware does not write samples, privacy is a different grill. Not “later” and not “nice to have.”

**Unpark when:** concrete gates (all / any). A person can tell done-waiting from still-waiting.

**Do not unpark because:** the request that must not reopen the grill or start a drive-by refactor.
```

Completion: a stranger can read only **When to do this** and know why it missed the rest of the pack and what event makes it live. `gh issue list --label umbrella:<slug>` does **not** return it.

## Unpark (only when the user says so)

Do not unpark because `/umbrella` listed the house or because two parked tickets share a slug.

1. Confirm the **Unpark when** gates hold.
2. `--remove-label "parked:<slug>"`
3. `--add-label "umbrella:<slug>"`
4. Add `ready-for-agent` only if this is now a build ticket.
5. Then claim: `gh issue edit <n> --add-assignee "@me"`

## Close (drop the shelf label)

`parked:*` means **open leftover, do not pull**. A closed ticket must not wear it — the Parked view is `label:parked:*` and would keep showing finished cards.

On close (same moment as Status **Done**):

1. `--remove-label "parked:<slug>"` if present.
2. `--remove-label ready-for-agent` if present.
3. Keep the milestone. Do **not** add `umbrella:<slug>` just because it shipped.
4. Project Status **Done**. Do **not** archive that card yet.
5. Then [CLOSE-PARENTS.md](CLOSE-PARENTS.md) (child first). Then [PROJECTS.md](PROJECTS.md) **Archive Done**.

Closing is not unpark. Unpark is only for an **open** ticket the user asked to pull. Device QA wait is **Desk device**, not this Close — [DEVICE-QA.md](DEVICE-QA.md).

## Create sites

| Skill | After it files… |
| --- | --- |
| `/wayfinder` | Wanted past this destination → `Later:` + `parked:<slug>` |
| `/grilling` | “Not this pack” branch → `Later:` + `parked:<slug>`, then close the grill with the v1 answer |
| `/to-spec` | Out of Scope that is later work → `Later:` + `parked:<slug>`, not a spec-only bullet |
| `/to-tickets` | Parked slice → `Later:` + `parked:<slug>`, no `ready-for-agent` |
| `/code-review` | In-scope findings stay on the live tickets and re-enter `/implement` **Build loop**. `Later:` only when the finding is already a grill / spec not-this-pack lock. |
| `/implement` | Remaining ACs stay on the same ticket. Next pass of the **Build loop**. Window full writes them on the spec conductor comment. |

`/triage` house-name and “2+ like types” **ignore** `parked:*` and `Later:` / `Leftover:` titles. Two parked tickets do not create a live umbrella.

`/umbrella` checks this whenever it returns from those skills. Missing block or still wearing live `umbrella:*` → fix it; do not name the next phase yet.

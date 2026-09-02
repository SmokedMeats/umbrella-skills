# Project board (Kanban + Roadmap)

SSOT for the GitHub Project that sits **on top of** issues + milestones. Labels still name the house. Milestones still pack the Issues sidebar. The Project is the Kanban and the date roadmap — not a second house system.

**Do not** create a Project per house. One board for the monorepo.

## The board

| | |
| --- | --- |
| Owner | `SmokedMeats` (user, not an org) |
| Title | XyberRun |
| Number | **1** |
| URL | `https://github.com/users/SmokedMeats/projects/1` |
| Linked repo | `SmokedMeats/XyberRun` |

`gh` needs `project` + `read:project`. If `gh project list` 403s: `gh auth refresh --hostname github.com -s project -s read:project`.

**Do not** create another Project. **Do not** recreate these views — they already exist on #1.

## Views (do not invent more)

| View | Layout | Filter / group | Job |
| --- | --- | --- | --- |
| **Kanban** | board | Status columns. Hide locked: `-label:locked` | Live + parked left-to-right |
| **Roadmap** | roadmap | Same live filter. Uses Start / Target date | Calendar only when a date is set — do not invent dates |
| **Houses** | table | Group by **Milestone** | Pack timeline without fake due dates. GraphQL cannot set group-by — founder one-click: **Group → Milestone** |
| **Now** | table | `assignee:@me OR label:ready-for-agent -label:parked:* -label:locked` | What this session can pull |
| **Grill** | table | `label:wayfinder:grilling -label:parked:*` | HITL queue |
| **Parked** | table | `label:parked:* is:open` | Open shelf only. Status may be Parked or a leftover column |

Status columns (do not add more): **Parked** → **Unclaimed** → **In Progress** → **Operator** → **Desk device** → **Field** → **Done**. Locked stays a label (Kanban hides `locked`).

**Now** is a **view** (assignee / ready-for-agent). Working-now on the Kanban is **In Progress**.

## Status (when skills write)

| Event | Status |
| --- | --- |
| Create / file | **Unclaimed** |
| Park (`parked:*`) while code/grill still needed | **Parked** — left of Unclaimed. Do not pull |
| Park after code is done | **Operator** / **Desk device** / **Field** — keep `parked:*`. Do not use Parked status |
| `/umbrella` claim, `/grill-me` claim, `/implement` claim | **In Progress** |
| Repo or spec done; leftover is Play Console, Connect, Xcode, signing, Clerk | **Operator** — do not close |
| Leftover is Maestro, Preview APK, sideload, desk companion, or Device QA crawl with no phone ([DEVICE-QA.md](DEVICE-QA.md)) | **Desk device** — do not close. Comment **Waiting: Device QA** |
| Leftover is a physical outdoor run, goldens, or watch on-wrist outside | **Field** — do not close |
| Close after Build loop empty **and** no Operator / Desk / Field leftover | **Done** — drop `parked:*` and `ready-for-agent` |

Do **not** set Start / Target date unless the founder named a real window. **Houses** is the roadmap for undated packs.

## On create (every skill that files an issue)

After labels + milestone:

```text
gh project item-add 1 --owner SmokedMeats --url https://github.com/SmokedMeats/XyberRun/issues/<n>
```

If the repo **auto-add workflow** is on, skip the add when the item already exists (`gh project item-list`). Still set Status when claiming.

`item-add` **open** issues. Do not bulk-add the closed archive to the board. Closed tickets stay on the **milestone** so the pack bar is real.

`gh issue edit --milestone "<title>"` only finds **open** milestones. To put a ticket on a **closed** (hit) milestone:

```text
gh api repos/:owner/:repo/issues/<n> -X PATCH -F milestone=<milestone-number>
```

## Catch (`/umbrella` every run)

Open issues missing from the project → `item-add`. Same as the no-milestone catch. Do not invent `umbrella:*` to fill the board.

## Claim / close

```text
gh project item-edit --project-id <PVID> --id <ITEM_ID> --field-id <STATUS_FIELD_ID> --single-select-option-id <OPTION_ID>
```

IDs for this board:

| | |
| --- | --- |
| Project node | `PVT_kwHOBLIJbs4BiIha` |
| Status field | `PVTSSF_lAHOBLIJbs4BiIhazhhBpjc` |
| Parked | `dfb96017` |
| Unclaimed | `f75ad846` |
| In Progress | `47fc9ee4` |
| Operator | `34f20d42` |
| Desk device | `fcd6cab4` |
| Field | `f2f739b6` |
| Done | `98236657` |

Resolve item IDs from `gh project item-list 1 --owner SmokedMeats --format json`.

## Which skill writes what

| Skill | Project write |
| --- | --- |
| `/umbrella` | Catch: missing items. Claim → In Progress |
| `/triage` | `item-add` when it files or houses |
| `/wayfinder` | `item-add` on map + children + `Later:` |
| `/grill-me` | Claim batch → In Progress |
| `/to-spec` | `item-add` on the spec |
| `/to-tickets` | `item-add` on every published ticket (parked too) |
| `/implement` | Backfill item; claim → In Progress; close → Done; last leftover Device QA / no phone → Desk device |
| `PARKED-TICKETS.md` | `item-add`; Status **Parked** unless code is already done |

Agents need `project` scope. Missing scope → tell the human to refresh; do not skip the issue create.

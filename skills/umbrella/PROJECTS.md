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

Status columns today: **Parked** → **Unclaimed** → **In Progress** → leftover lanes (**Operator** → **Desk device** → **Field**) → **Done**. Locked stays a label (Kanban hides `locked`). Agents do not invent a column. If the founder adds another Status after In Progress and before Done, it is a **leftover lane** (below).

**Now** is a **view** (assignee / ready-for-agent). Working-now on the Kanban is **In Progress**.

## Status (when skills write)

| Event | Status |
| --- | --- |
| Create / file | **Unclaimed** |
| Park (`parked:*`) while code/grill still needed | **Parked** — left of Unclaimed. Do not pull |
| Park after code is done | **Operator** / **Desk device** / **Field** — keep `parked:*`. Do not use Parked status |
| `/umbrella` claim, `/grill-me` claim, `/implement` claim | **In Progress** |
| Repo or spec done; leftover is Play Console, Connect, Xcode, signing, Clerk | **Operator** — do not close. Then `/implement` **Crawl** (same as Desk device) |
| Leftover is Maestro, Preview APK, sideload, desk companion, or Device QA crawl with no phone ([DEVICE-QA.md](DEVICE-QA.md)) | **Desk device** — do not close. Comment **Waiting: Device QA** |
| Leftover is a physical outdoor run, goldens, or watch on-wrist outside | **Field** — do not close. Then `/implement` **Crawl** (same as Desk device) |
| Close after Build loop empty **and** no leftover-lane wait | **Done** — drop `parked:*` and `ready-for-agent`. Do **not** archive in the same breath. |

## Leftover lanes (code complete, not Done)

A **leftover lane** is any Status that is **not** Parked, Unclaimed, In Progress, or Done. Product ACs are PASS. The card stays **open**. Today that is Operator, Desk device, and Field. Tomorrow it is also any new column the founder puts between In Progress and Done.

| | |
| --- | --- |
| Pull this card? | **No** — not implement frontier |
| Hold dependents? | **No** — GitHub `blocked_by` on a leftover-lane card does not hold the next wave |
| Window full? | **No** |
| Close? | **No** until the leftover is walked |
| After the move | Living docs already on the ticket. `/implement` **Crawl** the next wave **in this session** |

Do not write “still blocked until this ticket closes.”

Do **not** set Start / Target date unless the founder named a real window. **Houses** is the roadmap for undated packs.

## On create (every skill that files an issue)

After labels + milestone:

```text
gh project item-add 1 --owner SmokedMeats --url https://github.com/SmokedMeats/XyberRun/issues/<n>
```

`item-add` is safe to re-run. Do **not** dump the whole board to see if the item exists. Still set Status when claiming.

`item-add` **open** issues. Do not bulk-add the closed archive to the board. Closed tickets stay on the **milestone** so the pack bar is real.

`gh issue edit --milestone "<title>"` only finds **open** milestones. To put a ticket on a **closed** (hit) milestone:

```text
gh api repos/:owner/:repo/issues/<n> -X PATCH -F milestone=<milestone-number>
```

## Catch (`/umbrella` every run)

Open issues missing from the project → `item-add`. Same as the no-milestone catch. Do not invent `umbrella:*` to fill the board. Then **Archive Done** (bucket 8) — count first; do not archive unless a cap is over.

Compare **open issues** to **open project items**. Never treat the first 200 `item-list` rows as the whole board.

```text
gh issue list --state open --limit 500 --json number,url
gh project item-list 1 --owner SmokedMeats --format json -L 500 --query "is:open"
```

`--query "is:open"` is the live board (~100 today). Bare `item-list` without a query is 400+ (mostly Done) and a `-L 200` dump is a **truncated** list — that is the cap agents hit, not a Project limit.

## Resolve one item (never list the board)

`gh project item-list` default is **30**. `-L 200` is still a page, not “all items.” The board already has **400+** cards. To set Status, load the issue’s own project items:

```text
gh api graphql -f query='query($n:Int!){repository(owner:"SmokedMeats",name:"XyberRun"){issue(number:$n){projectItems(first:10){nodes{id project{number} fieldValues(first:20){nodes{... on ProjectV2ItemFieldSingleSelectValue { name optionId field { ... on ProjectV2SingleSelectField { name }}}}}}}}}}' -F n=ISSUE_NUMBER
```

Use the node `id` whose `project.number` is **1**. Empty `projectItems` → `item-add`, then query again.

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

## Archive Done (not on every close)

**Do not** archive the card you just moved to **Done**. Leave it in the Done lane so recent closes stay visible.

Archive is **not** a column. It hides a card from the live board. The milestone still holds the ticket.

Run this **trim** after a close (including [CLOSE-PARENTS.md](CLOSE-PARENTS.md)) and on every `/umbrella` catch (bucket 8). Also run it **before** `item-add` / claim if the add would push the working page over 200.

### Caps

| Cap | Value | Why |
| --- | --- | --- |
| Done recency | **200** unarchived **Done** cards | Keep the newest 200 for reference. `item-list` `-L 200` is a page, not a Project limit. |
| Working page | **200** unarchived cards **across all lanes** | Other lanes (Parked … Field) stay visible. Done yields first when additions collide with that page. |

### When to archive

Count first. Do not archive if both caps are fine.

```text
gh project item-list 1 --owner SmokedMeats --format json -L 500 --query "status:Done"
gh project item-list 1 --owner SmokedMeats --format json -L 500 --query "-status:Done"
```

Use each payload’s `totalCount` (`done`, `other`). `total = done + other`.

1. **Collision / additions.** If `total > 200` and `other > 0`, archive the **oldest** Done cards until `total ≤ 200` or Done is empty. A new `item-add` or claim that would push `total` over 200 does the same **first**. Never archive a non-Done card to make room.
2. **Done overflow.** If `done > 200`, archive the **oldest** Done cards until `done == 200`.

If `other` is already over 200, archive every Done card you can, then stop. Do not archive live lanes.

If neither cap is exceeded, do nothing. Say **Done lane under 200; no archive.**

### Which cards (oldest first)

`item-list` rows often have no date. Load `updatedAt` on Done items, sort **ascending**, archive the surplus:

```text
gh api graphql -f query='query($after:String){user(login:"SmokedMeats"){projectV2(number:1){items(first:100,after:$after){pageInfo{hasNextPage endCursor}nodes{id updatedAt fieldValues(first:15){nodes{... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2SingleSelectField { name }}}}}}}}}}'
```

Keep nodes whose Status field is **Done**. Paginate until you have them. Then:

```text
gh project item-archive 1 --owner SmokedMeats --id <ITEM_ID>
```

Do not bulk-archive from a truncated `item-list` (`-L 200` and no `--query`). Undo: `gh project item-archive 1 --owner SmokedMeats --id <ITEM_ID> --undo`.

## Which skill writes what

| Skill | Project write |
| --- | --- |
| `/umbrella` | Catch: missing items + Done-lane trim. Claim → In Progress |
| `/triage` | `item-add` when it files or houses |
| `/wayfinder` | `item-add` on map + children + `Later:` |
| `/grill-me` | Claim batch → In Progress |
| `/to-spec` | `item-add` on the spec |
| `/to-tickets` | `item-add` on every published ticket (parked too) |
| `/implement` | Backfill item; claim → In Progress; close → Done (no immediate archive); last leftover Device QA / no phone → Desk device |
| `PARKED-TICKETS.md` | `item-add`; Status **Parked** unless code is already done |

Agents need `project` scope. Missing scope → tell the human to refresh; do not skip the issue create.

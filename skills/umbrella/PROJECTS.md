# Project board (Kanban + Roadmap)

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](PROJECT-CONFIG.md).

SSOT for the GitHub Project that sits **on top of** issues + milestones. Labels still name the house. Milestones still pack the Issues sidebar. The Project is the Kanban and the date roadmap — not a second house system.

**Do not** create a Project per house. **One board per repo.** Infer the board from `git remote` (this clone). Never `item-add` a satellite-repo issue onto the primary board.

`gh` needs `project` + `read:project`. If `gh project list` 403s: `gh auth refresh --hostname github.com -s project -s read:project`.

## Which board

Read **`project.yml`** (`docs/agents/project.yml` in this repo, else `../project.yml` from this skill folder — the skills root; see [PROJECT-CONFIG.md](PROJECT-CONFIG.md)). Each `repos[]` row is one board:

| Field | Use |
| --- | --- |
| `name` | Matches `git remote` repo name |
| `project_number` (**N**) | `gh project … N` |
| `org` (top-level) | `--owner` |
| `project_node` / `status_field` | GraphQL ids for `item-edit` |
| `status_options` | Single-select option ids per Status name |
| `live_beta_milestone` / `go_live_milestone` | Continuous pre-prod milestones (do not Hit) |
| `first_golive_inventory` | Issue number of that repo's first GoLive inventory card |

If `project.yml` is missing, stop and ask the founder to install it: copy `project.example.yml` from the umbrella-skills repo root and fill it in, or install the private overlay (pack README **Project config**). Do **not** invent Project numbers or option ids.

Owner is always `project.yml` `org`. Commands below use **N** = this clone’s `project_number`.

When `standing-product-rules.md` has a **Boards** section, it adds this workspace's board titles, inventory links, audit routing, and lane examples. Apply it on top of this file.

## Live Beta + GoLive (every board)

Pre-prod work is **two lanes on every board**, not a primary-repo-only shelf. File the ticket on the repo that owns the flip. Each repo has continuous **Live Beta** and **Go Live** milestones (do not Hit).

**Live Beta** = must finish before a public live beta. **GoLive** = must finish before production store / production ship. Right edge of the board: leftover lanes → **Live Beta** → **GoLive** → **Done**. Both are pullable. Claim → **In Progress**.

Cross-link siblings in the body. Do **not** put satellite cards on the primary board.

## Audit filing

`/audit` and `/umbrella` file on **this clone’s repo**. Route findings to the repo that owns the code (primary vs website vs device companions per `repos[].kind`). Do not pile satellite findings onto the primary board as children of unrelated epics.

## Views (do not invent more)

The primary board already has these. Satellite boards have the same Status columns; add the extra views only if missing (do not invent a seventh).

| View | Layout | Filter / group | Job |
| --- | --- | --- | --- |
| **Kanban** | board | Status columns. Hide locked and specs: `-label:locked -label:spec` | Live + parked left-to-right |
| **Roadmap** | roadmap | Same live filter. Uses Start / Target date | Calendar only when a date is set — do not invent dates |
| **Houses** | table | Group by **Milestone** | Pack timeline without fake due dates. GraphQL cannot set group-by — founder one-click: **Group → Milestone** |
| **Now** | table | `assignee:@me OR label:ready-for-agent -label:parked:* -label:locked` | What this session can pull |
| **Grill** | table | `label:wayfinder:grilling -label:parked:*` | HITL queue |
| **Parked** | table | `label:parked:* is:open` | Open shelf only. Status may be Parked or a leftover column |

Status columns today: **Parked** → **Unclaimed** → **In Progress** → leftover lanes (**Operator** → **Desk device** → **Field**) → **Ready to merge** → **Live Beta** → **GoLive** → **Done**. Locked stays a label (Kanban hides `locked`). Agents do not invent a column. If the founder adds another Status after In Progress and before **Live Beta** (and it is not **Ready to merge**), it is a **leftover lane** (below). **Live Beta**, **GoLive**, and **Ready to merge** are work queues (not leftover).

**Now** is a **view** (assignee / ready-for-agent). Working-now on the Kanban is **In Progress**.

## Status (when skills write)

| Event | Status |
| --- | --- |
| Create / file | **Unclaimed** |
| Must finish before public live beta | **Live Beta** — immediately before GoLive. Pullable. File on **this clone’s repo**. Milestone **Live Beta** on that same repo (continuous — do not Hit). Never `item-add` a satellite card to the primary board. Claim → **In Progress** |
| Must finish before production go-live | **GoLive** — immediately before Done. Pullable. File on **this clone’s repo**. Milestone **Go Live** on that same repo (continuous — do not Hit). Never `item-add` a satellite GoLive card to the primary board. Claim → **In Progress** |
| Park (`parked:*`) while code/grill still needed | **Parked** — left of Unclaimed. Do not pull |
| Park after code is done | **Operator** / **Desk device** / **Field** — keep `parked:*`. Do not use Parked status |
| `/umbrella` claim, `/grill-me` claim, `/implement` claim | **In Progress** |
| Repo or spec done; leftover is store console, signing, IdP admin | **Operator** — do not close. Then `/implement` **Crawl** (same as Desk device) |
| Leftover is device automation, sideload, desk companion, or Device QA this pass cannot run — `adb devices` is not exactly one, this runner cannot see USB, or another actor owns the phone ([DEVICE-QA.md](DEVICE-QA.md)) | **Desk device** — do not close. Comment **Waiting: Device QA**. Then crawl the next unblocked coding ticket |
| Leftover is a physical outdoor / on-device field check | **Field** — do not close. Then `/implement` **Crawl** (same as Desk device) |
| Mode B PR open, checks green, waiting on the founder | **Ready to merge** — do **not** close. Do **not** treat as leftover. Dependents **WAIT** until **Done** (merged) or parked. The founder merges. |
| Close after Build loop empty **and** no leftover-lane wait (Mode A), or after the founder merges a Ready-to-merge PR (Mode B) | **Done** — drop `parked:*` and `ready-for-agent`. Do **not** archive in the same breath. |

## Leftover lanes (code complete, not Done)

A **leftover lane** is any Status that is **not** Parked, Unclaimed, **Live Beta**, **GoLive**, **Ready to merge**, In Progress, or Done. Product ACs are PASS. The card stays **open**. Today that is Operator, Desk device, and Field. Tomorrow it is also any new column the founder puts between In Progress and **Live Beta**, **except Ready to merge**. **Live Beta** and **GoLive** are pullable work queues, not leftover.

### Ready to merge — EXPLICIT exception (not a leftover lane)

**Ready to merge** is a Mode B wait-on-founder lane. It is **not** a leftover lane.

| | |
| --- | --- |
| When to set | PR is open, checks green, waiting on the founder to merge into `<dev-branch>` |
| Pull this card? | **No** — not implement frontier |
| Hold dependents? | **Yes** — dependents **WAIT** until this card is **Done** (merged) or parked. Do **not** unlock the next wave the way leftover lanes do |
| Window full? | **No** |
| Close? | **No** — the founder merges; then Status **Done** |
| Who merges | **The founder only** (`project.yml` `founder`). Bots never merge |
| Mode B gate | Before this status: rebase/merge current `origin/<dev-branch>`, run `commands.pr_ready`, paste its PASS line (`commands.pr_ready_pass`, naming the current `<dev-branch>` tip) in the PR body. Dispatch checks for that line before merge |
| Public-repo gate | PR into a public repo: paste the `check:public-safe PASS` line for the current tip in the PR body. No line, not Ready |

Do **not** crawl dependents past a Ready-to-merge blocker. Do **not** call Ready to merge a leftover.

### Leftover lane rules (Operator / Desk device / Field / ...)

| | |
| --- | --- |
| Pull this card? | **No** — not implement frontier |
| Hold dependents? | **No** — GitHub `blocked_by` on a leftover-lane card does not hold the next wave |
| Window full? | **No** |
| Close? | **No** until the leftover is walked |
| After the move | Living docs already on the ticket. `/implement` **Crawl** the next wave **in this session** |

Do not write “still blocked until this ticket closes” for leftover lanes. **Do** hold for **Ready to merge**.

Do **not** set Start / Target date unless the founder named a real window. **Houses** is the roadmap for undated packs.

## On create (every skill that files an issue)

After labels + milestone:

```text
gh project item-add N --owner <org> --url https://github.com/<org>/<this-repo>/issues/<n>
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
gh project item-list N --owner <org> --format json -L 500 --query "is:open"
```

`--query "is:open"` is the live board. Bare `item-list` without a query includes Done and a `-L 200` dump is a **truncated** list — that is the cap agents hit, not a Project limit.

## Resolve one item (never list the board)

`gh project item-list` default is **30**. `-L 200` is still a page, not “all items.” To set Status, load the issue’s own project items:

```text
gh api graphql -f query='query($repo:String!,$n:Int!){repository(owner:"<org>",name:$repo){issue(number:$n){projectItems(first:10){nodes{id project{number} fieldValues(first:20){nodes{... on ProjectV2ItemFieldSingleSelectValue { name optionId field { ... on ProjectV2SingleSelectField { name }}}}}}}}}}' -F repo=THIS_REPO -F n=ISSUE_NUMBER
```

Use the node `id` whose `project.number` is **N**. Empty `projectItems` → `item-add`, then query again.

## Claim / close

```text
gh project item-edit --project-id <PVID> --id <ITEM_ID> --field-id <STATUS_FIELD_ID> --single-select-option-id <OPTION_ID>
```

Resolve `<PVID>`, `<STATUS_FIELD_ID>`, and each `<OPTION_ID>` from `project.yml` for this repo. Shared names across boards are typical (**Unclaimed**, **In Progress**, **Done**); **Ready to merge** / leftover / Live Beta / GoLive ids are often per-board — never invent an id.

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
gh project item-list N --owner <org> --format json -L 500 --query "status:Done"
gh project item-list N --owner <org> --format json -L 500 --query "-status:Done"
```

Use each payload’s `totalCount` (`done`, `other`). `total = done + other`.

1. **Collision / additions.** If `total > 200` and `other > 0`, archive the **oldest** Done cards until `total ≤ 200` or Done is empty. A new `item-add` or claim that would push `total` over 200 does the same **first**. Never archive a non-Done card to make room.
2. **Done overflow.** If `done > 200`, archive the **oldest** Done cards until `done == 200`.

If `other` is already over 200, archive every Done card you can, then stop. Do not archive live lanes.

If neither cap is exceeded, do nothing. Say **Done lane under 200; no archive.**

### Which cards (oldest first)

`item-list` rows often have no date. Load `updatedAt` on Done items, sort **ascending**, archive the surplus:

```text
gh api graphql -f query='query($n:Int!,$after:String){user(login:"<org>"){projectV2(number:$n){items(first:100,after:$after){pageInfo{hasNextPage endCursor}nodes{id updatedAt fieldValues(first:15){nodes{... on ProjectV2ItemFieldSingleSelectValue { name field { ... on ProjectV2SingleSelectField { name }}}}}}}}}}' -F n=N
```

Keep nodes whose Status field is **Done**. Paginate until you have them. Then:

```text
gh project item-archive N --owner <org> --id <ITEM_ID>
```

Do not bulk-archive from a truncated `item-list` (`-L 200` and no `--query`). Undo: `gh project item-archive N --owner <org> --id <ITEM_ID> --undo`.

## Which skill writes what

| Skill | Project write |
| --- | --- |
| `/umbrella` | Catch: missing items + Done-lane trim. Claim → In Progress. Live-beta / pre-prod tickets stay **Live Beta** / **GoLive** until claimed |
| `/triage` | `item-add` when it files or houses |
| `/wayfinder` | `item-add` on map + children + `Later:` |
| `/grill-me` | Claim batch → In Progress |
| `/to-spec` | `item-add` on the spec |
| `/to-tickets` | `item-add` on every published ticket (parked too) |
| `/implement` | Backfill item; claim → In Progress; empty Build loop → the lane that matches what is left (Operator / Desk device / Field / Ready to merge / Live Beta / GoLive / Done); Mode B green PR waiting on the founder → **Ready to merge** (holds dependents); Mode A close with nothing left → Done (no immediate archive); phone-visible and this pass cannot run Device QA → Desk device, then crawl the next coding ticket |
| `PARKED-TICKETS.md` | `item-add`; Status **Parked** unless code is already done |

Agents need `project` scope. Missing scope → tell the human to refresh; do not skip the issue create.

# Fail disposition: back on the ticket, or one new issue

Bindings: `project.yml` keys and `<org>`-style placeholders resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

Read `docs/agents/triage-labels.md` and `docs/agents/issue-tracker.md` before `gh issue create`. This is **label on create** (same job as `/wayfinder` / `/to-tickets`). Do **not** apply `needs-triage`. Do **not** run `/triage` on issues you just filed. `/umbrella`'s inbox catch skips housed `domain:qa` one-offs.

## When

Default: the fail fits the ticket that leaf already names. Comment that ticket with what failed and the evidence path. Set its Status **In Progress**. Do not open a new issue. Then skip dependents ([SKIP-BLOCKED.md](SKIP-BLOCKED.md)).

Open a new issue only when the fail does not fit that ticket: a different product break, or the leaf names no ticket. One issue for that fail. Never batch two fails into one issue. Then skip dependents.

## Title

`Device QA Fail: P<id> <short user-visible problem>`

No competitor product names. No passwords.

## Body

Write a file under the run folder (`issue-P<id>.md`) and pass `--body-file`. Include: summary, environment (device or emulator serial, package, account **email/handle only**), steps, expected, actual, evidence paths, leaf id.

## Labels on create

```text
gh issue create --title "..." --body-file <path> --label bug --label ready-for-agent --label domain:qa
```

Then `--add-label` every other **closed-catalog** `domain:*` that is real (`docs/agents/triage-labels.md`). Never invent a `domain:*`.

`domain:qa` device fail, **alone** → **domain only**. Do not invent `umbrella:*`.

**Two or more live** fails of the **same product pack** (same slice, not merely both `domain:qa`) → create/apply one `umbrella:<kebab-slug>` (color `5319E7`) to those live issues only. Reuse an existing house label rather than a near-duplicate.

Do not apply `wayfinder:*` on these bugfixes.

## After create

1. **Milestone.** If the fail already has a live feature house (`umbrella:<slug>`), use that pack milestone. Else assign **Device QA** in **this clone's repo** (open, continuous; do not Hit). Look the milestone up by title. If it is closed, reopen that number; do not create a second one.

```text
gh issue edit <n> --milestone "Device QA"
```

2. **Kanban.** Infer **this clone's** board from `git remote` (the `project.yml` `repos[]` row whose `name` matches). File the issue on that repo and `item-add` **that** board only. Never put a satellite repo's fail on the primary board. Set Status **In Progress** (that row's `status_options`). Resolve the card via the issue's `projectItems`; do not dump `item-list`.

```text
# N / project_node / status_field / option ids = this repo's row in project.yml repos[]
gh project item-add N --owner <org> --url <this-issue-url>
gh api graphql -f query='query($o:String!,$repo:String!,$n:Int!){repository(owner:$o,name:$repo){issue(number:$n){projectItems(first:10){nodes{id project{number}}}}}}' -F o=<org> -F repo=THIS_REPO -F n=<n>
gh project item-edit --project-id <project_node> --id <ITEM_ID> --field-id <status_field> --single-select-option-id <In Progress id>
```

3. Put the ticket or issue number and URL on the checklist Fail line, the run `FAILS.md` row, and the run `REPORT.md`. **Skip** later open agent leaves that need this Fail's result ([SKIP-BLOCKED.md](SKIP-BLOCKED.md)). Next **independent** leaf.

## A prior Fail that this crawl Passes

Comment the evidence on that issue. Propose its move in `STATUS_MOVES` (SKILL.md §8); the parent closes and sets **Done** after `device-qa-verifier` Pass. Standalone with the founder's say-so: close it yourself, remove `ready-for-agent` only, keep the milestone, set **Done**. Do not Hit **Device QA**.

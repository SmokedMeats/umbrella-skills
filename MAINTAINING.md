# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## When an overlay rule changes

Update both in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" table in `README.md`

Then sync this clone into every IDE and every XyberRun workspace repo that sits next to it (`XyberRun`, `XyberRun.IO`, `XyberRun-AppleWatch`, `XyberRun-AndroidWatch`):

```text
node scripts/sync-workspace.mjs
```

That overwrites only the nine overlay skill folders. It writes user-global `~/.grok`, `~/.cursor`, `~/.claude`, and `~/.agents`, plus each sibling repo’s `.cursor/skills`. It does not touch XyberRun product skills under `.grok/skills`.

Optional extra (same overlay, installer-managed paths):

```text
npx skills@latest add SmokedMeats/umbrella-skills -g -y --copy --full-depth -a grok -a cursor -a claude-code
```

From a dirty local clone (before push), run `sync-workspace.mjs` from that folder. Do not point `npx skills add` at GitHub if the clone is ahead.

Do **not** update or reopen a field-notes issue on `mattpocock/skills`. This repo is the SSOT.

## What belongs where

- **README** — for people who install the overlay.
- **This file** — how maintainers edit the pack.

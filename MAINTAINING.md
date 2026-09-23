# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## When an overlay rule changes

Update both in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" index + skill headings in `README.md`

Then sync this clone into every IDE and every XyberRun workspace repo that sits next to it (`XyberRun`, `XyberRun.IO`, `XyberRun-AppleWatch`, `XyberRun-AndroidWatch`):

```text
node scripts/sync-workspace.mjs
```

That overwrites only the overlay skill folders listed in `scripts/sync-workspace.mjs` (the original planning overlays plus `how`, `why`, `teach`, `teach-me`, `principles`, and `blast-radius`). It writes user-global `~/.grok`, `~/.cursor`, `~/.claude`, and `~/.agents`, plus each sibling repo’s `.cursor/skills`. It does not touch XyberRun product skills under `.grok/skills`.

After you add or edit one of those folders, run the sync script in the same change before you call the pack installed.

Optional extra (same overlay, installer-managed paths):

```text
npx skills@latest add SmokedMeats/umbrella-skills -g -y --copy --full-depth -a grok -a cursor -a claude-code
```

From a dirty local clone (before push), run `sync-workspace.mjs` from that folder. Do not point `npx skills add` at GitHub if the clone is ahead.

Do **not** update or reopen a field-notes issue on `mattpocock/skills`. This repo is the SSOT.

## Upstream pulls

This pack is the SSOT. Never auto-merge Matt or pstack.

### Matt ([mattpocock/skills](https://github.com/mattpocock/skills))

Unedited Matt skills update by reinstalling Matt's pack on its own schedule.

Overlay copies we own never get a blind overwrite: `umbrella`, `grill-me`, `grilling`, `wayfinder`, `to-spec`, `to-tickets`, `implement`, `code-review`, `triage`, plus `how`, `why`, `teach`, `teach-me`, `principles`, and `blast-radius`.

Diff the upstream skill. Cherry-pick only lines that help. Keep house rules: Ship mode, Desk device, Effect-TS, Projects, and the grill-lock-only Founder gate. Then run `node scripts/sync-workspace.mjs`.

### pstack ([cursor/plugins](https://github.com/cursor/plugins))

`how`, `why`, `teach`, `principles`, and `blast-radius` are adapted copies inside this overlay. The upstream folders are under [pstack](https://github.com/cursor/plugins/tree/main/pstack). Do not install poteto-mode as a second conductor.

When cursor/plugins ships pstack changes, diff only those skill folders we ported. Adopt, adapt, or skip each change in a PR to this repo. Never let a plugin update wipe house overlays.

### Cadence

On notice, or on a periodic review. Open a PR with the cherry-picks. A human (or CoS) merges.

## What belongs where

- **README** — for people who install the overlay.
- **This file** — how maintainers edit the pack.

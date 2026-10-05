# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## Private remote vs public snapshot

Day-to-day work stays on the **private** GitHub remote (name ends in `-private`). Keep the local folder name `umbrella-skills`. The public repo of the same short name is a rebuilt single-commit snapshot only — never push private history there. Re-publish with `scripts/publish-public.sh` (or the equivalent orphan rebuild) after `check:public-safe` passes.

Installer commands that say `SmokedMeats/umbrella-skills` correctly mean the **public** pack.

## When an overlay rule changes

Update both in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" index + skill headings in `README.md`

Then sync this clone into every IDE and every product workspace repo listed in `project.yml` `workspace.skill_targets`:

```text
node scripts/sync-workspace.mjs
```

That overwrites only the overlay skill folders listed in `scripts/sync-workspace.mjs` (planning overlays, `umbrella-mode`, `build-verifier`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, and `blast-radius`). It writes user-global `~/.grok`, `~/.cursor`, `~/.claude`, `~/.agents`, and `~/.copilot` (each `<root>/skills`), plus each sibling repo’s `.cursor/skills`. It does not touch product-only skills under `.grok/skills` (those stay in the product repos). On the Grok Bot box add `--box` (box skills root `/home/box/agent-data/workflows`); any other skills root: `--dest <dir>`. With the private overlay present, every one of those roots gets `project.yml` + `standing-product-rules.md` next to `umbrella/PROJECT-CONFIG.md`.

After you add or edit one of those folders, run the sync script in the same change before you call the pack installed.

Optional extra (same overlay, installer-managed paths):

```text
npx skills@latest add SmokedMeats/umbrella-skills -g -y --copy --full-depth -a grok -a cursor -a claude-code
```

That GitHub name is the **public** snapshot. From a dirty local (private) clone (before push), run `sync-workspace.mjs` from that folder. Do not point `npx skills add` at GitHub if the clone is ahead.

Do **not** update or reopen a field-notes issue on `mattpocock/skills`. This repo is the SSOT.

## Upstream pulls

This pack is the SSOT. Never auto-merge Matt or pstack.

### Matt ([mattpocock/skills](https://github.com/mattpocock/skills))

Target Matt version: **v1.3.1**. Unedited Matt skills update by reinstalling Matt's pack (`npx skills@latest add mattpocock/skills`) on its own schedule. Expected Matt installs next to this overlay include `retro`, `implement-spec`, `pr`, `ask-matt`, `diagnosing-bugs`, `setup-matt-pocock-skills`, `domain-modeling`, `tdd`, and the rest of Matt's unedited set. Do **not** keep `resolving-merge-conflicts` (removed in Matt 1.3). Domain docs are `GLOSSARY.md` / `GLOSSARY-MAP.md` (renamed from `CONTEXT.md` / `CONTEXT-MAP.md`).

Overlay copies we own never get a blind overwrite: `umbrella`, `umbrella-mode`, `grill-me`, `grilling`, `wayfinder`, `to-spec`, `to-tickets`, `implement`, `code-review`, `triage`, `build-verifier`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, and `blast-radius`.

Diff the upstream skill. Cherry-pick only lines that help. Keep house rules: Ship mode, Desk device, Effect-TS, Projects, and the grill-lock-only Founder gate. `/implement-spec` stays Matt standalone (not routed inside umbrella `/implement`). Then run `node scripts/sync-workspace.mjs`.

### pstack ([cursor/plugins](https://github.com/cursor/plugins))

`how`, `why`, `teach`, `principles`, and `blast-radius` are adapted copies inside this overlay. The upstream folders are under [pstack](https://github.com/cursor/plugins/tree/main/pstack). Do not install poteto-mode as a second conductor.

When cursor/plugins ships pstack changes, diff only those skill folders we ported. Adopt, adapt, or skip each change in a PR to this repo. Never let a plugin update wipe house overlays.

### Cadence

On notice, or on a periodic review. Open a PR with the cherry-picks. A human (or Chief of Staff) merges.

## What belongs where

- **README** — for people who install the overlay.
- **This file** — how maintainers edit the pack.

## Leave these out

- Swarm and arena are not standing slashes and not an always-on fan-out.
- `/automate-me` and reflect stay maintainer-only. Do not port them as always-on pack writers.
- Do not add a `typescript-best-practices` skill. It fights the Effect pins.
- Do not copy Matt `/tdd`, `/prototype`, `/research`, `/diagnosing-bugs`, `/retro`, `/pr`, or `/implement-spec` bodies into this overlay. `/umbrella` routes most of them; `/implement-spec` stays standalone.

When you edit agent-facing files in this repo, read `/writing-for-agents` if that skill is installed next to the pack. Do not copy it into this repo.

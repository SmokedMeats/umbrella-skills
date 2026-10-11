# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## Private remote vs public snapshot

Day-to-day work stays on the **private** GitHub remote (name ends in `-private`). `vendor/` (pinned outside packs) exists only there: `.gitattributes` `export-ignore` keeps it out of the `git archive` the publish script uses, so the public tree is the private tree minus `vendor/`. Keep the local folder name `umbrella-skills`. The public repo of the same short name is a rebuilt single-commit snapshot only — never push private history there. Re-publish with `scripts/publish-public.sh` (or the equivalent orphan rebuild) after `check:public-safe` passes.

Installer commands that say `SmokedMeats/umbrella-skills` correctly mean the **public** pack.

## When an overlay rule changes

Update both in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" index + skill headings in `README.md`

Then sync this clone into every IDE and every product workspace repo listed in `project.yml` `workspace.skill_targets` (one command does skills and each repo's agent rules; in a product repo it is `npm run sync`):

```text
node scripts/sync-workspace.mjs
```

That overwrites only the overlay skill folders listed in `scripts/sync-workspace.mjs` (planning overlays, `umbrella-mode`, `build-verifier`, `device-qa-agent`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, `blast-radius`, `pit-of-success`, and `zero-tech-debt`). It writes user-global `~/.grok`, `~/.cursor`, `~/.claude`, `~/.agents`, and `~/.copilot` (each `<root>/skills`), plus each sibling repo’s `.cursor/skills`. It writes product repos only at the `dirs` each `skill_targets` row lists (for example `.cursor/skills`, `.grok/skills`, `.claude/skills`); other product-only skills in those folders stay. On the Grok Bot box add `--box` (box skills root `/home/box/agent-data/workflows`); any other skills root: `--dest <dir>`. With the private overlay present, every one of those roots gets `project.yml` + `standing-product-rules.md` next to `umbrella/PROJECT-CONFIG.md`.

After you add or edit one of those folders, run the sync script in the same change before you call the pack installed.

Optional extra (same overlay, installer-managed paths):

```text
npx skills@latest add SmokedMeats/umbrella-skills -g -y --copy --full-depth -a grok -a cursor -a claude-code
```

That GitHub name is the **public** snapshot. From a dirty local (private) clone (before push), run `sync-workspace.mjs` from that folder. Do not point `npx skills add` at GitHub if the clone is ahead.

Do **not** update or reopen a field-notes issue on `mattpocock/skills`. This repo is the SSOT.

## Upstream pulls

This pack is the SSOT. Never auto-merge Matt or pstack.

**Keep what we added.** An upstream update never removes something we built on top: a house rule, a section, a step, a skill, a gate. Remove one only when the update replaces it with something that serves us better, and say so in the PR: what goes, what replaces it, and why the new one is better. Everything else we added stays, even when the upstream text around it changes.

- `node scripts/sync-workspace.mjs --check-updates` marks every changed upstream skill we ship our own version of, and warns when upstream removes a skill our skills still call.
- `--update` holds any auto source (Stripe, Neon, graphify, ...) whose new version would drop a skill, file or section we have now. Read the summary; install with `--update --force` only when nothing we need goes.

### Matt ([mattpocock/skills](https://github.com/mattpocock/skills))

Target Matt version: **v1.3.1**, pinned in `vendor/mattpocock-skills/` (unedited snapshot + MIT license; [vendor/README.md](vendor/README.md) **Bump a pin**). `sync-workspace.mjs` installs the pinned copy, so an upstream delete or rewrite never breaks an install. Public-clone users reinstall with `npx skills@latest add mattpocock/skills`. Expected Matt installs next to this overlay include `retro`, `implement-spec`, `pr`, `ask-matt`, `diagnosing-bugs`, `setup-matt-pocock-skills`, `domain-modeling`, `tdd`, and the rest of Matt's unedited set. Do **not** keep `resolving-merge-conflicts` (removed in Matt 1.3). Domain docs are `GLOSSARY.md` / `GLOSSARY-MAP.md` (renamed from `CONTEXT.md` / `CONTEXT-MAP.md`).

Overlay copies we own never get a blind overwrite: `umbrella`, `umbrella-mode`, `grill-me`, `grilling`, `wayfinder`, `to-spec`, `to-tickets`, `implement`, `code-review`, `triage`, `build-verifier`, `device-qa-agent`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, `blast-radius`, `pit-of-success`, and `zero-tech-debt`.

Diff the upstream skill. Cherry-pick only lines that help. Keep house rules: Ship mode, Desk device, Effect-TS, Projects, and the grill-lock-only Founder gate. `/implement-spec` stays Matt standalone (not routed inside umbrella `/implement`). Then run `node scripts/sync-workspace.mjs`.

### pstack ([cursor/plugins](https://github.com/cursor/plugins))

`how`, `why`, `teach`, `principles`, and `blast-radius` are adapted copies inside this overlay. The upstream folders are under [pstack](https://github.com/cursor/plugins/tree/main/pstack). Do not install poteto-mode as a second conductor.

pstack ideas folded inline (no folder; diff these too when upstream changes):

| pstack skill | Lives here as |
| --- | --- |
| `principle-*` (24 skills) | one index, `principles` |
| `show-me-your-work` | umbrella [CONVENTIONS.md](skills/umbrella/CONVENTIONS.md) **Decision trail** |
| `no-comments` | CONVENTIONS **Comment cleanup**, `/implement` **Comment cleanup** |
| `recall` | CONVENTIONS **Recall** (umbrella-swarm also ships a `recall` skill) |
| `figure-it-out` | CONVENTIONS **figure-it-out** |
| `reflect` → `/correct` | CONVENTIONS **Repeated corrections** |
| `unslop` | house style in `teach` and the ported skills |
| poteto-mode `opening-a-pr.md` | BUILD-STANDING **PR briefing (Ship mode PR)** |
| poteto-mode `shipping.md`, `orchestrate.md` | DELEGATION **Child shape by runtime**, **Recheck at merge**; build-verifier **Which of the two** |

When cursor/plugins ships pstack changes, diff only those skill folders we ported and the rows above. The upstream copy to diff against is pinned in `vendor/pstack-reference/source/` (refresh it first, [vendor/README.md](vendor/README.md)). Ports are integrated through **0.15.17** (the snapshot); the next pull starts from there. Adopt, adapt, or skip each change in a PR to this repo. Never let a plugin update wipe house overlays.

### SimpleEnglish ([AminBlg/SimpleEnglish](https://github.com/AminBlg/SimpleEnglish))

`/simple-english` is a third-party pack (MIT), installed next to Matt's. Pinned unedited in `vendor/simple-english/` and installed by sync; public-clone users run `npx skills@latest add https://github.com/AminBlg/SimpleEnglish --skill simple-english`. Not Matt's, and never edited here. `/umbrella` routes user-facing prose to it. Update it by bumping the pin ([vendor/README.md](vendor/README.md)).

### pit-of-success and zero-tech-debt

Owned here. They were moved in from a product repo's `.claude/skills`, where they were the only copy and other clones never got them. Edit them in this pack; sync installs them.

### Cadence

On notice, or on a periodic review: `node scripts/sync-workspace.mjs --check-updates` lists every source that moved and writes its diff to `updates/`. Open a PR with the cherry-picks. A human (or Chief of Staff) merges.

## Shared with umbrella-swarm

umbrella-swarm (sibling pack) calls this pack's skills by name and keeps no copy of their rules: the heavy gate, test scope and kill handling (BUILD-STANDING), the memory check, sibling contract and merge recheck (DELEGATION), review depth and receipt fields (build-verifier). Change those here; swarm follows.

These files are byte-identical in both packs. Change them here first, then copy them to umbrella-swarm in a PR there:

- `project.example.yml`
- `scripts/check-public-safe.mjs`
- `scripts/publish-public.sh` (except its repo name)
- `.githooks/pre-push`
- `.gitattributes`

When an issue here has a swarm companion, land this side first, then point the swarm skills at it.

## What belongs where

- **README** — for people who install the overlay.
- **This file** — how maintainers edit the pack.

## Leave these out

- Swarm and arena are not standing slashes and not an always-on fan-out.
- `/automate-me` and reflect stay maintainer-only. Do not port them as always-on pack writers.
- Do not add a `typescript-best-practices` skill. It fights the Effect pins.
- Do not copy Matt `/tdd`, `/prototype`, `/research`, `/diagnosing-bugs`, `/retro`, `/pr`, or `/implement-spec` bodies into this overlay. `/umbrella` routes most of them; `/implement-spec` stays standalone.

When you edit agent-facing files in this repo, read `/writing-for-agents` if that skill is installed next to the pack. Do not copy it into this repo.

# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## Private remote vs public snapshot

Day-to-day work stays on the **private** GitHub remote (name ends in `-private`). `vendor/` (pinned outside packs) exists only there: `.gitattributes` `export-ignore` keeps it out of the `git archive` the publish script uses, so the public tree is the private tree minus `vendor/`. `skills/umbrella/private-bindings.md` is the same omission for approved product bindings. Sync copies it with the umbrella skill folder when the file is present and `--public` was not passed. Generic skills do not require that path. A public clone that installs with this script passes `--public`. That flag is explicit: a missing binding file does not select it, and `--public` refuses to copy when the file is present. The default command stays the source check and fails closed when the file is missing. On the private clone, do not pass `--public`. Keep the local folder name `umbrella-skills`. The public repo of the same short name is a rebuilt single-commit snapshot only — never push private history there. Re-publish with `scripts/publish-public.sh` (or the equivalent orphan rebuild) after `check:public-safe` passes.

Installer commands that say `SmokedMeats/umbrella-skills` correctly mean the **public** pack.

`node scripts/check-readiness.mjs` is the source aggregate: source shared-flow, the full test file, and a source install fixture. It fails closed when the private binding is missing. A public clone does not pass that command. `node scripts/check-readiness.mjs --public` is explicit and is not inferred from a missing file. It runs check-steps, `check-shared-flow --public`, a public install fixture, and the archive omission check. The source rows are reported `NOT APPLICABLE`. That is not a pass, and it does not turn the raw public suite into a pass. An unset denylist stays `NOT RUN`. On the private clone, do not pass `--public`: the binding file is present, so that check fails closed. The public fixture does not copy project config and does not replace swarm skills.

## When an overlay rule changes

Update both in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" index + skill headings in `README.md`

Then sync this private clone into every IDE and every product workspace repo listed in `project.yml` `workspace.skill_targets` (one command does skills and each repo's agent rules; in a product repo it is `npm run sync`). Do not pass `--public` here:

```text
node scripts/sync-workspace.mjs
```

That overwrites only the overlay skill folders listed in `scripts/sync-workspace.mjs` (planning overlays, `umbrella-mode`, `build-verifier`, `device-qa-agent`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, `blast-radius`, `pit-of-success`, and `zero-tech-debt`). It writes user-global `~/.grok`, `~/.cursor`, `~/.claude`, `~/.agents`, and `~/.copilot` (each `<root>/skills`), plus each sibling repo’s `.cursor/skills`. It writes product repos only at the `dirs` each `skill_targets` row lists (for example `.cursor/skills`, `.grok/skills`, `.claude/skills`); other product-only skills in those folders stay. On the Grok Bot box add `--box` (box skills root `/home/box/agent-data/workflows`); any other skills root: `--dest <dir>`. With the private overlay present, every one of those roots gets `project.yml` + `standing-product-rules.md` next to `umbrella/PROJECT-CONFIG.md`.

A skill directory is replaced only when it is missing, when its `.sync-workspace-baseline` still matches the files there, or when it has no baseline and the files are exactly the pack source. The baseline is a content hash of the installed tree, including that skill's overlay slice. It does not name a machine. A tree that already matches that installed result is left byte-identical; sync writes the hash if the file is missing and does not copy the skill again. A tree with no baseline that carries the `.synced-by-sync-workspace` marker is a mirror copy this script wrote (a personal or repo skill that has since become a pack skill), so it is replaced. A tree that matches neither the installed result nor the pack source, and has no baseline, is refused as `differ` and does not gain a baseline. A tree that no longer matches its baseline is refused as `dirty` and is left byte-identical. The same inputs run again are either that unchanged result or the same refusal. If `.sync-workspace-baseline` is already a symlink or any other non-regular file, sync refuses that skill and leaves the link and the bytes it names unchanged, including on a repeat. Do not commit a sync that printed a refusal: the skills that updated and the skills that were refused are not one output. A home install, the committed files in a product repo, and a process that has not been reloaded are three copies. After this installer is on the pack's default branch, a generated-output update is its own reviewed change on the product branch that repo's config names. Other checkouts pull that change, run sync, then run sync again and expect `unchanged`. Committing or gitignoring `.sync-workspace-baseline` does not replace this check. Swarm skill directories use that same decision. An edited or unknown swarm skill is left byte-identical and is not copied over. A repeat of an unchanged swarm skill does not rewrite it. A directory that is not a current swarm skill is left in place. Words in a file inside it do not remove it. A refused entry stays as it was for the rest of that run, and it is not copied into another root. A directory named swarm or swarm-mode is not a mirror source. A broken symlink stays a broken symlink when another root has a real directory of the same name. A symlink standing where a current pack skill or a current swarm skill would go is refused. The link text stays, including when the target is absent, and the run exits non-zero. A symlink that is only a personal mirror destination is left untouched, with no refusal, and the run can exit 0.

Retire a rollout stash only when the whole stash object has an archive and every path in it has a durable destination. The archive is every parent, the index, and the untracked bytes, with hashes and a check that those bytes can be reconstructed. A ticket name or a stash subject is not that archive. A path that matches a commit already on the remote, or a regenerated tree, is the landed case. Intentional customization moves into the canonical source or the supported overlay. Unique work is its own reviewed change. Obsolete output is regenerated and checked against the archive. When the same bytes support two readings, the owner of that work chooses. Unrelated work in progress stays. Do not retire the stash, reset the checkout, or overwrite a dirty tree before the destination exists. A generated dependency directory is reproduced in isolation from the manifest and lock that created it, then compared file by file, including files the lock's package list does not name. Matching lock metadata does not make that directory disposable.

After you add or edit one of those folders, run the sync script in the same change before you call the pack installed.

Optional extra (same overlay, installer-managed paths):

```text
npx skills@latest add SmokedMeats/umbrella-skills -g -y --copy --full-depth -a grok -a cursor -a claude-code
```

That GitHub name is the **public** snapshot. From a dirty local (private) clone (before push), run `sync-workspace.mjs` from that folder. Do not point `npx skills add` at GitHub if the clone is ahead.

Do **not** update or reopen a field-notes issue on `mattpocock/skills`. This repo is the SSOT.

## Tool built-ins

Some tools ship their own skills and, in older releases, copied them into the user skill root they read. Sync lists those tools in `TOOL_OWN_SKILLS` in `scripts/sync-workspace.mjs`. Today that is Grok Build: its own root is `~/.grok/skills` and its bundle is `~/.grok/bundled/skills`. A skill in that root counts as the tool's when its name is in the bundle (same bytes or an older copy), or on the tool's `retired` list (names an older release put there that the bundle no longer ships: `check-work`, `help`). A personal skill you write in that root under one of those names is treated as the tool's too. Put personal skills in another user root, or give them another name.

The tool's skills are not mirrored as personal skills, and sync never writes into them. When a pack skill has the same name (Grok's built-in `code-review` is "Strict Code Quality Review"), sync prints `known collision` once for that path. It does not install the pack copy there and does not count a failure. Every other root still gets the pack copy.

To choose which `code-review` that root gets:

- **Keep the tool's** (the default). Do nothing. Grok sessions that read `~/.grok/skills` get Grok's strict review. Repo `.grok/skills` folders still get the pack `code-review`.
- **Use the pack's.** Move the tool's copy out of the root, for example `mv ~/.grok/skills/code-review ~/.grok/skills-retired-code-review`, then run sync. It installs the pack copy with a baseline. Grok's copy is still in `~/.grok/bundled/skills`. If a Grok update writes its copy back, sync reports the collision again and leaves it.

A new tool that ships skills this way gets a row in `TOOL_OWN_SKILLS` and a fixture in `scripts/check-shared-flow.test.mjs`.

## Upstream pulls

This pack is the SSOT. Never auto-merge Matt or pstack.

**Keep what we added.** An upstream update never removes something we built on top: a house rule, a section, a step, a skill, a gate. Remove one only when the update replaces it with something that serves us better, and say so in the PR: what goes, what replaces it, and why the new one is better. Everything else we added stays, even when the upstream text around it changes.

- `node scripts/sync-workspace.mjs --check-updates` marks every changed upstream skill we ship our own version of, and warns when upstream removes a skill our skills still call.
- `--update` holds any auto source (Stripe, Neon, graphify, ...) whose new version would drop a skill, file or section we have now. Read the summary; install with `--update --force` only when nothing we need goes.

### Matt ([mattpocock/skills](https://github.com/mattpocock/skills))

Target Matt version: **v1.3.1**, pinned in `vendor/mattpocock-skills/` (unedited snapshot + MIT license; [vendor/README.md](vendor/README.md) **Bump a pin**). `sync-workspace.mjs` installs the pinned copy, so an upstream delete or rewrite never breaks an install. Public-clone users reinstall with `npx skills@latest add mattpocock/skills`. Expected Matt installs next to this overlay include `retro`, `implement-spec`, `pr`, `ask-matt`, `diagnosing-bugs`, `setup-matt-pocock-skills`, `domain-modeling`, `tdd`, and the rest of Matt's unedited set. Do **not** keep `resolving-merge-conflicts` (removed in Matt 1.3). Domain docs are `GLOSSARY.md` / `GLOSSARY-MAP.md` (renamed from `CONTEXT.md` / `CONTEXT-MAP.md`).

Overlay copies we own never get a blind overwrite: `umbrella`, `umbrella-mode`, `grill-me`, `grilling`, `wayfinder`, `to-spec`, `to-tickets`, `implement`, `code-review`, `triage`, `build-verifier`, `device-qa-agent`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, `blast-radius`, `pit-of-success`, and `zero-tech-debt`.

Diff the upstream skill. Cherry-pick only lines that help. Keep house rules: Ship mode, Desk device, Effect-TS, Projects, and the grill-lock-only Founder gate. Keep each phase skill's `## Steps` list too, and update it when a merge changes that skill's order: `node scripts/check-steps.mjs` and `node scripts/check-shared-flow.mjs` (sync runs both first and stops on a problem). `/implement-spec` stays Matt standalone (not routed inside umbrella `/implement`). Then run `node scripts/sync-workspace.mjs`.

### pstack ([cursor/plugins](https://github.com/cursor/plugins))

`how`, `why`, `teach`, `principles`, and `blast-radius` are adapted copies inside this overlay. The upstream folders are under [pstack](https://github.com/cursor/plugins/tree/main/pstack). Do not install poteto-mode as a second conductor.

pstack ideas folded inline (no folder; diff these too when upstream changes):

| pstack skill | Lives here as |
| --- | --- |
| `principle-*` (24 skills) | one index, `principles` |
| `show-me-your-work` | umbrella [CONVENTIONS.md](skills/umbrella/CONVENTIONS.md) **Decision trail** |
| `no-comments` | CONVENTIONS **Comment cleanup**, `/implement` **Comment cleanup**; the skill itself installs unedited from `vendor/pstack-skills` |
| `statechart` | `/to-spec` **Statechart** and CONVENTIONS call it by name; installs unedited from `vendor/pstack-skills` |
| `recall` | CONVENTIONS **Recall** (umbrella-swarm also ships a `recall` skill) |
| `figure-it-out` | CONVENTIONS **figure-it-out** |
| `reflect` → `/correct` | CONVENTIONS **Repeated corrections** |
| `unslop` | house style in `teach` and the ported skills |
| poteto-mode `opening-a-pr.md` | BUILD-STANDING **PR briefing (Ship mode PR)** |
| poteto-mode `shipping.md`, `orchestrate.md` | DELEGATION **Child shape by runtime**, **Recheck at merge**; build-verifier **Which of the two** |
| poteto-mode **Playbooks** (steps copied into the todo, `skip: <reason>`) | CONVENTIONS **Steps**: a `## Steps` list per phase skill, `STEPS` / `STEPS_DONE` in DELEGATION packets, `scripts/check-steps.mjs`. The spine stays fixed: no free playbook matcher |

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

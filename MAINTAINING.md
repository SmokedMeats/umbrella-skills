# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## Private remote vs public snapshot

Day-to-day work stays on the **private** GitHub remote (name ends in `-private`). `vendor/` (pinned outside packs) exists only there: `.gitattributes` `export-ignore` keeps it out of the `git archive` the publish script uses, so the public tree is the private tree minus `vendor/`. `skills/umbrella/private-bindings.md` is the same omission for approved product bindings. Sync copies it with the umbrella skill folder when the file is present and `--public` was not passed. Generic skills do not require that path. A public clone that installs with this script passes `--public`. That flag is explicit: a missing binding file does not select it, and `--public` refuses to copy when the file is present. The default command stays the source check and fails closed when the file is missing. On the private clone, do not pass `--public`. Keep the local folder name `umbrella-skills`. The public repo of the same short name is a rebuilt single-commit snapshot only — never push private history there. Re-publish with `scripts/publish-public.sh` (or the equivalent orphan rebuild) after `check:public-safe` passes.

Installer commands that say `SmokedMeats/umbrella-skills` correctly mean the **public** pack.

`node scripts/check-pr-ready.mjs` is the pack gate for a pull request (no root `package.json`, so there is no `check:pr-ready` npm script). It needs `PUBLIC_SAFE_DENYLIST` set to the private denylist file. The tree scan runs `scripts/check-public-safe.mjs --tree` on the `git archive` export, so export-ignore files stay out of that scan, and `--range origin/main..HEAD` runs on this checkout. The script adds no denylist exception. It also runs `check-steps`, `check-shared-flow`, and `skill-lint` (frontmatter and relative links fail; a SKILL.md over 500 lines warns and does not fail). Public mode is the `--public` flag only. It runs `check-shared-flow --public`, and prints that the binding presence and content checks were skipped, only when the binding is `export-ignore` and absent from HEAD and `origin/main` does not track it. A private branch that deletes the binding while `origin/main` still has it fails closed. Without the flag, a missing binding fails closed. A shallow or orphan clone is not public mode. Source mode reads the binding blob at HEAD, so an excluded worktree copy or a symlink does not count. On the public snapshot, pass `--public`. That pass line is `pr-ready: PASS (public) <sha>`. The private line stays `pr-ready: PASS <sha>`. On the private clone, do not pass `--public`. The installer does not infer `--public`. A clean run ends with `pr-ready: PASS <HEAD sha>`. A dirty working tree or index fails, and so does a HEAD that does not contain origin/main, so that line is that commit's content. Paste that line in the PR body. A docs-only pull request merges on that line. The exact-head build-verifier plus `## Evidence` stand-in is retired. No workflow file runs it.

`node scripts/check-readiness.mjs` is the source aggregate: source shared-flow, the full test file, and a source install fixture. It fails closed when the private binding is missing. A public clone does not pass that command. `node scripts/check-readiness.mjs --public` is explicit and is not inferred from a missing file. It runs check-steps, `check-shared-flow --public`, a public install fixture, and the archive omission check. The source rows are reported `NOT APPLICABLE`. That is not a pass, and it does not turn the raw public suite into a pass. An unset denylist stays `NOT RUN`. On the private clone, do not pass `--public`: the binding file is present, so that check fails closed. The public fixture does not copy project config and does not replace swarm skills.

## Where skills live

| Layer | What | Edit it? |
| --- | --- | --- |
| Source repos | This pack (umbrella-skills), [umbrella-swarm](https://github.com/SmokedMeats/umbrella-swarm), and the outside packs it depends on: [mattpocock/skills](https://github.com/mattpocock/skills) and [AminBlg/SimpleEnglish](https://github.com/AminBlg/SimpleEnglish) | Only our own two. Outside packs are never edited; a house change to a Matt skill is an overlay skill here |
| Pinned backups | `vendor/` in the **private** clone: unedited snapshots of Matt v1.3.1, SimpleEnglish, and the two pstack skills the overlay calls (`statechart`, `no-comments`) and cursor-team-kit `deslop`, with their MIT licenses (the private clone's `vendor/README.md`). If an outside repo disappears, installs still work. The public snapshot leaves `vendor/` out | No; bump a pin per `vendor/README.md` |
| Installed copies | What `sync-workspace.mjs` (or `npx skills add`) writes into each agent's skills folder: `~/.claude/skills`, `~/.cursor/skills`, `~/.grok/skills`, `~/.agents/skills`, `~/.copilot/skills`. VS Code (Copilot agent mode) reads `~/.copilot/skills`, `~/.claude/skills` and `~/.agents/skills` | No; re-run sync |
| Product-repo copies | The same installed copies, written into each product repo's `workspace.skill_targets` folders (for example `.cursor/skills`, `.claude/skills`, `.grok/skills`) and **committed**, because a cloud agent only sees what its checkout has. VS Code also reads a repo's `.claude/skills`, `.agents/skills` and `.github/skills` | No. Once per promote, right before it, never mid-day, and never while a pack PR is queued. The designated sync owner is the only agent that runs that sync |

Which folder each agent reads. Sync gives each agent its own full copy (for example `.grok/skills`, `.claude/skills`, `.cursor/skills`) and keeps them identical, so no agent depends on another's folder:

| Agent | Repo skills | User skills |
| --- | --- | --- |
| Claude Code | `.claude/skills` | `~/.claude/skills` |
| Cursor | `.cursor/skills`, `.agents/skills`, and `.claude/skills` | `~/.cursor/skills`, `~/.agents/skills`, `~/.claude/skills` |
| VS Code (Copilot) | `.github/skills`, `.claude/skills`, `.agents/skills` | `~/.copilot/skills`, `~/.claude/skills`, `~/.agents/skills` |
| Grok Build | `.grok/skills`, then `.claude`, then `.cursor` | `~/.grok/skills` |
| Codex | `.agents/skills` | `~/.agents/skills` |

An agent *references* a skill by name and reads that installed file when it needs it; a brief never pastes a skill's body (cloud exception: umbrella `DELEGATION.md` **Sibling contract**).

## Install internals

`node scripts/install.mjs` (README **Install**) is the installer front door. On a public clone it fetches the newest Matt Pocock release tag, SimpleEnglish `HEAD`, and the pstack (`statechart`, `no-comments`) and cursor-team-kit (`deslop`) skills from `cursor/plugins` `HEAD` into `.upstream/` (gitignored, laid out by `scripts/upstreams.mjs`), clones `umbrella-swarm` next to the pack when it is missing, and runs `sync-workspace.mjs --public` with `UMBRELLA_VENDOR_ROOT=.upstream`. Sync installs those upstream skills first and the overlay second, so same-named overlay skills win. On the private clone it skips the fetch and syncs the pinned `vendor/` copies in source mode. Other flags pass through to sync.

Run sync directly when you need its flags without the fetch:

```bash
node scripts/sync-workspace.mjs           # private clone: pinned vendor/ + overlay + private overlay
node scripts/sync-workspace.mjs --public  # public clone: overlay only (no upstream packs)
```

`--public` is explicit for sync: a missing `skills/umbrella/private-bindings.md` does not select it, and without it the source check stops before any copy. `install.mjs` passes it only when the clone has neither `vendor/` nor the binding (the public snapshot), so a private clone that lost its binding still fails closed.

That copies the overlay into `~/.grok`, `~/.cursor`, `~/.claude`, `~/.agents`, `~/.copilot` (each `<root>/skills`, created when missing), and each sibling product repo listed in `project.yml` `workspace.skill_targets` (defaults to none until you add a config). When a private overlay sibling is present, sync also layers `project.yml`, `skills-overlay/**`, and standing product rules.

Every skills root sync writes ends up with the same three config files: `project.yml` and `standing-product-rules.md` at the root (from the private overlay) and `umbrella/PROJECT-CONFIG.md` (ships in this pack). Product repos also get `docs/agents/project.yml` + `docs/agents/standing-product-rules.md`; commit every `skill_targets` dir in the product repo (for example `.grok/skills`, `.claude/skills`, `.cursor/skills`) + `docs/agents` so cloud clones get them too. Those folders are installed copies; never edit them in the product repo. The product-repo sync runs once per promote, right before it, never mid-day, and never while a pack PR is queued. The designated sync owner is the only agent that runs that sync, so the product branches never get two parallel syncs.

| Target | How |
| --- | --- |
| User skill roots `~/.grok/skills`, `~/.cursor/skills`, `~/.claude/skills`, `~/.agents/skills`, `~/.copilot/skills` (VS Code reads the last three) | always (Windows: `%USERPROFILE%\.copilot\skills`) |
| Each product repo's `skill_targets` folders (for example `.grok/skills`, `.claude/skills`, `.cursor/skills`) + `docs/agents/` | `project.yml` `workspace.skill_targets` (sibling clones only) |
| Each product repo's own skills (an original in `own: [...]` or in any of its `skill_targets` folders, so a skill made in `.cursor/skills` counts) into that repo's other folders | automatic when the row lists `own`; copies carry `.synced-by-sync-workspace`, and a folder another installer owns is left alone |
| A skill only some product repos have (an original in a repo's `own` or `skill_targets` folders, not from a pack) into every other repo's `skill_targets` folders | automatic; a repo that has its own version keeps it; an agent-specific original (graphify's `.claude/skills` copy) feeds that same folder in the other repos; a row's `skip: [...]` lists skills that repo never receives, shared or personal (an earlier copy is removed) |
| Only some skills in a product repo | a row's `only: [...]` is the full list of synced skills that repo gets (pack, swarm, shared and personal; `skip` still wins). Sync removes every other synced copy in its folders (one with `.sync-workspace-baseline` or `.synced-by-sync-workspace`); the repo's own originals stay |
| Personal skills (an original in one user root that no pack ships) into the other user roots and every repo `skill_targets` folder, so cloud sessions have them too | automatic; `--no-personal` skips; `workspace.mirror_exclude` lists names never copied; copies whose source is gone are listed, never deleted |
| Each product repo's agent-rules generator (`rules: "<command>"`, run in that repo: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, Copilot instructions, …) | automatic when the row lists `rules`; `--no-rules` skips only that generator (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`); `docs/standing-product-rules.md` is still copied; a failure makes sync exit non-zero |
| Upstream packs (Matt, SimpleEnglish, pstack `statechart` / `no-comments`, cursor-team-kit `deslop`) into every root above, before the overlay so same-named overlay skills win | private clone: pinned `vendor/`; public clone: `install.mjs` fetches the newest releases into `.upstream/`; `--no-vendor` skips |
| Grok Bot box skills root `/home/box/agent-data/workflows` | `--box` (skipped when that folder's parent is missing; override with `UMBRELLA_BOX_SKILLS_ROOT`) |
| Any other skills root | `--dest <dir>` (repeatable) |
| umbrella-swarm skills (every `skills/*` folder of the sibling that ships `skills/swarmy` + `skills/swarmy-mode`) into every root above, product repos included | automatic when that sibling clone exists (`UMBRELLA_SWARM=<folder>` picks one; `--no-swarm` skips; a name shared with an overlay skill is skipped) |

`sync-workspace.mjs` (project.yml) and `check-public-safe.mjs` (denylist, allowlist, git output) normalize CRLF to LF on read, so Windows clones checked out with CRLF (`core.autocrlf=true`) sync every `skill_targets` repo, not just the first. This pack's `.gitattributes` also pins LF on checkout.

### Check the original sources for updates

Sync itself works offline: it copies from the clones and folders on this machine and never looks upstream. To compare with the newest releases:

```bash
node scripts/sync-workspace.mjs --check-updates   # report + one diff per source; installs nothing
node scripts/sync-workspace.mjs --update          # same report, installs the auto sources, then syncs
# add --print to also show every full diff
```

From a product repo the same flags pass through: `npm run sync -- --check-updates`.

| Source | Kind | Compared with | On `--update` |
| --- | --- | --- | --- |
| Matt's pack, SimpleEnglish, pstack, cursor-team-kit `deslop` (`vendor/pins.json`, private clone) | review | newest Matt tag; SimpleEnglish and cursor/plugins `HEAD` | nothing; read the diff, then bump by hand (the private clone's `vendor/README.md` **Bump a pin**) |
| Every skill in a product repo's `skills-lock.json` (`npx skills`: Stripe, Neon, ...) | auto | what the source publishes now | `npx skills add` for that skill, then the sync spreads it |
| graphify (an original folder with `.graphify_version` in a product repo) | auto | newest `graphifyy` on PyPI (builds that version in a scratch venv for the diff; needs Python 3) | `graphify install` output for that agent (`.claude/skills` gets the Claude version) |

The report lists, per source that moved: **new skills** with what each does, **removed skills**, and for each **changed skill** a changelog (upstream commit messages where the source has git history, plus the sections that were added, removed or changed). It marks each changed upstream skill we ship our own version of, and warns when upstream removes a skill ours still call. `--update` holds (status `held`) any auto source whose new version would drop a skill, file or section we have now; after review, `--update --force` installs it. Rule: an update never removes something we added unless it replaces it with something better (MAINTAINING **Upstream pulls**). It is also saved as `updates/SUMMARY.md`. The full diff for each source (`current/` = what we have, `latest/` = upstream now) is saved as `updates/<source>.diff` (gitignored). Behind a proxy, run with `NODE_USE_ENV_PROXY=1`. The umbrella-skills, umbrella-swarm and overlay clones update with `git pull`.

When the private overlay is present, sync also turns on the local `check:public-safe` pre-push gate in every sibling clone that ships `.githooks/pre-push` + `scripts/check-public-safe.mjs` (`git config core.hooksPath .githooks`, and `publicsafe.denylist` pointing at the overlay's `public-safe/denylist.txt`). The gate needs [gitleaks](https://github.com/gitleaks/gitleaks) on PATH: `brew install gitleaks` (macOS), `winget install gitleaks` or `scoop install gitleaks` (Windows), or a [release binary](https://github.com/gitleaks/gitleaks/releases) (Linux). Without gitleaks or the denylist, pushes from those clones fail closed. See **Before pushing** below.





## Before pushing

Every push runs a local `check:public-safe` gate (no CI minutes) so private-shaped content cannot land in a public snapshot: [gitleaks](https://github.com/gitleaks/gitleaks) over the commits being pushed, then a private denylist over every added line, new file path, and commit message in those commits.

One-time setup per clone:

```bash
git config core.hooksPath .githooks
# gitleaks: brew install gitleaks | winget install gitleaks | scoop install gitleaks | release binary on Linux
# The private denylist is found via $PUBLIC_SAFE_DENYLIST, `git config publicsafe.denylist`,
# or a sibling clone carrying public-safe/denylist.txt. Missing denylist = push blocked.
```

Run it by hand (needs Node 18+; works in bash, Git Bash, and PowerShell):

```bash
node scripts/check-public-safe.mjs              # origin default branch..HEAD
node scripts/check-public-safe.mjs --base <ref> # <ref>..HEAD, e.g. a stacked PR
node scripts/check-public-safe.mjs --tree       # whole tracked tree at HEAD (audit)
```

A clean run prints one line, e.g. `check:public-safe PASS <repo>@<sha> (gitleaks 0, denylist 0)`. Paste that line in the PR body.

This repo has no root `package.json`. The pack gate is `node scripts/check-pr-ready.mjs`. On the public snapshot the command is `node scripts/check-pr-ready.mjs --public`. Public mode runs only when that flag is set, `skills/umbrella/private-bindings.md` is export-ignored and absent, and `origin/main` does not track it. Without the flag, a missing binding fails closed. Set `PUBLIC_SAFE_DENYLIST` first. The gate also runs `skill-lint`: frontmatter and relative-link errors fail, and a SKILL.md over 500 lines warns without failing. The private last line is `pr-ready: PASS <HEAD sha>`. The public last line is `pr-ready: PASS (public) <HEAD sha>`. A failure is `pr-ready: FAIL <reasons>`. A dirty working tree or index fails, and so does a HEAD that does not contain origin/main. Paste a pass line in the body. A docs-only pull request merges on that line. The exact-head build-verifier plus `## Evidence` stand-in is retired. No workflow file runs this command.

## When an overlay rule changes

Update both in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" index + skill headings in `docs/REFERENCE.md` (and `docs/GLOSSARY.md` when a term changes). The README stays one screen: touch it only when install or first run changes

Then sync this private clone into every IDE. The product-repo sync, into the repos listed in `project.yml` `workspace.skill_targets`, runs once per promote, right before it, never mid-day, and never while a pack PR is queued. Pack pull requests still land in the pack repos as they are ready. The designated sync owner is the only agent that runs that sync, so the product branches never get two parallel syncs. One command does skills and each repo's agent rules; in a product repo it is `npm run sync`. Do not pass `--public` here:

```text
node scripts/sync-workspace.mjs
```

Before it copies anything, sync runs `git fetch` in this pack, the private overlay, the swarm pack, and every `skill_targets` repo, and stops with `sync: refuse: <repo> ...` when one is behind or diverged from its upstream branch, a fetch fails, or the branch has no upstream. Only ahead (unpushed commits) is fine. Pull that checkout, then sync again. A folder that is not a git checkout is skipped (`scripts/sync-freshness.mjs`).

That overwrites only the overlay skill folders listed in `scripts/sync-workspace.mjs` (planning overlays, `umbrella-mode`, `build-verifier`, `device-qa-agent`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, `blast-radius`, `pit-of-success`, and `zero-tech-debt`). It writes user-global `~/.grok`, `~/.cursor`, `~/.claude`, `~/.agents`, and `~/.copilot` (each `<root>/skills`), plus each sibling repo’s `.cursor/skills`. It writes product repos only at the `dirs` each `skill_targets` row lists (for example `.cursor/skills`, `.grok/skills`, `.claude/skills`); other product-only skills in those folders stay. On the Grok Bot box add `--box` (box skills root `/home/box/agent-data/workflows`); any other skills root: `--dest <dir>`. With the private overlay present, every one of those roots gets `project.yml` + `standing-product-rules.md` next to `umbrella/PROJECT-CONFIG.md`.

A skill directory is replaced only when it is missing, when its `.sync-workspace-baseline` still matches the files there, or when it has no baseline and the files are exactly the pack source. The baseline is a content hash of the installed tree, including that skill's overlay slice. It does not name a machine. A tree that already matches that installed result is left byte-identical; sync writes the hash if the file is missing and does not copy the skill again. A tree with no baseline that carries the `.synced-by-sync-workspace` marker is a mirror copy this script wrote (a personal or repo skill that has since become a pack skill), so it is replaced. A tree that matches neither the installed result nor the pack source, and has no baseline, is refused as `differ` and does not gain a baseline. A tree that no longer matches its baseline is refused as `dirty` and is left byte-identical. The same inputs run again are either that unchanged result or the same refusal. If `.sync-workspace-baseline` is already a symlink or any other non-regular file, sync refuses that skill and leaves the link and the bytes it names unchanged, including on a repeat. Do not commit a sync that printed a refusal: the skills that updated and the skills that were refused are not one output. A home install, the committed files in a product repo, and a process that has not been reloaded are three copies. After this installer is on the pack's default branch, a generated-output update is its own reviewed change on the product branch that repo's config names. Other checkouts pull that change, run sync, then run sync again and expect `unchanged`. Committing or gitignoring `.sync-workspace-baseline` does not replace this check. Swarm skill directories use that same decision. An edited or unknown swarm skill is left byte-identical and is not copied over. A repeat of an unchanged swarm skill does not rewrite it. A directory that is not a current swarm skill is left in place. Words in a file inside it do not remove it. A refused entry stays as it was for the rest of that run, and it is not copied into another root. A directory named swarm or swarm-mode is not a mirror source. A broken symlink stays a broken symlink when another root has a real directory of the same name. A symlink standing where a current pack skill or a current swarm skill would go is refused. The link text stays, including when the target is absent, and the run exits non-zero. A symlink that is only a personal mirror destination is left untouched, with no refusal, and the run can exit 0.

Retire a rollout stash only when the whole stash object has an archive and every path in it has a durable destination. The archive is every parent, the index, and the untracked bytes, with hashes and a check that those bytes can be reconstructed. A ticket name or a stash subject is not that archive. A path that matches a commit already on the remote, or a regenerated tree, is the landed case. Intentional customization moves into the canonical source or the supported overlay. Unique work is its own reviewed change. Obsolete output is regenerated and checked against the archive. When the same bytes support two readings, the owner of that work chooses. Unrelated work in progress stays. Do not retire the stash, reset the checkout, or overwrite a dirty tree before the destination exists. A generated dependency directory is reproduced in isolation from the manifest and lock that created it, then compared file by file, including files the lock's package list does not name. Matching lock metadata does not make that directory disposable.

After you add or edit one of those folders, run the sync script for the IDE roots in the same change before you call the pack installed. Product repos wait for the promote pre-step.

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

Target Matt version: **v1.3.1**, pinned in `vendor/mattpocock-skills/` (unedited snapshot + MIT license; the private clone's `vendor/README.md` **Bump a pin**). `sync-workspace.mjs` installs the pinned copy, so an upstream delete or rewrite never breaks an install. On a public clone `node scripts/install.mjs` fetches Matt's newest release tag instead of the pin; the overlay is written against v1.3.1, so a newer Matt release can differ until the pin is bumped here. Expected Matt installs next to this overlay include `retro`, `implement-spec`, `pr`, `ask-matt`, `diagnosing-bugs`, `setup-matt-pocock-skills`, `domain-modeling`, `tdd`, and the rest of Matt's unedited set. Do **not** keep `resolving-merge-conflicts` (removed in Matt 1.3). Domain docs are `GLOSSARY.md` / `GLOSSARY-MAP.md` (renamed from `CONTEXT.md` / `CONTEXT-MAP.md`).

Overlay copies we own never get a blind overwrite: `umbrella`, `umbrella-mode`, `grill-me`, `grilling`, `wayfinder`, `to-spec`, `to-tickets`, `implement`, `code-review`, `triage`, `build-verifier`, `device-qa-agent`, `device-qa-verifier`, plus `how`, `why`, `teach`, `teach-me`, `principles`, `blast-radius`, `pit-of-success`, and `zero-tech-debt`.

Diff the upstream skill. Cherry-pick only lines that help. Keep house rules: Ship mode, Desk device, Effect-TS, Projects, and the grill-lock-only Founder gate. Keep each phase skill's `## Steps` list too, and update it when a merge changes that skill's order: `node scripts/check-steps.mjs` and `node scripts/check-shared-flow.mjs` (sync runs both first and stops on a problem). `/implement-spec` stays Matt standalone (not routed inside umbrella `/implement`). Then run `node scripts/sync-workspace.mjs`.

### cursor-team-kit `deslop` ([cursor/plugins](https://github.com/cursor/plugins/tree/main/cursor-team-kit))

`/implement` **Comment cleanup** runs `/deslop` on the ticket's diff. It ships in Cursor's `cursor-team-kit` plugin (MIT), so only that one skill is pinned in `vendor/cursor-team-kit-skills/` and installed by sync; a public clone's `install.mjs` fetches it from `cursor/plugins` `HEAD`. Never edited here.

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
| poteto-mode `shipping.md`, `orchestrate.md` | DELEGATION **Child shape by runtime**, **Recheck at merge**; CONVENTIONS **Land gate**; build-verifier **When** |
| poteto-mode **Playbooks** (steps copied into the todo, `skip: <reason>`) | CONVENTIONS **Steps**: a `## Steps` list per phase skill, `STEPS` / `STEPS_DONE` in DELEGATION packets, `scripts/check-steps.mjs`. The spine stays fixed: no free playbook matcher |

When cursor/plugins ships pstack changes, diff only those skill folders we ported and the rows above. The upstream copy to diff against is pinned in `vendor/pstack-reference/source/` (refresh it first, the private clone's `vendor/README.md`). Ports are integrated through **0.15.17** (the snapshot); the next pull starts from there. Adopt, adapt, or skip each change in a PR to this repo. Never let a plugin update wipe house overlays.

### SimpleEnglish ([AminBlg/SimpleEnglish](https://github.com/AminBlg/SimpleEnglish))

`/simple-english` is a third-party pack (MIT), installed next to Matt's. Pinned unedited in `vendor/simple-english/` and installed by sync; on a public clone `node scripts/install.mjs` fetches its newest `HEAD`. Not Matt's, and never edited here. `/umbrella` routes user-facing prose to it. Update it by bumping the pin (the private clone's `vendor/README.md`).

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

- **README** — one screen for people who install the overlay: what it is, who it is for, install, first run.
- **docs/REFERENCE.md** — every skill, the order of use, the house rules.
- **docs/GLOSSARY.md** — the words skills use (house, lane, Ship mode, land gate, ...).
- **This file** — how maintainers edit, check, and publish the pack.

## Leave these out

- Swarm and arena are not standing slashes and not an always-on fan-out.
- `/automate-me` and reflect stay maintainer-only. Do not port them as always-on pack writers.
- Do not add a `typescript-best-practices` skill. It fights the Effect pins.
- Do not copy Matt `/tdd`, `/prototype`, `/research`, `/diagnosing-bugs`, `/retro`, `/pr`, or `/implement-spec` bodies into this overlay. `/umbrella` routes most of them; `/implement-spec` stays standalone.

When you edit agent-facing files in this repo, read `/writing-for-agents` if that skill is installed next to the pack. Do not copy it into this repo.

# umbrella-skills

An agent skill pack that runs a whole batch of related GitHub issues from idea to merged PR: triage, plan, interview the founder once, write the spec and tickets, build, review, and land. It works in Claude Code, Cursor, VS Code (Copilot agent mode), Grok Build and Codex.

It is an **overlay** on [Matt Pocock's skills](https://github.com/mattpocock/skills). Matt's pack does the work (`/grill-me`, `/to-spec`, `/to-tickets`, `/implement`, `/tdd`, ...). This pack adds **`/umbrella`**, a conductor that picks the next step for a batch of issues (a **house**) and keeps going, plus review gates (`/code-review`, `/blast-radius`, `/build-verifier`, `/tech-lead-review`) and explain skills (`/how`, `/why`, `/teach`).

**Who it is for:** a solo founder or small team that tracks work in GitHub issues and wants agents to carry several tickets at a time with fixed review gates. It assumes GitHub Issues and Projects and the `gh` CLI. Words like house, lane and land gate are in the [glossary](docs/GLOSSARY.md).

## Install

You need git, Node 18+, and `gh` signed in.

```bash
git clone https://github.com/SmokedMeats/umbrella-skills.git
node umbrella-skills/scripts/install.mjs
```

That one command:

1. fetches the newest [Matt Pocock skills](https://github.com/mattpocock/skills) release, [SimpleEnglish](https://github.com/AminBlg/SimpleEnglish), and the three [cursor/plugins](https://github.com/cursor/plugins) skills this pack calls (`statechart`, `no-comments`, `deslop`) from their own repos,
2. clones the optional [umbrella-swarm](https://github.com/SmokedMeats/umbrella-swarm) companion next to it (skip it with `--no-swarm`),
3. installs those upstream skills first and this overlay on top into `~/.claude/skills`, `~/.cursor/skills`, `~/.agents/skills`, `~/.copilot/skills` and `~/.grok/skills`.

Run it again to update: it pulls both clones, fetches the newest upstream releases, and reinstalls. Same-named skills from this pack replace Matt's (`implement`, `code-review`, `triage`, ...); everything else of Matt's stays as he ships it. The overlay is written against Matt v1.3; the installer stops if a newer release drops a skill it calls.

Installed these packs with `npx skills add` before? Remove those copies first (`npx skills remove`), or the installer refuses to replace folders it did not write.

## First run

In the repo you want to work in:

1. Start your agent and run **`/setup-matt-pocock-skills`** once. It writes `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`.
2. Add your `domain:<area>` labels to `docs/agents/triage-labels.md`. `umbrella:<slug>` labels name a house and are created as needed.
3. Copy [`project.example.yml`](project.example.yml) to `docs/agents/project.yml` and fill in your repo, branches, board and commands. Skills read it and stop to ask when it is missing; they never guess ids or commands. Optional keys can stay unset.
4. Run **`/umbrella`**. It triages the inbox, lists the houses, and asks which one to work, then tells you the next step. You answer the grill questions; it runs spec, tickets and the build without further approval and stops before anything irreversible.

Say `/umbrella-mode` instead for long runs that hand each phase to a fresh sub-agent.

## Skills in this pack

| Skill | Use it to |
| --- | --- |
| `/umbrella`, `/umbrella-mode` | Run a house end to end; the only front door |
| `/triage` | Label inbound issues and name houses |
| `/wayfinder`, `/grill-me`, `/grilling` | Map a foggy effort, then interview the founder until every gap is closed |
| `/to-spec`, `/to-tickets` | Turn a locked grill into a spec with a rule card, then tickets with acceptance criteria |
| `/implement` | Build the tickets, in waves when several can start together |
| `/code-review`, `/blast-radius` | Review a diff against standards and the spec; prove what else it could break |
| `/tech-lead-review`, `/build-verifier` | The two land-gate reviews for high-risk diffs |
| `/device-qa-agent`, `/device-qa-verifier` | Phone QA on a test device. **Needs private product config** (see below) |
| `/how`, `/why`, `/teach`, `/teach-me` | Explain a subsystem, its history, or a topic over several sessions |
| `/principles`, `/pit-of-success`, `/zero-tech-debt` | Mid-task design redirects |

Full detail, the order of use and the house rules: [docs/REFERENCE.md](docs/REFERENCE.md).

**Private config.** `/device-qa-agent` reads a `PRODUCT.md` and scripts (app package, test accounts, device setup) that this public pack does not ship, and stops without them; `/device-qa-verifier` only audits that agent's run folder. `/build-verifier` can send heavy checks to a local runner named in a private binding; without one it runs everything itself. Product rules (`standing-product-rules.md`) are optional the same way.

## More

- [Glossary](docs/GLOSSARY.md): house, lane, Ship mode, land gate, and the rest.
- [Reference](docs/REFERENCE.md): every skill, the flow, the conventions.
- [umbrella-swarm](https://github.com/SmokedMeats/umbrella-swarm): several area coordinators working at once (draft).
- [MAINTAINING.md](MAINTAINING.md): for people who edit or publish this pack.

Credit: the planning spine is [Matt Pocock's skills](https://github.com/mattpocock/skills). `/how`, `/why`, `/teach`, `/principles` and `/blast-radius` are adapted from [Lauren Tan (poteto)](https://github.com/poteto)'s [pstack](https://github.com/cursor/plugins/tree/main/pstack). `/umbrella` is original here. MIT, see [LICENSE](LICENSE).

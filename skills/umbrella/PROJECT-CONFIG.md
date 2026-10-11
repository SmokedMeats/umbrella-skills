# Project config

Companion for every skill in this pack. Safe for phase children to read (it is not `umbrella/SKILL.md`).

Product bindings live outside this pack, in `project.yml` and an optional `standing-product-rules.md` (both from the private overlay; see the pack README **Project config**). Find each file in this order: `docs/agents/<file>` in the current repo, then `<file>` in the skills root (the folder that holds `umbrella/`, `implement/`, …; from any skill folder that is `../<file>`). The sync writes both places.

- A `project.yml` key in backticks (`commands.pr_ready`, `paths.umbrella_cursor`, `branches.dev`, …) means: use that key's value. "Rewrite `paths.umbrella_cursor`" means rewrite the file at that path.
- Placeholders: `<org>` = `org`. `<dev-branch>` = `branches.dev`. Held branches (master, Preview) = `branches.held`. `<local-dev-host>` = `ship_mode.local_hosts`. `<mobile-pkg>` = the package dir of `paths.mobile_src`. "The founder" = `founder`. The end user = `product.end_user`. Board ids = `repos[]` row whose `name` matches `git remote`. A role in backticks (`roles.device_qa`, …) is that bot lane's display name; unset `roles.device_qa` → Mobile QA.
- When `standing-product-rules.md` is present, read it once per session. Its concrete locks apply on top of every skill in this pack; each skill names the section it needs.
- **Repo agent rules.** At session start, right after `standing-product-rules.md`, read the file at `paths.agent_rules` (unset → `AGENTS.md`; skip when the file is missing). It is the repo's copy of the founder's coding standing, so a bare local session and a conducted one follow the same rules. A conductor names it in every child packet's `COMPANIONS`. A local coding child (Grok Build or an IDE agent on `<local-dev-host>`) reads it before any code. Edit that file in the product repo, not in this pack.
- No `project.yml` → stop and ask the founder to install it (template: `project.example.yml` in the umbrella-skills repo). Never invent ids, branch names, or commands. An optional key that is unset (for example `commands.graph_freshness`) turns its step off; it is not a missing config.

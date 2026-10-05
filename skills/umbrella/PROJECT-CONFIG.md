# Project config

Companion for every skill in this pack. Safe for phase children to read (it is not `umbrella/SKILL.md`).

Product bindings live outside this pack, in `project.yml` and an optional `standing-product-rules.md` (both from the private overlay; see the pack README **Project config**). Find each file in this order: `docs/agents/<file>` in the current repo, then `<file>` in the skills root (the folder that holds `umbrella/`, `implement/`, …; from any skill folder that is `../<file>`). The sync writes both places.

- A `project.yml` key in backticks (`commands.pr_ready`, `paths.umbrella_cursor`, `branches.dev`, …) means: use that key's value. "Rewrite `paths.umbrella_cursor`" means rewrite the file at that path.
- Placeholders: `<org>` = `org`. `<dev-branch>` = `branches.dev`. Held branches (master, Preview) = `branches.held`. `<local-dev-host>` = `ship_mode.local_hosts`. `<mobile-pkg>` = the package dir of `paths.mobile_src`. "The founder" = `founder`. The end user = `product.end_user`. Board ids = `repos[]` row whose `name` matches `git remote`.
- When `standing-product-rules.md` is present, read it once per session. Its concrete locks apply on top of every skill in this pack; each skill names the section it needs.
- No `project.yml` → stop and ask the founder to install it (template: `project.example.yml` in the umbrella-skills repo). Never invent ids, branch names, or commands.

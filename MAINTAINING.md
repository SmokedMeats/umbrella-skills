# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## When an overlay rule changes

Update both in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" table in `README.md`

Then copy `skills/*` into `$HOME/.grok/skills/` if you use Grok user-global, and reinstall so other IDEs pick it up:

```text
npx skills@latest add SmokedMeats/umbrella-skills -g -y --copy --full-depth -a grok -a cursor -a claude-code
```

From a dirty local clone (before push), point `add` at that folder instead of the GitHub slug.

Do **not** update or reopen a field-notes issue on `mattpocock/skills`. This repo is the SSOT.

## What belongs where

- **README** — for people who install the overlay.
- **This file** — how maintainers edit the pack.

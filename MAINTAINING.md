# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## When an overlay rule changes

Update all three in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" table in `README.md`
3. [mattpocock/skills#856](https://github.com/mattpocock/skills/issues/856) — replace the **full** issue body. A partial PATCH can wipe the issue.

Then copy `skills/*` into `$HOME/.grok/skills/` if you use Grok user-global.

## What belongs where

- **README** — for people who install the overlay.
- **#856** — field notes for Matt: the failures and the suggested upstream shape.

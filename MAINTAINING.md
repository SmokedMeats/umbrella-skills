# Maintaining this pack

For people who edit this repo. Installers can ignore this file.

## When an overlay rule changes

Update all three in the same change:

1. The skill file under `skills/`
2. The "What this pack changes" table in `README.md`
3. [mattpocock/skills#856](https://github.com/mattpocock/skills/issues/856) — replace the **full** issue body. A partial PATCH can wipe the issue.

Then copy `skills/*` into `$HOME/.grok/skills/` if you use Grok user-global.

## What belongs on #856, not the README

The issue is field notes for Matt. Keep there:

- "What not to take" (product label words, tracker recipes, do not replace one-ticket-per-session)
- Failure write-ups and suggested upstream shape

The README is for people who install the overlay.

# umbrella-skills

Field overlay on [mattpocock/skills](https://github.com/mattpocock/skills).

Matt’s pack is the skillset. This repo adds **`/umbrella`** and a few overlays so a pack of related issues cannot skip from a finished grill to a build.

Not a fork. Not a replacement. Install Matt’s skills first.

## Why this exists

Matt’s flow is:

```
/wayfinder  →  /grill-me  →  /to-spec  →  /to-tickets  →  /implement
```

On a **cluster** of grilling siblings, three things went wrong in the field:

1. Each grill ended the session. The human had to remember which child was next. `/to-spec` then synthesized the last ticket, not the map.
2. A locked grill felt like “we decided, now code.” Agents jumped to a build and skipped `/to-spec` and `/to-tickets`.
3. `/triage` stamped category + state and stopped. The pack never got a house label, so `/grill-me` could not find siblings.

`/umbrella` is the conductor. It names the house, then names the **next** Matt skill. It does not reimplement those skills.

## Install

1. Install [mattpocock/skills](https://github.com/mattpocock/skills) and run `/setup-matt-pocock-skills` once per repo.
2. Overlay this pack (overwrites the listed skills, adds `/umbrella`):

```bash
npx skills@latest add SmokedMeats/umbrella-skills
```

Grok / user-global:

```powershell
git clone https://github.com/SmokedMeats/umbrella-skills.git
Copy-Item -Recurse .\umbrella-skills\skills\* $HOME\.grok\skills\
```

3. In the consuming repo, keep `docs/agents/triage-labels.md` as the **mapping** (label strings). Put coarse `domain:*` chips and creatable `umbrella:*` houses there. That file is yours, not this pack’s.

## Order of use

Unedited skills stay in Matt’s pack. Overlays in this repo are marked.

| When | Skill | In this repo? |
| --- | --- | --- |
| Once per consuming repo | `/setup-matt-pocock-skills` | no — Matt |
| Inbox is dirty | `/triage` | **overlay** |
| Which house / which phase | **`/umbrella`** | **new** |
| Foggy effort, no map yet | `/wayfinder` (chart) | **overlay** |
| Open grilling siblings | `/grill-me` → `/grilling` + `/domain-modeling` | grill-me + grilling **overlay**; domain-modeling **Matt** |
| Fact a decision waits on | `/research` | no — Matt |
| Need a cheap artifact | `/prototype` | no — Matt |
| Grill locked | **`/to-spec`** | **overlay** |
| Spec approved | **`/to-tickets`** | **overlay** |
| Tickets approved | **`/implement`** → `/tdd` → `/code-review` | implement **overlay**; tdd + code-review **Matt** |
| Two+ unblocked implement tickets | `/implement` **wave**: draft exclusives, spawn children, then product code | same |
| “Which skill do I type?” | `/ask-matt` | no — Matt |

Three different jobs — do not collapse them:

| Who | Job |
| --- | --- |
| **`/triage`** | Labels **inbound** issues that already exist (category, state, `domain:*`, creatable `umbrella:*`). |
| **`/wayfinder`** (and `/to-tickets`) | Labels **on create** when this session files a map or child. No `needs-triage`. Does not call `/triage`. |
| **`/umbrella`** | **Catch.** Every run, if inbound unlabeled / `needs-triage` remains, **run `/triage`**. Does not stamp those labels itself. |

Hard gates:

```
every /umbrella run       →  /triage catch (then /triage if inbound is dirty)
loose idea / no map       →  /wayfinder
open grilling siblings    →  /grill-me
locked grill              →  /to-spec
approved spec             →  /to-tickets
approved tickets          →  /implement
two+ unblocked tickets    →  /implement wave (spawn first)
```

Never skip. Keep the `/triage` catch **every time**. A locked grill is not a build.

`/grill-with-docs` is still Matt’s stateful interview when you are not on a wayfinder map. `/umbrella` does not replace it.

## Domain vs umbrella

- **`domain:*`** — neighborhood. One or more. Closed catalog in *your* `triage-labels.md`.
- **`umbrella:*`** — house. Zero or one. **Create** the label when the pack is real and missing.

Many issues share `domain:billing`. Only some share `umbrella:refunds`. Do not treat the coarse domain as the pack. Creating an `umbrella:*` label does not create a wayfinder map.

## What we changed

| Skill | Change |
| --- | --- |
| `umbrella` | New conductor. Two+ unblocked tickets → `/implement` wave (spawn before product code). |
| `grilling` | Seamless sibling batch + `Now on` line. After lock: next is `/to-spec`, not implement. |
| `grill-me` | Load the map’s grilling siblings; advance without asking “next grill?” |
| `wayfinder` | Umbrella-grill exception to one-ticket-per-session. |
| `to-spec` | Spec the whole locked batch. Stop. Next is `/to-tickets`. |
| `to-tickets` | Waves + exclusive paths. Stop. Next is `/implement`. |
| `implement` | Count first. Two+ unblocked tickets: draft exclusives, spawn one child per extra ticket, then this session writes the conductor ticket. Sequential only when the exclusive table is empty. |
| `triage` | Apply every fitting `domain:*` and a creatable `umbrella:*`, not only category + state. |

## What not to take

- Anyone’s product domain vocabulary. That stays in the consuming repo’s `docs/agents/triage-labels.md`.
- Replacing Matt’s “one ticket per session” default. The umbrella grill is an explicit exception.
- Hardcoding tracker recipes. `/setup-matt-pocock-skills` still owns that.

## Credit

Inspired by, and built to sit on, [Matt Pocock’s skills](https://github.com/mattpocock/skills). Overlay files start from those skills. `/umbrella` is original to this repo.

Field notes that led here: [mattpocock/skills#856](https://github.com/mattpocock/skills/issues/856).

## License

MIT. See [LICENSE](./LICENSE).

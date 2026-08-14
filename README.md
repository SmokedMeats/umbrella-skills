# umbrella-skills

This pack adds **`/umbrella`** on top of [Matt Pocock's skills](https://github.com/mattpocock/skills).

Matt's skills do the work: `/wayfinder`, `/grill-me`, `/to-spec`, `/to-tickets`, `/implement`. `/umbrella` names the pack of issues (the **house**) and names the **next** Matt skill. A locked grill goes to `/to-spec`. It does not jump to a build.

## Why this is not a fork

A fork copies Matt's whole repo. Then every upstream change needs a merge. Then this pack looks like a replacement.

This repo is an **overlay**:

1. Install Matt's pack first. That is the skillset.
2. Install this pack second. It overwrites a few of those skills and adds `/umbrella`.
3. Unedited skills stay Matt's (`/tdd`, `/code-review`, `/research`, `/prototype`, `/ask-matt`, `/setup-matt-pocock-skills`).

Keep both. Update Matt's pack on its own schedule.

## Why this exists

Matt's flow:

```
/wayfinder  →  /grill-me  →  /to-spec  →  /to-tickets  →  /implement
```

On a cluster of related grilling tickets, three things failed:

1. Each grill ended the session. The human had to remember which child was next. `/to-spec` then wrote a spec for the last ticket, not the whole pack.
2. A locked grill felt like "we decided, now code." Agents started a build and skipped `/to-spec` and `/to-tickets`.
3. `/triage` applied only category and state. The pack never got a house label, so `/grill-me` could not find siblings.

`/umbrella` is the conductor. It does not reimplement those skills.

## Install

Preferred order (you can skip this if you go straight to `/umbrella` — it runs the same check):

1. Install [mattpocock/skills](https://github.com/mattpocock/skills). Then run `/setup-matt-pocock-skills` once in each repo.
2. Add this overlay. It overwrites the skills in the table below and adds `/umbrella`:

```bash
npx skills@latest add SmokedMeats/umbrella-skills
```

Grok / user-global:

```powershell
git clone https://github.com/SmokedMeats/umbrella-skills.git
Copy-Item -Recurse .\umbrella-skills\skills\* $HOME\.grok\skills\
```

3. In **your** repo, keep `docs/agents/triage-labels.md`. That file lists **your** label names. This pack does not ship product words.

`/umbrella` probes both of those on every run. If `setup-matt-pocock-skills` is missing next to it, it installs Matt's pack and then re-applies this overlay (Matt first, or Matt overwrites the overlay). If `docs/agents/issue-tracker.md` is missing, it runs `/setup-matt-pocock-skills` and waits — it does not invent tracker files.

## Two labels: domain and umbrella

`/triage` still applies one **category** (`bug` / `enhancement`) and one **state** (`ready-for-agent`, and the other state roles). Packs need two extra labels. You choose the words. You write them in `docs/agents/triage-labels.md`.

| Label | What it means | How many on one issue |
| --- | --- | --- |
| `domain:…` | The **area** of the product | One or more |
| `umbrella:…` | The **named pack** of related issues | Zero or one |

**Example.** Many tickets sit in billing. Only some of them are the refunds pack.

| Issue | `domain:` | `umbrella:` |
| --- | --- | --- |
| Invoice PDF is blank | `billing` | none — one-off bug |
| Refunds: restock window | `billing` | `refunds` |
| Refunds: partial capture | `billing` | `refunds` |
| Dunning: day-3 email | `billing` | `dunning` |

`domain:billing` is the neighborhood. `umbrella:refunds` is the house `/grill-me` loads. Do not treat every billing ticket as one pack.

If the pack is real and the `umbrella:…` label does not exist yet, create the label. Then apply it. That only creates a tracker label. It does **not** create a wayfinder map. The map is a separate issue with the `wayfinder:map` label.

Do not create an umbrella label for a one-off bug. Do not invent a new `domain:…` during triage. The domain list is the catalog in your mapping file.

## Order of use

Unedited skills stay in Matt's pack. Overlays in this repo are marked.

| When | Skill | This pack? |
| --- | --- | --- |
| Matt's pack or repo mapping missing | `/umbrella` prerequisite (install Matt, then setup) | **new** |
| Once per repo | `/setup-matt-pocock-skills` | no — Matt |
| Inbox is dirty | `/triage` | **overlay** |
| Which house / which phase | **`/umbrella`** | **new** |
| Foggy effort, no map yet | `/wayfinder` (chart) | **overlay** |
| Open grilling siblings | `/grill-me` → `/grilling` + `/domain-modeling` | grill-me + grilling **overlay**; domain-modeling **Matt** |
| Fact a decision waits on | `/research` | no — Matt |
| Need a cheap artifact | `/prototype` | no — Matt |
| Grill locked | **`/to-spec`** | **overlay** |
| Spec approved | **`/to-tickets`** | **overlay** |
| Tickets approved | **`/implement`** → `/tdd` → `/code-review` | implement **overlay**; tdd + code-review **Matt** |
| Two or more unblocked implement tickets | `/implement` **wave**: spawn children, then crawl later waves as they unlock | same overlay |
| "Which skill do I type?" | `/ask-matt` | no — Matt |

### Who applies labels

Three jobs. Do not merge them.

| Who | Job |
| --- | --- |
| **`/triage`** | Labels **inbound** issues that already exist (category, state, every fitting `domain:…`, and a creatable `umbrella:…`). |
| **`/wayfinder`** (and `/to-tickets`) | Labels **on create** when this session files a map or a child. No `needs-triage`. Does not call `/triage`. |
| **`/umbrella`** | **Catch.** Every run, if inbound unlabeled / `needs-triage` issues remain, **run `/triage`**. Does not stamp those labels itself. |

### Order (do not skip)

```
every /umbrella run       →  prerequisite (Matt pack + repo mapping), then /triage catch
loose idea / no map       →  /wayfinder
open grilling siblings    →  /grill-me
locked grill              →  /to-spec
approved spec             →  /to-tickets
approved tickets          →  /implement
two+ unblocked tickets    →  /implement wave (spawn first, crawl later waves)
```

A locked grill is not a build. Keep the `/triage` catch every time.

`/grill-with-docs` is still Matt's interview when you are not on a wayfinder map. `/umbrella` does not replace it.

## What this pack changes

| Skill | Change |
| --- | --- |
| `umbrella` | New conductor. Every run: if Matt's pack or the repo mapping is missing, install / run setup first. Two or more unblocked tickets → `/implement` wave. Later waves crawl as they unlock. |
| `grilling` | Sibling batch + `Now on` line. After lock: next is `/to-spec`, not implement. |
| `grill-me` | Load the map's grilling siblings. Advance without asking "next grill?" |
| `wayfinder` | Umbrella-grill exception to one-ticket-per-session. |
| `to-spec` | Spec the whole locked batch. Stop. Next is `/to-tickets`. |
| `to-tickets` | Waves + exclusive paths. Each ticket names spec + map, wears house labels, and is a child of the map. |
| `implement` | Count first. Spawn extras, then **crawl**. Before product code, backfill parent + map + house labels if create missed them. On close: drop `ready-for-agent`, append the map. |
| `triage` | Apply every fitting `domain:…` and a creatable `umbrella:…`, not only category + state. |

Matt's default stays **one ticket per session**. The umbrella grill is the exception. Tracker setup stays `/setup-matt-pocock-skills`.

## Credit

Built to sit on [Matt Pocock's skills](https://github.com/mattpocock/skills). Overlay files start from those skills. `/umbrella` is original to this repo.

Field notes: [mattpocock/skills#856](https://github.com/mattpocock/skills/issues/856).

Maintainer notes (how to keep #856 in sync): [MAINTAINING.md](./MAINTAINING.md).

## License

MIT. See [LICENSE](./LICENSE).

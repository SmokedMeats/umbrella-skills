# Glossary

Words the umbrella skills use. Words in `code` are `project.yml` keys or placeholders you fill in ([PROJECT-CONFIG.md](../skills/umbrella/PROJECT-CONFIG.md)).

## Work

| Word | Meaning |
| --- | --- |
| **Founder** | The human who owns the product. Locks grills and makes the irreversible calls. Their display name is bound in `project.yml`, never in a skill. |
| **House** | A named batch of related issues worked as one unit. It is the `umbrella:<slug>` label. Smaller than a milestone. |
| **House queue** | Several houses named in order ("work through these"). `/umbrella` finishes one house's coding, then starts the next. |
| **House crawl** | `/umbrella` keeps working a house's tickets in the same session after they are filed, without asking. |
| **Domain** | The product area an issue belongs to: the `domain:<area>` label. A house usually sits inside one domain. |
| **Parked** | The same house slug as `parked:<slug>`: wanted, but not live. Never pulled or assigned. |
| **Wayfinder map** | An issue labeled `wayfinder:map` that charts a foggy effort as decision tickets (`/wayfinder`). |
| **Grill** | The founder interview (`/grill-me`, `/grilling`). Every question has Context, Choices and a Recommend line. |
| **Pre-grill gap list** | Open questions `/umbrella` writes after reading the docs and related tickets, before the grill. |
| **Grill lock** | The founder confirms the grill with every gap closed. It is the only planning gate: spec, tickets and build follow without further approval. |
| **Rule card** | 5–15 user-language rules in the spec, each tied to a test or fixture, plus the numbers a build must hit. Build and review check against it. |
| **Wave** | Two or more tickets that can start together, each owning its own files, built by parallel sub-agents. |
| **Build loop** | Build, living-doc check, comment cleanup, `/code-review`, land gate, repeated on the same ticket until its acceptance criteria hold. |
| **Close gate** | A one-line receipt written before a ticket closes or moves lanes: land-gate SHA and risk, BV result, review result, docs, migration, lane. |
| **Window full** | The agent's context is nearly used up. It writes a recall brief and the next step, then stops. |

## Shipping

| Word | Meaning |
| --- | --- |
| `<dev-branch>` | Your daily integration branch (for example `main` or `develop`), set in `project.yml`. Pull requests target it. |
| `<local-dev-host>` | The founder's own development machine, if any, set in `project.yml`. |
| **Ship mode** | How this run ships code, pinned once at the start and never changed mid-run. **Mode A** (`Ship mode: <dev-branch>`): a local agent on `<local-dev-host>` pushes straight to `<dev-branch>` (the rare bots-off path). **Mode B** (`Ship mode: PR`): one ticket, one branch, one pull request. Cloud agents are always Mode B. |
| **Land gate** | The steps before a PR merges: `commands.pr_ready` on the exact head (it prints `risk: low` or `risk: high`), `/tech-lead-review` when the diff touches money, auth, permissions, entitlements, paid tiers, XP/economy/tokens, migrations or write routes, `/build-verifier` when risk is high or the line has no `risk:`, then a final pr-ready pass and the author's pre-merge check. |
| **`GATE:` line** | A reviewer's verdict comment on the PR: `GATE: (TL\|BV) (PASS\|FAIL) <40-char sha> agent: <name>`, with an `## Evidence` block in the same comment naming the checks run on that commit. |
| **Cloud agents** | Coding agents that run in someone else's cloud, such as Cursor cloud agents or Grok bot teammates. They always ship in Mode B. |
| **Bots off** | A session with no other bot lanes running. Declared at session start; the land gate still runs with separate reviewer agents. |
| **Founder gates** | Steps an agent never takes alone: promotes to staging or production, over-the-air app updates, database migrations, data deletion, deploy-config or CI workflow changes, and spending money. |

## Board lanes

GitHub Project Status columns, left to right. Create them with these exact names; the skills use them by name, and `project.yml` `status_options` maps each name to its option id.

| Lane | Meaning |
| --- | --- |
| **Parked** | Shelved before launch; not pulled. |
| **Unclaimed** | Filed, not started. |
| **In Progress** | An agent owns it and is building. |
| **Operator** | Code is done; a human console step is left (store listing, signing, identity-provider admin). |
| **Desk device** | Code is done; a check on a real or emulated phone is left (`/device-qa-agent`). |
| **Field** | Code is done; an outdoor, GPS or on-wrist check is left. |
| **Ready to merge** | Mode B PR waiting on the land gate. |
| **Live Beta** / **GoLive** | Must finish before a public beta / before production launch. |
| **Done** | Shipped (merged, or pushed in Mode A), and every check and QA step that applies has passed. |

**Leftover lanes** are Operator, Desk device and Field: code is done and something else is left, so they never block the next wave. **Handoff lanes** are those three plus Live Beta and GoLive: no routine coding is started on them.

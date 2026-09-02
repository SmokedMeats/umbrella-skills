# Device QA (phone probe)

SSOT for when `/umbrella` reaches Device QA after `/implement` (Build loop empty + Living docs, including a **P\*** leaf when the ship is phone-visible).

Do **not** close a phone-visible ticket just because this session has no phone. Do **not** silently skip the last leftover.

## When this runs

Phone-visible ship, checklist exists (`docs/operations/DEVICE_QA_PHASED_CHECKLIST.md`), and product ACs are PASS.

**Leaves** (desk catch-up) can run with **no** phone. That is still `/device-qa-agent` § Leaves only.

The **crawl** (Probe → Borrow → Maestro) needs exactly **one** USB `adb` device.

## Probe

```text
adb devices
```

Count lines that end in `device` (ignore `unauthorized`, `offline`, `emulator-*` unless the founder said use an emulator).

| Devices | Do this |
| --- | --- |
| **1** | Load `/device-qa-agent` (Leaves if needed, then crawl). When the crawl finishes, close per [CLOSE-PARENTS.md](CLOSE-PARENTS.md) if nothing else is leftover |
| **0** or **2+** | Do **not** crawl. Do **not** close if Device QA is the last leftover. Park the leftover (below) |

Two or more phones: same as none — do not guess which one. Note the count.

## Last leftover → Kanban (no silent skip)

If the only remaining work on the ticket is the Device QA crawl (Leaves done or posted, product closed):

1. Keep the issue **open**.
2. Drop `ready-for-agent`. Keep `umbrella:<slug>` and the milestone. Do **not** add `parked:<slug>` (that is the grill/spec shelf, not a desk wait).
3. Project Status **Desk device** ([PROJECTS.md](PROJECTS.md) option `fcd6cab4`).
4. Comment (required):

```markdown
## Waiting: Device QA

**Status:** Product done. Crawl not run. Ticket stays open on **Desk device**.

**Why:** `adb devices` was 0 (or not exactly one `device`).

**Unpark / pull when:** one Preview phone is plugged in, then `/device-qa-agent` (or `/umbrella` — it probes again).

**Do not:** close this ticket, treat it as implement frontier, or skip this leftover in chat.
```

5. Rewrite `docs/agents/UMBRELLA_CURSOR.md`: Skill `/device-qa-agent` · Step waiting on phone · Next plug in Preview.

If Device QA is **not** the last leftover (product ACs still open): stay **In Progress**, note “no phone — crawl later,” keep building. Do not move the ticket.

Not phone-visible → skip this file. Close via [CLOSE-PARENTS.md](CLOSE-PARENTS.md) as usual.

## Who runs this

| Skill | When |
| --- | --- |
| `/umbrella` | After `/implement` is product-done on a phone-visible ticket, **before** naming the house Hit or the next implement wave |
| `/implement` | Before `gh issue close` on a phone-visible ticket — probe first |

`/implement` **Count first** skips tickets already on **Desk device** / **Operator** / **Field**.

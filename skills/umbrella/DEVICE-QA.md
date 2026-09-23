# Device QA (phone probe)

SSOT for when `/umbrella` reaches Device QA during the default house crawl, after `/implement` (Build loop empty + Living docs, including a **P\*** leaf when the ship is phone-visible).

The probe is part of that crawl. Nobody arms a separate Device QA pass. Do **not** close a phone-visible ticket when this pass cannot run the crawl. Do **not** silently skip the leftover. Leave it on **Desk device** and keep coding the next unblocked ticket.

## When this runs

Phone-visible ship, checklist exists (`docs/operations/DEVICE_QA_PHASED_CHECKLIST.md`), and product ACs are PASS.

**Leaves** (desk catch-up) can run with **no** phone. That is still `/device-qa-agent` § Leaves only.

The **crawl** (Probe → Borrow → Maestro) needs exactly **one** USB `adb` device, **this** runner must be the one that sees it, and no other actor may own that phone this pass.

## Probe

```text
adb devices
```

Count lines that end in `device` (ignore `unauthorized`, `offline`, `emulator-*` unless the founder said use an emulator).

| Devices | Do this |
| --- | --- |
| **Exactly 1**, this runner can see that USB, and no other actor owns the phone | Load `/device-qa-agent` (Leaves if needed, then crawl). When the crawl finishes, close per [CLOSE-PARENTS.md](CLOSE-PARENTS.md) if nothing else is leftover |
| **Not exactly 1**, this runner cannot see USB, or another actor owns the phone | Do **not** crawl. Do **not** close. **Desk device** (below). Then crawl the next unblocked coding ticket |

Not exactly one includes 0 and 2+. Two or more phones: do not guess which one. Note the count. A Cursor cloud VM cannot see the phone even if a handset is plugged in somewhere else.

## Who may run the crawl

Device QA runs only when **this** runner can see the USB phone:

- Local AlphaTerminal, or a private worker on that same machine.
- A Cursor cloud VM cannot. Leave **Desk device**. Crawl the next unblocked coding ticket.

One **Ship mode** pin for the run. Do not open a second worktree on the same `adb` device.

If another actor owns the phone this pass (Grok Build, for example), stand down. Leave the ticket on **Desk device**. That ownership conflict pauses Device QA. It does not close the ticket. Other unblocked coding tickets stay in the house crawl.

## Last leftover → Kanban (no silent skip)

Use this when the probe says this pass cannot run Device QA. When the probe says run `/device-qa-agent`, do that. This park is for the cannot-run path.

If the only remaining work on the ticket is the Device QA crawl (Leaves done or posted, product closed):

1. Keep the issue **open**.
2. Drop `ready-for-agent`. Keep `umbrella:<slug>` and the milestone. Do **not** add `parked:<slug>` (that is the grill/spec shelf, not a desk wait).
3. Project Status **Desk device** (this board’s Desk device option in [PROJECTS.md](PROJECTS.md)).
4. Comment (required). Write it in runner language. Read `/simple-english` when that skill is installed next to this pack. Do not reimplement it.

```markdown
## Waiting: Device QA

**Status:** Product done. Crawl not run. Ticket stays open on **Desk device**.

**Why:** `adb devices` was not exactly one `device`, this runner cannot see that USB (cloud VM, or not on the machine with the phone), or another actor owns the phone this pass.

**Unpark / pull when:** exactly one Preview phone is plugged in, this runner can see that USB, and no other actor owns it. Then `/device-qa-agent` (or `/umbrella` — it probes again).

**Do not:** close this ticket, or pull **this** card as implement frontier. Dependents that were waiting on its **product** ACs are unblocked — `/implement` **Crawl** them now. Do not skip this leftover in chat.
```

5. Rewrite `docs/agents/UMBRELLA_CURSOR.md`: this ticket is Desk leftover · **Next** is the next unblocked implement wave (not “stop for phone”). List the leftover numbers so a later `/device-qa-agent` can walk them.

6. **Crawl immediately.** Desk device is leftover, not Window full. Return to `/implement` **Count first** in this session and take the next unblocked coding ticket. A GitHub `blocked_by` that is already Desk device does **not** hold the next wave. **Ready to merge** still holds its dependents.

Living docs must already be on the ticket (including the **P\*** leaf). No Living docs comment → do not park.

If Device QA is **not** the last leftover (product ACs still open): stay **In Progress**, note that this pass cannot run the phone crawl, keep building. Do not move the ticket.

Not phone-visible → skip this file. Close via [CLOSE-PARENTS.md](CLOSE-PARENTS.md) as usual.

## Who runs this

| Skill | When |
| --- | --- |
| `/implement` | Before `gh issue close` on a phone-visible ticket — probe first. After Desk device, keep `/implement` (next wave) |
| `/umbrella` | Same probe. After Desk device, **do not** wait on the picker — stay on `/implement` crawl if any product ticket is still unblocked |

`/implement` **Count first** does not **pull** leftover-lane cards. It **does** treat them as satisfied blockers. Desk device is one leftover lane; any other leftover lane uses the same crawl rule — [PROJECTS.md](PROJECTS.md). This file is only the phone probe.

## Ship mode and hardware

- **Mode B** (Grok Bot / Cursor cloud, `Ship mode: PR`): phone-visible leftover stays on **Desk device**. Do **not** crawl hardware from the cloud VM. Then crawl the next unblocked coding ticket.
- **Mode A** on the machine that has the phone, exactly one `device`, this runner sees that USB, and no other actor owns it: Probe → Borrow → Maestro.
- One Ship mode pin. No second worktree on that `adb` device. Another actor on the phone this pass → stand down, **Desk device**, keep coding elsewhere.

---
name: device-qa-agent
disable-model-invocation: true
description: >-
  use this when walking Owner: manual agent checklist leaves on a Preview phone
  (or the configured Desk emulator) with Maestro: Desk device or Field outdoor.
  Leaves first, then probe → borrow → crawl → return → propose STATUS_MOVES.
  Parent applies Status after device-qa-verifier; do not advance Project Status
  yourself under umbrella-mode. Same lane runs Field outdoor (no separate Field
  bot) and drafts Field packs when asked.
---

# Device QA agent

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](../umbrella/PROJECT-CONFIG.md).

**Product notes.** When the private overlay installs `PRODUCT.md` next to this file, read it before Probe. It names the app package, the account env keys and PIN rules, the on-phone screenshot folder, the archive command, the Maestro how-to, device quirks, and seed recipes. This file is the flow; `PRODUCT.md` is the facts.

**Leaves** first (desk). Then walk **Owner: manual agent** leaves on a connected Preview phone. Do not write product code. Do not fix fails in this session. Keep going until every asked agent leaf is Pass / Fail / N/A / Skip, or they say **stop**. Do not pause for permission to continue.

**Phone checkout:** after Probe, **Borrow** snapshots the owner's Android settings, keeps the screen on, and delays the secure lock so Maestro is not thrown at the PIN keypad mid-crawl. It does **not** delete the PIN. It also finds or creates the dedicated on-phone screenshot folder (`PRODUCT.md`) and stores crawl shots only there. On complete, "stop", or a dead session, **Return** restores the snapshot, deletes files in that folder (not the folder), and drops the lock.

Checklist SSOT: `paths.device_qa_checklist` (Process + standing OTA smoke at the top). Issue labels: [FILE-ISSUES.md](FILE-ISSUES.md) + repo `docs/agents/triage-labels.md`. Skip blocked dependents: [SKIP-BLOCKED.md](SKIP-BLOCKED.md). Phone probe and the Desk emulator: [DEVICE-QA.md](../umbrella/DEVICE-QA.md).

## Hard gates

- **Leaves** is desk-only. From **Probe** on: exactly **one** `adb` device (a USB phone, or `device_qa.desk_emulator` for a Desk crawl). Missing or more than one → stop (Leaves already finished).
- **Host lease.** When `paths.agent_rules` names an awake / lease step for Device QA, check in before Probe and check out after Return, including on stop.
- **Borrow** the phone before the first tap. **Return** it on complete, on "stop", or if the session dies. Restore is mandatory.
- Screenshots go only in the dedicated on-phone folder. Never `screencap` into DCIM / Pictures / Screenshots. **adb pull** fail evidence into the dated run folder **before** Return.
- Never `pm clear`. Never `git checkout`, `git add`, `git commit`, `git restore`, or `git clean`.
- Never edit `src/`, `backend/src/`, or auth-critical files. **Leaves** may append **P\*** rows to the checklist (desk, before borrow). After borrow: ticks and the dated run folder only.
- A Fail stays `[ ]`. If it fits the ticket that leaf already names, comment that ticket and set it **In Progress**. File a new issue only when the fail does not fit that ticket ([FILE-ISSUES.md](FILE-ISSUES.md)). Then **Skip** later agent leaves that need that leaf's result. Continue at the next **independent** leaf. Record only; no fix PR here.
- **Schedules revert.** Any cron or schedule turned on or sped up for this run is returned to its normal state when the run ends. This skill owns the revert. `standing-product-rules.md` may name them.

## 1. Leaves

Desk. No `adb`. No borrow. Catch up the checklist so this crawl (and the next OTA **OΔ**) has something to walk. `/implement` **Living docs** still writes the leaf at ship; this step is catch-up when that was skipped.

**Since:** newest dated folder in the run-folder root (`PRODUCT.md`), or the last Preview OTA SHA. Ask if both are missing.

1. `git log` that range. Phone-visible = new or changed screen, flow, gate, HUD, recap, settings. Also closed implement tickets and map fragments in that range.
2. Open the ship-leaf phase in the checklist. A ship is covered when an existing **P\*** leaf already names that surface.
3. For each uncovered phone-visible ship: append a **P\*** leaf. Shape and next id: Process **When a feature ships** in that file. Default **Owner: manual agent.** unless the Do is human-only.
4. Types-only and backend-only with no client UI: skip. Inventory from git / tickets / map fragments.

**OΔ:** the ids you appended, plus any existing ship leaf this OTA already shipped. For `ota-smoke`, that list is the delta. Named clusters still get this catch-up; this session crawls only the named playlist.

Completion: every phone-visible ship in the since-range either already had a **P\*** leaf or you appended one. Posted **Leaves:** id list, or **Leaves: none**. Phone still not borrowed.

## 2. Probe

1. `adb devices` → one `device` per the hard gate. Maestro on PATH. Desk emulator: boot it first per `paths.desk_avd_runbook`.
2. Load test accounts from the env files `PRODUCT.md` names. Never print passwords or PINs.
3. Say which **emails** you will use (primary + which tier keys exist). Never echo a password.

Completion: one device, accounts loaded, you named the emails.

## 3. Borrow

Run the overlay's Borrow script (`scripts/phone-borrow.*`, pass the repo root). It snapshots current Android settings, then sets animations to `0`, stay-on while plugged, a long screen-off timeout, a long lock-after timeout, wakes and dismisses keyguard for this session only, and finds or creates the screenshot folder (with `.nomedia`). It writes the session JSON and a lock under `.scratch/`. If a lock exists from another live session, stop. No script installed → do those steps by hand and write the snapshot yourself. Never `settings put` a key that is not in the snapshot.

Completion: Borrow printed `borrowed` and the screenshot dir, and the snapshot file exists.

## 4. Sign in

Use the app package and the account-per-tier table in `PRODUCT.md`. Prefer existing Maestro sign-in flows. System lock / Bouncer: try the device PIN **once**. In-app PIN: try the app PIN **once**, then password sign-in. Do not grind either keypad. Kicked to sign-in: password path. Stay in-session. No `pm clear`.

Completion: Home (or the leaf's start screen) is visible for the chosen account.

## 5. Crawl

Default / `full`: next open **P\*** `**Owner: manual agent.**` leaves, top to bottom. **Skip `O1`–`OΔ`** (OTA playlist only). Skip `**Owner: manual human.**`. Skip **iPhone:** leaves on an Android kit (N/A).

Cluster `ota-smoke`: walk the **O\*** rows plus **OΔ** (the **Leaves** id list). Do/Expect on the linked **P\*** leaf. Tick the **O\*** box, not a second copy of the P leaf, unless they asked to tick both. Write those ids in the run `NOTES.md`. Other named clusters unchanged.

Screenshots: the overlay's screenshot script, named by leaf id. Device quirks (nav keys, IME, coordinates) and seed recipes: `PRODUCT.md`.

For each remaining open agent leaf:

1. Wake if needed. Close system dialogs. Do not wipe the app.
2. **Skip (blocked)** when the Do cannot be done honestly: a prior Fail, or a missing precondition that leaf was supposed to create, is still absent. Leave `[ ]`, keep the Owner tag, append the Skip line from [SKIP-BLOCKED.md](SKIP-BLOCKED.md), list it under **Skipped (blocked)** in `REPORT.md`. Continue at the next **independent** agent leaf.
3. Do the leaf **Do / Expect**.
4. **Pass** → in the checklist, change `- [ ] **P…**` to `- [x]` and append ` **Pass YYYY-MM-DD agent.**` Keep the Owner tag.
5. **Fail** → leave `[ ]`. Append ` **Fail YYYY-MM-DD agent:**` plus one line. Capture a screenshot named by leaf id. **adb pull** it into the run `screenshots/` folder **now**; Return deletes the on-phone copies. Write a row in the run `FAILS.md` (leaf id, what you saw, repo screenshot path). If the fail fits the ticket that leaf already names, comment that ticket and set Status **In Progress**. Do not open a new issue. File one new issue only when the fail does not fit that ticket ([FILE-ISSUES.md](FILE-ISSUES.md)). Put the ticket or new issue number on the Fail line. Then **Skip** later open agent leaves that need this leaf's result.
6. **N/A** → append ` **N/A YYYY-MM-DD agent:**` plus why. **Skip (blocked)** is a separate outcome; list those under Skipped (blocked), not N/A.

Run folder: `<run-root>/YYYY-MM-DD-agent/` (pulled fail screenshots, hierarchies, `FAILS.md`, `REPORT.md`). Pass / noise shots stay on the phone only until Return deletes them. Do not dump the owner's gallery into git.

Completion: every asked agent leaf is Pass, Fail, N/A, or Skip, or they said **stop**, or there is no device.

## 6. Return

Pull any remaining fail screenshots first. Then run the overlay's Return script (`scripts/phone-return.*`). It turns stay-awake off, deletes files inside the screenshot folder (keeps the folder and `.nomedia`), restores the snapshot, and deletes the lock + snapshot. Snapshot missing → it still clears that folder and restores Android defaults; say that. Desk emulator: kill it after Return. Then revert any schedule this run turned on or sped up, and check out the host lease.

Completion: Return printed `returned`. The owner's screen-off and PIN-after-timeout are back. Schedules are back to normal.

## 7. Summarize

Always, including a mid-cluster stop. Fill `REPORT.md` and say it in chat:

| | |
| --- | --- |
| Leaves | ids appended this session, or none |
| Stopped because | cluster done / user stop / no device |
| Device | USB phone or Desk emulator serial; borrowed → returned (yes/no) |
| Account emails used | no passwords |
| Pass | leaf ids |
| Fail | leaf ids + one line each + `FAILS.md` path |
| N/A | leaf ids |
| Skipped (blocked) | leaf id · blocked-by leaf · issue URL (or the no-precondition note) |
| Untouched agent leaves | ids still open (not yet reached; a Skip is reached) |
| Issues | ticket sent back to In Progress, or one new issue URL when the fail did not fit that ticket |
| Schedules reverted | names, or none touched |
| STATUS_MOVES (proposed, unapplied) | ticket → proposed Status + why (parent applies after verifier) |

## 8. Propose Project Status moves (off Desk device or Field), do not apply

**Required** after Return + Summarize when this crawl finished the Device QA wait for one or more tickets on **Desk device** or **Field**.

Under **umbrella-mode** (and whenever a parent is conducting): **propose only**. Do **not** advance Project Status. Do **not** `gh issue close` for Desk-device or Field clearance. The one Status write you make is a Fail sending its ticket (or its one new issue) to **In Progress** (step 5). Parent applies moves **only after** `device-qa-verifier` Pass (or an explicit founder / CoS skip-verify for that run).

Every existing issue this pass walked gets **one GitHub comment**: date, device, leaf id, outcome, one line of what you saw, and the proposed lane.

### Off Desk device

For each ticket whose Desk-device wait this session resolved, pick **one** proposed next Status:

- Outdoor run / on-wrist / goldens / location-only ACs still needed → **Field** (issue stays OPEN; add the calendar-wait label (`PRODUCT.md`) when a calendar or season still blocks and cannot pass with injected time)
- Store console / signing / auth-provider dashboard leftover → **Operator** (OPEN)
- Must finish before public live beta → **Live Beta** (OPEN)
- Must finish before production store ship → **GoLive** (OPEN)
- Nothing left → **Done** (parent closes after apply; only Done closes)
- Skip or N/A because this desk pass cannot run it yet → stays **Desk device**
- Acceptance boxes still open, or the leaf is one part of a parent → comment only, no move
- Issue already closed → comment only; do not reopen

Default when unsure: **Field** if outdoor proof remains, else **Done**.

### Off Field

- Field ACs clear → **Done** (or next leftover: Operator / Live Beta / GoLive)
- Outdoor or season still honestly blocked → stay **Field** + keep the calendar-wait label (never Parked for a date/season hold; never invent Pass)
- Product fail found outdoors → same Fail rules (ticket back to **In Progress**, or one new issue)

Emit in Summarize / the return packet:

| Ticket | Proposed Status | Why |
| --- | --- | --- |
| #n | Field \| Operator \| Live Beta \| GoLive \| Done \| Desk device | one line |

Mark the block `STATUS_MOVES — UNAPPLIED` and hand it to the parent. If the founder said **stop** mid-crawl, propose no move for unfinished tickets.

### Standalone (no conductor)

Invoked with no parent packet and the founder said "you own Status": you may apply the moves yourself, but only with RUN_FOLDER + REPORT.md written. Prefer proposing.

## 9. Field outdoor crawl (same lane)

**When:** tickets already on **Field** (after Desk Pass / verifier Pass), or the parent asked for Field outdoor ACs. Same phone exclusivity: one Device QA session on the phone.

**Same path:** Probe → Borrow → Sign in → Crawl → Return → Summarize → Propose STATUS_MOVES (§8 Off Field). Skip Leaves unless asked. Prefer a USB-connected phone + Maestro outdoors when the kit allows. If USB cannot stay attached for a real outdoor walk, stop and escalate to the founder (or CoS when bots are on). Do not invent Pass. The Desk emulator never runs Field.

### Field pack (asked → you draft)

When the founder (or CoS when bots are on) asks for a Field outdoor pack: draft or refresh the walk sheet + kit checklist from the live Field backlog. The asker owns delivery. Prefer an existing walk sheet as the Field playlist. Do not invent Passes.

### Field honesty rules

- Location / outdoor / GPS ACs need real Field proof. A Preview-only clock override (`PRODUCT.md`) never passes them.
- **Injected / fake time:** when the founder (or CoS) said a ticket can pass with injected time, do it. Seed blockers that are not clock-only are not clock workarounds.
- **Calendar-wait label** (`PRODUCT.md`): calendar/season waits stay **Field** (or leftover) + that label, never Parked.
- **Clock / season / route / env blockers:** before Fail, escalate to the founder (or CoS when bots are on) for a workaround. Do not silent-fail those classes.

Field crawl focus: walk only the outdoor / on-wrist / GPS Field ACs named on the ticket or checklist. Same Fail rules. Run folder `…-agent/` or `…-field/`. Tag REPORT.md `lane: Field`.

Completion: every asked Field AC is Pass, Fail, N/A, Skip, or still-wait (calendar-wait label kept), or they said **stop**.

## Parallel with coding agents

The phone is exclusive. The worktree is shared: you dirty the checklist (**Leaves** + ticks) and the run folder. Coding agents keep `src/`. If the checklist is mid-edit in another session, write ticks into the run `REPORT.md` and say so.

Android-first. **iPhone:** leaves → **N/A** on an Android kit. After a declared-done full pass or an OTA smoke, archive per `PRODUCT.md`.

# Umbrella delegation — packet in / receipt out

Bindings: `project.yml` keys in backticks, `<dev-branch>`-style placeholders, and `standing-product-rules.md` resolve per [PROJECT-CONFIG.md](PROJECT-CONFIG.md).

**Date:** 2026-09-28 (America/Chicago). Dispatch refresh 2026-10-03 (pstack 0.15.9, fresh child + respawn once).  
**Status:** Live — `workflows/umbrella/DELEGATION.md` (sibling of `SKILL.md`)  
**Sources:** `umbrella-mode-design-2026-09-28.md` §3–§3b; live spine skills; CoS rooms Verify / Umbrella / Implement

---

## Shared schema

### Packet in (parent → child)

```text
GOAL           one sentence (outcome for this phase only)
HOUSE          umbrella:<slug> · House queue head · milestone title
SHIP_MODE      <dev-branch> | PR   (read-only; child never rewrites)
PHASE          chart | fog | grill-prep | spec | tickets | build | build-verify | code-review | device-qa | device-qa-verify | how | why | …
TICKETS        numbers + URLs (live only; parked listed separately if relevant)
POINTERS       paths: `paths.umbrella_cursor`, map/spec URLs, gap list, exclusives, run folder
SKILL_PATH     absolute or repo-relative path to THIS phase SKILL.md only
COMPANIONS     only files that skill already names, always incl. PROJECT-CONFIG.md (never umbrella/SKILL.md)
FORBIDDEN      always include: no umbrella/SKILL.md; no merge/promote/OTA/migrate;
               no AskQuestion to user (escalate); no Ship mode rewrite; no Claim rewrite
ACCEPTANCE     checkable exit criteria for this phase
REPORT_SHAPE   fields required in receipt out (below + role extras)
DISPATCH       Cursor Task | Grok bot lane | inline receipt   (parent picks; see hybrid note)
```

### Receipt out (child → parent)

```text
STATUS         done | blocked | needs_parent | partial
ARTIFACTS      issue numbers, file paths, PR URLs (pointers, not dumps)
RECEIPTS       exact gh/commands run (parent may re-verify)
GAPS_OPEN      none expected after to-spec; else list
ESCALATE       questions only user/parent can answer (no silent guess)
NEXT_HINT      what child believes next skill is (parent re-detects; hint is NOT law)
CURSOR_PATCH   optional suggested fields for UMBRELLA_CURSOR (parent writes)
```

**Law:** Return packets are inputs. Parent always re-detects phase from GitHub labels. Missing RECEIPTS → treat as `partial` and re-verify. Refuse spawn if GOAL, SKILL_PATH, ACCEPTANCE, or FORBIDDEN are empty. For to-tickets / implement-ticket / build-verifier: also refuse or fail-closed when required live-ticket AC pointers are empty (see role packets). For **to-spec** / **to-tickets**: parent refuses next spawn (and treats return as `partial`) when `CARRY_FROM_GRILL` / `CARRY_FROM_SPEC` is empty or lists `missing≠none`.

**Fresh child.** New work is a new child: the next phase, a fix round, a retry, the next ticket. Put the original brief, later directives, and the prior receipt in that packet. Resume the same child only when the next step needs its checkout, its uncommitted edits, or a process it still runs. Device QA on a borrowed phone is that case. Do not resume a finished child because the thread is convenient.

**Brief opening order.** Standing rules, then the rule card; the changing part (ticket, files, findings) last. Same opening every brief so briefs within the hour share a cached prefix.

**Respawn once.** If a verifier or review receipt drops a field the brief required (SHAs, commands, AC pointers, RUN_FOLDER), respawn that child once with the same packet. A second miss is a gap. A gap is not a pass.

**Kids must NOT load full umbrella.** Child reads `SKILL_PATH` + named `COMPANIONS` only. `SKILL_PATH` is never `umbrella/SKILL.md` (implement / code-review kids get `BUILD-STANDING.md` as a companion). Pasting `umbrella/SKILL.md` into a Task/bot prompt is an anti-pattern.

---

## Role packets

### 1. wayfinder

| | |
| --- | --- |
| **Delegate?** | Yes (chart / fog work) |
| **Parent keeps** | Phase detect, claim, House queue, Ship mode, grill lock |
| **Dispatch** | Prefer Cursor Task (`generalPurpose` / `umbrella-phase`); Grok **Umbrella Phase** OK for durable chart catch-up |

**In (extra):**
```text
DESTINATION    named outcome for this effort
MAP            existing wayfinder:map # or “none — chart”
FOG_TICKETS    live research/prototype/task #s (not parked)
DOMAIN_LABELS  domain:* to stamp on create
```

**Out (extra):**
```text
MAP_ISSUE      # + URL (created or updated)
CHILDREN       #s created/updated + wayfinder:* labels
REMAINING_FOG  live fog left
PARKED         Later:/Leftover: #s with When-to-do-this present
```

**FORBIDDEN extras:** no product code; no `/grill-me` interview; no implement commits.

---

### 2. how / why (Investigate)

| | |
| --- | --- |
| **Delegate?** | Yes |
| **Dispatch** | Cursor `explore` / readonly Task **or** Grok **Investigate** (durable how/why lane) |

**In (extra):**
```text
QUESTION       exact user/parent question
SCOPE_PATHS    dirs/files to prefer
EVIDENCE       how: architecture/runtime; why: git/PR/issues/docs as needed
MODE           how | why | both (teach weave only if asked)
```

**Out (extra):**
```text
ANSWER         senior-engineer explanation (not annotated dump)
CITED          file:line / commit / PR / issue pointers
OBSERVED_VS_INFERRED  explicit split (required for why)
UNKNOWN        holes not filled
```

**FORBIDDEN extras:** no product edits; no git write; no status/lane moves.

---

### 3. to-spec

| | |
| --- | --- |
| **Delegate?** | Yes — only after grill locked on parent |
| **Dispatch** | Cursor Task preferred for one-shot publish; Grok **Spec Tickets** / Spec Writer for draft-then-parent-file |

**In (extra):**
```text
GRILL_LOCK     kit/grill page + confirmation that lock is user-confirmed
GAP_LIST       path or issue cites; every gap closed|deferred|cut
SIBLINGS       grilling siblings in this batch (whole-house spec)
```

**Out (extra):**
```text
SPEC_ISSUE         # + URL (must wear labels `spec` + `ready-for-agent`)
CITE_LIST          every locked decision / closed gap → answered|deferred(+ticket)|cut(+reason)
CARRY_FROM_GRILL   locked_count=N; deferred=[…]; cut=[…]; missing=none   (required)
RULE_CARD          rules=N (5–15); bar=present|n/a; harness=<command>|none   (required)
PARKED_CHECK       Later: children exist with When-to-do-this (or none)
```

**FORBIDDEN extras:** no interview; no spec-approval wait; no product code; if any gap open → STATUS=needs_parent, do not publish.
**Refuse publish** if any locked decision is missing from the cite list / `CARRY_FROM_GRILL` (`missing≠none` or field empty).

---

### 4. to-tickets

| | |
| --- | --- |
| **Delegate?** | Yes — after spec published |
| **Dispatch** | Cursor Task preferred; Grok Ticket Filers / Spec Tickets for draft+receipt |

**In (extra):**
```text
SPEC           spec issue # / body pointer
MAP            map # if any
HOUSE_LABELS   umbrella:<slug> + domain:*
AC_RULE        live tickets need ## Acceptance criteria ≥2 checkable done-looks-like boxes (see /to-tickets)
```

**Out (extra):**
```text
TICKETS                #s + What-to-build present
ACCEPTANCE_CRITERIA    per live ticket: present + checkbox count (≥2) or body pointer
CARRY_FROM_SPEC        each in-scope locked decision / user-story → ticket#(s)+AC | parked# (+When)
WAVE                   unblocked set for first implement wave
EXCLUSIVES             suggested globs per ticket (parent confirms)
BLOCKED_BY             GitHub blocked-by links set (receipts)
```

**FORBIDDEN extras:** no ticket-approval wait; no product code; no git; no close.
**Refuse publish/spawn path** if any live (`ready-for-agent`) ticket has empty / placeholder-only / task-only ACs — fix bodies first; STATUS=needs_parent until every live ticket has real `## Acceptance criteria`.
**Refuse publish** if a locked in-scope decision has neither an AC nor a parked/deferred pointer — `CARRY_FROM_SPEC` required; empty → STATUS=needs_parent.

---

### 5. implement-ticket (extras kid)

| | |
| --- | --- |
| **Delegate?** | Yes — one Task per extra ticket; conductor ticket + shared stays parent |
| **Dispatch** | **Cursor Task** (default for code). Grok **Implement Worker** only when durable room lane needed; still no git from kid |

**In (extra):**
```text
TICKET         # + body + ACs
RULE_CARD      the spec's rule card (or its link) + harness command; brief stays near 2 KB
EXCLUSIVES     file globs this kid may touch
FROZEN_SHARED  paths kid must not edit (conductor owns)
CHILD_RULES    no git; no merge; seam test; no type workarounds; Ship mode read-only
BUILD_VERIFIER inline|separate   (if inline: emit build-verifier receipt block at end)
COMPANIONS     BUILD-STANDING.md (named companion; never umbrella/SKILL.md as SKILL_PATH)
```

**Empty AC:** if the live ticket lacks `## Acceptance criteria` with ≥1 real checkbox → STATUS=`needs_parent` **before coding**. Do not invent ACs from chat; parent/`/to-tickets` repairs the body.

**Out (extra):**
```text
FILES_TOUCHED  exclusive-only list
VERIFY         typecheck/test summary (pointer)
SEAM_TEST      path or N/A reason
HARNESS        the card's harness summary line, or none
BUILD_RECEIPT  optional embedded VERDICT if inline build-verifier
NO_GIT         confirmed
```

**FORBIDDEN extras:** no git; no shared-file edits; no Project Status; no Device QA; no close/lane (parent after build-verifier + code-review empty).

---

### 6. code-review

| | |
| --- | --- |
| **Delegate?** | Yes — own judgment kid; **never merge into verifiers** |
| **Dispatch** | Cursor Task (parallel Standards/Spec axes); Tech Lead Grok is ship gate, not a substitute |

**In (extra):**
```text
DIFF_BASE      commit/branch/merge-base
ISSUE_SPEC_GRILL  ticket + spec + grill pointers
RULE_CARD      the spec's rule card + harness output; ROUND=1|2 (no round 3)
STANDARDS_PATHS  repo coding-standards docs
COMPANIONS     BUILD-STANDING.md (named companion; never umbrella/SKILL.md as SKILL_PATH)
```

**Out (extra):**
```text
STANDARDS      findings[]
SPEC           findings[] (incl. blast-radius fact + command evidence)
IN_SCOPE       findings that re-enter Build loop on same tickets
OUT_OF_SCOPE   noted, not blocking
```

**FORBIDDEN extras:** no product “drive-by” fixes unless packet says fix-in-loop; no Device QA; no mechanical gap-check essay (that is build-verifier).

---

### 7. build-verifier

| | |
| --- | --- |
| **Delegate?** | Yes — after implement product lands, **before** close/lane |
| **Dispatch** | Cursor Task `build-verifier` (`readonly`) **or** inline end-of-ticket receipt; Grok **Build Verifier** in Verify room for standing auditor pings |

**In (extra):**
```text
TICKET         number + URL + body pointer
TICKET_ACS     checklist pointer from ticket body (`## Acceptance criteria` + `- [ ]`/`- [x]` items)
GRILL_LOCK     kit/grill page the ticket names
SPEC           spec issue # / Problem Statement pointer
SEAMS          untrusted bag? flaky outbound HTTP? JSON.parse/webhook/native dict?
PHONE_VISIBLE  yes|no
DIFF_BASE      first-ship SHA or exclusive file list
```

**Missing ACs:** if ticket body has no checkable AC list → VERDICT=`fail`, BLOCK_CLOSE_OR_LANE=`true` (mechanical miss — cannot audit).

**Checks (all PASS or N/A-with-reason):**
1. Gap-check vs grill + spec + ticket ACs  
2. Effect-TS when SEAMS require  
3. Effect Schema inventory when SEAMS require  
4. Living-docs **P\*** leaf when PHONE_VISIBLE  
5. Seam test present when seam changed  
6. No new type workarounds without ticket-named exception  

**Out (extra):**
```text
VERDICT              pass | fail
FINDINGS[]           mechanical receipt misses only
BLOCK_CLOSE_OR_LANE  true | false
```

**FORBIDDEN extras:** no product edits; no Maestro/adb; no Project Status; no Standards/Spec judgment essay; **not** Device QA.

**Parent gate:** close/lane only when VERDICT=pass **and** code-review Build loop empty **and** Close gate line complete in UMBRELLA_CURSOR.

---

### 8. device-qa-agent

| | |
| --- | --- |
| **Delegate?** | Yes — specialized loop **after parent Probe PASS** |
| **Dispatch** | Local Cursor Task / custom `device-qa-agent` **or** Grok **Mobile QA Engineer** (Ship/Verify). **Never cloud** |

**In (extra):**
```text
PLAYLIST       full | ota-smoke | P5.2 | …
TICKETS        Desk-device ticket #s this crawl should clear
RUN_FOLDER     docs/operations/device-qa-runs/YYYY-MM-DD-agent/
COMPANIONS     FILE-ISSUES.md, SKIP-BLOCKED.md, DEVICE_QA_PHASED_CHECKLIST.md,
               MAESTRO_FIX_LOOP.md, phone-borrow/return scripts
```

**Out (extra):**
```text
STATUS         done | stop | blocked_no_device | partial
LEAVES         P* ids appended or none
RUN_FOLDER     path
REPORT         REPORT.md path
FAILS          FAILS.md path or none
PASS / FAIL / SKIPPED / N_A   leaf tables
RETURN         borrowed|returned|lock_conflict + session evidence
DIFF_SCOPE     checklist + run folder only
STATUS_MOVES   proposed ticket → Field|Operator|Live Beta|GoLive|Done (+ why)
               *** UNAPPLIED — parent applies after device-qa-verifier Pass ***
```

**FORBIDDEN extras:** no `umbrella/SKILL.md`; no `src/` / `backend/src/` edits; no git; **no Project Status writes**; no `gh issue close`; no second Borrow if lock held; no AskQuestion.

---

### 9. device-qa-verifier

| | |
| --- | --- |
| **Delegate?** | Yes — after device-qa returns, **before** Desk-device Status advance |
| **Dispatch** | Cursor Task `device-qa-verifier` (`readonly`) **or** Grok **Device QA Verifier** in Verify room |

**In (extra):**
```text
RUN_FOLDER     path from device-qa return
CHECKLIST      DEVICE_QA_PHASED_CHECKLIST.md
FAIL_URLS      claimed Fail → issue URLs
RETURN_CLAIM   return packet fields
STATUS_MOVES   proposed (unapplied) list to gate
```

**Checks (all must PASS):**
1. Checklist ticks vs run folder / REPORT.md  
2. Fail → exactly one GH issue (exists, no dup leaf issues)  
3. Blocked dependents Skipped per SKIP-BLOCKED  
4. Return ran (lock/session cleared or restore evidence; Fail shots in run `screenshots/`)  
5. No product-code edits (`src/`, `backend/src/` clean)  

**Out (extra):**
```text
VERDICT             pass | fail
FINDINGS[]
BLOCK_STATUS_MOVES  true | false
```

**FORBIDDEN extras:** **never re-tap** (no Maestro, Borrow, `adb shell input`); no gap-check grill/spec (that is build-verifier); no Status apply.

**Parent gate:** Project Status off Desk device **only** when VERDICT=pass (or CoS explicit skip-verify for that run). Default verify-on.

---

## Ownership quick table

| Action | Who |
| --- | --- |
| Grill + lock confirm | Parent / CoS only |
| Phase detect / UMBRELLA_CURSOR / Claim / Ship mode | Parent |
| Write `## Acceptance criteria` on live tickets | **to-tickets** at publish (Ticket Filers / Spec Tickets face); implement repairs only if missing before code |
| Carry grill→spec→tickets (locked decisions) | **Spec Writer** (`to-spec` / `CARRY_FROM_GRILL`) then **Ticket Filers** (`to-tickets` / `CARRY_FROM_SPEC`); parent refuses spawn if those CARRY fields empty / missing≠none |
| Probe adb / USB / phone ownership | Parent |
| Apply `STATUS_MOVES` off Desk device | Parent after device-qa-verifier Pass |
| Close / leftover lane after Build loop | Parent alone, after Close gate complete + build-verifier Pass + code-review empty |
| Merge / FF / migrate / OTA / master | CoS / the founder only |

---

## Hybrid dispatch (standing note)

| Work | Prefer |
| --- | --- |
| Code / implement extras / code-review axes / one-shot phase publish | **Cursor Task** kids |
| Durable lanes that need rooms (Verify, Umbrella, Investigate) | **Grok bots** |
| Phone crawl | Local Task **or** Mobile QA Grok — never cloud |
| Verifiers | Cursor readonly Task **or** Verify-room Grok bots (already created) — same packet either way |

Do **not** dual-truth: one implement return gets **one** build-verifier verdict (inline **or** Task/bot, not both competing).

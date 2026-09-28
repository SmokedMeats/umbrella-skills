---
name: umbrella-mode
description: >
  Sticky conductor mode for /umbrella. Parent owns grill, phase detect, claim,
  UMBRELLA_CURSOR, Founder gates, and implement conductorship. Phase skills run
  as Task/bot subagents with scoped packets so children never load the full umbrella
  loop stack. Use for /umbrella-mode, long house crawls, or when context must stay thin.
mode: true
disable-model-invocation: false
---

# Umbrella mode

## Non-negotiables

1. **/umbrella remains the only front door.** This mode does not invent a second conductor.
2. **Parent owns:** phase detect, Ship mode pin, claim, `UMBRELLA_CURSOR.md`, grill-me,
   Founder gates, house-queue advance, implement conductor (shared + git), Device QA
   **probe**, ticket close/lane after **Close gate** complete + **build-verifier** Pass, and Project Status advances
   **off Desk device** (from **device-qa-verifier** receipts only).
3. **Phase work is delegated** via Task or durable Grok lane with a context packet.
   Child reads **one** phase `SKILL.md` (+ that skill’s normal companions).
   Child must **not** read `umbrella/SKILL.md`.
   Build standing lives in companion [BUILD-STANDING.md](../umbrella/BUILD-STANDING.md).
4. **Return packets are law inputs, not law.** Parent re-detects phase from GitHub labels.
5. **No irreversible ship without CoS.** Merge / FF / migrate / OTA / master stay paused.
6. **No poteto install.** Do not add poteto-mode / poteto-agent to this pack.

## Spine (unchanged)

```text
/umbrella → /triage catch → /wayfinder → pre-grill → /grill-me (parent)
         → /to-spec → /to-tickets → /implement (conductor parent + child extras)
```

## Task / bot dispatch rules

- After `Next: /<skill>` (except grill-me, handoff, and conductor-owned implement work):
  1. Write `UMBRELLA_CURSOR` (parent).
  2. Build context packet ([DELEGATION.md](../umbrella/DELEGATION.md) when installed; else design schema).
  3. Spawn: Cursor Task (`generalPurpose` / `umbrella-phase`) **or** matching Grok bot lane.
  4. On return: verify receipts; apply CLOSE-PARENTS / Project / cursor rewrite; re-detect.
- Implement wave 2+: one child per extra ticket; parent owns shared + git.
- **build-verifier:** after implement product lands, before close/lane — inline receipt
  **or** Task/bot `build-verifier` (readonly). Not Device QA. Not code-review.
- **code-review:** own kid (judgment); findings re-enter Build loop. Do **not** merge into verifiers.
- **Device QA:** parent Probe first. On PASS → `device-qa-agent` packet. On return →
  `device-qa-verifier` (readonly, no phone). Parent applies `STATUS_MOVES` only when
  verify Pass (or CoS skip-verify). On probe FAIL → Desk device Waiting; keep coding.
- Refuse spawn if GOAL, SKILL_PATH, ACCEPTANCE, or FORBIDDEN are empty. For to-tickets / implement-ticket / build-verifier: also refuse or fail-closed when required live-ticket AC pointers are empty.
- **Carry:** Spec Writer (`to-spec`) then Ticket Filers (`to-tickets`) own grill→spec→ticket carry. Parent refuses next spawn (and treats return as `partial`) when `CARRY_FROM_GRILL` / `CARRY_FROM_SPEC` is empty or `missing≠none` on those receipts.

## Hybrid

- **Cursor Task** for code/implement and one-shot phase publish.
- **Grok bots** for durable room lanes (Umbrella / Verify / Investigate) that need standing presence.
- Never dual-truth two verifier verdicts for the same return.


## Acceptance criteria (conductor note)

Tickets without AC checklists are **incomplete**. `/to-tickets` must write ≥2 checkable done-looks-like boxes on every live implement ticket. `build-verifier` **fails closed** when the AC list is missing (cannot audit → BLOCK_CLOSE_OR_LANE).

## Carry (conductor note)

Locked grill decisions must not drop between phases. `/to-spec` emits `CARRY_FROM_GRILL` (every lock answered|deferred|cut; missing=none). `/to-tickets` emits `CARRY_FROM_SPEC` (each in-scope decision → ticket AC(s) or parked#). Carry is **Spec Writer then Ticket Filers**; parent refuses spawn if those CARRY fields are empty.

## Grill

Always parent / CoS. Pre-grill research may be a readonly child that returns a gap-list draft;
parent finalizes gaps before AskQuestion.

## Window full

Parent runs Recall brief + `/handoff`. Do not ask a child to compact this chat.

## Return contract

Child final message must include STATUS, ARTIFACTS, RECEIPTS, ESCALATE[], NEXT_HINT.
Parent ignores NEXT_HINT for routing. Missing RECEIPTS → partial; re-verify.

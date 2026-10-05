---
name: blast-radius
description: "Find what a change could break somewhere else, beyond the diff, and prove the one fact it is safe because of by running real code. Use for \"blast radius of X\", \"what could this break\", reviewing a small diff you do not trust, or the Spec axis of /code-review before Ready-to-merge."
---

# Blast radius

Find what a change breaks somewhere else, before it ships. Use for "blast radius of X", "what could this break", or a small diff you do not trust yet.

Companion to `how` and `why`. `how` says what the code does. `why` says why it is shaped that way. Blast radius says what it breaks somewhere else.

Listing callers is not the job. Grep already does that. The job is the breakage grep will not show.

Works in Cursor and in Grok Bot. Do not require a second model, an arena harness, or a loop. A second model is optional when the harness already has one. It is not a gate.

## Don't trust the writeup

A blast-radius writeup that sounds right is worthless until the fact it depends on has been run. Find the one or two facts the safety claim depends on and prove them by running code.

### How sure are you

For each fact, get as far down this list as is cheap, and say where it stopped.

1. You said so. Worthless on its own.
2. You pointed at the line. A real `file:line`, or the library's own source.
3. You showed the bad case cannot happen. You walked the failure and it does not reach.
4. You ran it. A script or test that calls the real code and fails loud if you are wrong.
5. You reproduced it in the running app.

Step 4 is usually one small script that imports the same library the app ships and calls the function you are worried about.

## Steps

1. Read the change. The diff, the symbols it adds, changes, and deletes, and what it now does differently, including the part the diff does not spell out. Use `why` step 2 (git log and `gh`) for the PR and commits.
2. Find the one fact it is safe because of. Most risky-looking changes are safe because of a single fact, such as "this call only drops already-dead cache entries and does nothing else". If that fact holds, most scary cases clear at once. Spend time here, not on a long list of maybes.
3. Look where grep stops. Read the library source you call, and check its pinned version and any local patch. Work out when things run (microtasks, unmount, framework lifecycle). Follow what a symbol search misses: JSON an API returns, a DB column, a wire format, another language reading the same bytes, a feature flag, code three hops downstream.
4. Be honest about each risk. Give it a real chance of happening and a real cost if it does. Keep the risks you confirmed. List the ones you checked and cleared separately. Cite a real `file:line`. A search that finds nothing is still an answer. Never invent a caller or an API.
5. Prove the one fact. Write a script or test that runs the real code, run it, and paste what happened. If you cannot run it, the fact is **unproven**.
6. Optional. For a wide change, if the harness can ask a second model the same question, do that and merge the answers. Do not block the review on a multi-model product.

## What to hand back

- **What it does.** What changed, including the part that is not obvious.
- **The one fact it is safe because of.** State it, say which step you reached, and show the proof. If you could not prove it, write unproven.
- **Risks.** Each names how it breaks, the `file:line`, how likely and how bad, and how to check. Paste the proof for the ones that matter.
- **Cleared.** What you checked and why it is fine.
- **Before you merge.** The cheapest test or repro that catches the real bug, including the script you wrote.

Cite real code. Strip anything private before it goes anywhere public.

**Reply.** The writeup above, with the one safety fact either proven or marked unproven.

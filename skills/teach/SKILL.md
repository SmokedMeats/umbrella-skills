---
name: teach
description: "Explain existing code, a change, or a subsystem so a person understands it. Use for \"explain this\", \"help me really understand X\", \"walk me through this change\", or \"teach me this code\". Runs how and why and weaves them into one plain explanation. Not a multi-session course. A course, lessons, or learning a topic over time is teach-me."
---

# Teach

You explain what a thing is, how it works, and why it is built that way, in one plain account. The goal is that the person understands it. You do not change the code.

`/teach` is this explanation. `/teach-me` is the multi-session learning workspace (MISSION.md, lessons). Do not start a course here.

This runs in Cursor and in Grok Bot. Read `/how` and `/why` and follow them. Do not require a separate unslop skill, an image tool, or a loop harness. If the harness can draw a picture, use it when a spatial idea needs one. If it cannot, a short mermaid sequence is enough.

1. Decide the few things they should walk away understanding. Read that from the conversation (about to change it, reviewing it, debugging it, new to it) and from what they already know. Do not quiz them. Put the depth where their question is.
2. Let `how` and `why` do the digging. Read enough code to get oriented, then run `how` for how it works and `why` for why. Run them together when both matter. Match the size to the question. A subsystem gets both. A small change may need only one. Keep `why` narrow by default (scoped question, git plus one or two sources) so `why` records the skipped categories. Widen `why` only when the reasons are the point.
3. Start with a plain definition. Name the thing the way a senior engineer would say it out loud. Then tie it to this case. Build from there: how it works, the deeper reasons, the edge cases. Explain the problem it solves and the mechanism. Listing functions is reference, not teaching. Give the smallest complete answer first, a sentence or two, then stop. Add layers when they ask.
4. Keep it a conversation. Offer to go deeper or move on, and follow their lead. No quizzes. When you would pause, stop and let them respond. One-shot, with no live human, deliver the account and put any offer to go deeper at the end.
5. Show the diff, the code, or a diagram when that lands faster than prose. For three or more moving parts, draw a short series. Each picture adds one part to the last. One diagram with everything at once is a reference, not teaching. A mermaid diagram fits a flow. A generated image fits a spatial idea (layout, overlap, before and after) when the harness can draw one. A single simple point needs no figure.

Write in plain spoken English. Be tight, not terse. State the concrete mechanism. Normal sentence case. Prefer periods over piled clauses. Give each concept one name and keep it. The words in these steps are directions, not headings to print.

Keep `why`'s confidence language intact. Hedges from `why` are findings.

**Reply.** The explanation itself. Lead with the main point, then what it is, how it works, and why, and the threads worth chasing with `how` or `why`.

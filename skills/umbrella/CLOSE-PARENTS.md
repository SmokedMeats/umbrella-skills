# Close parents

SSOT for any skill that **closes** an issue under `/umbrella`.

After `gh issue close <n>` (and the usual hygiene: comment, drop `ready-for-agent` / `parked:*`, Project **Done**, keep the milestone), close each **open parent** that now has **zero open children**. Recurse. Then the existing **Hit milestone** rule (`/umbrella` **Milestones** §9).

Parked / `Later:` / `locked` children still count as open. That is the leftover shelf. Do not close a parent that still has one.

## After every close

1. Find **parent(s)** of the issue you just closed.
2. For each **open** parent: list its children. If any child is still `OPEN` → stop on that parent.
3. If open children = 0: close the parent with the same hygiene. Comment: `Closed because last child #<n> closed.`
4. Run this protocol on that parent (it may be the last child of another parent).
5. If the house now has **no open issues** (live or parked), Hit the milestone.

Completion: no open parent remains whose GitHub children are all closed.

## Find parents

**Native GitHub parent first** (sub-issue). Infer owner/repo from `git remote`.

```text
gh api graphql -f query='query($o:String!,$n:String!,$num:Int!){repository(owner:$o,name:$n){issue(number:$num){parent{number state}}}}' -f o=OWNER -f n=REPO -F num=CLOSED_NUMBER
```

Children of a parent (GitHub caps a map at 100):

```text
gh api graphql -f query='query($o:String!,$n:String!,$num:Int!){repository(owner:$o,name:$n){issue(number:$num){subIssues(first:100){nodes{number state}}}}}' -f o=OWNER -f n=REPO -F num=PARENT_NUMBER
```

If there is **no** native parent, fall back to `Part of #<N>` at the top of the body or `## Parent` links. Do not invent a parent from a milestone or `umbrella:*` label.

No parent → stop. This close is a one-off.

## Do not close

| Keep the parent open | Why |
| --- | --- |
| Any child still `OPEN` | Includes `parked:*`, `Later:`, `Leftover:`, `locked` |
| Parent already closed | Nothing to do |
| Continuous milestone hygiene | `/umbrella` **Milestones** §10 — do not Hit Continuous; do not invent a cascade onto that milestone |

Do **not** keep an empty map open “just in case.” Known leftovers stay as parked children. That is why the parent stayed open.

## More work later (same house)

| Situation | Do this |
| --- | --- |
| Same destination, leftover we already filed | Map stayed open — it still has parked children |
| Same destination, new work after the pack Hit | **Reopen** the map (and the house milestone if you want the bar live). File new children on it |
| New destination, or the map hit the 100-child cap | New map (`part 2`), same `umbrella:<slug>` |

GitHub will attach children to a closed parent. Do not use that as the inbox — a closed card reads as done. Reopen first.

The house is `umbrella:<slug>` + the milestone. The index ticket is `wayfinder:map` (filter that label). Do not invent a `HOUSE` label.

## Who runs this

| Skill | When |
| --- | --- |
| `/implement` | After each ticket close (replaces “Leave the map open”) |
| `/wayfinder` | After it closes a child |
| `/grilling` / `/grill-me` | After a grill ticket closes |
| `/umbrella` | After any loaded skill that closed an issue, before naming the next phase |
| Parked **Close** | After dropping `parked:*` on a finished leftover |

Not a GitHub Action. Skill sessions only. Closing from github.com does not cascade unless an agent runs this.

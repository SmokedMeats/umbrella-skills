---
name: pit-of-success
description: Review or refactor code so the correct behavior is the default path; use when APIs, setters, hooks, helpers, or component props have footguns where a natural call bypasses required semantics.
user-invocable: true
---

# Pit of Success

Make misuse hard and the obvious call correct.

## Steps

1. Find the public seam being used: exported function, hook return value, setter, component prop, route body, schema, or command. Then search every caller of that seam. Done when you know the natural call a future maintainer would write.
2. Run the footgun test: “If someone does the obvious thing without knowing the hidden helper or convention, does behavior break?” Examples: `setSelection(null)` should mean the product’s normal clear behavior; a schema should reject states the UI never wants; a prop should not require sibling props in the right combo.
3. Move the invariant into the seam. Prefer, in order:
   - make the existing API do the safe thing,
   - narrow the type/schema so bad states cannot be represented,
   - rename/split the API so the dangerous path is explicit,
   - only then add a helper, and only if all natural callers use it.
4. Delete bypasses and duplicate meanings. Replace local wrappers, parallel helper names, and comments that explain the trap with one shared implementation at the seam.
5. Prove the pit with one check: a focused test or type/schema assertion showing the obvious call now preserves behavior, plus a grep confirming no caller still uses the old footgun.

## Rules

- Do not fix only the named callsite. If the seam is wrong, fix the seam.
- Do not rely on “remember to call this helper first” when callers can still call the raw API.
- Do not add comments as a substitute for making misuse impossible or obvious.
- Keep the diff boring: one invariant, one owner, no speculative abstraction.
- If compatibility prevents changing the seam, name the dangerous API accordingly and expose a safe default API beside it.

# Crit 7 reflection

## What was the breakthrough that moved the work forward?

The breakthrough was realising that a login system for a prototype whose real
subject is an eligibility page doesn't need to be a feature — it needs to be a
testing harness. Once I framed it that way, the "no real auth" constraint
stopped being a corner I was cutting and became the source of the best idea in
the build: since there's genuinely nothing to protect, the failed-login flow
could just be honest about it and hand back the password after three tries. That
same framing justified the randomised-transcript generator and god-mode page —
both exist so I can throw many different plausible (and implausible) course
histories at the eligibility logic without hand-writing fixtures or redeploying
data every time I want a new test case.

## What did this work change about who I want to be as a software developer?

I noticed I was more willing than usual to expand scope mid-build — asking for
a whole login/user system on top of an already-working eligibility page — because
the underlying data model (the AND-of-OR prerequisite groups) was solid enough
that I trusted it would compose with new features instead of fighting them. That's
a habit I want to keep: get the core model right and legible before layering
features on it, rather than building breadth first and hoping the model holds.
The squashed-migration recovery mid-build was a reminder that this trust still
needs verifying, not just assuming — I asked the agent to confirm the generated
SQL was actually clean rather than taking a green `db:generate` at face value.

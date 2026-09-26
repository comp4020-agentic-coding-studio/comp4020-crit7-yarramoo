# Process overview

## What I built

A course-enrolment prototype that shows eligibility (prerequisites, permission
codes) up front for every course, instead of only at the final enrolment step.
`README.md` covers what the app is and what good means here; this covers how
the agent got there.

## How I got here

I started by having the agent extract real ANU COMP course data (prerequisites,
terms, permission requirements) from screenshots and the ANU Programs & Courses
site, converging on a grep-based extraction pattern to avoid burning context on
full-page reads per course — recorded permanently in `CLAUDE.md`. I answered one
clarifying question about how to model prerequisites (AND-of-OR groups plus a
free-text note for non-checkable requirements).

Mid-build I expanded the brief myself: a login/user system so different
transcripts could be tested against the eligibility page without redeploying
data, a joke "3 wrong passwords reveals it" mechanic given there's no real auth,
a randomised-but-prerequisite-consistent transcript generator for new users, and
a god-mode page to hand-set a transcript directly. I asked the agent to keep the
course catalogue and per-student data in separate tables, which shaped the
schema (
[`d07bc92`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/d07bc92)).

The agent implemented the feature (
[`41a6f62`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/41a6f62))
and smoke-tested every flow itself via `curl` before I reviewed anything —
login, the password reveal, enrolment, and god-mode all verified end to end.

## Before you ship

Full range:
[`378f1ed...4b62b4d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/compare/378f1ed...4b62b4d).

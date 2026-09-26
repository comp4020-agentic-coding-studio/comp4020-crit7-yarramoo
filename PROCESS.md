# Process overview

## What I built

A course-enrolment prototype, dressed as a fictional university's student
portal, that shows eligibility for every course up front instead of at the
final step. `README.md` covers what it is; this covers how the agent got there.

## How I directed it

I ran Opus as orchestrator and had it delegate by weight: Haiku for repetitive
scraping, Sonnet workers for code, Opus planning and reviewing every diff.
Keeping raw output inside subagents meant the whole build ran without a
compaction.

I shaped the harness as I went. A research-hygiene rule in `CLAUDE.md` makes
scraping converge on one grep pattern instead of summarising page after page
([`d07bc92`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/d07bc92)).
An image-generation skill made the crest and tile art
([`2102b95`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/2102b95)).

## Milestones

- Real ANU catalogue, prerequisites as AND-of-OR groups, then login, random transcripts, enrolment and god mode ([`d07bc92`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/d07bc92), [`41a6f62`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/41a6f62)).
- Reframed as a fictional university, since a public ANU lookalike that echoes passwords reads as phishing ([`cb0ce7c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/cb0ce7c)).
- Eleven disciplines. A spot check caught Haiku mangling prerequisites; Sonnet rebuilt them from source ([`065e395`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/065e395)).
- Class search. Screenshots, not green tests, caught a broken phone layout ([`02eb620`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/02eb620)).
- I asked whether "6 units of MATH" was checked. It wasn't, so the checker now handles unit counts and incompatibilities ([`72f951c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/72f951c)).

## Recovering from a crash

Near the end Claude Code crashed, and the resumed session had no network.
Rather than work around the sandbox, I had Opus write an untracked
`WORKLOG.md` handover. A fresh session read it, revalidated, deployed, and
removed a stale CI check
([`8af8ad7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/8af8ad7)).

Full range:
[`ebd1146...8af8ad7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/compare/ebd1146...8af8ad7).

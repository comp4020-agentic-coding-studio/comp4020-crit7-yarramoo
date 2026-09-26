# Process overview

## What I built

A course-enrolment prototype, dressed as a fictional university's student
portal, that shows eligibility (prerequisites, permission codes) for every
course up front instead of at the final step. `README.md` covers what it is;
this covers how the agent got there.

## How I got here

The agent extracted real ANU course data using a grep-based pattern, now
recorded in `CLAUDE.md`. Prerequisites are modelled as AND-of-OR groups plus a
free-text note. I then expanded the brief myself: a no-auth login (three wrong
passwords reveals yours), prerequisite-consistent random transcripts, and god
mode. I asked for catalogue and student tables to stay separate
([`d07bc92`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/d07bc92),
[`41a6f62`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/41a6f62)).

To make it look like a real portal, I had the agent plan first and delegate to
two cheaper Sonnet workers, reviewing each diff itself
([`cb0ce7c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/cb0ce7c),
[`7ba4e31`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/7ba4e31)).
That review caught blocked courses restating prerequisites the student had
already met. I had the agent write an image-generation skill against the course proxy for
the crest and tile art
([`2102b95`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/2102b95)).
The university is fictional because a public ANU lookalike that echoes
passwords would read as phishing.

Adding more disciplines, I gave scraping to Haiku. A spot check found it had
mangled prerequisites, so a Sonnet worker rebuilt them from the raw text
([`065e395`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/065e395)).
Cheap models can fetch data, but the judgement needs checking.
Headless-Chrome screenshots, not green tests, caught the broken phone layout
([`02eb620`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/02eb620)).
I then asked whether rules like "6 units of MATH" affected eligibility. They didn't, so
the checker now handles unit counts, exclusions and incompatibilities
([`72f951c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/commit/72f951c)).

Every flow was smoke-tested with `curl`; the accessibility invariants cover each
logged-out page.

Full range:
[`378f1ed...72f951c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yarramoo/compare/378f1ed...72f951c).

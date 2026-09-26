# Your harness

This file is yours, and it arrives empty on purpose. The rules you hold the
agent to are part of what gets marked, so they should be rules you decided on.

Nothing about the starter is recorded here. What the repo ships is explained
where it lives --- `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each say what they fix --- and the
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec. Read them before you plan or build;
what the agent needs to carry from any of it is your call.

## Research hygiene

Web searches for systematic and structured content (a series of pages with the
same template — course pages, product listings, API docs for the same
endpoint shape) should quickly converge on a grep rule: fetch one instance raw,
find the stable marker around the data you need (an id, a class name, a
heading), and use that pattern to extract just that slice from every other
page — via `curl` + `grep`/`sed`, not a full-page fetch or summary per item.
Don't re-derive the pattern per item and don't let full pages pile up in
context; one page read to find the rule, then the rule does the rest.

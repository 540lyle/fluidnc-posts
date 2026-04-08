# Architecture Summary

- Fusion is the current product, not the only conceptual source of truth.
- `specs/` captures controller semantics.
- `profiles/` captures reusable machine defaults.
- `fixtures/` capture regressions and expected behavior.
- `adapters/fusion/` translates those semantics into a Fusion post.
- Do not add a generator until a second adapter creates real duplication pressure.

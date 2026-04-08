# Repo Map

- `docs/`: full human-facing design and process documents
- `specs/`: controller defaults, schemas, and invariants
- `profiles/`: committed machine defaults, examples, and ignored local overrides
- `fixtures/`: regression cases and expected behavior
- `adapters/fusion/`: Fusion implementation and release scripts
- `tools/`: validation, diff, and release helpers

Primary product target: Fusion.

Primary architectural rule: keep behavior intent out of the adapter where possible, but do not build a generator until a second adapter exists.

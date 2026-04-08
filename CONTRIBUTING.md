# Contributing

## Scope

This repository is Fusion-first. Contributions should improve the FluidNC experience in Fusion without introducing abstraction that the project cannot justify yet.

## Principles

- Keep behavior explicit and reviewable.
- Protect regression-heavy areas with fixtures.
- Separate controller rules from machine overrides.
- Preserve upstream provenance for Autodesk-derived work.

## Change categories

- Controller behavior: update `specs/` and relevant fixtures.
- Fusion adapter implementation: update `adapters/fusion/` and document upstream impact.
- Machine defaults or examples: update `profiles/`.
- Contributor or agent guidance: update `docs/` and `llm/`.

## Pull request checklist

- Open a pull request for every change that targets `main`; direct pushes to `main` are reserved for initial repository bootstrap only.
- Wait for repository owner approval before merging. The GitHub `CODEOWNERS` policy requires `@540lyle` to sign off on path changes before merge.
- The change has a clear problem statement.
- Any behavior change is backed by a fixture or invariant update.
- New options have documented precedence and defaults.
- Fusion-specific decisions are called out as adapter concerns, not universal controller truth.
- If the change touches Autodesk-derived code, upstream notes are updated.

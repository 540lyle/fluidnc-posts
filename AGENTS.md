# AGENTS.md

This file is the repo-local operating guide for coding agents working in `C:\src\fluidnc-posts`.

## Project identity

- Product today: a high-quality FluidNC post processor for Autodesk Fusion.
- Strategic direction: keep controller behavior, fixtures, and profiles outside the Fusion adapter so the repo can grow without forcing a generator too early.
- Constraint: do not assume Autodesk-derived `.cps` code can be redistributed under an open source license until licensing is verified.

## First files to read

Load these in order when starting work:

1. `README.md`
2. `docs/architecture.md`
3. `llm/README.md`
4. The one or two `llm/*.md` files most relevant to the task
5. Only then open adapter, fixture, or profile files you actually need

## Source-of-truth rules

- Behavioral intent lives in `specs/`.
- Regression expectations live in `fixtures/`.
- Machine/shop defaults live in `profiles/`.
- Fusion implementation details live in `adapters/fusion/`.
- Do not treat the Fusion adapter as the only authoritative design document.

## Working rules

- Keep the project Fusion-first. Do not introduce a multi-adapter code generator without a second concrete adapter target.
- Prefer clear, inspectable files over clever abstraction.
- Keep adapter customization markers consistent. Use `FLUIDNC:` or `CUSTOM:` tags in code comments.
- When changing behavior, update specs and fixtures together.
- Keep local machine overrides out of Git.
- Document any upstream Autodesk baseline or divergence in `adapters/fusion/upstream/`.
- If licensing assumptions change, update `docs/upstream-strategy.md` and `llm/legal-and-upstream.md`.

## Task guidance

- For architecture questions: read `docs/architecture.md`, `docs/controller-model.md`, and `llm/architecture.md`.
- For Fusion adapter work: read `adapters/fusion/README.md`, `llm/fusion-adapter.md`, and the adapter file.
- For override or machine setup work: read `docs/profiles-and-overrides.md` and `profiles/`.
- For testing and regressions: read `docs/testing.md`, `llm/testing.md`, and `fixtures/`.
- For legal/upstream questions: read `docs/upstream-strategy.md` and `llm/legal-and-upstream.md`.

## Definition of done

- The touched area still matches the architecture in `docs/architecture.md`.
- Behavior changes are reflected in specs or fixtures.
- Contributor-facing and `llm/` docs stay accurate for structural changes.
- If adapter behavior changed, the change notes identify whether the divergence is controller-driven, machine-driven, or Fusion-specific.

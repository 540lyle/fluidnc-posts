# Fusion Adapter

This folder is the Fusion-specific implementation layer.

## Current policy

- the adapter is the primary product artifact
- behavior intent should still be documented in `specs/` and `fixtures/`
- upstream Autodesk provenance must be tracked
- if redistribution remains unclear, this folder must support patch-based release packaging

## Current state

- `FluidNC.cps` is now a repository-authored 3-axis Fusion post implementation
- the rewrite keeps current fixture-visible behavior while avoiding Autodesk-shaped helper structure
- the active post now exposes repo-owned helper names instead of preserving the imported helper/property surface
- mocked Fusion-host unit tests cover the adapter at 100% statements, branches, functions, and lines
- when the local original post exists, the mocked host also runs original-vs-rewrite differential scenarios and fails on emitted NC drift
- upstream notes live in `upstream/`
- the imported adapter history is retained only as provenance in `upstream/`

## Expected contents

- the Fusion `.cps` implementation
- upstream baseline notes
- release and validation scripts
- adapter-specific testdata

## Contributor rule

If you change adapter behavior, say whether the change is:

- a controller rule
- a machine/profile override
- a Fusion-only implementation concern

## Current priorities

- preserve the captured fixture contract during manual Fusion posting checks
- extend the rewrite beyond the current 3-axis fixture families only when new fixtures justify it
- keep new behavior in plain repo-owned helpers that remain mock-testable outside Fusion

## Next phase

The current next-step roadmap is:

- [Phase 5 Roadmap](../../docs/phase-5-roadmap.md)

That roadmap keeps the adapter expansion fixture-led and profile-driven. See the roadmap for delivery order and slice details.

## Current behavior decisions

- section starts always restate restart-sensitive modal state
- split-file output emits a placeholder master plus self-contained sub-files
- segment filtering flushes deferred endpoints before rapids, arcs, section ends, and close
- the repo post does not preserve the imported helper/property contract; old-post compatibility belongs in the test harness, not in the shipped adapter

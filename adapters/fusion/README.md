# Fusion Adapter

This folder is the Fusion-specific implementation layer.

## Current policy

- the adapter is the primary product artifact
- behavior intent should still be documented in `specs/` and `fixtures/`
- upstream Autodesk provenance must be tracked
- if redistribution remains unclear, this folder must support patch-based release packaging

## Current state

- `FluidNC.cps` is the imported working adapter from the local Fusion posts folder
- upstream notes live in `upstream/`
- the imported adapter is intentionally captured before major cleanup so fixtures can be built against current behavior

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

## Immediate priorities

- add fixtures around inch mode, split files, manual tool changes, and dense segment filtering
- normalize custom markers without changing behavior unexpectedly
- fix known risks only after fixture coverage exists

## Current behavior decisions

- section-start safety output now respects the active post unit mode instead of hardcoding metric
- `safeStartAllOperations` falls back to normal required blocks when optional blocks are unsupported by the adapter

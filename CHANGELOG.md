# Changelog

## Unreleased

- Initial repository scaffold for a Fusion-first FluidNC post project.
- Imported the current private Fusion adapter into `adapters/fusion/FluidNC.cps`.
- Recorded upstream baseline metadata and first-pass known risks.
- Added initial fixture manifests for high-risk behavior areas.
- Added local install/status scripts and wired the local Fusion post path to the repo adapter with a hard link.
- Fixed unit-safe startup and section-safe mode output in the imported adapter.
- Fixed `safeStartAllOperations` so it no longer traps on unsupported optional blocks.

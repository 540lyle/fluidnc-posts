# Release

## Release goals

- produce a versioned Fusion adapter artifact
- preserve upstream provenance
- summarize behavioral changes in contributor terms
- avoid shipping undocumented machine-specific changes

## Suggested flow

1. Update changelog and support notes.
2. Confirm fixture coverage for changed behavior.
3. Record the upstream Autodesk baseline or patch target.
4. Package the Fusion adapter for release.
5. Attach release notes that classify each change as controller, profile, or adapter behavior.

## Packaging modes

- direct adapter release if redistribution is allowed
- patch or apply-script release if redistribution remains restricted

## Current release posture

Release `v1.0.1` is currently shipped in direct artifact mode and includes `FluidNC.cps` as a public GitHub release asset.

That is a distribution decision, not a legal resolution. If redistribution rights are challenged or clarified against direct publication, the release process should switch back to patch-based packaging without changing the controller/spec/fixture split in this repository.

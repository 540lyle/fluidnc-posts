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

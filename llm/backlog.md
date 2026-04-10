# Backlog

Foundation already in place:

- the repository-authored Fusion adapter exists and upstream provenance is tracked
- the initial high-risk fixture families are captured and checked in
- emitted-NC validation and mocked-host regression tooling already exist

Current next-step backlog:

- Use [docs/phase-5-roadmap.md](../docs/phase-5-roadmap.md) as the current next-step plan for expanding beyond the validated 3-axis fixture set.
- Close the most visible 3-axis contract gaps first: coolant warnings, retract semantics, and drilling as baseline support.
- Lock the standalone `.cps` release model and embedded machine-profile catalog before Phase 5 runtime work.
- Expand controller and machine specs before adapter work so multi-axis and probing behavior is repo-defined, not adapter-invented.
- Add the dormant fixture families and capability slices in the order defined by `docs/phase-5-roadmap.md`.
- Decide packaging mode after Autodesk redistribution status is confirmed.
- Revisit shared code generation only after a second adapter exists.

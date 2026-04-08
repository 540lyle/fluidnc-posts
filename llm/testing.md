# Testing Summary

- Favor fixture-driven regression over abstract unit tests alone.
- Protect inch-mode handling, split files, restart safety, tool changes, and arc behavior first.
- Exact snapshots are useful, but invariant checks are the long-term goal.
- Every behavior fix should either add a fixture or tighten an invariant.
- Current captured baseline covers `inch-job`, `multi-tool`, `tiny-segment-storm`, and `split-file`.
- Preferred workflow is: prepare fixture folder, generate `.f3d` when possible, use Fusion AI for setup/ops, post into the repo, run `tools/validate/Test-FixtureCaptures.ps1`, then review only failed checks or new behavior.

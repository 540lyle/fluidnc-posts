# Validate Tools

Validation helpers should focus on invariants first:

- unit mode
- safe-start completeness
- tool-change sequencing
- endpoint reachability after segment filtering

Fixture capture helper:

- `prepare-fixture-capture.ps1` creates the expected-output folder, copies an optional `.f3d`, and generates `*.properties.txt` and `*.review.md` templates from `fixture.yaml`

Fixture geometry helpers:

- `GenerateMultiToolFixture.py`
- `GenerateTinySegmentStormFixture.py`
- `GenerateSplitFileFixture.py`

Captured-fixture validator:

- `Test-FixtureCaptures.ps1` checks the current Fusion fixture set for the highest-signal invariants already captured in the repo
- `check-cps-syntax.mjs` parses `adapters/fusion/FluidNC.cps` without executing it
- `eslint` checks the adapter for syntax-adjacent logic mistakes that are meaningful in Fusion's JavaScript host
- `run-unit-tests.mjs` executes the adapter in a mocked Fusion runtime and blocks on 100% statements, branches, functions, and lines
- `run-differential-tests.mjs` runs the local original Fusion post and the repo post under the same mocked runtime and fails on emitted NC drift when the original file is present
- `run-original-fixture-audit.mjs` runs the local original Fusion post under the mocked runtime and compares those results to the checked-in fixture captures, classifying gaps as exact match, scenario depth, scenario metadata, or possible host fidelity issues

Repo automation:

- `npm run test:unit` runs the mocked-host coverage harness and the local original-vs-rewrite differential harness
- `npm run test:unit:coverage` runs only the coverage-gated mocked-host harness
- `npm run test:unit:diff` runs only the local original-vs-rewrite differential harness
- `npm run audit:fixtures:original` runs the local original-vs-fixture mock audit and only fails when a mismatch still looks like a possible host/runtime gap
- `npm run validate:adapter` runs the syntax check, adapter lint, and mocked-host unit harness
- `npm run validate:fixtures` runs the captured-fixture validator
- `npm run validate` runs both and is the shared entry point for Git hooks and GitHub Actions
- `npm run compare:original:surface` compares the rewritten adapter's function and property surface to the local original Fusion post when that file exists
- `npm run hooks:install` configures the repo-local `pre-commit` and `pre-push` hooks

CI boundary:

- `npm run validate` is the intended CI blocker because it only depends on repo-owned inputs plus the current runtime.
- Local exact-output comparison against the installed Autodesk original is intentionally separate; it is stronger than CI, but it is not suitable as a default CI dependency unless that original artifact is pinned and provisioned.
- Real Fusion posting remains outside CI and should be treated as a manual release/regression step.

Usage:

```powershell
npm run test:unit
```

```powershell
npm run test:unit:diff
```

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\validate\Test-FixtureCaptures.ps1
```

To validate a single fixture family:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\validate\Test-FixtureCaptures.ps1 -FixtureName tiny-segment-storm
```

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

Repo automation:

- `npm run validate:adapter` runs the syntax check and adapter lint
- `npm run validate:fixtures` runs the captured-fixture validator
- `npm run validate` runs both and is the shared entry point for Git hooks and GitHub Actions
- `npm run hooks:install` configures the repo-local `pre-commit` and `pre-push` hooks

Usage:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\validate\Test-FixtureCaptures.ps1
```

To validate a single fixture family:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\validate\Test-FixtureCaptures.ps1 -FixtureName tiny-segment-storm
```

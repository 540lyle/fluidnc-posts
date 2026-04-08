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

Usage:

```powershell
powershell -ExecutionPolicy Bypass -File C:\src\fluidnc-posts\tools\validate\Test-FixtureCaptures.ps1
```

To validate a single fixture family:

```powershell
powershell -ExecutionPolicy Bypass -File C:\src\fluidnc-posts\tools\validate\Test-FixtureCaptures.ps1 -FixtureName tiny-segment-storm
```

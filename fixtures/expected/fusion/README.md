# Fusion Expected Output

Store expected NC output snapshots or normalized expected-output artifacts for the Fusion adapter here.

Practical rule:

- In Fusion's Post dialog, enter the file name without `.nc`. Fusion appends the extension automatically.

After posting:

- keep the emitted `*.nc` in the matching fixture folder
- keep the matching `*.properties.txt` and `*.review.md` updated
- run [Test-FixtureCaptures.ps1](../../../tools/validate/Test-FixtureCaptures.ps1) before treating the capture as current
- if an agent is assisting, give it the emitted file or folder path and let it handle diffs, invariant checks, and validator runs
- if a diff is intentionally accepted as non-behavioral, record that acceptance in the matching `*.review.md` so future regressions do not have to rediscover it

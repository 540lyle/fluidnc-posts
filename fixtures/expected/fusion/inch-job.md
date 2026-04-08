# inch-job expected behavior

## Required runs

- `base-inch`
- `safe-start-inch`

## Output requirements

- Program startup emits `G20`, not `G21`.
- Section-start safety output preserves inch mode in every section.
- No later section reverts the file to metric mode.
- Feed and coordinate precision remain consistent with inch output.

## Manual checkpoints

- Inspect the first startup block.
- Inspect the first line at the start of the second section.
- Inspect any restart-oriented or re-entry line after retract.

## Forbidden patterns

- Hardcoded metric-only reset blocks in an inch job.
- Any section transition that changes unit mode without the job requiring it.

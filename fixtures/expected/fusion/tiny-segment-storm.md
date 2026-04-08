# tiny-segment-storm expected behavior

## Required runs

- `no-filter`
- `default-filter`
- `aggressive-filter`

## Output requirements

- Micro-segments below the configured threshold may be suppressed.
- Pending filtered endpoints flush before mode changes.
- Rapids, arcs, and section exits do not strand the effective endpoint.
- Output favors controller throughput without visibly breaking path intent.

## Manual checkpoints

- Compare line density between all three runs.
- Inspect the last emitted line before the first rapid after a dense region.
- Inspect the last emitted line before any arc or section exit after filtering.
- Confirm the filtered region still reaches the intended endpoint.

## Forbidden patterns

- Filtered regions that terminate early.
- Missing flush behavior before rapids, arcs, or section exits.

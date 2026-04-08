# split-file expected behavior

## Required runs

- `split-by-tool`
- `split-by-toolpath`
- `split-by-tool-safe-start`

## Output requirements

- Each sub-file establishes its own startup state.
- Split-file headers remain readable for operators.
- Safe-start output still works when optional blocks are unsupported.
- Restart-sensitive modal state is restated rather than assumed.

## Manual checkpoints

- Review the placeholder master file, if emitted.
- Review the header and startup lines of every sub-file.
- Review file naming and operator-facing comments.
- Review the first motion entry in each restart-sensitive operation.

## Forbidden patterns

- Any sub-file that assumes previous files have already set unit mode or WCS.
- Any split workflow that only becomes safe when optional blocks are supported.

# Troubleshooting

## Common problem classes

- wrong unit mode after section changes
- unsafe or inconsistent restart behavior
- manual tool-change pauses not matching operator expectations
- controller slowdown from over-segmented linearized motion
- coolant output not matching machine hardware

## Triage path

1. Reproduce with the smallest fixture case possible.
2. Classify the problem as controller, profile, or adapter behavior.
3. Check whether a spec or invariant already exists for it.
4. Add or update the fixture before changing implementation.

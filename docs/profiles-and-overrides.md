# Profiles And Overrides

## Purpose

Profiles keep reusable machine defaults out of the adapter core. Local overrides prevent one operator's machine from becoming everyone else's default.

## Profile categories

- `profiles/machines/`: reusable committed machine classes
- `profiles/examples/`: documented examples for onboarding
- `profiles/local/`: ignored local overrides and experiments

## Recommended fields

- machine identity
- controller revision assumptions
- coolant hardware capabilities
- tool-change mode
- spindle warmup delay
- arc tolerance target
- minimum segment length
- safe retract preference
- notes about tested fixtures

## Override policy

- promote only reusable patterns into committed profiles
- keep serial numbers, local paths, and operator-specific settings out of Git
- document any runtime property that is expected to override profile defaults

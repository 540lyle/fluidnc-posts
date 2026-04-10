# Profiles And Overrides

## Purpose

Profiles keep reusable machine defaults out of the adapter core. Local overrides prevent one operator's machine from becoming everyone else's default.

## Profile categories

- `profiles/machines/`: reusable committed machine classes
- `profiles/examples/`: documented examples for onboarding
- `profiles/local/`: ignored local overrides and experiments

## Embedded profile model

Committed YAML profiles are source data, not runtime inputs.

The intended Phase 5 model is:

1. committed profiles in `profiles/machines/` define reusable machine defaults
2. a repo-owned build step converts committed profile data into a static embedded catalog
3. the shipped `FluidNC.cps` exposes a `machineProfile` selector over that embedded catalog
4. documented runtime post properties can override the selected profile defaults when needed

Fusion should not need direct runtime access to `profiles/*.yaml`.

## Recommended fields

- machine identity
- controller revision assumptions
- coolant hardware capabilities and default M-code mapping
- tool-change mode
- spindle warmup delay
- arc tolerance target
- minimum segment length
- safe retract preference
- program-end park position
- supported work offset range
- tool length compensation capability
- feed limits and warning policy
- probing macros or templates
- multi-axis kinematics and capability flags
- notes about tested fixtures

## Override policy

- promote only reusable patterns into committed profiles
- keep serial numbers, local paths, and operator-specific settings out of Git
- document any runtime property that is expected to override profile defaults
- do not add profile fields that are not tied to a controller rule, machine behavior, or fixture-backed need

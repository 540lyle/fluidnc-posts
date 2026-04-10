# Profiles And Overrides

## Purpose

Profiles keep reusable machine defaults out of the adapter core. Local overrides prevent one operator's machine from becoming everyone else's default.

## Profile categories

- `profiles/machines/`: reusable committed machine classes
- `profiles/examples/`: documented examples for onboarding
- `profiles/local/`: ignored local overrides and experiments

## Embedded profile model

Committed YAML profiles are source data, not runtime inputs.

The canonical Phase 5 embedding plan lives in the [Phase 5 Roadmap](phase-5-roadmap.md) (Slice 0).

In short, committed profiles in `profiles/machines/` are intended to become a static embedded catalog exposed through a `machineProfile` selector in the shipped `FluidNC.cps`, with documented runtime post properties allowed to override selected defaults.

Fusion should not need direct runtime access to `profiles/*.yaml`.

## Capability boundary

- controller specs define controller-supported maxima such as work-offset range and whether tool length compensation exists at all
- committed profiles may only narrow, disable, or default those controller-supported capabilities for a specific machine

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
- enabled/default work offset subset within the controller-supported range
- whether controller-allowed tool length compensation is usable on the machine
- feed limits and warning policy for the machine
- probing macros or templates
- multi-axis kinematics and capability flags
- notes about tested fixtures

## Override policy

- promote only reusable patterns into committed profiles
- keep serial numbers, local paths, and operator-specific settings out of Git
- document any runtime property that is expected to override profile defaults
- do not let profiles invent controller support that is absent from `specs/controller/*`
- do not add profile fields that are not tied to a controller rule, machine behavior, or fixture-backed need

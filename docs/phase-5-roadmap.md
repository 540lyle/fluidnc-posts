# Phase 5 Roadmap

Phase 5 is the next major expansion of the repository-authored Fusion post.

The current shipped post is a validated 3-axis implementation with captured fixture coverage for:

- `inch-job`
- `multi-tool`
- `split-file`
- `tiny-segment-storm`

Phase 5 should expand end-user coverage without abandoning the current architecture:

- behavior truth stays in `specs/`
- machine- and workflow-specific defaults stay in `profiles/`
- regression protection stays in `fixtures/`
- Fusion-only implementation details stay in `adapters/fusion/`

## Planning assumptions

- The current shipped post is a validated 3-axis subset, not a complete FluidNC milling feature surface.
- Deliver new capability in fixture-backed slices, not in one large compatibility rewrite.
- Keep the shipped release artifact as a standalone `.cps`.
- Treat committed machine profiles as repo-owned source data that is embedded into the release post as static data; do not require Fusion runtime access to `profiles/*.yaml`.
- Keep unresolved redistribution questions tracked in upstream/release docs; this roadmap does not treat Autodesk redistribution rights as settled.
- Use a table-table `AC` machine family as the first validated 5-axis target.
- Model probing through profile-defined FluidNC macros or templates, not hardcoded machine-specific commands in the adapter.
- Keep current 3-axis fixture-visible output stable unless a new fixture explicitly changes the contract.

## Immediate priorities before new capability slices

Before new capability slices expand the adapter surface, the next implementation pass should close the most visible 3-axis contract gaps:

- make unmapped coolant requests explicit in warnings or NC comments while keeping the current air-blast-biased default mapping until profile-driven mapping exists
- clarify the safe retract contract: either wire true Fusion clearance-plane semantics or treat `G53` as the only shipped safe retract
- treat drilling and cycle support as required 3-axis completion work, not optional compatibility polish
- document the remaining 3-axis gaps as completion work before new multi-axis or probing behavior

## Delivery slices

### Slice 0: contract and embedded-profile foundation

Lock the feature contract before adding missing runtime behavior:

- publish the capability matrix: current rewrite vs imported original vs target behavior
- expand controller specs before adapter work so drilling-cycle support, work-offset range, movement classes, feed-clamp semantics, and coolant warning expectations are explicit
- expand machine/profile specs before adapter work so coolant capabilities, retract style, park positions, TLC capability, feed limits, probing templates, and multi-axis capability flags are explicit
- define the embedded profile catalog model for the shipped `.cps`
- define the first validated machine profile for a table-table `AC` machine family

The embedded profile catalog should follow one mechanism:

1. committed YAML in `profiles/machines/` remains the source of truth
2. a repo-owned build step converts committed profile data into static adapter-owned data
3. the shipped `.cps` exposes a `machineProfile` selector over that embedded catalog
4. runtime post properties override the selected profile defaults where documented

This slice exists to prevent the adapter from inventing controller truth or a runtime profile-loading model ad hoc.

### Slice A: complete 3-axis milling support

Finish the missing baseline milling capabilities before new domains:

- add `onCycle`, `onCyclePoint`, and `onCycleEnd` support with documented FluidNC `G81`, `G82`, `G83`, and `G73` behavior plus clear fallback rules when Fusion requests unsupported cycle semantics
- add `onMovement` handling so filtering, restart logic, and future reporting can distinguish cutting, lead, linking, and rapid motion
- add `onParameter` handling where operation metadata should reach comments or controller-relevant decisions
- extend work offsets through the FluidNC-supported `G54` to `G59.3` range
- make coolant gaps explicit, including unmapped Flood requests
- make program-end park behavior configurable instead of assuming `G53 G0 X0 Y0`
- wire existing retract choices to real behavior before expanding retract options further
- add optional tool length compensation, feed validation, and smarter spindle warmup behavior as profile-governed features
- capture drilling/dwell, restart-mid-job, coolant-disabled or unmapped-coolant, extended-WCS, and park-position fixtures

This slice should restore missing 3-axis Fusion behavior while keeping the adapter repo-owned and readable.

### Slice B: indexed 3+2 support

Add the first multi-axis slice for indexed work:

- workplane resolution
- safe retract / rotate / return sequencing
- rotary axis state tracking
- machine-simulation state updates
- the minimum end-user properties needed for indexed multi-axis workflows, using the embedded machine profile catalog and explicit multi-axis options only where needed
- clear failures when an operation requires profile capabilities that are not present

This slice should be validated against a table-table `AC` machine profile and new indexed fixture families.

### Slice C: basic probing support

Add the first probing slice as a profile-driven workflow:

- map supported Fusion probing operations into a small repo-owned probe command model
- render that model through the selected embedded machine profile's FluidNC probing macros or templates
- fail clearly when a selected profile does not provide the needed probing template

The first supported probing operations should be limited to:

- Z surface touch-off
- X or Y edge find
- bore or boss center find
- set or update `G54` through `G59.3`

This slice explicitly defers:

- rotation or alignment workflows
- inspection or reporting workflows
- controller-specific measurement or reporting channels beyond the posted NC

Probe-safe behavior must remain explicit:

- no coolant during probing
- controlled spindle state
- safe approach and retract sequences

### Slice D: simultaneous 5-axis support

Replace the current hard failure on `onRapid5D` and `onLinear5D` with real simultaneous 5-axis handling:

- continuous 5-axis motion output
- feed mode selection appropriate for multi-axis motion
- TCP and tilted-workplane behavior gated by the selected machine profile
- clear errors when an operation requires a capability the selected profile does not support

This slice should add captured simultaneous-motion fixtures before it is treated as release-ready.

## Required interface changes

Phase 5 is expected to add:

- a Fusion-visible machine/profile selector over an embedded catalog of committed machine profiles
- profile fields for coolant mapping, retract and park behavior, work-offset range, TLC capability, feed limits, probing templates, multi-axis kinematics, and tested-fixture metadata
- restored end-user properties only where Phase 5 actually needs them, such as tilted-workplane and multi-axis feed options

Phase 5 should expand specs before expanding the adapter surface:

- controller specs define controller truth such as drilling-cycle support, work-offset range, supported multi-axis feed semantics, probing command model, and explicit unsupported capabilities
- machine profiles define machine truth such as coolant hardware, kinematics, indexing behavior, park positions, limits, and available probing templates
- the adapter translates Fusion callbacks into those repo-owned contracts

Phase 5 should not restore features that remain outside the current controller contract:

- radius compensation
- feed per revolution (`G95`)
- turning support

## Validation standard

Every new slice should meet all of these before it is called done:

1. existing captured fixture families still pass
2. new behavior is protected by a new fixture family
3. mocked Fusion-host tests cover the new callback and state paths
4. manual Fusion posting is completed for the new family
5. the change is classified in docs as a controller rule, profile override, or Fusion-only concern

Mocked-host coverage is required, but it is not sufficient on its own for new capability slices.

Any new fixture family beyond the current baseline should also capture:

- selected machine profile id
- machine configuration snapshot or exact reproduction note
- exact post property matrix
- required safety invariants around retract, index, and re-entry
- forbidden patterns such as rotary motion before a required safe retract

## Community fixture contribution workflow

Community contributors should be able to submit real Fusion evidence without changing CI to depend on Fusion itself.

Each proposed new fixture family should include:

- the emitted NC for each named post run
- the matching `*.properties.txt` and `*.review.md`
- the source `.f3d` when possible, otherwise an exact reproduction note
- the selected machine profile id or exact machine context
- the safety invariants and forbidden patterns the family is intended to protect

CI remains repo-owned and local-input-only. Real Fusion posting stays manual, but new capability slices should not be accepted on mocked-host evidence alone.

## Suggested order of work

1. close the immediate 3-axis contract gaps in docs/specs and classify the remaining safety work clearly
2. complete Slice 0: capability matrix, spec expansion, and embedded-profile distribution model
3. complete Slice A: 3-axis milling support
4. add indexed `3+2` support for a table-table `AC` profile
5. add the basic probing slice
6. add simultaneous 5-axis support

This order keeps the repository fixture-first and avoids hiding new risk inside one oversized adapter refactor.

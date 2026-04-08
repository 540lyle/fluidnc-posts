# Controller Model

## Assumption

FluidNC behavior should be modeled as controller semantics plus machine/profile overrides, not as a random set of post options.

## Controller concerns

- supported motion and modal concepts
- unit handling
- spindle and coolant command expectations
- arc handling and tolerance alignment
- restart and safety expectations
- planner-sensitive behavior such as over-segmentation mitigation

## Adapter concerns

- Fusion property definitions
- Fusion callback structure
- Fusion-specific workarounds
- formatting and packaging details required by Fusion

## Machine/profile concerns

- whether coolant hardware exists
- preferred safe retract style
- spindle warmup delay
- segment filter threshold defaults
- manual tool change conventions

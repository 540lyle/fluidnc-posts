# Controller Model

## Assumption

FluidNC behavior should be modeled as controller semantics plus machine/profile overrides, not as a random set of post options.

## Controller concerns

- supported motion and modal concepts
- supported drilling cycles, tool length compensation semantics, and maximum work-offset range
- unit handling
- spindle and coolant command expectations
- arc handling and tolerance alignment
- restart and safety expectations
- planner-sensitive behavior such as over-segmentation mitigation
- movement classification and feed-limit semantics

## Adapter concerns

- Fusion property definitions
- Fusion callback structure
- Fusion-specific workarounds
- formatting and packaging details required by Fusion

## Machine/profile concerns

- whether coolant hardware exists and how it should be mapped
- preferred safe retract style
- program-end park position
- spindle warmup delay
- segment filter threshold defaults
- manual tool change conventions
- enabled/default work offset subset within the controller-supported range
- whether controller-allowed tool length compensation is usable on the machine
- feed caps and warning policy for a specific machine
- probing macro templates
- multi-axis kinematics and capability flags

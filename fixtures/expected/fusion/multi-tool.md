# multi-tool expected behavior

## Required runs

- `manual-toolchange-default`
- `manual-toolchange-no-optional-stop`

## Output requirements

- Tool changes retract safely before operator interaction.
- Manual tool-change messaging remains clear.
- Spindle and coolant state transitions are explicit across tool boundaries.
- Optional stop behavior is predictable and controlled by post properties.

## Manual checkpoints

- Review the retract immediately before each tool boundary.
- Review the optional stop line when enabled.
- Review the tool-call or manual tool-change messaging line.
- Review spindle restart and dwell after the tool boundary.
- Review coolant off and coolant on transitions.

## Forbidden patterns

- Tool changes without a safe retract.
- Ambiguous spindle or coolant state across tool boundaries.

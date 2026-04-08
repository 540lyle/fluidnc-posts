# manual-toolchange-no-optional-stop review

- Result: PASS
- Checked startup block: metric startup is present and sections restart cleanly
- Checked section start: tool changes still retract with `G53 G0 Z0`, emit tool call/comment, spindle restart, and `G4 P3.`
- Checked restart/re-entry behavior: coolant transitions remain explicit and no `M1` lines are emitted
- Notes: optional-stop-disabled flow remains operator-readable without changing the rest of the tool boundary behavior

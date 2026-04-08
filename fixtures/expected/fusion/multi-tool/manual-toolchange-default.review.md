# manual-toolchange-default review

- Result: PASS
- Checked startup block: metric startup is present and tool sections restart cleanly
- Checked section start: both tool changes retract with `G53 G0 Z0`, emit `M1`, tool call/comment, spindle restart, and `G4 P3.`
- Checked restart/re-entry behavior: coolant transitions are explicit with `M8` on T1 sections and `M9` before the T2 boundary
- Notes: tool change flow is operator-readable and stable without `M6`

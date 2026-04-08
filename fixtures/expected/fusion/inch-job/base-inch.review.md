# base-inch review

- Result: pass
- Checked startup block: `G90 G20 G17` is present and no `G21` appears.
- Checked second section start: section reset is `G90 G94 G20 G17`, which preserves inch mode.
- Checked re-entry after retract: the bore section restarts in inch mode after `G53 G0 Z0`.
- Notes: emitted depths are consistent with stock-top zero and the configured 0.040 in top stock offset. Header shows `min_seg=0.01mm`, so the active post property differs from the repo default.

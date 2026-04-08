# safe-start-inch review

- Result: pass
- Checked startup block: `G90 G20 G17` is present and no `G21` appears.
- Checked second section start: section reset is `G90 G94 G20 G17`, which preserves inch mode with safe-start enabled.
- Checked re-entry after retract: bore section restarts in inch mode after `G53 G0 Z0`.
- Notes: repost after safe-start fallback fix. Duplicate XY/Z positioning at the start of `02_arc_profile` is no longer present.

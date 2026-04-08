# split-by-tool review

- Result: PASS
- Checked startup block: each sub-file restates metric mode, plane, WCS, and machine-coordinate retract
- Checked section start: each sub-file starts independently with its own tool, spindle start, and warmup dwell
- Checked restart/re-entry behavior: restart-sensitive pocket and later outer-profile files do not depend on the master placeholder file
- Notes: emitted one placeholder master file plus three runnable sub-files: T1 pocket, T2 bore, and T1 outer profile

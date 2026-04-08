# Fusion Adapter Notes

- Treat the Fusion adapter as a hand-maintained implementation layer.
- Keep Fusion callback behavior readable and heavily anchored by fixtures.
- Prefer repo-authored helper structure over imported Autodesk helper stacks.
- Record upstream baseline details in `adapters/fusion/upstream/`.
- Do not let Fusion property definitions become the only documentation of behavior.
- Keep the adapter mock-testable outside Fusion so callback behavior can be unit covered.

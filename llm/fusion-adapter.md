# Fusion Adapter Notes

- Treat the Fusion adapter as a hand-maintained implementation layer.
- Keep Fusion callback behavior readable and heavily anchored by fixtures.
- Prefer repo-authored helper structure over imported Autodesk helper stacks.
- Record upstream baseline details in `adapters/fusion/upstream/`.
- Do not let Fusion property definitions become the only documentation of behavior.
- Keep the adapter mock-testable outside Fusion so callback behavior can be unit covered.
- Do not preserve the imported helper/property surface in the shipped adapter; if old-post access is useful for testing, adapt to it in the mock harness instead.

# Known Pitfalls

- unit mode can silently regress at section boundaries
- optional-block assumptions may not match controller or adapter support
- manual tool-change behavior is easy to break when refactoring safe-start logic
- segment filtering can preserve throughput while still breaking endpoint guarantees if flush rules are incomplete
- split-file workflows amplify modal-state and restart bugs

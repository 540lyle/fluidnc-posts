# Support Matrix

## Adapters

| Adapter | Status | Source of truth | Notes |
| --- | --- | --- | --- |
| Fusion | Planned primary adapter | `specs/`, `fixtures/`, `profiles/`, `adapters/fusion/` | Main product target |
| Other CAM systems | Not started | Same neutral layers if added later | Add only when a real second target exists |

## Controller scope

| Area | Status | Notes |
| --- | --- | --- |
| 3-axis milling | In scope | Primary use case |
| Manual tool changes | In scope | Needs strong restart and operator messaging behavior |
| Split-file workflows | In scope | Important for constrained controllers and job recovery |
| Rotary / indexed multi-axis | Deferred | Support only when a real machine and fixture set exist |
| Turning / mill-turn | Out of scope | Not part of current product goal |

# Fusion Upstream Baseline

## Imported adapter

- local adapter file: `adapters/fusion/FluidNC.cps`
- imported into repo: `2026-04-07`
- imported from: `C:\Users\540ly\AppData\Roaming\Autodesk\Fusion 360 CAM\Posts\FluidNC.cps`

## Autodesk baseline

- source file name: `grbl - ESP32.cps`
- source path: `C:\Users\540ly\AppData\Roaming\Autodesk\Fusion 360 CAM\Posts\grbl - ESP32.cps`
- Autodesk revision: `44214 1f74fb3c348cc93e66ee15e354e2015b2aaf19e6`
- Autodesk date: `2026-02-17 04:16:48`
- fork id: `{154F7C00-6549-4c77-ADE0-79375FE5F2AA}`

## Observed delta areas

- FluidNC branding and metadata
- reduced `minimumChordLength` for arc fidelity
- new FluidNC-oriented post properties
- planner-aware minimum segment filtering
- spindle warmup dwell property
- startup and retract safety sequences
- FluidNC configuration header comments

## Imported risks to fixture first

- split-file and restart workflows still need emitted-output regression fixtures before any refactor
- manual tool-change behavior still needs posted fixture output from Fusion, not just design notes
- planner-sensitive segment filtering still needs real posted cases to validate endpoint behavior

## Risks already addressed in the repo adapter

- startup and section-start safety output now respects the active unit mode instead of hardcoding `G21`
- `safeStartAllOperations` now falls back to required blocks when optional blocks are unsupported

## Custom marker policy

Use consistent tags in the adapter:

- `FLUIDNC:` for controller-oriented behavior
- `CUSTOM:` for local workflow or adapter implementation behavior

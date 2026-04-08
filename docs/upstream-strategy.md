# Upstream Strategy

## Problem

The Fusion adapter likely starts from an Autodesk-supplied post. That creates two separate concerns:

- technical drift from the Autodesk baseline
- legal uncertainty around redistribution of derived artifacts

## Required hygiene

- record the upstream source file and revision
- document local deltas by behavior area
- mark custom code regions consistently
- keep original intent in `specs/` and `fixtures/` so the adapter can be rebuilt or rewritten if needed

## Repository policy

Until redistribution rights are clear:

- keep the repository capable of patch-based distribution
- avoid treating the derived `.cps` as automatically open source
- keep original repository docs and neutral data independent from Autodesk-derived code

## Current publication state

As of April 7, 2026, this repository is public and release `v1.0.1` includes a publicly downloadable `FluidNC.cps` artifact.

That publication choice does not resolve the underlying redistribution question. If Autodesk or their license terms require a change, the repository should be ready to:

- remove or replace the published adapter artifact
- switch future releases to patch-based or apply-script packaging
- preserve behavior intent and fixture coverage so the adapter can be rewritten if needed

## Contributor implication

A contributor should be able to understand and test behavior even if the adapter artifact later needs to be rewritten or distributed differently.

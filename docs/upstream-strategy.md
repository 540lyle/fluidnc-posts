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

## Contributor implication

A contributor should be able to understand and test behavior even if the adapter artifact later needs to be rewritten or distributed differently.

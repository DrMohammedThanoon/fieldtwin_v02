# FieldTwin — Product Requirements

**Challenge:** NASA Space Apps 2026 — *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*
**Tagline:** Find where Earth can test Mars — and prove where the analogy breaks.

## Problem
Rover teams often pick Earth test sites because they *look* Martian. Appearance is not evidence that a site exercises a specific rover mobility or navigation capability.

## Product
FieldTwin takes one real Martian terrain reference and one rover field-test task. It searches a documented Earth region and compares measured terrain descriptors at a matched physical scale. It ranks Earth candidates against a known analog and a negative control. The output is one defensible candidate site plus a reproducible field-test proposal that states what does **not** transfer.

## Five judge-visible answers
1. What Mars task? 2. Where/how did we search Earth? 3. What did the measurements show? 4. What doesn't transfer? 5. What real rover test does this site support?

## Scope (v1)
- Mars: one region with a verified, downloadable CTX-derived DTM (PDS / USGS), plus MOLA for context.
- Earth: NASADEM_HGT.001 (Earthdata) for one bounded search footprint; NASADEM_SC.001 as a cross-check.
- Descriptors: slope distribution, local relief, roughness. All are computed at stated meters, at the same effective scale for both bodies.
- Ranking: interpretable, normalized multi-criteria distance with documented weights and sensitivity analysis.
- ML: optional. Kept only if it passes the pre-registered benchmark in `docs/MODEL_BENCHMARK.md`.

## Out of scope
Global DEM processing, building DTMs from raw stereo pairs, GPU deep learning, Mars coordinates on an Earth basemap, claims of "first-ever" discovery without a novelty audit.

## Acceptance gates (all must pass to submit)
| ID | Gate | Evidence |
|---|---|---|
| G1 | NASA eligibility | ≥1 NASA dataset from the official Resources page actually used; product/granule IDs in `data/SOURCES.md` |
| G2 | Real data | Earth and Mars files opened; CRS, units, spacing and no-data are verified by tests |
| G3 | Matched scale | Both bodies' descriptors computed at the same stated physical scale (m) |
| G4 | Controls | Known analog and negative control both ranked with real data |
| G5 | Honest search | Footprint, exclusions and not-searched areas in `data/SEARCH_SCOPE.md` |
| G6 | Robustness | Rank stability under weight/scale perturbation is reported |
| G7 | Limitations | Analog Transfer Matrix (WORKS / DOES NOT TRANSFER / UNKNOWN) published |
| G8 | Reproducible | Fresh clone: `conda env create`, `pytest`, `npm ci && npm run build` all pass |
| G9 | Public demo | No-login URL with four views and citations; static fallback |

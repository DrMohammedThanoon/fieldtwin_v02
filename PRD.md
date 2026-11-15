# FieldTwin: Product Requirements

**Challenge:** NASA Space Apps 2026, *Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars*
**Tagline:** Find where Earth can test Mars, and prove where the analogy breaks.

## Problem
Rover teams often pick Earth test sites because they *look* Martian. Appearance is not evidence that a site exercises a specific rover mobility or navigation capability.

## Product
FieldTwin takes one real Martian terrain reference and one rover field-test task. It searches documented Earth areas and compares measured terrain descriptors at a matched physical scale. It ranks Earth candidates against a known analog and a negative control. The output is one defensible candidate site plus a reproducible field-test proposal that states what does **not** transfer.

## Five judge-visible answers
1. **What Mars task?** Autonomous route planning and hazard avoidance on Jezero crater-floor/fan terrain (Perseverance).
2. **Where/how did we search Earth?** Jubbah palaeolake region (Nefud, Saudi Arabia), 576 windows; plus Lake Salda (known analog) and Sabkhat Matti (negative control). See `data/SEARCH_SCOPE.md`.
3. **What did the measurements show?** Candidate A (27.729° N, 40.392° E) stays in the top 20 under 10/10 variants; the control ranks last in 10/10.
4. **What doesn't transfer?** Gravity, atmosphere, radiation, surface material and bedform scale. See the Analog Transfer Matrix.
5. **What rover test?** Autonomous navigation across a sand-to-bedrock transition (protocol in `outputs/validated/site_card.json`).

## Scope as delivered (v1)
- **Mars:** USGS Astrogeology CTX DTM over Jezero (20.36 m), derived from MRO CTX images archived in NASA PDS. MOLA is used indirectly: the DTM is aligned to MOLA, and the MOLA shots are retained.
- **Earth:** NASADEM_HGT.001 via NASA Earthdata (4 tiles). NASADEM_SC.001 was **not used**: slopes are recomputed at the common 60 m scale instead.
- **Descriptors:** 7 slope, relief and roughness measures at 60 m in 6 km windows.
- **Ranking:** interpretable robust-z distance, documented weights, 10-variant sensitivity.
- **ML:** not used in v1 (no independent labels; see `docs/MODEL_BENCHMARK.md`). Unsupervised, descriptive ML is planned as a later stage.
- **App:** a public four-chapter web app (`app/`) on GitHub Pages.

## Out of scope
Global DEM processing, building DTMs from raw stereo pairs, GPU deep learning, Mars coordinates on an Earth basemap, claims of "first-ever" discovery.

## Roadmap (after first publish)
1. **Mars picker:** choose any Mars location with CTX DTM coverage → find the closest measured Earth windows.
2. **Saudi-wide Earth library:** NASADEM over the whole of Saudi Arabia.
3. **Descriptive ML:** terrain-type clustering and a Mars-typicality score, reported as descriptive with measured stability.
4. **Future:** global Earth coverage.

## Acceptance gates
| ID | Gate | Evidence | Status |
|---|---|---|---|
| G1 | NASA eligibility | NASADEM_HGT.001 via NASA Earthdata actually used; granule IDs in `data/SOURCES.md` | ✅ data used · ⏳ Resources-page listing to be confirmed in a browser |
| G2 | Real data | Earth and Mars files opened; CRS, units, spacing and no-data verified by `tests/test_sources.py` | ✅ |
| G3 | Matched scale | Both bodies at 60 m on their own local TM grids (`docs/METHODS.md`) | ✅ |
| G4 | Controls | Known analog and negative control ranked with real data | ✅ |
| G5 | Honest search | Footprint, exclusions and not-searched areas in `data/SEARCH_SCOPE.md` | ✅ |
| G6 | Robustness | 10-variant sensitivity in `docs/VALIDATION.md` | ✅ |
| G7 | Limitations | Analog Transfer Matrix published (app chapter 04, `docs/LIMITATIONS.md`) | ✅ |
| G8 | Reproducible | `conda env create`, `pytest`, `npm ci && npm run build` (CI) | ✅ |
| G9 | Public demo | No-login GitHub Pages URL; screenshots in `docs/img/` as fallback | ✅ (after publish) |

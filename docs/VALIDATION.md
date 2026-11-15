# VALIDATION: baseline v1 (Phase 5)

Reproduce: `python -m science.evaluate` → `outputs/validated/sensitivity.json`. All numbers below are copied from that run (2026-11-15).

## Variants tested (10)
- **Weights (60 m):** baseline (1/3 each); slope-, relief- or roughness-heavy (2:1:1); each group left out.
- **Scale:** 90 m and 120 m. Window (6 km), local relief (600 m) and roughness (300 m) stay fixed in metres.
- **Mars reference:** the 8 windows nearest the Perseverance landing site (crater-floor task) instead of all 24.

## Results

| Check | Result | Verdict |
|---|---|---|
| Negative control (Sabkhat Matti) ranks last, best and median | **10 / 10 variants** | ✅ method passes its sanity check |
| Jubbah-region median distance < Lake Salda median | **10 / 10 variants** | ✅ robust |
| Same, with equal sample size (13 random Jubbah windows vs 13 Salda, 2,000 draws) | P = **0.978 – 1.000** across variants | ✅ not a sample-size artefact |
| Best Jubbah window beats best Salda window (equal n) | P = **0.000 – 0.995**, depending on variant | ❌ **not robust; no claim** |
| Baseline top-5 Jubbah windows reproduced (within 3.5 km) | 5/5 down to **0/5** (120 m scale) | ⚠️ individual top windows are unstable |
| Consensus: in top 20 in all 10 variants | **2 windows**: 40.392° E 27.729° N and 40.023° E 28.540° N | ✅ the defensible candidates |

## Interpretation (what we may and may not say)
- **May say:** at 6 km route-planning scale, terrain in the searched Jubbah region (Nefud margin, Saudi Arabia) is, as a population, closer to Jezero's measured slope, relief and roughness than Lake Salda's surroundings. This holds under every weight, scale and reference variant tested.
- **May say:** two specific 6 km windows stay in the top 20 under all 10 variants.
- **May NOT say:** "the best Mars analog", "better than Lake Salda" for a single site, or any percentage similarity. Lake Salda remains a stronger *geological/mineralogical* analog; we measured *terrain geometry* only.
- **Caveats:**
  - The consensus window at 40.023° E sits on the western edge of the searched area, so terrain may continue beyond it (not searched).
  - Both consensus windows lie 50–90 km from the Jubbah palaeolake bed itself. They are **not** the palaeolake.
  - Surface type was checked on imagery afterwards (see "Visual surface check" below): both are dune terrain.

## Pending
- Independent expert rating (none available within the event; see `MODEL_BENCHMARK.md`).

## Visual surface check (2026-11-15, team, satellite imagery)
- **Candidate A (27.729° N, 40.392° E):** crescentic Nefud dunes with interdune hollows. A dark rock massif sits in the SE corner (labelled "Jabal al-Urfa - Jiran" on Google Maps), so this is a **dune-to-bedrock margin**.
- **Candidate B (28.540° N, 40.023° E):** pure dune field.
- **Finding:** at 60 m, geometry-only matching does not distinguish dune fields from Jezero's bedrock/regolith terrain. Surface material is therefore listed as DOES NOT TRANSFER, and the field-test task is framed as navigation across a sand-to-bedrock transition. A dune/material mask is future work.
- **Selected:** candidate A (`outputs/validated/site_card.json`).

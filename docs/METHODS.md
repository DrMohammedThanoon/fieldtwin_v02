# METHODS: baseline v1 (Phase 4)

Reproduce with `python -m science.run_baseline` (fieldtwin env, raw data per `data/SOURCES.md`).

## 1. Common physical scale
- Each DEM is area-averaged (`Resampling.average`) onto a **local transverse-Mercator grid at 60 m**, built on **its own body's** geodetic CRS:
  - Mars: Mars (2015) sphere, R = 3,396,190 m, centred at 18.45° N, 77.45° E.
  - Earth: WGS84, centred on each site's bounding box.
- Mars is never reprojected into an Earth CRS.
- The USGS CTX DTM uses equirectangular with `lat_ts=0`, so its native east–west ground spacing at Jezero is about 19.3 m, not 20.4 m. The local-TM resampling removes this. A unit test confirms that a 10° synthetic ramp still reads 10° after resampling.
- Earth water pixels (NASADEM `.swb` = 255) and no-data are excluded before resampling.

## 2. Windows and descriptors
Non-overlapping **6 km × 6 km windows** (100 × 100 cells). A window is kept only if at least 80 % of its cells are valid.

| Feature | Definition | Group |
|---|---|---|
| `slope_median_deg`, `slope_p90_deg` | slope from central differences at 60 m | slope |
| `slope_frac_gt15`, `slope_frac_gt25` | fraction of cells steeper than 15° / 25° | slope |
| `relief_p95_p5_m` | elevation p95 − p5 within the window | relief |
| `local_relief_600m_median_m` | median of (max − min) in 600 m neighbourhoods | relief |
| `roughness_300m_std_m` | std of elevation minus its 300 m moving mean | roughness |

## 3. Mars reference and distance
- **Mars reference:** all valid 6 km windows of the Jezero DTM (n = 24). They span the crater floor around the Perseverance landing site and the western fan/delta.
- Each feature is scaled by the reference's **robust spread** (1.4826 × MAD, floored at 5 % of |median|).
- **Distance** = sqrt( Σ wᵢ · zᵢ² / Σ wᵢ ), with group weights slope / relief / roughness = 1/3 each, split equally within a group.
- **Interpretation:** a distance of about 1 means the window is roughly one Mars-internal-variability unit from the Jezero median. Lower means more similar. No "% Mars-like" figure is reported.

## 4. Sites (fixed before ranking, see `data/SEARCH_SCOPE.md`)
| Role | Site | Region (lon/lat bbox) |
|---|---|---|
| Search area | Jubbah palaeolake region, Saudi Arabia | 40.0–41.0° E, 27.0–29.0° N |
| Known analog | Lake Salda, Turkey | 29.55–29.85° E, 37.45–37.65° N |
| Negative control | Sabkhat Matti | 51.95–52.15° E, 23.78–23.95° N |

## 5. Known limitations of v1 (addressed in Phase 5)
- **Multiple-comparison bias:** the best-of-576 Jubbah windows is compared with the best-of-13 Salda windows. Site medians are the fairer comparison.
- The weights are a documented choice, not a calibrated one; sensitivity analysis is pending.
- The Mars reference pools crater floor and delta together; a task-specific sub-reference is pending.
- Windows at the edge of the search area can be partly empty (valid fraction 0.80–0.90).
- No visual or geological check of the top Earth windows has been done yet; they could be dune fields rather than palaeolake terrain.

# METHODS: baseline v1

Reproduce (fieldtwin env, raw data per `data/SOURCES.md`):
```
python -m science.run_baseline   # windows, descriptors, ranking
python -m science.evaluate       # 10-variant sensitivity, equal-n test, consensus
python -m science.site_card      # candidate card + transfer matrix
python -m science.figures        # web hillshades + slope distributions
```

## 1. Common physical scale
- Each DEM is area-averaged (`Resampling.average`) onto a **local transverse-Mercator grid at 60 m**, built on **its own body's** geodetic CRS:
  - Mars: Mars (2015) sphere, R = 3,396,190 m, centred at 18.45° N, 77.45° E.
  - Earth: WGS84, centred on each site's bounding box.
- Mars is never reprojected into an Earth CRS.
- The USGS CTX DTM uses equirectangular with `lat_ts=0`, so its native east–west ground spacing at Jezero is about 19.3 m, not 20.4 m. The local-TM resampling removes this. A unit test confirms that a 10° synthetic ramp still reads 10° after resampling.
- Earth water pixels (NASADEM `.swb` = 255) and no-data are excluded before resampling.

## 2. Windows and descriptors
Non-overlapping **6 km × 6 km windows** (100 × 100 cells at 60 m). A window is kept only if at least 80 % of its cells are valid. Window size, local-relief neighbourhood (600 m) and roughness length (300 m) are fixed **in metres**, so the 90 m and 120 m sensitivity grids measure the same physical scales.

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

## 5. Validation and candidate selection
See `docs/VALIDATION.md`:
- 10 variants (weights, 60/90/120 m scale, landing-area Mars reference)
- an equal-sample comparison with the known analog (2,000 draws)
- multi-variant consensus (top 20 in every variant, matched within 3.5 km)
- a visual surface check

Candidate A = consensus window at 27.729° N, 40.392° E.

## 6. Known limitations
- Geometry-only matching at 60 m does not distinguish dune sand from bedrock or regolith (surface material is listed as DOES NOT TRANSFER).
- Weights are a documented choice; sensitivity shows that the region-level result is robust but individual top windows are not.
- Earth search covers three areas only (598 windows); no global claim.
- Windows at the edge of the search area can be partly empty (valid fraction 0.80–0.90).
- Hazards below 60 m (rocks, ripples) are not resolved.

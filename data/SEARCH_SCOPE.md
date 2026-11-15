# Search scope (agreed 2026-11-15)

- **Mars reference region:** Jezero crater, around the Perseverance landing site and western fan/delta front. Product `P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W` (see `SOURCES.md`).
- **Rover task:** route planning and hazard-avoidance rehearsal (autonomous navigation) over crater-floor and fan/delta-front terrain. Terrain must exercise the same **slope distribution, local relief and roughness** at route-planning scale.
- **Analysis scale:** **60 m** for both bodies. Mars DTM is 20.36 m and NASADEM is about 30 m (1 arcsec); both are aggregated to the common 60 m scale. Rock and wheel-scale hazards (< 60 m) are **out of scope** and listed in `docs/LIMITATIONS.md`.
- **Known analog:** Lake Salda, Turkey. NASA-documented as having Jezero-like carbonates and delta features ([NASA Earth Matters, 2021](https://science.nasa.gov/blogs/earth-matters/2021/02/17/what-a-lake-in-turkey-can-tell-us-about-mars)). Note: documented for **geology**, not yet for terrain/mobility. NASADEM tiles `n37e029`, `n37e030`.
- **Earth search areas (Saudi Arabia, palaeolake / fan terrain):**
  - Mundafan palaeolake, Rub' al-Khali ([Crassard et al. 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3722113)). Candidate tiles `n18e043`–`n18e046`. **Exact lake footprint UNVERIFIED**; take it from the published maps before analysis.
  - Jubbah palaeolake, Nefud. Candidate tiles `n27e040`, `n27e041`, `n28e040`, `n28e041`. **Exact footprint UNVERIFIED.**
- **Negative control:** a flat sabkha (salt flat), expected to rank last. Exact sabkha and tile are to be chosen and recorded before ranking.
- **Candidate sampling method:** fixed-size windows matching the Mars reference window area, on a regular grid inside each search area. Windows with less than 80 % valid data are excluded (to be implemented in Phase 4).
- **Exclusions:** urban areas, water bodies and NASADEM voids. Final list recorded here after processing.
- **Areas NOT searched:** everything outside the tiles above, including other documented Mars analogs (Atacama, Utah/MDRS, Mojave, Iceland, Australia). No global claim is made.

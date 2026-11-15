# DESIGN.md: Judge-facing experience ("Terrain Twins")

Single-page React + TypeScript + Vite app with MapLibre GL JS, hosted on GitHub Pages. It reads **only** small precomputed files from `outputs/validated/`. It never loads raw DEMs and never trains models in the browser.

## Concept
A dark, mission-control aesthetic built around a **twin seam**: Mars (rust) and Earth (blue) shown side by side at the *same* scale, resolution and sun angle, but never on the same map. Typography: Space Grotesk (display), Inter (body), IBM Plex Mono (numbers and coordinates).

## Structure
- **Hero:** 24 km shaded relief of Jezero and candidate A; headline; four headline numbers (distance and rank, descriptors inside Jezero's band, stress-test survival, control rank).
- **01 Mission:** Jezero panel with the Perseverance landing marker (Mars coordinates), the rover task, the method in three steps, and the five judge questions answered.
- **02 Search:** MapLibre Earth map of all 598 measured 6 km windows, coloured by distance (single-hue sequential ramp). Fly-to sites, dark / NASA Blue Marble basemaps, hover inspector. A "Mars is not on this map" note.
- **03 Compare:** four-site shaded-relief quartet (identical processing), slope-distribution line chart, robust-z descriptor profile against Jezero's ±1 band, 10-variant stress-test table, "supports / does not support" claims.
- **04 Transfer:** Analog Transfer Matrix (WORKS / PARTIAL / DOES NOT TRANSFER / UNKNOWN), field-test protocol, data credits, AI-use disclosure, reproduction commands.

## Scientific visual rules
- Every number shows its units and analysis scale.
- No "% similar to Mars". Distances are in units of Jezero's own variability.
- Mars and Earth never share a geographic map frame.
- Controls are always shown next to the candidate.
- No-data is transparent, never drawn as terrain.
- Categorical colours validated for colour-vision deficiency on the dark surface (Jezero orange, candidate blue, Salda aqua, control neutral grey); status always pairs an icon with a label.
- Basemap attribution is always visible. No service requires a login.

## States
Loading and error states for data, plus a basemap-failure message. Screenshots in `docs/img/` serve as a static fallback.

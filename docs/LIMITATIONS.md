# LIMITATIONS

_To be completed with verified content; see PRD.md gates._

Always non-transferable from any Earth site: Mars gravity (~0.38 g), thin CO2 atmosphere (~0.6 kPa), radiation environment, temperature regime, regolith chemistry and dust behavior.

## Data-resolution and noise limits (measured)
- **Mars CTX DTM (20 m):** resolves terrain at about 60 m and above. Rocks, small ripples and wheel-scale hazards are NOT represented. Vertical spread vs MOLA after alignment: std 15.1 m.
- **NASADEM (1 arcsec, about 30 m):** on the Sabkhat Matti salt flat (relief 9 m over about 10 km), native-resolution slope median is 2.2°, i.e. elevation noise. Slopes below about 2–3° at 30 m are not interpretable as real terrain, hence the 60 m common analysis scale.
- SRTM-based elevations (year 2000) can be affected by radar penetration into dry sand and by vegetation/structures. Desert sites are mostly unaffected by vegetation, but sand penetration is a possible bias.

## Candidate A: Analog Transfer Matrix
The full matrix is in `outputs/validated/site_card.json`. Summary:
- **WORKS:** slope distribution, local relief and roughness at 60 m; the sand-to-bedrock transition.
- **PARTIAL:** window-scale relief (79 m vs Jezero median 272 m), inside Jezero's wide spread but well below its median. All 7 descriptors lie within ±1 Jezero spread.
- **DOES NOT TRANSFER:** bedform scale, surface material/strength, gravity, atmosphere, radiation.
- **UNKNOWN:** rock and hazard density below 60 m.

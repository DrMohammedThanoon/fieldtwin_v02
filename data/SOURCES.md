# Data sources (exact products actually used)

Official challenge Resources page: https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/?tab=resources
Eligibility status: **UNVERIFIED** until a used product is traced to that page.

Record one row per **downloaded** product. Do not list a product here before it has been downloaded and opened.

| Body | Portal (official list) | Collection / product | Exact granule / product ID | URL / DOI | Mission / instrument | Processing provenance | CRS / datum | Spacing (m) | Vertical units | No-data | Access date | Checksum (SHA-256) | License / citation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mars | USGS Astrogeology STAC (derived from NASA PDS MRO CTX images). **Not one of the 11 listed portals.** Eligibility rests on the Earth NASA product and PDS MOLA. | `mro_ctx_controlled_usgs_dtms`: USGS ASP CTX DTMs, absolutely controlled to MOLA | `P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W` (asset `dtm`) | https://stac.astrogeology.usgs.gov/api/collections/mro_ctx_controlled_usgs_dtms/items/P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W | MRO / CTX stereo pair P02_001820 + P06_003442 | Ames Stereo Pipeline DTM, `pc_align` to MOLA shots (`*_mola_shots.csv`, `qa_metrics.txt` retained). The STAC item has no `provenance` asset; the full item JSON is saved as `stac_item.json` | Mars (2015) sphere R = 3,396,190 m, equirectangular clon = 0; tag `GEOID=mola` | 20.36 | m (float32) | -32767; 77.6 % valid | 2026-11-15 | DTM SHA-256 prefix `7ae74e348d962305` | CC0-1.0; cite USGS Astrogeology CTX DTMs + MRO CTX (Malin et al. 2007) |
| Earth | **NASA Earthdata Search (listed portal)** → LP DAAC | NASADEM_HGT.001, NASADEM Merged DEM Global 1 arc second V001 (CMR `C2763264762-LPCLOUD`) | `NASADEM_HGT_n37e029` (Lake Salda, known analog) | https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_HGT.001/NASADEM_HGT_n37e029/NASADEM_HGT_n37e029.zip ; doi:10.5067/MEASURES/NASADEM/NASADEM_HGT.001 | SRTM (Shuttle Radar Topography Mission, 2000), reprocessed by NASA JPL | NASADEM merged DEM (SRTM reprocessing with ASTER GDEM/ICESat/AW3D void fill); `.num` source flags and `.swb` water mask retained | EPSG:4326, EGM96 geoid heights | 1 arcsec (about 24.5 × 30.7 m at 37.5° N) | m (int16) | -32768; 100 % valid on this tile | 2026-11-15 | zip SHA-256 `fcb67f331b52ae951b35ad4ad9a4269ce09d01d2ff963aa43220ed177833709e` | Public domain (NASA); cite NASA JPL (2020) NASADEM_HGT v001 |
| Earth | **NASA Earthdata Search (listed portal)** → LP DAAC | NASADEM_HGT.001 (CMR `C2763264762-LPCLOUD`) | `NASADEM_HGT_n28e040` (Jubbah palaeolake, north) | https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_HGT.001/NASADEM_HGT_n28e040/NASADEM_HGT_n28e040.zip | SRTM / NASA JPL | as above | EPSG:4326, EGM96 | 1 arcsec (about 27.3 × 30.7 m at 28° N) | m (int16) | -32768; 100 % valid | 2026-11-15 | zip SHA-256 `a5650f9508b3b2d0bd7a47a2c733d7094d815712d8f3ab0d519e59b05b0d077e` | Public domain (NASA) |
| Earth | **NASA Earthdata Search (listed portal)** → LP DAAC | NASADEM_HGT.001 (CMR `C2763264762-LPCLOUD`) | `NASADEM_HGT_n27e040` (Jubbah palaeolake, south / SW basin) | https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_HGT.001/NASADEM_HGT_n27e040/NASADEM_HGT_n27e040.zip | SRTM / NASA JPL | as above | EPSG:4326, EGM96 | 1 arcsec | m (int16) | -32768; 100 % valid | 2026-11-15 | zip SHA-256 `f2662c925bd357823b1db170a96c3f5742192d003454c9da9311d26daf3e042b` | Public domain (NASA) |
| Earth | **NASA Earthdata Search (listed portal)** → LP DAAC | NASADEM_HGT.001 (CMR `C2763264762-LPCLOUD`) | `NASADEM_HGT_n23e052` (Sabkhat Matti, negative control) | https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_HGT.001/NASADEM_HGT_n23e052/NASADEM_HGT_n23e052.zip | SRTM / NASA JPL | as above | EPSG:4326, EGM96 | 1 arcsec (about 28.3 × 30.7 m at 23.8° N) | m (int16) | -32768; 100 % valid | 2026-11-15 | zip SHA-256 `fa06dec8acbb438c07987fd4e8fef7bbf15c2ef3e7ba72710bd229e1a9bea152` | Public domain (NASA) |

### Verified file facts: Earth tile n23e052 (Sabkhat Matti, negative control)
- Bounds 52.0–53.0° E, 23.0–24.0° N; elevation −56 to 176 m (median 68 m); 100 % valid.
- Location: about 23.84° N, 52.03° E ([Wikipedia](https://en.wikipedia.org/wiki/Sabkhat_Matti), a mirror-derived coordinate); extent about 150 km N–S × 50–80 km E–W ([MDPI Hydrology 7(4):94, 2020](https://www.mdpi.com/2306-5338/7/4/94)).
- Measured, about 10 km window at 23.84° N, 52.03° E: median elevation 7 m (not the −17 m quoted by Wikipedia), relief p95−p5 = 9 m, native-30 m slope median 2.23°, p90 5.05°. Windows further south (23.4–23.6° N) are dune-fringed (relief 17–30 m, slope p90 13–19°) and are **excluded** from the control.
- **NASADEM noise floor:** a slope median of about 2.2° on a near-flat salt flat at native 30 m is mostly elevation noise. Comparisons therefore use the 60 m common scale, and slopes below about 2–3° are treated as within noise (see `docs/LIMITATIONS.md`).

### Verified file facts: Earth tiles n28e040 + n27e040 (Jubbah)
- n28e040: 40.0–41.0° E, 28.0–29.0° N; elevation 721–1239 m (median 883 m). Jubbah town (28.02° N, 40.94° E; [Wikipedia](https://en.wikipedia.org/wiki/Jubbah)): 800 m, no surface water.
- n27e040: 40.0–41.0° E, 27.0–28.0° N; elevation 792–1438 m (median 956 m). Point 27.95° N, 40.85° E (SW basin area): 833 m, no surface water.
- Lake bed extent per [Petraglia et al. 2012](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0049840): at least 20 km E–W × 4 km N–S (north depression) plus about 9 × 6 km (SW depression). It straddles 28° N, hence both tiles.

### Verified file facts: Earth tile n37e029 (Lake Salda)
- 3601 × 3601 px, bounds 29.0–30.0° E, 37.0–38.0° N, 100 % valid, elevation 139–2522 m (median 1141 m).
- Test point 37.55° N, 29.68° E (Lake Salda): elevation 1138 m, `.swb` = 255 (water). Confirms the tile covers the lake.
- Downloaded manually through a browser with an Earthdata login. Scripted login (netrc) was rejected by URS; see the README note.

### Verified file facts: Mars DTM (Jezero)
- 1658 × 2221 px, footprint about 33.8 km × 45.2 km. Bounds in metres (equirectangular): x 4,566,963–4,600,721, y 1,060,222–1,105,443.
- Elevation (valid px): min −2673.5 m, median −2055.0 m, max −1344.4 m.
- Contains the Perseverance landing site (18.4447° N, 77.4508° E): pixel (596, 1174), elevation −2529.5 m.
- QA versus MOLA after alignment: mean difference 38.2 m, std 15.1 m, range −154 to +237 m. A constant offset does not affect slope or roughness; the 15 m spread is the relevant vertical-uncertainty indicator.
- **Resolution limit:** 20 m posting resolves terrain at a scale of about 60 m and up (route planning). It does **not** resolve rocks or wheel-scale hazards.

Planned (not yet downloaded):
- Mars context: MGS MOLA MEGDR (PDS Geosciences), the PDS-listed eligibility source on the Mars side
- Earth: NASADEM_HGT.001 (doi:10.5067/MEASURES/NASADEM/NASADEM_HGT.001); NASADEM_SC.001 cross-check

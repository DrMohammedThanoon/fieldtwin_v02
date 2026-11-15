"""Registry of the exact data products FieldTwin v1 uses.

Mirrors data/SOURCES.md (the human-readable record with checksums and
metadata). Raw files live in data/raw/ and are not committed.
"""
from __future__ import annotations

MARS_DTM = {
    "product_id": "P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W",
    "collection": "mro_ctx_controlled_usgs_dtms (USGS Astrogeology STAC)",
    "url": "https://stac.astrogeology.usgs.gov/api/collections/mro_ctx_controlled_usgs_dtms/items/"
           "P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W",
    "license": "CC0-1.0",
    "body": "Mars",
}

NASADEM_COLLECTION = {
    "short_name": "NASADEM_HGT", "version": "001", "cmr_concept_id": "C2763264762-LPCLOUD",
    "doi": "10.5067/MEASURES/NASADEM/NASADEM_HGT.001", "portal": "NASA Earthdata Search (LP DAAC)",
}

EARTH_TILES = {
    "n37e029": "Lake Salda (known analog)",
    "n28e040": "Jubbah palaeolake region, north (search area)",
    "n27e040": "Jubbah palaeolake region, south (search area)",
    "n23e052": "Sabkhat Matti (negative control)",
}


def nasadem_url(tile: str) -> str:
    g = f"NASADEM_HGT_{tile}"
    return f"https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/NASADEM_HGT.001/{g}/{g}.zip"

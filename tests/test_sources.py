"""File-open checks for downloaded source data. Skipped when raw data is absent
(raw rasters are not committed; see data/SOURCES.md to re-download)."""
from pathlib import Path

import numpy as np
import pytest
import rasterio

ROOT = Path(__file__).resolve().parents[1]
MARS_ID = "P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W"
MARS_DTM = ROOT / "data" / "raw" / "mars" / MARS_ID / f"{MARS_ID}_dtm.tif"


@pytest.mark.skipif(not MARS_DTM.exists(), reason="Mars DTM not downloaded")
def test_mars_dtm_metadata():
    with rasterio.open(MARS_DTM) as ds:
        assert ds.count == 1
        assert ds.nodata == -32767
        assert ds.res[0] == pytest.approx(20.36, abs=0.05)
        wkt = ds.crs.to_wkt()
        assert "Mars" in wkt and "3396190" in wkt  # Mars sphere, never an Earth CRS
        a = ds.read(1, masked=True)
        valid = 1 - np.ma.getmaskarray(a).mean()
        assert valid > 0.5
        assert -9000 < float(a.min()) and float(a.max()) < 22000  # plausible Mars elevations (m)

"""Synthetic-DEM tests with known answers (no real data needed)."""
import numpy as np
import pandas as pd
import pytest
from affine import Affine
from pyproj import CRS

from science import baseline, terrain

RES = terrain.ANALYSIS_RES_M


def plane(deg, n=300):
    x = np.arange(n) * RES
    return np.tile(x * np.tan(np.radians(deg)), (n, 1)).astype(np.float32)


def test_slope_of_tilted_plane():
    s = terrain.slope_deg(plane(10), RES)
    assert np.median(s) == pytest.approx(10, abs=1e-3)


def test_window_features_on_plane():
    z = plane(20)
    maps = terrain.descriptor_maps(z, RES)
    f = terrain.window_features(z, maps, 100, 100)
    assert f["slope_median_deg"] == pytest.approx(20, abs=1e-3)
    assert f["slope_frac_gt15"] == 1.0 and f["slope_frac_gt25"] == 0.0
    # 10-cell neighbourhood spans 9 intervals of 60 m along the dip direction
    assert f["local_relief_600m_median_m"] == pytest.approx(9 * RES * np.tan(np.radians(20)), rel=1e-3)
    assert f["roughness_300m_std_m"] == pytest.approx(0, abs=1e-2)  # a plane has no roughness


def test_window_rejected_when_mostly_nodata():
    z = plane(5)
    z[:, :250] = np.nan
    maps = terrain.descriptor_maps(z, RES)
    assert terrain.window_features(z, maps, 0, 100) is None


def test_mars_local_grid_keeps_mars_body():
    mars = CRS.from_proj4("+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +R=3396190 +units=m +no_defs")
    tm = terrain.local_tm_crs(mars, 77.45, 18.45)
    assert tm.ellipsoid.semi_major_metre == pytest.approx(3396190)


def test_equirectangular_ew_stretch_is_removed():
    """A 10 deg east-facing ramp on Mars eqc(lat_ts=0) must still read ~10 deg after local-TM resampling."""
    mars = CRS.from_proj4("+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +R=3396190 +units=m +no_defs")
    lat, lon, px = 18.45, 77.45, 20.0
    R = 3396190.0
    x0, y0 = np.radians(lon) * R, np.radians(lat) * R
    n = 900
    ground_dx = px * np.cos(np.radians(lat))  # true E-W ground spacing of one eqc pixel
    z = np.tile(np.arange(n) * ground_dx * np.tan(np.radians(10)), (n, 1)).astype(np.float32)
    tr = Affine(px, 0, x0 - n / 2 * px, 0, -px, y0 + n / 2 * px)
    g = terrain.to_analysis_grid(z, tr, mars, lon, lat, "mars")
    s = terrain.slope_deg(g.z, g.res)
    assert np.nanmedian(s) == pytest.approx(10, abs=0.3)


def test_baseline_identical_is_zero_and_control_is_far():
    rng = np.random.default_rng(0)
    cols = terrain.FEATURES
    mars = pd.DataFrame(rng.normal(10, 1, (30, len(cols))), columns=cols)
    same = pd.DataFrame([mars[cols].median()], columns=cols)
    flat = pd.DataFrame([[0.5] * len(cols)], columns=cols)
    earth = pd.concat([same.assign(site="same"), flat.assign(site="flat")], ignore_index=True)
    r = baseline.rank_windows(earth, mars)
    assert r.iloc[0]["site"] == "same" and r.iloc[0]["distance"] == pytest.approx(0, abs=1e-9)
    assert r.iloc[-1]["site"] == "flat" and r.iloc[-1]["distance"] > 3


def test_weights_sum_to_one():
    assert sum(baseline.default_weights().values()) == pytest.approx(1.0)

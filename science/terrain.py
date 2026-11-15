"""Terrain descriptors at a common physical scale (Phase 4).

Every DEM (Mars or Earth) is resampled by area-averaging onto a local
transverse-Mercator grid built on *its own* body's geodetic CRS (Mars 2015
sphere for Mars, WGS84 for Earth), at ANALYSIS_RES_M metres. Mars is never
reprojected into an Earth CRS. Descriptors are then computed in
non-overlapping square windows of WINDOW_PX x WINDOW_PX cells.

Why local TM: the USGS Mars DTMs use equirectangular with lat_ts=0, so
east-west pixel spacing on the ground is res*cos(lat) (about 19.3 m instead
of 20.4 m at Jezero). Slopes computed on the native grid would be biased.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import rasterio
from affine import Affine
from pyproj import CRS, Transformer
from pyproj.crs import ProjectedCRS
from pyproj.crs.coordinate_operation import TransverseMercatorConversion
from rasterio.crs import CRS as RioCRS
from rasterio.warp import Resampling, calculate_default_transform, reproject
from scipy import ndimage

ANALYSIS_RES_M = 60.0      # common physical analysis scale (m)
WINDOW_M = 6000.0          # 6 km windows
LOCAL_RELIEF_M = 600.0     # neighbourhood for (max - min)
ROUGHNESS_M = 300.0        # smoothing length; roughness = std of residual
MIN_VALID_FRACTION = 0.8   # windows with less valid data are excluded


def px(metres: float, res: float) -> int:
    """Physical length -> whole cells (at least 2)."""
    return max(2, int(round(metres / res)))


WINDOW_PX = px(WINDOW_M, ANALYSIS_RES_M)            # 100 at 60 m
LOCAL_RELIEF_PX = px(LOCAL_RELIEF_M, ANALYSIS_RES_M)  # 10 at 60 m
ROUGHNESS_PX = px(ROUGHNESS_M, ANALYSIS_RES_M)        # 5 at 60 m

FEATURES = [
    "slope_median_deg",
    "slope_p90_deg",
    "slope_frac_gt15",
    "slope_frac_gt25",
    "relief_p95_p5_m",
    "local_relief_600m_median_m",
    "roughness_300m_std_m",
]


@dataclass
class Grid:
    """Elevation on a metric grid. NaN marks no-data."""

    z: np.ndarray
    transform: Affine
    crs: CRS
    res: float
    body: str


def local_tm_crs(src_crs, lon0: float, lat0: float) -> CRS:
    """Transverse Mercator centred on (lon0, lat0), on the source body's own geodetic CRS."""
    geo = CRS.from_user_input(src_crs).geodetic_crs
    conv = TransverseMercatorConversion(
        latitude_natural_origin=lat0,
        longitude_natural_origin=lon0,
        false_easting=0.0,
        false_northing=0.0,
        scale_factor_natural_origin=1.0,
    )
    return ProjectedCRS(conversion=conv, geodetic_crs=geo, name=f"local TM {lat0:.3f},{lon0:.3f} on {geo.name}")


def to_analysis_grid(z, src_transform, src_crs, lon0, lat0, body, res=ANALYSIS_RES_M) -> Grid:
    """Area-average a float DEM (NaN = no-data) onto a local TM grid at `res` metres."""
    src_crs = CRS.from_user_input(src_crs)
    dst_crs = local_tm_crs(src_crs, lon0, lat0)
    src_rio, dst_rio = RioCRS.from_wkt(src_crs.to_wkt()), RioCRS.from_wkt(dst_crs.to_wkt())
    h, w = z.shape
    left, top = src_transform @ (0, 0)
    right, bottom = src_transform @ (w, h)
    dst_transform, dw, dh = calculate_default_transform(
        src_rio, dst_rio, w, h, left=left, bottom=bottom, right=right, top=top, resolution=res
    )
    out = np.full((dh, dw), np.nan, dtype=np.float32)
    reproject(
        source=z.astype(np.float32),
        destination=out,
        src_transform=src_transform,
        src_crs=src_rio,
        src_nodata=np.nan,
        dst_transform=dst_transform,
        dst_crs=dst_rio,
        dst_nodata=np.nan,
        resampling=Resampling.average,
    )
    return Grid(out, dst_transform, dst_crs, res, body)


def read_dem(path, water_mask_path=None):
    """Read a single-band DEM as float32 with NaN for no-data (and water, if a SWB mask is given)."""
    with rasterio.open(path) as ds:
        z = ds.read(1).astype(np.float32)
        if ds.nodata is not None:
            z[z == ds.nodata] = np.nan
        transform, crs = ds.transform, CRS.from_wkt(ds.crs.to_wkt())
    if water_mask_path is not None:
        with rasterio.open(water_mask_path) as m:
            z[m.read(1) == 255] = np.nan  # NASADEM SWB: 255 = water
    return z, transform, crs


def slope_deg(z: np.ndarray, res: float) -> np.ndarray:
    gy, gx = np.gradient(z, res)
    return np.degrees(np.arctan(np.hypot(gx, gy)))


def descriptor_maps(z: np.ndarray, res: float) -> dict[str, np.ndarray]:
    """Per-cell slope, 600 m local relief and 300 m roughness residual (NaN where undefined)."""
    invalid = ~np.isfinite(z)
    k, r = px(LOCAL_RELIEF_M, res), px(ROUGHNESS_M, res)
    zmax = ndimage.maximum_filter(np.where(invalid, -np.inf, z), size=k)
    zmin = ndimage.minimum_filter(np.where(invalid, np.inf, z), size=k)
    bad_k = ndimage.maximum_filter(invalid.astype(np.uint8), size=k).astype(bool)
    bad_r = ndimage.maximum_filter(invalid.astype(np.uint8), size=r).astype(bool)
    zmean = ndimage.uniform_filter(np.where(invalid, 0.0, z), size=r)
    return {
        "slope": slope_deg(z, res),
        "local_relief": np.where(bad_k, np.nan, zmax - zmin),
        "residual": np.where(bad_r, np.nan, z - zmean),
    }


def window_features(z: np.ndarray, maps: dict, r0: int, c0: int, n: int = WINDOW_PX) -> dict | None:
    """Descriptors for one n x n window; None if valid fraction < MIN_VALID_FRACTION."""
    sl = (slice(r0, r0 + n), slice(c0, c0 + n))
    s = maps["slope"][sl]
    valid = np.isfinite(s)
    frac = float(valid.mean())
    if frac < MIN_VALID_FRACTION:
        return None
    s = s[valid]
    zz = z[sl][np.isfinite(z[sl])]
    lr = maps["local_relief"][sl]
    rs = maps["residual"][sl]
    return {
        "valid_fraction": round(frac, 3),
        "slope_median_deg": float(np.median(s)),
        "slope_p90_deg": float(np.percentile(s, 90)),
        "slope_frac_gt15": float((s > 15).mean()),
        "slope_frac_gt25": float((s > 25).mean()),
        "relief_p95_p5_m": float(np.percentile(zz, 95) - np.percentile(zz, 5)),
        "local_relief_600m_median_m": float(np.nanmedian(lr)) if np.isfinite(lr).any() else np.nan,
        "roughness_300m_std_m": float(np.nanstd(rs)) if np.isfinite(rs).any() else np.nan,
    }


def grid_windows(grid: Grid, n: int | None = None) -> list[dict]:
    """All valid non-overlapping windows with centre lon/lat (body geodetic) and corner polygon."""
    n = n or px(WINDOW_M, grid.res)
    maps = descriptor_maps(grid.z, grid.res)
    to_geo = Transformer.from_crs(grid.crs, grid.crs.geodetic_crs, always_xy=True)
    out = []
    H, W = grid.z.shape
    for r0 in range(0, H - n + 1, n):
        for c0 in range(0, W - n + 1, n):
            f = window_features(grid.z, maps, r0, c0, n)
            if f is None:
                continue
            corners = [grid.transform @ (c, r) for c, r in [(c0, r0), (c0 + n, r0), (c0 + n, r0 + n), (c0, r0 + n)]]
            ring = [to_geo.transform(x, y) for x, y in corners]
            cx, cy = grid.transform @ (c0 + n / 2, r0 + n / 2)
            lon, lat = to_geo.transform(cx, cy)
            f.update(body=grid.body, row=r0, col=c0, lon=round(lon, 5), lat=round(lat, 5),
                     ring=[[round(a, 5), round(b, 5)] for a, b in ring + ring[:1]])
            out.append(f)
    return out

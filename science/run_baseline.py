"""Phase 4 pipeline: Mars reference + Earth windows -> baseline ranking.

Run from the repo root with the fieldtwin env:
    python -m science.run_baseline

Reads raw rasters from data/raw/ (see data/SOURCES.md), writes small
validated outputs to outputs/validated/. The site regions below were fixed
in data/SEARCH_SCOPE.md BEFORE any ranking was computed.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from rasterio.merge import merge
import rasterio

from science import baseline, terrain

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "outputs" / "validated"

MARS = {
    "product_id": "P02_001820_1984_XI_18N282W__P06_003442_1987_XI_18N282W",
    "site": "jezero",
    "lon0": 77.45,
    "lat0": 18.45,
}

EARTH = [
    {"site": "jubbah", "role": "search_area", "tiles": ["n28e040", "n27e040"], "bbox": (40.0, 27.0, 41.0, 29.0)},
    {"site": "lake_salda", "role": "known_analog", "tiles": ["n37e029"], "bbox": (29.55, 37.45, 29.85, 37.65)},
    {"site": "sabkhat_matti", "role": "negative_control", "tiles": ["n23e052"], "bbox": (51.95, 23.78, 52.15, 23.95)},
]


def mars_windows(res: float = terrain.ANALYSIS_RES_M) -> pd.DataFrame:
    df = pd.DataFrame(terrain.grid_windows(mars_grid(res)))
    df["site"], df["role"] = MARS["site"], "mars_reference"
    return df


def earth_grid(spec, res: float = terrain.ANALYSIS_RES_M) -> terrain.Grid:
    """Merge a site's NASADEM tiles (water + no-data -> NaN) onto its local TM grid."""
    paths = [RAW / "earth" / f"NASADEM_HGT_{t}" / f"{t}.hgt" for t in spec["tiles"]]
    swbs = [p.with_suffix(".swb") for p in paths]
    dss = [rasterio.open(p) for p in paths]
    mss = [rasterio.open(p) for p in swbs]
    try:
        z, tr = merge(dss, nodata=-32768)
        m, _ = merge(mss, nodata=0)
        crs = dss[0].crs
    finally:
        for d in dss + mss:
            d.close()
    z = z[0].astype(np.float32)
    z[z == -32768] = np.nan
    z[m[0] == 255] = np.nan  # water
    lon0 = (spec["bbox"][0] + spec["bbox"][2]) / 2
    lat0 = (spec["bbox"][1] + spec["bbox"][3]) / 2
    return terrain.to_analysis_grid(z, tr, crs.to_wkt(), lon0, lat0, "earth", res=res)


def mars_grid(res: float = terrain.ANALYSIS_RES_M) -> terrain.Grid:
    pid = MARS["product_id"]
    z, tr, crs = terrain.read_dem(RAW / "mars" / pid / f"{pid}_dtm.tif")
    return terrain.to_analysis_grid(z, tr, crs, MARS["lon0"], MARS["lat0"], "mars", res=res)


def earth_windows(spec, res: float = terrain.ANALYSIS_RES_M) -> pd.DataFrame:
    g = earth_grid(spec, res)
    df = pd.DataFrame(terrain.grid_windows(g))
    x0, y0, x1, y1 = spec["bbox"]
    df = df[(df.lon >= x0) & (df.lon <= x1) & (df.lat >= y0) & (df.lat <= y1)].copy()
    df["site"], df["role"] = spec["site"], spec["role"]
    return df


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    mars = mars_windows()
    earth = pd.concat([earth_windows(s) for s in EARTH], ignore_index=True)
    weights = baseline.default_weights()
    ranked = baseline.rank_windows(earth, mars, weights)
    med, scale = baseline.reference_stats(mars)

    # Mars reference windows: Mars lon/lat (planetocentric, Mars 2015 sphere). Never on an Earth map.
    mars_out = mars.drop(columns=["ring"]).round(4).to_dict(orient="records")
    (OUT / "mars_reference_windows.json").write_text(json.dumps({
        "body": "Mars", "crs_note": "lon/lat on Mars (2015) sphere, planetocentric; NOT Earth coordinates",
        "product_id": MARS["product_id"], "windows": mars_out}, indent=1, allow_nan=False))

    gj = {"type": "FeatureCollection", "features": []}
    for _, r in ranked.iterrows():
        props = {k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.drop(labels=["ring"]).items()}
        gj["features"].append({"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [r["ring"]]},
                               "properties": props})
    (OUT / "earth_windows.geojson").write_text(json.dumps(gj, allow_nan=False))

    site_summary = (ranked.groupby(["site", "role"])["distance"]
                    .agg(n_windows="count", best="min", median="median").reset_index()
                    .sort_values("best"))
    summary = {
        "method": "baseline v1: robust-z distance to Mars reference windows, group weights slope/relief/roughness = 1/3 each",
        "analysis_res_m": terrain.ANALYSIS_RES_M,
        "window_km": terrain.WINDOW_M / 1000,
        "min_valid_fraction": terrain.MIN_VALID_FRACTION,
        "weights": weights,
        "mars_reference": {"n_windows": len(mars), "median": med.round(4).to_dict(), "scale": scale.round(4).to_dict()},
        "sites": site_summary.round(4).to_dict(orient="records"),
        "top10_windows": ranked.head(10)[["rank", "site", "role", "lon", "lat", "distance"] + terrain.FEATURES]
        .round(4).to_dict(orient="records"),
        "sources": "see data/SOURCES.md",
    }
    (OUT / "baseline_ranking.json").write_text(json.dumps(summary, indent=1, allow_nan=False))

    pd.set_option("display.width", 200)
    print("Mars reference windows:", len(mars))
    print("Mars reference median:\n", med.round(3).to_string())
    print("\nSite summary (distance: lower = more Jezero-like):\n", site_summary.round(3).to_string(index=False))
    print("\nTop 10 windows:\n", ranked.head(10)[["rank", "site", "lon", "lat", "distance", "slope_median_deg",
                                                    "slope_p90_deg", "relief_p95_p5_m", "roughness_300m_std_m"]]
          .round(3).to_string(index=False))


if __name__ == "__main__":
    main()

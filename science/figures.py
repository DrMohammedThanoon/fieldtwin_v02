"""Web figures from real data: matched-scale hillshades + slope distributions.

Run: python -m science.figures   (after run_baseline / evaluate / site_card)

- Hillshades: 12 km x 12 km, 30 m cells, sun azimuth 315 deg / altitude 30 deg,
  identical processing for every site, each in its OWN body's local TM grid.
- Slope distributions: pooled 60 m slopes of the windows used in the ranking.
"""
from __future__ import annotations

import json

import numpy as np
from matplotlib import pyplot as plt
from pyproj import Transformer

from science import terrain
from science.run_baseline import EARTH, MARS, OUT, earth_grid, mars_grid

FIG = OUT / "figures"
SIZE_KM, HS_RES = 12.0, 30.0
BINS = np.arange(0, 36, 1.0)  # 0-35 deg, 1 deg bins
LANDING = (77.4508, 18.4447)


def hillshade(z, res, az=315.0, alt=30.0):
    gy, gx = np.gradient(z, res)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    azr, altr = np.radians(360 - az + 90), np.radians(alt)
    hs = np.sin(altr) * np.cos(slope) + np.cos(altr) * np.sin(slope) * np.cos(azr - aspect)
    return np.clip(hs, 0, 1)


def crop(grid, lon, lat, size_km=SIZE_KM):
    t = Transformer.from_crs(grid.crs.geodetic_crs, grid.crs, always_xy=True)
    x, y = t.transform(lon, lat)
    c, r = ~grid.transform @ (x, y)
    h = int(size_km * 1000 / grid.res / 2)
    H, W = grid.z.shape
    # slide the square inward if it would leave the data (keeps size; centre recorded below)
    r0 = int(min(max(int(r) - h, 0), H - 2 * h))
    c0 = int(min(max(int(c) - h, 0), W - 2 * h))
    z = grid.z[r0:r0 + 2 * h, c0:c0 + 2 * h]
    to_geo = Transformer.from_crs(grid.crs, grid.crs.geodetic_crs, always_xy=True)
    cx, cy = grid.transform @ (c0 + h, r0 + h)
    clon, clat = to_geo.transform(cx, cy)
    return z, (round(clon, 4), round(clat, 4))


def save_hs(z, name, size_km=SIZE_KM):
    hs = hillshade(z, HS_RES)
    ok = np.isfinite(hs)
    g = np.where(ok, hs, 0.0)
    rgba = np.dstack([g, g, g, ok.astype(float)])  # no-data / water -> transparent
    FIG.mkdir(parents=True, exist_ok=True)
    plt.imsave(FIG / f"{name}.png", rgba)
    return {"file": f"figures/{name}.png", "size_km": size_km, "res_m": HS_RES,
            "valid_fraction": round(float(np.isfinite(z).mean()), 3), "px": int(z.shape[0])}


def pooled_slopes(grid, rows_cols):
    maps = terrain.descriptor_maps(grid.z, grid.res)
    n = terrain.px(terrain.WINDOW_M, grid.res)
    vals = [maps["slope"][r:r + n, c:c + n].ravel() for r, c in rows_cols]
    v = np.concatenate(vals)
    return v[np.isfinite(v)]


def hist(v):
    h, _ = np.histogram(np.clip(v, 0, BINS[-1] - 1e-6), bins=BINS)
    return [round(float(x), 5) for x in h / h.sum()]


def main():
    card = json.loads((OUT / "site_card.json").read_text(encoding="utf-8"))
    cand = card["candidate"]
    gj = json.loads((OUT / "earth_windows.geojson").read_text())
    mars_ref = json.loads((OUT / "mars_reference_windows.json").read_text())

    figs, dists = {}, {"bins_deg": BINS.tolist(), "res_m": terrain.ANALYSIS_RES_M, "series": {}}

    # --- Mars (Jezero) ---
    mg30 = mars_grid(HS_RES)
    z, (clon, clat) = crop(mg30, *LANDING)
    figs["jezero"] = save_hs(z, "jezero_hillshade") | {
        "body": "Mars", "center": {"lon_e": clon, "lat_n": clat}, "marker": {"lon_e": LANDING[0], "lat_n": LANDING[1]},
        "label": "Jezero crater floor, Perseverance landing site (Mars 2015 sphere coordinates)"}
    zh, (hlon, hlat) = crop(mg30, *LANDING, size_km=24.0)
    figs["hero_jezero"] = save_hs(zh, "hero_jezero", 24.0) | {"body": "Mars", "center": {"lon_e": hlon, "lat_n": hlat},
                                                            "label": "Jezero, 24 km hero view"}
    mg60 = mars_grid()
    v = pooled_slopes(mg60, [(w["row"], w["col"]) for w in mars_ref["windows"]])
    dists["series"]["jezero"] = {"label": "Jezero reference (24 windows)", "n_cells": int(v.size), "hist": hist(v)}

    # --- Earth sites ---
    centers = {"candidate_a": (cand["center_lon"], cand["center_lat"]),
               "lake_salda": (29.68, 37.55), "sabkhat_matti": (52.03, 23.84)}
    spec_for = {"candidate_a": "jubbah", "lake_salda": "lake_salda", "sabkhat_matti": "sabkhat_matti"}
    labels = {"candidate_a": "Candidate A, Nefud dune-bedrock margin", "lake_salda": "Lake Salda (known analog)",
              "sabkhat_matti": "Sabkhat Matti (negative control)"}
    for key, (lon, lat) in centers.items():
        spec = next(s for s in EARTH if s["site"] == spec_for[key])
        z, (clon, clat) = crop(earth_grid(spec, HS_RES), lon, lat)
        figs[key] = save_hs(z, f"{key}_hillshade") | {
            "body": "Earth", "center": {"lon_e": clon, "lat_n": clat}, "label": labels[key]}
        if key == "candidate_a":
            zh, (hlon, hlat) = crop(earth_grid(spec, HS_RES), lon, lat, size_km=24.0)
            figs["hero_candidate_a"] = save_hs(zh, "hero_candidate_a", 24.0) | {
                "body": "Earth", "center": {"lon_e": hlon, "lat_n": hlat}, "label": "Candidate A, 24 km hero view"}
        g60 = earth_grid(spec)
        feats = [f["properties"] for f in gj["features"] if f["properties"]["site"] == spec["site"]]
        if key == "candidate_a":
            feats = [min(feats, key=lambda p: abs(p["lon"] - lon) + abs(p["lat"] - lat))]
        v = pooled_slopes(g60, [(p["row"], p["col"]) for p in feats])
        dists["series"][key] = {"label": labels[key] + f" ({len(feats)} window{'s' if len(feats) > 1 else ''})",
                                "n_cells": int(v.size), "hist": hist(v)}

    (OUT / "figures.json").write_text(json.dumps(figs, indent=1, allow_nan=False))
    (OUT / "slope_distributions.json").write_text(json.dumps(dists, indent=1, allow_nan=False))
    for k, s in dists["series"].items():
        h = np.array(s["hist"]); mids = BINS[:-1] + 0.5
        print(f"{k:14s} cells={s['n_cells']:7d} mean_slope={float((h * mids).sum()):.2f} deg  share>15={float(h[15:].sum()):.3f}")
    print({k: (f["valid_fraction"], f["px"]) for k, f in figs.items()})


if __name__ == "__main__":
    main()

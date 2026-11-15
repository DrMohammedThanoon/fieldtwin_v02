"""Phase 5 validation of the baseline ranking.

Run:  python -m science.evaluate

Checks (all on real data, no fabricated numbers):
1. Negative control ranks last under every variant.
2. Equal-size comparison: Jubbah vs Lake Salda with the same number of windows
   (random subsamples), removing the best-of-many bias.
3. Weight sensitivity: group weights perturbed / one group left out.
4. Scale sensitivity: 60 / 90 / 120 m analysis grids (same physical window,
   relief and roughness lengths).
5. Mars-reference sensitivity: only the 8 Mars windows nearest the
   Perseverance landing site (crater-floor task) instead of all 24.
Rank stability = how many of the baseline top-5 Jubbah windows have a top-5
window within MATCH_KM (3.5 km) in the variant.
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

from science import baseline, terrain
from science.run_baseline import EARTH, OUT, mars_windows, earth_windows

LANDING_LON, LANDING_LAT = 77.4508, 18.4447  # Perseverance (Octavia E. Butler Landing)
R_MARS, R_EARTH = 3396.19, 6371.0
TOP_N = 20  # consensus: top-N Jubbah windows per variant
MATCH_KM = 3.5  # same place = window centres within ~half a 6 km window


def hav_km(lon1, lat1, lon2, lat2, R):
    lon1, lat1, lon2, lat2 = map(np.radians, (lon1, lat1, lon2, lat2))
    a = np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


def group_weights(fracs: dict) -> dict:
    """fracs: {'slope': a, 'relief': b, 'roughness': c} -> per-feature weights (normalised)."""
    tot = sum(fracs.values())
    w = {}
    for g, feats in baseline.GROUPS.items():
        for f in feats:
            w[f] = (fracs.get(g, 0) / tot) / len(feats)
    return {k: v for k, v in w.items() if v > 0}


WEIGHT_VARIANTS = {
    "baseline": {"slope": 1, "relief": 1, "roughness": 1},
    "slope_heavy": {"slope": 2, "relief": 1, "roughness": 1},
    "relief_heavy": {"slope": 1, "relief": 2, "roughness": 1},
    "roughness_heavy": {"slope": 1, "relief": 1, "roughness": 2},
    "no_slope": {"slope": 0, "relief": 1, "roughness": 1},
    "no_relief": {"slope": 1, "relief": 0, "roughness": 1},
    "no_roughness": {"slope": 1, "relief": 1, "roughness": 0},
}


def site_stats(r: pd.DataFrame) -> dict:
    g = r.groupby("site")["distance"]
    return {s: {"n": int(g.count()[s]), "best": round(float(g.min()[s]), 4), "median": round(float(g.median()[s]), 4)}
            for s in g.count().index}


def control_last(st: dict) -> bool:
    c = st["sabkhat_matti"]
    others = [v for k, v in st.items() if k != "sabkhat_matti"]
    return all(c["best"] > o["best"] and c["median"] > o["median"] for o in others)


def equal_n(r: pd.DataFrame, n_iter=2000, seed=0) -> dict:
    j = r.loc[r.site == "jubbah", "distance"].to_numpy()
    s = r.loc[r.site == "lake_salda", "distance"].to_numpy()
    n = len(s)
    rng = np.random.default_rng(seed)
    meds, bests = np.empty(n_iter), np.empty(n_iter)
    for i in range(n_iter):
        x = rng.choice(j, n, replace=False)
        meds[i], bests[i] = np.median(x), x.min()
    return {
        "n_per_site": n, "iterations": n_iter,
        "salda_median": round(float(np.median(s)), 4), "salda_best": round(float(s.min()), 4),
        "jubbah_median_of_n_p2.5_p50_p97.5": [round(float(v), 4) for v in np.percentile(meds, [2.5, 50, 97.5])],
        "share_jubbah_median_below_salda": round(float((meds < np.median(s)).mean()), 4),
        "share_jubbah_best_below_salda": round(float((bests < s.min()).mean()), 4),
    }


def top5(r: pd.DataFrame) -> pd.DataFrame:
    return r[r.site == "jubbah"].head(5)[["lon", "lat", "distance"]].reset_index(drop=True)


def overlap(base: pd.DataFrame, var: pd.DataFrame, km: float | None = None) -> int:
    km = km or MATCH_KM
    return int(sum(
        (hav_km(b.lon, b.lat, var.lon.to_numpy(), var.lat.to_numpy(), R_EARTH) <= km).any()
        for b in base.itertuples()))


def run_variant(mars, earth, weights):
    return baseline.rank_windows(earth, mars, weights)


def main():
    results = {"variants": []}
    cache = {}
    for res in (60.0, 90.0, 120.0):
        mars = mars_windows(res)
        earth = pd.concat([earth_windows(s, res) for s in EARTH], ignore_index=True)
        cache[res] = (mars, earth)
        print(f"scale {res:.0f} m: Mars windows {len(mars)}, Earth windows {len(earth)}", flush=True)

    mars60, earth60 = cache[60.0]
    base = run_variant(mars60, earth60, group_weights(WEIGHT_VARIANTS["baseline"]))
    base_top = top5(base)
    tops = []

    def record(name, r, mars_n):
        st = site_stats(r)
        row = {"variant": name, "mars_reference_windows": mars_n, "sites": st,
               "control_ranks_last": control_last(st),
               "jubbah_top5_overlap_with_baseline": overlap(base_top, top5(r)),
               "equal_n": equal_n(r),
               "jubbah_top5": top5(r).round(4).to_dict(orient="records")}
        tops.append(r[r.site == "jubbah"].head(TOP_N)[["lon", "lat"]].to_numpy())
        results["variants"].append(row)
        e = row["equal_n"]
        print(f"{name:24s} control_last={row['control_ranks_last']!s:5s} top5_overlap={row['jubbah_top5_overlap_with_baseline']}/5 "
              f"J_med={st['jubbah']['median']:.3f} S_med={st['lake_salda']['median']:.3f} C_med={st['sabkhat_matti']['median']:.3f} "
              f"P(J_med<S_med | equal n)={e['share_jubbah_median_below_salda']:.3f} "
              f"P(J_best<S_best | equal n)={e['share_jubbah_best_below_salda']:.3f}", flush=True)

    for name, fr in WEIGHT_VARIANTS.items():
        record(f"w:{name}@60m", run_variant(mars60, earth60, group_weights(fr)), len(mars60))
    for res in (90.0, 120.0):
        m, e = cache[res]
        record(f"scale:{res:.0f}m", run_variant(m, e, group_weights(WEIGHT_VARIANTS["baseline"])), len(m))
    d = hav_km(mars60.lon.to_numpy(), mars60.lat.to_numpy(), LANDING_LON, LANDING_LAT, R_MARS)
    near = mars60.assign(_d=d).nsmallest(8, "_d").drop(columns="_d")
    record("mars_ref:landing_area_8", run_variant(near, earth60, group_weights(WEIGHT_VARIANTS["baseline"])), len(near))

    # Consensus: for each baseline Jubbah window, in how many variants is a top-N window within MATCH_KM?
    jb = base[base.site == "jubbah"].copy()
    jb["consensus"] = [sum((hav_km(w.lon, w.lat, t[:, 0], t[:, 1], R_EARTH) <= MATCH_KM).any() for t in tops)
                       for w in jb.itertuples()]
    cons = jb.sort_values(["consensus", "distance"], ascending=[False, True]).head(10)
    results["consensus_top10"] = cons[["lon", "lat", "distance", "rank", "consensus"] + terrain.FEATURES].round(4).to_dict(orient="records")
    print(f"\nConsensus (top-{TOP_N} within {MATCH_KM} km, out of {len(tops)} variants):")
    print(cons[["rank", "lon", "lat", "distance", "consensus", "slope_median_deg", "slope_p90_deg", "relief_p95_p5_m", "roughness_300m_std_m"]].round(3).to_string(index=False))

    v = results["variants"]
    results["summary"] = {
        "n_variants": len(v),
        "control_last_in_all": all(x["control_ranks_last"] for x in v),
        "jubbah_median_below_salda_median_in": sum(x["sites"]["jubbah"]["median"] < x["sites"]["lake_salda"]["median"] for x in v),
        "min_top5_overlap": min(x["jubbah_top5_overlap_with_baseline"] for x in v),
        "baseline_top5": base_top.round(4).to_dict(orient="records"),
    }
    (OUT / "sensitivity.json").write_text(json.dumps(results, indent=1, allow_nan=False))
    print("\nSUMMARY", json.dumps(results["summary"], indent=1))


if __name__ == "__main__":
    main()

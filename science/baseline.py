"""Interpretable baseline ranking (Phase 4).

Distance of each Earth window to the Mars reference, in units of the Mars
reference's own robust spread (median / 1.4826*MAD), with documented group
weights: slope 1/3, relief 1/3, roughness 1/3 (split equally inside a group).
A distance of 1.0 means "about one Mars-internal-variability unit away".
Lower is more similar. No percentages, no hidden learned weights.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from science.terrain import FEATURES

GROUPS = {
    "slope": ["slope_median_deg", "slope_p90_deg", "slope_frac_gt15", "slope_frac_gt25"],
    "relief": ["relief_p95_p5_m", "local_relief_600m_median_m"],
    "roughness": ["roughness_300m_std_m"],
}


def default_weights(groups: dict = GROUPS) -> dict[str, float]:
    w = {}
    for feats in groups.values():
        for f in feats:
            w[f] = (1 / len(groups)) / len(feats)
    return w


def reference_stats(ref: pd.DataFrame, features=FEATURES, min_scale_frac: float = 0.05):
    """Robust centre and scale of the reference windows.

    Scale = 1.4826*MAD, floored at `min_scale_frac` x |median| (and a tiny epsilon)
    so a near-constant reference feature cannot explode distances.
    """
    med = ref[features].median()
    mad = (ref[features] - med).abs().median() * 1.4826
    floor = np.maximum(med.abs() * min_scale_frac, 1e-3)
    return med, np.maximum(mad, floor)


def distance(df: pd.DataFrame, med, scale, weights: dict) -> pd.Series:
    feats = list(weights)
    zsq = ((df[feats] - med[feats]) / scale[feats]) ** 2
    w = pd.Series(weights)[feats]
    return np.sqrt((zsq * w).sum(axis=1) / w.sum())


def rank_windows(earth: pd.DataFrame, mars: pd.DataFrame, weights: dict | None = None) -> pd.DataFrame:
    weights = weights or default_weights()
    med, scale = reference_stats(mars)
    out = earth.copy()
    out["distance"] = distance(out, med, scale, weights)
    out = out.sort_values("distance").reset_index(drop=True)
    out["rank"] = np.arange(1, len(out) + 1)
    return out

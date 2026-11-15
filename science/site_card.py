"""Build the candidate site card + Analog Transfer Matrix from measured outputs.

Run: python -m science.site_card   (after science.run_baseline and science.evaluate)
All numbers are read from outputs/validated/*.json; text fields are the team's
documented interpretation (see docs/VALIDATION.md, docs/NOVELTY_AUDIT.md).
"""
from __future__ import annotations

import json

from science.run_baseline import MARS, OUT
from science.terrain import FEATURES

CANDIDATE = {"lon": 40.392, "lat": 27.729}  # consensus window A (10/10 variants), see VALIDATION.md


def main():
    base = json.loads((OUT / "baseline_ranking.json").read_text())
    sens = json.loads((OUT / "sensitivity.json").read_text())
    cand = min(sens["consensus_top10"], key=lambda w: abs(w["lon"] - CANDIDATE["lon"]) + abs(w["lat"] - CANDIDATE["lat"]))
    assert abs(cand["lon"] - CANDIDATE["lon"]) < 0.01 and abs(cand["lat"] - CANDIDATE["lat"]) < 0.01
    sites = {s["site"]: s for s in base["sites"]}
    mars_med = base["mars_reference"]["median"]

    card = {
        "title": "FieldTwin candidate A: Nefud dune-bedrock margin, Ha'il region, Saudi Arabia",
        "classification": "under-recognized candidate / new proposed mission use (see docs/NOVELTY_AUDIT.md); NOT a first-ever claim",
        "mission": {
            "mars_reference": "Jezero crater (Perseverance), USGS CTX DTM " + MARS["product_id"],
            "task": "Rehearse autonomous route planning and hazard avoidance across Jezero-like slope/relief, "
                    "including a sand-to-bedrock transition (cf. Perseverance in sand-rich Seitah next to bedrock).",
        },
        "candidate": {
            "center_lon": cand["lon"], "center_lat": cand["lat"], "window_km": base["window_km"],
            "baseline_rank": cand["rank"], "distance": cand["distance"],
            "consensus_variants": f'{cand["consensus"]}/{sens["summary"]["n_variants"]}',
            "surface_visual_check": "Crescentic dunes with interdune hollows; dark rock massif at SE corner "
                                    "(labelled 'Jabal al-Urfa - Jiran' on Google Maps). Checked by team on satellite imagery, 2026-11-15.",
        },
        "comparison": {
            "features": FEATURES,
            "mars_jezero_median": {f: mars_med[f] for f in FEATURES},
            "candidate_A": {f: cand[f] for f in FEATURES},
            "site_distance_median": {k: v["median"] for k, v in sites.items()},
            "site_distance_best": {k: v["best"] for k, v in sites.items()},
            "known_analog": "lake_salda", "negative_control": "sabkhat_matti",
            "robustness": {
                "control_last_in_all_variants": sens["summary"]["control_last_in_all"],
                "jubbah_median_below_salda_median_in": f'{sens["summary"]["jubbah_median_below_salda_median_in"]}/{sens["summary"]["n_variants"]}',
            },
        },
        "transfer_matrix": [
            {"aspect": "Slope distribution at 60 m (median about 5 deg, p90 about 11 deg)", "status": "WORKS", "evidence": "measured; distance < 0.4 Mars-variability units"},
            {"aspect": "Local relief and 300 m roughness", "status": "WORKS", "evidence": "measured; within Jezero reference spread"},
            {"aspect": "Sand-to-bedrock transition for navigation", "status": "WORKS", "evidence": "visible in imagery; Jezero/Seitah has sand next to bedrock (NASA)"},
            {"aspect": "Window-scale relief (p95-p5)", "status": "PARTIAL", "evidence": f'candidate {cand["relief_p95_p5_m"]:.0f} m vs Jezero median {mars_med["relief_p95_p5_m"]:.0f} m'},
            {"aspect": "Bedform scale (Nefud dunes tens of m vs Martian ripples about 1 m)", "status": "DOES NOT TRANSFER", "evidence": "different aeolian regime"},
            {"aspect": "Surface material, grain size, bearing strength", "status": "DOES NOT TRANSFER", "evidence": "quartz dune sand vs basaltic regolith; not measured"},
            {"aspect": "Gravity (Mars about 0.38 g)", "status": "DOES NOT TRANSFER", "evidence": "physics; wheel sinkage/slip scale differently"},
            {"aspect": "Atmosphere (about 0.6 kPa CO2), dust, temperature", "status": "DOES NOT TRANSFER", "evidence": "physics"},
            {"aspect": "Radiation, communication delay", "status": "DOES NOT TRANSFER", "evidence": "can be emulated operationally only (delay)"},
            {"aspect": "Rock/hazard density below 60 m", "status": "UNKNOWN", "evidence": "below DEM resolution; needs field survey or high-res imagery"},
        ],
        "field_test_protocol": [
            "1. Lay out 3 route segments inside the 6 km window: dune-only, bedrock-only, and dune-to-bedrock crossing, with slope classes <5, 5-15 and 15-25 deg.",
            "2. Run a stereo-vision autonomous navigation stack (AutoNav-like) with an emulated Earth-Mars command delay; log hazard detections.",
            "3. Measure wheel slip vs slope on sand and on bedrock, path efficiency, localization drift, and hazard false positive/negative rates.",
            "4. Repeat at two sun angles (low-texture dune faces are a documented vision failure mode, ESA Morocco 2018).",
            "5. Report results against the Analog Transfer Matrix: sand strength and gravity effects must be corrected, not transferred.",
        ],
        "sources": "data/SOURCES.md; docs/REFERENCES.md",
    }
    (OUT / "site_card.json").write_text(json.dumps(card, indent=1, ensure_ascii=False, allow_nan=False))
    print(json.dumps({k: card[k] for k in ["candidate", "comparison"]}, indent=1)[:2500])


if __name__ == "__main__":
    main()

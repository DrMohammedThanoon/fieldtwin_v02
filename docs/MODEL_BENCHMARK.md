# MODEL_BENCHMARK: ML vs physical baseline

**Decision (2026-11-15, before any ML was built): ML was NOT attempted. The interpretable physical-feature baseline is the scientific core.**

## Why
The plan's ML gate requires, *before* evaluation:
- independent reference relevance ratings (e.g. blinded planetary-geology or robotics experts),
- geographic hold-out regions,
- a primary metric such as expert-rated nDCG@5 with a pre-declared improvement threshold.

Within the event window we have **no independent expert ratings** and only **one known analog** (Lake Salda, documented for geology rather than terrain). Any supervised or "learned similarity" model would have no valid ground truth. A metric like nDCG@5 could not be computed honestly, and rank stability alone does not prove suitability.

## What we did instead
- Transparent baseline (`docs/METHODS.md`): 7 physical descriptors at a matched 60 m scale, robust-z distance, documented weights.
- Validation (`docs/VALIDATION.md`): negative control, equal-n comparison with the known analog, weight/scale/reference sensitivity, multi-variant consensus.

## Pre-registration for future ML work (not executed)
- **Task:** rank 6 km Earth windows for Jezero-like route-planning terrain.
- **Candidate universe:** identical window sets to the baseline.
- **Ground truth:** blinded ratings (0–3) of window hillshades by at least 3 independent raters.
- **Hold-out:** geographic, by tile.
- **Primary metric:** nDCG@5 against the ratings.
- **Threshold:** ML kept only if it gains at least 0.05 absolute nDCG@5 over the baseline on held-out tiles, with no loss of control separation (team decision, not a NASA rule).

No ML metrics exist; none are claimed.

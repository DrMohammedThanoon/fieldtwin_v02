# AGENTS.md — Human/AI workflow rules

Any AI agent working on this repo must read this file first. Other AI tools do **not** read it automatically, so paste or attach it.

## Stop-and-confirm protocol
- One verified action at a time. Show the command and its expected output, run or request it, then verify the actual output before continuing.
- Never claim success without seeing output. Never fabricate data, coordinates, metrics or citations.
- On failure: classify it (missing command, PATH, permissions, network, package conflict, data/CRS, git auth, deployment). Run the smallest safe read-only check, apply one fix, then rerun.
- No destructive commands (`git reset --hard`, force push, deleting data) without explicit human approval.
- Never paste or commit passwords, tokens, `.env`, private keys.

## Git workflow
`git switch main` → `git pull --ff-only` → `git switch -c feat/<task>` → edit/test → `git add <specific files>` → `git commit -m "phase-XX: <verified result>"` → push → PR → one independent reviewer → merge.
Commit messages start with the phase ID. Never force-push `main`.

## Ownership (confirm skills)
| Member | Area |
|---|---|
| Dr. Mohammed Ibrahim Thanoon | Scientific/AI lead, method, model evaluation, final approval |
| Abdulrahman Jaber Alabdali | GIS/remote sensing, Earth/Mars data, QGIS checks |
| Abdulrahman Alazori | Frontend/integration, GitHub workflow, deployment |
| Abdullah Almutiri | Data engineering, automated tests |
| Nouf Alzahrani | Physical plausibility, uncertainty, Mars–Earth limitations |
| Hafsa | Novelty/literature audit, references, demo, submission |

## Blue Team / Red Team gates
| Gate | Required evidence | If failed |
|---|---|---|
| NASA eligibility | Used NASA dataset from official Resources page, IDs recorded | No eligibility claim |
| Real science | Measured Earth + Mars at matched scale, verified metadata | Change target/scale |
| Honest search | Footprint, filters, controls documented | No discovery claim |
| ML contribution | Pre-registered `docs/MODEL_BENCHMARK.md`, measured results | Ship physical baseline only |
| Novelty | `docs/NOVELTY_AUDIT.md` | Call it a "new proposed use", not "first-ever" |
| Reproducibility | Code, manifests, tests, versions | Fix before visuals |
| Public delivery | No-login map, sources, fallback | Static snapshot |

Disputes are resolved by measurement and sources, not by an AI agent's authority.

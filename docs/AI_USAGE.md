# AI USAGE DISCLOSURE

## AI assistance in building FieldTwin
- **Tool:** Claude Code (Anthropic), used as a coding and setup assistant.
- **Used for:**
  - environment setup guidance
  - repository scaffolding
  - drafting Python analysis code, tests and the React app
  - drafting documentation
  - web searches for literature and site coordinates (every source is cited)
- **Human role:** the team chose the Mars reference (Jezero), the search setup (Lake Salda as known analog, Jubbah as search area, Sabkhat Matti as control) and the final candidate. The team also carried out the visual surface check of the candidates on satellite imagery and approved every merge.

## What AI did NOT do
- **No AI-generated data.** Every number in `outputs/validated/` and on the website is computed by the open Python pipeline from downloaded NASA/USGS data. Rerunning the pipeline reproduces the numbers exactly.
- **No AI-generated images.** All terrain images are shaded relief computed from the elevation data.
- **No AI model makes the scientific ranking in v1.** The ranking is an explainable nearest-neighbour distance on physical descriptors. Why a trained model was not used is explained in `docs/MODEL_BENCHMARK.md`.

## Verification practices
- Unit tests with known answers (synthetic slopes, the Mars projection correction) and file-open tests on the real data.
- Every web-sourced fact (site coordinates, analog literature) is cited; facts that could not be verified are marked UNVERIFIED or excluded (e.g. Mundafan).
- Corrections made during review are recorded in git history (e.g. "6/7" corrected to "7/7" descriptors, from the data).

# DESIGN.md — Judge-facing experience

Single-page React + TypeScript + Vite app with MapLibre GL JS. It reads **only** small precomputed files from `outputs/validated/` and never loads raw DEMs or retrains models in the browser.

## Four views (in order)
1. **Mission:** the Mars reference region (shown as a planetary image or chart, **not** an Earth pin), the rover task, and why it needs field testing. Source IDs are visible.
2. **Search:** MapLibre Earth map of the actually screened footprint, exclusions, and candidate cells. A legend says what was *not* searched.
3. **Compare:** candidate vs known analog vs negative control vs Mars reference. Shows slope distribution, relief and roughness in stated units and scale (m), with uncertainty and rank-stability bars.
4. **Transfer:** the Analog Transfer Matrix (WORKS / DOES NOT TRANSFER / UNKNOWN). Gravity, atmosphere, radiation and temperature always appear under DOES NOT TRANSFER. Also shows the proposed rover field-test protocol and full citations.

## Scientific visual rules
- Every number shows its units and analysis scale.
- No "% similar to Mars" headline. Show distances and ranks with their sensitivity.
- Mars and Earth never share a geographic map frame.
- Controls are always shown next to the candidate.
- Missing or no-data areas are drawn as missing, not as zero.
- Colorblind-safe palette. Readable on mobile and desktop.
- Basemap attribution always visible. No service that requires judges to log in.

## States
Loading, data-missing and error states for every view. A static screenshot fallback is linked in the README.

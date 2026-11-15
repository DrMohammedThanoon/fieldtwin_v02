# DEMO

**Live app:** https://drmohammedthanoon.github.io/fieldtwin_v02/
**Code:** https://github.com/DrMohammedThanoon/fieldtwin_v02
Static fallback screenshots: `docs/img/`.

## 2-minute walkthrough (script)
1. **Hero (15 s).** "On the left, Jezero crater on Mars, where Perseverance drives. On the right, a place in Saudi Arabia. Same 24 km, same 30 m pixels, same sun. FieldTwin found it by measurement, not by appearance."
2. **01 Mission (20 s).** "We start from a rover task: autonomous route planning on Jezero-shaped terrain. We measure 24 six-km windows around the landing site on Mars's own coordinate system."
3. **02 Search (25 s).** "We measured 598 windows of NASA NASADEM elevation the same way. Lighter means closer to Jezero." Fly to Candidate A, hover a window, then fly to Lake Salda and Sabkhat Matti.
4. **03 Compare (30 s).** "Same processing for all four sites. The slope distributions of Jezero and candidate A almost overlap. On all seven descriptors candidate A sits inside Jezero's own variability band. We changed weights, scale and the Mars reference 10 ways: the control is always last, and candidate A always stays in the top 20."
5. **04 Transfer (30 s).** "Matching shape is not matching Mars. Gravity, atmosphere, radiation and surface material do not transfer, and we say so. The test we propose: rover navigation across a sand-to-bedrock transition, a documented failure mode for vision-based navigation."

## Key numbers (from `outputs/validated/`)
| Quantity | Value |
|---|---|
| Candidate A | 27.729° N, 40.392° E |
| Distance to Jezero / rank | 0.37 / 2 of 598 |
| Descriptors inside Jezero ±1 spread | 7 / 7 |
| Variants keeping A in the top 20 | 10 / 10 |
| Control ranked last | 10 / 10 |
| Jubbah median below Salda median (equal n) | P = 0.98–1.00 |

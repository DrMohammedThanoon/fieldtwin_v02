import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { FeatureProfile, Robustness, SlopeChart } from './components/Charts'
import { type AppData, FEATURES, type Figure, fmtLatLon, loadAll } from './data'

const SearchMap = lazy(() => import('./components/SearchMap'))
const REPO = 'https://github.com/DrMohammedThanoon/fieldtwin_v02'
const CHAPTERS = [
  { id: 'mission', n: '01', t: 'Mission' },
  { id: 'search', n: '02', t: 'Search' },
  { id: 'compare', n: '03', t: 'Compare' },
  { id: 'transfer', n: '04', t: 'Transfer' },
]
const R_MARS_KM = 3396.19

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.12 })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  })
}

function useActiveChapter() {
  const [active, setActive] = useState('')
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    CHAPTERS.forEach((c) => { const el = document.getElementById(c.id); if (el) io.observe(el) })
    return () => io.disconnect()
  })
  return active
}

function Chapter({ id, n, title, intro, children }: { id: string; n: string; title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <section className="chapter" id={id} aria-labelledby={`${id}-h`}>
      <div className="wrap">
        <div className="chapter-head reveal">
          <div className="chapter-num"><b>{n}</b>{CHAPTERS.find((c) => c.id === id)?.t}</div>
          <div>
            <h2 id={`${id}-h`}>{title}</h2>
            <p className="intro">{intro}</p>
          </div>
        </div>
        {children}
      </div>
    </section>
  )
}

function TerrainPanel({ fig, tone, children }: { fig: Figure; tone: 'mars' | 'earth' | 'salda' | 'control'; children?: ReactNode }) {
  return (
    <div className={`planet-panel ${tone === 'mars' ? '' : tone}`}>
      <div className="tint" />
      <img src={`data/${fig.file}`} alt={`Shaded relief, ${fig.label}, ${fig.size_km} km wide`} loading="lazy" />
      <div className="panel-label">
        <span>{fig.body}</span>
        <span>{fmtLatLon(fig.center.lat_n, fig.center.lon_e)}</span>
      </div>
      <div className="scalebar"><i style={{ width: `${(2 / fig.size_km) * 100}%`, minWidth: 40 }} />2 km</div>
      <div className="north">N</div>
      {children}
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { loadAll().then(setData).catch((e) => setErr(String(e))) }, [])
  useReveal()
  const active = useActiveChapter()

  const stats = useMemo(() => {
    if (!data) return null
    const med = data.baseline.mars_reference.median, sc = data.baseline.mars_reference.scale
    const a = data.card.comparison.candidate_A
    return {
      inBand: FEATURES.filter((k) => Math.abs((a[k] - med[k]) / sc[k]) <= 1).length,
      total: data.windows.features.length,
    }
  }, [data])

  if (err) return <div className="error"><h3>Could not load the validated data</h3><p className="mono muted">{err}</p></div>
  if (!data || !stats) return <div className="loading">Loading measured terrain…</div>

  const { card, figures, sensitivity: sens } = data
  const jz = figures.jezero
  const mk = jz.marker!
  const dxKm = ((mk.lon_e - jz.center.lon_e) * Math.PI / 180) * R_MARS_KM * Math.cos((jz.center.lat_n * Math.PI) / 180)
  const dyKm = ((mk.lat_n - jz.center.lat_n) * Math.PI / 180) * R_MARS_KM
  const mx = 50 + (dxKm / jz.size_km) * 100, my = 50 - (dyKm / jz.size_km) * 100
  const statusClass = (s: string) => (s === 'WORKS' ? 'works' : s === 'PARTIAL' ? 'partial' : s === 'UNKNOWN' ? 'unknown' : 'no')
  const statusIcon = (s: string) => (s === 'WORKS' ? '✓' : s === 'PARTIAL' ? '◐' : s === 'UNKNOWN' ? '?' : '✕')
  const order = ['WORKS', 'PARTIAL', 'DOES NOT TRANSFER', 'UNKNOWN']
  const matrix = [...card.transfer_matrix].sort((p, q) => order.indexOf(p.status) - order.indexOf(q.status))
  const site = (k: string) => data.baseline.sites.find((s) => s.site === k)!

  return (
    <>
      <nav className="nav" aria-label="Chapters">
        <a className="brand" href="#top"><span className="brand-mark" />FIELDTWIN</a>
        <ol>{CHAPTERS.map((c) => <li key={c.id}><a href={`#${c.id}`} className={active === c.id ? 'on' : ''}><span>{c.n}</span>{c.t}</a></li>)}</ol>
        <a className="gh" href={REPO}>GitHub ↗</a>
      </nav>

      <header className="hero" id="top">
        <div className="twin mars">
          <div className="tint" />
          <img src={`data/${figures.hero_jezero.file}`} alt="" />
          <div className="coord"><b>MARS · JEZERO</b>{fmtLatLon(jz.center.lat_n, jz.center.lon_e)}<br />Mars 2015 sphere · CTX DTM</div>
        </div>
        <div className="twin earth">
          <div className="tint" />
          <img src={`data/${figures.hero_candidate_a.file}`} alt="" />
          <div className="coord"><b>EARTH · CANDIDATE A</b>{fmtLatLon(card.candidate.center_lat, card.candidate.center_lon)}<br />WGS84 · NASADEM</div>
        </div>
        <div className="seam" aria-hidden />
        <div className="seam-tag" aria-hidden>same 24 km · same 30 m · same sun</div>
        <div className="hero-copy">
          <div className="wrap">
            <p className="kicker">NASA Space Apps 2026 · Earth analogs for Mars</p>
            <h1>Find where Earth can <em>test Mars</em>, and prove where the analogy breaks.</h1>
            <p className="lede">
              FieldTwin matches the measured shape of the ground around Perseverance's landing site in Jezero crater against {stats.total} windows of
              NASA elevation data on Earth. It found a Saudi dune-to-bedrock margin for rover navigation tests, and it states plainly what that site cannot reproduce.
            </p>
            <div className="chips">
              <div className="chip"><b className="mono">{card.candidate.distance.toFixed(2)}</b><span>distance to Jezero · rank {card.candidate.baseline_rank}/{stats.total}</span></div>
              <div className="chip"><b className="mono">{stats.inBand}/7</b><span>descriptors inside Jezero's band</span></div>
              <div className="chip"><b className="mono">{card.candidate.consensus_variants}</b><span>stress-test variants keep it top-20</span></div>
              <div className="chip"><b className="mono">{sens.summary.control_last_in_all ? `${sens.summary.n_variants}/${sens.summary.n_variants}` : 'no'}</b><span>negative control ranks last</span></div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <Chapter id="mission" n="01" title="A rover task first, a place second."
          intro={<>Instead of asking "where looks like Mars?", FieldTwin asks: <b>which Earth terrain exercises the same rover navigation problem as a real Martian site?</b> The reference is Jezero crater, where Perseverance plans its drives over crater floor and fan terrain.</>}>
          <div className="mission-grid">
            <div className="reveal">
              <TerrainPanel fig={jz} tone="mars">
                <div className="marker" style={{ left: `${mx}%`, top: `${my}%`, background: 'var(--mars)' }} />
                <div className="marker-tag" style={{ left: `${mx}%`, top: `${my}%` }}>Perseverance landing site</div>
              </TerrainPanel>
              <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                Shaded relief from the USGS CTX digital terrain model <span className="mono">{card.mission.mars_reference.split(' ').pop()}</span>, resampled to 30 m on the Mars 2015 sphere. Transparent gaps = no data.
              </p>
            </div>
            <div className="card reveal">
              <p className="eyebrow">The field-test need</p>
              <h3>Rehearse autonomous route planning on Jezero-shaped terrain</h3>
              <p style={{ color: 'var(--text-2)', margin: '8px 0 0' }}>{card.mission.task}</p>
              <ul className="task-list">
                <li><span className="n">01</span><span><b>Measure Mars.</b> Slope, relief and roughness of {data.baseline.mars_reference.n_windows} six-km windows around the landing site, on Mars's own coordinate system.</span></li>
                <li><span className="n">02</span><span><b>Measure Earth the same way.</b> NASA NASADEM elevation, resampled to the identical {data.baseline.analysis_res_m} m scale.</span></li>
                <li><span className="n">03</span><span><b>Rank, then try to break it.</b> A known analog and a negative control are measured alongside every candidate.</span></li>
              </ul>
              <div className="qa">
                <div><span>Q1</span><span><b>What Mars task?</b>Route planning and hazard avoidance on Jezero-like slopes.</span></div>
                <div><span>Q2</span><span><b>Where did we search?</b>Jubbah palaeolake region (Nefud, Saudi Arabia) + Lake Salda + Sabkhat Matti.</span></div>
                <div><span>Q3</span><span><b>What did we measure?</b>7 terrain descriptors at a matched 60 m scale.</span></div>
                <div><span>Q4</span><span><b>What doesn't transfer?</b>Gravity, atmosphere, radiation, sand vs regolith. See chapter 04.</span></div>
                <div><span>Q5</span><span><b>Which rover test?</b>Navigation across a sand-to-bedrock transition.</span></div>
              </div>
            </div>
          </div>
          <ol className="pipeline reveal" aria-label="How FieldTwin works">
            {[
              ['Data', 'Mars: USGS CTX DTM · Earth: NASA NASADEM'],
              ['Matched grid', '60 m, each body on its own local projection'],
              ['Measure', '7 slope, relief & roughness descriptors per 6 km window'],
              ['Rank', 'Distance to Jezero in units of its own variability'],
              ['Stress-test', '10 variants · known analog · negative control'],
              ['Verdict', 'Candidate + what does and does not transfer'],
            ].map(([t, d], i) => (
              <li key={t}><span className="pn">{String(i + 1).padStart(2, '0')}</span><b>{t}</b><span>{d}</span></li>
            ))}
          </ol>
        </Chapter>

        <Chapter id="search" n="02" title="598 windows of Earth, measured and ranked."
          intro={<>Every square is a real 6 × 6 km window of NASA NASADEM elevation, coloured by its distance to Jezero's terrain. Lighter is closer. The search area, the known analog and the control were fixed <i>before</i> any ranking was computed.</>}>
          <div className="reveal"><Suspense fallback={<div className="map-shell loading">Loading map…</div>}><SearchMap data={data} /></Suspense></div>
        </Chapter>

        <Chapter id="compare" n="03" title="Same scale, same sun, same rules."
          intro={<>The four sites below are rendered with identical processing: 12 km wide, 30 m cells, sun from the north-west at 30°. They are shown side by side but never on the same map.</>}>
          <div className="quartet reveal">
            {([
              ['jezero', 'mars', 'var(--mars)', 'Jezero, Mars', 'reference'],
              ['candidate_a', 'earth', 'var(--cand)', 'Candidate A', `distance ${card.candidate.distance.toFixed(2)}`],
              ['lake_salda', 'salda', 'var(--salda)', 'Lake Salda', `known analog · median ${site('lake_salda').median.toFixed(2)}`],
              ['sabkhat_matti', 'control', 'var(--control)', 'Sabkhat Matti', `control · median ${site('sabkhat_matti').median.toFixed(2)}`],
            ] as const).map(([k, tone, c, name, tag]) => (
              <figure key={k}>
                <TerrainPanel fig={figures[k]} tone={tone} />
                <figcaption><b><i style={{ background: c }} />{name}</b><span className="dist-tag">{tag}</span></figcaption>
              </figure>
            ))}
          </div>
          <div className="stack" style={{ marginTop: 28 }}>
            <div className="reveal"><SlopeChart data={data} /></div>
            <div className="reveal"><FeatureProfile data={data} /></div>
            <div className="reveal"><Robustness data={data} /></div>
            <div className="verdict reveal">
              <div className="card may">
                <p className="eyebrow">What the evidence supports</p>
                <ul>
                  <li>At 6 km route-planning scale, the searched Jubbah region is closer to Jezero's terrain than Lake Salda's surroundings, in {sens.summary.jubbah_median_below_salda_median_in}/{sens.summary.n_variants} variants.</li>
                  <li>Candidate A stays in the top 20 under all {sens.summary.n_variants} variants of weights, scale and Mars reference.</li>
                  <li>The negative control is last every time, so the method separates flat from Jezero-like terrain.</li>
                </ul>
              </div>
              <div className="card maynot">
                <p className="eyebrow">What it does not support</p>
                <ul>
                  <li>"The best Mars analog". We searched three areas, not the planet.</li>
                  <li><span>"Better than Lake Salda". Salda is the stronger <i>geological</i> analog; we measured terrain shape only.</span></li>
                  <li>Any "% Mars-like" score. Distances are relative to Jezero's own variability.</li>
                </ul>
              </div>
            </div>
          </div>
        </Chapter>

        <Chapter id="transfer" n="04" title="What transfers, what breaks, and the test we propose."
          intro={<>Candidate A is a <b>{card.classification.split(' (')[0]}</b>. Matching terrain shape is not matching Mars. This table is the honest boundary of the analogy.</>}>
          <div className="matrix reveal" role="table" aria-label="Analog transfer matrix">
            {matrix.map((r) => (
              <div className="mrow" role="row" key={r.aspect}>
                <span className={`status ${statusClass(r.status)}`} role="cell"><span aria-hidden>{statusIcon(r.status)}</span>{r.status}</span>
                <p role="cell">{r.aspect}</p>
                <p className="ev" role="cell">{r.evidence}</p>
              </div>
            ))}
          </div>
          <div className="grid-2" style={{ marginTop: 28 }}>
            <div className="card reveal">
              <p className="eyebrow">Proposed rover field test · candidate A</p>
              <h3 style={{ marginBottom: 18 }}>Navigation across a sand-to-bedrock transition</h3>
              <ol className="protocol">{card.field_test_protocol.map((s) => <li key={s}>{s.replace(/^\d+\.\s*/, '')}</li>)}</ol>
            </div>
            <div className="card reveal">
              <p className="eyebrow">The site</p>
              <h3>{fmtLatLon(card.candidate.center_lat, card.candidate.center_lon)}</h3>
              <p style={{ color: 'var(--text-2)' }}>{card.candidate.surface_visual_check}</p>
              <p style={{ color: 'var(--text-2)' }}>
                No documented rover or Mars-analog use of the Nefud was found in our audit. Arabian analog work so far is in Oman (AMADEE-18) and the UAE. We therefore call this an <b>under-recognized candidate</b>, not a first.
              </p>
              <p className="muted" style={{ fontSize: 13 }}>Access, land permissions and safety must be confirmed with Saudi authorities before any field campaign.</p>
            </div>
          </div>
          <div className="card reveal" style={{ marginTop: 20 }}>
            <p className="eyebrow">Data, methods &amp; credits</p>
            <div className="sources">
              <p><b>Earth elevation.</b> NASA JPL (2020) NASADEM_HGT v001, via NASA Earthdata Search / LP DAAC, doi:10.5067/MEASURES/NASADEM/NASADEM_HGT.001. Tiles n27e040, n28e040, n37e029, n23e052.</p>
              <p><b>Mars elevation.</b> USGS Astrogeology CTX DTM (Ames Stereo Pipeline, aligned to MOLA), CC0, from MRO CTX images archived in NASA PDS.</p>
              <p><b>Map imagery.</b> NASA GIBS Blue Marble; basemap © OpenFreeMap, OpenMapTiles, OpenStreetMap contributors.</p>
              <p><b>Method.</b> Area-averaged to 60 m on each body's own local transverse-Mercator grid; 7 descriptors; robust-z distance with equal group weights; 10-variant sensitivity. Full details are in the repository docs (METHODS, VALIDATION, LIMITATIONS, NOVELTY_AUDIT).</p>
              <p><b>AI use.</b> An AI coding assistant helped write code and documentation; every number on this page is computed from the data by the open pipeline, not generated. ML ranking was deliberately not used (no independent labels to validate it).</p>
              <p><b>Reproduce.</b> <a href={REPO}>{REPO.replace('https://', '')}</a>: <span className="mono">python -m science.run_baseline</span>, <span className="mono">science.evaluate</span>, <span className="mono">science.figures</span>.</p>
            </div>
          </div>
          <div className="card reveal team" style={{ marginTop: 20 }}>
            <p className="eyebrow">Team · NASA Space Apps 2026 Riyadh</p>
            <ul>
              {[
                ['Dr. Mohammed Ibrahim Thanoon', 'Scientific & AI lead · method, evaluation, final approval'],
                ['Abdulrahman Jaber Alabdali', 'GIS & remote sensing · Earth/Mars data'],
                ['Abdulrahman Alazori', 'Frontend, integration & deployment'],
                ['Abdullah Almutiri', 'Data engineering & automated tests'],
                ['Nouf Alzahrani', 'Physical interpretation & limitations'],
                ['Hafsa', 'Novelty audit, references & presentation'],
              ].map(([n, r]) => <li key={n}><b>{n}</b><span>{r}</span></li>)}
            </ul>
          </div>
        </Chapter>
      </main>

      <footer>
        <div className="wrap">
          <span>FieldTwin · NASA Space Apps Challenge 2026 · Riyadh</span>
          <span className="mono">Mars and Earth are compared by measurement, never by map overlay.</span>
        </div>
      </footer>
    </>
  )
}

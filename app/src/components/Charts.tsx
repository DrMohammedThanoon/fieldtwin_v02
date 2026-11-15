import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { type AppData, FEATURE_META, FEATURES, type Feature, type FeatureVec, siteMedians } from '../data'

const SERIES = [
  { key: 'jezero', name: 'Jezero (Mars)', color: 'var(--mars)', dash: '' },
  { key: 'candidate_a', name: 'Candidate A', color: 'var(--cand)', dash: '' },
  { key: 'lake_salda', name: 'Lake Salda', color: 'var(--salda)', dash: '' },
  { key: 'sabkhat_matti', name: 'Sabkhat Matti (control)', color: 'var(--control)', dash: '5 4' },
] as const

/* ---------- slope distribution: line chart with crosshair tooltip ---------- */
export function SlopeChart({ data }: { data: AppData }) {
  const { dists } = data
  const W = 760, H = 320, m = { t: 16, r: 20, b: 40, l: 48 }
  const iw = W - m.l - m.r, ih = H - m.t - m.b
  const nb = dists.bins_deg.length - 1
  const ymax = Math.max(...SERIES.map((s) => Math.max(...dists.series[s.key].hist.slice(1)))) * 1.08
  const x = (i: number) => m.l + ((i + 0.5) / nb) * iw
  const y = (v: number) => m.t + ih - (Math.min(v, ymax) / ymax) * ih
  const [hi, setHi] = useState<number | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const move = (e: PointerEvent) => {
    const r = svg.current!.getBoundingClientRect()
    const vx = ((e.clientX - r.left) / r.width) * W
    setHi(Math.max(0, Math.min(nb - 1, Math.floor(((vx - m.l) / iw) * nb))))
  }
  const yt = [0, 0.05, 0.1, 0.15, 0.2, 0.25].filter((v) => v <= ymax)
  const peak = (k: string) => { const h = dists.series[k].hist; const i = h.indexOf(Math.max(...h)); return { i, v: h[i] } }
  const capped = dists.series['sabkhat_matti'].hist.some((v) => v > ymax)

  return (
    <div className="card chart-card">
      <div className="chart-title">
        <div>
          <p className="eyebrow">Slope distribution · {dists.res_m} m cells · share of area per 1° bin</p>
          <h3>How steep is the ground, cell by cell?</h3>
        </div>
        <div className="legend">{SERIES.map((s) => (
          <span key={s.key}><i style={s.dash ? { backgroundImage: 'repeating-linear-gradient(90deg, var(--control) 0 5px, transparent 5px 9px)' } : { background: s.color }} />{s.name}</span>
        ))}</div>
      </div>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Slope distributions for Jezero, candidate A, Lake Salda and Sabkhat Matti"
        onPointerMove={move} onPointerLeave={() => setHi(null)} style={{ touchAction: 'pan-y' }}>
        {yt.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" />
            <text x={m.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-3)">{Math.round(v * 100)}%</text>
          </g>
        ))}
        {[0, 5, 10, 15, 20, 25, 30, 35].map((d) => (
          <text key={d} x={m.l + (d / nb) * iw} y={H - 16} textAnchor="middle" fontSize="11" fill="var(--text-3)">{d}°</text>
        ))}
        <line x1={m.l} x2={W - m.r} y1={m.t + ih} y2={m.t + ih} stroke="var(--line)" />
        {SERIES.map((s) => {
          const h = dists.series[s.key].hist
          const d = h.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
          return <path key={s.key} d={d} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} strokeLinejoin="round" />
        })}
        {(() => {
          // direct labels: stacked to the right of the peaks, with leader lines (no collisions)
          const lx = x(10)
          const items = SERIES.filter((s) => s.key !== 'sabkhat_matti').map((s) => ({ s, p: peak(s.key) }))
            .sort((a, b) => y(a.p.v) - y(b.p.v))
          let last = -Infinity
          return items.map(({ s, p }) => {
            const ly = Math.max(y(p.v), last + 18)
            last = ly
            return (
              <g key={s.key}>
                <line x1={x(p.i) + 5} y1={y(p.v)} x2={lx - 6} y2={ly - 4} stroke={s.color} strokeWidth={1} opacity={0.6} />
                <text x={lx} y={ly} fontSize="11" fill="var(--text-2)"><tspan fill={s.color}>●</tspan> {s.name} · peak {p.i}–{p.i + 1}°</text>
              </g>
            )
          })
        })()}
        {capped && <text x={x(1) + 8} y={m.t + 10} fontSize="11" fill="var(--text-3)">Control peaks off-scale ↑</text>}
        {hi !== null && (
          <g>
            <line x1={x(hi)} x2={x(hi)} y1={m.t} y2={m.t + ih} stroke="var(--text-3)" strokeDasharray="2 3" />
            {SERIES.map((s) => (
              <circle key={s.key} cx={x(hi)} cy={y(dists.series[s.key].hist[hi])} r={4.5} fill={s.color} stroke="var(--surface-1)" strokeWidth={2} />
            ))}
          </g>
        )}
        <text x={W - m.r} y={H - 2} textAnchor="end" fontSize="11" fill="var(--text-3)">slope (degrees)</text>
      </svg>
      {hi !== null && (
        <div className="tip" style={{ left: `calc(${(x(hi) / W) * 100}% + ${x(hi) / W > 0.6 ? -200 : 16}px)`, top: 70 }}>
          <div className="row" style={{ marginBottom: 6 }}><span>Slope</span><b>{hi}–{hi + 1}°</b></div>
          {SERIES.map((s) => (
            <div className="row" key={s.key}><span><i className="sw" style={{ background: s.color }} />{s.name}</span><b>{(dists.series[s.key].hist[hi] * 100).toFixed(1)}%</b></div>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
        Cells pooled from the windows used in the ranking: {SERIES.map((s) => `${s.name} ${dists.series[s.key].n_cells.toLocaleString()}`).join(' · ')}.
      </p>
    </div>
  )
}

/* ---------- feature profile: robust-z dot plot against Jezero's own spread ---------- */
const PTS = [
  { key: 'cand', name: 'Candidate A', color: 'var(--cand)', shape: 'circle' },
  { key: 'salda', name: 'Lake Salda (median window)', color: 'var(--salda)', shape: 'diamond' },
  { key: 'control', name: 'Sabkhat Matti (median window)', color: 'var(--control)', shape: 'square' },
] as const

export function FeatureProfile({ data }: { data: AppData }) {
  const med = data.baseline.mars_reference.median, sc = data.baseline.mars_reference.scale
  const vals = useMemo(() => ({
    cand: data.card.comparison.candidate_A,
    salda: siteMedians(data.windows, 'lake_salda'),
    control: siteMedians(data.windows, 'sabkhat_matti'),
  }) as Record<'cand' | 'salda' | 'control', FeatureVec>, [data])
  const z = (k: Feature, v: number) => (v - med[k]) / sc[k]
  const L = 4
  const W = 760, rowH = 40, m = { t: 30, r: 24, b: 30, l: 210 }
  const H = m.t + FEATURES.length * rowH + m.b
  const iw = W - m.l - m.r
  const x = (v: number) => m.l + ((Math.max(-L, Math.min(L, v)) + L) / (2 * L)) * iw
  const [hi, setHi] = useState<Feature | null>(null)
  const inBand = FEATURES.filter((k) => Math.abs(z(k, vals.cand[k])) <= 1).length

  const mark = (shape: string, cx: number, cy: number, color: string) =>
    shape === 'circle' ? <circle cx={cx} cy={cy} r={6} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
      : shape === 'diamond' ? <rect x={cx - 5} y={cy - 5} width={10} height={10} transform={`rotate(45 ${cx} ${cy})`} fill={color} stroke="var(--surface-1)" strokeWidth={2} />
        : <rect x={cx - 5} y={cy - 5} width={10} height={10} rx={2} fill={color} stroke="var(--surface-1)" strokeWidth={2} />

  return (
    <div className="card chart-card">
      <div className="chart-title">
        <div>
          <p className="eyebrow">7 descriptors · distance from Jezero in units of Jezero's own variability</p>
          <h3>Candidate A sits inside Jezero's band on {inBand} of 7 descriptors</h3>
        </div>
        <div className="legend">
          <span><i style={{ background: 'color-mix(in oklab, var(--mars) 35%, transparent)', height: 10, width: 18 }} />Jezero ±1 spread</span>
          {PTS.map((p) => <span key={p.key}><i className="dot" style={{ background: p.color, borderRadius: p.shape === 'circle' ? '50%' : 2 }} />{p.name}</span>)}
        </div>
      </div>
      <div className="table-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 560 }} role="img" aria-label="Feature profile versus Jezero">
          <rect x={x(-1)} y={m.t - 8} width={x(1) - x(-1)} height={FEATURES.length * rowH + 4} fill="var(--mars)" opacity={0.14} rx={4} />
          {[-4, -2, -1, 0, 1, 2, 4].map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={m.t - 8} y2={H - m.b + 4} stroke={t === 0 ? 'var(--mars)' : 'var(--line-soft)'} strokeWidth={t === 0 ? 1.5 : 1} />
              <text x={x(t)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-3)">{t > 0 ? `+${t}` : t}{t === 4 ? '+' : t === -4 ? '−' : ''}</text>
            </g>
          ))}
          <text x={x(0)} y={16} textAnchor="middle" fontSize="11" fill="var(--mars)">Jezero median</text>
          {FEATURES.map((k, i) => {
            const cy = m.t + i * rowH + rowH / 2 - 6
            return (
              <g key={k} onPointerEnter={() => setHi(k)} onPointerLeave={() => setHi(null)}>
                <rect x={0} y={cy - rowH / 2} width={W} height={rowH} fill={hi === k ? 'var(--surface-2)' : 'transparent'} />
                <text x={12} y={cy + 4} fontSize="12" fill="var(--text-2)" style={{ fontFamily: 'var(--font-body)' }}>{FEATURE_META[k].label}</text>
                <line x1={m.l} x2={W - m.r} y1={cy} y2={cy} stroke="var(--line-soft)" />
                {PTS.map((p) => {
                  const zv = z(k, vals[p.key][k])
                  return <g key={p.key}>
                    {mark(p.shape, x(zv), cy, p.color)}
                    {Math.abs(zv) > L && <text x={x(zv) + (zv > 0 ? 10 : -10)} y={cy + 4} fontSize="11" textAnchor={zv > 0 ? 'start' : 'end'} fill="var(--text-3)">{zv > 0 ? '›' : '‹'}</text>}
                  </g>
                })}
              </g>
            )
          })}
        </svg>
      </div>
      {hi && (
        <div className="tip" style={{ right: 24, top: 64 }}>
          <div className="row" style={{ marginBottom: 6 }}><span>{FEATURE_META[hi].label}</span><b>{FEATURE_META[hi].unit}</b></div>
          <div className="row"><span><i className="sw" style={{ background: 'var(--mars)' }} />Jezero median</span><b>{FEATURE_META[hi].fmt(med[hi])}</b></div>
          {PTS.map((p) => (
            <div className="row" key={p.key}><span><i className="sw" style={{ background: p.color }} />{p.name}</span>
              <b>{FEATURE_META[hi].fmt(vals[p.key][hi])} <span className="muted">(z {z(hi, vals[p.key][hi]).toFixed(1)})</span></b></div>
          ))}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
        z = (value − Jezero median) ÷ Jezero spread (1.4826 × MAD over {data.baseline.mars_reference.n_windows} Mars windows). Values beyond ±4 are clipped (‹ ›). Hover a row for raw numbers.
      </p>
    </div>
  )
}

/* ---------- robustness table ---------- */
const VARIANT_LABEL: Record<string, string> = {
  'w:baseline@60m': 'Baseline · equal weights · 60 m',
  'w:slope_heavy@60m': 'Slope weighted ×2',
  'w:relief_heavy@60m': 'Relief weighted ×2',
  'w:roughness_heavy@60m': 'Roughness weighted ×2',
  'w:no_slope@60m': 'Slope left out',
  'w:no_relief@60m': 'Relief left out',
  'w:no_roughness@60m': 'Roughness left out',
  'scale:90m': 'Coarser grid · 90 m',
  'scale:120m': 'Coarser grid · 120 m',
  'mars_ref:landing_area_8': 'Mars ref = 8 landing-area windows',
}

export function Robustness({ data }: { data: AppData }) {
  const v = data.sensitivity.variants
  return (
    <div className="card">
      <p className="eyebrow">Stress test · {v.length} variants</p>
      <h3>Does the answer survive when we change the rules?</h3>
      <div className="table-scroll" style={{ marginTop: 16 }}>
        <table className="robust">
          <thead>
            <tr>
              <th>Variant</th><th>Control last</th><th>Median distance<br />Jubbah · Salda · Control</th>
              <th>P(Jubbah median &lt; Salda)<br />equal n = 13</th><th>Top-5 kept</th>
            </tr>
          </thead>
          <tbody>
            {v.map((r) => (
              <tr key={r.variant}>
                <td>{VARIANT_LABEL[r.variant] ?? r.variant}</td>
                <td><span className={r.control_ranks_last ? 'pass' : 'pass fail'}>{r.control_ranks_last ? 'yes' : 'no'}</span></td>
                <td className="mono">{r.sites.jubbah.median.toFixed(2)} · {r.sites.lake_salda.median.toFixed(2)} · {r.sites.sabkhat_matti.median.toFixed(2)}</td>
                <td className="mono">{r.equal_n.share_jubbah_median_below_salda.toFixed(3)}</td>
                <td>
                  <span className="overlap" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < r.jubbah_top5_overlap_with_baseline ? 'on' : ''} />)}</span>
                  <span className="mono">{r.jubbah_top5_overlap_with_baseline}/5</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 12, margin: '12px 0 0' }}>
        Equal-n: 2,000 random draws of 13 Jubbah windows vs the 13 Lake Salda windows removes the best-of-many advantage. "Top-5 kept": baseline top-5 windows reproduced within 3.5 km. Individual top windows are not stable; the region-level result is.
      </p>
    </div>
  )
}

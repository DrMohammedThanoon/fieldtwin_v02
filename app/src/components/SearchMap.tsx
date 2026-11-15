import * as maplibregl from 'maplibre-gl'
import type { ExpressionSpecification, Map as MLMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 runs its tile engine in a separate worker file; let Vite emit it and tell MapLibre where it is.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef, useState } from 'react'
import { type AppData, FEATURE_META, FEATURES, type WindowProps, fmtLatLon } from '../data'

// Sequential single-hue (blue) ramp, stepped for a dark surface: lighter = closer to Jezero.
export const RAMP: [number, string][] = [
  [0.5, '#cde2fb'],
  [0.75, '#86b6ef'],
  [1.0, '#5598e7'],
  [1.5, '#2a78d6'],
  [2.0, '#1c5cab'],
  [Infinity, '#104281'],
]
const rampExpr: ExpressionSpecification = [
  'step', ['get', 'distance'], RAMP[0][1],
  ...RAMP.slice(0, -1).flatMap(([t], i) => [t, RAMP[i + 1][1]]),
] as unknown as ExpressionSpecification

type SiteKey = 'jubbah' | 'candidate' | 'lake_salda' | 'sabkhat_matti'
const SITES: Record<SiteKey, { label: string; role: string; color: string; center: [number, number]; zoom: number }> = {
  candidate: { label: 'Candidate A', role: 'proposed', color: 'var(--cand)', center: [40.392, 27.729], zoom: 10.2 },
  jubbah: { label: 'Jubbah region search', role: '576 windows', color: '#c3c2b7', center: [40.5, 28.0], zoom: 7.4 },
  lake_salda: { label: 'Lake Salda', role: 'known analog', color: 'var(--salda)', center: [29.7, 37.55], zoom: 9.3 },
  sabkhat_matti: { label: 'Sabkhat Matti', role: 'neg. control', color: 'var(--control)', center: [52.05, 23.865], zoom: 9.6 },
}

maplibregl.setWorkerUrl(workerUrl)

const GIBS =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'

export default function SearchMap({ data }: { data: AppData }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const [hover, setHover] = useState<WindowProps | null>(null)
  const [active, setActive] = useState<SiteKey | null>(null)
  const [base, setBase] = useState<'vector' | 'nasa'>('vector')
  const [failed, setFailed] = useState(false)
  const nTotal = data.windows.features.length
  const cand = data.card.candidate

  useEffect(() => {
    if (!el.current) return
    const m = new maplibregl.Map({
      container: el.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      bounds: [[39.75, 26.85], [41.25, 29.15]], // open on the Jubbah search area; fly-to buttons reach the other sites
      fitBoundsOptions: { padding: 40 },
      attributionControl: { compact: true },
      cooperativeGestures: true,
    })
    map.current = m
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    el.current.dataset.mapState = 'init'
    m.on('error', (e) => {
      const msg = String(e.error?.message ?? 'unknown')
      if (el.current) el.current.dataset.mapError = msg.slice(0, 200)
      if (msg.includes('style')) setFailed(true)
    })
    m.on('idle', () => {
      if (!el.current || !m.getLayer('win-fill')) return
      el.current.dataset.mapState = 'idle'
      el.current.dataset.renderedWindows = String(m.queryRenderedFeatures({ layers: ['win-fill'] }).length)
    })
    m.on('load', () => {
      const firstSymbol = m.getStyle().layers.find((l) => l.type === 'symbol')?.id
      m.addSource('gibs', {
        type: 'raster', tiles: [GIBS], tileSize: 256, maxzoom: 8,
        attribution: 'NASA GIBS / Blue Marble',
      })
      m.addLayer({ id: 'gibs', type: 'raster', source: 'gibs', layout: { visibility: 'none' } }, firstSymbol)
      m.addSource('win', { type: 'geojson', data: data.windows, generateId: true })
      m.addLayer({
        id: 'win-fill', type: 'fill', source: 'win',
        paint: {
          'fill-color': rampExpr,
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.95, 0.62],
        },
      }, firstSymbol)
      m.addLayer({
        id: 'win-line', type: 'line', source: 'win',
        paint: {
          'line-color': ['match', ['get', 'site'], 'lake_salda', '#199e70', 'sabkhat_matti', '#b9b7ad', '#0e0d0c'],
          'line-width': ['match', ['get', 'site'], 'jubbah', 0.8, 1.6],
        },
      }, firstSymbol)
      m.addLayer({
        id: 'win-cand', type: 'line', source: 'win',
        filter: ['all', ['==', ['get', 'site'], 'jubbah'], ['==', ['get', 'rank'], cand.baseline_rank]],
        paint: { 'line-color': '#ffffff', 'line-width': 3 },
      })
      let hovered: number | string | undefined
      m.on('mousemove', 'win-fill', (e) => {
        const f = e.features?.[0]
        if (!f) return
        if (hovered !== undefined) m.setFeatureState({ source: 'win', id: hovered }, { hover: false })
        hovered = f.id
        m.setFeatureState({ source: 'win', id: hovered! }, { hover: true })
        m.getCanvas().style.cursor = 'crosshair'
        setHover(f.properties as unknown as WindowProps)
      })
      m.on('mouseleave', 'win-fill', () => {
        if (hovered !== undefined) m.setFeatureState({ source: 'win', id: hovered }, { hover: false })
        hovered = undefined
        m.getCanvas().style.cursor = ''
      })
      const tag = document.createElement('div')
      tag.className = 'marker-tag'
      tag.style.transform = 'translate(-50%, -150%)'
      tag.style.border = '1px solid #3987e5'
      tag.textContent = 'Candidate A'
      new maplibregl.Marker({ element: tag }).setLngLat([cand.center_lon, cand.center_lat]).addTo(m)
    })
    return () => m.remove()
  }, [data, cand.baseline_rank, cand.center_lat, cand.center_lon])

  useEffect(() => {
    const m = map.current
    if (!m || !m.getLayer('gibs')) return
    m.setLayoutProperty('gibs', 'visibility', base === 'nasa' ? 'visible' : 'none')
  }, [base])

  const fly = (k: SiteKey) => {
    setActive(k)
    map.current?.flyTo({ center: SITES[k].center, zoom: SITES[k].zoom, speed: 1.4, essential: true })
  }

  return (
    <div className="map-shell" aria-label="Earth search map">
      <div ref={el} className="map" />
      {failed && <div className="glass" style={{ position: 'absolute', inset: 'auto 14px 14px auto', zIndex: 3 }}>Basemap unavailable; window data is still listed in the Compare section.</div>}
      <div className="map-ui">
        <div className="glass">
          <p className="eyebrow">Fly to</p>
          <div className="site-btns">
            {(Object.keys(SITES) as SiteKey[]).map((k) => (
              <button key={k} className={`site-btn${active === k ? ' on' : ''}`} onClick={() => fly(k)}>
                <i style={{ background: SITES[k].color }} />
                {SITES[k].label}
                <small>{SITES[k].role}</small>
              </button>
            ))}
          </div>
          <div className="toggle" role="group" aria-label="Basemap">
            <button className={base === 'vector' ? 'on' : ''} onClick={() => setBase('vector')}>Dark map</button>
            <button className={base === 'nasa' ? 'on' : ''} onClick={() => setBase('nasa')}>NASA Blue Marble</button>
          </div>
        </div>
        <div className="glass">
          <p className="eyebrow">Distance to Jezero · 6 km windows</p>
          <div className="legend-ramp">{RAMP.map(([t, c]) => <span key={t} style={{ background: c }} title={`< ${t}`} />)}</div>
          <div className="legend-ends"><span>closer &lt;0.5</span><span>1.0</span><span>&gt;2 farther</span></div>
          <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>
            {nTotal} measured windows. Outline: <span style={{ color: '#199e70' }}>■</span> known analog,{' '}
            <span style={{ color: '#b9b7ad' }}>■</span> control, <span style={{ color: '#fff' }}>□</span> candidate A.
          </p>
        </div>
      </div>
      <div className="inspect glass" aria-live="polite">
        {hover ? (
          <>
            <p className="eyebrow">Window · rank {hover.rank} of {nTotal}</p>
            <h3 style={{ margin: '0 0 2px' }}>
              {hover.site === 'jubbah' ? 'Jubbah region' : hover.site === 'lake_salda' ? 'Lake Salda' : 'Sabkhat Matti'}
            </h3>
            <p className="mono muted" style={{ margin: '0 0 10px', fontSize: 12 }}>{fmtLatLon(hover.lat, hover.lon)}</p>
            <table>
              <tbody>
                <tr><td>Distance to Jezero</td><td className="v">{hover.distance.toFixed(3)}</td></tr>
                {FEATURES.map((k) => (
                  <tr key={k}><td>{FEATURE_META[k].label}</td><td className="v">{FEATURE_META[k].fmt(hover[k])} {FEATURE_META[k].unit}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <p className="eyebrow">Inspect</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)' }}>Hover any window to read its measured slope, relief and roughness.</p>
          </>
        )}
      </div>
      <p className="not-mars glass">
        <b style={{ color: 'var(--mars)' }}>Mars is not on this map.</b> Jezero lives on its own planet's grid (Mars 2015 sphere); only its measured numbers are compared here.
      </p>
    </div>
  )
}

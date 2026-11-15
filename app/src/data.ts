import type { FeatureCollection, Polygon } from 'geojson'

// Typed loaders for the precomputed, validated science outputs (public/data/).
export const FEATURES = [
  'slope_median_deg',
  'slope_p90_deg',
  'slope_frac_gt15',
  'slope_frac_gt25',
  'relief_p95_p5_m',
  'local_relief_600m_median_m',
  'roughness_300m_std_m',
] as const
export type Feature = (typeof FEATURES)[number]
export type FeatureVec = Record<Feature, number>

export const FEATURE_META: Record<Feature, { label: string; unit: string; fmt: (v: number) => string; group: string }> = {
  slope_median_deg: { label: 'Median slope', unit: '°', fmt: (v) => v.toFixed(1), group: 'Slope' },
  slope_p90_deg: { label: 'Steep tail (p90 slope)', unit: '°', fmt: (v) => v.toFixed(1), group: 'Slope' },
  slope_frac_gt15: { label: 'Area steeper than 15°', unit: '%', fmt: (v) => (v * 100).toFixed(1), group: 'Slope' },
  slope_frac_gt25: { label: 'Area steeper than 25°', unit: '%', fmt: (v) => (v * 100).toFixed(2), group: 'Slope' },
  relief_p95_p5_m: { label: 'Window relief (p95−p5)', unit: 'm', fmt: (v) => v.toFixed(0), group: 'Relief' },
  local_relief_600m_median_m: { label: 'Local relief (600 m)', unit: 'm', fmt: (v) => v.toFixed(1), group: 'Relief' },
  roughness_300m_std_m: { label: 'Roughness (300 m)', unit: 'm', fmt: (v) => v.toFixed(2), group: 'Roughness' },
}

export type WindowProps = FeatureVec & {
  site: 'jubbah' | 'lake_salda' | 'sabkhat_matti'
  role: string
  lon: number
  lat: number
  distance: number
  rank: number
  valid_fraction: number
}

export interface Baseline {
  analysis_res_m: number
  window_km: number
  weights: Record<Feature, number>
  mars_reference: { n_windows: number; median: FeatureVec; scale: FeatureVec }
  sites: { site: string; role: string; n_windows: number; best: number; median: number }[]
}

export interface Variant {
  variant: string
  control_ranks_last: boolean
  jubbah_top5_overlap_with_baseline: number
  sites: Record<string, { n: number; best: number; median: number }>
  equal_n: {
    n_per_site: number
    share_jubbah_median_below_salda: number
    share_jubbah_best_below_salda: number
  }
}
export interface Sensitivity {
  variants: Variant[]
  summary: { n_variants: number; control_last_in_all: boolean; jubbah_median_below_salda_median_in: number }
}

export interface SiteCard {
  title: string
  classification: string
  mission: { mars_reference: string; task: string }
  candidate: {
    center_lon: number
    center_lat: number
    window_km: number
    baseline_rank: number
    distance: number
    consensus_variants: string
    surface_visual_check: string
  }
  comparison: { candidate_A: FeatureVec; mars_jezero_median: FeatureVec }
  transfer_matrix: { aspect: string; status: 'WORKS' | 'PARTIAL' | 'DOES NOT TRANSFER' | 'UNKNOWN'; evidence: string }[]
  field_test_protocol: string[]
}

export interface Figure {
  file: string
  size_km: number
  res_m: number
  px: number
  body: 'Mars' | 'Earth'
  center: { lon_e: number; lat_n: number }
  marker?: { lon_e: number; lat_n: number }
  label: string
  valid_fraction: number
}
export type Figures = Record<'jezero' | 'candidate_a' | 'lake_salda' | 'sabkhat_matti' | 'hero_jezero' | 'hero_candidate_a', Figure>

export interface SlopeDists {
  bins_deg: number[]
  res_m: number
  series: Record<string, { label: string; n_cells: number; hist: number[] }>
}

export interface AppData {
  baseline: Baseline
  sensitivity: Sensitivity
  card: SiteCard
  figures: Figures
  dists: SlopeDists
  windows: FeatureCollection<Polygon, WindowProps>
}

const get = async <T,>(f: string): Promise<T> => {
  const r = await fetch(`data/${f}`)
  if (!r.ok) throw new Error(`${f}: HTTP ${r.status}`)
  return r.json() as Promise<T>
}

export async function loadAll(): Promise<AppData> {
  const [baseline, sensitivity, card, figures, dists, windows] = await Promise.all([
    get<Baseline>('baseline_ranking.json'),
    get<Sensitivity>('sensitivity.json'),
    get<SiteCard>('site_card.json'),
    get<Figures>('figures.json'),
    get<SlopeDists>('slope_distributions.json'),
    get<AppData['windows']>('earth_windows.geojson'),
  ])
  return { baseline, sensitivity, card, figures, dists, windows }
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Per-site feature medians computed in the browser from the real window data. */
export function siteMedians(fc: AppData['windows'], site: WindowProps['site']): FeatureVec {
  const ps = fc.features.map((f) => f.properties).filter((p) => p.site === site)
  return Object.fromEntries(FEATURES.map((k) => [k, median(ps.map((p) => p[k]))])) as FeatureVec
}

export const fmtLatLon = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(3)}°${lon >= 0 ? 'E' : 'W'}`

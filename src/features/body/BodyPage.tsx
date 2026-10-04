import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider'
import { BellRing, Camera, ChartLine, Eye, EyeOff, GitCompare, Ruler, Target, Trash2 } from 'lucide-react'
import { Rail, Segmented, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { readNudges, setNudge } from '../../components/studio/Nudges'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { db, type ProgressPhoto } from '../../search/db'
import { dayKey } from '../../dates'
import { BODY_KEY, fromDisplay, bmi, bmiBand, display, latest, measures, projection, trend, whtr, whtrBand, type BodyStore, type Entry, type Measure } from './bodyModel'
import '../run/run.css'
import { Sparkline } from '../showcase/Sparkline'
import { usePageActions } from '../../components/ui/PageMenu'
import './body.css'
import { pathLength } from '../../utils/svgLength'

const on = (id: string) => subOn('bodyProgress', id)

function TrendChart({ entries, measure, goal, units }: { entries: Entry[]; measure: Measure; goal?: number; units: BodyStore['units'] }) {
  const path = useRef<SVGPathElement>(null)
  const meta = measures.find((m) => m.id === measure)!
  const pts = entries.filter((e) => e[measure] != null).sort((a, b) => a.date.localeCompare(b.date))
  const raw = pts.map((e) => display(e[measure]!, meta.unit, units).value)
  const smooth = on('smoothing') ? trend(raw) : raw
  const g = goal != null ? display(goal, meta.unit, units).value : null
  useLayoutEffect(() => {
    if (!path.current) return
    const len = pathLength(path.current, 300)
    gsap.fromTo(path.current, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' })
  }, [measure, pts.length])
  if (pts.length < 2) return <p className="studio-empty">Two check-ins and your trend appears.</p>
  const W = 560
  const H = 220
  const all = [...raw, ...(g != null && on('goal') ? [g] : [])]
  const lo = Math.min(...all) - 1
  const hi = Math.max(...all) + 1
  const x = (i: number) => 30 + (i / (pts.length - 1)) * (W - 50)
  const y = (v: number) => H - 24 - ((v - lo) / (hi - lo)) * (H - 44)
  return (
    <svg className="bd-chart" viewBox={`0 0 ${W} ${H}`} aria-label={`${meta.label} trend`}>
      {g != null && on('goal') && (
        <g>
          <line x1="30" x2={W - 20} y1={y(g)} y2={y(g)} className="bd-goal" />
          <text x={W - 20} y={y(g) - 6} textAnchor="end" className="bd-goal-text">
            goal
          </text>
        </g>
      )}
      {raw.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="4" className="bd-dot" />
      ))}
      <path ref={path} d={smooth.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ')} className="bd-line" />
      <text x="30" y={H - 4} className="bd-axis">
        {pts[0].date.slice(5)}
      </text>
      <text x={W - 20} y={H - 4} textAnchor="end" className="bd-axis">
        {pts[pts.length - 1].date.slice(5)}
      </text>
    </svg>
  )
}

function usePhotoUrls(photos: ProgressPhoto[]) {
  const urls = useMemo(() => new Map(photos.map((p) => [p.id, URL.createObjectURL(p.blob)])), [photos])
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls])
  return urls
}

export function BodyPage() {
  const [store, setStoreState] = useState<BodyStore>(() => readStore(BODY_KEY, { entries: [], heightCm: 170, goalWeight: 70, units: 'metric', blur: true }))
  const setStore = (fn: (s: BodyStore) => BodyStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(BODY_KEY, n)
      return n
    })
  const units = on('units') ? store.units : 'metric'
  const today = dayKey()
  const [tab, setTab] = useState('checkin')
  const [draft, setDraft] = useState<Partial<Record<Measure, number>>>(() => Object.fromEntries(measures.map((m) => [m.id, latest(store.entries, m.id) ?? (m.min + m.max) / 3])))
  const [include, setIncludeState] = useState<Measure[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bloom-body-include') ?? 'null') as Measure[] | null
      if (Array.isArray(saved) && saved.length) return saved.filter((m) => measures.some((x) => x.id === m))
    } catch { /* optional */ }
    return ['weight', 'waist']
  })
  const setInclude = (f: (x: Measure[]) => Measure[]) =>
    setIncludeState((x) => {
      const n = f(x)
      try { localStorage.setItem('bloom-body-include', JSON.stringify(n)) } catch { /* optional */ }
      return n
    })
  const [metric, setMetric] = useState<Measure>('weight')
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [pick, setPick] = useState<[string | null, string | null]>([null, null])
  const [reveal, setReveal] = useState(false)
  const [checkIn, setCheckIn] = useState(() => readNudges()['body-checkin']?.enabled ?? false)
  const [saveMessage, setSaveMessage] = useState('')
  const lastSaved = useRef('')
  const saveBtn = useRef<HTMLButtonElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const urls = usePhotoUrls(photos)
  const blurred = on('privacyBlur') && store.blur && !reveal

  useEffect(() => {
    db.progress_photos.orderBy('date').toArray().then(setPhotos).catch(() => setPhotos([]))
  }, [])

  const save = () => {
    if (!include.length || include.some(id => { const m = measures.find(x => x.id === id)!; const v = draft[id]; return v == null || !Number.isFinite(v) || v < m.min || v > m.max })) { setSaveMessage('Select at least one valid measurement.'); return }
    const fingerprint = JSON.stringify([today, include, draft]); if (lastSaved.current === fingerprint) { setSaveMessage('This check-in is already saved.'); return }
    lastSaved.current = fingerprint
    setSaveMessage(`Check-in saved for ${today}. You can update it on the same day.`)
    const entry: Entry = { date: today, ...Object.fromEntries(include.map((m) => [m, draft[m]])) }
    setStore((s) => ({ ...s, entries: [...s.entries.filter((e) => e.date !== today), { ...s.entries.find((e) => e.date === today), ...entry }] }))
    logActivity('bodyCheckIn')
    burst(saveBtn.current, 'stars')
  }
  const addPhoto = async (f: File) => {
    const p: ProgressPhoto = { id: crypto.randomUUID(), date: today, pose: 'front', blob: f }
    await db.progress_photos.put(p).catch(() => undefined)
    setPhotos((l) => [...l, p])
  }
  const weight = latest(store.entries, 'weight')
  const waist = latest(store.entries, 'waist')
  const proj = projection(store.entries, store.goalWeight)
  const fmt = (v: number | undefined, unit: 'kg' | 'cm' | '%') => {
    if (v == null) return '—'
    const d = display(v, unit, units)
    return `${d.value.toFixed(1)} ${d.unit}`
  }

  usePageActions([{ id: 'bd-save', label: 'Save today’s check-in', icon: '📏', run: save }])
  const checkin = () => (
    <div className="studio-split">
      <div className="studio-card bd-sliders">
        <div className="studio-chip-row" role="group" aria-label="Include">
          {measures
            .filter((m) => m.id === 'weight' || on('measurements'))
            .map((m) => (
              <button key={m.id} type="button" className="studio-chip" aria-pressed={include.includes(m.id)} onClick={() => setInclude((x) => (x.includes(m.id) ? x.filter((y) => y !== m.id) : [...x, m.id]))}>
                {m.label}
              </button>
            ))}
        </div>
        {measures
          .filter((m) => include.includes(m.id))
          .map((m) => {
            const d = display(draft[m.id] ?? m.min, m.unit, units)
            return <div key={m.id}><Slider label={m.label} value={draft[m.id] ?? m.min} min={m.min} max={m.max} step={m.step} unit={d.unit} format={() => d.value.toFixed(1)} onChange={(v) => setDraft((x) => ({ ...x, [m.id]: v }))} />
              <label className="body-exact-field">Exact {m.label.toLowerCase()} ({d.unit})<input type="number" step="0.1" aria-label={`Exact ${m.label.toLowerCase()}`} value={Number(d.value.toFixed(2))} min={display(m.min, m.unit, units).value} max={display(m.max, m.unit, units).value} onChange={e => { if (!e.target.value.trim()) return; const value = fromDisplay(Number(e.target.value), m.unit, units); if (Number.isFinite(value) && value >= m.min && value <= m.max) setDraft(x => ({ ...x, [m.id]: value })) }} /></label></div>
          })}
        <button ref={saveBtn} type="button" className="studio-go" disabled={!include.length} onClick={save}>
          <Ruler size={16} /> Save today’s check-in
        </button>
        <p role="status">{!include.length ? 'Select a measurement to save.' : saveMessage}</p>
      </div>
      <div className="studio-card bd-side">
        {on('sparkline') && (() => {
          const w = store.entries.filter((e) => typeof e.weight === 'number')
          return <Sparkline values={w.map((e) => e.weight!)} labels={w.map((e) => e.date)} unit="kg" goodWhenDown={store.goalWeight < (w.at(-1)?.weight ?? 0)} />
        })()}
        <div className="studio-stats">
          <Stat value={fmt(weight, 'kg')} label="weight" />
          {(() => {
            const w = store.entries.filter((e) => typeof e.weight === 'number')
            if (w.length < 2) return null
            const diff = w[w.length - 1].weight! - w[w.length - 2].weight!
            const d = display(Math.abs(diff), 'kg', units)
            return <Stat value={`${diff > 0 ? '+' : diff < 0 ? '−' : ''}${d.value.toFixed(1)} ${d.unit}`} label="since last check-in" />
          })()}
          {on('ratios') && <Stat value={weight ? bmi(weight, store.heightCm).toFixed(1) : '—'} label={weight ? `BMI · ${bmiBand(bmi(weight, store.heightCm))}` : 'BMI'} />}
          {on('ratios') && <Stat value={waist ? whtr(waist, store.heightCm).toFixed(2) : '—'} label={waist ? `waist-to-height · ${whtrBand(whtr(waist, store.heightCm))}` : 'waist-to-height'} />}
        </div>
        {on('ratios') && <Slider label="Height" value={store.heightCm} min={130} max={215} unit={units === 'metric' ? 'cm' : 'in'} format={(v) => (units === 'metric' ? String(v) : (v * 0.393701).toFixed(1))} onChange={(v) => setStore((s) => ({ ...s, heightCm: v }))} />}
        {on('units') && <Segmented label="Units" value={store.units} onChange={(u) => setStore((s) => ({ ...s, units: u }))} options={[{ id: 'metric', label: 'kg · cm' }, { id: 'imperial', label: 'lb · in' }]} />}
        {on('checkIn') && (
          <button
            type="button"
            className="studio-chip"
            aria-pressed={checkIn}
            onClick={() => {
              setCheckIn(!checkIn)
              setNudge({ id: 'body-checkin', title: 'Weekly check-in', body: 'A quick measure keeps the trend honest.', page: 'body', every: 7 * 24 * 60, enabled: !checkIn })
            }}
          >
            <BellRing size={13} /> Weekly reminder {checkIn ? 'on' : 'off'}
          </button>
        )}
        <p className="studio-empty">Bodies fluctuate daily. Bloom looks at the trend, not a single day.</p>
      </div>
    </div>
  )

  const trends = () => (
    <div className="studio-card bd-trends">
      <div className="studio-chip-row" role="group" aria-label="Measurement">
        {measures.map((m) => (
          <button key={m.id} type="button" className="studio-chip" aria-pressed={metric === m.id} onClick={() => setMetric(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <TrendChart entries={store.entries} measure={metric} goal={metric === 'weight' ? store.goalWeight : undefined} units={units} />
    </div>
  )

  const photosTab = () => (
    <div className="bd-photos">
      <div className="bd-photo-bar">
        <button type="button" className="studio-go" onClick={() => file.current?.click()}>
          <Camera size={16} /> Add photo
        </button>
        <input ref={file} type="file" accept="image/*" capture="user" hidden onChange={(e) => e.target.files?.[0] && void addPhoto(e.target.files[0])} />
        {on('privacyBlur') && (
          <button type="button" className="studio-chip" aria-pressed={reveal} onClick={() => setReveal(!reveal)}>
            {reveal ? <EyeOff size={13} /> : <Eye size={13} />} {reveal ? 'Hide' : 'Reveal'}
          </button>
        )}
        <span className="studio-empty">Stored only on this device.</span>
      </div>
      {photos.length ? (
        <Rail label="Progress photos">
          {photos.map((p) => (
            <figure key={p.id} role="listitem" className="bd-photo" data-blur={blurred}>
              <img loading="lazy" decoding="async" src={urls.get(p.id)} alt={`Progress photo ${p.date}`} />
              <figcaption>
                {p.date}
                {on('compare') && (
                  <span>
                    <button type="button" className="studio-chip" aria-pressed={pick[0] === p.id} onClick={() => setPick([p.id, pick[1]])}>
                      Before
                    </button>
                    <button type="button" className="studio-chip" aria-pressed={pick[1] === p.id} onClick={() => setPick([pick[0], p.id])}>
                      After
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Delete photo"
                  onClick={() => {
                    setPhotos((l) => l.filter((x) => x.id !== p.id))
                    void db.progress_photos.delete(p.id)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </figcaption>
            </figure>
          ))}
        </Rail>
      ) : (
        <p className="studio-empty">Photos show change the scale can’t.</p>
      )}
    </div>
  )

  const a = pick[0] ?? photos[0]?.id
  const b = pick[1] ?? photos[photos.length - 1]?.id
  const compare = () =>
    photos.length < 2 || !a || !b ? (
      <p className="studio-empty">Add two photos to compare them.</p>
    ) : (
      <div className="bd-compare" data-blur={blurred} onClick={() => setReveal(true)}>
        <ReactCompareSlider itemOne={<ReactCompareSliderImage src={urls.get(a)} alt="Before" />} itemTwo={<ReactCompareSliderImage src={urls.get(b)} alt="After" />} />
        <div className="bd-compare-labels">
          <span>{photos.find((p) => p.id === a)?.date}</span>
          <span>{photos.find((p) => p.id === b)?.date}</span>
        </div>
      </div>
    )

  const goals = () => (
    <div className="studio-split">
      <div className="studio-card bd-side">
        <h3>
          <Target size={17} /> Goal weight
        </h3>
        <Slider label="Goal" value={store.goalWeight} min={35} max={200} step={0.5} unit={units === 'metric' ? 'kg' : 'lb'} format={(v) => display(v, 'kg', units).value.toFixed(1)} onChange={(v) => setStore((s) => ({ ...s, goalWeight: v }))} />
        {proj ? (
          <div className="studio-stats">
            <Stat value={`${proj.perWeek >= 0 ? '+' : ''}${display(proj.perWeek, 'kg', units).value.toFixed(2)}`} label={`${units === 'metric' ? 'kg' : 'lb'} per week (trend)`} />
            <Stat value={proj.date ? proj.date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} label="projected goal date" />
          </div>
        ) : (
          <p className="studio-empty">Three weigh-ins and Bloom projects a date.</p>
        )}
      </div>
      <div className="studio-card studio-center bd-ring">
        {weight != null && (
          <svg viewBox="0 0 160 160" className="run-goal" aria-label="Progress to goal">
            <circle cx="80" cy="80" r="66" className="run-goal-track" />
            <circle cx="80" cy="80" r="66" className="run-goal-arc" strokeDasharray={2 * Math.PI * 66} strokeDashoffset={2 * Math.PI * 66 * Math.min(1, Math.abs(weight - store.goalWeight) / Math.max(1, Math.abs((store.entries.find((e) => e.weight != null)?.weight ?? weight) - store.goalWeight)))} transform="rotate(-90 80 80)" />
            <text x="80" y="80" textAnchor="middle">
              {display(Math.abs(weight - store.goalWeight), 'kg', units).value.toFixed(1)}
            </text>
            <text x="80" y="100" textAnchor="middle" className="run-goal-sub">
              {units === 'metric' ? 'kg' : 'lb'} to go
            </text>
          </svg>
        )}
      </div>
    </div>
  )

  return (
    <Studio
      name="body"
      accent="#c2567a"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#f4a7b9', '#c9b8ff', '#ffd8b0']} line="wave" />}
      tabs={[
        { id: 'checkin', label: 'Check-in', icon: <Ruler size={15} />, render: checkin },
        ...(on('trendLine') ? [{ id: 'trends', label: 'Trends', icon: <ChartLine size={15} />, render: trends }] : []),
        ...(on('photos') ? [{ id: 'photos', label: 'Photos', icon: <Camera size={15} />, render: photosTab }] : []),
        ...(on('compare') && on('photos') ? [{ id: 'compare', label: 'Compare', icon: <GitCompare size={15} />, render: compare }] : []),
        ...(on('goal') ? [{ id: 'goal', label: 'Goal', icon: <Target size={15} />, render: goals }] : []),
      ]}
    />
  )
}

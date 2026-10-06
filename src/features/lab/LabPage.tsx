import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Archive, FileDown, FlaskConical, Loader2 } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { subOn } from '../subFeatures'
import { SLEEP_KEY, type SleepEntry } from '../sleep/sleepModel'
import { GRATITUDE_KEY, MOOD_KEY } from '../wellbeing/store'
import { readDiet } from '../diet/dietModel'
import { ENERGY_KEY, type TimeLog } from '../energy/energyModel'
import { dailyRows, findings, matrix, metrics, regression, strength, type MetricId } from './labModel'
import { buildBackupZip, download } from './exportSuite'
import { EnergyCompass } from '../innovation/EnergyCompass'
import './lab.css'

const readArray = <T,>(key: string): T[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}
const readLogs = () => {
  try {
    const v = JSON.parse(localStorage.getItem(ENERGY_KEY) ?? '{}') as { logs?: TimeLog[] }
    return v.logs ?? []
  } catch {
    return []
  }
}

/** Diverging colour: blue for negative, warm for positive, soft grey near zero. */
const cellColor = (r: number | null) => {
  if (r == null) return 'var(--lab-empty)'
  const a = Math.min(1, Math.abs(r))
  return r >= 0 ? `color-mix(in oklab, #e0703f ${Math.round(a * 90)}%, var(--bg-surface))` : `color-mix(in oklab, #3f7fd0 ${Math.round(a * 90)}%, var(--bg-surface))`
}

function Heatmap({ m, onPick, pick }: { m: ReturnType<typeof matrix>; onPick: (a: MetricId, b: MetricId) => void; pick: [MetricId, MetricId] }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const t = gsap.from(root.current.querySelectorAll('.lab-cell'), { scale: 0.3, opacity: 0, duration: 0.45, stagger: { grid: [metrics.length, metrics.length], from: 'start', amount: 0.8 }, ease: 'back.out(2)' })
    return () => void t.progress(1).kill()
  }, [])
  return (
    <div className="lab-heat" ref={root} role="grid" tabIndex={0} aria-label="Correlation matrix" style={{ gridTemplateColumns: `110px repeat(${metrics.length}, minmax(0, 1fr))` }}>
      <div role="row" style={{ display: 'contents' }}>
      <span role="columnheader" aria-label="Metric" />
      {metrics.map((c) => (
        <span key={c.id} className="lab-col" role="columnheader">
          {c.label}
        </span>
      ))}
      </div>
      {metrics.map((row, i) => (
        <div key={row.id} role="row" style={{ display: 'contents' }}>
          <span className="lab-row" role="rowheader">
            {row.label}
          </span>
          {metrics.map((col, j) => {
            const c = m[i][j]
            const self = i === j
            const on = (pick[0] === row.id && pick[1] === col.id) || (pick[0] === col.id && pick[1] === row.id)
            return (
              <button
                key={col.id}
                role="gridcell"
                type="button"
                className="lab-cell"
                data-on={on}
                disabled={self || !c}
                style={{ background: self ? 'var(--lab-self)' : cellColor(c?.r ?? null) }}
                title={c && !self ? `${row.label} × ${col.label}: r = ${c.r.toFixed(2)} (${c.n} days)` : self ? '' : 'Not enough overlapping days'}
                aria-label={c && !self ? `${row.label} and ${col.label}, r ${c.r.toFixed(2)}` : `${row.label} and ${col.label}, no data`}
                onClick={() => onPick(row.id, col.id)}
              >
                {!self && c ? c.r.toFixed(1).replace('0.', '.') : ''}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function Scatter({ rows, a, b }: { rows: ReturnType<typeof dailyRows>; a: MetricId; b: MetricId }) {
  const fit = regression(rows, a, b)
  const line = useRef<SVGLineElement>(null)
  useLayoutEffect(() => {
    if (line.current) gsap.fromTo(line.current, { strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.out' })
  }, [a, b])
  const la = metrics.find((m) => m.id === a)!
  const lb = metrics.find((m) => m.id === b)!
  if (!fit || fit.points.length < 2) return <p className="lab-empty">Pick a coloured cell to see its days plotted.</p>
  const xs = fit.points.map((p) => p[0])
  const ys = fit.points.map((p) => p[1])
  const [x0, x1] = [Math.min(...xs), Math.max(...xs) || 1]
  const [y0, y1] = [Math.min(...ys), Math.max(...ys) || 1]
  const W = 420
  const H = 240
  const px = (x: number) => 40 + ((x - x0) / (x1 - x0 || 1)) * (W - 60)
  const py = (y: number) => H - 30 - ((y - y0) / (y1 - y0 || 1)) * (H - 50)
  return (
    <svg className="lab-scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${la.label} against ${lb.label}`}>
      <line x1="40" x2={W - 20} y1={H - 30} y2={H - 30} className="lab-axis" />
      <line x1="40" x2="40" y1="20" y2={H - 30} className="lab-axis" />
      {fit.points.map((p, i) => (
        <circle key={i} cx={px(p[0])} cy={py(p[1])} r="6" className="lab-dot" style={{ animationDelay: `${i * 30}ms` }} />
      ))}
      {subOn('insightsLab', 'regression') && (
        <line ref={line} x1={px(x0)} y1={py(fit.line(x0))} x2={px(x1)} y2={py(fit.line(x1))} className="lab-fit" strokeDasharray="600" />
      )}
      <text x={W / 2} y={H - 6} textAnchor="middle">
        {la.label} {la.unit && `(${la.unit})`}
      </text>
      <text x="12" y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>
        {lb.label}
      </text>
    </svg>
  )
}

export function LabPage({ data, today }: FeaturePageProps) {
  const [days, setDaysState] = useState(() => {
    try { return [14, 30, 90].includes(Number(localStorage.getItem('bloom-lab-days'))) ? Number(localStorage.getItem('bloom-lab-days')) : 30 } catch { return 30 }
  })
  const setDays = (d: number) => {
    setDaysState(d)
    try { localStorage.setItem('bloom-lab-days', String(d)) } catch { /* optional */ }
  }
  const [pick, setPick] = useState<[MetricId, MetricId]>(['sleepHours', 'mood'])
  const [busy, setBusy] = useState<'' | 'pdf' | 'zip'>('')
  const rows = useMemo(
    () =>
      dailyRows({
        data,
        today,
        days,
        sleep: readArray<SleepEntry>(SLEEP_KEY),
        moods: readArray(MOOD_KEY),
        gratitude: readArray(GRATITUDE_KEY),
        diet: readDiet(),
        energy: readLogs(),
      }),
    [data, today, days],
  )
  const m = useMemo(() => matrix(rows), [rows])
  const top = useMemo(() => findings(rows), [rows])
  const pi = metrics.findIndex((x) => x.id === pick[0])
  const pj = metrics.findIndex((x) => x.id === pick[1])
  const sel = m[pi][pj]

  const exportPdf = async () => {
    setBusy('pdf')
    try {
      const { renderLabReport } = await import('./LabReport')
      download(await renderLabReport(rows, top.map((f) => f.text)), `bloom-insights-${today}.pdf`)
    } finally {
      setBusy('')
    }
  }
  const exportZip = async () => {
    setBusy('zip')
    try {
      download(await buildBackupZip(), `bloom-backup-${today}.zip`)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="lab-page">
      <EnergyCompass />
      <section className="lab-card">
        <div className="lab-head">
          <h3>
            <FlaskConical size={18} aria-hidden="true" /> What moves together
          </h3>
          <div className="lab-range" role="radiogroup" aria-label="Range">
            {[14, 30, 90].map((d) => (
              <button key={d} type="button" role="radio" aria-checked={days === d} onClick={() => setDays(d)}>
                {d} days
              </button>
            ))}
          </div>
        </div>
        {subOn('insightsLab', 'findings') && (
          <ul className="lab-findings">
            {top.length ? top.map((f) => (
              <li key={f.text}>
                <button type="button" onClick={() => setPick([f.a, f.b])} data-sign={f.r > 0 ? 'pos' : 'neg'}>
                  {f.text}
                </button>
              </li>
            )) : <li className="lab-empty">Keep logging sleep, mood, meals and habits. Patterns appear after about five overlapping days.</li>}
          </ul>
        )}
        <div className="lab-split">
          {subOn('insightsLab', 'heatmap') && <Heatmap m={m} pick={pick} onPick={(a, b) => setPick([a, b])} />}
          {subOn('insightsLab', 'scatter') && (
            <div className="lab-scatter-card">
              <p className="lab-pick">
                <select aria-label="First metric" value={pick[0]} onChange={(e) => setPick([e.target.value as MetricId, pick[1]])}>
                  {metrics.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                </select>
                {' × '}
                <select aria-label="Second metric" value={pick[1]} onChange={(e) => setPick([pick[0], e.target.value as MetricId])}>
                  {metrics.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                </select>
                {sel && pi !== pj && (
                  <strong>
                    {' '}
                    r = {sel.r.toFixed(2)} · {strength(sel.r)} · {sel.n} days
                  </strong>
                )}
              </p>
              <Scatter rows={rows} a={pick[0]} b={pick[1]} />
            </div>
          )}
        </div>
        <p className="lab-note">Pearson correlation across days with data for both. Correlation isn’t causation. Treat these as curiosities to test.</p>
      </section>
      {(subOn('insightsLab', 'pdfBook') || subOn('insightsLab', 'zipBackup')) && (
        <section className="lab-card lab-export">
          <div>
            <h3>Export suite</h3>
            <p>Print-ready report, or a complete zero lock-in backup: all data as JSON, Daybook pages as Markdown, voice memos with transcripts.</p>
          </div>
          <div className="lab-export-actions">
            {subOn('insightsLab', 'pdfBook') && (
              <button className="ov-primary" type="button" onClick={exportPdf} disabled={!!busy}>
                {busy === 'pdf' ? <Loader2 size={16} className="voice-spin" /> : <FileDown size={16} />} PDF report
              </button>
            )}
            {subOn('insightsLab', 'zipBackup') && (
              <button className="lab-secondary" type="button" onClick={exportZip} disabled={!!busy}>
                {busy === 'zip' ? <Loader2 size={16} className="voice-spin" /> : <Archive size={16} />} Backup .zip
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

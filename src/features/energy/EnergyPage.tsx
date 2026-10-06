import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSankey } from '@nivo/sankey'
import { Check, Pencil, Plus, Trash2, X, Zap } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { subOn } from '../subFeatures'
import { useStoredValue } from '../sleep/useStoredValue'
import { SLEEP_KEY, type SleepEntry } from '../sleep/sleepModel'
import { DAYBOOK_STORAGE_KEY } from '../../components/daybook/storage'
import { ENERGY_KEY, buildFlow, categories, flowInsights, type TimeLog } from './energyModel'
import './energy.css'

const readArray = <T,>(key: string): T[] => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(v) ? (v as T[]) : []
  } catch {
    return []
  }
}

export function EnergyPage({ data, today, onNavigate }: FeaturePageProps) {
  const [store, setStore] = useStoredValue<{ logs: TimeLog[] }>(ENERGY_KEY, { logs: [] })
  const [days, setDaysState] = useState(() => {
    try { return localStorage.getItem('bloom-energy-days') === '30' ? 30 : 7 } catch { return 7 }
  })
  const setDays = (d: number) => {
    setDaysState(d)
    try { localStorage.setItem('bloom-energy-days', String(d)) } catch { /* optional */ }
  }
  const [category, setCategory] = useState(categories[0].id)
  const [hours, setHours] = useState('1')
  const [logMessage, setLogMessage] = useState('')
  const [undoLog, setUndoLog] = useState<TimeLog | null>(null)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState(categories[0].id)
  const [editHours, setEditHours] = useState('1')
  const flow = useMemo(
    () =>
      buildFlow({
        data,
        today,
        days,
        sleep: readArray<SleepEntry>(SLEEP_KEY),
        logs: store.logs,
        daybook: readArray<{ updatedAt: string }>(DAYBOOK_STORAGE_KEY),
        includeBurnout: subOn('energySankey', 'burnout'),
      }),
    [data, today, days, store.logs],
  )
  const labels = useMemo(() => {
    const m: Record<string, string> = {}
    for (const n of flow.nodes)
      m[n.id] = flow.exp[n.id] != null ? `${n.id} (+${flow.exp[n.id]} EXP)` : n.id === 'Burnout' ? `Burnout (${flow.burnout})` : `${n.id} ${n.hours}h`
    return m
  }, [flow])
  const todayLogs = store.logs.filter((l) => l.date === today)
  useEffect(() => {
    if (!undoLog) return
    const timer = window.setTimeout(() => setUndoLog(null), 8000)
    return () => window.clearTimeout(timer)
  }, [undoLog])
  const removeLog = (log: TimeLog) => {
    setStore((current) => ({ logs: current.logs.filter((item) => item.id !== log.id) }))
    setUndoLog(log)
  }
  const restoreLog = () => {
    if (!undoLog) return
    setStore((current) => current.logs.some((item) => item.id === undoLog.id)
      ? current
      : { logs: [...current.logs, undoLog] })
    setUndoLog(null)
  }
  const beginEdit = (log: TimeLog) => {
    setEditingLogId(log.id)
    setEditCategory(log.category)
    setEditHours(String(log.hours))
  }
  const saveEdit = (log: TimeLog) => {
    const parsedHours = Number(editHours)
    if (!Number.isFinite(parsedHours) || parsedHours < 0.25 || parsedHours > 24) {
      setLogMessage('Enter a duration between 0.25 and 24 hours.')
      return
    }
    setStore((current) => ({
      logs: current.logs.map((item) => item.id === log.id
        ? { ...item, category: editCategory, hours: parsedHours }
        : item),
    }))
    setLogMessage(`Updated ${categories.find((item) => item.id === editCategory)?.label ?? 'activity'} to ${parsedHours} ${parsedHours === 1 ? 'hour' : 'hours'}.`)
    setEditingLogId(null)
  }

  return (
    <div className="energy-page">
      <section className="energy-card energy-chart-card">
        <div className="energy-head">
          <h3>
            <Zap size={18} aria-hidden="true" /> Where your energy flowed
          </h3>
          {subOn('energySankey', 'range') && (
            <div className="energy-range" role="radiogroup" aria-label="Range">
              {[7, 30].map((d) => (
                <button key={d} type="button" role="radio" aria-checked={days === d} onClick={() => setDays(d)}>
                  {d === 7 ? 'This week' : '30 days'}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="energy-range-caption" aria-live="polite">
          Showing the last {days} days through {new Date(`${today}T12:00:00`).toLocaleDateString()}.
        </p>
        {flow.links.length < 2 ? (
          <div className="energy-empty">
            <p>Not enough to draw yet. Log sleep, finish a focus session, or add a few hours below and your week will start to flow.</p>
            <div className="energy-empty-actions" aria-label="Add energy data">
              <button type="button" onClick={() => onNavigate('sleep')}>Log sleep</button>
              <button type="button" onClick={() => onNavigate('focus')}>Start a focus session</button>
              <button type="button" onClick={() => onNavigate('daybook')}>Write a reflection</button>
            </div>
          </div>
        ) : (
          <>
          <div className="energy-sankey" role="img" aria-label={`Sankey diagram: ${flow.links.map((l) => `${l.source} to ${l.target} ${l.value} hours`).join(', ')}`}>
            <ResponsiveSankey
              data={flow}
              margin={{ top: 16, right: 170, bottom: 16, left: 130 }}
              align="justify"
              colors={(n) => (n as unknown as { color: string }).color}
              nodeOpacity={1}
              nodeThickness={16}
              nodeInnerPadding={2}
              nodeSpacing={18}
              nodeBorderRadius={4}
              linkOpacity={0.45}
              linkHoverOpacity={0.8}
              linkBlendMode="normal"
              enableLinkGradient={subOn('energySankey', 'gradient')}
              label={(n) => labels[n.id] ?? n.id}
              labelPadding={10}
              labelTextColor="var(--text-primary)"
              valueFormat={(v) => `${v} h`}
              animate
              motionConfig="gentle"
              theme={{
                text: { fontSize: 13, fill: 'var(--text-primary)' },
                tooltip: { container: { background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: 12 } },
              }}
            />
          </div>
          <details className="energy-data">
            <summary>View this flow as a table</summary>
            <div className="energy-data-scroll">
              <table>
                <thead>
                  <tr><th scope="col">From</th><th scope="col">To</th><th scope="col">Hours</th></tr>
                </thead>
                <tbody>
                  {flow.links.map((link, index) => (
                    <tr key={`${link.source}-${link.target}-${index}`}>
                      <th scope="row">{labels[link.source] ?? link.source}</th>
                      <td>{labels[link.target] ?? link.target}</td>
                      <td>{link.value} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          </>
        )}
        {subOn('energySankey', 'burnout') && (
          <p className="energy-burnout" data-level={flow.burnout}>
            Burnout risk: <strong>{flow.burnout}</strong>
          </p>
        )}
      </section>

      {undoLog && (
        <p className="energy-undo" role="status">
          Removed {categories.find((c) => c.id === undoLog.category)?.label ?? 'activity'} log.
          <button type="button" onClick={restoreLog}>Undo</button>
        </p>
      )}
      <div className="energy-grid">
        {subOn('energySankey', 'manualLog') && (
          <section className="energy-card">
            <h3>
              Log today’s hours
              {todayLogs.length > 0 && <small className="energy-note"> · {todayLogs.reduce((a, l) => a + l.hours, 0)} h logged</small>}
            </h3>
            <form
              className="energy-form"
              onSubmit={(e) => {
                e.preventDefault()
                const h = Math.min(24, Math.max(0.25, Number(hours) || 0))
                setStore((s) => ({ logs: [...s.logs, { id: crypto.randomUUID(), date: today, category, hours: h }] }))
                setLogMessage(`Added ${h} ${h === 1 ? 'hour' : 'hours'} for ${categories.find((item) => item.id === category)?.label ?? 'activity'}.`)
              }}
            >
              <select aria-label="Activity" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input aria-label="Hours" type="number" min="0.25" max="24" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} />
              <button className="ov-primary" type="submit">
                <Plus size={16} aria-hidden="true" /> Add
              </button>
            </form>
            <p className="sr-only" role="status" aria-live="polite">{logMessage}</p>
            <p className="energy-note">Sleep, focus sessions, habits and journaling are counted automatically.</p>
            <ul className="energy-logs bloom-list">
              {todayLogs.map((l) => {
                const c = categories.find((x) => x.id === l.category)
                return (
                  <li key={l.id}>
                    {editingLogId === l.id ? (
                      <div className="energy-log-edit">
                        <select aria-label="Edit activity" value={editCategory} onChange={(event) => setEditCategory(event.target.value)}>
                          {categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                        </select>
                        <input
                          aria-label="Edit hours"
                          type="number"
                          min="0.25"
                          max="24"
                          step="0.25"
                          value={editHours}
                          onChange={(event) => setEditHours(event.target.value)}
                        />
                        <button className="icon-button" type="button" aria-label="Save activity changes" onClick={() => saveEdit(l)}>
                          <Check size={14} />
                        </button>
                        <button className="icon-button" type="button" aria-label="Cancel editing activity" onClick={() => setEditingLogId(null)}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="energy-dot" style={{ background: c?.color }} />
                        {c?.label} <strong>{l.hours} h</strong>
                        <button className="icon-button" type="button" aria-label={`Edit ${c?.label ?? 'activity'}`} onClick={() => beginEdit(l)}>
                          <Pencil size={14} />
                        </button>
                        <button className="icon-button" type="button" aria-label={`Remove ${c?.label ?? 'activity'}`} onClick={() => removeLog(l)}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {subOn('energySankey', 'insights') && (
          <section className="energy-card">
            <h3>Debug your week</h3>
            <ul className="energy-insights bloom-list">
              {flowInsights(flow).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

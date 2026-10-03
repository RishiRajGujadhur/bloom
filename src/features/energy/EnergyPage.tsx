import { useMemo, useState } from 'react'
import { ResponsiveSankey } from '@nivo/sankey'
import { Plus, Trash2, Zap } from 'lucide-react'
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

export function EnergyPage({ data, today }: FeaturePageProps) {
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
        {flow.links.length < 2 ? (
          <p className="energy-empty">
            Not enough to draw yet. Log sleep, finish a focus session, or add a few hours below and your week will start to flow.
          </p>
        ) : (
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
        )}
        {subOn('energySankey', 'burnout') && (
          <p className="energy-burnout" data-level={flow.burnout}>
            Burnout risk: <strong>{flow.burnout}</strong>
          </p>
        )}
      </section>

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
            <p className="energy-note">Sleep, focus sessions, habits and journaling are counted automatically.</p>
            <ul className="energy-logs">
              {todayLogs.map((l) => {
                const c = categories.find((x) => x.id === l.category)
                return (
                  <li key={l.id}>
                    <span className="energy-dot" style={{ background: c?.color }} />
                    {c?.label} <strong>{l.hours} h</strong>
                    <button className="icon-button" aria-label={`Remove ${c?.label}`} onClick={() => setStore((s) => ({ logs: s.logs.filter((x) => x.id !== l.id) }))}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {subOn('energySankey', 'insights') && (
          <section className="energy-card">
            <h3>Debug your week</h3>
            <ul className="energy-insights">
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

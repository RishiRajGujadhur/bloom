import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'
import { BellRing, CalendarDays, Droplets, Hourglass, Play, Square } from 'lucide-react'
import { Segmented, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { setNudge } from '../../components/studio/Nudges'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { FAST_KEY, endMessage, fmtH, hours, perDay, protocols, stageAt, stages, stats, type Fast, type FastStore } from './fastingModel'
import './fasting.css'

const on = (id: string) => subOn('fasting', id)
const R = 120
const C = 2 * Math.PI * R

function FastRing({ h, goal }: { h: number; goal: number }) {
  const arc = useRef<SVGCircleElement>(null)
  const frac = Math.min(1, h / goal)
  useLayoutEffect(() => {
    if (arc.current) gsap.to(arc.current, { strokeDashoffset: C * (1 - frac), duration: 1, ease: 'power2.out' })
  }, [frac])
  const stage = stageAt(h)
  return (
    <svg className="fs-ring" viewBox="0 0 300 300" aria-label={`${fmtH(h)} of ${goal} hours`}>
      <defs>
        <linearGradient id="fs-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f2c14e" />
          <stop offset="0.5" stopColor="#e2703f" />
          <stop offset="1" stopColor="#8f7ae5" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="150" r={R} className="fs-track" />
      <circle ref={arc} cx="150" cy="150" r={R} className="fs-arc" strokeDasharray={C} strokeDashoffset={C} transform="rotate(-90 150 150)" />
      {on('stages') &&
        stages
          .filter((s) => s.from > 0 && s.from < goal)
          .map((s) => {
            const a = (s.from / goal) * Math.PI * 2 - Math.PI / 2
            return (
              <g key={s.name} transform={`translate(${150 + Math.cos(a) * R} ${150 + Math.sin(a) * R})`}>
                <circle r="13" className="fs-mark" data-past={h >= s.from} />
                <text textAnchor="middle" y="5" fontSize="13">
                  {s.emoji}
                </text>
              </g>
            )
          })}
      <text x="150" y="140" textAnchor="middle" className="fs-time">
        {fmtH(h)}
      </text>
      <text x="150" y="168" textAnchor="middle" className="fs-stage">
        {on('stages') ? `${stage.emoji} ${stage.name}` : `goal ${goal} h`}
      </text>
    </svg>
  )
}

export function FastingPage() {
  const [store, setStoreState] = useState<FastStore>(() => readStore(FAST_KEY, { protocol: '16:8', current: null, history: [], hydration: true, windowReminder: false }))
  const setStore = (fn: (s: FastStore) => FastStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(FAST_KEY, n)
      return n
    })
  const [tab, setTab] = useState('fast')
  const [now, setNow] = useState(Date.now())
  const [ended, setEnded] = useState<Fast | null>(null)
  const [backdate, setBackdate] = useState(0)
  const btn = useRef<HTMLButtonElement>(null)
  const protocol = protocols.find((p) => p.id === store.protocol) ?? protocols[1]
  const cur = store.current
  const h = cur ? hours(now - cur.start) : 0

  useEffect(() => {
    if (!cur) return
    const t = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [cur])

  const start = () => {
    const startAt = Date.now() - (on('adjustStart') ? backdate * 60_000 : 0)
    setStore((s) => ({ ...s, current: { start: startAt, goal: protocol.fast } }))
    setNow(Date.now())
    setEnded(null)
    if (on('hydration') && store.hydration) setNudge({ id: 'fast-water', title: 'Sip some water', body: 'Hydration makes fasting kinder.', page: 'fasting', every: 90, enabled: true, quietStart: 22, quietEnd: 7 })
  }
  const end = () => {
    if (!cur) return
    const f: Fast = { start: cur.start, end: Date.now(), goal: cur.goal }
    setStore((s) => ({ ...s, current: null, history: [...s.history, f].slice(-500) }))
    setEnded(f)
    setNudge({ id: 'fast-water', title: '', body: '', page: 'fasting', every: 90, enabled: false })
    if (store.windowReminder && on('windowReminder')) setNudge({ id: 'fast-window', title: 'Eating window closing', body: `Time to start your next ${protocol.label} fast.`, page: 'fasting', every: (24 - protocol.fast) * 60, enabled: true, lastAt: Date.now() })
    logActivity('fast', { hours: hours(f.end - f.start) })
    if (hours(f.end - f.start) >= f.goal) burst(btn.current, 'stars')
  }
  const saveFeeling = (feeling: Fast['feeling'], note: string) => {
    if (!ended) return
    setStore((s) => ({ ...s, history: s.history.map((f) => (f.start === ended.start ? { ...f, feeling, note } : f)) }))
    setEnded({ ...ended, feeling, note })
  }
  const st = stats(store.history)

  const fast = () => (
    <div className="studio-split">
      <div className="studio-card studio-center fs-stage-card">
        {on('ring') ? <FastRing h={h} goal={cur?.goal ?? protocol.fast} /> : <strong className="fs-time-big">{fmtH(h)}</strong>}
      </div>
      <div className="studio-card fs-side">
        {!cur ? (
          <>
            {on('protocols') && <Segmented label="Protocol" value={store.protocol} onChange={(p) => setStore((s) => ({ ...s, protocol: p }))} options={protocols.map((p) => ({ id: p.id, label: p.label }))} />}
            <p className="studio-empty">
              {protocol.note} · fast {protocol.fast} h{protocol.fast < 24 ? `, eat within ${24 - protocol.fast} h` : ''}
            </p>
            {on('adjustStart') && <Slider label="Started" value={backdate} min={0} max={720} step={15} format={(v) => (v ? `${Math.floor(v / 60)}h ${v % 60}m ago` : 'now')} onChange={setBackdate} />}
            <button ref={btn} type="button" className="studio-go" onClick={start}>
              <Play size={18} /> Start fasting
            </button>
            {ended && (
              <div className="fs-ended">
                <p>{on('endEarly') ? endMessage(hours(ended.end - ended.start), ended.goal) : `Fasted ${fmtH(hours(ended.end - ended.start))}.`}</p>
                {on('notes') && ended.feeling && (
                  <input className="studio-input" aria-label="Note about this fast" placeholder="A note for future you (optional)" defaultValue={ended.note ?? ''} onBlur={(e) => saveFeeling(ended.feeling, e.target.value)} />
                )}
                {on('notes') && !ended.feeling && (
                  <div className="studio-seg">
                    {(['great', 'ok', 'hard'] as const).map((f) => (
                      <button key={f} type="button" className="studio-chip" onClick={() => saveFeeling(f, '')}>
                        {{ great: '😊 Felt great', ok: '🙂 Okay', hard: '😮‍💨 Tough' }[f]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <span className="now-kicker">{protocol.label} fast</span>
            <h3 className="fs-stage-name">
              {stageAt(h).emoji} {stageAt(h).name}
            </h3>
            {on('stages') && <p className="yg-cue">{stageAt(h).text}</p>}
            <div className="studio-stats">
              <Stat value={new Date(cur.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} label="started" />
              <Stat value={new Date(cur.start + cur.goal * 3_600_000).toLocaleTimeString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })} label="goal at" />
              <Stat value={h >= cur.goal ? 'Reached' : fmtH(cur.goal - h)} label="to go" />
            </div>
            <button ref={btn} type="button" className="studio-go" onClick={end}>
              <Square size={16} /> {h >= cur.goal ? 'End fast' : 'End now'}
            </button>
            {on('endEarly') && h < cur.goal && <p className="studio-empty">Ending early is fine. Every hour counts.</p>}
          </>
        )}
      </div>
    </div>
  )

  const today = new Date()
  const heatStart = new Date(today)
  heatStart.setMonth(heatStart.getMonth() - 11)
  const history = () => (
    <div className="studio-card fs-history">
      {on('heatmap') && (
        <div className="fs-heat">
          <CalendarHeatmap
            startDate={heatStart}
            endDate={today}
            values={perDay(store.history)}
            classForValue={(v) => (!v ? 'color-empty' : `fs-scale-${Math.min(4, Math.floor(Number((v as unknown as { count: number }).count ?? 0) / 6))}`)}
            titleForValue={(v) => (v ? `${String(v.date)}: ${(v as unknown as { count: number }).count} h` : 'No fast')}
            showWeekdayLabels
          />
        </div>
      )}
      {on('weeklyAvg') && (
        <div className="studio-stats">
          <Stat value={st.weekCount} label="fasts this week" />
          <Stat value={st.avg ? fmtH(st.avg) : '—'} label="average this week" />
          <Stat value={st.longest ? fmtH(st.longest) : '—'} label="longest" />
          <Stat value={`${Math.round(st.rate * 100)}%`} label="reached goal" />
        </div>
      )}
    </div>
  )

  const settings = () => (
    <div className="studio-center fs-settings">
      <Hourglass size={40} aria-hidden="true" />
      {on('hydration') && (
        <button type="button" className="studio-chip" aria-pressed={store.hydration} onClick={() => setStore((s) => ({ ...s, hydration: !s.hydration }))}>
          <Droplets size={13} /> Water reminders while fasting
        </button>
      )}
      {on('windowReminder') && (
        <button type="button" className="studio-chip" aria-pressed={store.windowReminder} onClick={() => setStore((s) => ({ ...s, windowReminder: !s.windowReminder }))}>
          <BellRing size={13} /> Remind me when my eating window closes
        </button>
      )}
      <p className="studio-empty">Fasting isn’t right for everyone. If you’re pregnant, diabetic or have a history of disordered eating, talk to a doctor first.</p>
    </div>
  )

  return (
    <Studio
      name="fasting"
      accent="#d9653b"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#ffd89b', '#f4a7b9', '#c9b8ff']} line="wave" />}
      aside={
        cur ? (
          <span className="ex-aside">
            <Hourglass size={15} /> {fmtH(h)}
          </span>
        ) : undefined
      }
      tabs={[
        { id: 'fast', label: 'Fast', icon: <Hourglass size={15} />, render: fast },
        ...(on('heatmap') || on('weeklyAvg') ? [{ id: 'history', label: 'History', icon: <CalendarDays size={15} />, render: history }] : []),
        ...(on('hydration') || on('windowReminder') ? [{ id: 'settings', label: 'Reminders', icon: <BellRing size={15} />, render: settings }] : []),
      ]}
    />
  )
}

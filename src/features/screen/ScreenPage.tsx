import { useEffect, useState } from 'react'
import { BarChart3, Leaf, MonitorSmartphone, Moon, Play, Smartphone, Square, Target } from 'lucide-react'
import { Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { SCREEN_EVENT, SCREEN_KEY, challengeMinutes, dayOf, defaultScreen, minutesOn, week, type ScreenSettings, type ScreenStore } from './screenModel'

const on = (id: string) => subOn('digitalWellbeing', id)
const fmt = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`)

export function ScreenPage() {
  const [store, setStoreState] = useState<ScreenStore>(() => readStore(SCREEN_KEY, defaultScreen))
  const [now, setNow] = useState(Date.now())
  const [goal, setGoal] = useState(60)
  useEffect(() => {
    const t = setInterval(() => {
      setStoreState(readStore(SCREEN_KEY, defaultScreen))
      setNow(Date.now())
    }, 15_000)
    return () => clearInterval(t)
  }, [])
  const setSettings = (p: Partial<ScreenSettings>) => {
    const next = { ...readStore<ScreenStore>(SCREEN_KEY, defaultScreen), settings: { ...store.settings, ...p } }
    writeStore(SCREEN_KEY, next)
    setStoreState(next)
    window.dispatchEvent(new Event(SCREEN_EVENT))
  }
  const today = dayOf(now)
  const used = minutesOn(store.usage, today)
  const hours = store.usage[today] ?? Array(24).fill(0)
  const s = store.settings
  const active = store.challenges.find((c) => !c.end)
  const frac = Math.min(1, used / Math.max(1, s.dailyLimit))

  const todayTab = () => (
    <div className="studio-split">
      <div className="studio-card studio-center">
        {on('limit') && (
          <svg className="run-goal sw-ring" viewBox="0 0 160 160" aria-label={`${used} of ${s.dailyLimit} minutes`}>
            <circle cx="80" cy="80" r="66" className="run-goal-track" />
            <circle cx="80" cy="80" r="66" className="run-goal-arc" style={{ stroke: frac >= 1 ? '#e2553f' : undefined }} strokeDasharray={2 * Math.PI * 66} strokeDashoffset={2 * Math.PI * 66 * (1 - frac)} transform="rotate(-90 80 80)" />
            <text x="80" y="80" textAnchor="middle">
              {fmt(used)}
            </text>
            <text x="80" y="100" textAnchor="middle" className="run-goal-sub">
              of {fmt(s.dailyLimit)} in Bloom
            </text>
          </svg>
        )}
        {on('hourly') && (
          <div className="sw-hours" aria-label="Active minutes by hour">
            {hours.map((sec, h) => (
              <span key={h} style={{ height: `${Math.max(3, Math.min(100, (sec / 3600) * 100))}%` }} data-now={h === new Date(now).getHours()} title={`${h}:00 · ${Math.round(sec / 60)} min`} />
            ))}
          </div>
        )}
      </div>
      <div className="studio-card rm-side">
        {on('limit') && <Slider label="Daily limit" value={s.dailyLimit} min={15} max={480} step={15} format={fmt} onChange={(v) => setSettings({ dailyLimit: v })} />}
        {on('breaks') && <Slider label="Break reminder after" value={s.breakEvery} min={10} max={120} step={5} unit="min" onChange={(v) => setSettings({ breakEvery: v })} />}
        {on('detox') && (
          <button type="button" className="studio-chip" aria-pressed={s.detox} onClick={() => setSettings({ detox: !s.detox })}>
            <Leaf size={13} /> Detox mode (greyscale, calmer)
          </button>
        )}
        {on('windDown') && (
          <>
            <button type="button" className="studio-chip" aria-pressed={s.windDown} onClick={() => setSettings({ windDown: !s.windDown })}>
              <Moon size={13} /> Wind-down dimming
            </button>
            <Slider label="Wind-down from" value={s.windDownFrom} min={18} max={24} format={(v) => `${v % 24}:00`} compact onChange={(v) => setSettings({ windDownFrom: v })} />
          </>
        )}
        {on('pauseGate') && (
          <button type="button" className="studio-chip" aria-pressed={s.pauseGate} onClick={() => setSettings({ pauseGate: !s.pauseGate })}>
            Pause before opening Bloom
          </button>
        )}
        {on('focusOnly') && (
          <button type="button" className="studio-chip" aria-pressed={s.focusOnly} onClick={() => setSettings({ focusOnly: !s.focusOnly })}>
            <Target size={13} /> Focus-only mode (hide the rest)
          </button>
        )}
        <p className="studio-empty">Counts time you’re actively using Bloom. A minute without input counts as idle.</p>
      </div>
    </div>
  )

  const challenge = () => (
    <div className="studio-center">
      <Smartphone size={44} />
      <h3>Phone-free challenge</h3>
      {active ? (
        <>
          <strong className="sw-big">{fmt(challengeMinutes(active, now))}</strong>
          <p className="studio-empty">Goal {fmt(active.goal)} · put the phone in another room</p>
          <button
            type="button"
            className="studio-go"
            onClick={(e) => {
              const done = challengeMinutes(active, Date.now()) >= active.goal
              const next = { ...store, challenges: store.challenges.map((c) => (c === active ? { ...c, end: Date.now() } : c)) }
              writeStore(SCREEN_KEY, next)
              setStoreState(next)
              if (done) {
                burst(e.currentTarget, 'stars')
                logActivity('phoneFree')
              }
            }}
          >
            <Square size={16} /> I’m back
          </button>
        </>
      ) : (
        <>
          <div className="st-scale">
<Slider label="Goal" value={goal} min={15} max={240} step={15} format={fmt} onChange={setGoal} />
          </div>
          <button
            type="button"
            className="studio-go"
            onClick={() => {
              const next = { ...store, challenges: [...store.challenges, { start: Date.now(), goal }].slice(-100) }
              writeStore(SCREEN_KEY, next)
              setStoreState(next)
            }}
          >
            <Play size={16} /> Start
          </button>
          <p className="studio-empty">{store.challenges.filter((c) => c.end && challengeMinutes(c) >= c.goal).length} challenges completed</p>
        </>
      )}
    </div>
  )

  const w = week(store.usage, today)
  const max = Math.max(s.dailyLimit, ...w.map((x) => x.minutes))
  const trend = () => (
    <div className="studio-card">
      <h3>
        <BarChart3 size={16} /> Last 7 days
      </h3>
      <div className="sw-week">
        {w.map((d) => (
          <div key={d.day} className="mr-day">
            <span className="mr-bar" style={{ height: `${Math.max(4, (d.minutes / max) * 100)}%`, background: d.minutes > s.dailyLimit ? '#e2553f' : '#6bbf7a' }} title={fmt(d.minutes)} />
            <small>{d.label}</small>
          </div>
        ))}
      </div>
      <div className="studio-stats">
        <Stat value={fmt(Math.round(w.reduce((a, d) => a + d.minutes, 0) / 7))} label="daily average" />
        <Stat value={w.filter((d) => d.minutes <= s.dailyLimit).length} label="days within limit" />
      </div>
    </div>
  )

  return (
    <Studio
      name="screen"
      accent="#3f8a76"
      scene={<StudioScene colors={['#9fdcc8', '#c8e6a0', '#c9b8ff']} line="wave" />}
      tabs={[
        { id: 'today', label: 'Today', icon: <MonitorSmartphone size={15} />, render: todayTab },
        ...(on('challenge') ? [{ id: 'challenge', label: 'Phone-free', icon: <Smartphone size={15} />, render: challenge }] : []),
        ...(on('trend') ? [{ id: 'trend', label: 'Trend', icon: <BarChart3 size={15} />, render: trend }] : []),
      ]}
    />
  )
}

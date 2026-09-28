import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { CalendarDays, Check, ListPlus, PauseCircle, Play, Plus, Repeat, SkipForward, Trash2 } from 'lucide-react'
import { Rail, Segmented, Slider, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { dayKey } from '../../dates'
import { ROUTINES_KEY, dayNames, describe, occursOn, streak, templates, totalMinutes, upcoming, type Routine, type RoutineStore } from './routineModel'
import { DayDial } from '../showcase/DayDial'
import { usePageActions } from '../../components/ui/PageMenu'
import './routines.css'

const on = (id: string) => subOn('routineScheduler', id)
const fromTemplate = (t: (typeof templates)[number]): Routine => ({ ...t, id: crypto.randomUUID(), steps: t.steps.map((s) => ({ ...s, id: crypto.randomUUID() })), log: [] })

/** Step-by-step player with a draining bar per step. */
function Player({ routine, onDone, onClose }: { routine: Routine; onDone: (n: number) => void; onClose: () => void }) {
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(routine.steps[0].minutes * 60)
  const [run, setRun] = useState(true)
  const card = useRef<HTMLDivElement>(null)
  const step = routine.steps[i]
  useEffect(() => {
    if (!run) return
    if (left <= 0) {
      next()
      return
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  })  
  useLayoutEffect(() => {
    if (card.current && !prefersReducedMotion()) gsap.fromTo(card.current, { y: 30, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)' })
  }, [i])
  const next = () => {
    if (i + 1 >= routine.steps.length) {
      onDone(routine.steps.length)
      return
    }
    setI(i + 1)
    setLeft(routine.steps[i + 1].minutes * 60)
  }
  return (
    <div className="rt-player" style={{ ['--rt' as string]: routine.color }}>
      <div className="rt-steps">
        {routine.steps.map((s, k) => (
          <span key={s.id} data-state={k < i ? 'done' : k === i ? 'now' : 'next'}>
            {s.emoji}
          </span>
        ))}
      </div>
      <div ref={card} className="rt-now">
        <span className="rt-emoji">{step.emoji}</span>
        <h3>{step.title}</h3>
        <strong>{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</strong>
        <div className="rt-drain">
          <span style={{ width: `${(left / (step.minutes * 60)) * 100}%` }} />
        </div>
      </div>
      <div className="iv-buttons">
        <button type="button" className="studio-go" onClick={next}>
          <Check size={18} /> Done
        </button>
        <button type="button" className="studio-go" data-variant="quiet" aria-label={run ? 'Pause' : 'Resume'} onClick={() => setRun(!run)}>
          {run ? <PauseCircle size={18} /> : <Play size={18} />}
        </button>
        <button type="button" className="studio-go" data-variant="quiet" aria-label="Skip" onClick={next}>
          <SkipForward size={18} />
        </button>
        <button type="button" className="studio-chip" onClick={() => (onDone(i), onClose())}>
          Stop
        </button>
      </div>
    </div>
  )
}

export function RoutinesPage() {
  const today = dayKey()
  const [store, setStoreState] = useState<RoutineStore>(() => {
    const s = readStore<RoutineStore>(ROUTINES_KEY, { routines: [] })
    return s.routines.length ? s : { routines: [fromTemplate(templates[0]), fromTemplate(templates[1])] }
  })
  const setStore = (fn: (s: RoutineStore) => RoutineStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(ROUTINES_KEY, n)
      return n
    })
  const [tab, setTab] = useState('today')
  const [sel, setSel] = useState(store.routines[0]?.id ?? '')
  const [playing, setPlaying] = useState<Routine | null>(null)
  const [stepTitle, setStepTitle] = useState('')
  const [stepMin, setStepMin] = useState(5)
  const routine = store.routines.find((r) => r.id === sel) ?? store.routines[0]
  const upd = (id: string, fn: (r: Routine) => Routine) => setStore((s) => ({ ...s, routines: s.routines.map((r) => (r.id === id ? fn(r) : r)) }))
  const todays = store.routines.filter((r) => occursOn(r, today))

  const finish = (r: Routine) => (n: number) => {
    upd(r.id, (x) => ({ ...x, log: [...x.log.filter((l) => l.date !== today), { date: today, done: Math.max(n, x.log.find((l) => l.date === today)?.done ?? 0) }].slice(-400) }))
    if (n >= r.steps.length) {
      burst(null, 'stars')
      logActivity('routine', { name: r.name })
    }
    setPlaying(null)
  }

  const nextUp = [...todays].filter((r) => (r.log.find((l) => l.date === today)?.done ?? 0) < r.steps.length).sort((a, b) => a.repeat.time.localeCompare(b.repeat.time))[0]
  usePageActions([
    ...(nextUp ? [{ id: 'rt-next', label: `Start ${nextUp.name}`, icon: nextUp.emoji, run: () => { setTab('today'); setPlaying(nextUp) } }] : []),
    { id: 'rt-edit', label: 'Edit my routines', icon: '✏️', run: () => setTab('edit') },
  ])
  const todayTab = () =>
    playing && on('player') ? (
      <Player routine={playing} onDone={finish(playing)} onClose={() => setPlaying(null)} />
    ) : (
      <div className="iv-programs">
        {on('dial') && todays.length > 0 && (
          <div className="rt-dial-row">
            <DayDial
              items={todays.map((r) => ({ id: r.id, time: r.repeat.time, emoji: r.emoji, color: r.color, label: r.name, done: (r.log.find((l) => l.date === today)?.done ?? 0) >= r.steps.length }))}
              onPick={(id) => setPlaying(store.routines.find((r) => r.id === id) ?? null)}
            />
          </div>
        )}
        <h3>Today</h3>
        {todays.length ? (
          <Rail label="Today’s routines">
            {todays.map((r) => {
              const done = r.log.find((l) => l.date === today)?.done ?? 0
              return (
                <div key={r.id} role="listitem">
                  <button type="button" className="iv-card rt-card" style={{ ['--rt' as string]: r.color }} onClick={() => setPlaying(r)} data-done={done >= r.steps.length}>
                    <span aria-hidden="true">{r.emoji}</span>
                    <strong>{r.name}</strong>
                    <small>
                      {r.repeat.time} · {totalMinutes(r)} min · {done}/{r.steps.length}
                    </small>
                    {on('anchors') && r.anchor && <small>⚓ {r.anchor}</small>}
                    {on('log') && <small>🔥 {streak(r, today)} in a row</small>}
                  </button>
                </div>
              )
            })}
          </Rail>
        ) : (
          <p className="studio-empty">Nothing scheduled today. Enjoy the space.</p>
        )}
        {on('week') && (
          <div className="rt-week">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(`${today}T12:00:00`)
              d.setDate(d.getDate() + i)
              const key = dayKey(d)
              return (
                <div key={key} className="rt-day" data-today={i === 0}>
                  <small>{d.toLocaleDateString([], { weekday: 'short' })}</small>
                  {store.routines.filter((r) => occursOn(r, key)).map((r) => (
                    <span key={r.id} style={{ background: r.color }} data-hint={`${r.name} · ${r.repeat.time} · ${totalMinutes(r)} min`}>
                      {r.emoji}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )

  const edit = () =>
    !routine ? null : (
      <div className="studio-split">
        <div className="studio-card rt-side">
          <div className="studio-chip-row">
            {store.routines.map((r) => (
              <button key={r.id} type="button" className="studio-chip" aria-pressed={r.id === routine.id} onClick={() => setSel(r.id)}>
                {r.emoji} {r.name}
              </button>
            ))}
          </div>
          <input className="studio-input rm-title" aria-label="Routine name" value={routine.name} onChange={(e) => upd(routine.id, (r) => ({ ...r, name: e.target.value }))} />
          <ul className="rm-ms">
            {routine.steps.map((s, k) => (
              <li key={s.id}>
                <span>
                  <strong>
                    {s.emoji} {s.title}
                  </strong>
                  <small>{s.minutes} min</small>
                </span>
                <button type="button" className="icon-button" aria-label="Move up" disabled={k === 0} onClick={() => upd(routine.id, (r) => { const st = [...r.steps]; [st[k - 1], st[k]] = [st[k], st[k - 1]]; return { ...r, steps: st } })}>
                  ↑
                </button>
                <button type="button" className="icon-button" aria-label={`Remove ${s.title}`} onClick={() => upd(routine.id, (r) => ({ ...r, steps: r.steps.filter((x) => x.id !== s.id) }))}>
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="sc-manual">
            <input className="studio-input" aria-label="New step" placeholder="Add a step" value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} />
            <button type="button" className="studio-go" data-variant="quiet" aria-label="Add step" disabled={!stepTitle.trim()} onClick={() => (upd(routine.id, (r) => ({ ...r, steps: [...r.steps, { id: crypto.randomUUID(), title: stepTitle.trim(), minutes: stepMin, emoji: '✨' }] })), setStepTitle(''))}>
              <Plus size={16} />
            </button>
          </div>
          <Slider label="Step length" value={stepMin} min={1} max={60} unit="min" compact onChange={setStepMin} />
        </div>
        <div className="studio-card rt-side">
          <h3>
            <Repeat size={16} /> Repeats
          </h3>
          <Segmented label="Frequency" value={routine.repeat.freq} onChange={(f) => upd(routine.id, (r) => ({ ...r, repeat: { ...r.repeat, freq: f } }))} options={[{ id: 'daily', label: 'Daily' }, { id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }]} />
          {routine.repeat.freq === 'weekly' && (
            <div className="rt-days" role="group" aria-label="Days">
              {dayNames.map((d, i) => (
                <button key={d} type="button" className="studio-chip" aria-pressed={routine.repeat.days.includes(i)} onClick={() => upd(routine.id, (r) => ({ ...r, repeat: { ...r.repeat, days: r.repeat.days.includes(i) ? r.repeat.days.filter((x) => x !== i) : [...r.repeat.days, i].sort() } }))}>
                  {d}
                </button>
              ))}
            </div>
          )}
          <Slider label="Every" value={routine.repeat.interval} min={1} max={4} format={(v) => `${v} ${routine.repeat.freq === 'daily' ? 'day' : routine.repeat.freq === 'weekly' ? 'week' : 'month'}${v > 1 ? 's' : ''}`} onChange={(v) => upd(routine.id, (r) => ({ ...r, repeat: { ...r.repeat, interval: v } }))} />
          <Slider label="Time" value={Number(routine.repeat.time.slice(0, 2)) * 60 + Number(routine.repeat.time.slice(3))} min={300} max={1410} step={15} format={(v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`} onChange={(v) => upd(routine.id, (r) => ({ ...r, repeat: { ...r.repeat, time: `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}` } }))} />
          {on('preview') && <p className="rt-rule">{describe(routine.repeat)}</p>}
          {on('upcoming') && (
            <div className="yg-pose-chips">
              {upcoming(routine, new Date()).map((d) => (
                <span key={d.toISOString()} className="studio-chip">
                  {d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              ))}
            </div>
          )}
          {on('anchors') && <input className="studio-input" aria-label="Habit-stack anchor" placeholder="After I… (habit stack)" value={routine.anchor ?? ''} onChange={(e) => upd(routine.id, (r) => ({ ...r, anchor: e.target.value }))} />}
          {on('skip') && (
            <button type="button" className="studio-chip" aria-pressed={routine.paused?.includes(today)} onClick={() => upd(routine.id, (r) => ({ ...r, paused: r.paused?.includes(today) ? r.paused.filter((x) => x !== today) : [...(r.paused ?? []), today] }))}>
              <PauseCircle size={13} /> Skip today, guilt-free
            </button>
          )}
        </div>
      </div>
    )

  const library = () => (
    <div className="iv-programs">
      <h3>Templates</h3>
      <Rail label="Routine templates">
        {templates.map((t) => (
          <div key={t.name} role="listitem">
            <button
              type="button"
              className="iv-card rt-card"
              style={{ ['--rt' as string]: t.color }}
              onClick={() => {
                const r = fromTemplate(t)
                setStore((s) => ({ ...s, routines: [...s.routines, r] }))
                setSel(r.id)
                setTab('edit')
              }}
            >
              <span aria-hidden="true">{t.emoji}</span>
              <strong>{t.name}</strong>
              <small>
                {t.steps.length} steps · {t.steps.reduce((a, s) => a + s.minutes, 0)} min
              </small>
              <small>{describe(t.repeat)}</small>
            </button>
          </div>
        ))}
      </Rail>
      {store.routines.length > 1 && routine && (
        <button type="button" className="studio-chip" onClick={() => setStore((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== routine.id) }))}>
          <Trash2 size={13} /> Delete “{routine.name}”
        </button>
      )}
    </div>
  )

  return (
    <Studio
      name="routines"
      accent="#3f8a76"
      tab={tab}
      onTab={(t) => (setPlaying(null), setTab(t))}
      scene={<StudioScene colors={['#9fdcc8', '#ffd89b', '#c9b8ff']} line="wave" />}
      tabs={[
        { id: 'today', label: 'Today', icon: <CalendarDays size={15} />, render: todayTab },
        { id: 'edit', label: 'Edit', icon: <Repeat size={15} />, render: edit },
        ...(on('templates') ? [{ id: 'library', label: 'Templates', icon: <ListPlus size={15} />, render: library }] : []),
      ]}
    />
  )
}

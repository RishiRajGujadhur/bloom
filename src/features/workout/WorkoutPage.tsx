import { prefersReducedMotion } from '../../utils/motion'
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Chart as ChartJS, BarElement, CategoryScale, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { Check, ChevronLeft, ChevronRight, Dumbbell, History, LineChart, Scale, ScanFace, Timer, Trophy } from 'lucide-react'
import { Rail, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { muscleNames, type Muscle } from '../exercise/exercises'
import { WORKOUT_KEY, e1rm, liftById, lifts, load, plates, progress, prsFor, templates, volume, warmups, weeklyMuscleSets, type WSet, type WorkoutStore } from './workoutModel'
import { WeekBars } from '../showcase/WeekBars'
import { usePageActions } from '../../components/ui/PageMenu'
import './workout.css'
import './formcoach.css'

const FormCoach = lazy(() => import('./FormCoach').then((m) => ({ default: m.FormCoach })))

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, BarElement, Tooltip, Filler)

const on = (id: string) => subOn('workoutLog', id)
/** Lifts done with a 20 kg barbell, for the per-side plate breakdown. */
const BARBELL = new Set(['bench', 'squat', 'deadlift', 'press', 'row', 'rdl', 'hipthrust'])
const ACCENT = '#d9653b'
const css = (name: string, fallback: string) => (typeof window === 'undefined' ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback)
const day = (t: number) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })

function RestRing({ total, left }: { total: number; left: number }) {
  const C = 2 * Math.PI * 44
  return (
    <svg className="wo-rest" viewBox="0 0 100 100" aria-label={`Rest ${left} seconds`}>
      <circle cx="50" cy="50" r="44" className="wo-rest-track" />
      <circle cx="50" cy="50" r="44" className="wo-rest-arc" strokeDasharray={C} strokeDashoffset={C * (1 - left / Math.max(1, total))} transform="rotate(-90 50 50)" />
      <text x="50" y="56" textAnchor="middle">
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </text>
    </svg>
  )
}

/** Barbell with plates that slide on when the target changes. */
function Barbell({ perSide }: { perSide: number[] }) {
  const root = useRef<SVGGElement>(null)
  const key = perSide.join(',')
  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const t = gsap.fromTo(root.current.querySelectorAll('.wo-plate'), { scaleY: 0.2, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'back.out(2)', transformOrigin: '50% 50%' })
    return () => void t.progress(1).kill()
  }, [key])
  const colors: Record<number, string> = { 25: '#d9534f', 20: '#3f6fb5', 15: '#f2c14e', 10: '#3f8a5a', 5: '#e8e2d9', 2.5: '#2b2230', 1.25: '#b8c2cc' }
  const h = (p: number) => 30 + p * 3.2
  let x = 0
  const side = perSide.map((p) => {
    const w = p >= 10 ? 16 : 10
    const el = { p, x, w }
    x += w + 2
    return el
  })
  return (
    <svg className="wo-bar" viewBox="0 0 520 160" aria-label={`${perSide.join(', ')} kg per side`}>
      <rect x="20" y="74" width="480" height="12" rx="6" className="wo-bar-shaft" />
      <rect x="170" y="70" width="180" height="20" rx="4" className="wo-bar-grip" />
      <g ref={root}>
        {side.map(({ p, x: px, w }, i) => (
          <g key={`r${i}`}>
            <rect className="wo-plate" x={362 + px} y={80 - h(p) / 2} width={w} height={h(p)} rx="3" fill={colors[p]} />
            <rect className="wo-plate" x={158 - px - w} y={80 - h(p) / 2} width={w} height={h(p)} rx="3" fill={colors[p]} />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function WorkoutPage() {
  const [store, setStoreState] = useState<WorkoutStore>(() => readStore(WORKOUT_KEY, { workouts: [], rest: 90, bodyweight: 70 }))
  const setStore = (fn: (s: WorkoutStore) => WorkoutStore) =>
    setStoreState((cur) => {
      const next = fn(cur)
      writeStore(WORKOUT_KEY, next)
      return next
    })
  const active = store.workouts.find((w) => !w.finishedAt)
  const [tab, setTab] = useState(active ? 'train' : 'train')
  const [liftIdx, setLiftIdx] = useState(0)
  const [weight, setWeight] = useState(40)
  const [reps, setReps] = useState(8)
  const [rpe, setRpe] = useState(8)
  const [restLeft, setRestLeft] = useState(0)
  const [newPrs, setNewPrs] = useState<string[]>([])
  const [chartLift, setChartLift] = useState('squat')
  const [target, setTarget] = useState(100)
  const logBtn = useRef<HTMLButtonElement>(null)
  const allSets = useMemo(() => store.workouts.flatMap((w) => w.sets), [store.workouts])
  const template = templates.find((t) => t.id === active?.templateId)
  const liftIds = template?.lifts ?? []
  const lift = liftById(liftIds[liftIdx] ?? '')

  useEffect(() => {
    if (restLeft <= 0) return
    const t = setTimeout(() => setRestLeft((s) => s - 1), 1000)
    if (restLeft === 1) navigator.vibrate?.([80, 60, 80])
    return () => clearTimeout(t)
  }, [restLeft])

  // Start each lift from what you did last time.
  useEffect(() => {
    if (!lift) return
    const last = [...allSets].reverse().find((s) => s.liftId === lift.id)
    setWeight(last ? last.weight : lift.bodyweight ? 0 : 20)
    setReps(last ? last.reps : lift.id === 'plank' ? 45 : 8)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the lift changes
  }, [lift?.id])

  const start = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId)!
    setStore((s) => ({ ...s, workouts: [...s.workouts, { id: crypto.randomUUID(), name: t.name, templateId, startedAt: Date.now(), sets: [] }] }))
    setLiftIdx(0)
    setNewPrs([])
  }
  const logSet = () => {
    if (!active || !lift) return
    const set: WSet = { liftId: lift.id, weight, reps, rpe: on('rpe') ? rpe : undefined, at: Date.now() }
    const prs = on('prs') ? prsFor(set, allSets, store.bodyweight) : []
    setStore((s) => ({ ...s, workouts: s.workouts.map((w) => (w.id === active.id ? { ...w, sets: [...w.sets, set] } : w)) }))
    if (prs.length) {
      setNewPrs((p) => [...p, `${lift.name}: ${prs.includes('e1rm') ? 'best estimated max' : prs.includes('weight') ? 'heaviest' : 'most reps'}`])
      burst(logBtn.current, 'stars')
    }
    if (on('restTimer')) setRestLeft(store.rest)
  }
  const finish = () => {
    if (!active) return
    setStore((s) => ({ ...s, workouts: s.workouts.map((w) => (w.id === active.id ? { ...w, finishedAt: Date.now() } : w)) }))
    logActivity('workout', { templateId: active.templateId, sets: active.sets.length })
    burst(null, 'stars')
    setRestLeft(0)
  }

  const muted = css('--text-muted', '#9a8f86')
  const grid = css('--border-color', '#eadfd4')
  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: grid }, ticks: { color: muted } }, y: { grid: { color: grid }, ticks: { color: muted } } } } as const

  usePageActions(
    active
      ? [{ id: 'wo-form', label: 'Open the form guide', icon: '💪', run: () => (window.location.hash = 'exercises') }]
      : templates.slice(0, 3).map((t) => ({ id: `wo-${t.id}`, label: `Start ${t.name}`, icon: t.emoji, run: () => start(t.id) })),
  )
  const train = () =>
    !active ? (
      <div className="wo-start">
        {(() => {
          const last = [...store.workouts].reverse().find((w) => w.finishedAt && templates.some((t) => t.id === w.templateId))
          if (!last) return null
          const days = Math.round((Date.now() - last.startedAt) / 864e5)
          return (
            <button type="button" className="wo-repeat" onClick={() => start(last.templateId)}>
              <History size={16} aria-hidden="true" /> Repeat <strong>{last.name}</strong>
              <small>
                {days === 0 ? 'earlier today' : days === 1 ? 'yesterday' : `${days} days ago`} · {last.sets.length} {last.sets.length === 1 ? 'set' : 'sets'} — starts from last time’s weights
              </small>
            </button>
          )
        })()}
        <h3>Pick today’s session</h3>
        {on('templates') ? (
          <Rail label="Templates">
            {templates.map((t) => (
              <div key={t.id} role="listitem">
                <button type="button" className="wo-template" onClick={() => start(t.id)}>
                  <span aria-hidden="true">{t.emoji}</span>
                  <strong>{t.name}</strong>
                  <small>{t.lifts.map((l) => liftById(l)?.name).join(' · ')}</small>
                </button>
              </div>
            ))}
          </Rail>
        ) : (
          <button className="studio-go" onClick={() => start('full')}>
            Start a workout
          </button>
        )}
        {on('history') && store.workouts.length > 0 && <p className="studio-empty">{store.workouts.length} workouts logged so far.</p>}
        {on('weekBars') && store.workouts.length > 0 && (
          <WeekBars
            unit="kg lifted"
            days={Array.from({ length: 7 }, (_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - (6 - i))
              const key = d.toDateString()
              const sets = store.workouts.filter((w) => new Date(w.startedAt).toDateString() === key).flatMap((w) => w.sets)
              const vol = Math.round(sets.reduce((t, x) => t + x.weight * x.reps, 0))
              return { label: d.toLocaleDateString([], { weekday: 'narrow' }), value: vol, today: i === 6, hint: `${d.toLocaleDateString([], { weekday: 'long' })}: ${sets.length} sets · ${vol} kg` }
            })}
          />
        )}
      </div>
    ) : (
      <div className="studio-split">
        <div className="studio-card wo-lift">
          <div className="wo-lift-nav">
            <button type="button" className="studio-chip" aria-label="Previous lift" onClick={() => setLiftIdx((i) => Math.max(0, i - 1))} disabled={liftIdx === 0}>
              <ChevronLeft size={16} />
            </button>
            <h3>{lift?.name}</h3>
            <a className="studio-chip" href="#exercises" data-hint="See how to do this move in the Exercises guide">Form guide</a>
            <button type="button" className="studio-chip" aria-label="Next lift" onClick={() => setLiftIdx((i) => Math.min(liftIds.length - 1, i + 1))} disabled={liftIdx >= liftIds.length - 1}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="wo-dots" aria-hidden="true">
            {liftIds.map((id, i) => (
              <i key={id} data-on={i === liftIdx} data-done={active.sets.some((s) => s.liftId === id)} />
            ))}
          </div>
          <Slider label={lift?.bodyweight ? 'Added weight' : 'Weight'} value={weight} min={0} max={lift?.bodyweight ? 60 : 250} step={lift?.step ?? 2.5} unit="kg" onChange={setWeight} />
          {lift && BARBELL.has(lift.id) && weight >= 20 && (() => {
            const { perSide, leftover } = plates(weight)
            return (
              <p className="wo-plates-inline" aria-label="Plates per side">
                {perSide.length ? <>Per side: {perSide.map((p, i) => <span key={i} className="wo-plate-chip" data-kg={p}>{p}</span>)}</> : 'Just the bar'}
                <small> on a 20 kg bar{leftover ? ` · ${leftover} kg can't be made` : ''}</small>
              </p>
            )
          })()}
          {lift && BARBELL.has(lift.id) && !active.sets.some((x) => x.liftId === lift.id) && warmups(weight).length > 0 && (
            <p className="wo-warmup">
              <strong>Warm up first:</strong> {warmups(weight).map((w) => `${w.weight}×${w.reps}`).join(' → ')}
            </p>
          )}
          <Slider label={lift?.id === 'plank' ? 'Seconds' : 'Reps'} value={reps} min={1} max={lift?.id === 'plank' ? 300 : 30} step={lift?.id === 'plank' ? 5 : 1} onChange={setReps} />
          {on('rpe') && <Slider label="Effort (RPE)" value={rpe} min={5} max={10} step={0.5} format={(v) => `${v}`} onChange={setRpe} />}
          <button ref={logBtn} type="button" className="studio-go" onClick={logSet}>
            <Check size={18} /> Log set
          </button>
          {on('e1rm') && lift && lift.id !== 'plank' && <p className="studio-empty">Estimated max: {e1rm(load({ liftId: lift.id, weight, reps, at: 0 }, store.bodyweight), reps)} kg</p>}
        </div>
        <div className="studio-card wo-side">
          {on('restTimer') && (
            <div className="wo-rest-box">
              <RestRing total={store.rest} left={restLeft} />
              <Slider label="Rest" value={store.rest} min={30} max={300} step={15} unit="s" compact onChange={(v) => setStore((s) => ({ ...s, rest: v }))} />
            </div>
          )}
          <ul className="wo-sets" aria-label="Sets this workout">
            {active.sets.map((s, i) => (
              <li key={i}>
                <span>{liftById(s.liftId)?.name}</span>
                <strong>
                  {s.weight} kg × {s.reps}
                </strong>
                {s.rpe && <small>@{s.rpe}</small>}
              </li>
            ))}
          </ul>
          {newPrs.length > 0 && (
            <div className="wo-prs">
              <Trophy size={16} /> {newPrs.join(' · ')}
            </div>
          )}
          <div className="studio-stats">
            <Stat value={active.sets.length} label="sets" />
            <Stat value={`${volume(active.sets, store.bodyweight)} kg`} label="volume" />
          </div>
          <button type="button" className="studio-go" data-variant="quiet" onClick={finish}>
            Finish workout
          </button>
        </div>
      </div>
    )

  const liftsWithData = lifts.filter((l) => allSets.some((s) => s.liftId === l.id))
  const series = progress(store.workouts, chartLift, store.bodyweight)
  const progressTab = () => (
    <div className="wo-progress">
      <div className="studio-chip-row" role="group" aria-label="Lift">
        {(liftsWithData.length ? liftsWithData : lifts.slice(0, 6)).map((l) => (
          <button key={l.id} type="button" className="studio-chip" aria-pressed={chartLift === l.id} onClick={() => setChartLift(l.id)}>
            {l.name}
          </button>
        ))}
      </div>
      {series.length < 2 ? (
        <p className="studio-empty">Log this lift in two workouts to see your trend.</p>
      ) : (
        <div className="studio-split">
          {on('progressChart') && (
            <div className="studio-card wo-chart">
              <h3>Estimated max</h3>
              <div className="wo-canvas" data-matrix-native>
                <Line
                  options={chartOpts}
                  data={{
                    labels: series.map((p) => day(p.at)),
                    datasets: [{ data: series.map((p) => p.best), borderColor: ACCENT, backgroundColor: `${ACCENT}33`, fill: true, tension: 0.35, pointRadius: 4 }],
                  }}
                />
              </div>
            </div>
          )}
          {on('volumeChart') && (
            <div className="studio-card wo-chart">
              <h3>Volume</h3>
              <div className="wo-canvas" data-matrix-native>
                <Bar options={chartOpts} data={{ labels: series.map((p) => day(p.at)), datasets: [{ data: series.map((p) => p.volume), backgroundColor: '#f2a65a', borderRadius: 8 }] }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const muscleSets = weeklyMuscleSets(store.workouts)
  const muscleList = (Object.keys(muscleNames) as Muscle[]).filter((m) => m !== 'obliques')
  const musclesTab = () => (
    <div className="studio-card wo-chart wo-muscles">
      <h3>Sets per muscle · last 7 days</h3>
      <p className="studio-empty">10–20 hard sets a week is a common growth range.</p>
      <div className="wo-canvas" data-matrix-native>
        <Bar
          options={{ ...chartOpts, indexAxis: 'y' as const, scales: { ...chartOpts.scales, x: { ...chartOpts.scales.x, suggestedMax: 20 } } }}
          data={{
            labels: muscleList.map((m) => muscleNames[m]),
            datasets: [{ data: muscleList.map((m) => muscleSets.get(m) ?? 0), backgroundColor: muscleList.map((m) => ((muscleSets.get(m) ?? 0) >= 10 ? '#6bbf7a' : '#f2a65a')), borderRadius: 6 }],
          }}
        />
      </div>
    </div>
  )

  const plan = plates(target)
  const platesTab = () => (
    <div className="studio-center wo-plates">
      <Barbell perSide={plan.perSide} />
      <p className="wo-plate-text">
        {plan.perSide.length ? `${plan.perSide.join(' + ')} kg each side` : 'Just the bar'}
        {plan.leftover > 0 && ` · ${plan.leftover} kg can’t be made`}
      </p>
      <div className="wo-plate-slider">
        <Slider label="Target" value={target} min={20} max={260} step={2.5} unit="kg" onChange={setTarget} />
      </div>
    </div>
  )

  const historyTab = () =>
    store.workouts.length ? (
      <Rail label="Past workouts">
        {[...store.workouts].reverse().map((w) => (
          <article key={w.id} className="wo-history" role="listitem">
            <strong>{w.name}</strong>
            <small>
              {day(w.startedAt)} · {w.sets.length} sets · {volume(w.sets, store.bodyweight)} kg
            </small>
            <ul>
              {[...new Set(w.sets.map((s) => s.liftId))].map((id) => {
                const best = w.sets.filter((s) => s.liftId === id).sort((a, b) => b.weight - a.weight)[0]
                return (
                  <li key={id}>
                    {liftById(id)?.name}: {best.weight}×{best.reps}
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </Rail>
    ) : (
      <p className="studio-empty">Your workouts will appear here.</p>
    )

  return (
    <Studio
      name="workouts"
      accent={ACCENT}
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#f2a65a', '#e27396', '#ffd89b']} line="mountain" />}
      aside={
        active ? (
          <span className="ex-aside">
            <Timer size={15} /> {template?.name} in progress
          </span>
        ) : undefined
      }
      tabs={[
        { id: 'train', label: 'Train', icon: <Dumbbell size={15} />, render: train },
        ...(on('formCoach') ? [{ id: 'coach', label: 'Form coach', icon: <ScanFace size={15} />, render: () => <Suspense fallback={<p role="status">Loading the form coach…</p>}><FormCoach onLog={(liftId, reps) => { const set = { liftId, weight: 0, reps, at: Date.now() }; setStore((s) => { const open = s.workouts.find((w) => !w.finishedAt); return open ? { ...s, workouts: s.workouts.map((w) => (w.id === open.id ? { ...w, sets: [...w.sets, set] } : w)) } : { ...s, workouts: [...s.workouts, { id: crypto.randomUUID(), name: 'Form coach', templateId: 'coach', startedAt: Date.now(), finishedAt: Date.now(), sets: [set] }] } }); logActivity('workout', { reps }) }} /></Suspense> }] : []),
        ...(on('progressChart') || on('volumeChart') ? [{ id: 'progress', label: 'Progress', icon: <LineChart size={15} />, render: progressTab }] : []),
        ...(on('muscleVolume') ? [{ id: 'muscles', label: 'Muscles', icon: <Dumbbell size={15} />, render: musclesTab }] : []),
        ...(on('plates') ? [{ id: 'plates', label: 'Plates', icon: <Scale size={15} />, render: platesTab }] : []),
        ...(on('history') ? [{ id: 'history', label: 'History', icon: <History size={15} />, render: historyTab }] : []),
      ]}
    />
  )
}

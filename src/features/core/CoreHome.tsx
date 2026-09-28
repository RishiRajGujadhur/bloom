import { prefersReducedMotion } from '../../utils/motion'
import { useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import gsap from 'gsap'
import { ArrowRight, Check, Moon, Sparkles, Sun, Sunrise, X } from 'lucide-react'
import type { AppData } from '../../model'
import { id as newId, toggleHabit } from '../../model'
import type { NavKey } from '../../components/layout/Sidebar'
import type { FeatureFlags } from '../../SettingsPage'
import { inferStat } from '../../rpg/schema'
import { toggleTodo } from '../productivity'
import { subOn } from '../subFeatures'
import { dayKey } from '../../dates'
import { burst } from '../../components/ui/celebrate'
import { readExtras } from './CoreEngine'
import { daysAway, garden, growth, stages } from './growthModel'
import { PROFILE_KEY, modeCopy, modeFor, seedFor, weekStory, whatNow, type Action, type Goal, type Profile } from './nowModel'
import { addMoment } from './discoveries'
import { showMoment } from './MomentReveal'
import './core.css'

const readProfile = (): Profile => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? '{}') as Profile
  } catch {
    return {}
  }
}
const saveProfile = (p: Profile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
  } catch {
    /* best effort */
  }
}
const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* best effort */
  }
}
const weekKey = (today: string) => {
  const d = new Date(`${today}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(d)
}
const WEEK_KEY = 'bloom-week-seen-v1'
const WELCOME_KEY = 'bloom-welcome-dismissed-v1'

type Props = {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  today: string
  flags: FeatureFlags
  onNavigate: (key: NavKey) => void
  onPlan: () => void
}

const modeIcon = { morning: Sunrise, afternoon: Sun, evening: Moon, sunday: Sparkles }

/** The one dominant question on the home screen: what should I do now? */
export function NowCard({ data, setData, today, flags, onNavigate, onPlan }: Props) {
  const mode = modeFor()
  const [, force] = useState(0)
  const journalPage: NavKey = flags.daybookModes ? 'daybook' : flags.chatJournal ? 'journal' : 'gratitude'
  const reflectedToday =
    data.sessions.some((s) => dayKey(new Date(s.metadata.date)) === today) || readExtras().daybook.includes(today)
  const now = whatNow(data, today, mode, { reflectedToday, weekSeen: read(WEEK_KEY) === weekKey(today) || !subOn('bloomCore', 'weekly'), journalPage })
  const Icon = modeIcon[mode]
  const btn = useRef<HTMLButtonElement>(null)
  const profile = readProfile()

  const run = (a: Action, el?: HTMLElement | null) => {
    if (a.type === 'focus') {
      setData((d) => ({ ...d, rpg: { ...d.rpg, focusQuest: { ...d.rpg.focusQuest, taskId: a.taskId } } }))
      onNavigate(flags.focusRoom ? 'focus-room' : 'focus')
    } else if (a.type === 'complete') {
      burst(el ?? btn.current, 'stars')
      setData((d) => toggleTodo(d, a.taskId))
    } else if (a.type === 'habit') {
      burst(el ?? btn.current, 'stars')
      setData((d) => toggleHabit(d, a.habitId, today))
    } else if (a.type === 'navigate') onNavigate(a.page)
    else if (a.type === 'plan') onPlan()
    else if (a.type === 'week') {
      const w = weekStory(data, today)
      const pct = (k: keyof typeof w.thisWeek) => {
        const c = w.change(k)
        return c === null ? '' : ` (${c >= 0 ? '+' : ''}${c}%)`
      }
      const lead = (w.change('tasks') ?? 0) > 0 ? 'You did more of what matters than last week.' : (w.change('focus') ?? 0) > 0 ? 'Your focus deepened this week.' : 'A quieter week, and quiet weeks count too.'
      addMoment({ id: `week:${weekKey(today)}`, date: today, kind: 'week', title: 'Your week', detail: `${w.thisWeek.tasks} tasks, ${w.thisWeek.focus} focus minutes, ${w.thisWeek.reflections} reflections.` })
      showMoment({
        kind: 'week',
        kicker: 'Sunday Bloom',
        title: 'Here’s what changed this week',
        body: lead,
        stats: [
          { label: `tasks${pct('tasks')}`, value: String(w.thisWeek.tasks) },
          { label: `focus min${pct('focus')}`, value: String(w.thisWeek.focus) },
          { label: `habit ticks${pct('habits')}`, value: String(w.thisWeek.habits) },
          { label: 'reflections', value: String(w.thisWeek.reflections) },
        ],
      })
      write(WEEK_KEY, weekKey(today))
      force((n) => n + 1)
    }
  }

  return (
    <section className="now-card" data-mode={mode} aria-labelledby="now-title">
      <div className="now-main">
        <span className="now-kicker">
          <Icon size={15} aria-hidden="true" /> {modeCopy[mode].kicker}
        </span>
        <p className="now-greeting">
          {modeCopy[mode].greeting}
          {profile.goal ? ` · ${goalCopy[profile.goal].short}` : ''}
        </p>
        <h2 id="now-title">{now.title}</h2>
        <p className="now-reason">{now.reason}</p>
        <div className="now-actions">
          <button ref={btn} className="now-primary" type="button" onClick={() => run(now.primary)}>
            {now.primary.label} <ArrowRight size={18} aria-hidden="true" />
          </button>
          {now.secondary && (
            <button className="now-secondary" type="button" onClick={(e) => run(now.secondary!, e.currentTarget)}>
              {now.secondary.type === 'complete' || now.secondary.type === 'habit' ? <Check size={15} aria-hidden="true" /> : null} {now.secondary.label}
            </button>
          )}
        </div>
      </div>
      {subOn('bloomCore', 'progress') && (
        <ul className="now-chips" aria-label="Progress today">
          {now.chips.map((c) => (
            <li key={c.label}>
              <span className="now-chip-ring" style={{ ['--p' as string]: Math.min(1, c.value / Math.max(1, c.of)) }} aria-hidden="true" />
              <span>
                <strong>
                  {c.value}
                  {c.label !== 'Focus min' && <small>/{c.of}</small>}
                </strong>
                <small>{c.label}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {subOn('bloomCore', 'tomorrowSeed') && (
        <p className="now-seed">
          <span aria-hidden="true">🌱</span> <strong>Today’s seed:</strong> {seedFor(today)} <em>A new one opens tomorrow.</em>
        </p>
      )}
    </section>
  )
}

const plantPaths: Record<string, string> = {
  seed: 'M50 86 C42 86 40 78 50 74 C60 78 58 86 50 86 Z',
  sprout: 'M50 88 L50 64 M50 70 C40 60 32 64 34 70 C40 72 46 72 50 70 M50 66 C60 56 68 60 66 66 C60 68 54 68 50 66',
  growing: 'M50 88 L50 44 M50 70 C36 60 28 64 30 72 C38 74 46 74 50 70 M50 58 C64 48 72 52 70 60 C62 62 54 62 50 58 M50 46 C44 36 48 30 50 28 C52 30 56 36 50 46',
  thriving: 'M50 88 L50 34 M50 72 C34 62 26 66 28 74 C36 76 46 76 50 72 M50 60 C66 50 74 54 72 62 C64 64 54 64 50 60 M50 48 C36 40 30 44 32 50 C40 52 46 52 50 48',
  blooming: 'M50 88 L50 36 M50 72 C34 62 26 66 28 74 C36 76 46 76 50 72 M50 60 C66 50 74 54 72 62 C64 64 54 64 50 60',
}

/** One meaningful progression: your stage, and a garden that only grows. */
export function GrowthGarden({ data, today }: Pick<Props, 'data' | 'today'>) {
  const extras = useMemo(() => readExtras(), [])
  const g = growth(data, today, extras)
  const flowers = garden(data, today, extras)
  const root = useRef<SVGSVGElement>(null)
  const idx = stages.findIndex((s) => s.id === g.stage.id)
  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.gg-plant', { strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' })
      gsap.from('.gg-flower', { scale: 0, transformOrigin: '50% 100%', duration: 0.5, stagger: 0.012, ease: 'back.out(2)' })
      gsap.to('.gg-bud', { opacity: 0.35, duration: 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to('.gg-bloom', { rotation: 360, transformOrigin: '50px 30px', duration: 40, repeat: -1, ease: 'none' })
    }, root)
    return () => ctx.revert()
  }, [])
  const hue = (d: string) => (Number(d.slice(8)) * 47 + Number(d.slice(5, 7)) * 13) % 360
  const cols = 21
  return (
    <section className="gg" aria-label={`Bloom Growth: ${g.stage.name}, ${g.score} of 100`}>
      <svg ref={root} className="gg-art" viewBox="0 0 420 150" aria-hidden="true">
        <defs>
          <linearGradient id="gg-sky" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--gg-sky-top)" />
            <stop offset="1" stopColor="var(--gg-sky-bottom)" />
          </linearGradient>
        </defs>
        <rect width="420" height="150" rx="18" fill="url(#gg-sky)" />
        <circle cx="370" cy="30" r="14" className="gg-sun" />
        <path d="M0 118 Q105 108 210 116 T420 112 L420 150 L0 150 Z" className="gg-ground" />
        {flowers.map((d, i) => {
          const x = 130 + (i % cols) * 13 + (Math.floor(i / cols) % 2) * 6
          const y = 132 - Math.floor(i / cols) * 7
          return (
            <g key={d} className="gg-flower" transform={`translate(${x} ${y})`}>
              <line x1="0" y1="0" x2="0" y2="-8" stroke="#6b9e5a" strokeWidth="1.2" />
              <circle cy="-9" r="3" fill={`hsl(${hue(d)} 70% 72%)`} />
              <circle cy="-9" r="1.2" fill="#fff6c8" />
            </g>
          )
        })}
        {subOn('bloomCore', 'tomorrowSeed') && (
          <g className="gg-bud" transform={`translate(${130 + (flowers.length % cols) * 13 + (Math.floor(flowers.length / cols) % 2) * 6} ${132 - Math.floor(flowers.length / cols) * 7})`}>
            <line x1="0" y1="0" x2="0" y2="-8" stroke="#6b9e5a" strokeWidth="1.2" strokeDasharray="2 2" />
            <circle cy="-9" r="3" fill="none" stroke="#6b9e5a" strokeDasharray="2 1.5" />
          </g>
        )}
        <g transform="translate(10 18) scale(1.15)">
          <path d={plantPaths[g.stage.id]} className="gg-plant" strokeDasharray="300" />
          {idx >= 3 && <circle cx="50" cy="30" r="5" className="gg-center" />}
          {g.stage.id === 'blooming' && (
            <g className="gg-bloom">
              {Array.from({ length: 8 }, (_, i) => (
                <ellipse key={i} cx="50" cy="20" rx="4" ry="9" className="gg-petal" transform={`rotate(${i * 45} 50 30)`} />
              ))}
            </g>
          )}
        </g>
      </svg>
      <div className="gg-info">
        <span className="now-kicker">Bloom Growth</span>
        <h3>
          {g.stage.name} <small>{g.score}/100</small>
        </h3>
        <p>{g.stage.line}</p>
        <div className="gg-track" aria-hidden="true">
          {stages.map((s, i) => (
            <span key={s.id} data-on={i <= idx} title={s.name} />
          ))}
        </div>
        <p className="gg-next">
          {g.next ? `${g.toNext} to ${g.next.name}. Consistency grows it more than intensity.` : 'Fully grown. Now it’s about keeping your rhythm.'}
        </p>
        {subOn('bloomCore', 'pillars') && (
          <ul className="gg-pillars" aria-label="This week's balance">
            {(
              [
                ['Do', g.pillars.do],
                ['Focus', g.pillars.focus],
                ['Reflect', g.pillars.reflect],
                ['Care', g.pillars.care],
              ] as const
            ).map(([label, v]) => (
              <li key={label}>
                <span>{label}</span>
                <span className="gg-bar">
                  <span style={{ width: `${Math.round(v * 100)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="gg-garden">
          {flowers.length} {flowers.length === 1 ? 'flower' : 'flowers'} in your garden · one for every day you showed up. They never wilt.
        </p>
      </div>
    </section>
  )
}

/** Never punish absence: welcome people back to where they left off. */
export function WelcomeBack({ data, today, onNavigate }: Pick<Props, 'data' | 'today' | 'onNavigate'>) {
  const [hidden, setHidden] = useState(() => read(WELCOME_KEY) === today)
  const away = daysAway(data, today, readExtras())
  if (hidden || away === null || away < 2) return null
  const lastTask = [...data.todos].filter((t) => t.done && t.completedAt).sort((a, b) => b.completedAt! - a.completedAt!)[0]
  const open = data.todos.filter((t) => !t.done).length
  const flowers = garden(data, today, readExtras()).length
  const dismiss = () => {
    write(WELCOME_KEY, today)
    setHidden(true)
  }
  return (
    <section className="welcome-back" aria-labelledby="welcome-title">
      <button className="icon-button welcome-close" aria-label="Dismiss" onClick={dismiss}>
        <X size={16} />
      </button>
      <h2 id="welcome-title">Welcome back. Here’s where you left off.</h2>
      <p>Nothing was lost. Your history and your garden are exactly as you left them.</p>
      <ul>
        {lastTask && <li>Last thing you finished: <strong>{lastTask.title}</strong></li>}
        <li>
          {open} open {open === 1 ? 'task' : 'tasks'} waiting, no rush
        </li>
        <li>{flowers} flowers still growing in your garden</li>
      </ul>
      <button
        className="now-secondary"
        onClick={() => {
          dismiss()
          onNavigate('todos')
        }}
      >
        Pick one small thing <ArrowRight size={15} aria-hidden="true" />
      </button>
    </section>
  )
}

const goalCopy: Record<Goal, { label: string; short: string; habit: string; emoji: string }> = {
  calm: { label: 'Feel calmer', short: 'calm first', habit: 'Two minutes of breathing', emoji: '🌊' },
  done: { label: 'Get the right things done', short: 'one thing at a time', habit: 'Plan tomorrow in 2 minutes', emoji: '🎯' },
  habits: { label: 'Build better habits', short: 'small and steady', habit: 'A 10-minute walk', emoji: '🌱' },
  understand: { label: 'Understand myself', short: 'notice and reflect', habit: 'Three lines before bed', emoji: '💭' },
}

/**
 * Onboarding that reaches value fast: goal → routine → first task → you're
 * in. Each step personalises something; nothing is a tutorial. Inline and
 * skippable — it never blocks the app.
 */
export function Onboarding({ data, setData, today }: Pick<Props, 'data' | 'setData' | 'today'>) {
  const [profile, setProfile] = useState(readProfile)
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [routine, setRoutine] = useState<'morning' | 'evening'>('morning')
  const [task, setTask] = useState('')
  const fresh = !profile.onboardedAt && !data.sessions.length && !data.todos.some((t) => t.done) && Date.now() - data.rpg.createdAt < 3 * 86_400_000
  if (!fresh) return null
  const finish = (skip = false) => {
    const next: Profile = { goal: goal ?? undefined, routine, onboardedAt: Date.now() }
    saveProfile(next)
    setProfile(next)
    if (skip || !goal) return
    setData((d) => ({
      ...d,
      habits: d.habits.some((h) => h.title === goalCopy[goal].habit)
        ? d.habits
        : [...d.habits, { id: newId(), title: goalCopy[goal].habit, detail: routine === 'morning' ? 'Part of your morning' : 'Part of your evening', dates: [], stat: inferStat(goalCopy[goal].habit) }],
      todos: task.trim()
        ? [...d.todos, { id: newId(), title: task.trim().slice(0, 150), done: false, due: today, completedAt: null, challengeId: null, rewarded: false, priority: 'P1', tags: [], recurrence: 'none', seriesId: null, subtasks: [] }]
        : d.todos,
    }))
  }
  return (
    <section className="onboard" aria-labelledby="onboard-title">
      <div className="onboard-steps" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} data-on={i <= step} />
        ))}
      </div>
      {step === 0 && (
        <>
          <h2 id="onboard-title">What would you like Bloom to help with?</h2>
          <div className="onboard-options">
            {(Object.keys(goalCopy) as Goal[]).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={goal === g}
                onClick={() => {
                  setGoal(g)
                  setStep(1)
                }}
              >
                <span aria-hidden="true">{goalCopy[g].emoji}</span> {goalCopy[g].label}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 1 && goal && (
        <>
          <h2 id="onboard-title">When do you have a quiet moment?</h2>
          <p>We’ll start you with one tiny habit: “{goalCopy[goal].habit}”.</p>
          <div className="onboard-options">
            {(['morning', 'evening'] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={routine === r}
                onClick={() => {
                  setRoutine(r)
                  setStep(2)
                }}
              >
                <span aria-hidden="true">{r === 'morning' ? '🌅' : '🌙'}</span> In the {r}
              </button>
            ))}
          </div>
        </>
      )}
      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            finish()
          }}
        >
          <h2 id="onboard-title">One thing you’d like to get done today?</h2>
          <div className="onboard-task">
            <input aria-label="Your first task" placeholder="Reply to Sam’s email" value={task} autoFocus onChange={(e) => setTask(e.target.value)} />
            <button className="now-primary" type="submit">
              Enter Bloom <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
          <p>Finish it and your garden gets its first flower.</p>
        </form>
      )}
      <button type="button" className="onboard-skip" onClick={() => finish(true)}>
        Skip for now
      </button>
    </section>
  )
}


import { useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  LayoutDashboard,
  Leaf,
  ListChecks,
  Moon,
  Plus,
  Quote,
  Sun,
  X,
  BookOpen,
  Pencil,
  Flower2,
} from 'lucide-react'
import { dayKey, id, STORAGE_KEY, toggleHabit } from './model'
import type { Session } from './model'
import { useCoach } from './useCoach'
import { Modal } from './components/Modal'
import { ChatJournalContainer } from './components/journal/ChatJournalContainer'
import { SummaryContent } from './components/journal/SessionSummaryModal'
import './App.css'
import { RpgDashboard } from './rpg/RpgDashboard'
import { inferStat, statNames } from './rpg/schema'
import type { Stat } from './rpg/schema'

const THEME_STORAGE_KEY = 'mindfulness-dashboard-theme'
type Theme = 'light' | 'dark'

function Checkmark({ checked }: { checked: boolean }) {
  const reduced = useReducedMotion()
  return (
    <span className={`checkmark ${checked ? 'checked' : ''}`}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <motion.path
          d="m6 12 4 4 8-8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
        />
      </svg>
    </span>
  )
}
function TextForm({
  label,
  initial = '',
  max = 100,
  onSave,
}: {
  label: string
  initial?: string
  max?: number
  onSave: (value: string) => void
}) {
  const form = useFormik({
    initialValues: { value: initial },
    validate: (v) =>
      !v.value.trim()
        ? { value: 'Please add a little text.' }
        : v.value.trim().length > max
          ? { value: `Use ${max} characters or fewer.` }
          : {},
    onSubmit: (values) => onSave(values.value.trim()),
  })
  return (
    <form onSubmit={form.handleSubmit} className="text-form">
      <label htmlFor="new-value">{label}</label>
      <textarea
        autoFocus
        id="new-value"
        name="value"
        rows={3}
        value={form.values.value}
        onChange={form.handleChange}
        maxLength={max}
        aria-describedby="value-error"
      />
      <p id="value-error" className="error-text">
        {form.errors.value && form.submitCount > 0 ? form.errors.value : ''}
      </p>
      <button type="submit" className="primary full">
        Save <Check size={16} />
      </button>
    </form>
  )
}
function App() {
  const { data, setData, error, blocked, resumeSaving } = useCoach()
  const [today, setToday] = useState(dayKey)
  const [modal, setModal] = useState<
    'habit' | 'plan' | 'affirmation' | 'history' | null
  >(null)
  const [editPlan, setEditPlan] = useState<string | null>(null)
  const [viewSession, setViewSession] = useState<Session | null>(null)
  const [active, setActive] = useState('overview')
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })
  const themeMounted = useRef(false)
  useEffect(() => {
    const timer = setInterval(() => setToday(dayKey()), 30000)
    const refresh = () => setToday(dayKey())
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    if (themeMounted.current) {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } else {
      themeMounted.current = true
    }
  }, [theme])
  const completed = data.habits.filter((h) => h.dates.includes(today)).length
  const progress = data.habits.length
    ? Math.round((completed / data.habits.length) * 100)
    : 0
  const plans = data.plans.filter((p) => p.date === today)
  const lastWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + i)
    const key = dayKey(date)
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      count: data.habits.filter((h) => h.dates.includes(key)).length,
    }
  })
  const exportData = (original = false) => {
    let content: string
    try {
      content = original
        ? (localStorage.getItem(STORAGE_KEY) ?? '{}')
        : JSON.stringify(data, null, 2)
    } catch {
      return
    }
    const url = URL.createObjectURL(
      new Blob([content], { type: 'application/json' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `mindfulness-${original ? 'original-' : ''}${today}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const jump = (target: string) => {
    setActive(target)
    document
      .getElementById(target)
      ?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      })
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell" data-palette={data.rpg.palette} data-theme={theme}>
        <a className="skip-link" href="#overview">
          Skip to dashboard
        </a>
        <aside className="sidebar">
          <a className="brand" href="#overview">
            <span className="brand-icon">
              <Flower2 size={27} />
            </span>
            <span>
              bloom<span className="brand-dot">.</span>
              <small>YOUR EVERYDAY SPACE</small>
            </span>
          </a>
          <div className="nav-caption">MY SPACE</div>
          <nav aria-label="Main navigation">
            {[
              { key: 'overview', title: 'My dashboard', Icon: LayoutDashboard },
              { key: 'habits', title: 'Daily habits', Icon: ListChecks },
              { key: 'journal', title: 'Reflection journal', Icon: BookOpen },
              { key: 'planning', title: 'My intentions', Icon: Sun },
            ].map(({ key, title, Icon }) => (
              <button
                key={key}
                className={active === key ? 'active' : ''}
                onClick={() => jump(key)}
              >
                <Icon size={19} />
                {title}
                {active === key && <span className="nav-indicator" />}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <Leaf size={24} />
            <h3>Grow at your own pace.</h3>
            <p>
              You don’t need a perfect day
              <br />
              to make a little progress.
            </p>
            <span>One small step at a time ✧</span>
          </div>
          <div className="sidebar-bottom">
            <span className="avatar">Y</span>
            <div>
              <strong>Your personal space</strong>
              <small>No account needed</small>
            </div>
            <Heart size={16} />
          </div>
        </aside>
        <main id="overview">
          <header className="topbar">
            <span>
              <span className="tiny-dot" /> A LITTLE BETTER, EVERY DAY
            </span>
            <div className="topbar-actions">
              <button
                className="theme-toggle"
                type="button"
                aria-label={
                  theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              </button>
              <button className="quiet-button" onClick={() => exportData()}>
                <ArrowDownToLine size={16} /> Export my data
              </button>
            </div>
          </header>
          <div className="page-content">
            <div className="welcome">
              <div>
                <div className="eyebrow">
                  {new Date(`${today}T12:00:00`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <h1>
                  A little space to <em>grow.</em>
                </h1>
                <p>
                  Welcome back. Let’s make today feel a little more like you.
                </p>
              </div>
              <div className="private-badge">
                <span className="tiny-dot" /> Just for you
              </div>
            </div>
            {error && (
              <div className="storage-error" role="alert">
                <strong>Saving needs your attention</strong>
                <p>{error}</p>
                {blocked && (
                  <>
                    <button onClick={() => exportData(true)}>
                      Export original data
                    </button>
                    <button onClick={resumeSaving}>
                      Use fresh data & enable saving
                    </button>
                  </>
                )}
              </div>
            )}
            <RpgDashboard data={data} setData={setData} onReflect={() => jump('journal')} />
            <div className="stats">
              <div>
                <span className="stat-icon lavender">
                  <ListChecks size={21} />
                </span>
                <div>
                  <strong>
                    {completed}
                    <small> / {data.habits.length}</small>
                  </strong>
                  <span>Habits nurtured today</span>
                </div>
              </div>
              <div>
                <span className="stat-icon peach">
                  <Sun size={21} />
                </span>
                <div>
                  <strong>
                    {plans.filter((p) => p.done).length}
                    <small> / {plans.length}</small>
                  </strong>
                  <span>Intentions followed through</span>
                </div>
              </div>
              <div>
                <span className="stat-icon mint">
                  <BookOpen size={21} />
                </span>
                <div>
                  <strong>{data.sessions.length}</strong>
                  <span>Moments of reflection</span>
                </div>
              </div>
            </div>
            <div className="dashboard-grid">
              <div className="left-column">
                <section className="card" id="habits">
                  <div className="card-heading">
                    <div className="section-title">
                      <span className="icon-tile purple">
                        <ListChecks size={19} />
                      </span>
                      <div>
                        <h2>Little habits, big love</h2>
                        <p>Show up for yourself, in small ways.</p>
                      </div>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Add habit"
                      onClick={() => setModal('habit')}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="progress-label">
                    <span>Today’s progress</span>
                    <strong>{progress}%</strong>
                  </div>
                  <div className="progress-track">
                    <motion.div
                      initial={false}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="habit-list">
                    {data.habits.map((h) => (
                      <div className="habit-with-stat" key={h.id}>
                      <button
                        className={`habit ${h.dates.includes(today) ? 'done' : ''}`}
                        aria-pressed={h.dates.includes(today)}
                        onClick={() =>
                          setData((d) => toggleHabit(d, h.id, dayKey()))
                        }
                      >
                        <Checkmark checked={h.dates.includes(today)} />
                        <span>
                          <strong>{h.title}</strong>
                          <small>
                            {h.detail || 'A small promise to yourself'}
                          </small>
                        </span>
                        <span className="habit-spark">
                          {h.dates.includes(today) ? '✦' : '＋'}
                        </span>
                      </button>
                      <label className="habit-stat-select">+5
                        <select aria-label={`Stat for ${h.title}`} value={h.stat} onChange={e => { const stat=e.target.value as Stat; setData(d=>({...d,habits:d.habits.map(item=>item.id===h.id?{...item,stat}:item)})) }}>
                          {(Object.keys(statNames) as Stat[]).map(stat=><option key={stat} value={stat}>{statNames[stat]}</option>)}
                        </select>
                        <small>+10 EXP × combo</small>
                      </label></div>
                    ))}
                  </div>
                  <button
                    className="add-line"
                    onClick={() => setModal('habit')}
                  >
                    <Plus size={16} /> Add a small habit
                  </button>
                  <div className="week-strip">
                    <span>Your last 7 days</span>
                    <div>
                      {lastWeek.map((d) => (
                        <div
                          key={d.key}
                          title={`${d.key}: ${d.count} habits completed`}
                          className={d.key === today ? 'today' : ''}
                        >
                          <span>{d.label}</span>
                          <i className={d.count ? 'has-progress' : ''}>
                            {d.count ? <Check size={12} /> : '·'}
                          </i>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                <section className="card" id="planning">
                  <div className="card-heading">
                    <div className="section-title">
                      <span className="icon-tile orange">
                        <Sun size={19} />
                      </span>
                      <div>
                        <h2>A little intention</h2>
                        <p>What deserves your energy today?</p>
                      </div>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Add intention"
                      onClick={() => setModal('plan')}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {plans.length === 0 ? (
                    <div className="empty-plans">
                      <Sun size={26} />
                      <p>A fresh page for your day.</p>
                      <small>Choose something meaningful, however small.</small>
                    </div>
                  ) : (
                    <div className="plan-list">
                      {plans.map((p, i) => (
                        <div className="plan" key={p.id}>
                          <button
                            className={
                              p.done ? 'plan-toggle done' : 'plan-toggle'
                            }
                            aria-pressed={p.done}
                            onClick={() =>
                              setData((d) => ({
                                ...d,
                                plans: d.plans.map((item) =>
                                  item.id === p.id
                                    ? { ...item, done: !item.done }
                                    : item,
                                ),
                              }))
                            }
                          >
                            <span>
                              {p.done ? (
                                <Check size={15} />
                              ) : (
                                String(i + 1).padStart(2, '0')
                              )}
                            </span>
                            <strong>{p.title}</strong>
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Edit ${p.title}`}
                            onClick={() => setEditPlan(p.id)}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="add-line" onClick={() => setModal('plan')}>
                    <Plus size={16} /> Set an intention
                  </button>
                </section>
              </div>
              <div className="right-column">
                <ChatJournalContainer data={data} setData={setData} />
                <section className="affirmation">
                  <div className="card-heading">
                    <span className="eyebrow">
                      <Quote size={15} /> WORDS TO GROW WITH
                    </span>
                    <button
                      className="icon-button"
                      aria-label="Edit affirmation"
                      onClick={() => setModal('affirmation')}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <blockquote>“{data.affirmation}”</blockquote>
                  <div>
                    <span>A reminder, just for you.</span>
                    <Flower2 size={25} />
                  </div>
                </section>
              </div>
            </div>
            <button
              className="history-card"
              onClick={() => setModal('history')}
            >
              <span className="icon-tile purple">
                <BookOpen size={20} />
              </span>
              <span>
                <strong>Your story is unfolding</strong>
                <small>
                  Revisit your reflections and see how far you’ve come.
                </small>
              </span>
              <span className="history-count">
                {data.sessions.length} reflections
              </span>
              <ChevronRight size={19} />
            </button>
            <footer>
              <span>
                <Leaf size={14} /> Made for your own kind of growth.
              </span>
              <span>
                Saved in this browser ·{' '}
                <button onClick={() => exportData()}>Keep a backup</button>
              </span>
            </footer>
          </div>
        </main>
      </div>
      {modal === 'habit' && (
        <Modal title="Plant a small habit" onClose={() => setModal(null)}>
          <TextForm
            label="What would you like to practice?"
            onSave={(title) => {
              setData((d) => ({
                ...d,
                habits: [
                  ...d.habits,
                  { id: id(), title, detail: '', dates: [], stat: inferStat(title) },
                ],
              }))
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'plan' && (
        <Modal
          title="Make room for what matters"
          onClose={() => setModal(null)}
        >
          <TextForm
            label="One intention for today"
            max={150}
            onSave={(title) => {
              setData((d) => ({
                ...d,
                plans: [
                  ...d.plans,
                  { id: id(), title, date: dayKey(), done: false },
                ],
              }))
              setModal(null)
            }}
          />
        </Modal>
      )}
      {editPlan && (
        <Modal title="Edit your intention" onClose={() => setEditPlan(null)}>
          <TextForm
            label="Your intention"
            initial={data.plans.find((p) => p.id === editPlan)?.title}
            max={150}
            onSave={(title) => {
              setData((d) => ({
                ...d,
                plans: d.plans.map((p) =>
                  p.id === editPlan ? { ...p, title } : p,
                ),
              }))
              setEditPlan(null)
            }}
          />
        </Modal>
      )}
      {modal === 'affirmation' && (
        <Modal title="Words that feel like you" onClose={() => setModal(null)}>
          <TextForm
            label="Your personal affirmation"
            initial={data.affirmation}
            max={300}
            onSave={(affirmation) => {
              setData((d) => ({ ...d, affirmation }))
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'history' && (
        <Modal
          title="Your reflection journal"
          onClose={() => {
            setModal(null)
            setViewSession(null)
          }}
        >
          {viewSession ? (
            <>
              <button
                className="text-button"
                onClick={() => setViewSession(null)}
              >
                <X size={14} /> Back to reflections
              </button>
              <SummaryContent session={viewSession} />
            </>
          ) : data.sessions.length ? (
            [...data.sessions].reverse().map((s) => (
              <button
                key={s.metadata.id}
                className="history-item"
                onClick={() => setViewSession(s)}
              >
                <strong>
                  {new Date(s.metadata.date).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  })}
                </strong>
                <span>
                  {s.messages.find(
                    (m) => m.sender === 'user' && m.category === 'win',
                  )?.text ?? 'A moment for yourself'}
                </span>
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <p className="empty-message">
              Your story starts with one check-in. Saved reflections will appear
              here.
            </p>
          )}
        </Modal>
      )}
    </MotionConfig>
  )
}
export default App

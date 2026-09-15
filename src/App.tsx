import { useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
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
import './i18n/i18n'
import { useCoach } from './useCoach'
import { Modal } from './components/Modal'
import { ChatJournalContainer } from './components/journal/ChatJournalContainer'
import { SummaryContent } from './components/journal/SessionSummaryModal'
import './App.css'
import { RpgDashboard } from './rpg/RpgDashboard'
import { inferStat, statNames } from './rpg/schema'
import type { Stat } from './rpg/schema'
import { Sidebar } from './components/layout/Sidebar'
import { SettingsPage } from './components/settings/SettingsPage'
import {
  applyTheme,
  getStoredTheme,
  getThemeMode,
  toggleThemeMode,
} from './utils/themeEngine'
import type { ThemeSettings } from './utils/themeEngine'
import {
  applyFeatureFlags,
  getFeatureFlags,
  setFeatureFlag,
} from './utils/featureFlags'
import type { FeatureFlagId, FeatureFlagState } from './utils/featureFlags'

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
  const { t } = useTranslation()
  const form = useFormik({
    initialValues: { value: initial },
    validate: (v) =>
      !v.value.trim()
        ? { value: t('validation.pleaseAdd') }
        : v.value.trim().length > max
          ? { value: t('validation.characterLimit', { max }) }
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
        {t('common.save')} <Check size={16} />
      </button>
    </form>
  )
}
function App() {
  const { t, i18n } = useTranslation()
  const { data, setData, error, blocked, resumeSaving } = useCoach()
  const [today, setToday] = useState(dayKey)
  const [modal, setModal] = useState<
    'habit' | 'plan' | 'affirmation' | 'history' | null
  >(null)
  const [editPlan, setEditPlan] = useState<string | null>(null)
  const [viewSession, setViewSession] = useState<Session | null>(null)
  const [active, setActive] = useState('overview')
  // Theme + flags live in the DOM/localStorage, not in the React tree, so a
  // palette change repaints without re-rendering the page.
  const [themeSettings, setThemeSettings] =
    useState<ThemeSettings>(getStoredTheme)
  const [flags, setFlags] = useState<FeatureFlagState>(getFeatureFlags)
  // Settings is a page of its own, not a section of the dashboard.
  const [view, setView] = useState<'dashboard' | 'settings'>('dashboard')
  const scrollTarget = useRef<string | null>(null)
  useEffect(() => {
    // Update the HTML lang attribute when language changes
    document.documentElement.lang = i18n.language
  }, [i18n.language])
  useEffect(() => {
    document.title = t('meta.title')
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', t('meta.description'))
  }, [t, i18n.language])
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
    applyTheme(themeSettings)
  }, [themeSettings])
  useEffect(() => {
    applyFeatureFlags(flags)
  }, [flags])
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
      label: date.toLocaleDateString(i18n.language, { weekday: 'narrow' }),
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
  const changeTheme = (next: ThemeSettings) => setThemeSettings(next)
  const changeFlag = (id: FeatureFlagId, value: boolean) =>
    setFlags(setFeatureFlag(id, value))
  const mode = getThemeMode(themeSettings.themeId)
  const jump = (target: string) => {
    setActive(target)
    if (target === 'settings') {
      setView('settings')
      window.scrollTo({ top: 0 })
      return
    }
    scrollTarget.current = target
    setView('dashboard')
  }
  // Scrolling waits for the dashboard to be mounted again, otherwise the
  // section is not in the document yet when we look for it.
  useEffect(() => {
    const target = scrollTarget.current
    if (view !== 'dashboard' || !target) return
    scrollTarget.current = null
    document.getElementById(target)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    })
  }, [view, active])
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="app-shell"
        data-palette={data.rpg.palette}
        lang={i18n.language}
      >
        <a className="skip-link" href="#overview">
          {t('common.skipToDashboard')}
        </a>
        <Sidebar active={active} onNavigate={jump} flags={flags} />
        <main id="overview">
          <header className="topbar">
            <span>
              <span className="tiny-dot" /> {t('topbar.dailyReminder')}
            </span>
            <div className="topbar-actions">
              <button
                className="theme-toggle"
                type="button"
                aria-label={
                  mode === 'dark'
                    ? t('topbar.switchToLight')
                    : t('topbar.switchToDark')
                }
                aria-pressed={mode === 'dark'}
                onClick={() => changeTheme(toggleThemeMode(themeSettings))}
              >
                {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>
                  {mode === 'dark'
                    ? t('topbar.themeLight')
                    : t('topbar.themeDark')}
                </span>
              </button>
              <button className="quiet-button" onClick={() => exportData()}>
                <ArrowDownToLine size={16} /> {t('topbar.export')}
              </button>
            </div>
          </header>
          {view === 'settings' ? (
            <SettingsPage
              settings={themeSettings}
              onSettingsChange={changeTheme}
              flags={flags}
              onFlagChange={changeFlag}
            />
          ) : (
            <div className="page-content">
              <div className="welcome">
                <div>
                  <div className="eyebrow">
                    {new Date(`${today}T12:00:00`).toLocaleDateString(
                      i18n.language,
                      {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      },
                    )}
                  </div>
                  <h1
                    dangerouslySetInnerHTML={{
                      __html: t('welcome.title'),
                    }}
                  />
                  <p>{t('welcome.message')}</p>
                </div>
                <div className="private-badge">
                  <span className="tiny-dot" /> {t('welcome.justForYou')}
                </div>
              </div>
              {error && (
                <div className="storage-error" role="alert">
                  <strong>{t('common.savingNeeds')}</strong>
                  <p>{error}</p>
                  {blocked && (
                    <>
                      <button onClick={() => exportData(true)}>
                        {t('common.exportOriginal')}
                      </button>
                      <button onClick={resumeSaving}>
                        {t('common.useFresh')}
                      </button>
                    </>
                  )}
                </div>
              )}
              {flags.rpgDashboard && (
                <RpgDashboard
                  data={data}
                  setData={setData}
                  onReflect={() => jump('journal')}
                />
              )}
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
                    <span>{t('habits.nurturedToday')}</span>
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
                    <span>{t('plans.followedThrough')}</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon mint">
                    <BookOpen size={21} />
                  </span>
                  <div>
                    <strong>{data.sessions.length}</strong>
                    <span>{t('journal.momentsOfReflection')}</span>
                  </div>
                </div>
              </div>
              <div className="dashboard-grid">
                <div className="left-column">
                  {flags.habitTracker && (
                    <section className="card" id="habits">
                      <div className="card-heading">
                        <div className="section-title">
                          <span className="icon-tile purple">
                            <ListChecks size={19} />
                          </span>
                          <div>
                            <h2>{t('habits.title')}</h2>
                            <p>{t('habits.subtitle')}</p>
                          </div>
                        </div>
                        <button
                          className="icon-button"
                          aria-label={t('habits.addHabitAria')}
                          onClick={() => setModal('habit')}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <div className="progress-label">
                        <span>{t('habits.progress')}</span>
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
                                  {h.detail || t('habits.habitDetailDefault')}
                                </small>
                              </span>
                              <span className="habit-spark">
                                {h.dates.includes(today) ? '✦' : '＋'}
                              </span>
                            </button>
                            <label className="habit-stat-select">
                              {t('habits.statPoints')}
                              <select
                                aria-label={t('habits.statFor', {
                                  title: h.title,
                                })}
                                value={h.stat}
                                onChange={(e) => {
                                  const stat = e.target.value as Stat
                                  setData((d) => ({
                                    ...d,
                                    habits: d.habits.map((item) =>
                                      item.id === h.id
                                        ? { ...item, stat }
                                        : item,
                                    ),
                                  }))
                                }}
                              >
                                {(Object.keys(statNames) as Stat[]).map(
                                  (stat) => (
                                    <option key={stat} value={stat}>
                                      {t(
                                        `habits.stat${stat.charAt(0).toUpperCase() + stat.slice(1)}`,
                                      )}
                                    </option>
                                  ),
                                )}
                              </select>
                              <small>{t('habits.expGain')}</small>
                            </label>
                          </div>
                        ))}
                      </div>
                      <button
                        className="add-line"
                        onClick={() => setModal('habit')}
                      >
                        <Plus size={16} /> {t('habits.addHabit')}
                      </button>
                      <div className="week-strip">
                        <span>{t('habits.lastWeek')}</span>
                        <div>
                          {lastWeek.map((d) => (
                            <div
                              key={d.key}
                              title={t('habits.weekTooltip', {
                                day: d.key,
                                count: d.count,
                              })}
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
                  )}
                  {flags.intentions && (
                    <section className="card" id="planning">
                      <div className="card-heading">
                        <div className="section-title">
                          <span className="icon-tile orange">
                            <Sun size={19} />
                          </span>
                          <div>
                            <h2>{t('plans.title')}</h2>
                            <p>{t('plans.subtitle')}</p>
                          </div>
                        </div>
                        <button
                          className="icon-button"
                          aria-label={t('plans.addIntentionAria')}
                          onClick={() => setModal('plan')}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      {plans.length === 0 ? (
                        <div className="empty-plans">
                          <Sun size={26} />
                          <p>{t('plans.empty')}</p>
                          <small>{t('plans.emptySub')}</small>
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
                                aria-label={t('plans.editAria', {
                                  title: p.title,
                                })}
                                onClick={() => setEditPlan(p.id)}
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        className="add-line"
                        onClick={() => setModal('plan')}
                      >
                        <Plus size={16} /> {t('plans.setIntention')}
                      </button>
                    </section>
                  )}
                </div>
                <div className="right-column">
                  {flags.chatJournal && (
                    <ChatJournalContainer data={data} setData={setData} />
                  )}
                  <section className="affirmation">
                    <div className="card-heading">
                      <span className="eyebrow">
                        <Quote size={15} /> {t('affirmation.title')}
                      </span>
                      <button
                        className="icon-button"
                        aria-label={t('affirmation.edit')}
                        onClick={() => setModal('affirmation')}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    <blockquote>“{data.affirmation}”</blockquote>
                    <div>
                      <span>{t('affirmation.subtitle')}</span>
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
                  <strong>{t('history.story')}</strong>
                  <small>{t('history.revisit')}</small>
                </span>
                <span className="history-count">
                  {t('journal.reflectionsCount', {
                    count: data.sessions.length,
                  })}
                </span>
                <ChevronRight size={19} />
              </button>
              <footer>
                <span>
                  <Leaf size={14} /> {t('sidebar.footer')}
                </span>
                <span>
                  {t('common.savedInBrowser')} ·{' '}
                  <button onClick={() => exportData()}>
                    {t('common.keepBackup')}
                  </button>
                </span>
              </footer>
            </div>
          )}
        </main>
      </div>
      {modal === 'habit' && (
        <Modal title={t('modal.habitTitle')} onClose={() => setModal(null)}>
          <TextForm
            label={t('modal.habitQuestion')}
            onSave={(title) => {
              setData((d) => ({
                ...d,
                habits: [
                  ...d.habits,
                  {
                    id: id(),
                    title,
                    detail: '',
                    dates: [],
                    stat: inferStat(title),
                  },
                ],
              }))
              setModal(null)
            }}
          />
        </Modal>
      )}
      {modal === 'plan' && (
        <Modal title={t('modal.planTitle')} onClose={() => setModal(null)}>
          <TextForm
            label={t('modal.planQuestion')}
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
        <Modal
          title={t('modal.editPlanTitle')}
          onClose={() => setEditPlan(null)}
        >
          <TextForm
            label={t('modal.editPlanLabel')}
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
        <Modal
          title={t('affirmation.modalTitle')}
          onClose={() => setModal(null)}
        >
          <TextForm
            label={t('affirmation.label')}
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
          title={t('modal.historyTitle')}
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
                <X size={14} /> {t('journal.backToReflections')}
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
                  {new Date(s.metadata.date).toLocaleDateString(i18n.language, {
                    dateStyle: 'medium',
                  })}
                </strong>
                <span>
                  {s.messages.find(
                    (m) => m.sender === 'user' && m.category === 'win',
                  )?.text ?? t('journal.savedFallback')}
                </span>
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <p className="empty-message">{t('journal.emptyHistory')}</p>
          )}
        </Modal>
      )}
    </MotionConfig>
  )
}
export default App

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
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
  Settings,
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
import { JournalContainer } from './components/daybook/JournalContainer'
import { SummaryContent } from './components/journal/SessionSummaryModal'
import { DashboardWelcome } from './components/DashboardWelcome'
import { LanguageSelector } from './components/LanguageSelector'
import './App.css'
import { RpgDashboard } from './rpg/RpgDashboard'
import { inferStat, statNames } from './rpg/schema'
import type { Stat } from './rpg/schema'
import { SettingsPage, useAppSettings } from './SettingsPage'

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
  const { t } = useTranslation(undefined, { i18n })
  const form = useFormik({
    initialValues: { value: initial },
    validate: (v) =>
      !v.value.trim()
        ? { value: t('forms.required') }
        : v.value.trim().length > max
          ? { value: t('forms.maxLength', { max }) }
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
        {t('ui.save')} <Check size={16} />
      </button>
    </form>
  )
}
function App() {
  const { t } = useTranslation(undefined, { i18n })
  const { data, setData, error, blocked, resumeSaving } = useCoach()
  const [settings, setSettings] = useAppSettings()
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
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en'
    document.title = t('ui.documentTitle')
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', t('ui.metaDescription'))
  }, [t])
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
      label: date.toLocaleDateString(i18n.resolvedLanguage ?? 'en', { weekday: 'narrow' }),
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
    const destination =
      document.getElementById(target) ??
      document.getElementById(target === 'journal' ? 'chat-journal' : target)
    destination?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    })
  }
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="app-shell"
        data-palette={data.rpg.palette}
        data-theme={theme}
      >
        <a className="skip-link" href="#overview">
          {t('ui.skipToDashboard')}
        </a>
        <aside className="sidebar">
          <a className="brand" href="#overview">
            <span className="brand-icon">
              <Flower2 size={27} />
            </span>
            <span>
              bloom<span className="brand-dot">.</span>
              <small>{t('ui.everydaySpace')}</small>
            </span>
          </a>
          <div className="nav-caption">{t('navigation.space')}</div>
          <nav aria-label={t('navigation.main')}>
            {[
              {
                key: 'overview',
                title: t('navigation.dashboard'),
                Icon: LayoutDashboard,
              },
              ...(settings.features.habitTracker
                ? [
                    {
                      key: 'habits',
                      title: t('navigation.habits'),
                      Icon: ListChecks,
                    },
                  ]
                : []),
              ...(settings.features.chatJournal
                ? [
                    {
                      key: 'journal',
                      title: t('navigation.journal'),
                      Icon: BookOpen,
                    },
                  ]
                : []),
              ...(settings.features.daybookModes
                ? [{ key: 'daybook', title: t('ui.daybookNav'), Icon: Pencil }]
                : []),
              { key: 'planning', title: t('navigation.intentions'), Icon: Sun },
              { key: 'settings', title: t('dashboard.settings'), Icon: Settings },
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
            <h3>{t('ui.growAtYourOwnPace')}</h3>
            <p>{t('ui.progressMessage')}</p>
            <span>{t('ui.oneSmallStep')} ✧</span>
          </div>
          <div className="sidebar-bottom">
            <span className="avatar">Y</span>
            <div>
              <strong>{t('ui.personalSpace')}</strong>
              <small>{t('ui.noAccount')}</small>
            </div>
            <Heart size={16} />
          </div>
        </aside>
        <main id="overview">
          <header className="topbar">
            <span>
              <span className="tiny-dot" /> {t('welcome.eyebrow')}
            </span>
            <div className="topbar-actions">
              {settings.features.languageSelector && <LanguageSelector />}
              <button
                className="theme-toggle"
                type="button"
                aria-label={
                  theme === 'dark'
                    ? t('ui.switchToLight')
                    : t('ui.switchToDark')
                }
                aria-pressed={theme === 'dark'}
                onClick={() =>
                  setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
                }
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>
                  {theme === 'dark'
                    ? t('actions.lightMode')
                    : t('actions.darkMode')}
                </span>
              </button>
              <button className="quiet-button" onClick={() => exportData()}>
                <ArrowDownToLine size={16} /> {t('actions.exportData')}
              </button>
            </div>
          </header>
          <div className="page-content">
            {active === 'settings' ? (
              <SettingsPage settings={settings} setSettings={setSettings} />
            ) : (
              <>
                <DashboardWelcome
                  date={new Date(`${today}T12:00:00`).toLocaleDateString(
                    i18n.resolvedLanguage ?? 'en',
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    },
                  )}
                />
                {error && (
                  <div className="storage-error" role="alert">
                    <strong>{t('ui.savingAttention')}</strong>
                    <p>{error}</p>
                    {blocked && (
                      <>
                        <button onClick={() => exportData(true)}>
                          {t('ui.exportOriginal')}
                        </button>
                        <button onClick={resumeSaving}>
                          {t('ui.useFreshData')}
                        </button>
                      </>
                    )}
                  </div>
                )}
                {settings.features.rpgSkillTree && (
                  <RpgDashboard
                    data={data}
                    setData={setData}
                    onReflect={() => jump('journal')}
                    showWeeklyRaid={settings.features.weeklyRaidBoss}
                    showWalkthroughTour={settings.features.walkthroughTour}
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
                      <span>{t('ui.habitsToday')}</span>
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
                      <span>{t('ui.intentionsToday')}</span>
                    </div>
                  </div>
                  <div>
                    <span className="stat-icon mint">
                      <BookOpen size={21} />
                    </span>
                    <div>
                      <strong>{data.sessions.length}</strong>
                      <span>{t('ui.reflections')}</span>
                    </div>
                  </div>
                </div>
                <div className="dashboard-grid">
                  <div className="left-column">
                    {settings.features.habitTracker && (
                      <section className="card" id="habits">
                        <div className="card-heading">
                          <div className="section-title">
                            <span className="icon-tile purple">
                              <ListChecks size={19} />
                            </span>
                            <div>
                              <h2>{t('dashboard.quests')}</h2>
                              <p>{t('ui.habitsSubtitle')}</p>
                            </div>
                          </div>
                          <button
                            className="icon-button"
                            aria-label={t('ui.addHabit')}
                            onClick={() => setModal('habit')}
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                        <div className="progress-label">
                          <span>{t('ui.todaysProgress')}</span>
                          <strong>{progress}%</strong>
                        </div>
                        <div className="progress-track">
                          <motion.div
                            initial={false}
                            animate={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="habit-list" id="habit-grid">
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
                                    {h.detail || t('ui.habitDetailDefault')}
                                  </small>
                                </span>
                                <span className="habit-spark">
                                  {h.dates.includes(today) ? '✦' : '＋'}
                                </span>
                              </button>
                              <label className="habit-stat-select">
                                +5
                                <select
                                  aria-label={t('ui.statFor', { title: h.title })}
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
                                        {statNames[stat]}
                                      </option>
                                    ),
                                  )}
                                </select>
                                <small>{t('ui.comboExp')}</small>
                              </label>
                            </div>
                          ))}
                        </div>
                        <button
                          className="add-line"
                          onClick={() => setModal('habit')}
                        >
                          <Plus size={16} /> {t('ui.addSmallHabit')}
                        </button>
                        <div className="week-strip">
                          <span>{t('ui.lastSevenDays')}</span>
                          <div>
                            {lastWeek.map((d) => (
                              <div
                                key={d.key}
                                title={`${d.key}: ${t('ui.habitsCompleted', { count: d.count })}`}
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
                    <section className="card" id="planning">
                      <div className="card-heading">
                        <div className="section-title">
                          <span className="icon-tile orange">
                            <Sun size={19} />
                          </span>
                          <div>
                            <h2>{t('ui.intentionHeading')}</h2>
                            <p>{t('ui.intentionDescription')}</p>
                          </div>
                        </div>
                        <button
                          className="icon-button"
                          aria-label={t('ui.addIntention')}
                          onClick={() => setModal('plan')}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      {plans.length === 0 ? (
                        <div className="empty-plans">
                          <Sun size={26} />
                          <p>{t('ui.freshPage')}</p>
                          <small>{t('ui.chooseMeaningful')}</small>
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
                                aria-label={t('ui.edit', { title: p.title })}
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
                        <Plus size={16} /> {t('ui.setIntention')}
                      </button>
                    </section>
                  </div>
                  <div className="right-column">
                    {settings.features.chatJournal && (
                      <ChatJournalContainer data={data} setData={setData} />
                    )}
                    {settings.features.daybookModes && <JournalContainer />}
                    <section className="affirmation">
                      <div className="card-heading">
                        <span className="eyebrow">
                          <Quote size={15} /> {t('ui.wordsToGrowWith')}
                        </span>
                        <button
                          className="icon-button"
                          aria-label={t('ui.editAffirmation')}
                          onClick={() => setModal('affirmation')}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                      <blockquote>“{data.affirmation}”</blockquote>
                      <div>
                        <span>{t('ui.reminder')}</span>
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
                    <strong>{t('ui.storyUnfolding')}</strong>
                    <small>{t('ui.revisit')}</small>
                  </span>
                  <span className="history-count">
                    {t('ui.reflectionCount', { count: data.sessions.length })}
                  </span>
                  <ChevronRight size={19} />
                </button>
                <footer>
                  <span>
                    <Leaf size={14} /> {t('ui.madeForGrowth')}
                  </span>
                  <span>
                    {t('ui.savedBrowser')} ·{' '}
                    <button onClick={() => exportData()}>
                      {t('ui.keepBackup')}
                    </button>
                  </span>
                </footer>
              </>
            )}
          </div>
        </main>
      </div>
      {modal === 'habit' && (
        <Modal title={t('ui.plantHabit')} onClose={() => setModal(null)}>
          <TextForm
            label={t('ui.practiceQuestion')}
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
        <Modal title={t('ui.makeRoom')} onClose={() => setModal(null)}>
          <TextForm
            label={t('ui.oneIntention')}
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
        <Modal title={t('ui.editIntention')} onClose={() => setEditPlan(null)}>
          <TextForm
            label={t('ui.yourIntention')}
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
        <Modal title={t('ui.wordsLikeYou')} onClose={() => setModal(null)}>
          <TextForm
            label={t('ui.personalAffirmation')}
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
          title={t('ui.reflectionJournal')}
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
                <X size={14} /> {t('ui.backToReflections')}
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
                  {new Date(s.metadata.date).toLocaleDateString(i18n.resolvedLanguage ?? 'en', {
                    dateStyle: 'medium',
                  })}
                </strong>
                <span>
                  {s.messages.find(
                    (m) => m.sender === 'user' && m.category === 'win',
                  )?.text ?? t('ui.momentForYou')}
                </span>
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <p className="empty-message">{t('ui.storyStarts')}</p>
          )}
        </Modal>
      )}
    </MotionConfig>
  )
}
export default App
